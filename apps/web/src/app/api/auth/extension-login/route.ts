import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    let verifiedUser: {
      id: string;
      email: string;
      name: string;
      plan: string;
      licenseKey: string;
    } | null = null;

    // 1. First, check Clerk Authentication
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (clerkSecretKey && clerkSecretKey.startsWith('sk_')) {
        const clerk = createClerkClient({ secretKey: clerkSecretKey });
        const usersList = await clerk.users.getUserList({
          emailAddress: [cleanEmail],
          limit: 1,
        });

        if (usersList.data && usersList.data.length > 0) {
          const clerkUser = usersList.data[0];
          
          // Verify password against Clerk
          try {
            const verifyRes = await clerk.users.verifyPassword({
              userId: clerkUser.id,
              password: cleanPassword,
            });

            if (verifyRes.verified) {
              const meta = (clerkUser.publicMetadata || {}) as Record<string, any>;
              const plan = (meta.plan as string) || 'Agency Pro';
              const licenseKey = (meta.licenseKey as string) || `MR-${plan.toUpperCase().replace(/\s+/g, '')}-ACTIVE-SEC`;
              const name =
                clerkUser.fullName ||
                clerkUser.firstName ||
                cleanEmail.split('@')[0] ||
                'Agency User';

              verifiedUser = {
                id: clerkUser.id,
                email: cleanEmail,
                name,
                plan,
                licenseKey,
              };

              // Sync password and user into Supabase Auth so both match
              try {
                const admin = getSupabaseAdmin();
                const { data: usersData } = await admin.auth.admin.listUsers();
                const existing = usersData?.users?.find(
                  (u) => u.email?.toLowerCase() === cleanEmail
                );

                if (existing) {
                  await admin.auth.admin.updateUserById(existing.id, {
                    password: cleanPassword,
                    user_metadata: { name, plan, licenseKey, clerkId: clerkUser.id },
                  });
                } else {
                  await admin.auth.admin.createUser({
                    email: cleanEmail,
                    password: cleanPassword,
                    email_confirm: true,
                    user_metadata: { name, plan, licenseKey, clerkId: clerkUser.id },
                  });
                }
              } catch (supaErr) {
                console.warn('[Extension Login] Supabase sync warning:', supaErr);
              }
            }
          } catch (passErr: any) {
            console.warn('[Extension Login] Clerk password mismatch:', passErr?.message);
          }
        }
      }
    } catch (clerkErr) {
      console.warn('[Extension Login] Clerk check failed, falling back to Supabase:', clerkErr);
    }

    // 2. Fallback: Check Supabase Auth directly if not verified via Clerk
    if (!verifiedUser) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error && data?.user) {
          const userMeta = data.user.user_metadata || {};
          const plan = userMeta.plan || 'Agency Pro';
          const licenseKey = userMeta.licenseKey || `MR-${plan.toUpperCase().replace(/\s+/g, '')}-ACTIVE-SEC`;
          verifiedUser = {
            id: data.user.id,
            email: cleanEmail,
            name: userMeta.name || cleanEmail.split('@')[0],
            plan,
            licenseKey,
          };
        }
      } catch (supaLoginErr) {
        console.warn('[Extension Login] Supabase direct login failed:', supaLoginErr);
      }
    }

    // If neither matched
    if (!verifiedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid login credentials. Please check your work email and password.',
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Upsert user in PostgreSQL Prisma database
    try {
      if (prisma) {
        await (prisma as any).user.upsert({
          where: { email: cleanEmail },
          update: {
            name: verifiedUser.name,
            lastActiveAt: new Date(),
          },
          create: {
            id: verifiedUser.id,
            email: cleanEmail,
            name: verifiedUser.name,
            plan: verifiedUser.plan.toUpperCase().includes('FREE') ? 'FREE' : 'PRO',
            repliesUsed: 0,
            maxReplies: verifiedUser.plan.toLowerCase().includes('enterprise')
              ? 10000
              : verifiedUser.plan.toLowerCase().includes('freelancer')
              ? 500
              : 2500,
            lastActiveAt: new Date(),
          },
        });
      }
    } catch (prismaErr) {
      console.warn('[Extension Login] Prisma upsert warning:', prismaErr);
    }

    const token = `clerk_ext_${verifiedUser.id}_${Date.now()}`;
    const isPaid = verifiedUser.plan.toUpperCase() !== 'FREE';

    return NextResponse.json(
      {
        success: true,
        token,
        userId: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        plan: verifiedUser.plan,
        licenseKey: verifiedUser.licenseKey,
        isLicensed: isPaid,
        limits: {
          maxFreeReplies: isPaid ? 999999 : 50,
          repliesUsed: 0,
          isExhausted: false,
          upgradeUrl: 'https://memoreply.com/pricing',
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Extension Login Route Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
