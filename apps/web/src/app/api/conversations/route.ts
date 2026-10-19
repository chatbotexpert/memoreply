import { NextResponse } from 'next/server';
import { fetchLiveConversations } from '@/lib/dataService';

export async function GET() {
  const conversations = await fetchLiveConversations();
  return NextResponse.json({ conversations, timestamp: new Date().toISOString() });
}
