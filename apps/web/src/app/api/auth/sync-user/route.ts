import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

/**
 * POST /api/auth/sync-user
 * Automatically synchronizes a logged-in or newly registered user into:
 * 1. Supabase Authentication (auth.users) via Supabase Admin API
 * 2. PostgreSQL Application Database (public.users) via Prisma
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name, clerkId, plan } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required for sync.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const assignedPlan = plan || 'Agency Pro';
    const userName = name || cleanEmail.split('@')[0];
    let supabaseAuthSynced = false;
    let supabaseUserId: string | null = null;

    // 1. Sync into Supabase Auth (auth.users)
    try {
      const admin = getSupabaseAdmin();
      
      // Attempt to create user in Supabase Authentication
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: {
          name: userName,
          clerkId: clerkId || undefined,
          plan: assignedPlan,
        },
      });

      if (!createError && createData?.user) {
        supabaseAuthSynced = true;
        supabaseUserId = createData.user.id;
      } else if (createError) {
        // If user already exists in auth.users, fetch and update metadata
        const { data: usersData } = await admin.auth.admin.listUsers();
        const existing = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (existing) {
          supabaseUserId = existing.id;
          supabaseAuthSynced = true;
          // Optionally update user metadata
          await admin.auth.admin.updateUserById(existing.id, {
            user_metadata: {
              ...existing.user_metadata,
              name: userName,
              clerkId: clerkId || existing.user_metadata?.clerkId,
              plan: assignedPlan,
            },
          }).catch(() => {});
        }
      }
    } catch (authErr: any) {
      console.warn('[Supabase Auth Sync Warning]:', authErr?.message || authErr);
    }

    // 2. Sync into PostgreSQL Database (public.users) via Prisma
    let dbSynced = false;
    try {
      if (prisma) {
        const userId = supabaseUserId || clerkId || `usr_${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`;
        await (prisma as any).user.upsert({
          where: { email: cleanEmail },
          update: {
            name: userName,
            lastActiveAt: new Date(),
          },
          create: {
            id: userId,
            email: cleanEmail,
            name: userName,
            plan: assignedPlan.toUpperCase().includes('FREE') ? 'FREE' : 'PRO',
            repliesUsed: 0,
            maxReplies: assignedPlan.toLowerCase().includes('enterprise')
              ? 10000
              : assignedPlan.toLowerCase().includes('freelancer')
              ? 500
              : 2500,
            lastActiveAt: new Date(),
          },
        });
        dbSynced = true;
      }
    } catch (dbErr: any) {
      console.warn('[Prisma DB User Sync Warning]:', dbErr?.message || dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        supabaseAuthSynced,
        dbSynced,
        email: cleanEmail,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Sync User Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error during sync' },
      { status: 500, headers: corsHeaders }
    );
  }
}
