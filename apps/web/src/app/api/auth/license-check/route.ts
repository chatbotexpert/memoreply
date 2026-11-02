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
 * Validates user's Supabase session token, syncs user metadata in PostgreSQL,
 * and manages backend usage tracking (repliesUsed / limits).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';
    let action = '';

    const body = await req.json().catch(() => ({}));
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    } else {
      token = body?.token || '';
    }
    action = body?.action || '';

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
    const shouldIncrement = action === 'increment_usage';

    // 2. Fetch, map, and synchronize user in PostgreSQL database
    let dbPlan = userMeta.plan || 'FREE';
    let repliesUsed = 0;
    let maxReplies = 25;

    try {
      if (prisma) {
        const dbUser = await (prisma as any).user.upsert({
          where: { id: authUser.id },
          update: {
            email: authUser.email || undefined,
            name: userMeta.name || authUser.email?.split('@')[0] || undefined,
            lastActiveAt: new Date(),
            ...(shouldIncrement ? { repliesUsed: { increment: 1 } } : {}),
          },
          create: {
            id: authUser.id,
            email: authUser.email || `${authUser.id}@memoreply.user`,
            name: userMeta.name || authUser.email?.split('@')[0] || 'Freelancer',
            plan: userMeta.plan?.toUpperCase() === 'FREE' ? 'FREE' : 'PRO',
            repliesUsed: shouldIncrement ? 1 : 0,
            maxReplies: 25,
            lastActiveAt: new Date(),
          },
        });

        if (dbUser?.plan) {
          dbPlan = dbUser.plan;
        }
        repliesUsed = dbUser?.repliesUsed ?? 0;
        maxReplies = dbUser?.maxReplies ?? 25;
      }
    } catch (dbErr) {
      console.warn('[License Check] PostgreSQL user sync warning:', dbErr);
    }

    const isPaidPlan =
      dbPlan.toUpperCase() === 'PRO' ||
      dbPlan.toUpperCase() === 'ENTERPRISE' ||
      dbPlan.toLowerCase() === 'freelancer' ||
      dbPlan.toLowerCase() === 'agency pro' ||
      dbPlan.toLowerCase() === 'enterprise';

    const isExhausted = !isPaidPlan && repliesUsed >= maxReplies;

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
          maxFreeReplies: maxReplies,
          repliesUsed,
          isExhausted,
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
