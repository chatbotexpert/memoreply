// ============================================================
// Memoreply — Platform Adapters Registry
// ============================================================

import type { PlatformAdapter } from './types';
import { fiverrAdapter } from './fiverrAdapter';
import { upworkAdapter } from './upworkAdapter';
import { linkedinAdapter } from './linkedinAdapter';

export * from './types';
export * from './fiverrAdapter';
export * from './upworkAdapter';
export * from './linkedinAdapter';

export const ALL_PLATFORM_ADAPTERS: PlatformAdapter[] = [
  fiverrAdapter,
  upworkAdapter,
  linkedinAdapter,
];

/**
 * Identify and return the active platform adapter matching the provided URL.
 */
export function getAdapterForUrl(url: string): PlatformAdapter | null {
  for (const adapter of ALL_PLATFORM_ADAPTERS) {
    if (adapter.isMatchingUrl(url)) {
      return adapter;
    }
  }
  return null;
}
