'use client';

import type { ProcessingError } from '@/lib/types/processing';

interface ResultsTableProps {
  errors: ProcessingError[];
}

export default function ResultsTable({ errors }: ResultsTableProps) {
  if (errors.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        📋 処理結果詳細
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="px-2 py-2">ファイル</th>
              <th className="px-2 py-2">エラー</th>
              <th className="px-2 py-2">時刻</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="max-w-xs truncate px-2 py-2">{err.filePath}</td>
                <td className="px-2 py-2 text-red-600">{err.error}</td>
                <td className="px-2 py-2 text-gray-400">
                  {new Date(err.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
