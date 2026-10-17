import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db';
import { assembleContext } from '../../src/ai/contextAssembler';
import { saveSellerKnowledge, addManualFact, DEFAULT_SELLER_KNOWLEDGE } from '../../src/db/repository';

describe('Context Retrieval & Assembly Engine (Module 3 & 7)', () => {
  beforeEach(async () => {
    // Clear in-memory Dexie database before each test
    await db.clients.clear();
    await db.conversations.clear();
    await db.messages.clear();
    await db.clientFacts.clear();
    await db.sellerKnowledge.clear();
  });

  it('assembles system prompt containing strict Fiverr compliance rules', async () => {
    await saveSellerKnowledge(DEFAULT_SELLER_KNOWLEDGE);

    const context = await assembleContext({
      clientId: 'fiverr_test_user',
      conversationId: 'conv_test_1',
      tone: 'Professional',
    });

    expect(context.systemPrompt).toContain('STRICT FIVERR POLICY COMPLIANCE');
    expect(context.systemPrompt).toContain('NEVER propose or share off-platform contact information');
    expect(context.systemPrompt).toContain('no email addresses, phone numbers, WhatsApp, Telegram, Skype');
  });

  it('injects seller knowledge base into system prompt', async () => {
    await saveSellerKnowledge({
      ...DEFAULT_SELLER_KNOWLEDGE,
      businessName: 'Apex Web Studio',
      roleTitle: 'Principal Extension Architect',
      pricingPolicy: 'Minimum order $250. Hourly $60/hr.',
    });

    const context = await assembleContext({
      clientId: 'fiverr_test_user',
      conversationId: 'conv_test_1',
      tone: 'Professional',
    });

    expect(context.systemPrompt).toContain('Apex Web Studio');
    expect(context.systemPrompt).toContain('Principal Extension Architect');
    expect(context.systemPrompt).toContain('Minimum order $250');
  });

  it('filters out disputed facts and retains confirmed facts', async () => {
    const clientId = 'fiverr_alex';
    await saveSellerKnowledge(DEFAULT_SELLER_KNOWLEDGE);

    // Add a confirmed fact and a disputed fact
    await addManualFact(clientId, 'budget', 'Budget: $500', 'confirmed');
    const disputed = await addManualFact(clientId, 'timeline', 'Timeline: 3 days', 'disputed');
    // Ensure disputed status is set
    await db.clientFacts.update(disputed.id, { status: 'disputed' });

    const context = await assembleContext({
      clientId,
      conversationId: 'conv_alex',
      tone: 'Friendly',
    });

    const factsText = context.userPrompt;
    expect(factsText).toContain('Budget: $500');
    expect(factsText).not.toContain('Timeline: 3 days');
  });

  it('adapts prompt instructions based on requested tone', async () => {
    await saveSellerKnowledge(DEFAULT_SELLER_KNOWLEDGE);

    const conciseContext = await assembleContext({
      clientId: 'fiverr_test_user',
      conversationId: 'conv_test_1',
      tone: 'Concise',
    });
    expect(conciseContext.userPrompt).toContain('Crisp, direct, and brief (2-4 sentences max)');

    const pitchContext = await assembleContext({
      clientId: 'fiverr_test_user',
      conversationId: 'conv_test_1',
      tone: 'Pitch / Offer',
    });
    expect(pitchContext.userPrompt).toContain('Confident, persuasive, and value-focused');
  });
});
