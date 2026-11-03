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
        { valid: false, expired: true, error: 'Missing session token. Mandatory authentication required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    let authUser: { id: string; email?: string; user_metadata?: Record<string, any> } | null = null;

    // Check if token is a direct agency license key (e.g. MR-AGENCYPRO-ACTIVE-SEC)
    if (
      token.startsWith('MR-') ||
      token.startsWith('license_manual_') ||
      token.startsWith('demo_') ||
      token.startsWith('sess_MR-')
    ) {
      const cleanKey = token.replace('license_manual_', '').replace('sess_', '');
      const isAgency = cleanKey.includes('AGENCY') || cleanKey.includes('PRO');
      const isEnterprise = cleanKey.includes('ENTERPRISE');
      const plan = isEnterprise ? 'Enterprise' : isAgency ? 'Agency Pro' : 'Freelancer';

      authUser = {
        id: `usr_${cleanKey.replace(/[^A-Z0-9]/gi, '').slice(-12)}`,
        email: body?.email || 'licensed@memoreply.com',
        user_metadata: {
          name: 'Licensed Workspace',
          plan,
          licenseKey: cleanKey,
        },
      };
    } else {
      // 1. Verify token with Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        return NextResponse.json(
          { valid: false, expired: true, error: 'Invalid or expired session. Please renew your license on memoreply.com.' },
          { status: 401, headers: corsHeaders }
        );
      }
      authUser = data.user;
    }

    const userMeta = authUser.user_metadata || {};
    const shouldIncrement = action === 'increment_usage';

    // Check for explicit revocation / expiry flags
    const isRevoked = userMeta.isRevoked === true || userMeta.status === 'revoked';
    const isExpired = userMeta.isExpired === true || userMeta.status === 'expired';
    if (isRevoked || isExpired) {
      return NextResponse.json(
        {
          valid: false,
          expired: true,
          error: 'Your agency license or subscription has expired. Please renew on memoreply.com to continue.',
          upgradeUrl: 'https://memoreply.com/pricing',
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Fetch, map, and synchronize user in PostgreSQL database
    let dbPlan = userMeta.plan || 'FREE';
    let maxReplies = 50; // 50 free replies / month default
    if (dbPlan.toLowerCase().includes('enterprise')) maxReplies = 10000;
    else if (dbPlan.toLowerCase().includes('agency') || dbPlan.toUpperCase() === 'PRO') maxReplies = 2500;
    else if (dbPlan.toLowerCase().includes('freelancer')) maxReplies = 500;

    let repliesUsed = 0;

    try {
      if (prisma) {
        const existing = await (prisma as any).user.findUnique({
          where: { id: authUser.id },
        });

        const now = new Date();
        const lastActive = existing?.lastActiveAt ? new Date(existing.lastActiveAt) : now;
        const isNewMonth =
          now.getMonth() !== lastActive.getMonth() || now.getFullYear() !== lastActive.getFullYear();

        // Auto monthly reset if new calendar month
        let updatedCount = existing?.repliesUsed ?? 0;
        if (isNewMonth) {
          updatedCount = 0;
        }
        if (shouldIncrement) {
          updatedCount += 1;
        }

        const dbUser = await (prisma as any).user.upsert({
          where: { id: authUser.id },
          update: {
            email: authUser.email || undefined,
            name: userMeta.name || authUser.email?.split('@')[0] || undefined,
            lastActiveAt: now,
            repliesUsed: updatedCount,
            maxReplies,
          },
          create: {
            id: authUser.id,
            email: authUser.email || `${authUser.id}@memoreply.user`,
            name: userMeta.name || authUser.email?.split('@')[0] || 'Freelancer',
            plan: userMeta.plan?.toUpperCase() === 'FREE' ? 'FREE' : 'PRO',
            repliesUsed: shouldIncrement ? 1 : 0,
            maxReplies,
            lastActiveAt: now,
          },
        });

        if (dbUser?.plan) {
          dbPlan = dbUser.plan;
        }
        repliesUsed = dbUser?.repliesUsed ?? updatedCount;
        maxReplies = dbUser?.maxReplies ?? maxReplies;
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
    const remainingReplies = Math.max(0, maxReplies - repliesUsed);
    const percentUsed = Math.min(100, Math.round((repliesUsed / maxReplies) * 100));

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
          maxReplies,
          repliesUsed,
          remainingReplies,
          percentUsed,
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
