'use client';

import type { ProcessingOptions } from '@/lib/types/processing';

interface ProcessingOptionsProps {
  options: ProcessingOptions;
  onChange: (options: Partial<ProcessingOptions>) => void;
  disabled?: boolean;
}

export default function ProcessingOptionsPanel({
  options,
  onChange,
  disabled,
}: ProcessingOptionsProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        ⚙️ 処理オプション
      </h2>
      <div className="space-y-3">
        <CheckboxOption
          label="オリジナルをバックアップ"
          checked={options.backupOriginals}
          onChange={(v) => onChange({ backupOriginals: v })}
          disabled={disabled}
        />
        <CheckboxOption
          label="既存EXIFを上書き"
          checked={options.overwriteExisting}
          onChange={(v) => onChange({ overwriteExisting: v })}
          disabled={disabled}
        />
        <CheckboxOption
          label="geoDataExifを優先"
          checked={options.useGeoDataExif}
          onChange={(v) => onChange({ useGeoDataExif: v })}
          disabled={disabled}
        />
        <CheckboxOption
          label="人物情報をキーワードに書き込み"
          checked={options.writePeopleToKeywords}
          onChange={(v) => onChange({ writePeopleToKeywords: v })}
          disabled={disabled}
        />
        <CheckboxOption
          label="ファイルタイムスタンプを保持"
          checked={options.preserveFileTimestamps}
          onChange={(v) => onChange({ preserveFileTimestamps: v })}
          disabled={disabled}
        />

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">並列処理数:</label>
          <select
            value={options.maxConcurrency}
            onChange={(e) =>
              onChange({ maxConcurrency: parseInt(e.target.value, 10) })
            }
            disabled={disabled}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                       focus:outline-none disabled:bg-gray-100"
          >
            {[1, 2, 4, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600
                   focus:ring-blue-500 disabled:opacity-50"
      />
      {label}
    </label>
  );
}
