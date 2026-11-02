// ============================================================
// Memoreply — Background Service Worker
// ============================================================
// Handles extension lifecycle, action popup integration, and message routing.
// Operates with zero external ChatGPT tab handoffs or redirects.
// ============================================================

import {
  saveLocalChat,
  getStorageUsageStats,
  purgeExpiredChats,
  enforceStorageQuotaFIFO,
  updateRetentionPolicy,
  getRetentionPolicy,
} from './utils/localChatStorage';

/**
 * Message router — handles communications between side panel and active tab content scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    // 0. Worker Ping / Version Check
    case 'MEMOREPLY_PING': {
      sendResponse({ success: true, version: '0.2.0', ready: true });
      return false;
    }

    // 1. Conversation local-first storage & quota guard
    case 'CONVERSATION_EXTRACTED':
    case 'CONVERSATION_DATA': {
      if (message.payload) {
        // Automatically save to chrome.storage.local with FIFO & 30-day purge
        saveLocalChat(message.payload)
          .then((result) => {
            chrome.storage.local.set({ currentConversation: message.payload });
            sendResponse({ ...result });
          })
          .catch((error) => {
            chrome.storage.local.set({ currentConversation: message.payload });
            sendResponse({ success: false, error: String(error) });
          });
        return true;
      }
      sendResponse({ success: false, error: 'Empty payload' });
      return false;
    }

    case 'GET_CONVERSATION': {
      chrome.storage.local
        .get('currentConversation')
        .then((result) => sendResponse({ success: true, data: result.currentConversation ?? null }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    // Storage Quota & Retention Telemetry
    case 'GET_STORAGE_STATS': {
      getStorageUsageStats()
        .then((stats) => sendResponse({ success: true, stats }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    case 'PURGE_EXPIRED_CHATS': {
      purgeExpiredChats(message.payload?.retentionDays)
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    case 'UPDATE_STORAGE_POLICY': {
      updateRetentionPolicy(message.payload)
        .then((policy) => sendResponse({ success: true, policy }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    case 'GET_STORAGE_POLICY': {
      getRetentionPolicy()
        .then((policy) => sendResponse({ success: true, policy }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    // 2. Draft insertion into active platform composer (Fiverr, Upwork, LinkedIn)
    case 'INSERT_DRAFT': {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs
            .sendMessage(activeTab.id, {
              type: 'INSERT_DRAFT',
              payload: message.payload,
            })
            .then((response) => sendResponse(response))
            .catch((error) => sendResponse({ success: false, error: String(error) }));
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true;
    }

    default:
      return false;
  }
});

/**
 * Extension install/update & startup cleanup handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Memoreply] Extension installed. Inline AI Engine ready.');
  } else if (details.reason === 'update') {
    console.log('[Memoreply] Extension updated to version:', chrome.runtime.getManifest().version);
  }

  // Run initial retention audit & FIFO quota check
  purgeExpiredChats(30).catch(() => {});
  enforceStorageQuotaFIFO().catch(() => {});
});

export {};
