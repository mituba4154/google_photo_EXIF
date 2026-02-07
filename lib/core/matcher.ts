import * as path from 'node:path';
import type { FileMatch, MatchResult } from '@/lib/types/processing';
import { parseAndValidateJson } from '@/lib/core/validator';
import { logger } from '@/lib/utils/logger';

/**
 * JSON と画像ファイルをマッチングする。
 *
 * 戦略 (優先度順):
 *  1. Exact Match   – image.jpg ↔ image.jpg.json
 *  2. Extension Match – image.jpg ↔ image.json
 *  3. Fuzzy Match    – 46文字トリミング、(1) / -edited 等サフィックス除去
 */
export async function matchJsonToImages(
  images: string[],
  jsons: string[]
): Promise<MatchResult> {
  const matched: FileMatch[] = [];
  const unmatchedImages = new Set(images);
  const unmatchedJsons = new Set(jsons);

  // Pre-load all JSON metadata in parallel for better performance
  const jsonMetadataCache = new Map<string, Awaited<ReturnType<typeof parseAndValidateJson>>>();
  const jsonParsePromises = jsons.map(async (json) => {
    try {
      const metadata = await parseAndValidateJson(json);
      jsonMetadataCache.set(json, metadata);
    } catch (error) {
      logger.warn('Failed to parse JSON', { path: json, error });
      jsonMetadataCache.set(json, null);
    }
  });
  await Promise.all(jsonParsePromises);

  // --- Strategy 1: Exact match (image.jpg ↔ image.jpg.json or image.jpg.supplemental-metadata.json) ---
  for (const json of jsons) {
    // Try standard .json format first
    let expectedImage = json.replace(/\.json$/, '');
    if (unmatchedImages.has(expectedImage)) {
      const metadata = jsonMetadataCache.get(json) ?? null;
      matched.push({
        imagePath: expectedImage,
        jsonPath: json,
        matchConfidence: 'exact',
        metadata,
      });
      unmatchedImages.delete(expectedImage);
      unmatchedJsons.delete(json);
    } else {
      // Try .supplemental-metadata.json format
      expectedImage = json.replace(/\.supplemental-metadata\.json$/, '');
      if (expectedImage !== json && unmatchedImages.has(expectedImage)) {
        const metadata = jsonMetadataCache.get(json) ?? null;
        matched.push({
          imagePath: expectedImage,
          jsonPath: json,
          matchConfidence: 'exact',
          metadata,
        });
        unmatchedImages.delete(expectedImage);
        unmatchedJsons.delete(json);
      }
    }
  }

  // --- Strategy 2: Extension match (image.jpg ↔ image.json or image.supplemental-metadata.json) ---
  for (const json of [...unmatchedJsons]) {
    // First try to remove .supplemental-metadata.json, then fall back to .json
    let jsonBase;
    if (json.endsWith('.supplemental-metadata.json')) {
      jsonBase = json.replace(/\.supplemental-metadata\.json$/, '');
    } else {
      jsonBase = json.replace(/\.json$/, '');
    }

    for (const image of [...unmatchedImages]) {
      const imageWithoutExt = image.replace(/\.[^.]+$/, '');
      if (jsonBase === imageWithoutExt) {
        const metadata = jsonMetadataCache.get(json) ?? null;
        matched.push({
          imagePath: image,
          jsonPath: json,
          matchConfidence: 'exact',
          metadata,
        });
        unmatchedImages.delete(image);
        unmatchedJsons.delete(json);
        break;
      }
    }
  }

  // --- Strategy 3: Fuzzy match ---
  for (const json of [...unmatchedJsons]) {
    // Handle both .json and .supplemental-metadata.json
    let jsonBase = path.basename(json, '.json');
    if (jsonBase === path.basename(json)) {
      // If .json didn't remove anything, try .supplemental-metadata.json
      const baseName = path.basename(json);
      if (baseName.endsWith('.supplemental-metadata.json')) {
        jsonBase = baseName.replace(/\.supplemental-metadata\.json$/, '');
      }
    }
    const normalizedJson = normalizeName(jsonBase);

    let bestMatch: string | null = null;
    for (const image of [...unmatchedImages]) {
      const imageBase = path.basename(image);
      const imageDir = path.dirname(image);
      const jsonDir = path.dirname(json);
      if (imageDir !== jsonDir) continue;

      const normalizedImage = normalizeName(imageBase);
      if (fuzzyEquals(normalizedJson, normalizedImage)) {
        bestMatch = image;
        break;
      }
    }

    if (bestMatch) {
      const metadata = jsonMetadataCache.get(json) ?? null;
      matched.push({
        imagePath: bestMatch,
        jsonPath: json,
        matchConfidence: 'fuzzy',
        metadata,
      });
      unmatchedImages.delete(bestMatch);
      unmatchedJsons.delete(json);
    }
  }

  // Log unmatched files
  for (const img of unmatchedImages) {
    logger.warn('Unmatched image', { path: img });
  }
  for (const json of unmatchedJsons) {
    logger.warn('Unmatched JSON', { path: json });
  }

  return {
    matched,
    unmatched: {
      images: Array.from(unmatchedImages),
      jsons: Array.from(unmatchedJsons),
    },
  };
}

/**
 * ファイル名を正規化する。
 * - 小文字化
 * - (1), -edited, -COLLAGE 等サフィックスの除去
 * - 46 文字超を切り詰め
 */
function normalizeName(name: string): string {
  let n = name.toLowerCase();
  // Remove common suffixes
  n = n.replace(/[-_]?(edited|collage|\(\d+\))$/i, '');
  // 46-char Google Takeout truncation: trim to 46 chars for comparison
  if (n.length > 46) {
    n = n.slice(0, 46);
  }
  return n.trim();
}

/** ファジー比較: 正規化名の先頭部分が一致すれば true */
function fuzzyEquals(a: string, b: string): boolean {
  if (a === b) return true;
  // 片方が 46 文字で切れている場合に対応
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 46 && a.slice(0, 46) === b.slice(0, 46)) return true;
  // Remove file extension for the image side
  const aNoExt = a.replace(/\.[^.]+$/, '');
  const bNoExt = b.replace(/\.[^.]+$/, '');
  if (aNoExt === bNoExt) return true;
  if (aNoExt.length >= 46 && bNoExt.length >= 46 && aNoExt.slice(0, 46) === bNoExt.slice(0, 46)) return true;
  return false;
}
