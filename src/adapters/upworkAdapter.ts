// ============================================================
// Memoreply — Upwork Platform Adapter
// ============================================================
// Isolated content script integration for Upwork messaging rooms.
// Safely extracts job/client message threads and injects drafted responses.
// ============================================================

import type { PlatformAdapter, PlatformClientInfo } from './types';
import type { ExtractedMessage, SenderRole } from '../types';
import { generateDeterministicMessageId } from '../utils/deduplication';

export class UpworkAdapter implements PlatformAdapter {
  readonly platform = 'upwork' as const;

  isMatchingUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('upwork.com/messages') ||
      lower.includes('upwork.com/nx/wm') ||
      lower.includes('upwork.com/ab/messages')
    );
  }

  extractConversationId(): string | null {
    const url = window.location.href;

    // Pattern: /messages/rooms/room_12345 or /nx/wm/workroom/12345
    const roomMatch = url.match(/(?:messages\/rooms|workroom)\/([^/?#]+)/i);
    if (roomMatch && roomMatch[1]) {
      return decodeURIComponent(roomMatch[1]);
    }

    // Pattern: room query param ?room=12345
    const urlObj = new URL(url);
    const roomParam = urlObj.searchParams.get('room');
    if (roomParam) {
      return roomParam;
    }

    // DOM fallback: data attribute on main chat container
    const roomEl = document.querySelector('[data-room-id], [data-qa="room-id"]');
    if (roomEl) {
      const id = roomEl.getAttribute('data-room-id') || roomEl.getAttribute('data-qa="room-id"');
      if (id) return id;
    }

    return null;
  }

  extractClientInfo(): PlatformClientInfo {
    const nameSelectors = [
      '[data-test="room-header-title"]',
      'header.room-header h2',
      '.up-chat-header .up-user-name',
      '[data-qa="room-title"]',
      '.room-title',
      '[data-test="header-name"]',
      '.up-user-name',
    ];

    let displayName: string | null = null;
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      const text = el?.textContent?.trim();
      if (text && text.length > 0 && text.length < 70) {
        displayName = text;
        break;
      }
    }

    const avatarSelectors = [
      '[data-test="room-header"] img',
      '.up-chat-header img',
      '.room-header img',
      '.up-avatar img',
    ];

    let avatarUrl: string | null = null;
    for (const selector of avatarSelectors) {
      const img = document.querySelector<HTMLImageElement>(selector);
      if (img && img.src && !img.src.includes('data:image/svg')) {
        avatarUrl = img.src;
        break;
      }
    }

    const username = displayName ? displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_') : null;

    return {
      username,
      displayName,
      avatarUrl,
    };
  }

  extractMessages(): ExtractedMessage[] {
    const conversationId = this.extractConversationId() || 'upwork_room_unknown';
    const clientInfo = this.extractClientInfo();
    const clientName = clientInfo.displayName || 'Client';

    const messageRowSelectors = [
      '[data-test="message-item"]',
      '.story-message',
      '.up-chat-message',
      '[data-qa="chat-message"]',
      'li[data-test="chat-message"]',
      '.message-container',
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
      // 1. Message Body
      const bodyEl = el.querySelector(
        '[data-test="message-text"], .message-body, .up-chat-message-text, .story-message-text, p'
      );
      const text = bodyEl?.textContent?.trim() || el.textContent?.trim();
      if (!text || text.length === 0) return;

      // 2. Sender role detection
      const isOutbound =
        el.classList.contains('is-self') ||
        el.classList.contains('up-chat-message--outbound') ||
        el.classList.contains('is-outbound') ||
        Boolean(el.querySelector('[data-test="outbound-message"], .is-self'));

      const senderEl = el.querySelector('[data-test="sender-name"], .message-sender, .sender-name, strong');
      const senderText = senderEl?.textContent?.trim();

      const senderRole: SenderRole = isOutbound ? 'seller' : 'client';
      const sender = isOutbound ? 'Me' : senderText || clientName;

      // 3. Timestamp
      const timeEl = el.querySelector(
        '[data-test="message-timestamp"], .message-time, time, .up-chat-message-time'
      );
      const timestamp = timeEl?.textContent?.trim() || null;

      // 4. Deterministic deduplication
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
      'div[contenteditable="true"][data-test="composer-input"]',
      'div[contenteditable="true"].ql-editor',
      'textarea[data-test="composer-textarea"]',
      'textarea.up-chat-composer',
      '[data-qa="message-composer-textarea"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea.up-textarea',
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
      console.warn('[Memoreply Upwork] No composer input element detected.');
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
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(targetInput);
        selection?.removeAllRanges();
        selection?.addRange(range);

        const execSuccess = document.execCommand('insertText', false, text);
        if (execSuccess) {
          targetInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
          return true;
        }
      } catch {}

      targetInput.textContent = text;
      targetInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }
}

export const upworkAdapter = new UpworkAdapter();
