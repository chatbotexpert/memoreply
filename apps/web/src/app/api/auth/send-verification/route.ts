import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendVerificationEmail, APP_URL } from '@/lib/email';

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
    const { email, password, name, plan = 'Agency Pro', licenseKey } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = getSupabaseAdmin();
    const redirectUrl = `${APP_URL}/auth/success?email=${encodeURIComponent(cleanEmail)}`;

    let confirmUrl = redirectUrl;

    // 1. Generate link using Supabase Admin Auth
    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (!linkError && linkData?.properties?.action_link) {
        confirmUrl = linkData.properties.action_link;
      }
    } catch (genErr) {
      console.warn('[Admin Link Gen Warning]:', genErr);
    }

    // 2. Dispatch verification & welcome email via Resend
    const effectiveKey =
      licenseKey ||
      `MR-${plan.toUpperCase().replace(/\s+/g, '')}-SEC`;

    const emailResult = await sendVerificationEmail({
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      confirmUrl,
      licenseKey: effectiveKey,
      plan,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Verification & welcome email dispatched successfully.',
        delivery: emailResult,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Send Verification API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Unable to send verification email.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
