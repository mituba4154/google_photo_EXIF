import * as path from 'node:path';

/** 画像・動画ファイルの拡張子一覧 */
const IMAGE_VIDEO_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.gif',
  '.bmp', '.tiff', '.tif', '.webp',
  '.mp4', '.mov', '.avi', '.mkv',
]);

/** ファイルが画像または動画かを判定 */
export function isImageOrVideo(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_VIDEO_EXTENSIONS.has(ext);
}

/** パストラバーサル対策: ユーザーパスが基準パス内に収まるか検証 */
export function validatePath(userPath: string, basePath: string): boolean {
  const resolved = path.resolve(userPath);
  return resolved.startsWith(path.resolve(basePath));
}
