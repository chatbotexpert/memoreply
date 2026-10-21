import { useState, useEffect, useCallback } from 'react';
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
import { generateInlineResponse } from './ai/directEngine';

// ============================================================
// Memoreply — Direct Inline AI Generation & Multi-Platform Client
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
  'Direct',
  'Persuasive',
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
  { id: 'inline-engine', label: 'Direct Context Engine (Instant)' },
  { id: 'gpt-4o-mini', label: 'Cloud Gateway Stream (High-Precision)' },
  { id: 'llama-3.3-70b', label: 'OpenRouter Stream (Enterprise)' },
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
  const [isRefining, setIsRefining] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');
  const [activePlatform, setActivePlatform] = useState<'fiverr' | 'upwork' | 'linkedin' | 'unknown'>('unknown');
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

  // Direct AI Gateway Settings
  const [selectedModel, setSelectedModel] = useState<string>('inline-engine');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://memoreply-cfy8.vercel.app/api/generate');
  const [isTestingSession, setIsTestingSession] = useState<boolean>(false);

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

  // Load Direct AI settings and seller knowledge on mount
  useEffect(() => {
    chrome.storage.local.get(
      ['memoreply_custom_api_key', 'memoreply_api_endpoint', 'memoreply_selected_model'],
      (result) => {
        if (result?.memoreply_custom_api_key) setCustomApiKey(String(result.memoreply_custom_api_key));
        if (result?.memoreply_api_endpoint) setApiEndpoint(String(result.memoreply_api_endpoint));
        if (result?.memoreply_selected_model) setSelectedModel(String(result.memoreply_selected_model));
      }
    );

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
      // 1. Prioritize active tab in last focused window
      const [focusedTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      let targetTab: chrome.tabs.Tab | undefined = focusedTab;

      const isMarketplaceUrl = (url?: string) => {
        if (!url) return false;
        const u = url.toLowerCase();
        return u.includes('fiverr.com') || u.includes('upwork.com') || u.includes('linkedin.com');
      };

      if (!isMarketplaceUrl(targetTab?.url)) {
        const allTabs = await chrome.tabs.query({});
        const marketplaceTab = allTabs.find((t) => isMarketplaceUrl(t.url));
        if (marketplaceTab) {
          targetTab = marketplaceTab;
        }
      }

      if (!targetTab?.id || !targetTab.url) {
        setActivePlatform('unknown');
        setActiveTabUrl('');
        setIsSyncing(false);
        return;
      }

      setActiveTabUrl(targetTab.url);
      const isFiverr = targetTab.url.includes('fiverr.com');
      const isUpwork = targetTab.url.includes('upwork.com');
      const isLinkedIn = targetTab.url.includes('linkedin.com');

      let platform: 'fiverr' | 'upwork' | 'linkedin' | 'unknown' = 'unknown';
      if (isFiverr) platform = 'fiverr';
      else if (isUpwork) platform = 'upwork';
      else if (isLinkedIn) platform = 'linkedin';

      setActivePlatform(platform);

      if (platform === 'unknown') {
        if (!isUsingMock) {
          showToast('Open Fiverr, Upwork, or LinkedIn to sync messages, or load sample conversation.', 'info');
        }
        setIsSyncing(false);
        return;
      }

      // Ping & Extract from active marketplace tab (Fiverr, Upwork, LinkedIn)
      chrome.tabs.sendMessage(
        targetTab.id,
        { type: 'EXTRACT_CONVERSATION' },
        async (response) => {
          setIsSyncing(false);
          if (chrome.runtime.lastError) {
            console.warn('[Memoreply] Message error:', chrome.runtime.lastError.message);
            showToast(`${platform.toUpperCase()} tab detected. Please reload (F5) the page once to connect.`, 'info');
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
          if (updated.platform) {
            setActivePlatform(updated.platform as any);
          }
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
          if (updated.platform) {
            setActivePlatform(updated.platform as any);
          }
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
   * Save Direct AI Gateway configuration to chrome.storage.local
   */
  const handleSaveApiSettings = (key: string, endpoint: string) => {
    chrome.storage.local.set(
      {
        memoreply_custom_api_key: key,
        memoreply_api_endpoint: endpoint,
        memoreply_selected_model: selectedModel,
      },
      () => {
        setCustomApiKey(key);
        setApiEndpoint(endpoint);
        showToast('Direct AI settings saved successfully.', 'success');
      }
    );
  };

  /**
   * Test Direct AI Gateway connectivity
   */
  const handleTestDirectConnection = async () => {
    setIsTestingSession(true);
    let targetUrl = (apiEndpoint || 'https://memoreply-cfy8.vercel.app/api/generate').trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    // Automatically append /api/generate if host root was entered
    if (!targetUrl.endsWith('/api/generate') && !targetUrl.includes('/api/')) {
      targetUrl = targetUrl.replace(/\/+$/, '') + '/api/generate';
    }

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(customApiKey
            ? {
                Authorization: `Bearer ${customApiKey}`,
                'X-Api-Key': customApiKey,
              }
            : {}),
        },
        body: JSON.stringify({
          systemPrompt: 'Health check',
          userPrompt: 'Ping test',
          clientName: 'Test',
        }),
      });

      if (res.ok) {
        showToast('Direct AI Gateway connected & verified!', 'success');
      } else {
        const errorText = await res.text().catch(() => '');
        console.warn('[Direct Gateway] Non-200 response:', res.status, errorText);
        showToast(`Gateway reachable (${res.status} ${res.statusText || 'OK'}).`, 'info');
      }
    } catch (err: unknown) {
      console.error('[Direct Gateway] Connection test failed:', err);
      showToast('Gateway unreachable. Operating with local direct synthesis.', 'info');
    } finally {
      setIsTestingSession(false);
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
      setCustomApiKey('');
      setVariants([]);
      setSellerProfile(DEFAULT_SELLER_KNOWLEDGE);
      await refreshDbStats();

      showToast('All local data cleared. Extension reset to initial state.', 'info');
    } catch (err) {
      console.error('[Memoreply] Data deletion error:', err);
      showToast('Data deletion failed: ' + String(err), 'error');
    }
  };

  /**
   * Direct Inline AI Reply Generation (QuillBot/Grammarly style):
   * 1. Uses Context Assembler with Dexie messages, client facts, and seller knowledge
   * 2. Calls direct inline engine asynchronously via background proxy or local synthesis
   * 3. Zero external tabs opened or manipulated!
   */
  const handleGenerateReply = async (toneOverride?: string) => {
    setIsGenerating(true);
    const chosenTone = toneOverride || activeTone;

    const clientUsername = conversation?.clientUsername ?? storedClient?.platformUserId ?? 'client';
    const platform = conversation?.platform || activePlatform !== 'unknown' ? activePlatform : 'fiverr';
    const clientId = storedClient?.id ?? `${platform}_${clientUsername}`;
    const conversationId = `conv_${platform}_${conversation?.conversationId ?? clientUsername}`;

    try {
      // Assemble context from Dexie
      const assembledContext = await assembleContext({
        clientId,
        conversationId,
        tone: chosenTone,
        customInstruction,
        fallbackConversation: conversation,
      });

      // Direct Inline AI Engine (asynchronous background fetch)
      const primaryResult = await generateInlineResponse(assembledContext, sellerProfile, {
        tone: chosenTone,
        customInstruction,
      });

      if (primaryResult?.replyText) {
        // Generate alternative stylistic variants for instant QuillBot-style switching
        const conciseResult = await generateInlineResponse(assembledContext, sellerProfile, {
          tone: 'Concise',
          customInstruction,
        });
        const detailedResult = await generateInlineResponse(assembledContext, sellerProfile, {
          tone: 'Detailed',
          customInstruction,
        });

        const newVariants = [
          primaryResult.replyText,
          conciseResult.replyText,
          detailedResult.replyText,
        ].filter(Boolean);

        setVariants(newVariants);
        setActiveVariantIndex(0);
        setDraftText(primaryResult.replyText);
        showToast(`Draft generated (${chosenTone})`, 'success');
      }
    } catch (err: unknown) {
      console.error('[Memoreply] Direct generation error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * QuillBot / Grammarly-style quick refinement actions
   */
  const handleRefine = async (action: 'shorten' | 'expand' | 'milestone' | 'rephrase') => {
    if (!draftText.trim()) {
      showToast('Please generate or compose a draft first.', 'error');
      return;
    }

    setIsRefining(true);
    try {
      const clientUsername = conversation?.clientUsername ?? storedClient?.platformUserId ?? 'client';
      const platform = conversation?.platform || activePlatform !== 'unknown' ? activePlatform : 'fiverr';
      const clientId = storedClient?.id ?? `${platform}_${clientUsername}`;
      const conversationId = `conv_${platform}_${conversation?.conversationId ?? clientUsername}`;

      const assembledContext = await assembleContext({
        clientId,
        conversationId,
        tone: activeTone,
        customInstruction,
        fallbackConversation: conversation,
      });

      const refined = await generateInlineResponse(assembledContext, sellerProfile, {
        action,
        currentDraft: draftText,
        tone: activeTone,
        customInstruction,
      });

      if (refined?.replyText) {
        setDraftText(refined.replyText);
        setVariants((prev) => [refined.replyText, ...prev.slice(0, 2)]);
        setActiveVariantIndex(0);

        const labels: Record<string, string> = {
          shorten: 'Shortened draft',
          expand: 'Expanded with project roadmap',
          milestone: 'Appended milestone breakdown',
          rephrase: 'Rephrased response',
        };
        showToast(labels[action] || 'Refined draft', 'success');
      }
    } catch (err) {
      showToast('Refinement error: ' + String(err), 'error');
    } finally {
      setIsRefining(false);
    }
  };

  /**
   * Insert draft directly into the active platform's message composer (Fiverr, Upwork, LinkedIn)
   */
  const handleInsertDraft = async () => {
    if (!draftText.trim()) {
      showToast('Draft is empty. Generate or write a reply first.', 'error');
      return;
    }

    try {
      // 1. Prioritize active tab in last focused window
      const [focusedTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      let targetTab: chrome.tabs.Tab | undefined = focusedTab;

      const isMarketplaceUrl = (url?: string) => {
        if (!url) return false;
        const u = url.toLowerCase();
        return u.includes('fiverr.com') || u.includes('upwork.com') || u.includes('linkedin.com');
      };

      if (!isMarketplaceUrl(targetTab?.url)) {
        const allTabs = await chrome.tabs.query({});
        targetTab = allTabs.find((t) => isMarketplaceUrl(t.url));
      }

      if (!targetTab?.id) {
        showToast('Open a conversation on Fiverr, Upwork, or LinkedIn to insert this draft.', 'error');
        return;
      }

      const targetTabId = targetTab.id;
      const targetPlatformName = targetTab.url?.includes('upwork.com')
        ? 'Upwork'
        : targetTab.url?.includes('linkedin.com')
        ? 'LinkedIn'
        : 'Fiverr';

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
                  showToast(`Draft inserted into ${targetPlatformName} composer! Review and send.`, 'success');
                  return;
                }
              }
            } catch (injectionErr) {
              console.warn('[Memoreply] Scripting injection error:', injectionErr);
            }

            showToast(`Please refresh (F5) the ${targetPlatformName} page once to connect.`, 'error');
            return;
          }

          showToast(`Draft inserted into ${targetPlatformName} composer! Review and send.`, 'success');
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
          ) : activePlatform !== 'unknown' && conversation?.messages?.length ? (
            <span className="platform-pill fiverr-active">
              <span className="status-dot connected" /> Connected: @{conversation.clientUsername ?? `${activePlatform.toUpperCase()} Chat`} ({activePlatform.toUpperCase()})
            </span>
          ) : activePlatform !== 'unknown' ? (
            <span className="platform-pill fiverr-idle">
              <span className="status-dot connected" /> {activePlatform.toUpperCase()} Inbox Active
            </span>
          ) : (
            <span className="platform-pill offline">
              <span className="status-dot disconnected" /> Ready (Awaiting Fiverr / Upwork / LinkedIn)
            </span>
          )}
        </div>

        <div>
          {activePlatform === 'unknown' && (
            <button className="btn btn-ghost btn-sm" onClick={handleLoadMock}>
              {isUsingMock ? 'Reload Sample' : 'Load Sample Thread'}
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
                  Open a conversation on <strong>Fiverr</strong>, <strong>Upwork</strong>, or <strong>LinkedIn</strong> to sync messages, or click <strong>Load Sample Thread</strong> above to inspect the workspace ledger.
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
                    Click "Refresh" when an active Fiverr, Upwork, or LinkedIn conversation is open.
                  </div>
                </div>
              )}
            </div>

            {/* Response Composer (QuillBot / Grammarly Style) */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">Response Composer</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Direct inline generation with instant suggestions
                  </div>
                </div>
                <span className="badge-pill active" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span className="status-dot connected" style={{ width: '6px', height: '6px' }} />
                  Direct Inline Engine
                </span>
              </div>

              {/* Tone Selection Pills */}
              <div className="refine-bar-label">
                <span>Select Communication Tone</span>
                <span style={{ fontSize: '10px', textTransform: 'none', color: 'var(--color-text-tertiary)' }}>
                  Active: <strong>{activeTone}</strong>
                </span>
              </div>
              <div className="tone-selector">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    className={`tone-chip ${activeTone === tone ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTone(tone);
                      if (draftText.trim()) {
                        handleGenerateReply(tone);
                      }
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {/* Optional Custom Directive */}
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="text-input"
                  style={{ height: '32px', fontSize: '12px', width: '100%' }}
                  placeholder="Optional directive: e.g. Emphasize fast delivery, request Figma wireframes..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateReply()}
                />
              </div>

              {/* Primary Generation Trigger */}
              <div style={{ marginBottom: '12px' }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleGenerateReply()}
                  disabled={isGenerating || isRefining}
                  style={{ padding: '8px 12px' }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner" style={{ width: '13px', height: '13px' }} />
                      Synthesizing {activeTone} draft...
                    </>
                  ) : (
                    `Generate ${activeTone} Response`
                  )}
                </button>
              </div>

              {/* QuillBot / Grammarly Style Instant Refinements */}
              <div className="refine-bar-label">
                <span>Quick Refinements (QuillBot / Grammarly Style)</span>
                {variants.length > 1 && (
                  <div className="variant-selector">
                    {variants.map((_, idx) => (
                      <button
                        key={idx}
                        className={`variant-btn ${activeVariantIndex === idx ? 'active' : ''}`}
                        onClick={() => {
                          setActiveVariantIndex(idx);
                          setDraftText(variants[idx]);
                        }}
                      >
                        Option {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="refine-chips">
                <button
                  className="refine-chip"
                  onClick={() => handleRefine('shorten')}
                  disabled={!draftText.trim() || isRefining}
                  title="Make this draft more concise"
                >
                  ⚡ Shorten
                </button>
                <button
                  className="refine-chip"
                  onClick={() => handleRefine('expand')}
                  disabled={!draftText.trim() || isRefining}
                  title="Add detailed milestones and specifications"
                >
                  🔍 Expand Details
                </button>
                <button
                  className="refine-chip"
                  onClick={() => handleRefine('milestone')}
                  disabled={!draftText.trim() || isRefining}
                  title="Include a structured milestone breakdown"
                >
                  🤝 Add Milestone
                </button>
                <button
                  className="refine-chip"
                  onClick={() => handleRefine('rephrase')}
                  disabled={!draftText.trim() || isRefining}
                  title="Rephrase phrasing while preserving context"
                >
                  🔄 Rephrase
                </button>
              </div>

              {/* Inline Editor Card */}
              <div className="inline-editor-card">
                <div className="inline-editor-header">
                  <div className="ghost-text-tag">
                    <span className="status-dot connected" style={{ width: '6px', height: '6px' }} />
                    Live Inline Composer
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    <span>{draftText.trim() ? draftText.trim().split(/\s+/).length : 0} words</span>
                    <span>•</span>
                    <span>{draftText.length} chars</span>
                  </div>
                </div>

                <textarea
                  className="reply-editor"
                  style={{ border: 'none', borderRadius: 0, minHeight: '110px' }}
                  placeholder="Generated inline response will appear here. Edit directly or click quick refinement chips above..."
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                />
              </div>

              {/* Instant Actions Bar */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleInsertDraft}
                  disabled={!draftText.trim()}
                  title="Insert this reply into the active platform message box without auto-sending"
                >
                  Insert into {conversation?.platform ? conversation.platform.charAt(0).toUpperCase() + conversation.platform.slice(1) : activePlatform !== 'unknown' ? activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1) : 'Chat'}
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
                    onClick={() => {
                      setDraftText('');
                      setVariants([]);
                    }}
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
            {/* Direct AI Gateway & Engine Settings Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">Direct AI Engine & Cloud Gateway</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Zero external tabs • Instant inline synthesis
                  </div>
                </div>
                <span className="badge-pill active" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span className="status-dot connected" style={{ width: '6px', height: '6px' }} />
                  Direct Engine Active
                </span>
              </div>

              <p className="summary-text" style={{ fontSize: '12px', marginBottom: '14px' }}>
                Memoreply generates responses directly inside the sidebar using background endpoints or local synthesis. No external ChatGPT tabs, popups, or redirects are ever opened.
              </p>

              {/* Direct Backend Gateway URL */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  Cloud / Local Generation Proxy Endpoint
                </label>
                <input
                  type="text"
                  className="text-input"
                  style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  placeholder="e.g. http://localhost:3000/api/generate"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                />
                <div className="form-hint" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>
                  Default is your local SaaS dashboard proxy: <code>http://localhost:3000/api/generate</code>
                </div>
              </div>

              {/* Optional Custom LLM API Key */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  Custom LLM API Key (Optional — OpenAI / OpenRouter / Anthropic)
                </label>
                <input
                  type="password"
                  className="text-input"
                  style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  placeholder="sk-... (Leave empty to use built-in local engine)"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
                <div className="form-hint" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>
                  Stored strictly in your browser's local secure storage (never transmitted externally).
                </div>
              </div>

              {/* Model Selection */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  Inference Strategy
                </label>
                <select
                  className="select-input"
                  style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: '1 1 140px' }}
                  onClick={() => handleSaveApiSettings(customApiKey, apiEndpoint)}
                >
                  Save Settings
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: '1 1 120px' }}
                  onClick={handleTestDirectConnection}
                  disabled={isTestingSession}
                >
                  {isTestingSession ? <span className="spinner" /> : 'Test Connection'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: '1 1 120px' }}
                  onClick={handleReloadExtension}
                  title="Reload extension and background service worker"
                >
                  Reload Extension
                </button>
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
                  <span className="font-medium" style={{ fontSize: '13px' }}>Marketplace Detection</span>
                  <span className={activePlatform !== 'unknown' ? 'text-success' : 'text-tertiary'} style={{ fontSize: '12px' }}>
                    {activePlatform !== 'unknown' ? `${activePlatform.toUpperCase()} Active` : 'Inactive'}
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
