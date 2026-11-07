import { NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail, APP_URL } from '@/lib/email';
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered email address.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = getSupabaseAdmin();
    const resetRedirect = `${APP_URL}/reset-password`;

    let resetUrl = `${resetRedirect}?email=${encodeURIComponent(cleanEmail)}`;
    let hasSupabaseAccount = false;
    let emailDispatchedViaSupabase = false;

    // 1. Dispatch real email via Supabase's built-in Auth Email service
    try {
      const { error: supaEmailErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo: resetRedirect }
      );
      if (!supaEmailErr) {
        emailDispatchedViaSupabase = true;
        hasSupabaseAccount = true;
      } else {
        console.warn('[Supabase resetPasswordForEmail warning]:', supaEmailErr.message);
      }
    } catch (e) {
      console.warn('[Supabase email dispatch exception]:', e);
    }

    // 2. Generate direct password recovery link via Supabase Auth Admin
    try {
      const { data: recoveryData, error: recoveryError } =
        await admin.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: resetRedirect,
          },
        });

      if (!recoveryError) {
        hasSupabaseAccount = true;
        if (recoveryData?.properties?.hashed_token) {
          resetUrl = `${resetRedirect}?token_hash=${recoveryData.properties.hashed_token}&type=recovery&email=${encodeURIComponent(cleanEmail)}`;
        } else if (recoveryData?.properties?.action_link) {
          resetUrl = recoveryData.properties.action_link;
        }
      }
    } catch (genErr) {
      console.warn('[Admin Recovery Link Gen Warning]:', genErr);
    }

    // 3. Generate Clerk 1-click recovery/magic link if user exists in Clerk
    let clerkMagicUrl = '';
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret) {
      try {
        const clerk = createClerkClient({ secretKey: clerkSecret });
        const list = await clerk.users.getUserList({ emailAddress: [cleanEmail] });
        if (list.data?.[0]?.id) {
          const ticket = await clerk.signInTokens.createSignInToken({
            userId: list.data[0].id,
            expiresInSeconds: 3600,
          });
          clerkMagicUrl = ticket.url;
        }
      } catch (cErr) {
        console.warn('[Clerk ticket warning]:', cErr);
      }
    }

    // 4. Dispatch Password Reset Link via Resend (supplementary)
    const emailResult = await sendPasswordResetEmail({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      resetUrl,
    });

    const isSandboxRestricted =
      !emailResult.success &&
      typeof emailResult.error === 'string' &&
      (emailResult.error.includes('testing emails to your own email address') ||
        emailResult.error.includes('resend.com/domains') ||
        emailResult.error.includes('Invalid `to` field'));

    const isAnyEmailDelivered = emailDispatchedViaSupabase || emailResult.success;

    return NextResponse.json(
      {
        success: true,
        delivered: isAnyEmailDelivered,
        emailDispatchedViaSupabase,
        hasSupabaseAccount,
        message: isAnyEmailDelivered
          ? `A secure password reset link has been dispatched to ${cleanEmail}. Please check your inbox.`
          : isSandboxRestricted
          ? 'Notice: Resend sandbox restricts email delivery to the account owner (memoreplyext@gmail.com). We have generated your direct reset link below.'
          : 'Password reset link prepared.',
        resetUrl,
        clerkMagicUrl,
        isSandboxRestricted,
        resendError: emailResult.error,
        delivery: emailResult,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Forgot Password API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Unable to process password reset request.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

