import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail, APP_URL } from '@/lib/email';

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

    let resetUrl = resetRedirect;

    // 1. Generate password recovery link via Supabase Auth Admin
    try {
      const { data: recoveryData, error: recoveryError } =
        await admin.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: resetRedirect,
          },
        });

      if (recoveryError) {
        console.warn('[Supabase Recovery Link Error]:', recoveryError.message);
        // If user not found, still return standard message to prevent user enumeration
        return NextResponse.json(
          {
            success: true,
            message:
              'If an account exists with this email, a secure password reset link has been dispatched via Resend.',
          },
          { status: 200, headers: corsHeaders }
        );
      }

      if (recoveryData?.properties?.hashed_token) {
        resetUrl = `${resetRedirect}?token_hash=${recoveryData.properties.hashed_token}&type=recovery`;
      } else if (recoveryData?.properties?.action_link) {
        resetUrl = recoveryData.properties.action_link;
      }
    } catch (genErr) {
      console.warn('[Admin Recovery Link Gen Warning]:', genErr);
    }

    // 2. Dispatch Password Reset Link via Resend
    const emailResult = await sendPasswordResetEmail({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      resetUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'A secure password reset link has been dispatched to your email via Resend.',
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

