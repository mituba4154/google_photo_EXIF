'use client';

import type { AnalysisResult } from '@/lib/types/processing';

interface AnalysisResultsProps {
  result: AnalysisResult | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  if (!result) return null;

  const items = [
    { label: '画像ファイル', value: result.imageFiles, icon: '✓', color: 'text-green-600' },
    { label: 'JSONファイル', value: result.jsonFiles, icon: '✓', color: 'text-green-600' },
    { label: 'マッチ済み', value: result.matchedPairs, icon: '✓', color: 'text-green-600' },
    { label: '未マッチ画像', value: result.unmatchedImages, icon: '⚠', color: 'text-yellow-600' },
    { label: '未マッチJSON', value: result.unmatchedJsons, icon: '⚠', color: 'text-yellow-600' },
    { label: '重複ファイル', value: result.duplicates, icon: '⚠', color: 'text-yellow-600' },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        📊 解析結果
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-gray-100 bg-gray-50 p-3"
          >
            <span className={`mr-1 ${item.color}`}>{item.icon}</span>
            <span className="text-sm text-gray-600">{item.label}: </span>
            <span className="font-semibold text-gray-800">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {result.albumFolders.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">
            アルバムフォルダ ({result.albumFolders.length})
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-gray-500">
            {result.albumFolders.map((f) => (
              <li key={f} className="truncate py-0.5">
                {f}
              </li>
            ))}
          </ul>
        </details>
      )}

      {result.yearFolders.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-600">
            年別フォルダ ({result.yearFolders.length})
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-gray-500">
            {result.yearFolders.map((f) => (
              <li key={f} className="truncate py-0.5">
                {f}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-sm text-gray-500">
        推定処理時間: {Math.ceil(result.estimatedProcessingTime / 60)} 分
      </p>
    </section>
  );
}
