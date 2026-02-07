import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { matchJsonToImages } from '@/lib/core/matcher';

const TEST_DIR = path.join(__dirname, '..', 'test-data-matcher');

/** テスト用ファイルを作成する */
async function createFile(filePath: string, content = '') {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

function makeJson(title: string): string {
  return JSON.stringify({
    title,
    photoTakenTime: { timestamp: '1672531200', formatted: '2023-01-01' },
  });
}

describe('matchJsonToImages', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test('Exact match: image.jpg ↔ image.jpg.json', async () => {
    const imgPath = path.join(TEST_DIR, 'exact', 'image.jpg');
    const jsonPath = path.join(TEST_DIR, 'exact', 'image.jpg.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('image.jpg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
    expect(result.unmatched.images.length).toBe(0);
    expect(result.unmatched.jsons.length).toBe(0);
  });

  test('Extension match: image.jpg ↔ image.json', async () => {
    const imgPath = path.join(TEST_DIR, 'ext', 'photo.jpg');
    const jsonPath = path.join(TEST_DIR, 'ext', 'photo.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('photo.jpg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
  });

  test('日本語ファイル名対応', async () => {
    const imgPath = path.join(TEST_DIR, 'jp', '写真_2023年_夏休み.jpg');
    const jsonPath = path.join(TEST_DIR, 'jp', '写真_2023年_夏休み.jpg.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('写真_2023年_夏休み.jpg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
  });

  test('46文字トリミング対応', async () => {
    const longName = 'very_long_filename_that_exceeds_46_chars_limit';
    const imgPath = path.join(TEST_DIR, 'trunc', `${longName}xx.jpg`);
    const jsonPath = path.join(TEST_DIR, 'trunc', `${longName}.jpg.json`);
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson(`${longName}xx.jpg`));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('fuzzy');
  });

  test('Invalid JSON files do not break matching of other files', async () => {
    const imgPath1 = path.join(TEST_DIR, 'json-error', 'image1.jpg');
    const jsonPath1 = path.join(TEST_DIR, 'json-error', 'image1.jpg.json');
    const imgPath2 = path.join(TEST_DIR, 'json-error', 'image2.jpg');
    const jsonPath2 = path.join(TEST_DIR, 'json-error', 'image2.jpg.json');
    await createFile(imgPath1, 'fake-image');
    // Invalid JSON content
    await createFile(jsonPath1, '{ broken json !!!');
    await createFile(imgPath2, 'fake-image');
    await createFile(jsonPath2, makeJson('image2.jpg'));

    const result = await matchJsonToImages([imgPath1, imgPath2], [jsonPath1, jsonPath2]);
    // Both should still be matched (invalid JSON results in null metadata)
    expect(result.matched.length).toBe(2);
    // The valid JSON should have metadata
    const match2 = result.matched.find((m) => m.imagePath === imgPath2);
    expect(match2?.metadata).not.toBeNull();
    // The invalid JSON should have null metadata
    const match1 = result.matched.find((m) => m.imagePath === imgPath1);
    expect(match1?.metadata).toBeNull();
  });

  test('Unmatched files are reported', async () => {
    const imgPath = path.join(TEST_DIR, 'unmatched', 'lonely.jpg');
    const jsonPath = path.join(TEST_DIR, 'unmatched', 'other.jpg.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('other.jpg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(0);
    expect(result.unmatched.images.length).toBe(1);
    expect(result.unmatched.jsons.length).toBe(1);
  });

  test('Supplemental metadata exact match: IMG_0002.HEIC ↔ IMG_0002.HEIC.supplemental-metadata.json', async () => {
    const imgPath = path.join(TEST_DIR, 'supplemental', 'IMG_0002.HEIC');
    const jsonPath = path.join(TEST_DIR, 'supplemental', 'IMG_0002.HEIC.supplemental-metadata.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('IMG_0002.HEIC'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
    expect(result.matched[0].imagePath).toBe(imgPath);
    expect(result.matched[0].jsonPath).toBe(jsonPath);
    expect(result.unmatched.images.length).toBe(0);
    expect(result.unmatched.jsons.length).toBe(0);
  });

  test('Supplemental metadata extension match: IMG_0003.PNG ↔ IMG_0003.supplemental-metadata.json', async () => {
    const imgPath = path.join(TEST_DIR, 'supplemental-ext', 'IMG_0003.PNG');
    const jsonPath = path.join(TEST_DIR, 'supplemental-ext', 'IMG_0003.supplemental-metadata.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('IMG_0003.PNG'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
    expect(result.matched[0].imagePath).toBe(imgPath);
    expect(result.matched[0].jsonPath).toBe(jsonPath);
  });

  test('Mixed standard and supplemental metadata files', async () => {
    const img1 = path.join(TEST_DIR, 'mixed', 'photo1.jpg');
    const json1 = path.join(TEST_DIR, 'mixed', 'photo1.jpg.json');
    const img2 = path.join(TEST_DIR, 'mixed', 'IMG_0004.HEIC');
    const json2 = path.join(TEST_DIR, 'mixed', 'IMG_0004.HEIC.supplemental-metadata.json');

    await createFile(img1, 'fake-image-1');
    await createFile(json1, makeJson('photo1.jpg'));
    await createFile(img2, 'fake-image-2');
    await createFile(json2, makeJson('IMG_0004.HEIC'));

    const result = await matchJsonToImages([img1, img2], [json1, json2]);
    expect(result.matched.length).toBe(2);
    expect(result.unmatched.images.length).toBe(0);
    expect(result.unmatched.jsons.length).toBe(0);
  });

  test('Shortened supplemental: .suppl.json', async () => {
    const imgPath = path.join(TEST_DIR, 'suppl', 'photo.png');
    const jsonPath = path.join(TEST_DIR, 'suppl', 'photo.png.suppl.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('photo.png'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
    expect(result.unmatched.images.length).toBe(0);
    expect(result.unmatched.jsons.length).toBe(0);
  });

  test('Shortened supplemental: .supplemental-meta.json', async () => {
    const imgPath = path.join(TEST_DIR, 'supp-meta', 'video.mp4');
    const jsonPath = path.join(TEST_DIR, 'supp-meta', 'video.mp4.supplemental-meta.json');
    await createFile(imgPath, 'fake-video');
    await createFile(jsonPath, makeJson('video.mp4'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
  });

  test('Shortened supplemental: .su.json', async () => {
    const imgPath = path.join(TEST_DIR, 'su', 'screenshot.jpg');
    const jsonPath = path.join(TEST_DIR, 'su', 'screenshot.jpg.su.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('screenshot.jpg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
  });

  test('Double dot: image.jpeg..json', async () => {
    const imgPath = path.join(TEST_DIR, 'ddot', 'IMG_001.jpeg');
    const jsonPath = path.join(TEST_DIR, 'ddot', 'IMG_001.jpeg..json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('IMG_001.jpeg'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
  });

  test('Space+number pattern: supplemental-metadata{N}.json', async () => {
    const imgPath = path.join(TEST_DIR, 'spacenum', 'IMG3174 1.JPG');
    const jsonPath = path.join(TEST_DIR, 'spacenum', 'IMG3174 .JPG.supplemental-metadata1.json');
    await createFile(imgPath, 'fake-image');
    await createFile(jsonPath, makeJson('IMG3174 1.JPG'));

    const result = await matchJsonToImages([imgPath], [jsonPath]);
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].matchConfidence).toBe('exact');
  });

  test('Shortened supplemental: .supplemental-met.json and .supplemental.json', async () => {
    const img1 = path.join(TEST_DIR, 'supp-short', 'quote_1.png');
    const json1 = path.join(TEST_DIR, 'supp-short', 'quote_1.png.supplemental-met.json');
    const img2 = path.join(TEST_DIR, 'supp-short', 'minecraft.jpg');
    const json2 = path.join(TEST_DIR, 'supp-short', 'minecraft.jpg.supplemental.json');
    await createFile(img1, 'fake-image-1');
    await createFile(json1, makeJson('quote_1.png'));
    await createFile(img2, 'fake-image-2');
    await createFile(json2, makeJson('minecraft.jpg'));

    const result = await matchJsonToImages([img1, img2], [json1, json2]);
    expect(result.matched.length).toBe(2);
    expect(result.unmatched.images.length).toBe(0);
    expect(result.unmatched.jsons.length).toBe(0);
  });
});
