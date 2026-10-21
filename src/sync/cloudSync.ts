// ============================================================
// Memoreply — Extension-to-Cloud Auto-Sync & Offline Queue
// ============================================================
// Automatically pushes extracted conversations, client records,
// and memory facts to the Next.js Cloud Dashboard via POST /api/sync.
// Features offline-first queuing with automatic retry when online.
// ============================================================

import type { ConversationData } from '../types';
import type { ClientEntity, ClientFactEntity, SellerKnowledgeEntity } from '../db';

export interface CloudSyncSettings {
  apiToken: string;
  syncEndpoint: string;
  autoSyncEnabled: boolean;
}

export interface QueuedSyncPayload {
  id: string;
  payload: Record<string, unknown>;
  queuedAt: string;
  retryCount: number;
}

const DEFAULT_SYNC_ENDPOINT = 'https://memoreply-cfy8.vercel.app/api/sync';
const DEFAULT_API_TOKEN = 'memo_live_9f82d1b68536c045968186fcb699';
const STORAGE_QUEUE_KEY = 'memoreply_offline_sync_queue';
const MAX_RETRIES = 5;

/**
 * Retrieve active cloud sync credentials and settings from chrome.storage.local
 */
export async function getCloudSyncSettings(): Promise<CloudSyncSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [
        'memoreply_cloud_api_token',
        'memoreply_cloud_sync_endpoint',
        'memoreply_cloud_auto_sync',
      ],
      (result: Record<string, any>) => {
        resolve({
          apiToken: (result.memoreply_cloud_api_token as string) || DEFAULT_API_TOKEN,
          syncEndpoint: (result.memoreply_cloud_sync_endpoint as string) || DEFAULT_SYNC_ENDPOINT,
          autoSyncEnabled: result.memoreply_cloud_auto_sync !== false,
        });
      }
    );
  });
}

/**
 * Save cloud sync credentials to chrome.storage.local
 */
export async function saveCloudSyncSettings(settings: Partial<CloudSyncSettings>): Promise<void> {
  return new Promise((resolve) => {
    const toSave: Record<string, unknown> = {};
    if (settings.apiToken !== undefined) toSave.memoreply_cloud_api_token = settings.apiToken;
    if (settings.syncEndpoint !== undefined) toSave.memoreply_cloud_sync_endpoint = settings.syncEndpoint;
    if (settings.autoSyncEnabled !== undefined) toSave.memoreply_cloud_auto_sync = settings.autoSyncEnabled;

    chrome.storage.local.set(toSave, () => {
      resolve();
    });
  });
}

/**
 * Push an extracted conversation, client, and facts payload to the Cloud Dashboard.
 * Offline-first: If network fails or is offline, queues the payload for automatic retry.
 */
export async function pushConversationToCloud(
  conversation: ConversationData,
  client: ClientEntity,
  facts?: Array<Omit<ClientFactEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  sellerKnowledge?: SellerKnowledgeEntity
): Promise<{ success: boolean; queued?: boolean; error?: string }> {
  try {
    const settings = await getCloudSyncSettings();
    if (!settings.autoSyncEnabled) {
      return { success: true, queued: false };
    }

    const payload = {
      apiKey: settings.apiToken,
      client: {
        id: client.id,
        platform: client.platform,
        platformUserId: client.platformUserId,
        displayName: client.displayName,
        avatarUrl: client.avatarUrl,
        notes: client.notes,
      },
      conversation: {
        conversationId: conversation.conversationId || client.platformUserId,
        platform: conversation.platform,
        status: conversation.status,
        url: conversation.url,
        messages: conversation.messages.map((m) => ({
          messageId: m.id,
          senderRole: m.senderRole,
          senderName: m.sender,
          text: m.text,
          timestamp: m.timestamp || new Date().toISOString(),
        })),
      },
      facts: (facts || []).map((f) => ({
        category: f.category,
        fact: f.fact,
        status: f.status,
        conflictReason: f.conflictReason,
        source: f.source,
      })),
      sellerKnowledge: sellerKnowledge
        ? {
            businessName: sellerKnowledge.businessName,
            roleTitle: sellerKnowledge.roleTitle,
            professionalIntro: sellerKnowledge.professionalIntro,
            servicesOffered: sellerKnowledge.servicesOffered,
            coreSkills: sellerKnowledge.coreSkills,
            pricingPolicy: sellerKnowledge.pricingPolicy,
            revisionPolicy: sellerKnowledge.revisionPolicy,
            communicationHours: sellerKnowledge.communicationHours,
            customRules: sellerKnowledge.customRules,
          }
        : undefined,
    };

    // If device is offline, enqueue immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await enqueueOfflinePayload(payload);
      return { success: true, queued: true };
    }

    // Transmit to Cloud Endpoint
    const response = await fetch(settings.syncEndpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${settings.apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Memoreply Cloud Sync] Server returned non-200. Queuing payload for retry:', errorText);
      await enqueueOfflinePayload(payload);
      return { success: false, queued: true, error: errorText };
    }

    const result = await response.json();
    console.log('[Memoreply Cloud Sync] Synced successfully with dashboard:', result);

    // Drain any remaining offline queued items
    flushOfflineSyncQueue().catch((err) =>
      console.warn('[Memoreply Cloud Sync] Queue drain error:', err)
    );

    return { success: true, queued: false };
  } catch (err) {
    console.warn('[Memoreply Cloud Sync] Network error during push. Enqueuing for retry:', err);
    try {
      await enqueueOfflinePayload({
        apiKey: DEFAULT_API_TOKEN,
        conversationId: conversation.conversationId,
        platform: conversation.platform,
        messagesCount: conversation.messages.length,
      });
    } catch {}

    return {
      success: false,
      queued: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Add a failed/offline payload to the local storage queue
 */
async function enqueueOfflinePayload(payload: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_QUEUE_KEY], (res: Record<string, any>) => {
      const queue: QueuedSyncPayload[] = (res[STORAGE_QUEUE_KEY] as QueuedSyncPayload[]) || [];
      const item: QueuedSyncPayload = {
        id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        payload,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(item);
      chrome.storage.local.set({ [STORAGE_QUEUE_KEY]: queue }, () => {
        console.log(`[Memoreply Cloud Sync] Enqueued offline payload. Queue size: ${queue.length}`);
        resolve();
      });
    });
  });
}

/**
 * Flush and retry all payloads stored in the offline sync queue
 */
export async function flushOfflineSyncQueue(): Promise<{ processed: number; remaining: number }> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_QUEUE_KEY], async (res: Record<string, any>) => {
      const queue: QueuedSyncPayload[] = (res[STORAGE_QUEUE_KEY] as QueuedSyncPayload[]) || [];
      if (queue.length === 0) {
        return resolve({ processed: 0, remaining: 0 });
      }

      const settings = await getCloudSyncSettings();
      const remaining: QueuedSyncPayload[] = [];
      let processed = 0;

      for (const item of queue) {
        if (item.retryCount >= MAX_RETRIES) {
          console.warn(`[Memoreply Cloud Sync] Dropping payload ${item.id} after ${MAX_RETRIES} attempts.`);
          continue;
        }

        try {
          const res = await fetch(settings.syncEndpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${settings.apiToken}`,
            },
            body: JSON.stringify(item.payload),
          });

          if (res.ok) {
            processed++;
          } else {
            item.retryCount++;
            remaining.push(item);
          }
        } catch {
          item.retryCount++;
          remaining.push(item);
        }
      }

      chrome.storage.local.set({ [STORAGE_QUEUE_KEY]: remaining }, () => {
        console.log(`[Memoreply Cloud Sync] Flushed queue. Processed: ${processed}, Remaining: ${remaining.length}`);
        resolve({ processed, remaining: remaining.length });
      });
    });
  });
}

// Register online event listener to trigger queue flush when connectivity returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Memoreply Cloud Sync] Connectivity restored. Flushing offline sync queue...');
    flushOfflineSyncQueue();
  });
}
