import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConversationData, ExtractedMessage } from './types';
import {
  saveExtractedConversation,
  getClientMemory,
  addManualFact,
  deleteClientFact,
  updateFactStatus,
  updateClientNotes,
  getDatabaseStats,
  exportAllData,
  clearAllData,
  getSellerKnowledge,
  saveSellerKnowledge,
  DEFAULT_SELLER_KNOWLEDGE,
} from './db/repository';
import type {
  ClientEntity,
  ClientFactEntity,
  FactCategory,
  FactStatus,
  SellerKnowledgeEntity,
} from './db/index';
import { assembleContext } from './ai/contextAssembler';
import { openAIProvider } from './ai/openai';
import type { AuthSessionData } from './ai/types';

// ============================================================
// Memoreply — Modules 1, 2, 3, 4, 6 & 7: ChatGPT Session Auth
// ============================================================

type TabId = 'chat' | 'memory' | 'knowledge' | 'settings';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const TONES = [
  'Professional',
  'Friendly',
  'Concise',
  'Detailed',
  'Pitch / Offer',
  'Follow-up',
];

const FACT_CATEGORIES: FactCategory[] = [
  'budget',
  'timeline',
  'technical',
  'preference',
  'project',
  'general',
];

const MODELS = [
  { id: 'auto', label: 'ChatGPT Default (Auto Model)' },
  { id: 'gpt-4o', label: 'GPT-4o (Most Capable)' },
  { id: 'text-davinci-002-render-sha', label: 'GPT-3.5 Legacy' },
];

// Realistic mock conversation for testing when not on a live Fiverr chat
const MOCK_CONVERSATION: ConversationData = {
  platform: 'fiverr',
  conversationId: 'alex_miller_dev',
  clientUsername: 'alex_miller_dev',
  clientDisplayName: 'Alex Miller',
  clientAvatarUrl: null,
  status: 'active',
  extractedAt: new Date().toISOString(),
  url: 'https://www.fiverr.com/inbox/alex_miller_dev',
  messages: [
    {
      id: 'mock-1',
      sender: 'Alex Miller',
      senderRole: 'client',
      text: 'Hey! I saw your React and TypeScript gig. Are you available for a new custom dashboard project?',
      timestamp: '10:42 AM',
      isOwn: false,
    },
    {
      id: 'mock-2',
      sender: 'Me',
      senderRole: 'seller',
      text: 'Hello Alex! Yes, absolutely. I specialize in React, Vite, and Chrome extensions. Could you share your key requirements and expected timeline?',
      timestamp: '10:45 AM',
      isOwn: true,
    },
    {
      id: 'mock-3',
      sender: 'Alex Miller',
      senderRole: 'client',
      text: 'We need a responsive analytics view with dark mode, chart widgets, and real-time data sync. We want to finish the MVP within 2 weeks with a $650 budget. Can you deliver on that?',
      timestamp: '10:50 AM',
      isOwn: false,
    },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTone, setActiveTone] = useState<string>('Professional');
  const [draftText, setDraftText] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingFromTab, setIsFetchingFromTab] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');
  const [isFiverrTab, setIsFiverrTab] = useState<boolean>(false);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  // Module 2: Persistent Client Memory States
  const [storedClient, setStoredClient] = useState<ClientEntity | null>(null);
  const [storedFacts, setStoredFacts] = useState<ClientFactEntity[]>([]);
  const [totalStoredMessages, setTotalStoredMessages] = useState<number>(0);
  const [clientNotes, setClientNotes] = useState<string>('');
  const [newFactCategory, setNewFactCategory] = useState<FactCategory>('general');
  const [newFactText, setNewFactText] = useState<string>('');
  const [dbStats, setDbStats] = useState({
    clientsCount: 0,
    conversationsCount: 0,
    messagesCount: 0,
    factsCount: 0,
  });

  // Module 4: ChatGPT Session Authentication (JSON Auth File)
  const [authSession, setAuthSession] = useState<AuthSessionData | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [isTestingSession, setIsTestingSession] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Module 7: Seller Knowledge Base States
  const [sellerProfile, setSellerProfile] = useState<SellerKnowledgeEntity>(DEFAULT_SELLER_KNOWLEDGE);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [newServiceInput, setNewServiceInput] = useState<string>('');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Load ChatGPT session and seller knowledge on mount
  useEffect(() => {
    chrome.storage.local.get(['memoreply_chatgpt_session', 'memoreply_chatgpt_model'], (result) => {
      if (result?.memoreply_chatgpt_session) {
        setAuthSession(result.memoreply_chatgpt_session as AuthSessionData);
      }
      if (result?.memoreply_chatgpt_model) {
        setSelectedModel(String(result.memoreply_chatgpt_model));
      }
    });

    // Load Seller Knowledge Base from Dexie
    getSellerKnowledge()
      .then((profile) => {
        if (profile) {
          setSellerProfile(profile);
        }
      })
      .catch((err) => {
        console.error('[Memoreply] Failed to load seller knowledge:', err);
      });
  }, []);

  // Refresh database stats
  const refreshDbStats = useCallback(async () => {
    try {
      const stats = await getDatabaseStats();
      setDbStats(stats);
    } catch (err) {
      console.error('[Memoreply] Failed to get DB stats:', err);
    }
  }, []);

  // Load client memory from IndexedDB
  const loadClientMemory = useCallback(
    async (clientId: string) => {
      try {
        const memory = await getClientMemory(clientId);
        if (memory.client) {
          setStoredClient(memory.client);
          setClientNotes(memory.client.notes ?? '');
        }
        setStoredFacts(memory.facts);
        setTotalStoredMessages(memory.messagesCount);
        await refreshDbStats();
      } catch (err) {
        console.error('[Memoreply] Error loading client memory:', err);
      }
    },
    [refreshDbStats]
  );

  // Save conversation into IndexedDB (Dexie)
  const persistConversationToDb = useCallback(
    async (data: ConversationData) => {
      try {
        const result = await saveExtractedConversation(data);
        await loadClientMemory(result.client.id);
        return result;
      } catch (err) {
        console.error('[Memoreply] DB persistence error:', err);
        showToast('Error saving to IndexedDB: ' + String(err), 'error');
        return null;
      }
    },
    [loadClientMemory]
  );

  /**
   * Sync/Extract conversation from the currently active tab
   */
  const syncFromActiveTab = useCallback(async () => {
    setIsSyncing(true);
    try {
      let targetTab: chrome.tabs.Tab | undefined;
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab?.id && activeTab.url?.includes('fiverr.com')) {
        targetTab = activeTab;
      } else {
        const fiverrTabs = await chrome.tabs.query({ url: '*://*.fiverr.com/*' });
        targetTab = fiverrTabs.find((t) => t.active) || fiverrTabs[0] || activeTab;
      }

      if (!targetTab?.id || !targetTab.url) {
        setIsFiverrTab(false);
        setActiveTabUrl('');
        setIsSyncing(false);
        return;
      }

      setActiveTabUrl(targetTab.url);
      const isFiverr = targetTab.url.includes('fiverr.com');
      setIsFiverrTab(isFiverr);

      if (!isFiverr) {
        if (!isUsingMock) {
          showToast('Active tab is not Fiverr. Click "Load Demo Chat" to test.', 'info');
        }
        setIsSyncing(false);
        return;
      }

      // Ping & Extract from active Fiverr tab
      chrome.tabs.sendMessage(
        targetTab.id,
        { type: 'EXTRACT_CONVERSATION' },
        async (response) => {
          setIsSyncing(false);
          if (chrome.runtime.lastError) {
            console.warn('[Memoreply] Message error:', chrome.runtime.lastError.message);
            showToast('Fiverr tab detected. Please reload (F5) the Fiverr page once to connect.', 'info');
            return;
          }

          if (response?.success && response.data) {
            setConversation(response.data);
            setIsUsingMock(false);

            // Persist to IndexedDB
            const dbResult = await persistConversationToDb(response.data);
            if (dbResult) {
              showToast(
                `Synced ${response.data.messages.length} messages and ${dbResult.factsCount} context points.`,
                'success'
              );
            }
          } else {
            showToast(response?.error ?? 'No active conversation found on this page.', 'error');
          }
        }
      );
    } catch (err) {
      console.error('[Memoreply] Sync error:', err);
      setIsSyncing(false);
      showToast('Error syncing with page: ' + String(err), 'error');
    }
  }, [isUsingMock, persistConversationToDb]);

  // Initial tab detection and auto-sync on load + Real-time listeners
  useEffect(() => {
    let isMounted = true;
    syncFromActiveTab();
    refreshDbStats();

    // 1. Check storage for any previously cached conversation
    chrome.storage.local.get('currentConversation', async (res) => {
      if (isMounted && res?.currentConversation) {
        const cached = res.currentConversation as ConversationData;
        setConversation((prev) => {
          if (!prev) {
            persistConversationToDb(cached);
            return cached;
          }
          return prev;
        });
      } else if (isMounted && !chrome?.runtime?.id) {
        // Auto-load interactive demo thread on web preview (e.g. Vercel)
        handleLoadMock();
      }
    });

    // 2. Real-time storage listener: auto-update when content script extracts messages
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.currentConversation?.newValue && isMounted) {
        const updated = changes.currentConversation.newValue as ConversationData;
        if (updated && updated.messages && updated.messages.length > 0) {
          console.log('[Memoreply] Auto-synced conversation from storage:', updated.clientUsername, updated.messages.length);
          setConversation(updated);
          setIsUsingMock(false);
          setIsFiverrTab(true);
          persistConversationToDb(updated);
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // 3. Real-time message listener from content script
    const handleRuntimeMessage = (message: { type?: string; payload?: unknown }) => {
      if (message?.type === 'CONVERSATION_EXTRACTED' && message?.payload && isMounted) {
        const updated = message.payload as ConversationData;
        if (updated && updated.messages && updated.messages.length > 0) {
          console.log('[Memoreply] Auto-synced CONVERSATION_EXTRACTED message:', updated.clientUsername, updated.messages.length);
          setConversation(updated);
          setIsUsingMock(false);
          setIsFiverrTab(true);
          persistConversationToDb(updated);
        }
      }
    };
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    // 4. Tab change listener: re-sync when switching tabs
    const handleTabActivated = () => {
      if (isMounted) {
        syncFromActiveTab();
      }
    };
    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      isMounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [syncFromActiveTab, refreshDbStats, persistConversationToDb]);

  /**
   * Load mock data for testing UI and persistence when not on Fiverr
   */
  const handleLoadMock = async () => {
    setIsUsingMock(true);
    setConversation(MOCK_CONVERSATION);
    const dbResult = await persistConversationToDb(MOCK_CONVERSATION);
    if (dbResult) {
      showToast('Demo Fiverr conversation loaded & stored in IndexedDB!', 'success');
    }
  };

  /**
   * Parse uploaded auth.json file, extract token, and persist to chrome.storage.local
   */
  const parseAndSaveAuthJson = (content: string, fileName: string) => {
    try {
      const parsed = JSON.parse(content);

      // Search for token across various standard formats
      const token =
        parsed.accessToken ||
        parsed.access_token ||
        parsed.token ||
        parsed.sessionToken ||
        parsed.session_token ||
        parsed.bearerToken ||
        parsed.auth?.accessToken ||
        parsed.credentials?.token;

      if (!token || typeof token !== 'string') {
        showToast(
          `Could not find an accessToken or session token in "${fileName}". Please check the file.`,
          'error'
        );
        return;
      }

      // Extract user metadata
      const email = parsed.user?.email || parsed.email || parsed.username || 'ChatGPT Account';
      const name = parsed.user?.name || parsed.name || '';
      const expires = parsed.expires || parsed.expiration || 'Active Session';

      const sessionData: AuthSessionData = {
        token: token.trim(),
        email,
        name,
        expires,
        uploadedAt: new Date().toISOString(),
      };

      chrome.storage.local.set(
        {
          memoreply_chatgpt_session: sessionData,
          memoreply_chatgpt_token: token.trim(),
          memoreply_chatgpt_model: selectedModel,
        },
        () => {
          setAuthSession(sessionData);
          showToast(`Connected web session credentials for ${email}.`, 'success');
        }
      );
    } catch (err) {
      showToast('Invalid JSON file format: ' + String(err), 'error');
    }
  };

  /**
   * Handle file selection via input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndSaveAuthJson(text, file.name);
    };
    reader.onerror = () => showToast('Failed to read file.', 'error');
    reader.readAsText(file);
    // Reset file input so user can re-upload if needed
    e.target.value = '';
  };

  /**
   * Handle drag and drop of auth.json
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndSaveAuthJson(text, file.name);
    };
    reader.onerror = () => showToast('Failed to read file.', 'error');
    reader.readAsText(file);
  };

  /**
   * Test ChatGPT Web Session connection
   */
  const handleTestSession = async () => {
    if (!authSession?.token) {
      showToast('No session token found. Please upload auth.json first.', 'error');
      return;
    }
    setIsTestingSession(true);
    const result = await openAIProvider.testConnection(authSession.token);
    setIsTestingSession(false);
    showToast(result.message, result.success ? 'success' : 'error');

    // Auto-update email in session card if detected from backend
    if (result.success && result.message.includes('(')) {
      const emailMatch = result.message.match(/\(([^)]+@[^)]+)\)/);
      if (emailMatch && emailMatch[1]) {
        const detectedEmail = emailMatch[1].trim();
        const updatedSession = { ...authSession, email: detectedEmail };
        setAuthSession(updatedSession);
        chrome.storage.local.set({ memoreply_chatgpt_session: updatedSession });
      }
    }
  };

  /**
   * Force reload the extension using Chrome Extension runtime API
   */
  const handleReloadExtension = () => {
    try {
      showToast('Reloading Memoreply extension...', 'info');
      if (chrome.runtime?.reload) {
        chrome.runtime.reload();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  /**
   * Disconnect and clear ChatGPT session
   */
  const handleDisconnectSession = () => {
    if (window.confirm('Disconnect your ChatGPT session from Memoreply?')) {
      chrome.storage.local.remove(['memoreply_chatgpt_session', 'memoreply_chatgpt_token'], () => {
        setAuthSession(null);
        showToast('ChatGPT session disconnected.', 'info');
      });
    }
  };

  /**
   * Add a manual fact to client memory
   */
  const handleAddFact = async () => {
    if (!storedClient) {
      showToast('No active client loaded. Sync a conversation first.', 'error');
      return;
    }
    if (!newFactText.trim()) {
      showToast('Please type fact details.', 'error');
      return;
    }

    try {
      await addManualFact(storedClient.id, newFactCategory, newFactText.trim());
      setNewFactText('');
      await loadClientMemory(storedClient.id);
      showToast('Context specification added successfully.', 'success');
    } catch (err) {
      showToast('Failed to add fact: ' + String(err), 'error');
    }
  };

  /**
   * Delete a fact from client memory
   */
  const handleDeleteFact = async (factId: string) => {
    try {
      await deleteClientFact(factId);
      if (storedClient) {
        await loadClientMemory(storedClient.id);
      }
      showToast('Fact removed from database.', 'info');
    } catch (err) {
      showToast('Failed to delete fact: ' + String(err), 'error');
    }
  };

  /**
   * Cycle / Update fact status: Proposed -> Confirmed -> Disputed
   */
  const handleUpdateFactStatus = async (factId: string, currentStatus: FactStatus) => {
    const cycleMap: Record<FactStatus, FactStatus> = {
      proposed: 'confirmed',
      confirmed: 'disputed',
      disputed: 'proposed',
    };
    const nextStatus = cycleMap[currentStatus] || 'confirmed';

    try {
      await updateFactStatus(factId, nextStatus);
      if (storedClient) {
        await loadClientMemory(storedClient.id);
      }
      showToast(`Fact status set to ${nextStatus.toUpperCase()}`, 'info');
    } catch (err) {
      showToast('Failed to update status: ' + String(err), 'error');
    }
  };

  /**
   * Resolve conflict and mark fact as Confirmed
   */
  const handleConfirmFact = async (factId: string) => {
    try {
      await updateFactStatus(factId, 'confirmed');
      if (storedClient) {
        await loadClientMemory(storedClient.id);
      }
      showToast('Context item confirmed and conflict resolved.', 'success');
    } catch (err) {
      showToast('Failed to confirm fact: ' + String(err), 'error');
    }
  };

  /**
   * Update client notes in IndexedDB
   */
  const handleSaveNotes = async () => {
    if (!storedClient) return;
    try {
      await updateClientNotes(storedClient.id, clientNotes);
      showToast('Client notes saved.', 'success');
    } catch (err) {
      showToast('Failed to save notes: ' + String(err), 'error');
    }
  };

  /**
   * Module 7: Save Seller Knowledge Base to Dexie
   */
  const handleSaveKnowledge = async () => {
    setIsSavingKnowledge(true);
    try {
      const updated = await saveSellerKnowledge(sellerProfile);
      setSellerProfile(updated);
      showToast('Seller guidelines saved. Drafts will adhere to your profile.', 'success');
    } catch (err) {
      showToast('Failed to save knowledge base: ' + String(err), 'error');
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  /**
   * Add a service to seller profile
   */
  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    if (sellerProfile.servicesOffered.includes(newServiceInput.trim())) {
      showToast('Service already in list.', 'info');
      return;
    }
    setSellerProfile({
      ...sellerProfile,
      servicesOffered: [...sellerProfile.servicesOffered, newServiceInput.trim()],
    });
    setNewServiceInput('');
  };

  /**
   * Remove a service from seller profile
   */
  const handleRemoveService = (serviceToRemove: string) => {
    setSellerProfile({
      ...sellerProfile,
      servicesOffered: sellerProfile.servicesOffered.filter((s) => s !== serviceToRemove),
    });
  };

  /**
   * Add a skill to seller profile
   */
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (sellerProfile.coreSkills.includes(newSkillInput.trim())) {
      showToast('Skill already in list.', 'info');
      return;
    }
    setSellerProfile({
      ...sellerProfile,
      coreSkills: [...sellerProfile.coreSkills, newSkillInput.trim()],
    });
    setNewSkillInput('');
  };

  /**
   * Remove a skill from seller profile
   */
  const handleRemoveSkill = (skillToRemove: string) => {
    setSellerProfile({
      ...sellerProfile,
      coreSkills: sellerProfile.coreSkills.filter((s) => s !== skillToRemove),
    });
  };

  /**
   * Reset Seller Knowledge to default
   */
  const handleResetKnowledge = async () => {
    if (window.confirm('Reset your Seller Knowledge Base back to default settings?')) {
      const reset = await saveSellerKnowledge(DEFAULT_SELLER_KNOWLEDGE);
      setSellerProfile(reset);
      showToast('Knowledge Base reset to default template.', 'info');
    }
  };

  /**
   * Export all IndexedDB data as structured JSON file
   */
  const handleExportData = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoreply-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Workspace backup exported successfully.', 'success');
    } catch (err) {
      console.error('[Memoreply] Export error:', err);
      showToast('Export failed: ' + String(err), 'error');
    }
  };

  /**
   * Delete All Data (Factory Reset) — Clears IndexedDB & chrome.storage.local
   */
  const handleClearAllDb = async () => {
    const confirmed = window.confirm(
      'PERMANENT DATA DELETION CONFIRMATION\n\n' +
        'This will permanently delete all data stored locally in MemoreplyDB (conversations, clients, clientFacts, messages, sellerKnowledge) and clear chrome.storage.local.\n\n' +
        'The extension will be reset to its initial state.\n\n' +
        'This action is irreversible. Are you sure you want to proceed?'
    );

    if (!confirmed) {
      return;
    }

    try {
      // 1. Clear IndexedDB tables
      await clearAllData();

      // 2. Clear Chrome local storage
      await chrome.storage.local.clear();

      // 3. Reset all UI and memory states to clean slate
      setStoredClient(null);
      setStoredFacts([]);
      setTotalStoredMessages(0);
      setClientNotes('');
      setConversation(null);
      setDraftText('');
      setAuthSession(null);
      setSellerProfile(DEFAULT_SELLER_KNOWLEDGE);
      await refreshDbStats();

      showToast('All local data cleared. Extension reset to initial state.', 'info');
    } catch (err) {
      console.error('[Memoreply] Data deletion error:', err);
      showToast('Data deletion failed: ' + String(err), 'error');
    }
  };

  /**
   * Directly import the latest reply from an open ChatGPT tab
   */
  const handleFetchLatestChatGPTReply = async () => {
    setIsFetchingFromTab(true);
    showToast('Checking web session tab for latest response...', 'info');
    try {
      chrome.runtime.sendMessage({ type: 'CHATGPT_FETCH_LATEST_REPLY' }, (response) => {
        setIsFetchingFromTab(false);
        if (chrome.runtime.lastError) {
          showToast(`Session error: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }
        if (response?.success && response.data?.replyText) {
          setDraftText(response.data.replyText);
          setIsGenerating(false);
          showToast('Response imported from web session.', 'success');
        } else {
          showToast(
            response?.error || 'Could not find response in web session tab. Please ensure response generation is complete.',
            'error'
          );
        }
      });
    } catch {
      setIsFetchingFromTab(false);
      showToast('Failed to communicate with web session tab.', 'error');
    }
  };

  /**
   * Generate AI Reply:
   * 1. Uses Context Assembler to get Dexie messages + client facts + seller knowledge
   * 2. Calls ChatGPT Web Backend API if session token is present
   * 3. Falls back to smart context template if no auth.json is uploaded yet
   */
  const handleGenerateReply = async () => {
    setIsGenerating(true);

    const clientUsername = conversation?.clientUsername ?? storedClient?.platformUserId ?? 'alex_miller_dev';
    const clientId = storedClient?.id ?? `fiverr_${clientUsername}`;
    const conversationId = `conv_fiverr_${conversation?.conversationId ?? clientUsername}`;

    // Auto-poll ChatGPT tab in background every 2s while generating.
    // If ChatGPT finishes or produces text, draft box gets populated immediately!
    let pollTimer: number | null = null;
    if (authSession?.token) {
      pollTimer = window.setInterval(() => {
        chrome.runtime.sendMessage({ type: 'CHATGPT_FETCH_LATEST_REPLY' }, (resp) => {
          if (resp?.success && resp.data?.replyText && resp.data.replyText.length > 30) {
            setDraftText(resp.data.replyText);
            setIsGenerating(false);
            if (pollTimer) {
              window.clearInterval(pollTimer);
              pollTimer = null;
            }
            showToast('Draft compiled via connected session.', 'success');
          }
        });
      }, 2000);
    }

    try {
      // Assemble context from Dexie
      const assembledContext = await assembleContext({
        clientId,
        conversationId,
        tone: activeTone,
        customInstruction,
        fallbackConversation: conversation,
      });

      // If user has loaded a ChatGPT session token, call ChatGPT Web backend
      if (authSession?.token) {
        showToast('Connecting to web session...', 'info');
        const aiResult = await openAIProvider.generateReply(
          assembledContext,
          authSession.token,
          selectedModel
        );

        if (aiResult?.replyText) {
          setDraftText(aiResult.replyText);
          showToast('Draft compiled via connected session.', 'success');
        }
      } else {
        // Fallback simulation when no session is loaded
        setTimeout(() => {
          const clientName = assembledContext.clientDisplayName;
          const budgetFact = storedFacts.find((f) => f.category === 'budget')?.fact;
          const timelineFact = storedFacts.find((f) => f.category === 'timeline')?.fact;

          const budgetText = budgetFact ? `your ${budgetFact.replace('Budget mentioned: ', '')} budget` : 'your budget';
          const timelineText = timelineFact ? `within ${timelineFact.replace('Timeline requested: ', '')}` : 'within your timeline';

          let reply = '';
          switch (activeTone) {
            case 'Friendly':
              reply = `Hi ${clientName}! Thanks so much for reaching out to ${sellerProfile.businessName}. I'd love to work with you on this project! Delivering ${timelineText} strictly within ${budgetText} sounds completely great. I'm ready to begin whenever you are!`;
              break;
            case 'Concise':
              reply = `Hi ${clientName}, thanks for the details. At ${sellerProfile.businessName}, we can deliver the solution ${timelineText} for ${budgetText}. Let's proceed.`;
              break;
            case 'Pitch / Offer':
              reply = `Hi ${clientName}, thanks for the project scope. As a specialist in ${sellerProfile.coreSkills.slice(0, 3).join(', ')}, I can guarantee top quality delivery ${timelineText} strictly adhering to ${budgetText}. Would you like me to send over a custom offer now?`;
              break;
            case 'Detailed':
              reply = `Hello ${clientName},\n\nThank you for the detailed requirements. Here is our proposed delivery roadmap from ${sellerProfile.businessName}:\n1. Architecture & component breakdown (${timelineText})\n2. Implementation according to specs within ${budgetText}\n3. Complete code delivery with revisions (${sellerProfile.revisionPolicy}).\n\nLet me know if you would like me to set up the milestone contract!`;
              break;
            case 'Follow-up':
              reply = `Hi ${clientName}, just checking in to see if you have any questions about my proposal or would like to see recent portfolio samples before we kick off?`;
              break;
            case 'Professional':
            default:
              reply = `Hi ${clientName},\n\nThank you for contacting ${sellerProfile.businessName}. I have reviewed your specifications and would be pleased to assist you. I can guarantee delivery ${timelineText} within ${budgetText}.\n\nPlease let me know if you are ready for a custom offer.`;
              break;
          }

          if (customInstruction.trim()) {
            reply += `\n\nP.S. Regarding your note: ${customInstruction.trim()}`;
          }

          setDraftText(reply);
          showToast(
            'Generated draft using local context. Connect auth.json in Settings for live model generation.',
            'info'
          );
        }, 500);
      }
    } catch (err: unknown) {
      console.error('[Memoreply] Generation error:', err);

      // Emergency Recovery: Check if ChatGPT tab already generated the reply before showing error!
      let recovered = false;
      try {
        const recovery = await new Promise<{ success: boolean; data?: { replyText: string } }>((resolve) => {
          chrome.runtime.sendMessage({ type: 'CHATGPT_FETCH_LATEST_REPLY' }, (r) => resolve(r));
        });
        if (recovery?.success && recovery.data?.replyText && recovery.data.replyText.length > 25) {
          setDraftText(recovery.data.replyText);
          showToast('Draft successfully recovered from web session tab.', 'success');
          recovered = true;
        }
      } catch {}

      if (!recovered) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(msg, 'error');
      }
    } finally {
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      setIsGenerating(false);
    }
  };

  /**
   * Insert draft directly into the Fiverr message box
   */
  const handleInsertDraft = async () => {
    if (!draftText.trim()) {
      showToast('Draft is empty. Generate or write a reply first.', 'error');
      return;
    }

    try {
      // 1. Locate the active Fiverr tab (handling side panel focus gracefully)
      let targetTab: chrome.tabs.Tab | undefined;
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab?.id && activeTab.url?.includes('fiverr.com')) {
        targetTab = activeTab;
      } else {
        const fiverrTabs = await chrome.tabs.query({ url: '*://*.fiverr.com/*' });
        targetTab = fiverrTabs.find((t) => t.active) || fiverrTabs[0] || activeTab;
      }

      if (!targetTab?.id) {
        showToast('Please open the Fiverr conversation tab in your browser.', 'error');
        return;
      }

      const targetTabId = targetTab.id;

      // Direct DOM injection function (used as fallback via chrome.scripting)
      const directInjectIntoComposer = (textToInsert: string): boolean => {
        const composerSelectors = [
          'textarea[placeholder*="message" i]',
          'textarea[placeholder*="type" i]',
          'textarea[placeholder*="reply" i]',
          'textarea[name="message"]',
          '[data-testid="chat-input"] textarea',
          '[class*="chat-input"] textarea',
          '[class*="composer"] textarea',
          '[class*="message-box"] textarea',
          '[role="textbox"][contenteditable="true"]',
          '[contenteditable="true"]',
          'textarea',
        ];

        let composer: HTMLElement | null = null;
        for (const sel of composerSelectors) {
          const el = document.querySelector<HTMLElement>(sel);
          if (el && el.offsetParent !== null) {
            composer = el;
            break;
          }
        }

        if (!composer) return false;

        composer.focus();
        if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          if (nativeSetter) {
            nativeSetter.call(composer, textToInsert);
          } else {
            composer.value = textToInsert;
          }
          composer.dispatchEvent(new Event('input', { bubbles: true }));
          composer.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (composer.getAttribute('contenteditable') === 'true') {
          document.execCommand('insertText', false, textToInsert);
          composer.dispatchEvent(new InputEvent('input', { bubbles: true, data: textToInsert }));
        }

        composer.focus();
        composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      };

      // 2. Try sending message to content script first
      chrome.tabs.sendMessage(
        targetTabId,
        {
          type: 'INSERT_DRAFT',
          payload: { text: draftText },
        },
        async (response) => {
          if (chrome.runtime.lastError || !response?.success) {
            // 3. Fallback: Direct DOM injection via chrome.scripting
            try {
              if (chrome.scripting?.executeScript) {
                const results = await chrome.scripting.executeScript({
                  target: { tabId: targetTabId },
                  func: directInjectIntoComposer,
                  args: [draftText],
                });

                if (results?.[0]?.result) {
                  showToast('Draft inserted into Fiverr composer! Review and send.', 'success');
                  return;
                }
              }
            } catch (injectionErr) {
              console.warn('[Memoreply] Scripting injection error:', injectionErr);
            }

            showToast('Please refresh (F5) the Fiverr page once to connect.', 'error');
            return;
          }

          showToast('Draft inserted into Fiverr composer! Review and send.', 'success');
        }
      );
    } catch (err) {
      showToast('Error sending draft: ' + String(err), 'error');
    }
  };

  /**
   * Copy draft to clipboard
   */
  const handleCopyDraft = () => {
    if (!draftText.trim()) return;
    navigator.clipboard.writeText(draftText);
    showToast('Copied draft to clipboard!', 'success');
  };

  const clientDisplayName = conversation?.clientDisplayName ?? storedClient?.displayName ?? 'Client';
  const messageCount = conversation?.messages?.length ?? 0;

  return (
    <div className="app-container">
      {/* Hidden file input for auth.json upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json,application/json"
        onChange={handleFileChange}
      />

      {/* ---------- Header ---------- */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">M</div>
          <div>
            <div className="app-logo-text">Memoreply</div>
          </div>
          <span className="app-logo-badge">Pro</span>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={syncFromActiveTab}
            title="Sync active thread"
          >
            {isSyncing ? (
              <span className="spinner" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            )}
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ---------- Platform Status Bar ---------- */}
      <div className="platform-bar">
        <div>
          {isUsingMock ? (
            <span className="platform-pill mock">Preview Mode (Sample Thread)</span>
          ) : isFiverrTab && conversation?.messages?.length ? (
            <span className="platform-pill fiverr-active">
              <span className="status-dot connected" /> Connected: @{conversation.clientUsername ?? 'Fiverr Chat'}
            </span>
          ) : isFiverrTab ? (
            <span className="platform-pill fiverr-idle">
              <span className="status-dot connected" /> Fiverr Inbox active
            </span>
          ) : (
            <span className="platform-pill offline">
              <span className="status-dot disconnected" /> Offline (Not on Fiverr)
            </span>
          )}
        </div>

        <div>
          {!isFiverrTab && (
            <button className="btn btn-ghost btn-sm" onClick={handleLoadMock}>
              {isUsingMock ? 'Reload Sample' : 'Load Sample Conversation'}
            </button>
          )}
        </div>
      </div>

      {/* ---------- Tab Navigation ---------- */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Inbox & Reply {messageCount > 0 && <span className="tab-count">{messageCount}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          Client Context {storedFacts.length > 0 && <span className="tab-count">{storedFacts.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Base
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      {/* ---------- Main Content ---------- */}
      <main className="tab-content">
        {/* ==================== TAB 1: INBOX & REPLY ==================== */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in">
            {/* Client Info Header Card */}
            {conversation ? (
              <div className="card">
                <div className="client-header" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                  <div className="client-avatar">
                    {clientDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="client-info">
                    <div className="client-name">{clientDisplayName}</div>
                    <div className="client-meta">
                      {conversation.clientUsername && `@${conversation.clientUsername} • `}
                      {totalStoredMessages > 0 ? `${totalStoredMessages} messages in context` : `${messageCount} messages`}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={syncFromActiveTab}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Reading...' : 'Refresh'}
                  </button>
                </div>

                {/* Persistent Memory Snapshot Strip */}
                {storedFacts.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                      Context Snapshot ({storedFacts.length} items):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {storedFacts.slice(0, 3).map((f) => (
                        <span key={f.id} className={`fact-badge badge-${f.category}`}>
                          {f.fact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="warning-banner">
                <div className="warning-text">
                  Open a conversation on <strong>Fiverr Inbox</strong> to sync messages, or click <strong>Load Sample Conversation</strong> above to preview the assistant.
                </div>
              </div>
            )}

            {/* Extracted Chat Messages Stream */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Conversation Thread</span>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {conversation?.extractedAt ? `Synced ${new Date(conversation.extractedAt).toLocaleTimeString()}` : ''}
                </span>
              </div>

              {conversation && conversation.messages.length > 0 ? (
                <div className="chat-stream">
                  {conversation.messages.map((msg: ExtractedMessage) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${msg.senderRole}`}
                    >
                      <div className="chat-bubble-meta">
                        <span>{msg.sender}</span>
                        {msg.timestamp && <span>• {msg.timestamp}</span>}
                      </div>
                      <div className={`chat-bubble ${msg.senderRole}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '20px 12px' }}>
                  <div className="empty-state-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className="empty-state-title">No conversation synced</div>
                  <div className="empty-state-desc">
                    Click "Refresh" when an active Fiverr conversation is visible.
                  </div>
                </div>
              )}
            </div>

            {/* Smart Composer */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Smart Composer</span>
                <span className={`badge-pill ${authSession ? 'active' : 'missing'}`}>
                  {authSession ? 'Web Session Connected' : 'Local Directives'}
                </span>
              </div>

              {/* Tone Selection */}
              <div className="tone-selector">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    className={`tone-chip ${activeTone === tone ? 'active' : ''}`}
                    onClick={() => setActiveTone(tone)}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {/* Optional Custom Directive */}
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="text-input"
                  style={{ height: '32px', fontSize: '12px', width: '100%' }}
                  placeholder="Optional directive: e.g. Request project wireframes, emphasize milestone delivery..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleGenerateReply}
                  disabled={isGenerating}
                  style={{ padding: '8px 12px' }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner" style={{ width: '13px', height: '13px' }} />
                      Generating response...
                    </>
                  ) : (
                    `Generate ${activeTone} Response`
                  )}
                </button>
              </div>

              {/* Direct Grab from ChatGPT Tab Button */}
              {authSession && (
                <div style={{ marginBottom: '10px' }}>
                  <button
                    className="btn btn-secondary btn-full btn-sm"
                    onClick={handleFetchLatestChatGPTReply}
                    disabled={isFetchingFromTab}
                    title="Pull the latest generated response from your open ChatGPT tab into this editor"
                  >
                    {isFetchingFromTab ? (
                      <>
                        <span className="spinner" style={{ width: '12px', height: '12px' }} />
                        Checking browser tab...
                      </>
                    ) : (
                      'Sync Latest from Web Tab'
                    )}
                  </button>
                </div>
              )}

              {/* Draft Textarea */}
              <textarea
                className="reply-editor"
                placeholder="Generated response will appear here, or compose directly..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {draftText.length} characters
                </span>
                {!authSession && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', color: 'var(--color-warning)' }}
                    onClick={() => setActiveTab('settings')}
                  >
                    Configure Credentials
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleInsertDraft}
                  disabled={!draftText.trim()}
                  title="Insert this reply into Fiverr message box without auto-sending"
                >
                  Insert into Fiverr
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleCopyDraft}
                  disabled={!draftText.trim()}
                  title="Copy reply text to clipboard"
                >
                  Copy Text
                </button>
                {draftText && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDraftText('')}
                    title="Clear editor"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: CLIENT CONTEXT ==================== */}
        {activeTab === 'memory' && (
          <div className="animate-fade-in">
            {/* Client Profile Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Client Profile</span>
                <span className="platform-pill mock">Local Context</span>
              </div>

              {storedClient ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div className="client-avatar">
                      {storedClient.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ fontSize: '13px' }}>
                        {storedClient.displayName}
                      </div>
                      <div className="text-tertiary" style={{ fontSize: '11px' }}>
                        @{storedClient.platformUserId} • Platform: {storedClient.platform}
                      </div>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{totalStoredMessages}</div>
                      <div className="stat-label">Messages</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{storedFacts.length}</div>
                      <div className="stat-label">Context Items</div>
                    </div>
                  </div>

                  {/* Client Notes Area */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="card-title" style={{ fontSize: '11px' }}>Client Notes</span>
                      <button className="btn btn-ghost btn-sm" onClick={handleSaveNotes}>
                        Save Note
                      </button>
                    </div>
                    <textarea
                      className="notes-editor"
                      placeholder="Add personal client notes (e.g. key preferences, delivery milestones, scope boundaries)..."
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '16px' }}>
                  <div className="empty-state-title">No client thread selected</div>
                  <div className="empty-state-desc">
                    Sync a conversation or click "Load Sample Conversation" to inspect stored context.
                  </div>
                </div>
              )}
            </div>

            {/* Client Facts List */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Confirmed & Proposed Context</span>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {storedFacts.length} items
                </span>
              </div>

              {storedFacts.length > 0 ? (
                <div className="fact-list">
                  {storedFacts.map((fact) => {
                    const status = fact.status || 'proposed';
                    return (
                      <div key={fact.id} className="fact-item-wrapper">
                        <div className={`fact-item ${fact.isConflicted ? 'is-conflicted' : ''}`}>
                          <div className="fact-main">
                            <span className={`fact-badge badge-${fact.category}`}>
                              {fact.category}
                            </span>
                            <span className="fact-text">{fact.fact}</span>
                          </div>
                          <div className="fact-actions">
                            <button
                              className={`status-pill ${status}`}
                              onClick={() => handleUpdateFactStatus(fact.id, status)}
                              title="Click to cycle status: Proposed → Confirmed → Disputed"
                            >
                              {status === 'confirmed' && '✓ '}
                              {status === 'disputed' && '✕ '}
                              {status === 'proposed' && '• '}
                              {status}
                            </button>
                            <span
                              className="text-tertiary"
                              style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                              title={`Source: ${fact.source}`}
                            >
                              {fact.source === 'extracted' ? 'Auto' : 'Manual'}
                            </span>
                            <button
                              className="btn-delete-fact"
                              onClick={() => handleDeleteFact(fact.id)}
                              title="Delete this record"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Visual Flag if Fact Contradicts Previously Saved Fact */}
                        {fact.isConflicted && (
                          <div className="conflict-alert-banner">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span><strong>Conflict:</strong> {fact.conflictReason || 'Differs from earlier record.'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '10px', height: '22px' }}
                                onClick={() => handleConfirmFact(fact.id)}
                                title="Resolve contradiction and confirm this value"
                              >
                                Confirm Value
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '16px' }}>
                  <div className="empty-state-title">No context records yet</div>
                  <div className="empty-state-desc">
                    Requirements are automatically extracted when threads sync, or you can add custom specifications below.
                  </div>
                </div>
              )}

              {/* Add Custom Fact Form */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <span className="card-title" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                  Add Context Specification
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <select
                    className="select-input"
                    value={newFactCategory}
                    onChange={(e) => setNewFactCategory(e.target.value as FactCategory)}
                    style={{ flex: 1 }}
                  >
                    {FACT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="text-input"
                    style={{ flex: 2 }}
                    placeholder="e.g. Requires React 19 and Vite..."
                    value={newFactText}
                    onChange={(e) => setNewFactText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleAddFact}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: SELLER KNOWLEDGE BASE ==================== */}
        {activeTab === 'knowledge' && (
          <div className="animate-fade-in">
            {/* Action Bar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span className="card-title" style={{ fontSize: '13px' }}>Seller Profile & Business Rules</span>
                <div className="form-hint">The composer references these parameters to tailor responses and uphold your business terms.</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveKnowledge}
                disabled={isSavingKnowledge}
              >
                {isSavingKnowledge ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            {/* Profile Identity Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Identity & Role</span>
              </div>

              <div className="form-group">
                <label className="form-label">Business / Freelancer Name</label>
                <input
                  type="text"
                  className="text-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. HashTurn Digital / Hassaan"
                  value={sellerProfile.businessName}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, businessName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Role Title</label>
                <input
                  type="text"
                  className="text-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Senior Full-Stack Engineer & Extension Specialist"
                  value={sellerProfile.roleTitle}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, roleTitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Introduction / Bio</label>
                <textarea
                  className="notes-editor"
                  style={{ minHeight: '65px' }}
                  placeholder="e.g. Full-stack engineer and browser extension specialist with 5+ years of experience delivering high-performance tools..."
                  value={sellerProfile.professionalIntro ?? ''}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, professionalIntro: e.target.value })}
                />
                <div className="form-hint">Used when introducing your background or pitching project capabilities.</div>
              </div>
            </div>

            {/* Services Offered Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Services Offered</span>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {sellerProfile.servicesOffered.length} services
                </span>
              </div>

              <div className="input-row">
                <input
                  type="text"
                  className="text-input"
                  placeholder="Add a service (e.g. Chrome Extension MV3)..."
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddService}>
                  Add
                </button>
              </div>

              <div className="tag-list">
                {sellerProfile.servicesOffered.map((service) => (
                  <span key={service} className="tag-chip">
                    {service}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveService(service)}
                      title="Remove service"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Core Skills & Tech Stack Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Core Skills & Tech Stack</span>
                <span className="text-tertiary" style={{ fontSize: '11px' }}>
                  {sellerProfile.coreSkills.length} skills
                </span>
              </div>

              <div className="input-row">
                <input
                  type="text"
                  className="text-input"
                  placeholder="Add a technology (e.g. Next.js, Python)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddSkill}>
                  Add
                </button>
              </div>

              <div className="tag-list">
                {sellerProfile.coreSkills.map((skill) => (
                  <span key={skill} className="tag-chip">
                    {skill}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveSkill(skill)}
                      title="Remove skill"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing & Revision Terms Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Pricing & Delivery Policy</span>
              </div>

              <div className="form-group">
                <label className="form-label">Pricing Policy & Minimum Scope</label>
                <textarea
                  className="notes-editor"
                  style={{ minHeight: '65px' }}
                  placeholder="e.g. Minimum order $100. Standard rate $40/hr. Milestones for projects >$500."
                  value={sellerProfile.pricingPolicy}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, pricingPolicy: e.target.value })}
                />
                <div className="form-hint">The composer references this policy to prevent quoting below your minimum threshold.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Revision & Delivery Policy</label>
                <textarea
                  className="notes-editor"
                  style={{ minHeight: '65px' }}
                  placeholder="e.g. 2 rounds of revisions included. Bug fixes are always free."
                  value={sellerProfile.revisionPolicy}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, revisionPolicy: e.target.value })}
                />
              </div>
            </div>

            {/* Availability & Policies Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Availability & Boundaries</span>
              </div>

              <div className="form-group">
                <label className="form-label">Working Hours / Timezone</label>
                <input
                  type="text"
                  className="text-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Mon-Sat: 9:00 AM - 9:00 PM (GMT+5). Response within 1 hour."
                  value={sellerProfile.communicationHours}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, communicationHours: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Communication Policies & Boundaries</label>
                <textarea
                  className="notes-editor"
                  style={{ minHeight: '75px' }}
                  placeholder="e.g. Never share external contact info. Request Figma/wireframes before quoting. Emphasize fast delivery."
                  value={sellerProfile.customRules}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, customRules: e.target.value })}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={handleSaveKnowledge}
                disabled={isSavingKnowledge}
              >
                {isSavingKnowledge ? 'Saving...' : 'Save Guidelines'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResetKnowledge}
                title="Reset to default template"
              >
                Reset Template
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: SETTINGS & AUTH ==================== */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            {/* ChatGPT Web Session Authentication Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Web Session Authentication</span>
                <span className={`badge-pill ${authSession ? 'active' : 'missing'}`}>
                  <span className={`status-dot ${authSession ? 'connected' : ''}`} style={{ width: '6px', height: '6px', marginRight: '5px' }} />
                  {authSession ? 'Connected' : 'No Session'}
                </span>
              </div>

              <p className="summary-text" style={{ fontSize: '12px', marginBottom: '12px' }}>
                Connect using your active ChatGPT web session credentials via <code>auth.json</code>. Zero API key costs and zero subscription charges.
              </p>

              {/* If Session is Loaded */}
              {authSession ? (
                <div className="session-box">
                  <div className="session-row">
                    <span className="session-label">Account:</span>
                    <span className="session-val font-semibold">{authSession.email || 'Web Session User'}</span>
                  </div>
                  {authSession.name && (
                    <div className="session-row">
                      <span className="session-label">Name:</span>
                      <span className="session-val">{authSession.name}</span>
                    </div>
                  )}
                  <div className="session-row">
                    <span className="session-label">Session Token:</span>
                    <span className="session-val" title={authSession.token}>
                      {authSession.token.slice(0, 16)}...{authSession.token.slice(-6)}
                    </span>
                  </div>
                  <div className="session-row">
                    <span className="session-label">Status:</span>
                    <span className="text-success session-val" style={{ fontSize: '11px', fontWeight: 600 }}>
                      Active (Stored Locally)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: '1 1 120px' }}
                      onClick={handleTestSession}
                      disabled={isTestingSession}
                    >
                      {isTestingSession ? <span className="spinner" /> : 'Test Connection'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 120px' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace auth.json
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 120px' }}
                      onClick={handleReloadExtension}
                      title="Reload extension and background service worker"
                    >
                      Reload Extension
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 120px' }}
                      onClick={() => chrome.tabs.create({ url: 'https://chatgpt.com', active: true })}
                      title="Open ChatGPT in a tab to keep the session bridge active"
                    >
                      Open Web Session
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)' }}
                      onClick={handleDisconnectSession}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                /* Drag and Drop Zone when No Session */
                <div
                  className={`dropzone ${isDraggingFile ? 'active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div className="dropzone-title">Upload auth.json session file</div>
                  <div className="dropzone-desc">
                    Drag and drop your <strong>auth.json</strong> file here, or click to browse.
                  </div>
                </div>
              )}

              {/* Instructions on how to export auth.json */}
              <div
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  marginTop: '12px',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Setup Guide: Exporting Session Credentials
                </div>
                <ol style={{ paddingLeft: '16px', margin: 0 }}>
                  <li>Log in to your account at <a href="https://chatgpt.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>chatgpt.com</a></li>
                  <li>In the same browser tab, open: <code style={{ color: 'var(--color-accent)' }}>chatgpt.com/api/auth/session</code></li>
                  <li>Right-click on the page and select <strong>Save Page As...</strong>, name it <strong>auth.json</strong></li>
                  <li>Upload or drag that file into the box above.</li>
                </ol>
              </div>

              {/* Model Selection */}
              <div style={{ marginTop: '14px' }}>
                <label className="font-medium" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Response Generation Engine
                </label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    chrome.storage.local.set({ memoreply_chatgpt_model: e.target.value });
                  }}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Management & Privacy (Module 6 & Module 8) */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">Data Storage & Privacy</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Local Storage Architecture • Zero-Telemetry
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="status-dot connected" style={{ width: '6px', height: '6px' }} />
                  Local-First
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 12px 0', lineHeight: 1.45 }}>
                Client conversations, context memory, and seller guidelines are saved strictly on this device inside IndexedDB (<strong>MemoreplyDB</strong>). No client data is uploaded to third-party databases.
              </p>

              <div className="stats-grid" style={{ marginBottom: '14px' }}>
                <div className="stat-card">
                  <div className="stat-number">{dbStats.clientsCount}</div>
                  <div className="stat-label">Clients</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{dbStats.conversationsCount}</div>
                  <div className="stat-label">Conversations</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{dbStats.messagesCount}</div>
                  <div className="stat-label">Messages</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{dbStats.factsCount}</div>
                  <div className="stat-label">Context Points</div>
                </div>
              </div>

              {/* Data Export Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-medium" style={{ fontSize: '12px' }}>Workspace Backup & Portability</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>JSON Format</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Retrieve all data from MemoreplyDB (conversations, clients, clientFacts, sellerKnowledge) and download a structured JSON file.
                </p>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={handleExportData}
                  style={{ marginTop: '4px' }}
                >
                  Export Workspace Backup
                </button>
              </div>

              {/* Danger Zone: Data Deletion Block */}
              <div className="danger-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="font-medium" style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                    Reset Local Storage
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Completely clear IndexedDB (<strong>MemoreplyDB</strong>) and <strong>chrome.storage.local</strong>, resetting the extension to a completely clean slate. Requires strict confirmation.
                </p>
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleClearAllDb}
                  style={{ marginTop: '4px' }}
                >
                  Clear All Local Data
                </button>
              </div>
            </div>

            {/* General Preferences Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">App Preferences</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-medium" style={{ fontSize: '13px' }}>Theme</span>
                  <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                    {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-medium" style={{ fontSize: '13px' }}>Fiverr Detection</span>
                  <span className={isFiverrTab ? 'text-success' : 'text-tertiary'} style={{ fontSize: '12px' }}>
                    {isFiverrTab ? 'Active Tab is Fiverr' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-medium" style={{ fontSize: '13px' }}>Active Tab URL</span>
                  <span
                    className="text-tertiary"
                    style={{ fontSize: '11px', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {activeTabUrl || 'None detected'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-medium" style={{ fontSize: '13px' }}>Demo Mode</span>
                  <button className="btn btn-secondary btn-sm" onClick={handleLoadMock}>
                    {isUsingMock ? 'Preview Active' : 'Load Preview Thread'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------- Toast Notification ---------- */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
