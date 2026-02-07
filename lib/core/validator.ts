import { TakeoutJsonSchema, type TakeoutJson } from '@/lib/schemas/takeout-json';
import { safeReadJson } from '@/lib/utils/encoding';
import { logger } from '@/lib/utils/logger';

/** JSON ファイルを読み取り Zod で検証する */
export async function parseAndValidateJson(
  jsonPath: string
): Promise<TakeoutJson | null> {
  try {
    const content = await safeReadJson(jsonPath);
    const parsed: unknown = JSON.parse(content);
    return TakeoutJsonSchema.parse(parsed);
  } catch (error) {
    logger.warn(`Invalid JSON: ${jsonPath}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
