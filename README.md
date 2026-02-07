# Google Photos EXIF Restorer

# Warning: This project is not yet functional.

# 警告:このプロジェクトは動作しません

> **[日本語](#日本語)** | **[English](#english)**

---

## 日本語

Google フォトの Takeout（エクスポート）で失われた EXIF メタデータを、付属の JSON ファイルから復元する Web アプリケーションです。

### 特徴

- **フォルダ解析** — Google Takeout のエクスポートフォルダをスキャンし、画像と JSON メタデータのペアを自動検出
- **3 段階マッチング** — 完全一致・拡張子一致・ファジーマッチ（46 文字切り詰め、編集済みバージョン、コラージュ対応）
- **EXIF 一括書き込み** — 撮影日時、GPS 位置情報、タイトル、説明、人物タグ→キーワード変換、お気に入り評価を復元
- **並列処理** — 同時実行数を 1 / 2 / 4 / 8 から選択可能
- **バックアップ & 安全性** — 元ファイルのバックアップ、上書き保護、タイムスタンプ保持オプション
- **リアルタイム進捗** — ジョブベースの処理でライブ状態を表示
- **エラーレポート** — 失敗したファイルの詳細ログ

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
# http://localhost:3000 でアクセス

# プロダクションビルド
npm run build
npm start

# テストの実行
npm run test

# リントの実行
npm run lint
```

### 使い方

1. ブラウザで `http://localhost:3000` を開きます
2. Google Takeout のフォルダパスを入力し、「解析」ボタンをクリックします
   - 例: `/Users/name/Downloads/Takeout/Google Photos`
3. 解析結果（画像数、JSON 数、マッチ数など）を確認します
4. 処理オプションを設定します（バックアップ、上書き、位置情報優先、同時実行数など）
5. 「処理開始」ボタンをクリックして EXIF の復元を開始します
6. 進捗バーとステータスがリアルタイムで表示されます
7. 処理完了後、エラーがあれば詳細テーブルで確認できます

### 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Next.js 16 / React 19 | UI とAPI ルート |
| 状態管理 | Zustand 5 | クライアント側ストア |
| EXIF 書き込み | exiftool-vendored | メタデータの書き込み |
| ファイルスキャン | fast-glob | 再帰的ファイル検出 |
| 並列処理 | p-queue | タスクの並列実行 |
| バリデーション | Zod 4 | JSON スキーマ検証 |
| スタイリング | Tailwind CSS 4 | レスポンシブ UI |
| テスト | Vitest 4 | ユニットテスト |

### プロジェクト構成

```
├── app/                  # Next.js App Router
│   ├── api/              # API エンドポイント (analyze, process, status)
│   └── page.tsx          # メインページ
├── components/           # React コンポーネント
├── lib/
│   ├── core/             # コアロジック (analyzer, matcher, exif-writer, validator)
│   ├── schemas/          # Zod スキーマ定義
│   ├── types/            # TypeScript 型定義
│   └── utils/            # ユーティリティ (ファイル操作, エンコーディング)
├── store/                # Zustand ストア
└── __tests__/            # テストファイル
```

### ライセンス

[MIT License](LICENSE)

---

## English

A web application that restores EXIF metadata lost during Google Photos Takeout export, using the accompanying JSON metadata files.

### Features

- **Folder Analysis** — Scans a Google Takeout export directory and automatically detects image–JSON metadata pairs
- **3-Tier Matching** — Exact match, extension match, and fuzzy match (handles 46-character truncation, edited versions, collages)
- **Bulk EXIF Writing** — Restores date taken, GPS location, title, description, people tags → keywords, and favorite ratings
- **Parallel Processing** — Configurable concurrency: 1 / 2 / 4 / 8 workers
- **Backup & Safety** — Optional backup of originals, overwrite protection, and timestamp preservation
- **Real-Time Progress** — Job-based processing with live status updates
- **Error Reporting** — Detailed logs for failed files

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Available at http://localhost:3000

# Production build
npm run build
npm start

# Run tests
npm run test

# Run linter
npm run lint
```

### Usage

1. Open `http://localhost:3000` in your browser
2. Enter your Google Takeout folder path and click the "解析" (Analyze) button
   - Example: `/Users/name/Downloads/Takeout/Google Photos`
3. Review the analysis results (image count, JSON count, matched pairs, etc.)
4. Configure processing options (backup, overwrite, geo priority, concurrency, etc.)
5. Click "処理開始" (Start Processing) to begin EXIF restoration
6. A progress bar and status are displayed in real time
7. After processing, review any errors in the detailed results table

### Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | Next.js 16 / React 19 | UI and API routes |
| State Management | Zustand 5 | Client-side store |
| EXIF Writing | exiftool-vendored | Metadata writing |
| File Scanning | fast-glob | Recursive file discovery |
| Concurrency | p-queue | Parallel task execution |
| Validation | Zod 4 | JSON schema validation |
| Styling | Tailwind CSS 4 | Responsive UI |
| Testing | Vitest 4 | Unit tests |

### Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # API endpoints (analyze, process, status)
│   └── page.tsx          # Main page
├── components/           # React components
├── lib/
│   ├── core/             # Core logic (analyzer, matcher, exif-writer, validator)
│   ├── schemas/          # Zod schema definitions
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utilities (file ops, encoding)
├── store/                # Zustand store
└── __tests__/            # Test files
```

### License

[MIT License](LICENSE)
