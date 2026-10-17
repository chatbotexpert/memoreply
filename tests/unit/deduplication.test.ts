import { describe, it, expect } from 'vitest';
import {
  generateMessageHash,
  generateDeterministicMessageId,
  deduplicateMessages,
} from '../../src/utils/deduplication';

describe('Message Deduplication Logic (Module 1 & 2)', () => {
  it('generates consistent, deterministic hashes for identical input', () => {
    const input1 = 'Can you build a Chrome extension in React?';
    const input2 = 'Can you build a Chrome extension in React?';
    const hash1 = generateMessageHash(input1);
    const hash2 = generateMessageHash(input2);

    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('generates distinct hashes for different text inputs', () => {
    const hashA = generateMessageHash('My budget is $500');
    const hashB = generateMessageHash('My budget is $1,200');

    expect(hashA).not.toBe(hashB);
  });

  it('generates identical message ID on simulated page reload / DOM re-scrape', () => {
    const conversationId = 'conv_alex_miller';
    const senderRole = 'client';
    const timestamp = '10:45 AM';
    const text = 'Hello, I have an urgent project requiring a custom Chrome Extension.';

    // First scrape
    const idFirstScrape = generateDeterministicMessageId(conversationId, senderRole, timestamp, text);
    // Second scrape after user refreshes page or scrolls
    const idSecondScrape = generateDeterministicMessageId(conversationId, senderRole, timestamp, text);

    expect(idFirstScrape).toBe(idSecondScrape);
    expect(idFirstScrape.startsWith('msg_')).toBe(true);
  });

  it('generates different IDs for different sender roles even with identical text', () => {
    const text = 'Sounds great, looking forward to it!';
    const clientMsgId = generateDeterministicMessageId('conv_1', 'client', '11:00 AM', text);
    const sellerMsgId = generateDeterministicMessageId('conv_1', 'seller', '11:00 AM', text);

    expect(clientMsgId).not.toBe(sellerMsgId);
  });

  it('deduplicates array of messages by unique ID', () => {
    const rawMessages = [
      { id: 'msg_1', text: 'Hello' },
      { id: 'msg_2', text: 'How are you?' },
      { id: 'msg_1', text: 'Hello' }, // duplicate
      { id: 'msg_3', text: 'Can we discuss budget?' },
      { id: 'msg_2', text: 'How are you?' }, // duplicate
    ];

    const deduplicated = deduplicateMessages(rawMessages);

    expect(deduplicated).toHaveLength(3);
    expect(deduplicated.map((m) => m.id)).toEqual(['msg_1', 'msg_2', 'msg_3']);
  });
});
