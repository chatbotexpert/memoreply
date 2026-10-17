// ============================================================
// Memoreply — Message Deduplication & Deterministic Hashing
// ============================================================

import type { SenderRole } from '../types';

/**
 * Fast deterministic hash string from text.
 */
export function generateMessageHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generates a deterministic, unique message ID from conversation ID, sender role, timestamp, and snippet.
 * This ensures that page reloads or DOM scrolling never generate duplicate records.
 */
export function generateDeterministicMessageId(
  conversationId: string,
  senderRole: SenderRole,
  timestamp: string | null,
  text: string
): string {
  const cleanSnippet = text.trim().replace(/\s+/g, ' ').slice(0, 80);
  const cleanTime = (timestamp || '').trim();
  const rawKey = `${conversationId}_${senderRole}_${cleanTime}_${cleanSnippet}`;
  return `msg_${generateMessageHash(rawKey)}`;
}

/**
 * Deduplicates an array of message items by their deterministic id.
 */
export function deduplicateMessages<T extends { id: string }>(messages: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const m of messages) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      result.push(m);
    }
  }
  return result;
}
