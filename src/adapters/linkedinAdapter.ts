// ============================================================
// Memoreply — LinkedIn Platform Adapter
// ============================================================
// Isolated content script integration for LinkedIn Messaging.
// Safely detects active contacts, extracts message threads, and injects drafted responses.
// ============================================================

import type { PlatformAdapter, PlatformClientInfo } from './types';
import type { ExtractedMessage, SenderRole } from '../types';
import { generateDeterministicMessageId } from '../utils/deduplication';

export class LinkedInAdapter implements PlatformAdapter {
  readonly platform = 'linkedin' as const;

  isMatchingUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('linkedin.com/messaging');
  }

  extractConversationId(): string | null {
    const url = window.location.href;

    // Pattern: /messaging/thread/2-Yz... or /messaging/thread/urn:li:fs_conversation:...
    const threadMatch = url.match(/messaging\/thread\/([^/?#]+)/i);
    if (threadMatch && threadMatch[1]) {
      return decodeURIComponent(threadMatch[1]);
    }

    // Active conversation list item in DOM
    const activeItem = document.querySelector(
      '.msg-conversation-listitem--selected, [data-conversation-id].active'
    );
    if (activeItem) {
      const dataId = activeItem.getAttribute('data-conversation-id');
      if (dataId) return dataId;
    }

    return null;
  }

  extractClientInfo(): PlatformClientInfo {
    const nameSelectors = [
      '.msg-entity-lockup__entity-title',
      '.msg-conversation-topcard__name',
      'h2.msg-conversation-topcard__name',
      '[data-view-name="message-thread-topcard-profile-link"]',
      '.msg-thread__link-to-profile',
      '.msg-title_title',
      'a[data-control-name="topcard"]',
    ];

    let displayName: string | null = null;
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      const text = el?.textContent?.trim();
      if (text && text.length > 0 && text.length < 80) {
        displayName = text;
        break;
      }
    }

    const avatarSelectors = [
      '.msg-conversation-topcard__photo img',
      '.msg-entity-lockup__entity-info img',
      '.msg-conversation-card__profile-image img',
      '.presence-entity__image',
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
    const conversationId = this.extractConversationId() || 'linkedin_thread_unknown';
    const clientInfo = this.extractClientInfo();
    const clientName = clientInfo.displayName || 'LinkedIn Contact';

    const messageEventSelectors = [
      '.msg-s-message-list__event',
      'li.msg-s-message-list__item',
      '.msg-s-event-listitem',
      '[data-event-urn]',
    ];

    let rowElements: Element[] = [];
    for (const selector of messageEventSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        rowElements = Array.from(found);
        break;
      }
    }

    const extracted: ExtractedMessage[] = [];

    rowElements.forEach((el) => {
      // 1. Text body
      const bodyEl = el.querySelector(
        '.msg-s-event-listitem__body, p.msg-s-event-listitem__body, .msg-s-message-group__content p'
      );
      const text = bodyEl?.textContent?.trim() || el.textContent?.trim();
      if (!text || text.length === 0) return;

      // 2. Sender role
      const isOutbound =
        el.classList.contains('msg-s-message-list__event--from-viewer') ||
        el.classList.contains('msg-s-event-listitem--other') === false &&
        Boolean(el.closest('.msg-s-message-list__event--from-viewer'));

      const senderEl = el.querySelector(
        '.msg-s-message-group__name, .msg-s-message-group__profile-link, strong'
      );
      const senderText = senderEl?.textContent?.trim();

      const senderRole: SenderRole = isOutbound ? 'seller' : 'client';
      const sender = isOutbound ? 'Me' : senderText || clientName;

      // 3. Timestamp
      const timeEl = el.querySelector(
        'time.msg-s-message-group__timestamp, .msg-s-message-list__time-heading, time'
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
      'div.msg-form__contenteditable[contenteditable="true"]',
      'div[role="textbox"][aria-label*="message" i]',
      'div[contenteditable="true"].msg-form__msg-content-container',
      'div[contenteditable="true"]',
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
      console.warn('[Memoreply LinkedIn] No composer input element detected.');
      return false;
    }

    targetInput.focus();

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

    // Fallback: direct innerHTML paragraph replacement expected by LinkedIn Draft editor
    targetInput.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    targetInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
}

export const linkedinAdapter = new LinkedInAdapter();
