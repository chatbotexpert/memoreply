import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db';
import {
  extractHeuristicFacts,
  saveExtractedConversation,
  updateFactStatus,
  getClientMemory,
} from '../../src/db/repository';
import type { MessageEntity } from '../../src/db';
import type { ConversationData } from '../../src/types';

describe('Advanced Memory Flags & Contradiction Detection (Module 2)', () => {
  beforeEach(async () => {
    await db.clients.clear();
    await db.conversations.clear();
    await db.messages.clear();
    await db.clientFacts.clear();
    await db.sellerKnowledge.clear();
  });

  it('extracts heuristic facts and assigns proposed status by default', () => {
    const mockMessages: MessageEntity[] = [
      {
        id: 'msg_1',
        conversationId: 'conv_1',
        clientId: 'fiverr_client1',
        sender: 'Client User',
        senderRole: 'client',
        text: 'Hello, our budget is $800 and we need this within 2 weeks built in React and TypeScript.',
        timestamp: '10:00 AM',
        isOwn: false,
        extractedAt: new Date().toISOString(),
      },
    ];

    const facts = extractHeuristicFacts('fiverr_client1', mockMessages);

    expect(facts.length).toBeGreaterThanOrEqual(3);

    const budgetFact = facts.find((f) => f.category === 'budget');
    expect(budgetFact).toBeDefined();
    expect(budgetFact?.fact).toBe('Budget mentioned: $800');
    expect(budgetFact?.status).toBe('proposed');
    expect(budgetFact?.isConflicted).toBe(false);

    const timelineFact = facts.find((f) => f.category === 'timeline');
    expect(timelineFact).toBeDefined();
    expect(timelineFact?.fact).toBe('Timeline requested: 2 weeks');
    expect(timelineFact?.status).toBe('proposed');

    const techFact = facts.find((f) => f.category === 'technical');
    expect(techFact).toBeDefined();
    expect(techFact?.fact).toContain('React');
    expect(techFact?.fact).toContain('Typescript');
  });

  it('detects and flags memory conflicts when a new conversation contradicts saved facts', async () => {
    // 1. First sync with initial budget of $500
    const initialConversation: ConversationData = {
      conversationId: 'conv_john_doe',
      clientUsername: 'john_doe',
      clientDisplayName: 'John Doe',
      clientAvatarUrl: null,
      url: 'https://www.fiverr.com/inbox/john_doe',
      extractedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_101',
          sender: 'John Doe',
          senderRole: 'client',
          text: 'My initial budget is $500 for the basic prototype.',
          timestamp: '9:00 AM',
          isOwn: false,
        },
      ],
    };

    await saveExtractedConversation(initialConversation);

    // Verify initial fact stored without conflict
    let memory = await getClientMemory('fiverr_john_doe');
    expect(memory.facts).toHaveLength(1);
    expect(memory.facts[0].fact).toBe('Budget mentioned: $500');
    expect(memory.facts[0].isConflicted).toBe(false);

    // 2. Second sync with contradicting budget: $1200
    const updatedConversation: ConversationData = {
      ...initialConversation,
      messages: [
        ...initialConversation.messages,
        {
          id: 'msg_102',
          sender: 'John Doe',
          senderRole: 'client',
          text: 'We increased our scope, our budget is $1200 now.',
          timestamp: '11:00 AM',
          isOwn: false,
        },
      ],
    };

    await saveExtractedConversation(updatedConversation);

    // 3. Verify that contradiction was detected
    memory = await getClientMemory('fiverr_john_doe');
    expect(memory.facts.length).toBe(2);

    const conflictingFacts = memory.facts.filter((f) => f.isConflicted);
    expect(conflictingFacts.length).toBeGreaterThanOrEqual(1);

    const newFact = memory.facts.find((f) => f.fact === 'Budget mentioned: $1200');
    expect(newFact).toBeDefined();
    expect(newFact?.isConflicted).toBe(true);
    expect(newFact?.conflictReason).toContain('Differs from earlier budget');
  });

  it('resolves conflict flag when user updates status to confirmed', async () => {
    const clientId = 'fiverr_sarah';

    // Directly seed a conflicted fact
    const factId = 'fact_conflicted_1';
    await db.clientFacts.add({
      id: factId,
      clientId,
      category: 'budget',
      fact: 'Budget mentioned: $1,500',
      status: 'proposed',
      isConflicted: true,
      conflictReason: 'Differs from earlier budget record of $1,000',
      source: 'extracted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let fact = await db.clientFacts.get(factId);
    expect(fact?.isConflicted).toBe(true);

    // User confirms the new fact in UI
    await updateFactStatus(factId, 'confirmed');

    fact = await db.clientFacts.get(factId);
    expect(fact?.status).toBe('confirmed');
    expect(fact?.isConflicted).toBe(false);
    expect(fact?.conflictReason).toBeUndefined();
  });
});
