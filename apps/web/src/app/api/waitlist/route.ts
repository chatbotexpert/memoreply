import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEmail,
  isValidAgencyName,
  addWaitlistSubmission,
  getWaitlistStats,
} from '@/lib/waitlistStorage';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const {
      email,
      agencyName,
      plan = 'Agency Pro',
      tier,
      platform = 'All',
    } = body || {};

    // 1. Rigorous Email Validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid work or agency email address.' },
        { status: 400 }
      );
    }

    // 2. Agency Name Validation
    if (!isValidAgencyName(agencyName)) {
      return NextResponse.json(
        { error: 'Please provide an agency or company name (min 2 characters).' },
        { status: 400 }
      );
    }

    // 3. Extract metadata
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // 4. Register or Duplicate Check via persistent storage
    const targetTier = tier || plan || 'Agency Pro';
    const result = await addWaitlistSubmission({
      email,
      agencyName,
      platform,
      tier: targetTier,
      ip,
      userAgent,
    });

    if (result.isDuplicate) {
      return NextResponse.json(
        {
          error: 'This email is already registered on our priority waitlist.',
          alreadyRegistered: true,
          status: 'Wave 1 Allocated',
          entry: {
            email: result.entry.email,
            agencyName: result.entry.agencyName,
            tier: result.entry.tier,
            platform: result.entry.platform,
            status: result.entry.status,
            wave: result.entry.wave,
            createdAt: result.entry.createdAt,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "You're on the whitelist! We’ll email your license key when your workspace batch is ready.",
        entry: {
          id: result.entry.id,
          email: result.entry.email,
          agencyName: result.entry.agencyName,
          tier: result.entry.tier,
          platform: result.entry.platform,
          status: result.entry.status,
          wave: result.entry.wave,
          createdAt: result.entry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Waitlist API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process waitlist registration. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const stats = await getWaitlistStats();
  return NextResponse.json({
    success: true,
    metrics: stats,
    status: 'Early Access Wave 1 Waitlist Active',
    timestamp: new Date().toISOString(),
  });
}
