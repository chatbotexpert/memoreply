// ============================================================
// Memoreply — IndexedDB Database Schema (Dexie)
// ============================================================

import Dexie, { type EntityTable } from 'dexie';
import type { SenderRole } from '../types';

export interface ClientEntity {
  id: string; // e.g. 'fiverr_alex_miller_dev' or 'upwork_room_123'
  platform: 'fiverr' | 'upwork' | 'linkedin';
  platformUserId: string;
  displayName: string;
  avatarUrl?: string | null;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastContactAt: string;
}

export interface ConversationEntity {
  id: string; // e.g. 'conv_fiverr_alex_miller_dev'
  clientId: string;
  platform: 'fiverr' | 'upwork' | 'linkedin';
  platformConversationId: string;
  url: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEntity {
  id: string; // Composite unique key: `${conversationId}_${messageHash}`
  conversationId: string;
  clientId: string;
  sender: string;
  senderRole: SenderRole;
  text: string;
  timestamp: string | null;
  isOwn: boolean;
  extractedAt: string;
}

export type FactCategory =
  | 'budget'
  | 'timeline'
  | 'technical'
  | 'preference'
  | 'project'
  | 'general';

export type FactStatus = 'proposed' | 'confirmed' | 'disputed';

export interface ClientFactEntity {
  id: string;
  clientId: string;
  category: FactCategory;
  fact: string;
  status: FactStatus;
  isConflicted?: boolean;
  conflictReason?: string;
  source: 'extracted' | 'manual';
  sourceMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerKnowledgeEntity {
  id: string; // 'default_seller'
  businessName: string;
  roleTitle: string;
  professionalIntro?: string;
  servicesOffered: string[];
  coreSkills: string[];
  pricingPolicy: string;
  revisionPolicy: string;
  communicationHours: string;
  customRules: string;
  updatedAt: string;
}

export class MemoreplyDatabase extends Dexie {
  clients!: EntityTable<ClientEntity, 'id'>;
  conversations!: EntityTable<ConversationEntity, 'id'>;
  messages!: EntityTable<MessageEntity, 'id'>;
  clientFacts!: EntityTable<ClientFactEntity, 'id'>;
  sellerKnowledge!: EntityTable<SellerKnowledgeEntity, 'id'>;

  constructor() {
    super('MemoreplyDB');

    // Version 1 schema
    this.version(1).stores({
      clients: 'id, platform, platformUserId, displayName, lastContactAt, updatedAt',
      conversations: 'id, clientId, platform, platformConversationId, lastMessageAt',
      messages: 'id, conversationId, clientId, senderRole, extractedAt',
      clientFacts: 'id, clientId, category, source, createdAt',
    });

    // Version 2 schema: adds sellerKnowledge table
    this.version(2).stores({
      clients: 'id, platform, platformUserId, displayName, lastContactAt, updatedAt',
      conversations: 'id, clientId, platform, platformConversationId, lastMessageAt',
      messages: 'id, conversationId, clientId, senderRole, extractedAt',
      clientFacts: 'id, clientId, category, source, createdAt',
      sellerKnowledge: 'id, updatedAt',
    });

    // Version 3 schema: adds status and conflict indexing to clientFacts
    this.version(3).stores({
      clients: 'id, platform, platformUserId, displayName, lastContactAt, updatedAt',
      conversations: 'id, clientId, platform, platformConversationId, lastMessageAt',
      messages: 'id, conversationId, clientId, senderRole, extractedAt',
      clientFacts: 'id, clientId, category, status, isConflicted, source, createdAt',
      sellerKnowledge: 'id, updatedAt',
    });
  }
}

export const db = new MemoreplyDatabase();
