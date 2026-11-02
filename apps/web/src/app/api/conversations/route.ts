import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveConversations } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const conversations = await fetchLiveConversations(platform, userId);
  return NextResponse.json({ conversations, platform: platform || 'all', userId, timestamp: new Date().toISOString() });
}

