// ============================================================
// Memoreply Cloud — Waitlist & Early Access Storage Service
// ============================================================
// Provides persistent JSON-file storage with in-memory caching
// and zero-crash fallback for serverless environments.
// ============================================================

import fs from 'fs';
import path from 'path';

export interface WaitlistSubmission {
  id: string;
  email: string;
  agencyName: string;
  platform: 'All' | 'Fiverr' | 'Upwork' | 'LinkedIn' | string;
  tier: 'Starter Free' | 'Freelancer' | 'Agency Pro' | 'Enterprise' | string;
  status: 'Wave 1 Allocated';
  wave: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

// Global in-memory cache to preserve entries across hot-reloads and serverless runs
const globalStore = globalThis as unknown as {
  __memoreply_waitlist?: WaitlistSubmission[];
};

if (!globalStore.__memoreply_waitlist) {
  globalStore.__memoreply_waitlist = [];
}

/**
 * Resolves the persistent JSON database file path
 */
function getStoragePath(): string {
  const cwd = process.cwd();
  // If running from root directory (monorepo), store in apps/web/data
  if (fs.existsSync(path.join(cwd, 'apps', 'web'))) {
    return path.join(cwd, 'apps', 'web', 'data', 'waitlist.json');
  }
  // If running from apps/web directory
  return path.join(cwd, 'data', 'waitlist.json');
}

/**
 * Ensures the data directory exists
 */
function ensureDataDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads all waitlist entries from persistent JSON storage
 */
export async function getWaitlist(): Promise<WaitlistSubmission[]> {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content) as WaitlistSubmission[];
        if (Array.isArray(parsed)) {
          globalStore.__memoreply_waitlist = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[WaitlistStorage] Could not read waitlist file, using memory store:', err);
  }

  return globalStore.__memoreply_waitlist || [];
}

/**
 * Persists all waitlist entries to disk
 */
async function saveWaitlist(entries: WaitlistSubmission[]): Promise<boolean> {
  globalStore.__memoreply_waitlist = entries;
  try {
    const filePath = getStoragePath();
    ensureDataDirectory(filePath);
    await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('[WaitlistStorage] Failed to write to file (read-only environment?), cached in memory:', err);
    return false;
  }
}

/**
 * Validates email format with RFC-compliant checks
 */
export function isValidEmail(email: unknown): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254 || trimmed.length < 5) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates agency or company name
 */
export function isValidAgencyName(name: unknown): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

/**
 * Checks if an email is already registered
 */
export async function findWaitlistEntryByEmail(email: string): Promise<WaitlistSubmission | null> {
  const normalized = email.trim().toLowerCase();
  const list = await getWaitlist();
  const match = list.find((item) => item.email.toLowerCase() === normalized);
  return match || null;
}

/**
 * Adds a new verified waitlist submission
 */
export async function addWaitlistSubmission(data: {
  email: string;
  agencyName: string;
  platform?: string;
  tier?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  entry: WaitlistSubmission;
  isDuplicate: boolean;
}> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const list = await getWaitlist();

  // Check for duplicate registration
  const existing = list.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      success: false,
      entry: existing,
      isDuplicate: true,
    };
  }

  // Create new robust entry
  const entry: WaitlistSubmission = {
    id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    agencyName: data.agencyName.trim(),
    platform: data.platform || 'All',
    tier: data.tier || 'Agency Pro',
    status: 'Wave 1 Allocated',
    wave: 'Wave 1',
    createdAt: new Date().toISOString(),
    ip: data.ip,
    userAgent: data.userAgent,
  };

  list.unshift(entry); // Prepend so most recent is first
  await saveWaitlist(list);

  // Optional webhook dispatch (e.g., Slack, Discord, Google Sheets via Zapier/Make)
  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch((webhookErr) => {
        console.warn('[WaitlistStorage] Webhook forward error:', webhookErr);
      });
    } catch {
      // Non-blocking
    }
  }

  return {
    success: true,
    entry,
    isDuplicate: false,
  };
}

/**
 * Returns waitlist summary metrics
 */
export async function getWaitlistStats(): Promise<{
  totalCount: number;
  wave1Count: number;
  status: string;
}> {
  const list = await getWaitlist();
  return {
    totalCount: list.length,
    wave1Count: list.filter((e) => e.wave === 'Wave 1').length,
    status: 'Early Access Wave 1 Allocation Active',
  };
}
