import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import type {
  ProcessingJob,
  ProcessingOptions,
} from '@/lib/types/processing';
import { matchJsonToImages } from '@/lib/core/matcher';
import {
  writeExifFromJson,
  closeExifTool,
} from '@/lib/core/exif-writer';
import { isImageOrVideo } from '@/lib/utils/file-utils';
import { ensureUtf8Path } from '@/lib/utils/encoding';
import { logger } from '@/lib/utils/logger';
import fg from 'fast-glob';

/** インメモリのジョブストア */
export const jobs = new Map<string, ProcessingJob>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rootPath?: string;
      options?: ProcessingOptions;
    };
    const { rootPath, options } = body;

    if (!rootPath || typeof rootPath !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rootPath is required' },
        { status: 400 }
      );
    }
    if (!options) {
      return NextResponse.json(
        { success: false, error: 'options is required' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const job: ProcessingJob = {
      jobId,
      status: 'pending',
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      currentFile: null,
      errors: [],
      startTime: Date.now(),
      endTime: null,
    };
    jobs.set(jobId, job);

    // バックグラウンド処理を開始（await しない）
    processInBackground(jobId, rootPath, options);

    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

async function processInBackground(
  jobId: string,
  rootPath: string,
  options: ProcessingOptions
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = 'running';

  try {
    const safePath = ensureUtf8Path(rootPath);

    // 1. ファイル走査
    const files = await fg(
      [
        '**/*.{jpg,jpeg,png,heic,gif,bmp,tiff,tif,webp,mp4,mov,avi}',
        '**/*.json',
      ],
      { cwd: safePath, absolute: true, caseSensitiveMatch: false, onlyFiles: true }
    );

    const images = files.filter((f) => isImageOrVideo(f));
    const jsons = files.filter((f) => f.endsWith('.json'));

    // 2. マッチング
    const matches = await matchJsonToImages(images, jsons);
    job.totalFiles = matches.matched.length;

    // 3. 並列処理
    const queue = new PQueue({ concurrency: options.maxConcurrency });

    for (const match of matches.matched) {
      queue.add(async () => {
        job.currentFile = match.imagePath;
        try {
          if (!match.metadata) {
            job.skippedFiles++;
            logger.info('Skipping: No valid metadata', { path: match.imagePath });
            return;
          }
          const result = await writeExifFromJson(match.imagePath, match.metadata, options);
          if (result.status === 'skipped') {
            job.skippedFiles++;
          } else {
            job.processedFiles++;
          }
        } catch (error) {
          job.failedFiles++;
          job.errors.push({
            filePath: match.imagePath,
            error:
              error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          });
        }
      });
    }

    await queue.onIdle();
    job.status = 'completed';
    job.endTime = Date.now();
  } catch (error) {
    job.status = 'failed';
    job.errors.push({
      filePath: rootPath,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });
    job.endTime = Date.now();
  } finally {
    await closeExifTool();
    logger.info('Processing complete', { jobId, status: job.status });
  }
}
