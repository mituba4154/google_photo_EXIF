import { describe, test, expect } from 'vitest';
import { TakeoutJsonSchema } from '@/lib/schemas/takeout-json';

describe('TakeoutJsonSchema', () => {
  test('valid full JSON parses correctly', () => {
    const input = {
      title: 'test.jpg',
      description: 'A test photo',
      photoTakenTime: { timestamp: '1672531200', formatted: '2023-01-01' },
      geoData: { latitude: 35.6762, longitude: 139.6503 },
      people: [{ name: 'Alice' }],
      favorited: true,
    };
    const result = TakeoutJsonSchema.parse(input);
    expect(result.title).toBe('test.jpg');
    expect(result.description).toBe('A test photo');
    expect(result.people).toHaveLength(1);
    expect(result.favorited).toBe(true);
  });

  test('minimal JSON with defaults', () => {
    const input = {
      title: 'min.jpg',
      photoTakenTime: { timestamp: '1000000' },
    };
    const result = TakeoutJsonSchema.parse(input);
    expect(result.description).toBe('');
    expect(result.people).toEqual([]);
    expect(result.favorited).toBe(false);
  });

  test('missing photoTakenTime throws', () => {
    const input = { title: 'bad.jpg' };
    expect(() => TakeoutJsonSchema.parse(input)).toThrow();
  });

  test('missing title throws', () => {
    const input = { photoTakenTime: { timestamp: '123' } };
    expect(() => TakeoutJsonSchema.parse(input)).toThrow();
  });
});
