// ============================================================
// Memoreply — Shared Types for Extension
// ============================================================

export type SenderRole = 'client' | 'seller' | 'system';

export interface ExtractedMessage {
  id: string;
  sender: string;
  senderRole: SenderRole;
  text: string;
  timestamp: string | null;
  isOwn: boolean;
}

export type SupportedPlatform = 'fiverr' | 'upwork' | 'linkedin';

export interface ConversationData {
  platform: SupportedPlatform;
  conversationId: string | null;
  clientUsername: string | null;
  clientDisplayName: string | null;
  clientAvatarUrl: string | null;
  messages: ExtractedMessage[];
  extractedAt: string;
  url: string;
  status: 'active' | 'empty' | 'not_found';
}

export type ExtensionMessageType =
  | 'PING'
  | 'EXTRACT_CONVERSATION'
  | 'CONVERSATION_UPDATED'
  | 'CONVERSATION_EXTRACTED'
  | 'CONVERSATION_DATA'
  | 'INSERT_DRAFT'
  | 'GET_STORED_CONVERSATION';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
