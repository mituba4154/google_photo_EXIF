import * as fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { analyzeTakeoutFolder } from '@/lib/core/analyzer';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rootPath?: string };
    const rootPath = body.rootPath;

    if (!rootPath || typeof rootPath !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rootPath is required' },
        { status: 400 }
      );
    }

    // パスアクセス検証
    const accessible = await fs
      .access(rootPath)
      .then(() => true)
      .catch(() => false);

    if (!accessible) {
      return NextResponse.json(
        { success: false, error: 'Path not accessible' },
        { status: 400 }
      );
    }

    const result = await analyzeTakeoutFolder(rootPath);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
