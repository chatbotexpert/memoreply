import { NextResponse } from 'next/server';
import { fetchLiveVaultFacts } from '@/lib/dataService';

export async function GET() {
  const facts = await fetchLiveVaultFacts();
  return NextResponse.json({ facts, timestamp: new Date().toISOString() });
}
