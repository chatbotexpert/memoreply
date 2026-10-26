import { NextResponse } from 'next/server';

interface WaitlistEntry {
  email: string;
  agencyName: string;
  plan?: string;
  platform?: string;
  createdAt: string;
}

// In-memory waitlist store for demo / pre-launch phase
const waitlistSubmissions: WaitlistEntry[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, agencyName, plan = 'Agency Pro', platform = 'All' } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid work email is required.' },
        { status: 400 }
      );
    }

    if (!agencyName || typeof agencyName !== 'string') {
      return NextResponse.json(
        { error: 'Agency or company name is required.' },
        { status: 400 }
      );
    }

    const entry: WaitlistEntry = {
      email: email.trim().toLowerCase(),
      agencyName: agencyName.trim(),
      plan,
      platform,
      createdAt: new Date().toISOString(),
    };

    waitlistSubmissions.push(entry);

    return NextResponse.json({
      success: true,
      message: "You're on the whitelist! We’ll email your license key when your workspace batch is ready.",
      entry: {
        email: entry.email,
        agencyName: entry.agencyName,
        plan: entry.plan,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process waitlist registration.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    totalCount: waitlistSubmissions.length,
    status: 'Early Access Waitlist Active',
  });
}
