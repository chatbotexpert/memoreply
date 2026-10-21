import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveConversations } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || undefined;
  const conversations = await fetchLiveConversations(platform);
  return NextResponse.json({ conversations, platform: platform || 'all', timestamp: new Date().toISOString() });
}

