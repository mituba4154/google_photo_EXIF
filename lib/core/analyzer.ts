import * as path from 'node:path';
import fg from 'fast-glob';
import type { AnalysisResult } from '@/lib/types/processing';
import { matchJsonToImages } from '@/lib/core/matcher';
import { isImageOrVideo } from '@/lib/utils/file-utils';
import { ensureUtf8Path } from '@/lib/utils/encoding';
import { logger } from '@/lib/utils/logger';

/**
 * Takeout フォルダを解析し、画像/JSON の構成情報を返す。
 */
export async function analyzeTakeoutFolder(
  rootPath: string
): Promise<AnalysisResult> {
  const safePath = ensureUtf8Path(rootPath);
  logger.info('Analyzing takeout folder', { rootPath: safePath });

  // 1. ファイルシステム走査
  const files = await fg(
    ['**/*.{jpg,jpeg,png,heic,gif,bmp,tiff,tif,webp,mp4,mov,avi}', '**/*.json'],
    {
      cwd: safePath,
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
    }
  );

  // 2. ファイル分類
  const images = files.filter((f) => isImageOrVideo(f));
  const jsons = files.filter((f) => f.endsWith('.json') || f.endsWith('.supplemental-metadata.json'));

  // 3. フォルダパターン検出
  const yearFolders = detectYearFolders(files);
  const albumFolders = detectAlbumFolders(files);

  // 4. マッチング
  const matches = await matchJsonToImages(images, jsons);

  // 5. 重複検出
  const duplicates = detectDuplicates(images);

  logger.info('Analysis complete', {
    images: images.length,
    jsons: jsons.length,
    matched: matches.matched.length,
  });

  return {
    totalFiles: images.length + jsons.length,
    imageFiles: images.length,
    jsonFiles: jsons.length,
    matchedPairs: matches.matched.length,
    unmatchedImages: matches.unmatched.images.length,
    unmatchedJsons: matches.unmatched.jsons.length,
    duplicates: duplicates.length,
    albumFolders,
    yearFolders,
    estimatedProcessingTime: Math.ceil(matches.matched.length * 0.5),
  };
}

/** "Photos from YYYY" 形式の年別フォルダを検出 */
function detectYearFolders(files: string[]): string[] {
  const pattern = /Photos from \d{4}$|^\d{4}-\d{2}-\d{2}$/;
  return [
    ...new Set(
      files
        .map((f) => path.dirname(f))
        .filter((dir) => pattern.test(path.basename(dir)))
    ),
  ];
}

/** metadata.json を含むアルバムフォルダを検出 */
function detectAlbumFolders(files: string[]): string[] {
  return [
    ...new Set(
      files
        .filter((f) => path.basename(f) === 'metadata.json')
        .map((f) => path.dirname(f))
    ),
  ];
}

/** ファイル名ベースの重複検出（同名ファイルが複数フォルダに存在） */
function detectDuplicates(images: string[]): string[] {
  const byName = new Map<string, string[]>();
  for (const img of images) {
    const name = path.basename(img);
    const existing = byName.get(name);
    if (existing) {
      existing.push(img);
    } else {
      byName.set(name, [img]);
    }
  }
  const dups: string[] = [];
  for (const [, paths] of byName) {
    if (paths.length > 1) {
      dups.push(...paths);
    }
  }
  return dups;
}
