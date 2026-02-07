'use client';

import { useState } from 'react';

interface FolderSelectorProps {
  onFolderSelect: (path: string) => void;
  disabled?: boolean;
}

export default function FolderSelector({
  onFolderSelect,
  disabled,
}: FolderSelectorProps) {
  const [inputPath, setInputPath] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      onFolderSelect(inputPath.trim());
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        📁 フォルダ選択
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          placeholder="/path/to/Takeout/Google Photos"
          disabled={disabled}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                     focus:outline-none disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={disabled || !inputPath.trim()}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white
                     hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          解析
        </button>
      </form>
    </section>
  );
}
