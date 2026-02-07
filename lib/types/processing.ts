import type { TakeoutJson } from '@/lib/schemas/takeout-json';

/** フォルダ解析結果 */
export interface AnalysisResult {
  totalFiles: number;
  imageFiles: number;
  jsonFiles: number;
  matchedPairs: number;
  unmatchedImages: number;
  unmatchedJsons: number;
  duplicates: number;
  albumFolders: string[];
  yearFolders: string[];
  estimatedProcessingTime: number; // seconds
}

/** JSON↔画像マッチング結果 */
export interface FileMatch {
  imagePath: string;
  jsonPath: string;
  matchConfidence: 'exact' | 'fuzzy' | 'manual';
  metadata: TakeoutJson | null;
}

/** マッチング全体の結果 */
export interface MatchResult {
  matched: FileMatch[];
  unmatched: {
    images: string[];
    jsons: string[];
  };
}

/** 処理ジョブ */
export interface ProcessingJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  currentFile: string | null;
  errors: ProcessingError[];
  startTime: number;
  endTime: number | null;
}

/** 処理エラー */
export interface ProcessingError {
  filePath: string;
  error: string;
  timestamp: number;
}

/** 処理オプション */
export interface ProcessingOptions {
  backupOriginals: boolean;
  overwriteExisting: boolean;
  useGeoDataExif: boolean;
  writePeopleToKeywords: boolean;
  preserveFileTimestamps: boolean;
  maxConcurrency: number;
  targetFolders: string[];
}
