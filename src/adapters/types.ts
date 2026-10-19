// ============================================================
// Memoreply — Platform Adapter Architecture Interface
// ============================================================

import type { ExtractedMessage, SupportedPlatform } from '../types';

export interface PlatformClientInfo {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PlatformAdapter {
  readonly platform: SupportedPlatform;
  isMatchingUrl(url: string): boolean;
  extractConversationId(): string | null;
  extractClientInfo(): PlatformClientInfo;
  extractMessages(): ExtractedMessage[];
  insertDraft(text: string): boolean;
}
