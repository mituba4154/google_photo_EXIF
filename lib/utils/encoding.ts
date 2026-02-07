import * as fs from 'node:fs/promises';

/** Windows のパス区切り文字を正規化 */
export function ensureUtf8Path(filePath: string): string {
  if (process.platform === 'win32') {
    return filePath.replace(/\\/g, '/');
  }
  return filePath;
}

/** BOM付きUTF-8対応のJSON読み取り */
export async function safeReadJson(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

/** EXIF仕様の制御文字を除去 */
export function sanitizeForExif(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}
