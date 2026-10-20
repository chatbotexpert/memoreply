// ============================================================
// Memoreply — Module 2: Repository Operations & Fact Extractor
// ============================================================

import {
  db,
  type ClientEntity,
  type ConversationEntity,
  type MessageEntity,
  type ClientFactEntity,
  type FactCategory,
  type FactStatus,
  type SellerKnowledgeEntity,
} from './index';
import type { ConversationData } from '../types';
import { pushConversationToCloud } from '../sync/cloudSync';

/**
 * Basic heuristic rule-based fact extractor from message text.
 * Runs locally to detect budget, timeline, and tech specs until full LLM module is connected.
 */
export function extractHeuristicFacts(
  clientId: string,
  messages: MessageEntity[]
): Array<Omit<ClientFactEntity, 'id' | 'createdAt' | 'updatedAt'>> {
  const candidateFacts: Array<Omit<ClientFactEntity, 'id' | 'createdAt' | 'updatedAt'>> = [];

  for (const msg of messages) {
    if (msg.senderRole !== 'client') continue;
    const text = msg.text;

    // 1. Budget detection (e.g. $650, 500 USD, 300$, budget of $xxx)
    const budgetMatch = text.match(/(?:budget\s*(?:is|of|around)?\s*|price\s*|\$)(\$?\d[\d,]*(?:\s*(?:usd|dollars|\$))?)/i);
    if (budgetMatch && budgetMatch[1]) {
      const budgetVal = budgetMatch[1].startsWith('$') ? budgetMatch[1] : `$${budgetMatch[1]}`;
      candidateFacts.push({
        clientId,
        category: 'budget',
        fact: `Budget mentioned: ${budgetVal}`,
        status: 'proposed',
        isConflicted: false,
        source: 'extracted',
        sourceMessageId: msg.id,
      });
    }

    // 2. Timeline detection (e.g. 2 weeks, 14 days, 1 month, ASAP)
    const timelineMatch = text.match(/(?:within|in|by|timeline\s*(?:is|of)?)\s*(\d+\s*(?:days?|weeks?|months?)|asap|urgent)/i);
    if (timelineMatch && timelineMatch[1]) {
      candidateFacts.push({
        clientId,
        category: 'timeline',
        fact: `Timeline requested: ${timelineMatch[1]}`,
        status: 'proposed',
        isConflicted: false,
        source: 'extracted',
        sourceMessageId: msg.id,
      });
    }

    // 3. Technical keywords
    const techKeywords = ['react', 'next.js', 'vue', 'angular', 'typescript', 'javascript', 'tailwind', 'node', 'python', 'chrome extension', 'figma', 'wordpress', 'shopify'];
    const lowerText = text.toLowerCase();
    const foundTech = techKeywords.filter((tech) => lowerText.includes(tech));
    if (foundTech.length > 0) {
      candidateFacts.push({
        clientId,
        category: 'technical',
        fact: `Tech stack mentioned: ${foundTech.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}`,
        status: 'proposed',
        isConflicted: false,
        source: 'extracted',
        sourceMessageId: msg.id,
      });
    }
  }

  return candidateFacts;
}

/**
 * Saves and deduplicates an extracted Fiverr conversation into IndexedDB.
 */
export async function saveExtractedConversation(conversationData: ConversationData): Promise<{
  client: ClientEntity;
  conversation: ConversationEntity;
  savedMessagesCount: number;
  totalClientMessages: number;
  factsCount: number;
}> {
  const now = new Date().toISOString();
  const rawPlatform = conversationData.platform || 'fiverr';
  const platform = (['fiverr', 'upwork', 'linkedin'].includes(rawPlatform.toLowerCase())
    ? rawPlatform.toLowerCase()
    : 'fiverr') as 'fiverr' | 'upwork' | 'linkedin';

  const username = conversationData.clientUsername ?? conversationData.conversationId ?? 'anonymous_client';
  const clientId = `${platform}_${username}`;
  const conversationId = `conv_${platform}_${conversationData.conversationId ?? username}`;

  // 1. Find or create Client
  let client = await db.clients.get(clientId);
  if (!client) {
    client = {
      id: clientId,
      platform,
      platformUserId: username,
      displayName: conversationData.clientDisplayName ?? username,
      avatarUrl: conversationData.clientAvatarUrl ?? null,
      notes: '',
      tags: [`${platform.charAt(0).toUpperCase() + platform.slice(1)} Client`],
      createdAt: now,
      updatedAt: now,
      lastContactAt: now,
    };
    await db.clients.put(client);
  } else {
    // Update display name, avatar and lastContactAt if provided
    client.updatedAt = now;
    client.lastContactAt = now;
    if (conversationData.clientDisplayName) {
      client.displayName = conversationData.clientDisplayName;
    }
    if (conversationData.clientAvatarUrl) {
      client.avatarUrl = conversationData.clientAvatarUrl;
    }
    await db.clients.put(client);
  }

  // 2. Find or create Conversation
  let conversation = await db.conversations.get(conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      clientId,
      platform,
      platformConversationId: conversationData.conversationId ?? username,
      url: conversationData.url,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };
  } else {
    conversation.updatedAt = now;
    conversation.lastMessageAt = now;
    conversation.url = conversationData.url;
  }
  await db.conversations.put(conversation);

  // 3. Prepare and deduplicate messages
  const messageEntities: MessageEntity[] = conversationData.messages.map((m) => ({
    id: `${conversationId}_${m.id}`,
    conversationId,
    clientId,
    sender: m.sender,
    senderRole: m.senderRole,
    text: m.text,
    timestamp: m.timestamp,
    isOwn: m.isOwn,
    extractedAt: conversationData.extractedAt ?? now,
  }));

  if (messageEntities.length > 0) {
    // bulkPut safely inserts new records or updates existing without primary key collision errors
    await db.messages.bulkPut(messageEntities);
  }

  // 4. Extract heuristic facts, detect contradictions, and save
  const heuristicFacts = extractHeuristicFacts(clientId, messageEntities);
  for (const hFact of heuristicFacts) {
    // Check if duplicate fact already exists for this client
    const existing = await db.clientFacts
      .where('clientId')
      .equals(clientId)
      .and((f) => f.fact === hFact.fact)
      .first();

    if (existing) {
      continue;
    }

    // Check for contradiction: does a fact in the same category exist with conflicting details?
    // Especially for budget and timeline
    const conflictingFact = await db.clientFacts
      .where('clientId')
      .equals(clientId)
      .and((f) => (f.category === 'budget' || f.category === 'timeline') && f.category === hFact.category && f.fact !== hFact.fact)
      .first();

    if (conflictingFact) {
      // Flag contradiction on new fact
      await db.clientFacts.add({
        id: `fact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...hFact,
        status: 'proposed',
        isConflicted: true,
        conflictReason: `Differs from earlier ${hFact.category}: "${conflictingFact.fact}"`,
        createdAt: now,
        updatedAt: now,
      });

      // Also flag existing fact so user sees the conflict
      if (!conflictingFact.isConflicted) {
        await db.clientFacts.update(conflictingFact.id, {
          isConflicted: true,
          conflictReason: `Conflicted by new message: "${hFact.fact}"`,
          updatedAt: now,
        });
      }
    } else {
      await db.clientFacts.add({
        id: `fact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...hFact,
        status: 'proposed',
        isConflicted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 5. Cloud Auto-Sync: Asynchronously push encrypted payload to Next.js dashboard
  try {
    pushConversationToCloud(conversationData, client, heuristicFacts).catch((cloudErr) => {
      console.warn('[Memoreply Cloud Auto-Sync] Background push error:', cloudErr);
    });
  } catch {}

  const totalClientMessages = await db.messages.where('clientId').equals(clientId).count();
  const factsCount = await db.clientFacts.where('clientId').equals(clientId).count();

  return {
    client,
    conversation,
    savedMessagesCount: messageEntities.length,
    totalClientMessages,
    factsCount,
  };
}

/**
 * Retrieve a client's full memory record including stored facts and messages.
 */
export async function getClientMemory(clientId: string): Promise<{
  client: ClientEntity | undefined;
  facts: ClientFactEntity[];
  messagesCount: number;
  conversationsCount: number;
}> {
  const client = await db.clients.get(clientId);
  const facts = await db.clientFacts.where('clientId').equals(clientId).reverse().sortBy('createdAt');
  const messagesCount = await db.messages.where('clientId').equals(clientId).count();
  const conversationsCount = await db.conversations.where('clientId').equals(clientId).count();

  return {
    client,
    facts,
    messagesCount,
    conversationsCount,
  };
}

/**
 * Add a manual fact or note to client memory.
 */
export async function addManualFact(
  clientId: string,
  category: FactCategory,
  factText: string,
  status: FactStatus = 'confirmed'
): Promise<ClientFactEntity> {
  const now = new Date().toISOString();
  const newFact: ClientFactEntity = {
    id: `fact_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    clientId,
    category,
    fact: factText.trim(),
    status,
    isConflicted: false,
    source: 'manual',
    sourceMessageId: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.clientFacts.add(newFact);
  return newFact;
}

/**
 * Update the status of a fact ('proposed' | 'confirmed' | 'disputed').
 * If resolved to 'confirmed' or 'disputed', automatically clears the conflict flag.
 */
export async function updateFactStatus(
  factId: string,
  status: FactStatus
): Promise<void> {
  const updates: Partial<ClientFactEntity> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  // Resolving or confirming/disputing clears the visual conflict
  if (status === 'confirmed' || status === 'disputed') {
    updates.isConflicted = false;
    updates.conflictReason = undefined;
  }

  await db.clientFacts.update(factId, updates);
}

/**
 * Delete a specific fact from client memory.
 */
export async function deleteClientFact(factId: string): Promise<void> {
  await db.clientFacts.delete(factId);
}

/**
 * Update client notes.
 */
export async function updateClientNotes(clientId: string, notes: string): Promise<void> {
  await db.clients.update(clientId, {
    notes,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Retrieve overall database statistics.
 */
export async function getDatabaseStats(): Promise<{
  clientsCount: number;
  conversationsCount: number;
  messagesCount: number;
  factsCount: number;
}> {
  const [clientsCount, conversationsCount, messagesCount, factsCount] = await Promise.all([
    db.clients.count(),
    db.conversations.count(),
    db.messages.count(),
    db.clientFacts.count(),
  ]);

  return {
    clientsCount,
    conversationsCount,
    messagesCount,
    factsCount,
  };
}

/**
 * Default initial template for Seller Knowledge Base
 */
export const DEFAULT_SELLER_KNOWLEDGE: SellerKnowledgeEntity = {
  id: 'default_seller',
  businessName: 'HashTurn Freelance Solutions',
  roleTitle: 'Senior Full-Stack Engineer & Extension Specialist',
  professionalIntro:
    'Passionate full-stack engineer and browser extension specialist with 5+ years of experience building reliable, production-grade applications for global clients.',
  servicesOffered: [
    'Chrome Extension Development (MV3)',
    'React & TypeScript Web Applications',
    'Custom Dashboards & Client Portals',
    'API Integrations & Automation',
  ],
  coreSkills: ['React', 'TypeScript', 'Vite', 'Chrome API', 'Node.js', 'TailwindCSS'],
  pricingPolicy: 'Minimum project order $100. Standard hourly equivalent $40/hr. Milestones for projects above $500.',
  revisionPolicy: '2 rounds of revisions included with each delivery. Bug fixes within original scope are always free.',
  communicationHours: 'Monday - Saturday: 9:00 AM - 9:00 PM (GMT+5). Replies within 1-2 hours.',
  customRules: 'Strictly follow Fiverr ToS (never share phone, email, WhatsApp, or outside payment). Always request wireframes or clear requirements before sending custom offers. Offer custom milestones for large projects.',
  updatedAt: new Date().toISOString(),
};

/**
 * Retrieve the seller's profile and knowledge base from Dexie with chrome.storage fallback.
 */
export async function getSellerKnowledge(): Promise<SellerKnowledgeEntity> {
  try {
    const existing = await db.sellerKnowledge.get('default_seller');
    if (existing && existing.businessName) {
      return existing;
    }
  } catch (err) {
    console.warn('[Memoreply] Could not read seller knowledge from Dexie:', err);
  }

  // Fallback to chrome.storage.local if IndexedDB had no record
  try {
    const stored = await chrome.storage.local.get('sellerKnowledge');
    if (stored.sellerKnowledge && typeof stored.sellerKnowledge === 'object') {
      const entity = stored.sellerKnowledge as SellerKnowledgeEntity;
      await db.sellerKnowledge.put(entity).catch(() => {});
      return entity;
    }
  } catch (storageErr) {
    console.warn('[Memoreply] Could not read seller knowledge from storage:', storageErr);
  }

  // Initialize default profile
  await db.sellerKnowledge.put(DEFAULT_SELLER_KNOWLEDGE).catch(() => {});
  chrome.storage.local.set({ sellerKnowledge: DEFAULT_SELLER_KNOWLEDGE }).catch(() => {});
  return DEFAULT_SELLER_KNOWLEDGE;
}

/**
 * Save or update seller knowledge in Dexie and chrome.storage.local.
 */
export async function saveSellerKnowledge(
  knowledge: Partial<SellerKnowledgeEntity>
): Promise<SellerKnowledgeEntity> {
  const current = await getSellerKnowledge();
  const updated: SellerKnowledgeEntity = {
    ...current,
    ...knowledge,
    id: 'default_seller',
    updatedAt: new Date().toISOString(),
  };

  // Persist both to Dexie (IndexedDB) and chrome.storage.local
  await db.sellerKnowledge.put(updated);
  await chrome.storage.local.set({ sellerKnowledge: updated }).catch(() => {});

  return updated;
}

/**
 * Export all data from IndexedDB as JSON for backup or inspection.
 */
export async function exportAllData(): Promise<string> {
  const [clients, conversations, messages, clientFacts, sellerKnowledge] = await Promise.all([
    db.clients.toArray(),
    db.conversations.toArray(),
    db.messages.toArray(),
    db.clientFacts.toArray(),
    db.sellerKnowledge.toArray(),
  ]);

  const payload = {
    app: 'Memoreply',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      clients,
      conversations,
      messages,
      clientFacts,
      sellerKnowledge,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Clear all data from all IndexedDB tables.
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.clients.clear(),
    db.conversations.clear(),
    db.messages.clear(),
    db.clientFacts.clear(),
    db.sellerKnowledge.clear(),
  ]);
}
