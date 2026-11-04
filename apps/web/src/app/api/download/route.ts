import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/download
 * Public direct endpoint for downloading the Memoreply Chrome Extension ZIP (v0.1.1).
 * Ungated download flow: Users can download freely, and authentication is handled
 * directly inside the extension popup.
 */
export async function GET(_req: NextRequest) {
  try {
    // Path to production ZIP build
    const zipPath = path.join(process.cwd(), 'private', 'memoreply-extension-v0.1.1.zip');

    if (!fs.existsSync(zipPath)) {
      console.error('[Download API] Extension ZIP file not found at:', zipPath);
      return NextResponse.json(
        { error: 'Extension package build is currently being refreshed. Please try again shortly.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(zipPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="memoreply-extension-v0.1.1.zip"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[Download API Error]:', err);
    return NextResponse.json(
      { error: 'Failed to stream extension package.' },
      { status: 500 }
    );
  }
}
