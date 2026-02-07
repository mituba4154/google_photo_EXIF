import * as fs from 'node:fs/promises';
import { ExifTool } from 'exiftool-vendored';
import type { TakeoutJson } from '@/lib/schemas/takeout-json';
import type { ProcessingOptions } from '@/lib/types/processing';
import { sanitizeForExif } from '@/lib/utils/encoding';
import { logger } from '@/lib/utils/logger';

let exiftool: ExifTool | null = null;

/** ExifTool インスタンスを取得（遅延初期化） */
export function getExifTool(maxProcs = 4): ExifTool {
  if (!exiftool) {
    exiftool = new ExifTool({ maxProcs, taskTimeoutMillis: 30000 });
  }
  return exiftool;
}

/** ExifTool プロセスを終了する */
export async function closeExifTool(): Promise<void> {
  if (exiftool) {
    await exiftool.end();
    exiftool = null;
  }
}

/** Unix タイムスタンプを EXIF 日時形式に変換 */
export function unixToExifDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\.\d+Z$/, '')
    .replace(/-/g, ':');
}

/**
 * JSON メタデータを画像の EXIF/XMP に書き込む。
 */
export async function writeExifFromJson(
  imagePath: string,
  metadata: TakeoutJson,
  options: ProcessingOptions
): Promise<void> {
  const et = getExifTool(options.maxConcurrency);

  // 1. バックアップ作成
  if (options.backupOriginals) {
    await fs.copyFile(imagePath, `${imagePath}.backup`);
  }

  // 2. 既存EXIF読み取り
  const existingTags = await et.read(imagePath);

  // 3. 上書き判定
  if (!options.overwriteExisting && existingTags.DateTimeOriginal) {
    logger.info('Skipping: DateTimeOriginal already exists', {
      path: imagePath,
    });
    throw new Error('DateTimeOriginal already exists');
  }

  // 4. タグ構築
  const tags: Record<string, unknown> = {};

  // 日時変換
  if (metadata.photoTakenTime) {
    const dt = unixToExifDate(parseInt(metadata.photoTakenTime.timestamp, 10));
    tags.DateTimeOriginal = dt;
    tags.CreateDate = dt;
  }

  // 位置情報
  const geoSource = options.useGeoDataExif
    ? metadata.geoDataExif || metadata.geoData
    : metadata.geoData || metadata.geoDataExif;

  if (geoSource && (geoSource.latitude !== 0 || geoSource.longitude !== 0)) {
    tags.GPSLatitude = geoSource.latitude;
    tags.GPSLongitude = geoSource.longitude;
    if (geoSource.altitude !== undefined) {
      tags.GPSAltitude = geoSource.altitude;
    }
  }

  // 説明文
  if (metadata.description) {
    const safeDesc = sanitizeForExif(metadata.description);
    tags.ImageDescription = safeDesc;
    tags['XMP:Description'] = safeDesc;
  }

  // 人物タグ
  if (options.writePeopleToKeywords && metadata.people.length > 0) {
    const names = metadata.people.map((p) => p.name);
    tags['XMP:Subject'] = names;
    tags['IPTC:Keywords'] = names;
  }

  // お気に入り
  if (metadata.favorited) {
    tags['XMP:Rating'] = 5;
  }

  // タイトル
  if (metadata.title) {
    tags['XMP:Title'] = sanitizeForExif(metadata.title);
  }

  // 5. 書き込み実行
  await et.write(imagePath, tags, ['-overwrite_original']);

  // 6. ファイルタイムスタンプ復元
  if (options.preserveFileTimestamps && options.backupOriginals) {
    const stats = await fs.stat(`${imagePath}.backup`);
    await fs.utimes(imagePath, stats.atime, stats.mtime);
  }

  logger.info('EXIF written', { path: imagePath });
}
