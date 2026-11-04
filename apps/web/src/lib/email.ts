import { Resend } from 'resend';

// Resend Client Initialization
const resendApiKey = process.env.RESEND_API_KEY || 're_test_mock_key';
export const resend = new Resend(resendApiKey);

// Default sender address (Can be customized via RESEND_FROM_EMAIL)
// Note: onboarding@resend.dev works out of the box for Resend sandbox testing
export const SENDER_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Memoreply Cloud <onboarding@resend.dev>';

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://memoreply.com';

/**
 * Shared HTML email styling wrapper
 */
function getEmailLayout(content: string, previewText: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memoreply</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <!-- Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, #1f1f23 0%, #18181b 100%);">
              <div style="display: inline-block; padding: 8px 16px; background-color: #27272a; border-radius: 9999px; border: 1px solid #3f3f46; margin-bottom: 12px;">
                <span style="color: #10b981; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
                  Memoreply Cloud
                </span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">
                Workspace & License Security
              </h1>
              <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px;">
                Deterministic context memory engine for client communication
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0c0a09; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 11px; line-height: 1.5;">
                This security transmission was dispatched by Memoreply Authentication Gateway.<br/>
                If you did not initiate this request, you can safely disregard this email.
              </p>
              <p style="margin: 8px 0 0; color: #52525b; font-size: 10px; font-family: monospace;">
                © 2026 HashTurn Digital Solutions LLC • All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. Send Sign Up Verification & Welcome Email via Resend
 */
export async function sendVerificationEmail({
  email,
  name,
  confirmUrl,
  licenseKey,
  plan = 'Agency Pro',
}: {
  email: string;
  name: string;
  confirmUrl: string;
  licenseKey: string;
  plan?: string;
}) {
  const content = `
    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
      Welcome to Memoreply, ${name || 'Partner'}!
    </h2>
    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Your workspace on the <strong>${plan}</strong> plan is provisioned. Please confirm your email address below to activate your Chrome extension seats and cloud ledger.
    </p>

    <!-- Call to action button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background-color: #10b981; color: #09090b; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
        Confirm Agency Account →
      </a>
    </div>

    <!-- License Key Card -->
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin: 24px 0;">
      <div style="color: #a1a1aa; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
        Your Assigned Agency License Key
      </div>
      <div style="font-family: monospace; font-size: 15px; color: #34d399; font-weight: 700; letter-spacing: 0.05em; word-break: break-all;">
        ${licenseKey}
      </div>
      <div style="color: #71717a; font-size: 11px; margin-top: 6px;">
        Paste this key in the Memoreply Chrome Extension to instantly activate all agency seats.
      </div>
    </div>

    <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0;">
      Or paste this confirmation URL into your browser:<br/>
      <a href="${confirmUrl}" style="color: #10b981; word-break: break-all; font-size: 11px;">
        ${confirmUrl}
      </a>
    </p>
  `;

  const html = getEmailLayout(content, 'Confirm your Memoreply agency workspace account');

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_test_mock_key') {
    console.log('[Resend Mock Mode] Verification email simulated for:', email);
    console.log('[Resend Mock Link]:', confirmUrl);
    return { success: true, simulated: true, confirmUrl };
  }

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: 'Verify your Memoreply Agency Workspace & License Key',
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error] Failed to send verification email:', error);
    // If domain sending is restricted on Resend free tier to personal email, return fallback
    return { success: false, error: error.message || String(error), fallbackUrl: confirmUrl };
  }
}

/**
 * 2. Send Password Reset Link Email via Resend
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name?: string;
  resetUrl: string;
}) {
  const content = `
    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
      Reset your Memoreply Password
    </h2>
    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Hello ${name || 'there'}, we received a request to reset your password for your Memoreply account (<strong>${email}</strong>).
    </p>

    <!-- Call to action button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);">
        Set New Password →
      </a>
    </div>

    <div style="background-color: #262626; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0;">
      <p style="color: #fbbf24; font-size: 12px; margin: 0; line-height: 1.5;">
        This password reset link is time-sensitive and valid for <strong>1 hour</strong>. If you did not request this change, your account remains secure and no action is required.
      </p>
    </div>

    <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0;">
      If the button above does not work, copy and paste this link in your browser:<br/>
      <a href="${resetUrl}" style="color: #a1a1aa; word-break: break-all; font-size: 11px;">
        ${resetUrl}
      </a>
    </p>
  `;

  const html = getEmailLayout(content, 'Reset your Memoreply password');

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_test_mock_key') {
    console.log('[Resend Mock Mode] Password reset email simulated for:', email);
    console.log('[Resend Reset Link]:', resetUrl);
    return { success: true, simulated: true, resetUrl };
  }

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: 'Reset your Memoreply account password',
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error] Failed to send password reset email:', error);
    return { success: false, error: error.message || String(error), fallbackUrl: resetUrl };
  }
}

