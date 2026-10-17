// ============================================================
// Memoreply — AI Provider Types & Context Models
// ============================================================

export type ReplyTone =
  | 'Professional'
  | 'Friendly'
  | 'Concise'
  | 'Detailed'
  | 'Pitch / Offer'
  | 'Follow-up';

export interface AssembledContext {
  clientId: string;
  clientDisplayName: string;
  clientUsername: string;
  clientNotes: string;
  facts: Array<{ category: string; fact: string }>;
  recentMessages: Array<{
    sender: string;
    senderRole: 'client' | 'seller' | 'system';
    text: string;
    timestamp: string | null;
  }>;
  systemPrompt: string;
  userPrompt: string;
  tone: string;
}

export interface AIProviderResult {
  replyText: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AuthSessionData {
  token: string;
  email?: string;
  name?: string;
  expires?: string;
  rawJson?: string;
  uploadedAt: string;
}

export interface AIProvider {
  name: string;
  generateReply(
    context: AssembledContext,
    token: string,
    model?: string
  ): Promise<AIProviderResult>;
  testConnection(token: string): Promise<{ success: boolean; message: string }>;
}
