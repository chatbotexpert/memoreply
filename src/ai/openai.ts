// ============================================================
// Memoreply — Module 4: ChatGPT Web Session Provider (Bridge)
// ============================================================
// Communicates with the Background Service Worker via Chrome messaging
// to execute ChatGPT Web API requests, bypassing browser CORS checks.
// ============================================================

import type { AIProvider, AIProviderResult, AssembledContext } from './types';

export class ChatGPTWebProvider implements AIProvider {
  name = 'ChatGPT Web Session';
  private defaultModel = 'auto';

  /**
   * Request reply generation through the Background Service Worker to bypass CORS.
   */
  async generateReply(
    context: AssembledContext,
    token: string,
    model: string = this.defaultModel
  ): Promise<AIProviderResult> {
    if (!token || !token.trim()) {
      throw new Error(
        'No ChatGPT session token found. Please upload your auth.json file in the Settings tab.'
      );
    }

    const combinedPrompt = `${context.systemPrompt}\n\n=========================\n${context.userPrompt}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('ChatGPT request timed out after 55 seconds. Please click Generate Reply again.'));
      }, 55000);

      chrome.runtime.sendMessage(
        {
          type: 'CHATGPT_GENERATE_REPLY',
          payload: {
            token: token.trim(),
            combinedPrompt,
            model,
          },
        },
        (response) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }

          if (response?.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Failed to generate reply from ChatGPT.'));
          }
        }
      );
    });
  }

  /**
   * Test session token validity through the Background Service Worker.
   */
  async testConnection(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || !token.trim()) {
      return { success: false, message: 'No session token found. Please upload auth.json first.' };
    }

    let cleanToken = token.trim();
    if (cleanToken.toLowerCase().startsWith('bearer ')) {
      cleanToken = cleanToken.slice(7).trim();
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'CHATGPT_TEST_SESSION',
          payload: {
            token: cleanToken,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            return resolve({
              success: false,
              message: `Background Worker error: ${chrome.runtime.lastError.message}`,
            });
          }

          if (response) {
            const rawMsg = response.message || response.error || '';
            // If Chrome was running a stale service worker that doesn't recognize CHATGPT_TEST_SESSION
            if (rawMsg.includes('Unknown message type')) {
              try {
                if (chrome.runtime?.reload) {
                  chrome.runtime.reload();
                }
              } catch {
                // Ignore reload error
              }
              return resolve({
                success: false,
                message: 'Outdated background worker detected. Extension is reloading now... Please click Test Session again in 3 seconds.',
              });
            }

            return resolve({
              success: Boolean(response.success),
              message:
                response.message ||
                response.error ||
                'Response received from ChatGPT session test.',
            });
          }

          resolve({
            success: false,
            message: 'Background Service Worker returned an empty response.',
          });
        }
      );
    });
  }
}

export const openAIProvider = new ChatGPTWebProvider();
export const chatGPTWebProvider = openAIProvider;
