import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveClients } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || undefined;
  const clients = await fetchLiveClients(platform);
  return NextResponse.json({ clients, platform: platform || 'all', timestamp: new Date().toISOString() });
}

