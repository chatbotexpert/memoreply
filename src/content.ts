// ============================================================
// Memoreply — Module 1: Fiverr Platform Integration (Content Script)
// ============================================================
// Detects Fiverr inbox conversations, extracts visible messages,
// handles composer draft insertion, and communicates with the
// extension side panel.
// ============================================================

// ── Web App Auth Handshake Bridge (memoreply.com & localhost) ────
const isAuthHost =
  window.location.hostname.includes('memoreply.com') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname.includes('vercel.app');

if (isAuthHost) {
  // Listen for login/signup success broadcast from web app
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'MEMOREPLY_AUTH_PAYLOAD' && event.data?.payload?.token) {
      const auth = event.data.payload;
      chrome.storage.local.set({
        memoreply_auth_session: {
          token: auth.token,
          refreshToken: auth.refreshToken,
          userId: auth.userId,
          email: auth.email,
          name: auth.name || 'Freelancer',
          plan: auth.plan || 'FREE',
          authenticatedAt: Date.now(),
        },
      }).then(() => {
        console.log('[Memoreply] Auth session captured and stored successfully!');
      });
    }
  });

  // Also check if data attribute was set on documentElement
  const authAttr = document.body?.getAttribute('data-memoreply-auth');
  if (authAttr) {
    try {
      const auth = JSON.parse(authAttr);
      if (auth.token) {
        chrome.storage.local.set({
          memoreply_auth_session: {
            token: auth.token,
            userId: auth.userId,
            email: auth.email,
            name: auth.name || 'Freelancer',
            plan: auth.plan || 'FREE',
            authenticatedAt: Date.now(),
          },
        });
      }
    } catch {}
  }
}


import type {
  ConversationData,
  ExtractedMessage,
  ExtensionMessage,
  ExtensionResponse,
  SenderRole,
} from './types';
import { generateDeterministicMessageId } from './utils/deduplication';
import { getAdapterForUrl } from './adapters';
import { MemoreplyFloatingWidget } from './ui/FloatingWidget';

console.log('[Memoreply] Multi-platform content script initialized on:', window.location.href);

/**
 * Check if current page matches any supported platform conversation room (Fiverr, Upwork, LinkedIn)
 */
function isConversationPage(): boolean {
  const url = window.location.href;
  const adapter = getAdapterForUrl(url);
  if (adapter) return true;
  return isFiverrInboxPage();
}

/**
 * Check if the current page is a Fiverr conversation or inbox page.
 */
function isFiverrInboxPage(): boolean {
  const url = window.location.href.toLowerCase();
  return (
    url.includes('fiverr.com/inbox') ||
    url.includes('fiverr.com/messages') ||
    url.includes('fiverr.com/manage_orders') ||
    url.includes('fiverr.com/users/')
  );
}

/**
 * Extract conversation ID or username slug from the current URL.
 */
function extractConversationId(): string | null {
  const url = window.location.href;
  const adapter = getAdapterForUrl(url);
  if (adapter) {
    const id = adapter.extractConversationId();
    if (id) return id;
  }

  // Patterns: /inbox/username or /inbox/conversationId
  const inboxMatch = url.match(/fiverr\.com\/inbox\/([^/?#]+)/i);
  if (inboxMatch && inboxMatch[1]) {
    return decodeURIComponent(inboxMatch[1]);
  }

  // Patterns: /messages/conversationId
  const messagesMatch = url.match(/fiverr\.com\/messages\/([^/?#]+)/i);
  if (messagesMatch && messagesMatch[1]) {
    return decodeURIComponent(messagesMatch[1]);
  }

  // Patterns: /manage_orders/FO123456789
  const orderMatch = url.match(/manage_orders\/([^/?#]+)/i);
  if (orderMatch && orderMatch[1]) {
    return `order-${orderMatch[1]}`;
  }

  return null;
}

/**
 * Regex to extract client email address from messages or profile DOM.
 */
function extractEmailFromText(text: string): string | null {
  if (!text) return null;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(emailRegex);
  if (matches && matches.length > 0) {
    // Filter out common false positives like asset urls or placeholders
    const valid = matches.find((m) => !m.endsWith('.png') && !m.endsWith('.jpg') && !m.includes('example.com'));
    return valid ? valid.toLowerCase() : null;
  }
  return null;
}

/**
 * Scan DOM and message list for client's email address
 */
function detectClientEmail(messages: ExtractedMessage[]): string | null {
  // 1. Scan client messages first
  for (const msg of messages) {
    if (msg.senderRole === 'client' || !msg.isOwn) {
      const email = extractEmailFromText(msg.text);
      if (email) return email;
    }
  }

  // 2. Scan active thread container / contact info links in DOM
  const emailAnchor = document.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
  if (emailAnchor) {
    const raw = emailAnchor.href.replace(/^mailto:/i, '').split('?')[0].trim();
    if (raw) return raw.toLowerCase();
  }

  // 3. Scan user profile sidebar / details panel
  const profilePanel = document.querySelector('[class*="profile"], [class*="contact"], [class*="client-info"], [class*="about-client"]');
  if (profilePanel && profilePanel.textContent) {
    const email = extractEmailFromText(profilePanel.textContent);
    if (email) return email;
  }

  // 4. Fallback: check any remaining message
  for (const msg of messages) {
    const email = extractEmailFromText(msg.text);
    if (email) return email;
  }

  return null;
}

/**
 * Extract client details (username, display name, avatar) from the page.
 */
function extractClientInfo(): {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
} {
  const conversationId = extractConversationId();

  // Common header selectors for client name in Fiverr
  const nameSelectors = [
    '[data-testid="chat-header-user-name"]',
    '[data-testid="conversation-header-name"]',
    '.chat-header [class*="username"]',
    '.chat-header [class*="user-name"]',
    '.chat-header h2',
    '.chat-header h3',
    '[class*="conversation-header"] [class*="name"]',
    '[class*="conversation-header"] h2',
    '[class*="chat-header"] a',
    '[class*="contact-name"]',
    '[class*="recipient-name"]',
  ];

  let displayName: string | null = null;
  for (const selector of nameSelectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text && text.length > 0 && text.length < 60) {
      displayName = text;
      break;
    }
  }

  // Avatar selector
  const avatarSelectors = [
    '[data-testid="chat-header"] img',
    '[class*="chat-header"] img',
    '[class*="conversation-header"] img',
    '.chat-header [role="img"]',
  ];

  let avatarUrl: string | null = null;
  for (const selector of avatarSelectors) {
    const img = document.querySelector<HTMLImageElement>(selector);
    if (img?.src && !img.src.includes('data:image/svg')) {
      avatarUrl = img.src;
      break;
    }
  }

  const username = displayName ?? conversationId;

  return {
    username,
    displayName: displayName ?? username,
    avatarUrl,
  };
}



/**
 * Extract all visible messages from the active Fiverr conversation DOM.
 */
function extractMessages(): ExtractedMessage[] {
  const messages: ExtractedMessage[] = [];
  const seenMessageIds = new Set<string>();
  const conversationId = extractConversationId() || 'fiverr_chat';

  // Common message container selectors in Fiverr inbox/chat layouts
  const containerSelectors = [
    '[data-testid="message-item"]',
    '[data-testid="chat-message"]',
    '[class*="message-item"]',
    '[class*="message-row"]',
    '[class*="chat-message"]',
    '[class*="message-bubble-wrapper"]',
    '[class*="message-wrapper"]',
    '[class*="message_item"]',
    '[class*="chat_message"]',
    'li[class*="message"]',
    'div[role="listitem"]',
    '.message-bubble-wrapper',
    '.chat-box-message',
  ];

  let messageNodes: NodeListOf<Element> | null = null;

  for (const selector of containerSelectors) {
    const nodes = document.querySelectorAll(selector);
    if (nodes.length > 0) {
      messageNodes = nodes;
      break;
    }
  }

  // Fallback: search for chat bubbles directly if message items not grouped
  if (!messageNodes || messageNodes.length === 0) {
    const bubbleNodes = document.querySelectorAll(
      '[class*="message-bubble"], [class*="msg-body"], [class*="message-body"]'
    );
    if (bubbleNodes.length > 0) {
      messageNodes = bubbleNodes;
    }
  }

  if (!messageNodes || messageNodes.length === 0) {
    console.log('[Memoreply] No message elements matched on this page.');
    return messages;
  }

  const { displayName } = extractClientInfo();

  messageNodes.forEach((node) => {
    // Extract text content
    const textSelector = [
      '[data-testid="message-text"]',
      '[class*="message-text"]',
      '[class*="text-content"]',
      '[class*="body-text"]',
      '[class*="msg-text"]',
      '[class*="message-content"]',
      '[class*="message-body"]',
      'p',
    ].join(',');

    const textEl = node.querySelector(textSelector) ?? node;
    const rawText = textEl.textContent?.trim() ?? '';

    // Ignore empty bubbles or system markers with no actual text
    if (!rawText || rawText.length < 1) {
      return;
    }

    // Determine sender and role
    const classList = node.className.toLowerCase();
    const isSeller =
      classList.includes('own') ||
      classList.includes('sent') ||
      classList.includes('outgoing') ||
      classList.includes('me') ||
      classList.includes('from-seller') ||
      classList.includes('sender-me') ||
      classList.includes('is-own') ||
      classList.includes('self') ||
      node.getAttribute('data-is-own') === 'true' ||
      node.getAttribute('data-sender') === 'seller' ||
      node.getAttribute('data-testid') === 'message-from-me';

    const isSystem =
      classList.includes('system') ||
      classList.includes('notice') ||
      classList.includes('event') ||
      classList.includes('order-status');

    const senderRole: SenderRole = isSystem ? 'system' : isSeller ? 'seller' : 'client';
    const sender = isSeller ? 'Me' : isSystem ? 'Fiverr System' : (displayName ?? 'Client');

    // Extract timestamp
    const timeEl =
      node.querySelector('time') ??
      node.querySelector('[data-testid*="time"]') ??
      node.querySelector('[class*="timestamp"]') ??
      node.querySelector('[class*="time"]') ??
      node.querySelector('[class*="date"]');

    const timestamp =
      timeEl?.getAttribute('datetime') ??
      timeEl?.textContent?.trim() ??
      null;

    // Content-based Deduplication ID (No DOM index)
    const id = generateDeterministicMessageId(conversationId, senderRole, timestamp, rawText);

    // Skip if identical message already processed in this batch
    if (seenMessageIds.has(id)) {
      return;
    }
    seenMessageIds.add(id);

    messages.push({
      id,
      sender,
      senderRole,
      text: rawText,
      timestamp,
      isOwn: isSeller,
    });
  });

  return messages;
}

/**
 * Assemble complete conversation data across supported platforms.
 */
function extractCurrentConversation(): ConversationData {
  const adapter = getAdapterForUrl(window.location.href);

  if (adapter) {
    const conversationId = adapter.extractConversationId();
    const clientInfo = adapter.extractClientInfo();
    const messages = adapter.extractMessages();
    const clientEmail = detectClientEmail(messages);
    const status: ConversationData['status'] = messages.length > 0 ? 'active' : 'empty';

    return {
      platform: adapter.platform,
      conversationId,
      clientUsername: clientInfo.username,
      clientDisplayName: clientInfo.displayName,
      clientAvatarUrl: clientInfo.avatarUrl,
      clientEmail,
      messages,
      extractedAt: new Date().toISOString(),
      url: window.location.href,
      status,
    };
  }

  // Fallback heuristic for generic Fiverr inbox
  const isInbox = isFiverrInboxPage();
  const conversationId = extractConversationId();
  const { username, displayName, avatarUrl } = extractClientInfo();
  const messages = isInbox ? extractMessages() : [];
  const clientEmail = detectClientEmail(messages);

  let status: ConversationData['status'] = 'not_found';
  if (isInbox) {
    status = messages.length > 0 ? 'active' : 'empty';
  }

  return {
    platform: 'fiverr',
    conversationId,
    clientUsername: username,
    clientDisplayName: displayName,
    clientAvatarUrl: avatarUrl,
    clientEmail,
    messages,
    extractedAt: new Date().toISOString(),
    url: window.location.href,
    status,
  };
}

/**
 * Insert a draft reply into the active platform's message composer.
 * Safety rule: Focus and set text ONLY — never auto-submit.
 */
function insertDraftIntoComposer(text: string): { success: boolean; message?: string; error?: string } {
  if (!text || text.trim().length === 0) {
    return { success: false, error: 'Empty draft text provided.' };
  }

  const adapter = getAdapterForUrl(window.location.href);
  if (adapter) {
    const success = adapter.insertDraft(text);
    if (success) {
      return {
        success: true,
        message: `Draft inserted into ${adapter.platform.toUpperCase()} composer! Review and send when ready.`,
      };
    }
  }

  // Selectors for Fiverr composer textarea and contenteditable elements
  const composerSelectors = [
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="type" i]',
    'textarea[placeholder*="reply" i]',
    'textarea[name="message"]',
    '[data-testid="chat-input"] textarea',
    '[class*="chat-input"] textarea',
    '[class*="composer"] textarea',
    '[class*="message-box"] textarea',
    '[role="textbox"][contenteditable="true"]',
    '[contenteditable="true"]',
    'textarea',
  ];

  let composer: HTMLElement | null = null;
  for (const selector of composerSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.offsetParent !== null) {
      composer = el;
      break;
    }
  }

  if (!composer) {
    console.warn('[Memoreply] Could not find composer input on page.');
    return {
      success: false,
      error: 'Could not find message composer on this page. Please make sure the conversation is open.',
    };
  }

  try {
    composer.focus();

    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(composer, text);
      } else {
        composer.value = text;
      }

      composer.dispatchEvent(new Event('input', { bubbles: true }));
      composer.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (composer.getAttribute('contenteditable') === 'true') {
      const success = document.execCommand('insertText', false, text);
      if (!success) {
        composer.textContent = text;
      }
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }

    composer.focus();
    composer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log('[Memoreply] Draft inserted into composer successfully (not sent).');
    return {
      success: true,
      message: 'Draft inserted into composer! Review and send when ready.',
    };
  } catch (err) {
    console.error('[Memoreply] Error inserting draft:', err);
    return { success: false, error: `Failed to insert draft: ${String(err)}` };
  }
}

/**
 * Listen for messages from the extension side panel or background script.
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage<unknown>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse<unknown>) => void
  ) => {
    switch (message.type) {
      case 'PING': {
        const adapter = getAdapterForUrl(window.location.href);
        sendResponse({
          success: true,
          data: {
            platform: adapter ? adapter.platform : 'fiverr',
            isInbox: isConversationPage(),
            url: window.location.href,
          },
        });
        return false;
      }

      case 'EXTRACT_CONVERSATION': {
        try {
          const data = extractCurrentConversation();
          // Also persist in local storage for instant side panel retrieval
          chrome.storage.local.set({ currentConversation: data }).catch(() => {});
          sendResponse({
            success: true,
            data,
            message: `Extracted ${data.messages.length} messages.`,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: `Failed to extract conversation: ${String(error)}`,
          });
        }
        return false;
      }

      case 'INSERT_DRAFT': {
        const payload = message.payload as { text?: string } | undefined;
        const text = payload?.text ?? '';
        const result = insertDraftIntoComposer(text);
        sendResponse(result);
        return false;
      }

      default:
        return false;
    }
  }
);

// ============================================================
// Continuous Observer & Dynamic Conversation Detection
// ============================================================

let lastSyncSignature = '';

function checkAndBroadcastConversation(): void {
  if (!isConversationPage()) return;

  try {
    const data = extractCurrentConversation();
    const signature = `${data.conversationId}_${data.messages.length}_${data.messages[data.messages.length - 1]?.id ?? ''}`;

    if (signature !== lastSyncSignature && data.messages.length > 0) {
      lastSyncSignature = signature;
      console.log(
        `[Memoreply] Auto-detected ${data.messages.length} messages for ${data.clientDisplayName ?? 'Client'} (${data.platform}).`
      );

      // 1. Save directly into chrome.storage.local
      chrome.storage.local.set({ currentConversation: data }).catch(() => {});

      // 2. Broadcast to background and side panel via runtime message
      chrome.runtime.sendMessage(
        {
          type: 'CONVERSATION_EXTRACTED',
          payload: data,
        },
        () => {
          if (chrome.runtime.lastError) {
            // Safe to ignore if side panel is closed
          }
        }
      );

      // 3. Update floating widget UI
      if (floatingWidget) {
        floatingWidget.updateState(data.clientDisplayName, data.messages.length);
      } else {
        initFloatingWidget();
      }
    }
  } catch (err) {
    console.warn('[Memoreply] Background extraction warning:', err);
  }
}

// ============================================================
// Floating Extension UI (Vite MV3 Injected Widget)
// ============================================================

let floatingWidget: MemoreplyFloatingWidget | null = null;

function initFloatingWidget(): void {
  if (floatingWidget || !isConversationPage()) return;

  const adapter = getAdapterForUrl(window.location.href);
  const platform = adapter ? adapter.platform : 'fiverr';

  floatingWidget = new MemoreplyFloatingWidget({
    platform,
    onExtract: () => {
      const conv = extractCurrentConversation();
      return {
        clientDisplayName: conv.clientDisplayName,
        messagesCount: conv.messages.length,
        platform: conv.platform,
        conversationId: conv.conversationId,
      };
    },
    onInsertDraft: (text: string) => insertDraftIntoComposer(text),
  });

  floatingWidget.mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingWidget);
} else {
  initFloatingWidget();
}

// 1. Initial extraction on load
setTimeout(checkAndBroadcastConversation, 900);
setTimeout(checkAndBroadcastConversation, 2400);

// 2. Continuous DOM observer for new incoming/outgoing messages
let debounceTimer: number | null = null;
const observer = new MutationObserver(() => {
  if (!isConversationPage()) return;
  if (!floatingWidget) initFloatingWidget();
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(checkAndBroadcastConversation, 800);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 3. Periodic fallback poll (every 4 seconds) to catch SPA navigation
setInterval(() => {
  if (!floatingWidget && isConversationPage()) {
    initFloatingWidget();
  }
  checkAndBroadcastConversation();
}, 4000);
