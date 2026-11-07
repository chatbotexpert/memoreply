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
import {
  getStorageUsageStats,
  purgeExpiredChats,
  updateRetentionPolicy,
  getRetentionPolicy,
  clearAllLocalChats,
  type StorageUsageStats,
  type StorageRetentionPolicy,
} from './utils/localChatStorage';
import {
  verifyLicenseWithSupabase,
  incrementFreeReplyCount,
  isCoreFeatureLocked,
  activateWithLicenseKey,
  loginDirectlyInExtension,
  type SubscriptionLicenseStatus,
  UPGRADE_URL,
} from './utils/licenseManager';

// ============================================================
// Memoreply — Direct Inline AI Generation & Multi-Platform Client
// ============================================================

type TabId = 'chat' | 'memory' | 'knowledge' | 'settings';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface CustomTone {
  id: string;
  label: string;
  instructions: string;
}

const DEFAULT_CUSTOM_TONES: CustomTone[] = [
  {
    id: 'tone_agency_elite',
    label: 'Agency Elite',
    instructions: 'Communicate with executive precision, outlining milestones, deliverable guarantees, and high-ROI value.',
  },
  {
    id: 'tone_freelance_friendly',
    label: 'Consultative',
    instructions: 'Warm, collaborative, ask clarifying questions, and recommend optimal technical architectures.',
  },
];

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
  // Web Authentication & Free Tier Session
  const [authSession, setAuthSession] = useState<{
    token: string;
    email: string;
    name: string;
    plan: string;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [licenseStatus, setLicenseStatus] = useState<SubscriptionLicenseStatus | null>(null);
  const [manualLicenseKey, setManualLicenseKey] = useState<string>('');
  const [isActivatingKey, setIsActivatingKey] = useState<boolean>(false);
  const [manualKeyError, setManualKeyError] = useState<string>('');
  const [activeStoredKey, setActiveStoredKey] = useState<string>('');

  // In-Extension Direct Authentication States
  const [authViewTab, setAuthViewTab] = useState<'signin' | 'license' | 'web'>('signin');
  const [extLoginEmail, setExtLoginEmail] = useState<string>('');
  const [extLoginPassword, setExtLoginPassword] = useState<string>('');
  const [isExtLoggingIn, setIsExtLoggingIn] = useState<boolean>(false);
  const [extLoginError, setExtLoginError] = useState<string>('');

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

  // Advanced SaaS States: Offline Detection & Custom Brand Voice Templates
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [newToneLabel, setNewToneLabel] = useState<string>('');
  const [newToneInstructions, setNewToneInstructions] = useState<string>('');
  const [isAddingTone, setIsAddingTone] = useState<boolean>(false);

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
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://memoreply.com/api/generate');
  const [isTestingSession, setIsTestingSession] = useState<boolean>(false);

  // Local-First Storage & Quota Guard States
  const [storageStats, setStorageStats] = useState<StorageUsageStats | null>(null);
  const [storagePolicy, setStoragePolicy] = useState<StorageRetentionPolicy | null>(null);
  const [isPurgingStorage, setIsPurgingStorage] = useState<boolean>(false);

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

  // Initial Web Session Check & Reactive Storage Listener
  useEffect(() => {
    chrome.storage.local.get(
      [
        'memoreply_auth_session',
        'memoreply_license_key',
        'memoreply_license_status',
        'memoreply_logged_out',
        'memoreply_custom_tones',
      ],
      (res: Record<string, any>) => {
        // If user explicitly logged out, ensure clean state
        if (res.memoreply_logged_out === true) {
          setAuthSession(null);
          setLicenseStatus(null);
          setActiveStoredKey('');
          setIsCheckingAuth(false);
          return;
        }

        const sess = res.memoreply_auth_session;
        // Strict mandatory auth: purge any legacy demo tokens or mock bypasses
        const isLegacyDemo =
          sess?.token?.startsWith('demo_ext_jwt_') ||
          sess?.token?.startsWith('demo_') ||
          sess?.userId?.startsWith('usr_demo_') ||
          sess?.email?.includes('alexmiller.io');

        if (isLegacyDemo) {
          chrome.storage.local.remove([
            'memoreply_auth_session',
            'memoreply_license_status',
            'memoreply_license_key',
          ]);
          setAuthSession(null);
          setLicenseStatus(null);
          setActiveStoredKey('');
          setIsCheckingAuth(false);
          return;
        }

        if (sess && typeof sess === 'object' && (sess.token || sess.licenseKey)) {
          setAuthSession({
            token: String(sess.token || sess.licenseKey),
            email: String(sess.email || ''),
            name: String(sess.name || 'Freelancer'),
            plan: String(sess.plan || 'Free'),
          });
          if (res.memoreply_license_key) {
            setActiveStoredKey(String(res.memoreply_license_key));
          }
          if (res.memoreply_license_status) {
            setLicenseStatus(res.memoreply_license_status as SubscriptionLicenseStatus);
          }
        } else {
          setAuthSession(null);
          setLicenseStatus(null);
          setActiveStoredKey('');
        }
        if (Array.isArray(res.memoreply_custom_tones) && res.memoreply_custom_tones.length > 0) {
          setCustomTones(res.memoreply_custom_tones);
        } else {
          setCustomTones(DEFAULT_CUSTOM_TONES);
        }
        setIsCheckingAuth(false);
      }
    );

    const handleOnline = () => {
      setIsOffline(false);
      showToast('Network connection restored. Online mode active.', 'success');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('Network connection lost. Switched to offline mode.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.memoreply_logged_out && changes.memoreply_logged_out.newValue === true) {
        setAuthSession(null);
        setLicenseStatus(null);
        setActiveStoredKey('');
        return;
      }
      if (changes.memoreply_auth_session) {
        const newVal = changes.memoreply_auth_session.newValue as Record<string, any> | undefined;
        const isLegacyDemo =
          newVal?.token?.startsWith('demo_ext_jwt_') ||
          newVal?.token?.startsWith('demo_') ||
          newVal?.userId?.startsWith('usr_demo_') ||
          newVal?.email?.includes('alexmiller.io');

        if (newVal && typeof newVal === 'object' && (newVal.token || newVal.licenseKey) && !isLegacyDemo) {
          setAuthSession({
            token: String(newVal.token || newVal.licenseKey),
            email: String(newVal.email || ''),
            name: String(newVal.name || 'Freelancer'),
            plan: String(newVal.plan || 'Free'),
          });
        } else {
          setAuthSession(null);
          setLicenseStatus(null);
          setActiveStoredKey('');
        }
      }
      if (changes.memoreply_license_key) {
        setActiveStoredKey(String(changes.memoreply_license_key.newValue || ''));
      }
      if (changes.memoreply_license_status) {
        setLicenseStatus((changes.memoreply_license_status.newValue as SubscriptionLicenseStatus) || null);
      }
      if (changes.memoreply_custom_tones && Array.isArray(changes.memoreply_custom_tones.newValue)) {
        setCustomTones(changes.memoreply_custom_tones.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSaveCustomTone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newToneLabel.trim()) {
      showToast('Please enter a tone title (e.g. Agency Voice).', 'error');
      return;
    }
    const newTone: CustomTone = {
      id: `tone_${Date.now()}`,
      label: newToneLabel.trim(),
      instructions: newToneInstructions.trim() || 'Maintain consistent agency voice and clear tone.',
    };
    const updated = [...customTones.filter((t) => t.id !== newTone.id), newTone];
    setCustomTones(updated);
    try {
      await chrome.storage.local.set({ memoreply_custom_tones: updated });
      setNewToneLabel('');
      setNewToneInstructions('');
      setIsAddingTone(false);
      setActiveTone(newTone.label);
      showToast(`Custom tone "${newTone.label}" created!`, 'success');
    } catch {
      showToast('Error saving custom tone.', 'error');
    }
  };

  const handleDeleteCustomTone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = customTones.find((t) => t.id === id);
    const updated = customTones.filter((t) => t.id !== id);
    setCustomTones(updated);
    try {
      await chrome.storage.local.set({ memoreply_custom_tones: updated });
      if (target && activeTone === target.label) {
        setActiveTone('Professional');
      }
      showToast('Custom tone deleted.', 'info');
    } catch {
      showToast('Error deleting tone.', 'error');
    }
  };

  const handleOpenWebLogin = () => {
    chrome.tabs.create({
      url: 'https://memoreply.com/dashboard',
    });
  };

  const handleActivateManualKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualLicenseKey.trim()) {
      setManualKeyError('Please paste your agency license key.');
      return;
    }
    setIsActivatingKey(true);
    setManualKeyError('');
    try {
      try {
        await chrome.storage.local.remove(['memoreply_logged_out']);
      } catch {}
      const status = await activateWithLicenseKey(manualLicenseKey.trim());
      setLicenseStatus(status);
      setActiveStoredKey(manualLicenseKey.trim().toUpperCase());
      setAuthSession({
        token: `license_manual_${Date.now()}`,
        email: status.email || 'licensed@memoreply.com',
        name: status.name || 'Licensed Workspace',
        plan: status.plan,
      });
      showToast(`Extension activated on ${status.plan}!`, 'success');
      setManualLicenseKey('');
    } catch (err: any) {
      setManualKeyError(err.message || 'Failed to activate key.');
    } finally {
      setIsActivatingKey(false);
    }
  };

  const handleInExtensionSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!extLoginEmail.trim()) {
      setExtLoginError('Please enter your registered work email.');
      return;
    }
    if (!extLoginPassword.trim()) {
      setExtLoginError('Please enter your account password.');
      return;
    }
    setIsExtLoggingIn(true);
    setExtLoginError('');
    try {
      try {
        await chrome.storage.local.remove(['memoreply_logged_out']);
      } catch {}
      const result = await loginDirectlyInExtension(extLoginEmail.trim(), extLoginPassword.trim());
      setAuthSession({
        token: result.session.token,
        email: result.session.email,
        name: result.session.name,
        plan: result.session.plan,
      });
      setLicenseStatus(result.status);
      setActiveStoredKey(result.session.licenseKey);
      showToast(`Welcome! Signed in as ${result.session.email}`, 'success');
      setExtLoginEmail('');
      setExtLoginPassword('');
    } catch (err: any) {
      setExtLoginError(err.message || 'Unable to sign in. Please verify credentials.');
    } finally {
      setIsExtLoggingIn(false);
    }
  };

  const handleOpenUpgrade = () => {
    chrome.tabs.create({
      url: UPGRADE_URL,
    });
  };

  const refreshLicenseStatus = useCallback(async (token?: string) => {
    const activeToken = token || authSession?.token;
    if (!activeToken) {
      setLicenseStatus(null);
      return;
    }
    try {
      const status = await verifyLicenseWithSupabase(activeToken);
      setLicenseStatus(status);
    } catch (err) {
      console.warn('[Memoreply License] Verification warning:', err);
    }
  }, [authSession?.token]);

  useEffect(() => {
    if (authSession?.token) {
      refreshLicenseStatus(authSession.token);
    } else {
      setLicenseStatus(null);
    }
  }, [authSession?.token, refreshLicenseStatus]);

  const handleLogout = async () => {
    try {
      await chrome.storage.local.remove([
        'memoreply_auth_session',
        'memoreply_license_status',
        'memoreply_license_key',
        'memoreply_user',
        'memoreply_token',
        'memoreply_free_usage_count',
      ]);
      await chrome.storage.local.set({ memoreply_logged_out: true });
    } catch {}

    setAuthSession(null);
    setLicenseStatus(null);
    setActiveStoredKey('');

    // Broadcast logout to all browser tabs so open memoreply.com / localhost tabs clear their local storage
    try {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'AUTH_LOGOUT' }).catch(() => {});
          }
        });
      });
    } catch {}

    showToast('Signed out of Memoreply.', 'info');
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

  // Refresh chrome.storage.local chat history & quota stats
  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await getStorageUsageStats();
      const policy = await getRetentionPolicy();
      setStorageStats(stats);
      setStoragePolicy(policy);
    } catch (err) {
      console.warn('[Memoreply Storage] Stats load error:', err);
    }
  }, []);

  useEffect(() => {
    refreshStorageStats();
  }, [refreshStorageStats]);

  const handleUpdateRetention = async (days: number) => {
    try {
      const updated = await updateRetentionPolicy({ retentionDays: days });
      setStoragePolicy(updated);
      showToast(`Data retention updated to ${days} days. Auto-purging enabled.`, 'success');
      await refreshStorageStats();
    } catch {
      showToast('Failed to update retention policy.', 'error');
    }
  };

  const handleManualPurge = async () => {
    setIsPurgingStorage(true);
    try {
      const days = storagePolicy?.retentionDays || 30;
      const res = await purgeExpiredChats(days);
      await refreshStorageStats();
      showToast(`Purge complete: ${res.purgedCount} conversation(s) older than ${days} days removed.`, 'info');
    } catch {
      showToast('Error purging expired chats.', 'error');
    } finally {
      setIsPurgingStorage(false);
    }
  };

  const handleClearLocalChatsOnly = async () => {
    if (window.confirm('Delete all locally cached client conversation messages? Client facts and profile will remain saved.')) {
      try {
        await clearAllLocalChats();
        await refreshStorageStats();
        showToast('All local client chat histories cleared.', 'info');
      } catch {
        showToast('Failed to clear local chat history.', 'error');
      }
    }
  };

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
   * Sync/Extract conversation from the currently active tab dynamically switching platforms
   */
  const syncFromActiveTab = useCallback(async (forcedPlatform?: 'fiverr' | 'upwork' | 'linkedin') => {
    setIsSyncing(true);
    try {
      // 1. Detect active tab in the current window (strict active tab detection)
      let currentTab: chrome.tabs.Tab | undefined;
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];
      } catch {
        const [focused] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        currentTab = focused;
      }

      const currentUrl = currentTab?.url || '';
      setActiveTabUrl(currentUrl);

      const urlLower = currentUrl.toLowerCase();
      let detectedPlatform: 'fiverr' | 'upwork' | 'linkedin' | 'unknown' = 'unknown';
      if (urlLower.includes('fiverr.com')) detectedPlatform = 'fiverr';
      else if (urlLower.includes('upwork.com')) detectedPlatform = 'upwork';
      else if (urlLower.includes('linkedin.com')) detectedPlatform = 'linkedin';

      const targetPlatform = forcedPlatform || detectedPlatform;
      setActivePlatform(targetPlatform);

      // If active tab is not a supported platform (e.g. google.com or any non-marketplace page)
      if (targetPlatform === 'unknown') {
        setIsSyncing(false);
        if (!isUsingMock) {
          setConversation(null);
          setStoredFacts([]);
          setTotalStoredMessages(0);
        }
        return;
      }

      // 2. Fetch platform-specific scraped chat history from chrome.storage.local
      const platformStorageKey = `currentConversation_${targetPlatform}`;
      chrome.storage.local.get([platformStorageKey, 'currentConversation'], async (res: Record<string, any>) => {
        const platformChat = (res[platformStorageKey] ||
          (res.currentConversation?.platform === targetPlatform ? res.currentConversation : null)) as ConversationData | null;

        if (platformChat && platformChat.messages && platformChat.messages.length > 0) {
          setConversation(platformChat);
          setIsUsingMock(false);
          persistConversationToDb(platformChat);
        }

        // 3. Trigger live scrape extraction from the active tab content script
        if (currentTab?.id && detectedPlatform === targetPlatform) {
          chrome.tabs.sendMessage(
            currentTab.id,
            { type: 'EXTRACT_CONVERSATION' },
            async (response) => {
              setIsSyncing(false);
              if (chrome.runtime.lastError) {
                console.warn('[Memoreply] Message error:', chrome.runtime.lastError.message);
                return;
              }

              if (response?.success && response.data) {
                setConversation(response.data);
                setIsUsingMock(false);
                const dbResult = await persistConversationToDb(response.data);
                chrome.storage.local.set({
                  currentConversation: response.data,
                  [platformStorageKey]: response.data,
                });
                if (dbResult) {
                  showToast(
                    `Synced ${response.data.messages.length} messages from ${targetPlatform.toUpperCase()}.`,
                    'success'
                  );
                }
              }
            }
          );
        } else {
          setIsSyncing(false);
        }
      });
    } catch (err) {
      console.error('[Memoreply] Sync error:', err);
      setIsSyncing(false);
    }
  }, [isUsingMock, persistConversationToDb]);

  // Initial tab detection and auto-sync on load + Real-time listeners
  useEffect(() => {
    let isMounted = true;
    syncFromActiveTab();
    refreshDbStats();

    // 1. Initial storage check for active platform
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab?.url || !isMounted) return;
      const u = tab.url.toLowerCase();
      let p: 'fiverr' | 'upwork' | 'linkedin' | 'unknown' = 'unknown';
      if (u.includes('fiverr.com')) p = 'fiverr';
      else if (u.includes('upwork.com')) p = 'upwork';
      else if (u.includes('linkedin.com')) p = 'linkedin';

      if (p !== 'unknown') {
        const platformKey = `currentConversation_${p}`;
        chrome.storage.local.get([platformKey, 'currentConversation'], (res: Record<string, any>) => {
          if (isMounted) {
            const cached = (res[platformKey] || (res.currentConversation?.platform === p ? res.currentConversation : null)) as ConversationData | null;
            if (cached && cached.messages && cached.messages.length > 0) {
              setConversation(cached);
              setActivePlatform(p);
              persistConversationToDb(cached);
            }
          }
        });
      } else if (!chrome?.runtime?.id) {
        // Auto-load interactive demo thread on web preview (e.g. Vercel)
        handleLoadMock();
      }
    });

    // 2. Real-time storage listener: auto-update when content script extracts messages
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!isMounted) return;
      const platforms = ['fiverr', 'upwork', 'linkedin'] as const;
      for (const p of platforms) {
        const key = `currentConversation_${p}`;
        if (changes[key]?.newValue) {
          const updated = changes[key].newValue as ConversationData;
          if (updated && updated.messages && updated.messages.length > 0) {
            if (activePlatform === p || activePlatform === 'unknown') {
              console.log('[Memoreply] Multi-platform switch updated:', p, updated.clientUsername);
              setConversation(updated);
              setActivePlatform(p);
              setIsUsingMock(false);
              persistConversationToDb(updated);
            }
          }
        }
      }

      if (changes.currentConversation?.newValue) {
        const updated = changes.currentConversation.newValue as ConversationData;
        if (updated && updated.messages && updated.messages.length > 0) {
          if (!updated.platform || updated.platform === activePlatform) {
            setConversation(updated);
            setIsUsingMock(false);
            persistConversationToDb(updated);
          }
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // 3. Real-time message listener from content script
    const handleRuntimeMessage = (message: { type?: string; payload?: unknown }) => {
      if (message?.type === 'CONVERSATION_EXTRACTED' && message?.payload && isMounted) {
        const updated = message.payload as ConversationData;
        if (updated && updated.messages && updated.messages.length > 0) {
          if (!updated.platform || updated.platform === activePlatform || activePlatform === 'unknown') {
            setConversation(updated);
            setIsUsingMock(false);
            if (updated.platform) setActivePlatform(updated.platform as any);
            persistConversationToDb(updated);
          }
        }
      }
    };
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    // 4. Tab change & update listeners: re-sync immediately when switching tabs
    const handleTabActivated = () => {
      if (isMounted) syncFromActiveTab();
    };
    const handleTabUpdated = (_tabId: number, changeInfo: { url?: string }) => {
      if (changeInfo.url && isMounted) syncFromActiveTab();
    };

    chrome.tabs.onActivated?.addListener(handleTabActivated);
    chrome.tabs.onUpdated?.addListener(handleTabUpdated);

    return () => {
      isMounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      chrome.tabs.onActivated?.removeListener(handleTabActivated);
      chrome.tabs.onUpdated?.removeListener(handleTabUpdated);
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
    let targetUrl = (apiEndpoint || 'https://memoreply.com/api/generate').trim();
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
    // 1. Mandatory Auth & Subscription Limit Check
    if (isCoreFeatureLocked(licenseStatus)) {
      if (!authSession) {
        showToast('Please sign in to Memoreply to generate AI replies.', 'error');
        return;
      }
      if (licenseStatus?.isExpired) {
        showToast('Subscription expired. Please renew on memoreply.com.', 'error');
        return;
      }
      if (licenseStatus?.tier === 'FREE' && licenseStatus.limits.isExhausted) {
        showToast('Free tier monthly limit exhausted. Upgrade to Pro for unlimited AI replies!', 'error');
        return;
      }
    }

    setIsGenerating(true);
    const chosenTone = toneOverride || activeTone;

    // Check if a Custom Tone / Brand Voice Template is selected
    const matchingCustomTone = customTones.find(
      (t) => t.label.toLowerCase() === chosenTone.toLowerCase()
    );
    const effectiveInstruction = [
      matchingCustomTone ? `[Brand Voice Guideline: ${matchingCustomTone.instructions}]` : '',
      customInstruction.trim(),
    ].filter(Boolean).join('\n\n');

    const clientUsername = conversation?.clientUsername ?? storedClient?.platformUserId ?? 'client';
    const platform = conversation?.platform || activePlatform !== 'unknown' ? activePlatform : 'fiverr';
    const clientId = storedClient?.id ?? `${platform}_${clientUsername}`;
    const conversationId = `conv_${platform}_${conversation?.conversationId ?? clientUsername}`;

    try {
      if (!navigator.onLine) {
        showToast('Offline state active. Synthesizing response locally...', 'info');
      }

      // Assemble context from Dexie
      const assembledContext = await assembleContext({
        clientId,
        conversationId,
        tone: chosenTone,
        customInstruction: effectiveInstruction,
        fallbackConversation: conversation,
      });

      // Direct Inline AI Engine (asynchronous background fetch)
      const primaryResult = await generateInlineResponse(assembledContext, sellerProfile, {
        tone: chosenTone,
        customInstruction: effectiveInstruction,
      });

      if (primaryResult?.replyText) {
        // Generate alternative stylistic variants for instant QuillBot-style switching
        let conciseText = '';
        let detailedText = '';
        try {
          const conciseResult = await generateInlineResponse(assembledContext, sellerProfile, {
            tone: 'Concise',
            customInstruction: effectiveInstruction,
          });
          conciseText = conciseResult.replyText;
        } catch {}

        try {
          const detailedResult = await generateInlineResponse(assembledContext, sellerProfile, {
            tone: 'Detailed',
            customInstruction: effectiveInstruction,
          });
          detailedText = detailedResult.replyText;
        } catch {}

        const newVariants = [
          primaryResult.replyText,
          conciseText,
          detailedText,
        ].filter(Boolean);

        setVariants(newVariants);
        setActiveVariantIndex(0);
        setDraftText(primaryResult.replyText);
        showToast(`Draft generated (${chosenTone})`, 'success');

        // Track Free Tier AI response usage & sync to user metadata in PostgreSQL
        if (licenseStatus?.tier === 'FREE') {
          const { newCount, isExhausted } = await incrementFreeReplyCount(authSession?.token);
          const maxRep = licenseStatus.limits.maxReplies || 50;
          setLicenseStatus((prev) =>
            prev
              ? {
                  ...prev,
                  limits: {
                    ...prev.limits,
                    repliesUsed: newCount,
                    isExhausted,
                    remainingReplies: Math.max(0, maxRep - newCount),
                    percentUsed: Math.min(100, Math.round((newCount / maxRep) * 100)),
                  },
                }
              : null
          );
        }
      }
    } catch (err: unknown) {
      console.error('[Memoreply] Direct generation error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);

      // Robust Offline & Network Fallback Handler
      if (!navigator.onLine || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('fetch')) {
        showToast('Network connection lost. Switched to offline context mode.', 'info');
        try {
          const fallbackText = `Hi ${clientUsername},\n\nThank you for your message regarding the project on ${platform.toUpperCase()}.\n\nI have reviewed the scope and will provide our detailed execution plan and milestones shortly.\n\nBest regards,\n${sellerProfile?.businessName || 'HashTurn Agency'}`;
          setDraftText(fallbackText);
          setVariants([fallbackText]);
          setActiveVariantIndex(0);
          showToast('Draft synthesized using offline client memory.', 'success');
          return;
        } catch {}
      }
      showToast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * QuillBot / Grammarly-style quick refinement actions
   */
  const handleRefine = async (action: 'shorten' | 'expand' | 'milestone' | 'rephrase') => {
    if (isCoreFeatureLocked(licenseStatus)) {
      showToast('Core features locked. Upgrade on memoreply.com for unlimited AI refinements.', 'error');
      return;
    }
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
    if (isCoreFeatureLocked(licenseStatus)) {
      showToast('Core features locked. Upgrade on memoreply.com to insert drafts.', 'error');
      return;
    }
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
            // Strict LinkedIn anti-ban fallback: If direct placement is blocked, copy to clipboard
            if (targetPlatformName === 'LinkedIn' || response?.needsClipboard) {
              try {
                await navigator.clipboard.writeText(draftText);
                showToast('LinkedIn Safe Mode: Copied to clipboard! Press Ctrl+V (or Cmd+V) to paste.', 'success');
              } catch {
                showToast('Draft ready. Please copy and paste into LinkedIn.', 'info');
              }
              return;
            }

            // 3. Fallback for other platforms: Direct DOM injection via chrome.scripting
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

          if (targetPlatformName === 'LinkedIn') {
            showToast('Draft safely placed into LinkedIn composer! Please review before sending.', 'success');
          } else {
            showToast(`Draft inserted into ${targetPlatformName} composer! Review and send.`, 'success');
          }
        }
      );
    } catch (err) {
      showToast('Error sending draft: ' + String(err), 'error');
    }
  };

  /**
   * Copy draft to clipboard with platform-aware feedback
   */
  const handleCopyDraft = () => {
    if (!draftText.trim()) return;
    navigator.clipboard.writeText(draftText);
    if (activePlatform === 'linkedin' || conversation?.platform === 'linkedin') {
      showToast('Copied to clipboard! Ready to paste into LinkedIn (Ctrl+V).', 'success');
    } else {
      showToast('Copied draft to clipboard!', 'success');
    }
  };

  const clientDisplayName = conversation?.clientDisplayName ?? storedClient?.displayName ?? 'Client';
  const messageCount = conversation?.messages?.length ?? 0;

  // Loading state
  if (isCheckingAuth) {
    return (
      <div style={{ width: 380, height: 520, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  // ========================================================
  // MANDATORY AUTH GUARD: In-Extension Authentication Screen
  // ========================================================
  if (!authSession) {
    return (
      <div style={{ width: 380, minHeight: 540, background: '#09090b', color: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/icons/icon-48.png" alt="Memoreply" style={{ width: 26, height: 26, borderRadius: 7 }} />
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Memoreply</span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 999, background: '#18181b', color: '#a1a1aa', border: '1px solid #27272a' }}>
              v0.1.1
            </span>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, background: '#18181b', padding: 3, borderRadius: 10, border: '1px solid #27272a', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => { setAuthViewTab('signin'); setExtLoginError(''); }}
              style={{
                padding: '6px 8px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: authViewTab === 'signin' ? '#27272a' : 'transparent',
                color: authViewTab === 'signin' ? '#ffffff' : '#71717a',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthViewTab('license'); setManualKeyError(''); }}
              style={{
                padding: '6px 8px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: authViewTab === 'license' ? '#27272a' : 'transparent',
                color: authViewTab === 'license' ? '#ffffff' : '#71717a',
                transition: 'all 0.15s ease',
              }}
            >
              License Key
            </button>
            <button
              type="button"
              onClick={() => setAuthViewTab('web')}
              style={{
                padding: '6px 8px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: authViewTab === 'web' ? '#27272a' : 'transparent',
                color: authViewTab === 'web' ? '#ffffff' : '#71717a',
                transition: 'all 0.15s ease',
              }}
            >
              Web Sync
            </button>
          </div>

          {/* TAB 1: In-Extension Direct Sign In */}
          {authViewTab === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <form onSubmit={handleInExtensionSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {extLoginError && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: 11, lineHeight: 1.4 }}>
                    {extLoginError}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Agency Work Email
                  </label>
                  <input
                    type="email"
                    value={extLoginEmail}
                    onChange={(e) => setExtLoginEmail(e.target.value)}
                    placeholder="seller@agency.com"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      color: '#ffffff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Password
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        chrome.tabs.create({ url: 'https://memoreply.com/forgot-password' });
                      }}
                      style={{ fontSize: 10, color: '#71717a', textDecoration: 'none' }}
                    >
                      Forgot?
                    </a>
                  </div>
                  <input
                    type="password"
                    value={extLoginPassword}
                    onChange={(e) => setExtLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      color: '#ffffff',
                      fontSize: 12,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isExtLoggingIn}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#10b981',
                    color: '#09090b',
                    fontWeight: 700,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 2,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <span>{isExtLoggingIn ? 'Verifying Account...' : 'Sign In to Workspace'}</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: License Key Activation */}
          {authViewTab === 'license' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#18181b', border: '1px solid #27272a' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: 4 }}>
                  Activate via License Key
                </span>
                <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                  Paste the agency key assigned to your seat from <strong>memoreply.com/dashboard</strong>.
                </p>
              </div>

              <form onSubmit={handleActivateManualKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={manualLicenseKey}
                  onChange={(e) => setManualLicenseKey(e.target.value)}
                  placeholder="e.g. MR-AGENCYPRO-ACTIVE-SEC"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    color: '#ffffff',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                {manualKeyError && (
                  <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>{manualKeyError}</p>
                )}
                <button
                  type="submit"
                  disabled={isActivatingKey}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#ffffff',
                    color: '#09090b',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>{isActivatingKey ? 'Activating Key...' : 'Activate License'}</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Web Dashboard Sync */}
          {authViewTab === 'web' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 10, background: '#18181b', border: '1px solid #27272a', textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: 6 }}>
                  Sync from Browser Session
                </span>
                <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                  If you are already logged in to your agency workspace on <strong>memoreply.com</strong>, click below to bridge your session automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenWebLogin}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: '#10b981',
                  color: '#09090b',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>Open memoreply.com Dashboard</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer Link & Features */}
        <div style={{ borderTop: '1px solid #27272a', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: '#71717a' }}>Need an agency account?</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                chrome.tabs.create({ url: 'https://memoreply.com/signup' });
              }}
              style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign Up on Web →
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 10, color: '#52525b', paddingTop: 4 }}>
            <span>✓ 50 Free AI Replies</span>
            <span>✓ Fiverr & Upwork Bar</span>
            <span>✓ Local Ledger</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUBSCRIPTION EXPIRED / REVOKED LOCK GATE
  // ========================================================
  if (licenseStatus?.isExpired) {
    return (
      <div style={{ width: 380, height: 540, background: '#09090b', color: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24, boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/icons/icon-48.png" alt="Memoreply" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Memoreply</span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 999, background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>
              EXPIRED
            </span>
          </div>

          {/* Hero Warning Card */}
          <div style={{ padding: 18, borderRadius: 16, background: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)', border: '1px solid #7f1d1d', marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              Subscription Expired or Revoked
            </h2>
            <p style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.5, margin: 0 }}>
              Your Memoreply agency/freelancer license for <strong>{authSession?.email || 'this account'}</strong> has expired or was revoked.
            </p>
          </div>

          {/* Recovery Instructions */}
          <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              To Restore Instant Access
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a1a1aa' }}>
              <span style={{ color: '#ef4444' }}>•</span> Renew your subscription on memoreply.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a1a1aa' }}>
              <span style={{ color: '#ef4444' }}>•</span> Or update your license key from your web dashboard
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => chrome.tabs.create({ url: UPGRADE_URL })}
            style={{ width: '100%', padding: '11px 16px', borderRadius: 10, background: '#ef4444', color: '#ffffff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}
          >
            <span>Renew Plan on memoreply.com</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', fontSize: 12, cursor: 'pointer' }}
          >
            Switch Account / Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div style={{
          background: '#451a03',
          color: '#fef3c7',
          padding: '6px 12px',
          fontSize: '11px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderBottom: '1px solid #92400e',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <span>⚠️</span>
          <span>Network connection lost. Offline fallback mode active.</span>
        </div>
      )}

      {/* ---------- Header ---------- */}
      <header className="app-header">
        <div className="app-logo">
          <img src="/icons/icon-48.png" alt="Memoreply" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }} />
          <div>
            <div className="app-logo-text">Memoreply</div>
            {authSession?.email && (
              <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', lineHeight: 1, marginTop: '2px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {authSession.email}
              </div>
            )}
          </div>
          <span
            className="app-logo-badge"
            style={{
              background: licenseStatus?.isLicensed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              color: licenseStatus?.isLicensed ? '#10b981' : '#a1a1aa',
              border: `1px solid ${licenseStatus?.isLicensed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            {licenseStatus?.plan || authSession?.plan || 'Free'}
          </span>
        </div>

        <div className="header-actions">
          {licenseStatus?.tier === 'FREE' && (
            <button
              onClick={handleOpenUpgrade}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
              }}
              title="Upgrade to Pro on memoreply.com"
            >
              Upgrade
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            title="Sign out of Memoreply"
            style={{ fontSize: 11, color: '#71717a', padding: '4px 8px' }}
          >
            Logout
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => syncFromActiveTab()}
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
          ) : activePlatform === 'linkedin' && conversation?.messages?.length ? (
            <span className="platform-pill linkedin-active" style={{ background: 'rgba(10, 102, 194, 0.15)', color: '#70b5f9', border: '1px solid rgba(10, 102, 194, 0.3)' }}>
              <span className="status-dot connected" style={{ background: '#0a66c2' }} /> LinkedIn Safe Mode (@{conversation.clientUsername || conversation.clientDisplayName || 'Contact'})
            </span>
          ) : activePlatform === 'linkedin' ? (
            <span className="platform-pill linkedin-idle" style={{ background: 'rgba(10, 102, 194, 0.12)', color: '#70b5f9', border: '1px solid rgba(10, 102, 194, 0.25)' }}>
              <span className="status-dot connected" style={{ background: '#0a66c2' }} /> LinkedIn Safe Mode (Read-Only)
            </span>
          ) : activePlatform !== 'unknown' && conversation?.messages?.length ? (
            <span className={`platform-pill ${activePlatform}-active`}>
              <span className="status-dot connected" /> Connected: @{conversation.clientUsername || conversation.clientDisplayName || `${activePlatform.toUpperCase()} Client`} ({activePlatform.toUpperCase()})
            </span>
          ) : activePlatform !== 'unknown' ? (
            <span className={`platform-pill ${activePlatform}-idle`}>
              <span className="status-dot connected" /> {activePlatform.toUpperCase()} Active (Awaiting Chat)
            </span>
          ) : (
            <span className="platform-pill offline">
              <span className="status-dot disconnected" /> Ready (Awaiting Fiverr / Upwork / LinkedIn)
            </span>
          )}
        </div>

        <div>
          {activePlatform === 'unknown' ? (
            <button className="btn btn-ghost btn-sm" onClick={handleLoadMock}>
              {isUsingMock ? 'Reload Sample' : 'Load Sample Thread'}
            </button>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => syncFromActiveTab()}
              disabled={isSyncing}
              style={{ fontSize: '11px', padding: '2px 8px' }}
              title={activePlatform === 'linkedin' ? 'Manually read active LinkedIn conversation (Read-Only)' : 'Sync current thread'}
            >
              {isSyncing ? (activePlatform === 'linkedin' ? 'Reading...' : 'Syncing...') : (activePlatform === 'linkedin' ? '↻ Read Chat' : '↻ Refresh')}
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
            {!conversation ? (
              /* Clean Multi-Platform Fallback State */
              <div className="card" style={{ padding: '28px 18px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    color: 'var(--color-primary)',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                  {activePlatform !== 'unknown'
                    ? `${activePlatform.toUpperCase()} Chat Awaiting Sync`
                    : 'No Active Chat Open'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 auto 18px auto', maxWidth: '300px', lineHeight: 1.5 }}>
                  Open Fiverr, Upwork, or LinkedIn chat to sync messages.
                </p>

                {/* Direct Platform Quick Launch Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px', margin: '0 auto' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => chrome.tabs?.create({ url: 'https://www.fiverr.com/inbox' })}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '7px 12px' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1dbf73' }} />
                    <span>Open Fiverr Inbox</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => chrome.tabs?.create({ url: 'https://www.upwork.com/messages' })}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '7px 12px' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14a800' }} />
                    <span>Open Upwork Messages</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => chrome.tabs?.create({ url: 'https://www.linkedin.com/messaging' })}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '7px 12px' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a66c2' }} />
                    <span>Open LinkedIn Messaging</span>
                  </button>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleLoadMock} style={{ fontSize: '11px' }}>
                    Or click here to load sample demo conversation
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Client Info Header Card */}
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
                        {conversation.platform && ` • ${conversation.platform.toUpperCase()}`}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => syncFromActiveTab()}
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
              <div className="tone-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
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
                {/* User Defined Custom Tones */}
                {customTones.map((ct) => (
                  <button
                    key={ct.id}
                    className={`tone-chip ${activeTone === ct.label ? 'active' : ''}`}
                    style={{
                      border: activeTone === ct.label ? '1px solid #10b981' : '1px dashed rgba(16, 185, 129, 0.4)',
                    }}
                    onClick={() => {
                      setActiveTone(ct.label);
                      if (draftText.trim()) {
                        handleGenerateReply(ct.label);
                      }
                    }}
                    title={`Brand Guideline: ${ct.instructions}`}
                  >
                    <span>★ {ct.label}</span>
                  </button>
                ))}
                {/* Add Custom Tone Toggle Button */}
                <button
                  className="tone-chip"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onClick={() => setIsAddingTone(!isAddingTone)}
                >
                  {isAddingTone ? '✕ Close' : '+ Custom'}
                </button>
              </div>

              {/* Quick Inline Custom Tone Creator */}
              {isAddingTone && (
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid #27272a',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
                    + New Brand Voice / Custom Prompt Style
                  </div>
                  <input
                    type="text"
                    value={newToneLabel}
                    onChange={(e) => setNewToneLabel(e.target.value)}
                    placeholder="Tone name (e.g. Agency Closer, Bold Pitch)"
                    style={{
                      fontSize: '11px',
                      padding: '5px 8px',
                      borderRadius: '5px',
                      background: '#09090b',
                      border: '1px solid #3f3f46',
                      color: '#fafafa',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <textarea
                    value={newToneInstructions}
                    onChange={(e) => setNewToneInstructions(e.target.value)}
                    placeholder="Brand guidelines or instructions (e.g. Always reference 24h turnarounds and high ROI)..."
                    rows={2}
                    style={{
                      fontSize: '11px',
                      padding: '5px 8px',
                      borderRadius: '5px',
                      background: '#09090b',
                      border: '1px solid #3f3f46',
                      color: '#fafafa',
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      onClick={() => setIsAddingTone(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '10px', padding: '3px 10px', background: '#10b981', color: '#09090b', fontWeight: 600 }}
                      onClick={handleSaveCustomTone}
                    >
                      Save Tone
                    </button>
                  </div>
                </div>
              )}

              {/* Usage Quota Tracker: Visual Progress Bar */}
              <div style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: (licenseStatus?.limits?.percentUsed || 0) >= 90 ? '#ef4444' : (licenseStatus?.limits?.percentUsed || 0) >= 70 ? '#f59e0b' : '#10b981'
                    }} />
                    {licenseStatus?.isLicensed ? 'Agency Pro Quota' : 'Monthly AI Reply Quota'}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {licenseStatus?.isLicensed
                      ? `${licenseStatus.limits?.repliesUsed ?? 0} Replies Used`
                      : `${licenseStatus?.limits?.repliesUsed ?? 0} / ${licenseStatus?.limits?.maxReplies ?? 50} Used`}
                  </span>
                </div>
                {!licenseStatus?.isLicensed && (
                  <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${Math.min(100, licenseStatus?.limits?.percentUsed ?? 0)}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: (licenseStatus?.limits?.percentUsed || 0) >= 90
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : (licenseStatus?.limits?.percentUsed || 0) >= 70
                          ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                          : 'linear-gradient(90deg, #10b981, #34d399)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                  <span>
                    {licenseStatus?.isLicensed
                      ? 'Unlimited Pro AI Synthesizer'
                      : `${licenseStatus?.limits?.remainingReplies ?? 50} replies left this month`}
                  </span>
                  {!licenseStatus?.isLicensed && (
                    <button
                      onClick={handleOpenUpgrade}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Upgrade for Unlimited →
                    </button>
                  )}
                </div>
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
                  onKeyDown={(e) => e.key === 'Enter' && !isCoreFeatureLocked(licenseStatus) && handleGenerateReply()}
                  disabled={isCoreFeatureLocked(licenseStatus)}
                />
              </div>

              {/* Free Tier Limit Exhausted Lock Banner */}
              {licenseStatus?.tier === 'FREE' && licenseStatus.limits.isExhausted ? (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    color: '#ef4444'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                    Free Tier Quota Exhausted ({licenseStatus.limits.maxFreeReplies}/{licenseStatus.limits.maxFreeReplies} Used)
                  </h3>
                  <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Core AI response features are locked. Upgrade to Freelancer or Agency Pro on memoreply.com for unlimited generations.
                  </p>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleOpenUpgrade}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    Upgrade on memoreply.com →
                  </button>
                </div>
              ) : (
                /* Primary Generation Trigger */
                <div style={{ marginBottom: '12px' }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleGenerateReply()}
                    disabled={isGenerating || isRefining || isCoreFeatureLocked(licenseStatus)}
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
              )}

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

              {/* LinkedIn Anti-Bot Safety Guardrail Notice */}
              {(conversation?.platform === 'linkedin' || activePlatform === 'linkedin') && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 'rgba(10, 102, 194, 0.08)',
                  border: '1px solid rgba(10, 102, 194, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginTop: '10px',
                  fontSize: '11px',
                  lineHeight: '1.45',
                  color: '#93c5fd'
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <strong style={{ color: '#ffffff' }}>LinkedIn Safe Mode Active:</strong> UI & replies are strictly isolated inside this extension. Automated typing and DOM injection are disabled to protect your account.
                  </div>
                </div>
              )}

              {/* Instant Actions Bar */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {(conversation?.platform === 'linkedin' || activePlatform === 'linkedin') ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0a66c2', borderColor: '#0a66c2' }}
                      onClick={handleCopyDraft}
                      disabled={!draftText.trim()}
                      title="Safest method for LinkedIn: Copy to clipboard and paste with Ctrl+V"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy to Clipboard (Recommended)
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={handleInsertDraft}
                      disabled={!draftText.trim() || isCoreFeatureLocked(licenseStatus)}
                      title="Safely place this reply into LinkedIn composer without auto-sending"
                    >
                      {isCoreFeatureLocked(licenseStatus) ? '🔒 Upgrade' : 'Safely Insert'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      onClick={handleInsertDraft}
                      disabled={!draftText.trim() || isCoreFeatureLocked(licenseStatus)}
                      title={isCoreFeatureLocked(licenseStatus) ? 'Upgrade to Pro to insert drafts' : 'Insert this reply into the active platform message box without auto-sending'}
                    >
                      {isCoreFeatureLocked(licenseStatus) ? '🔒 Upgrade to Insert' : `Insert into ${conversation?.platform ? conversation.platform.charAt(0).toUpperCase() + conversation.platform.slice(1) : activePlatform !== 'unknown' ? activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1) : 'Chat'}`}
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
                  </>
                )}
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
          </>
        )}
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
            {/* License & Workspace Account Card */}
            <div className="card" style={{ marginBottom: '14px' }}>
              <div className="card-header">
                <div>
                  <span className="card-title">Agency License & Workspace</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Connected: {authSession?.email || 'Memoreply Cloud'}
                  </div>
                </div>
                <span
                  className="badge-pill active"
                  style={{
                    background: licenseStatus?.isLicensed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: licenseStatus?.isLicensed ? '#10b981' : '#a1a1aa',
                  }}
                >
                  {licenseStatus?.plan || authSession?.plan || 'Free Tier'}
                </span>
              </div>

              {/* License Key Box */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  Agency License Key
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="text-input"
                    style={{ flex: 1, height: '32px', fontSize: '11px', fontFamily: 'monospace' }}
                    placeholder="MR-AGENCYPRO-ACTIVE-SEC"
                    value={activeStoredKey || manualLicenseKey}
                    onChange={(e) => {
                      setManualLicenseKey(e.target.value);
                      setActiveStoredKey(e.target.value);
                    }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    onClick={handleActivateManualKey}
                    disabled={isActivatingKey}
                  >
                    {isActivatingKey ? 'Saving...' : 'Update Key'}
                  </button>
                </div>
                <div className="form-hint" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>
                  Obtain or refresh this key from your agency dashboard on <strong>memoreply.com/dashboard</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '11px', padding: '6px 10px' }}
                  onClick={handleOpenWebLogin}
                >
                  Open Dashboard
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Advanced SaaS Feature: Brand Voice & Custom Prompt Templates */}
            <div className="card" style={{ marginBottom: '14px' }}>
              <div className="card-header">
                <div>
                  <span className="card-title">Brand Voice & Custom Prompt Templates</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Custom instructions and tone presets injected into AI responses
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setIsAddingTone(!isAddingTone)}
                >
                  {isAddingTone ? 'Close' : '+ New Template'}
                </button>
              </div>

              {/* Add Custom Tone Form */}
              {isAddingTone && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid #27272a',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
                    Create Custom Tone / Prompt Preset
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '2px' }}>
                      Tone / Persona Name
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      value={newToneLabel}
                      onChange={(e) => setNewToneLabel(e.target.value)}
                      placeholder="e.g. Agency Closer, Bold Pitch, Enterprise Tech"
                      style={{ height: '30px', fontSize: '11px', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '2px' }}>
                      Brand Voice Guidelines & Instructions
                    </label>
                    <textarea
                      className="text-input"
                      value={newToneInstructions}
                      onChange={(e) => setNewToneInstructions(e.target.value)}
                      placeholder="e.g. Always structure reply with 3 distinct milestones, guarantee 100% bug-free delivery, and ask for a 15-min discovery call."
                      rows={3}
                      style={{ fontSize: '11px', width: '100%', resize: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => setIsAddingTone(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '10px', padding: '4px 12px', background: '#10b981', color: '#09090b', fontWeight: 600 }}
                      onClick={handleSaveCustomTone}
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              )}

              {/* List of Custom Tones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customTones.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                    No custom tones created yet. Click "+ New Template" to add your brand voice.
                  </div>
                ) : (
                  customTones.map((ct) => (
                    <div
                      key={ct.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            ★ {ct.label}
                          </span>
                          {activeTone === ct.label && (
                            <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Active Tone
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          {ct.instructions}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '10px', padding: '2px 8px' }}
                          onClick={() => {
                            setActiveTone(ct.label);
                            showToast(`Active tone set to "${ct.label}"`, 'info');
                          }}
                        >
                          Use
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '10px', padding: '2px 6px', color: '#ef4444' }}
                          onClick={(e) => handleDeleteCustomTone(ct.id, e)}
                          title="Delete template"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

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

              {/* Local-First Chat Storage & Privacy Guard (chrome.storage.local) */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                    </svg>
                    <span className="font-semibold" style={{ fontSize: '12px' }}>Cloud Architecture & Storage</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontWeight: 600
                    }}>
                      Supabase Cloud Active
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      fontWeight: 600
                    }}>
                      Google Drive Linked
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                  Chat history & client interactions are persisted directly to <strong>Supabase PostgreSQL</strong> for cross-device sync. Heavy media, attachments, and documents are offloaded to <strong>Google Drive</strong> with secure reference URLs.
                </p>

                {/* 10MB Quota & FIFO Gauge */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Storage Quota (10MB Limit)</span>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {storageStats ? `${(storageStats.bytesInUse / 1024).toFixed(1)} KB / 10 MB` : 'Calculating...'}
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      width: `${Math.max(2, Math.min(100, storageStats?.usagePercent || 1))}%`,
                      height: '100%',
                      background: (storageStats?.usagePercent || 0) > 80 ? 'var(--color-error)' : '#10b981',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                    <span>FIFO Auto-Eviction: Active</span>
                    <span>{storageStats ? `${storageStats.totalConversations} cached conversations` : ''}</span>
                  </div>
                </div>

                {/* Retention Policy Selection */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      Auto-Purge Retention Policy
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                      Older than {storagePolicy?.retentionDays || 30} days
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`btn btn-sm ${storagePolicy?.retentionDays === 30 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleUpdateRetention(30)}
                    >
                      30 Days (Default)
                    </button>
                    <button
                      className={`btn btn-sm ${storagePolicy?.retentionDays === 60 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleUpdateRetention(60)}
                    >
                      60 Days
                    </button>
                  </div>
                </div>

                {/* Cleanup Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '10px', padding: '5px' }}
                    disabled={isPurgingStorage}
                    onClick={handleManualPurge}
                  >
                    {isPurgingStorage ? 'Purging...' : `Purge > ${storagePolicy?.retentionDays || 30} Days`}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm text-tertiary"
                    style={{ flex: 1, fontSize: '10px', padding: '5px' }}
                    onClick={handleClearLocalChatsOnly}
                  >
                    Clear Chat Cache
                  </button>
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
