// ============================================================
// Memoreply — Background Service Worker
// ============================================================
// Handles extension lifecycle, side panel management, and message routing.
// Operates with zero external ChatGPT tab handoffs or redirects.
// ============================================================

/**
 * Open the side panel when the extension action button is clicked.
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('[Memoreply] Side panel opened for tab:', tab.id);
    } catch (error) {
      console.error('[Memoreply] Failed to open side panel:', error);
    }
  }
});

/**
 * Set the side panel behavior — open on action click.
 */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error('[Memoreply] Failed to set panel behavior:', error);
});

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

    // 1. Conversation caching
    case 'CONVERSATION_EXTRACTED':
    case 'CONVERSATION_DATA': {
      chrome.storage.local
        .set({ currentConversation: message.payload })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    case 'GET_CONVERSATION': {
      chrome.storage.local
        .get('currentConversation')
        .then((result) => sendResponse({ success: true, data: result.currentConversation ?? null }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    // 2. Draft insertion into active platform composer (Fiverr, Upwork, LinkedIn)
    case 'INSERT_DRAFT': {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
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
 * Extension install/update handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Memoreply] Extension installed. Inline AI Engine ready.');
  } else if (details.reason === 'update') {
    console.log('[Memoreply] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

export {};
