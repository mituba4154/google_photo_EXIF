import { describe, test, expect } from 'vitest';
import { unixToExifDate } from '@/lib/core/exif-writer';
import { sanitizeForExif, ensureUtf8Path } from '@/lib/utils/encoding';
import { isImageOrVideo, validatePath } from '@/lib/utils/file-utils';

describe('unixToExifDate', () => {
  test('converts Unix timestamp to EXIF format', () => {
    // 2023-01-01 00:00:00 UTC
    const result = unixToExifDate(1672531200);
    expect(result).toBe('2023:01:01 00:00:00');
  });

  test('handles epoch zero', () => {
    const result = unixToExifDate(0);
    expect(result).toBe('1970:01:01 00:00:00');
  });
});

describe('sanitizeForExif', () => {
  test('removes control characters', () => {
    expect(sanitizeForExif('hello\x00world')).toBe('helloworld');
    expect(sanitizeForExif('\x01\x02abc\x7F')).toBe('abc');
  });

  test('preserves normal text', () => {
    expect(sanitizeForExif('Hello World')).toBe('Hello World');
  });

  test('preserves Japanese text', () => {
    expect(sanitizeForExif('写真の説明')).toBe('写真の説明');
  });

  test('trims whitespace', () => {
    expect(sanitizeForExif('  hello  ')).toBe('hello');
  });
});

describe('ensureUtf8Path', () => {
  test('returns path unchanged on non-Windows', () => {
    if (process.platform !== 'win32') {
      expect(ensureUtf8Path('/path/to/file')).toBe('/path/to/file');
    }
  });
});

describe('isImageOrVideo', () => {
  test('recognizes image extensions', () => {
    expect(isImageOrVideo('photo.jpg')).toBe(true);
    expect(isImageOrVideo('photo.JPEG')).toBe(true);
    expect(isImageOrVideo('photo.png')).toBe(true);
    expect(isImageOrVideo('photo.heic')).toBe(true);
    expect(isImageOrVideo('photo.gif')).toBe(true);
    expect(isImageOrVideo('photo.webp')).toBe(true);
  });

  test('recognizes video extensions', () => {
    expect(isImageOrVideo('clip.mp4')).toBe(true);
    expect(isImageOrVideo('clip.mov')).toBe(true);
    expect(isImageOrVideo('clip.avi')).toBe(true);
  });

  test('rejects non-media files', () => {
    expect(isImageOrVideo('file.json')).toBe(false);
    expect(isImageOrVideo('file.txt')).toBe(false);
    expect(isImageOrVideo('file.html')).toBe(false);
  });
});

describe('validatePath', () => {
  test('allows paths within base', () => {
    expect(validatePath('/home/user/data/file.jpg', '/home/user')).toBe(true);
  });

  test('rejects path traversal', () => {
    expect(validatePath('/home/user/../etc/passwd', '/home/user')).toBe(false);
  });
});
