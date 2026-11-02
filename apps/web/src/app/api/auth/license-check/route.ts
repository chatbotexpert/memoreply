import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * POST /api/auth/license-check
 * Validates user's Supabase session token and returns their live subscription plan and limits.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    } else {
      const body = await req.json().catch(() => ({}));
      token = body?.token || '';
    }

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Missing session token. Mandatory authentication required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 1. Verify token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session. Please log in again.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const authUser = data.user;
    const userMeta = authUser.user_metadata || {};

    // 2. Fetch or sync database user
    let dbPlan = userMeta.plan || 'FREE';
    try {
      if (prisma) {
        const dbUser = await (prisma as any).user.findUnique({
          where: { id: authUser.id },
          select: { plan: true },
        });
        if (dbUser?.plan) {
          dbPlan = dbUser.plan;
        }
      }
    } catch {}

    const isPaidPlan =
      dbPlan.toUpperCase() === 'PRO' ||
      dbPlan.toUpperCase() === 'ENTERPRISE' ||
      dbPlan.toLowerCase() === 'freelancer' ||
      dbPlan.toLowerCase() === 'agency pro' ||
      dbPlan.toLowerCase() === 'enterprise';

    return NextResponse.json(
      {
        valid: true,
        userId: authUser.id,
        email: authUser.email,
        name: userMeta.name || authUser.email?.split('@')[0] || 'Freelancer',
        plan: dbPlan,
        isLicensed: isPaidPlan,
        tier: isPaidPlan ? 'PAID' : 'FREE',
        limits: {
          maxFreeReplies: 25,
          upgradeUrl: 'https://memoreply.com/pricing',
        },
        verifiedAt: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[License Check API Error]:', err);
    return NextResponse.json(
      { valid: false, error: 'License verification error: ' + (err?.message || String(err)) },
      { status: 500, headers: corsHeaders }
    );
  }
}
