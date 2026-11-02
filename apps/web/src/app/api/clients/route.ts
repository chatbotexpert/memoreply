import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveClients } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const clients = await fetchLiveClients(platform, userId);
  return NextResponse.json({ clients, platform: platform || 'all', userId, timestamp: new Date().toISOString() });
}

