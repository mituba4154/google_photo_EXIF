'use client';

import { useState } from 'react';
import { useProcessingStore } from '@/store/processing-store';
import FolderSelector from '@/components/FolderSelector';
import AnalysisResults from '@/components/AnalysisResults';
import ProcessingOptionsPanel from '@/components/ProcessingOptions';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultsTable from '@/components/ResultsTable';
import type { AnalysisResult } from '@/lib/types/processing';

export default function Home() {
  const {
    analysisResult,
    processingOptions,
    currentJobId,
    currentJob,
    setRootPath,
    setAnalysisResult,
    updateOptions,
    startProcessing,
  } = useProcessingStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFolderSelect = async (path: string) => {
    setLoading(true);
    setError(null);
    setRootPath(path);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: path }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: AnalysisResult;
        error?: string;
      };
      if (data.success && data.data) {
        setAnalysisResult(data.data);
      } else {
        setError(data.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const isProcessing =
    Boolean(currentJobId) &&
    (!currentJob ||
      currentJob.status === 'running' ||
      currentJob.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Google Photos EXIF Restorer
        </h1>

        <div className="space-y-6">
          {/* 1. フォルダ選択 */}
          <FolderSelector
            onFolderSelect={handleFolderSelect}
            disabled={loading || isProcessing}
          />

          {loading && (
            <p className="text-center text-sm text-gray-500">解析中...</p>
          )}
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          {/* 2. 解析結果 */}
          <AnalysisResults result={analysisResult} />

          {/* 3. 処理オプション */}
          {analysisResult && (
            <>
              <ProcessingOptionsPanel
                options={processingOptions}
                onChange={updateOptions}
                disabled={isProcessing}
              />

              <div className="text-center">
                <button
                  onClick={startProcessing}
                  disabled={analysisResult.matchedPairs === 0 || isProcessing}
                  className="rounded-md bg-green-600 px-8 py-3 text-sm font-medium text-white
                             hover:bg-green-700 focus:ring-2 focus:ring-green-300
                             focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  処理開始
                </button>
              </div>
            </>
          )}

          {/* 4. 進捗状況 */}
          <ProcessingStatus />

          {/* 5. 結果詳細 */}
          {currentJob?.status === 'completed' && currentJob.errors.length > 0 && (
            <ResultsTable errors={currentJob.errors} />
          )}
        </div>
      </div>
    </div>
  );
}
