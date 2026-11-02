// ============================================================
// Memoreply — Local-First Chat History Storage & Quota Guard
// ============================================================
// Stores sensitive client chat histories (Fiverr, Upwork, LinkedIn)
// exclusively inside the browser using chrome.storage.local.
//
// ZERO-CLOUD PRIVACY GUARANTEE:
// Raw message texts are NEVER uploaded to any central cloud database.
//
// RETENTION & CLEANUP RULES:
// 1. Auto-purges conversations older than retention period (30-60 days).
// 2. Enforces a strict FIFO (First-In, First-Out) eviction strategy to
//    ensure chrome.storage.local never exceeds the 10MB quota.
// ============================================================

import type { ConversationData, ExtractedMessage, SupportedPlatform } from '../types';

export interface LocalStoredChat {
  id: string; // e.g. 'conv_fiverr_alex_miller_dev'
  conversationId: string;
  platform: SupportedPlatform;
  clientUsername: string;
  clientDisplayName: string;
  clientAvatarUrl?: string | null;
  clientEmail?: string | null;
  url: string;
  messages: ExtractedMessage[];
  messageCount: number;
  lastMessageAt: number; // Unix timestamp in ms
  createdAt: number;
  updatedAt: number;
}

export interface LocalChatIndexEntry {
  id: string;
  conversationId: string;
  platform: SupportedPlatform;
  clientUsername: string;
  clientDisplayName: string;
  clientEmail?: string | null;
  messageCount: number;
  lastMessageAt: number;
  updatedAt: number;
}

export interface StorageRetentionPolicy {
  retentionDays: number; // e.g., 30 or 60 days
  maxQuotaBytes: number; // e.g., 8 MB (80% of 10MB limit)
  targetSafeBytes: number; // e.g., 6 MB after FIFO eviction
  autoPurgeEnabled: boolean;
  fifoEvictionEnabled: boolean;
}

export interface StorageUsageStats {
  bytesInUse: number;
  maxQuotaBytes: number;
  totalLimitBytes: number;
  usagePercent: number;
  totalConversations: number;
  totalMessages: number;
  oldestChatTimestamp: number | null;
  retentionDays: number;
}

// ── Storage Keys & Constants ─────────────────────────────────
export const STORAGE_KEYS = {
  INDEX: 'memoreply_local_chat_index',
  POLICY: 'memoreply_storage_policy',
  CHAT_PREFIX: 'memoreply_chat_',
} as const;

export const CHROME_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024; // 10MB Chrome MV3 default limit
export const DEFAULT_MAX_QUOTA_BYTES = 8 * 1024 * 1024; // 8MB trigger threshold (80%)
export const DEFAULT_TARGET_SAFE_BYTES = 6 * 1024 * 1024; // 6MB safe quota target
export const DEFAULT_RETENTION_DAYS = 30; // 30-day default retention

export const DEFAULT_STORAGE_POLICY: StorageRetentionPolicy = {
  retentionDays: DEFAULT_RETENTION_DAYS,
  maxQuotaBytes: DEFAULT_MAX_QUOTA_BYTES,
  targetSafeBytes: DEFAULT_TARGET_SAFE_BYTES,
  autoPurgeEnabled: true,
  fifoEvictionEnabled: true,
};

// ── Chrome Storage Promise Wrappers ──────────────────────────
async function storageGet<T = unknown>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([key], (result) => {
        resolve(result ? (result[key] as T) : undefined);
      });
    } catch {
      resolve(undefined);
    }
  });
}

async function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function storageRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove(keys, () => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * Get current bytes in use by chrome.storage.local.
 */
export async function getBytesInUse(): Promise<number> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local?.getBytesInUse) {
        chrome.storage.local.getBytesInUse(null, (bytes) => {
          resolve(bytes || 0);
        });
      } else {
        // Fallback estimate
        let total = 0;
        chrome.storage.local.get(null, (items) => {
          try {
            total = JSON.stringify(items || {}).length * 2;
          } catch {}
          resolve(total);
        });
      }
    } catch {
      resolve(0);
    }
  });
}

// ── Policy Management ────────────────────────────────────────

/**
 * Retrieve current storage retention policy.
 */
export async function getRetentionPolicy(): Promise<StorageRetentionPolicy> {
  const policy = await storageGet<StorageRetentionPolicy>(STORAGE_KEYS.POLICY);
  return { ...DEFAULT_STORAGE_POLICY, ...(policy || {}) };
}

/**
 * Update storage retention policy (e.g. switch between 30 and 60 days).
 */
export async function updateRetentionPolicy(
  updates: Partial<StorageRetentionPolicy>
): Promise<StorageRetentionPolicy> {
  const current = await getRetentionPolicy();
  const updated: StorageRetentionPolicy = { ...current, ...updates };
  await storageSet({ [STORAGE_KEYS.POLICY]: updated });
  return updated;
}

// ── Index Operations ─────────────────────────────────────────

async function getChatIndex(): Promise<Record<string, LocalChatIndexEntry>> {
  const index = await storageGet<Record<string, LocalChatIndexEntry>>(STORAGE_KEYS.INDEX);
  return index || {};
}

async function saveChatIndex(index: Record<string, LocalChatIndexEntry>): Promise<void> {
  await storageSet({ [STORAGE_KEYS.INDEX]: index });
}

// ── Core Local Chat Storage Operations ───────────────────────

/**
 * Save or update a conversation in chrome.storage.local.
 * Automatically performs:
 * 1. Time-based auto-purge for expired chats (> 30-60 days).
 * 2. FIFO eviction if approaching the 10MB quota.
 */
export async function saveLocalChat(
  conversationData: ConversationData
): Promise<{
  success: boolean;
  chatId: string;
  purgedExpiredCount: number;
  evictedFifoCount: number;
}> {
  const now = Date.now();
  const rawPlatform = conversationData.platform || 'fiverr';
  const platform: SupportedPlatform = (['fiverr', 'upwork', 'linkedin'].includes(rawPlatform.toLowerCase())
    ? rawPlatform.toLowerCase()
    : 'fiverr') as SupportedPlatform;

  const convIdentifier = conversationData.conversationId ?? conversationData.clientUsername ?? 'anonymous_chat';
  const chatId = `${STORAGE_KEYS.CHAT_PREFIX}${platform}_${convIdentifier}`;

  // Parse last message timestamp or fallback to current time
  let lastMessageAt = now;
  if (conversationData.messages && conversationData.messages.length > 0) {
    const lastMsg = conversationData.messages[conversationData.messages.length - 1];
    if (lastMsg.timestamp) {
      const parsed = Date.parse(lastMsg.timestamp);
      if (!isNaN(parsed)) lastMessageAt = parsed;
    }
  }

  // 1. Auto-Purge expired conversations based on policy
  const policy = await getRetentionPolicy();
  let purgedExpiredCount = 0;
  if (policy.autoPurgeEnabled) {
    const purgeResult = await purgeExpiredChats(policy.retentionDays);
    purgedExpiredCount = purgeResult.purgedCount;
  }

  // 2. FIFO Quota Eviction if storage exceeds safe threshold
  let evictedFifoCount = 0;
  if (policy.fifoEvictionEnabled) {
    const fifoResult = await enforceStorageQuotaFIFO(policy.maxQuotaBytes, policy.targetSafeBytes);
    evictedFifoCount = fifoResult.evictedCount;
  }

  // 3. Prepare payload to save
  const existingChat = await storageGet<LocalStoredChat>(chatId);

  // Merge or deduplicate messages
  const existingMessages = existingChat?.messages || [];
  const messageMap = new Map<string, ExtractedMessage>();

  existingMessages.forEach((m) => messageMap.set(m.id, m));
  (conversationData.messages || []).forEach((m) => messageMap.set(m.id, m));

  const mergedMessages = Array.from(messageMap.values());

  const storedChat: LocalStoredChat = {
    id: chatId,
    conversationId: convIdentifier,
    platform,
    clientUsername: conversationData.clientUsername || convIdentifier,
    clientDisplayName: conversationData.clientDisplayName || convIdentifier,
    clientAvatarUrl: conversationData.clientAvatarUrl || null,
    clientEmail: conversationData.clientEmail || existingChat?.clientEmail || null,
    url: conversationData.url,
    messages: mergedMessages,
    messageCount: mergedMessages.length,
    lastMessageAt,
    createdAt: existingChat?.createdAt || now,
    updatedAt: now,
  };

  // 4. Update Index
  const index = await getChatIndex();
  index[chatId] = {
    id: chatId,
    conversationId: convIdentifier,
    platform,
    clientUsername: storedChat.clientUsername,
    clientDisplayName: storedChat.clientDisplayName,
    clientEmail: storedChat.clientEmail,
    messageCount: storedChat.messageCount,
    lastMessageAt: storedChat.lastMessageAt,
    updatedAt: storedChat.updatedAt,
  };

  // 5. Persist to chrome.storage.local
  await storageSet({
    [chatId]: storedChat,
    [STORAGE_KEYS.INDEX]: index,
  });

  console.log(`[Memoreply Privacy Guard] Stored chat locally: ${chatId} (${storedChat.messageCount} messages). Zero cloud upload.`);

  return {
    success: true,
    chatId,
    purgedExpiredCount,
    evictedFifoCount,
  };
}

/**
 * Retrieve a specific local conversation by its platform and conversationId.
 */
export async function getLocalChat(
  platform: SupportedPlatform,
  conversationId: string
): Promise<LocalStoredChat | null> {
  const chatId = `${STORAGE_KEYS.CHAT_PREFIX}${platform}_${conversationId}`;
  const chat = await storageGet<LocalStoredChat>(chatId);
  return chat || null;
}

/**
 * Retrieve all locally stored conversation summaries from index.
 */
export async function getAllLocalChatSummaries(): Promise<LocalChatIndexEntry[]> {
  const index = await getChatIndex();
  return Object.values(index).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

/**
 * Retrieve full chat history for all stored conversations.
 */
export async function getAllLocalChats(): Promise<LocalStoredChat[]> {
  const summaries = await getAllLocalChatSummaries();
  const chatKeys = summaries.map((s) => s.id);
  if (chatKeys.length === 0) return [];

  return new Promise((resolve) => {
    chrome.storage.local.get(chatKeys, (result) => {
      const chats: LocalStoredChat[] = [];
      for (const key of chatKeys) {
        if (result && result[key]) {
          chats.push(result[key] as LocalStoredChat);
        }
      }
      resolve(chats);
    });
  });
}

/**
 * Delete a specific local conversation.
 */
export async function deleteLocalChat(chatId: string): Promise<boolean> {
  const index = await getChatIndex();
  delete index[chatId];

  await storageRemove(chatId);
  await saveChatIndex(index);
  return true;
}

/**
 * Completely wipe all locally stored client chat histories.
 */
export async function clearAllLocalChats(): Promise<void> {
  const index = await getChatIndex();
  const keysToRemove = Object.keys(index);
  keysToRemove.push(STORAGE_KEYS.INDEX);

  await storageRemove(keysToRemove);
  console.log('[Memoreply Privacy Guard] All local chat histories purged completely.');
}

// ── Retention Cleanup: Time-Based Auto-Purge (30-60 Days) ────

/**
 * Purge conversations older than retentionDays (default: 30 days).
 */
export async function purgeExpiredChats(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<{ purgedCount: number; freedKeys: string[] }> {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const index = await getChatIndex();
  const expiredKeys: string[] = [];

  for (const [key, entry] of Object.entries(index)) {
    if (entry.lastMessageAt < cutoffTime) {
      expiredKeys.push(key);
      delete index[key];
    }
  }

  if (expiredKeys.length > 0) {
    await storageRemove(expiredKeys);
    await saveChatIndex(index);
    console.log(`[Memoreply Privacy Guard] Auto-purged ${expiredKeys.length} chats older than ${retentionDays} days.`);
  }

  return {
    purgedCount: expiredKeys.length,
    freedKeys: expiredKeys,
  };
}

// ── Quota Management: FIFO Eviction Strategy ─────────────────

/**
 * Enforces a strict FIFO (First-In, First-Out) quota management strategy.
 * If total chrome.storage.local bytes exceed `maxQuotaBytes` (e.g. 8MB of 10MB),
 * the oldest chats by `lastMessageAt` are evicted until usage drops below `targetSafeBytes`.
 */
export async function enforceStorageQuotaFIFO(
  maxQuotaBytes: number = DEFAULT_MAX_QUOTA_BYTES,
  targetSafeBytes: number = DEFAULT_TARGET_SAFE_BYTES
): Promise<{ evictedCount: number; bytesFreedEstimate: number }> {
  let currentBytes = await getBytesInUse();

  if (currentBytes <= maxQuotaBytes) {
    return { evictedCount: 0, bytesFreedEstimate: 0 };
  }

  console.warn(`[Memoreply Privacy Guard] Storage quota warning: ${currentBytes} bytes exceeds high watermark ${maxQuotaBytes}. Running FIFO eviction...`);

  const index = await getChatIndex();
  // Sort conversations by oldest lastMessageAt first (FIFO)
  const sortedEntries = Object.values(index).sort((a, b) => a.lastMessageAt - b.lastMessageAt);

  let evictedCount = 0;
  const initialBytes = currentBytes;
  const keysToEvict: string[] = [];

  for (const entry of sortedEntries) {
    if (currentBytes <= targetSafeBytes) break;

    keysToEvict.push(entry.id);
    delete index[entry.id];
    evictedCount++;

    // Estimate reduction (average 20KB per conversation)
    currentBytes -= 20 * 1024;
  }

  if (keysToEvict.length > 0) {
    await storageRemove(keysToEvict);
    await saveChatIndex(index);
  }

  const finalBytes = await getBytesInUse();
  const bytesFreed = Math.max(0, initialBytes - finalBytes);

  console.log(`[Memoreply Privacy Guard] FIFO eviction completed. Evicted ${evictedCount} oldest chats. Current usage: ${finalBytes} bytes.`);

  return {
    evictedCount,
    bytesFreedEstimate: bytesFreed,
  };
}

// ── Telemetry & Storage Usage Statistics ─────────────────────

/**
 * Get comprehensive storage usage statistics for UI display.
 */
export async function getStorageUsageStats(): Promise<StorageUsageStats> {
  const bytesInUse = await getBytesInUse();
  const index = await getChatIndex();
  const policy = await getRetentionPolicy();

  const entries = Object.values(index);
  const totalConversations = entries.length;
  const totalMessages = entries.reduce((acc, curr) => acc + (curr.messageCount || 0), 0);

  let oldestChatTimestamp: number | null = null;
  if (entries.length > 0) {
    oldestChatTimestamp = Math.min(...entries.map((e) => e.lastMessageAt));
  }

  const usagePercent = Math.min(100, Math.round((bytesInUse / CHROME_STORAGE_QUOTA_BYTES) * 100));

  return {
    bytesInUse,
    maxQuotaBytes: policy.maxQuotaBytes,
    totalLimitBytes: CHROME_STORAGE_QUOTA_BYTES,
    usagePercent,
    totalConversations,
    totalMessages,
    oldestChatTimestamp,
    retentionDays: policy.retentionDays,
  };
}

