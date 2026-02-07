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
});
