import { z } from 'zod';

const TimestampSchema = z.object({
  timestamp: z.string(),
  formatted: z.string().optional(),
});

const GeoDataSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number().optional(),
  latitudeSpan: z.number().optional(),
  longitudeSpan: z.number().optional(),
});

const PersonSchema = z.object({
  name: z.string(),
});

export const TakeoutJsonSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  imageViews: z.string().optional(),
  creationTime: TimestampSchema.optional(),
  modificationTime: TimestampSchema.optional(),
  photoTakenTime: TimestampSchema,
  geoData: GeoDataSchema.optional(),
  geoDataExif: GeoDataSchema.optional(),
  people: z.array(PersonSchema).optional().default([]),
  url: z.string().optional(),
  googlePhotosOrigin: z.record(z.string(), z.unknown()).optional(),
  photoLastModifiedTime: TimestampSchema.optional(),
  favorited: z.boolean().optional().default(false),
});

export type TakeoutJson = z.infer<typeof TakeoutJsonSchema>;
