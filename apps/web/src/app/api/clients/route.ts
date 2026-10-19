import { NextResponse } from 'next/server';
import { fetchLiveClients } from '@/lib/dataService';

export async function GET() {
  const clients = await fetchLiveClients();
  return NextResponse.json({ clients, timestamp: new Date().toISOString() });
}
