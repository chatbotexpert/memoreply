// ============================================================
// Memoreply — Subscription Licensing & Free Tier Auth Gate Manager
// ============================================================
// Enforces mandatory authentication, verifies subscription/license status
// against Supabase via the active session token in chrome.storage.local,
// and locks core features when free tier limits are exhausted.
// ============================================================

export interface SubscriptionLimits {
  maxFreeReplies: number;
  repliesUsed: number;
  isExhausted: boolean;
  upgradeUrl: string;
}

export interface SubscriptionLicenseStatus {
  valid: boolean;
  userId?: string;
  email?: string;
  name?: string;
  plan: string; // 'FREE' | 'Freelancer' | 'Agency Pro' | 'Enterprise'
  isLicensed: boolean; // true for paid tiers
  tier: 'FREE' | 'PAID';
  limits: SubscriptionLimits;
  verifiedAt: number;
  error?: string;
}

export const LICENSE_STORAGE_KEYS = {
  LICENSE_STATUS: 'memoreply_license_status',
  FREE_USAGE: 'memoreply_free_usage_count',
  AUTH_SESSION: 'memoreply_auth_session',
} as const;

export const DEFAULT_FREE_REPLY_LIMIT = 25; // 25 free context AI replies
export const UPGRADE_URL = 'https://memoreply.com/pricing';

/**
 * Retrieve current count of free replies used from chrome.storage.local
 */
export async function getFreeUsageCount(): Promise<number> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([LICENSE_STORAGE_KEYS.FREE_USAGE], (result: Record<string, any>) => {
        const val = result[LICENSE_STORAGE_KEYS.FREE_USAGE];
        const count = typeof val === 'number' ? val : 0;
        resolve(count);
      });
    } catch {
      resolve(0);
    }
  });
}

/**
 * Increment free reply counter by 1 when user generates an AI reply on Free Tier
 */
export async function incrementFreeReplyCount(): Promise<{ newCount: number; isExhausted: boolean }> {
  const current = await getFreeUsageCount();
  const newCount = current + 1;
  const isExhausted = newCount >= DEFAULT_FREE_REPLY_LIMIT;

  await new Promise<void>((resolve) => {
    try {
      chrome.storage.local.set({ [LICENSE_STORAGE_KEYS.FREE_USAGE]: newCount }, () => resolve());
    } catch {
      resolve();
    }
  });

  return { newCount, isExhausted };
}

/**
 * Reset free reply count (e.g. upon upgrading plan or month rollover)
 */
export async function resetFreeUsageCount(): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [LICENSE_STORAGE_KEYS.FREE_USAGE]: 0 }, () => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * Verify subscription and license status against Supabase via active session token.
 */
export async function verifyLicenseWithSupabase(token: string): Promise<SubscriptionLicenseStatus> {
  const repliesUsed = await getFreeUsageCount();

  if (!token) {
    return {
      valid: false,
      plan: 'FREE',
      isLicensed: false,
      tier: 'FREE',
      limits: {
        maxFreeReplies: DEFAULT_FREE_REPLY_LIMIT,
        repliesUsed,
        isExhausted: true,
        upgradeUrl: UPGRADE_URL,
      },
      verifiedAt: Date.now(),
      error: 'No active session token found. Please log in.',
    };
  }

  try {
    const response = await fetch('https://memoreply.com/api/auth/license-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      const isPaid = Boolean(data.isLicensed);
      const isExhausted = !isPaid && repliesUsed >= DEFAULT_FREE_REPLY_LIMIT;

      const licenseStatus: SubscriptionLicenseStatus = {
        valid: true,
        userId: data.userId,
        email: data.email,
        name: data.name,
        plan: data.plan || (isPaid ? 'Freelancer' : 'FREE'),
        isLicensed: isPaid,
        tier: isPaid ? 'PAID' : 'FREE',
        limits: {
          maxFreeReplies: DEFAULT_FREE_REPLY_LIMIT,
          repliesUsed,
          isExhausted,
          upgradeUrl: data.limits?.upgradeUrl || UPGRADE_URL,
        },
        verifiedAt: Date.now(),
      };

      // Persist verified license in chrome.storage.local
      chrome.storage.local.set({ [LICENSE_STORAGE_KEYS.LICENSE_STATUS]: licenseStatus });
      return licenseStatus;
    }

    if (response.status === 401) {
      // Session expired or revoked on Supabase
      const expiredStatus: SubscriptionLicenseStatus = {
        valid: false,
        plan: 'FREE',
        isLicensed: false,
        tier: 'FREE',
        limits: {
          maxFreeReplies: DEFAULT_FREE_REPLY_LIMIT,
          repliesUsed,
          isExhausted: true,
          upgradeUrl: UPGRADE_URL,
        },
        verifiedAt: Date.now(),
        error: 'Session expired. Please log in via memoreply.com.',
      };
      chrome.storage.local.set({ [LICENSE_STORAGE_KEYS.LICENSE_STATUS]: expiredStatus });
      return expiredStatus;
    }
  } catch (netErr) {
    console.warn('[Memoreply License Check] Network fallback, using local token metadata:', netErr);
  }

  // Resilient offline fallback using cached storage
  return new Promise((resolve) => {
    chrome.storage.local.get([LICENSE_STORAGE_KEYS.AUTH_SESSION], (res: Record<string, any>) => {
      const sess = res.memoreply_auth_session;
      const rawPlan = sess?.plan || 'FREE';
      const isPaid =
        rawPlan.toUpperCase() !== 'FREE' &&
        (rawPlan.toLowerCase().includes('pro') ||
          rawPlan.toLowerCase().includes('freelancer') ||
          rawPlan.toLowerCase().includes('enterprise'));

      const isExhausted = !isPaid && repliesUsed >= DEFAULT_FREE_REPLY_LIMIT;

      resolve({
        valid: Boolean(sess?.token),
        userId: sess?.userId,
        email: sess?.email,
        name: sess?.name,
        plan: rawPlan,
        isLicensed: isPaid,
        tier: isPaid ? 'PAID' : 'FREE',
        limits: {
          maxFreeReplies: DEFAULT_FREE_REPLY_LIMIT,
          repliesUsed,
          isExhausted,
          upgradeUrl: UPGRADE_URL,
        },
        verifiedAt: Date.now(),
      });
    });
  });
}

/**
 * Check if core features should be locked.
 * Features are locked if:
 * 1. User has not logged in / no valid token.
 * 2. User is on Free tier and their free reply quota is exhausted.
 */
export function isCoreFeatureLocked(license: SubscriptionLicenseStatus | null): boolean {
  if (!license || !license.valid) {
    return true; // Mandatory Auth Gate
  }
  if (license.tier === 'FREE' && license.limits.isExhausted) {
    return true; // Free Tier Limit Exhausted Gate
  }
  return false;
}
