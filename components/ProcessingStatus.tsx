'use client';

import { useEffect, useRef } from 'react';
import { useProcessingStore } from '@/store/processing-store';
import type { ProcessingJob } from '@/lib/types/processing';

export default function ProcessingStatus() {
  const { currentJobId, currentJob, updateJobStatus } = useProcessingStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentJobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${currentJobId}`);
        const data = (await res.json()) as {
          success: boolean;
          data?: ProcessingJob;
        };
        if (data.success && data.data) {
          updateJobStatus(data.data);
          if (
            data.data.status === 'completed' ||
            data.data.status === 'failed'
          ) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch {
        // polling error – ignore and retry
      }
    };

    // 即座に1回ポーリング
    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentJobId, updateJobStatus]);

  if (!currentJobId || !currentJob) return null;

  const progress =
    currentJob.totalFiles > 0
      ? Math.round(
          ((currentJob.processedFiles + currentJob.failedFiles) /
            currentJob.totalFiles) *
            100
        )
      : 0;

  const elapsed = currentJob.endTime
    ? currentJob.endTime - currentJob.startTime
    : Date.now() - currentJob.startTime;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        📈 進捗状況
      </h2>

      {/* プログレスバー */}
      <div className="mb-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            currentJob.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-3 text-sm text-gray-600">
        {progress}% ({currentJob.processedFiles + currentJob.failedFiles}/
        {currentJob.totalFiles})
      </p>

      {currentJob.currentFile && currentJob.status === 'running' && (
        <p className="mb-2 truncate text-xs text-gray-500">
          処理中: {currentJob.currentFile}
        </p>
      )}

      <div className="flex gap-6 text-sm text-gray-600">
        <span>経過時間: {formatTime(elapsed)}</span>
        <span>
          ステータス:{' '}
          <span
            className={
              currentJob.status === 'completed'
                ? 'font-medium text-green-600'
                : currentJob.status === 'failed'
                  ? 'font-medium text-red-600'
                  : 'font-medium text-blue-600'
            }
          >
            {currentJob.status}
          </span>
        </span>
      </div>

      {/* エラー一覧 */}
      {currentJob.errors.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-red-600">
            エラー: {currentJob.errors.length}件
          </summary>
          <div className="mt-2 max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-1">ファイル</th>
                  <th className="py-1">エラー</th>
                </tr>
              </thead>
              <tbody>
                {currentJob.errors.map((err, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="max-w-[200px] truncate py-1 pr-2">
                      {err.filePath}
                    </td>
                    <td className="py-1 text-red-500">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
