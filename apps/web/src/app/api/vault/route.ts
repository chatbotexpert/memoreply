import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveVaultFacts } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') || undefined;
  const facts = await fetchLiveVaultFacts(platform);
  return NextResponse.json({ facts, platform: platform || 'all', timestamp: new Date().toISOString() });
}

