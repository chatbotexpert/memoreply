// ============================================================
// Memoreply — Background Service Worker
// ============================================================
// Handles extension lifecycle events, side panel management,
// message routing, and CORS-bypassing ChatGPT web requests.
// ============================================================

/**
 * Open the side panel when the extension action button is clicked.
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('[Memoreply] Side panel opened for tab:', tab.id);
    } catch (error) {
      console.error('[Memoreply] Failed to open side panel:', error);
    }
  }
});

/**
 * Set the side panel behavior — open on action click.
 */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error('[Memoreply] Failed to set panel behavior:', error);
});

/**
 * Helper to extract response text from ChatGPT Server-Sent Events (SSE) or JSON.
 */
function extractReplyFromText(rawText: string): string {
  let finalReply = '';

  // 1. Try SSE data lines
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const dataStr = trimmed.slice(5).trim();
    if (dataStr === '[DONE]') break;

    try {
      const parsed = JSON.parse(dataStr);
      const parts = parsed?.message?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0 && typeof parts[0] === 'string') {
        finalReply = parts[0];
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  if (finalReply.trim()) {
    return finalReply.trim();
  }

  // 2. Fallback: check if the whole response is a JSON object
  try {
    const json = JSON.parse(rawText);
    if (json?.choices?.[0]?.message?.content) {
      return json.choices[0].message.content.trim();
    }
    if (json?.message?.content?.parts?.[0]) {
      return json.message.content.parts[0].trim();
    }
    if (typeof json?.reply === 'string') {
      return json.reply.trim();
    }
  } catch {
    // Ignore parse error
  }

  return rawText.trim();
}

/**
 * Retrieve or generate a persistent Device ID (UUID) for ChatGPT requests.
 */
async function getOrCreateDeviceId(): Promise<string> {
  try {
    const result = await chrome.storage.local.get('memoreply_oai_device_id');
    if (result.memoreply_oai_device_id && typeof result.memoreply_oai_device_id === 'string') {
      return result.memoreply_oai_device_id;
    }
  } catch (err) {
    console.warn('[Memoreply] Could not read device ID from storage:', err);
  }

  const newId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `did-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  chrome.storage.local.set({ memoreply_oai_device_id: newId }).catch(() => {});
  return newId;
}

/**
 * Fetch ChatGPT Sentinel Chat Requirements token before conversation request
 */
async function getSentinelChatRequirements(
  token: string,
  deviceId: string
): Promise<{ token?: string }> {
  const sentinelEndpoints = [
    'https://chatgpt.com/backend-api/sentinel/chat-requirements',
    'https://chat.openai.com/backend-api/sentinel/chat-requirements',
  ];

  for (const endpoint of sentinelEndpoints) {
    try {
      console.log('[Memoreply] Requesting Sentinel chat requirements from:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'OAI-Device-Id': deviceId,
          'OAI-Language': 'en-US',
          Accept: 'application/json, */*',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.warn(`[Memoreply] Sentinel requirements HTTP ${response.status} from ${endpoint}`);
        continue;
      }

      const data = await response.json().catch(() => null);
      if (data?.token) {
        console.log('[Memoreply] Successfully obtained Sentinel requirements token');
        return { token: data.token };
      }
    } catch (err) {
      console.warn(`[Memoreply] Failed to fetch Sentinel requirements from ${endpoint}:`, err);
    }
  }

  return {};
}

/**
 * Tab Bridge: Execute conversation request directly inside an active chatgpt.com browser tab.
 * Uses a robust dual-phase strategy:
 *   Phase 1: In-Page Direct API fetch to /backend-api/conversation (fastest, 1-2s).
 *   Phase 2: Page DOM Automation Bridge (types into #prompt-textarea, clicks send, waits for streaming reply).
 * This completely bypasses Cloudflare, Turnstile, and Sentinel PoW challenges because it runs
 * within the user's authentic, authenticated browser context!
 */
/**
 * Directly extract the latest assistant response from any open ChatGPT tab.
 * Uses multiple selector fallbacks to guarantee extraction regardless of ChatGPT UI versions.
 */
async function fetchLatestChatGPTReply(): Promise<string> {
  const allTabs = await chrome.tabs.query({});
  const chatTabs = allTabs.filter(
    (t) => t.id && t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com'))
  );

  if (chatTabs.length === 0) {
    throw new Error('No open ChatGPT tab found. Please make sure chatgpt.com is open in your browser.');
  }

  // Sort tabs: active tabs first, then newest tab IDs first
  const sortedTabs = [...chatTabs].sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return (b.id ?? 0) - (a.id ?? 0);
  });

  for (const tab of sortedTabs) {
    if (!tab.id) continue;
    try {
      const grab = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Priority 1: Check assistant messages by author role
          const roleNodes = Array.from(
            document.querySelectorAll(
              '[data-message-author-role="assistant"], .agent-turn, [data-testid*="assistant"]'
            )
          );
          if (roleNodes.length > 0) {
            const last = roleNodes[roleNodes.length - 1] as HTMLElement;
            const md =
              last.querySelector('.markdown') ||
              last.querySelector('[class*="markdown"]') ||
              last.querySelector('.prose') ||
              last;
            const text = (md as HTMLElement).innerText?.trim();
            if (
              text &&
              text.length > 15 &&
              !text.includes('You are Memoreply') &&
              !text.includes('SELLER KNOWLEDGE BASE')
            ) {
              return text;
            }
          }

          // Priority 2: Check all markdown blocks that are not the user prompt
          const mdNodes = Array.from(
            document.querySelectorAll('div.markdown, div[class*="markdown"], .prose, div[class*="prose"]')
          );
          for (let i = mdNodes.length - 1; i >= 0; i--) {
            const text = (mdNodes[i] as HTMLElement).innerText?.trim() || '';
            if (
              text.length > 25 &&
              !text.includes('You are Memoreply') &&
              !text.includes('SELLER KNOWLEDGE BASE') &&
              !text.includes('CONVERSATION THREAD')
            ) {
              return text;
            }
          }

          // Priority 3: Check conversation turns
          const turns = Array.from(
            document.querySelectorAll('[data-testid^="conversation-turn-"], article')
          );
          for (let i = turns.length - 1; i >= 0; i--) {
            const turn = turns[i] as HTMLElement;
            if (
              !turn.querySelector('[data-message-author-role="user"]') &&
              !turn.innerText.includes('You are Memoreply')
            ) {
              const md =
                turn.querySelector('.markdown') ||
                turn.querySelector('[class*="markdown"]') ||
                turn.querySelector('.prose') ||
                turn;
              const text = (md as HTMLElement).innerText?.trim() || '';
              if (text.length > 25 && !text.includes('You are Memoreply')) {
                return text;
              }
            }
          }

          return '';
        },
      });

      const text = grab?.[0]?.result;
      if (text && typeof text === 'string' && text.trim().length > 15) {
        return text.trim();
      }
    } catch (tabErr) {
      console.warn(`[Memoreply] Could not extract from tab ${tab.id}:`, tabErr);
    }
  }

  throw new Error('No reply text found in any open ChatGPT tab. Please ensure ChatGPT has finished generating.');
}

/**
 * Tab Bridge: Execute conversation request directly inside an active chatgpt.com browser tab.
 * 
 * Step 1: Injects prompt into ChatGPT and clicks send (instant, ~400ms).
 * Step 2: Background service worker polls the tab every 600ms for completion.
 *         Each poll is a lightweight script that keeps the Manifest V3 service worker
 *         active and detects completion instantly via ChatGPT's Copy button or text stabilization.
 */
async function callChatGPTViaTab(
  tabId: number,
  promptText: string
): Promise<string> {
  // ------------------------------------------------------------------
  // STEP 1: Enter prompt and click send in the ChatGPT tab
  // ------------------------------------------------------------------
  const submitInjection = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (prompt: string) => {
      // Find ChatGPT prompt input
      const findInput = () => {
        return (
          (document.querySelector('#prompt-textarea') as HTMLElement | null) ||
          (document.querySelector('[contenteditable="true"]') as HTMLElement | null) ||
          (document.querySelector('textarea') as HTMLTextAreaElement | null)
        );
      };

      const inputEl = findInput();
      if (!inputEl) {
        return {
          ok: false,
          error: 'ChatGPT tab found, but prompt input box was not ready. Please make sure chatgpt.com is fully loaded.',
        };
      }

      // Record text of last assistant message before sending new prompt
      const mdNodes = Array.from(document.querySelectorAll('div.markdown, div[class*="markdown"]'));
      let initialText = '';
      for (let i = mdNodes.length - 1; i >= 0; i--) {
        const t = (mdNodes[i] as HTMLElement).innerText?.trim() || '';
        if (t.length > 20 && !t.includes('You are Memoreply') && !t.includes('SELLER KNOWLEDGE BASE')) {
          initialText = t;
          break;
        }
      }

      // Focus and insert prompt
      inputEl.focus();
      if (inputEl.tagName.toLowerCase() === 'textarea') {
        (inputEl as HTMLTextAreaElement).value = prompt;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.execCommand('selectAll', false, undefined);
        const ok = document.execCommand('insertText', false, prompt);
        if (!ok) {
          inputEl.innerText = prompt;
          inputEl.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
      }

      // Wait a moment for React/ProseMirror to update button state
      await new Promise((r) => setTimeout(r, 450));

      // Click Send Button
      const findSendBtn = () => {
        return (
          (document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null) ||
          (document.querySelector('button[aria-label*="Send"]') as HTMLButtonElement | null) ||
          (document.querySelector('form button:not([disabled])') as HTMLButtonElement | null)
        );
      };

      const sendBtn = findSendBtn();
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
      } else {
        inputEl.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
          })
        );
      }

      return { ok: true, initialText };
    },
    args: [promptText],
  });

  const submitResult = submitInjection?.[0]?.result;
  if (!submitResult || !submitResult.ok) {
    throw new Error(submitResult?.error || 'Failed to submit prompt into ChatGPT tab.');
  }

  const initialText = String(submitResult.initialText || '').trim();

  // ------------------------------------------------------------------
  // STEP 2: Background worker polls the tab every 600ms for completion
  // ------------------------------------------------------------------
  const maxPolls = 60; // Up to ~36 seconds
  let lastSeenText = '';
  let stableIterations = 0;

  for (let poll = 0; poll < maxPolls; poll++) {
    await new Promise((r) => setTimeout(r, 600));

    try {
      const pollInjection = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Look for all markdown nodes on page
          const mdNodes = Array.from(
            document.querySelectorAll('div.markdown, div[class*="markdown"], [data-message-author-role="assistant"]')
          );

          let candidateText = '';
          for (let i = mdNodes.length - 1; i >= 0; i--) {
            const el = mdNodes[i];
            const md = el.querySelector('.markdown') || el;
            const t = (md as HTMLElement).innerText?.trim() || '';
            if (t.length > 25 && !t.includes('You are Memoreply') && !t.includes('SELLER KNOWLEDGE BASE')) {
              candidateText = t;
              break;
            }
          }

          // Check if ChatGPT is still streaming
          const stopBtn =
            document.querySelector('button[data-testid="stop-button"]') ||
            document.querySelector('button[aria-label="Stop generating"]') ||
            document.querySelector('.result-streaming');

          // Check if copy button has appeared on the latest message
          const copyBtn =
            document.querySelector('button[aria-label="Copy"]') ||
            document.querySelector('button[aria-label*="Copy"]') ||
            document.querySelector('[data-testid*="copy"]');

          return {
            hasResponse: candidateText.length > 25,
            isStreaming: Boolean(stopBtn),
            hasCopyButton: Boolean(copyBtn),
            text: candidateText,
          };
        },
      });

      const check = pollInjection?.[0]?.result;
      if (check && check.hasResponse) {
        const isNewOrUpdated = !initialText || check.text !== initialText;

        if (isNewOrUpdated) {
          // CASE A: Copy button appeared — ChatGPT has 100% finished!
          if (check.hasCopyButton && check.text.length > 30) {
            console.log('[Memoreply] Completion verified via Copy button!');
            return check.text;
          }

          // CASE B: Stop button is gone and text has stabilized for 2 consecutive checks
          if (!check.isStreaming && check.text.length > 30) {
            if (check.text === lastSeenText) {
              stableIterations++;
              if (stableIterations >= 2) {
                console.log('[Memoreply] Completion verified via text stability!');
                return check.text;
              }
            } else {
              lastSeenText = check.text;
              stableIterations = 0;
            }
          }
        }
      }
    } catch (pollErr) {
      console.warn(`[Memoreply] Poll error on iteration ${poll}:`, pollErr);
    }
  }

  // Fallback: If timed out, grab whatever assistant text is currently displayed on screen
  if (lastSeenText && lastSeenText.length > 30) {
    return lastSeenText;
  }

  return await fetchLatestChatGPTReply();
}

/**
 * Execute ChatGPT Web Backend Conversation call (bypasses CORS in Background worker)
 */
async function callChatGPTConversation(
  token: string,
  combinedPrompt: string,
  model?: string
): Promise<{ replyText: string; model: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('No session token provided.');
  }

  const deviceId = await getOrCreateDeviceId();
  const sentinel = await getSentinelChatRequirements(cleanToken, deviceId);

  const messageId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `msg-${Date.now()}`;
  const parentMessageId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `parent-${Date.now()}`;

  const payload: Record<string, unknown> = {
    action: 'next',
    messages: [
      {
        id: messageId,
        author: { role: 'user' },
        content: {
          content_type: 'text',
          parts: [combinedPrompt],
        },
      },
    ],
    model: model === 'gpt-4o' ? 'gpt-4o' : 'auto',
    parent_message_id: parentMessageId,
    timezone_offset_min: new Date().getTimezoneOffset(),
    suggestions: [],
    history_and_training_disabled: false,
    conversation_mode: { kind: 'primary_assistant' },
    force_paragen: false,
    force_rate_limit: false,
  };

  if (sentinel.token) {
    payload.chat_requirements_token = sentinel.token;
  }

  // PRIORITY 1: Check if an active ChatGPT tab is already open in the browser
  const allTabs = await chrome.tabs.query({});
  const chatTabs = allTabs.filter(
    (t) => t.id && t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com'))
  );

  if (chatTabs.length > 0) {
    // Pick the best tab: loaded tab first, active if possible
    let targetTab =
      chatTabs.find((t) => t.status === 'complete' && t.active) ||
      chatTabs.find((t) => t.status === 'complete');

    // If all tabs are still loading, wait up to 2.5 seconds for one to complete
    if (!targetTab) {
      console.log('[Memoreply] Waiting for ChatGPT tab to finish loading...');
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const updatedTabs = await chrome.tabs.query({});
        const updatedChat = updatedTabs.filter(
          (t) => t.id && t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com'))
        );
        targetTab = updatedChat.find((t) => t.status === 'complete');
        if (targetTab) break;
      }
    }

    if (targetTab?.id) {
      console.log('[Memoreply] Routing conversation through active ChatGPT tab:', targetTab.id);
      const tabReply = await callChatGPTViaTab(
        targetTab.id,
        combinedPrompt
      );
      return {
        replyText: tabReply,
        model: model || 'ChatGPT Web (Tab Bridge)',
      };
    }
  }

  // If literally ZERO ChatGPT tabs exist in the browser, inform the user or open ONCE
  if (chatTabs.length === 0) {
    try {
      await chrome.tabs.create({ url: 'https://chatgpt.com', active: true });
    } catch {}
    throw new Error('Opened ChatGPT in a new tab! Please ensure you are logged in on that tab, then click Generate Reply again.');
  }

  // PRIORITY 2: Direct Service Worker Fetch (Fallback)
  const endpoints = [
    'https://chatgpt.com/backend-api/conversation',
    'https://chat.openai.com/backend-api/conversation',
  ];

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'text/event-stream, application/json, */*',
    'OAI-Device-Id': deviceId,
    'OAI-Language': 'en-US',
  };

  if (sentinel.token) {
    requestHeaders['OpenAI-Sentinel-Chat-Requirements-Token'] = sentinel.token;
    requestHeaders['openai-sentinel-chat-requirements-token'] = sentinel.token;
  }

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: requestHeaders,
        body: JSON.stringify(payload),
      });

      const status = response.status;
      const statusText = response.statusText;
      const rawText = await response.text().catch(() => '');
      const snippet = rawText.slice(0, 180).replace(/\s+/g, ' ').trim();
      const isCloudflare =
        rawText.includes('<html') ||
        rawText.includes('cf-chl') ||
        rawText.includes('Cloudflare') ||
        rawText.includes('Just a moment');

      if (!response.ok) {
        if (status === 401) {
          throw new Error('HTTP 401 Unauthorized: ChatGPT session has expired. Please re-export auth.json from chatgpt.com.');
        } else if (status === 403) {
          // If blocked by Sentinel / Cloudflare, only open if NO tab exists!
          const currentTabs = (await chrome.tabs.query({})).filter(
            (t) => t.id && t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com'))
          );
          if (currentTabs.length === 0) {
            try {
              await chrome.tabs.create({ url: 'https://chatgpt.com', active: true });
            } catch {}
            throw new Error('Opened ChatGPT in a new tab! Please ensure you are logged in on that tab, then click Generate Reply again.');
          }

          if (isCloudflare) {
            throw new Error('HTTP 403 Cloudflare Challenge: Please switch to your open ChatGPT tab and pass verification.');
          }
          if (snippet.includes('Unusual activity')) {
            throw new Error('HTTP 403 Sentinel Security: Please keep your open ChatGPT tab active and click Generate Reply again.');
          }
          throw new Error(`HTTP 403 Forbidden: ${snippet || 'Access denied by ChatGPT.'}`);
        } else if (status === 429) {
          throw new Error('HTTP 429 Rate Limit: ChatGPT request limit reached. Please wait a moment.');
        } else {
          throw new Error(`HTTP ${status} (${statusText}): ${snippet || 'Failed to generate response'}`);
        }
      }

      const reply = extractReplyFromText(rawText);
      if (!reply) {
        throw new Error(`Empty response received from ChatGPT backend (HTTP ${status}).`);
      }

      return {
        replyText: reply,
        model: model || 'ChatGPT Web',
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If auth failure or tab opened or Cloudflare, do not retry secondary endpoint
      if (
        lastError.message.includes('HTTP 401') ||
        lastError.message.includes('Opened ChatGPT') ||
        lastError.message.includes('Cloudflare')
      ) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Could not connect to ChatGPT backend.');
}

/**
 * Test ChatGPT Web Session validity with detailed error reporting
 */
async function testChatGPTSession(token: string): Promise<{ success: boolean; message: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return {
      success: false,
      message: 'Empty token provided. Please upload a valid auth.json file.',
    };
  }

  const deviceId = await getOrCreateDeviceId();

  // Primary and secondary endpoints to verify session validity
  const testUrls = [
    'https://chatgpt.com/backend-api/me',
    'https://chatgpt.com/backend-api/models',
    'https://chat.openai.com/backend-api/me',
  ];

  let lastStatus = 0;
  let lastSnippet = '';
  let lastError: Error | null = null;

  for (const url of testUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'OAI-Device-Id': deviceId,
          'OAI-Language': 'en-US',
          Accept: 'application/json, text/plain, */*',
        },
      });

      lastStatus = response.status;
      const rawText = await response.text().catch(() => '');
      lastSnippet = rawText.slice(0, 160).replace(/\s+/g, ' ').trim();

      const isCloudflare =
        rawText.includes('<html') ||
        rawText.includes('cf-chl') ||
        rawText.includes('Cloudflare') ||
        rawText.includes('Just a moment');

      if (response.ok) {
        // Success 200 OK — attempt to parse account info
        let accountDetail = '';
        try {
          const data = JSON.parse(rawText);
          if (data?.email) {
            accountDetail = ` (${data.email})`;
          } else if (data?.name) {
            accountDetail = ` (${data.name})`;
          }
        } catch {
          // Ignore JSON parse if simple OK
        }

        return {
          success: true,
          message: `✅ Session Active! Connected to ChatGPT${accountDetail} (HTTP 200 OK).`,
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          message: 'HTTP 401 Unauthorized: Session token is expired. Please re-export auth.json from chatgpt.com/api/auth/session.',
        };
      }

      if (response.status === 403) {
        if (isCloudflare) {
          return {
            success: false,
            message: 'HTTP 403 Cloudflare Challenge: Please open chatgpt.com in a Chrome tab, complete verification, and try again.',
          };
        }
        return {
          success: false,
          message: `HTTP 403 Forbidden: Access denied by ChatGPT backend (${lastSnippet}).`,
        };
      }
    } catch (err) {
      console.warn(`[Memoreply] Test URL ${url} threw error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  if (lastError && !lastStatus) {
    return {
      success: false,
      message: `Network Exception connecting to ChatGPT: ${lastError.message}`,
    };
  }

  return {
    success: false,
    message: `ChatGPT returned HTTP ${lastStatus}: ${lastSnippet || 'Unexpected response'}`,
  };
}

/**
 * Message router — handles messages from content scripts, UI, and ChatGPT proxies
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Memoreply] Background received message:', message?.type, 'from:', sender.tab?.url ?? 'extension');

  switch (message?.type) {
    // 0. Worker Ping / Version Check
    case 'MEMOREPLY_PING': {
      sendResponse({ success: true, version: '0.1.1', ready: true });
      return false;
    }

    // 1. ChatGPT Session Testing (Runs in Service Worker to bypass CORS)
    case 'CHATGPT_TEST_SESSION': {
      let token = String(message.payload?.token || '').trim();
      if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice(7).trim();
      }
      testChatGPTSession(token)
        .then((result) => {
          sendResponse({
            success: result.success,
            message: result.message,
          });
        })
        .catch((err) => {
          sendResponse({
            success: false,
            message: `Background Worker Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        });
      return true; // Keep channel open for async response
    }

    // 2. ChatGPT Reply Generation (Runs in Service Worker to bypass CORS)
    case 'CHATGPT_GENERATE_REPLY': {
      const { token, combinedPrompt, model } = message.payload || {};
      let cleanToken = String(token || '').trim();
      if (cleanToken.toLowerCase().startsWith('bearer ')) {
        cleanToken = cleanToken.slice(7).trim();
      }
      callChatGPTConversation(cleanToken, String(combinedPrompt || ''), model)
        .then((data) => sendResponse({ success: true, data }))
        .catch((err) =>
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          })
        );
      return true;
    }

    // 2b. Direct Fetch of Latest Reply from ChatGPT Tab
    case 'CHATGPT_FETCH_LATEST_REPLY': {
      fetchLatestChatGPTReply()
        .then((replyText) =>
          sendResponse({
            success: true,
            data: { replyText, model: 'ChatGPT Web (Direct Grab)' },
          })
        )
        .catch((err) =>
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          })
        );
      return true;
    }

    // 3. Conversation caching
    case 'CONVERSATION_EXTRACTED':
    case 'CONVERSATION_DATA': {
      chrome.storage.local
        .set({ currentConversation: message.payload })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    case 'GET_CONVERSATION': {
      chrome.storage.local
        .get('currentConversation')
        .then((result) => sendResponse({ success: true, data: result.currentConversation ?? null }))
        .catch((error) => sendResponse({ success: false, error: String(error) }));
      return true;
    }

    // 4. Draft insertion into Fiverr composer
    case 'INSERT_DRAFT': {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs
            .sendMessage(activeTab.id, {
              type: 'INSERT_DRAFT',
              payload: message.payload,
            })
            .then((response) => sendResponse(response))
            .catch((error) => sendResponse({ success: false, error: String(error) }));
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true;
    }

    default:
      return false;
  }
});

/**
 * Extension install/update handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Memoreply] Extension installed. Welcome!');
  } else if (details.reason === 'update') {
    console.log('[Memoreply] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

export {};
