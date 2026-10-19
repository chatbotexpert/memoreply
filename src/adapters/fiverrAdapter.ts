// ============================================================
// Memoreply — Fiverr Platform Adapter
// ============================================================
// Content script integration for Fiverr inbox & message threads.
// ============================================================

import type { PlatformAdapter, PlatformClientInfo } from './types';
import type { ExtractedMessage, SenderRole } from '../types';
import { generateDeterministicMessageId } from '../utils/deduplication';

export class FiverrAdapter implements PlatformAdapter {
  readonly platform = 'fiverr' as const;

  isMatchingUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('fiverr.com/inbox') ||
      lower.includes('fiverr.com/messages') ||
      lower.includes('fiverr.com/manage_orders') ||
      lower.includes('fiverr.com/users/')
    );
  }

  extractConversationId(): string | null {
    const url = window.location.href;

    const inboxMatch = url.match(/fiverr\.com\/inbox\/([^/?#]+)/i);
    if (inboxMatch && inboxMatch[1]) {
      return decodeURIComponent(inboxMatch[1]);
    }

    const messagesMatch = url.match(/fiverr\.com\/messages\/([^/?#]+)/i);
    if (messagesMatch && messagesMatch[1]) {
      return decodeURIComponent(messagesMatch[1]);
    }

    const orderMatch = url.match(/manage_orders\/([^/?#]+)/i);
    if (orderMatch && orderMatch[1]) {
      return `order-${orderMatch[1]}`;
    }

    return null;
  }

  extractClientInfo(): PlatformClientInfo {
    const conversationId = this.extractConversationId();

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

    const avatarSelectors = [
      '[data-testid="chat-header"] img',
      '[class*="chat-header"] img',
      '[class*="conversation-header"] img',
      '.chat-header [role="img"]',
      '.conversation-header [role="img"]',
    ];

    let avatarUrl: string | null = null;
    for (const selector of avatarSelectors) {
      const img = document.querySelector<HTMLImageElement>(selector);
      if (img && img.src && !img.src.includes('data:image/svg')) {
        avatarUrl = img.src;
        break;
      }
    }

    let username: string | null = null;
    if (conversationId && !conversationId.startsWith('order-')) {
      username = conversationId;
    } else if (displayName) {
      username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    return {
      username,
      displayName,
      avatarUrl,
    };
  }

  extractMessages(): ExtractedMessage[] {
    const conversationId = this.extractConversationId() || 'fiverr_unknown';
    const clientInfo = this.extractClientInfo();
    const clientName = clientInfo.displayName || clientInfo.username || 'Client';

    const messageRowSelectors = [
      '[data-testid="message-item"]',
      '[data-testid="chat-message"]',
      '[class*="message-item"]',
      '[class*="chat-message"]',
      '.message-row',
      '.chat-row',
      'li[class*="message"]',
    ];

    let rowElements: Element[] = [];
    for (const selector of messageRowSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        rowElements = Array.from(found);
        break;
      }
    }

    const extracted: ExtractedMessage[] = [];

    rowElements.forEach((el) => {
      const bodyEl = el.querySelector(
        '[data-testid="message-text"], [class*="message-text"], [class*="message-body"], .message-text, .text-content, p'
      );
      const text = bodyEl?.textContent?.trim() || el.textContent?.trim();
      if (!text || text.length === 0) return;

      const isOutbound =
        el.classList.contains('is-me') ||
        el.classList.contains('me') ||
        el.classList.contains('sent') ||
        el.classList.contains('outbound') ||
        Boolean(el.querySelector('[class*="is-me"], [class*="outbound"], [data-testid="me"]'));

      const senderEl = el.querySelector(
        '[data-testid="message-sender"], [class*="sender-name"], .sender, strong'
      );
      const senderText = senderEl?.textContent?.trim();

      const senderRole: SenderRole = isOutbound ? 'seller' : 'client';
      const sender = isOutbound ? 'Me' : senderText || clientName;

      const timeEl = el.querySelector(
        '[data-testid="message-time"], [class*="message-time"], [class*="timestamp"], time, .time'
      );
      const timestamp = timeEl?.textContent?.trim() || null;

      const deterministicId = generateDeterministicMessageId(
        conversationId,
        senderRole,
        timestamp,
        text
      );

      extracted.push({
        id: deterministicId,
        sender,
        senderRole,
        text,
        timestamp,
        isOwn: isOutbound,
      });
    });

    return extracted;
  }

  insertDraft(text: string): boolean {
    const inputSelectors = [
      'textarea[data-testid="message-input"]',
      'textarea[name="message"]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      'div[contenteditable="true"][data-testid="message-input"]',
      'div[contenteditable="true"][role="textbox"]',
      '.chat-composer textarea',
      '#message_body',
    ];

    let targetInput: HTMLElement | null = null;
    for (const sel of inputSelectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el && el.offsetParent !== null) {
        targetInput = el;
        break;
      }
    }

    if (!targetInput) {
      console.warn('[Memoreply Fiverr] No composer input element detected.');
      return false;
    }

    targetInput.focus();

    if (targetInput instanceof HTMLTextAreaElement) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(targetInput, text);
      } else {
        targetInput.value = text;
      }

      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (targetInput.isContentEditable) {
      targetInput.textContent = text;
      targetInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }
}

export const fiverrAdapter = new FiverrAdapter();
