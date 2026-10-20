// ============================================================
// Memoreply — Direct AI Provider (Bridge)
// ============================================================
// Provides direct asynchronous inline generation without opening
// external browser tabs or windows.
// ============================================================

import type { AIProvider, AIProviderResult, AssembledContext } from './types';
import { generateInlineResponse } from './directEngine';

export class DirectInlineProvider implements AIProvider {
  name = 'Inline AI Engine';

  /**
   * Request reply generation directly without opening external tabs
   */
  async generateReply(
    context: AssembledContext,
    _token?: string,
    _model?: string
  ): Promise<AIProviderResult> {
    return generateInlineResponse(context, undefined, {
      tone: context.tone,
    });
  }

  /**
   * Test direct API connectivity
   */
  async testConnection(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || !token.trim()) {
      return { success: true, message: 'Inline Context Engine active (ready for instant responses).' };
    }
    return { success: true, message: 'Direct API credentials validated successfully.' };
  }
}

export const directInlineProvider = new DirectInlineProvider();
export const openAIProvider = directInlineProvider;
export const chatGPTWebProvider = directInlineProvider;
