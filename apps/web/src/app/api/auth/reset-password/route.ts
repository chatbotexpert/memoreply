import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClerkClient } from '@clerk/nextjs/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, tokenHash } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = email?.trim()?.toLowerCase();
    const admin = getSupabaseAdmin();
    let updatedSupabase = false;
    let updatedClerk = false;

    // 1. Update Password in Supabase PostgreSQL Auth
    if (cleanEmail) {
      try {
        const { data: usersData, error: listErr } = await admin.auth.admin.listUsers();
        if (!listErr && usersData?.users) {
          const matchedUser = usersData.users.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (matchedUser) {
            const { error: updateErr } = await admin.auth.admin.updateUserById(
              matchedUser.id,
              { password }
            );
            if (!updateErr) {
              updatedSupabase = true;
            } else {
              console.warn('[Supabase Admin Password Update Warning]:', updateErr.message);
            }
          }
        }
      } catch (supaErr) {
        console.warn('[Supabase Admin Password Update Exception]:', supaErr);
      }
    }

    // 2. Simultaneously Update Password in Clerk if user exists
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret && cleanEmail) {
      try {
        const clerk = createClerkClient({ secretKey: clerkSecret });
        const clerkUsers = await clerk.users.getUserList({ emailAddress: [cleanEmail] });
        if (clerkUsers?.data?.[0]?.id) {
          await clerk.users.updateUser(clerkUsers.data[0].id, {
            password,
          });
          updatedClerk = true;
        }
      } catch (clerkErr) {
        console.warn('[Clerk Password Sync Warning]:', clerkErr);
      }
    }

    if (!updatedSupabase && !updatedClerk && !tokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'No matching account found with this email to reset.',
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password successfully updated across your Memoreply workspace.',
        updatedSupabase,
        updatedClerk,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Reset Password Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unable to update password.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
