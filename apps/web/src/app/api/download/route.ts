import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/download
 * Protected endpoint for downloading the Memoreply Chrome Extension ZIP (v0.1.1).
 * Requires authenticated session token (via Bearer header, ?token= param, or cookie).
 */
export async function GET(req: NextRequest) {
  try {
    const tokenParam = req.nextUrl.searchParams.get('token');
    const authHeader = req.headers.get('authorization');
    let token = tokenParam || '';

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }

    // Check for cookie token as fallback
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/i);
      if (tokenMatch && tokenMatch[1]) {
        try {
          const parsed = JSON.parse(decodeURIComponent(tokenMatch[1]));
          token = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || '';
        } catch {}
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized. You must be logged in to download the Memoreply extension.',
          loginUrl: '/login?redirect=download',
        },
        { status: 401 }
      );
    }

    // Validate user session with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return NextResponse.json(
        {
          error: 'Invalid or expired session. Please log in to download the extension.',
          loginUrl: '/login?redirect=download',
        },
        { status: 401 }
      );
    }

    // Statically scoped path to private folder to prevent excessive tracing
    const zipPath = path.join(process.cwd(), 'private', 'memoreply-extension-v0.1.1.zip');

    if (!fs.existsSync(zipPath)) {
      console.error('[Download API] Extension ZIP file not found at:', zipPath);
      return NextResponse.json(
        { error: 'Extension package build is currently being updated. Please try again shortly.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(zipPath);

    console.log(`[Download API] User ${data.user.email} (ID: ${data.user.id}) securely downloaded v0.1.1 ZIP.`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="memoreply-extension-v0.1.1.zip"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    if (err?.digest?.includes('NEXT_PRERENDER_INTERRUPTED')) {
      throw err;
    }
    console.error('[Download API Error]:', err);
    return NextResponse.json(
      { error: 'Failed to stream extension package: ' + (err?.message || String(err)) },
      { status: 500 }
    );
  }
}
