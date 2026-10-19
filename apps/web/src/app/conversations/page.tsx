'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, Filter, ShieldCheck, CheckCheck, Clock, ExternalLink } from 'lucide-react';

interface ThreadMessage {
  id: string;
  sender: 'client' | 'seller';
  senderName: string;
  text: string;
  timestamp: string;
}

interface ConversationItem {
  id: string;
  clientName: string;
  username: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn';
  status: 'Active' | 'Completed' | 'Pending Offer';
  lastUpdated: string;
  messagesCount: number;
  messages: ThreadMessage[];
}

const CONVERSATION_THREADS: ConversationItem[] = [
  {
    id: 'conv_wazeer1203',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    platform: 'Fiverr',
    status: 'Active',
    lastUpdated: '12m ago',
    messagesCount: 3,
    messages: [
      {
        id: 'msg_1',
        sender: 'client',
        senderName: 'wazeer1203',
        text: 'Hi, I need an experienced engineer to develop a Chrome Extension Manifest V3 with high reliability.',
        timestamp: '3:45 PM',
      },
      {
        id: 'msg_2',
        sender: 'seller',
        senderName: 'HashTurn Digital',
        text: 'Hi wazeer1203, thank you for reaching out to HashTurn Freelance Solutions! I would be happy to discuss your project and help you build a reliable, scalable solution tailored to your requirements.',
        timestamp: '3:50 PM',
      },
      {
        id: 'msg_3',
        sender: 'client',
        senderName: 'wazeer1203',
        text: 'Great! My budget is around $350 and I need it delivered within 4 days. Can you do this?',
        timestamp: '4:02 PM',
      },
    ],
  },
  {
    id: 'conv_alex_miller',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    platform: 'Fiverr',
    status: 'Pending Offer',
    lastUpdated: '2h ago',
    messagesCount: 4,
    messages: [
      {
        id: 'msg_a1',
        sender: 'client',
        senderName: 'alex_miller_dev',
        text: 'Hello, looking for an extension specialist to implement offline IndexedDB and custom context prompts.',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg_a2',
        sender: 'seller',
        senderName: 'HashTurn Digital',
        text: 'Hello Alex, we specialize in Dexie IndexedDB and Chrome Extension MV3 side panels. We can deliver this within your timeline.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'conv_sophia_chen',
    clientName: 'Sophia Chen',
    username: 'sophia_ux',
    platform: 'Fiverr',
    status: 'Active',
    lastUpdated: '5h ago',
    messagesCount: 2,
    messages: [
      {
        id: 'msg_s1',
        sender: 'client',
        senderName: 'sophia_ux',
        text: 'We have uploaded our complete design tokens in Figma. Please ensure exact line heights and spacing.',
        timestamp: '11:20 AM',
      },
    ],
  },
];

export default function ConversationsPage() {
  const [threads, setThreads] = useState<ConversationItem[]>(CONVERSATION_THREADS);
  const [selectedThread, setSelectedThread] = useState<ConversationItem>(CONVERSATION_THREADS[0]);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    let mounted = true;
    async function loadLiveData() {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.conversations && data.conversations.length > 0) {
            setThreads(data.conversations);
            setSelectedThread((prev) => {
              const matched = data.conversations.find((c: ConversationItem) => c.id === prev.id);
              return matched || data.conversations[0];
            });
          }
        }
      } catch (err) {
        console.warn('Live conversations fetch error:', err);
      }
    }
    loadLiveData();
    const timer = setInterval(loadLiveData, 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const filtered = threads.filter(
    (c) =>
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Synced Conversations
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Deduplicated message streams extracted across active Fiverr, Upwork, and LinkedIn threads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Deterministic SHA-256 Dedup
          </span>
        </div>
      </div>

      {/* 2-Column Split: Thread List on Left, Thread Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left: Threads Roster (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xs overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
              />
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto flex-1">
            {filtered.map((thread) => {
              const isSelected = selectedThread.id === thread.id;
              const lastMsg = thread.messages[thread.messages.length - 1];

              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-zinc-100/80 dark:bg-zinc-800/80'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold text-xs text-zinc-800 dark:text-zinc-200 shrink-0">
                    {thread.clientName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {thread.clientName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {thread.lastUpdated}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400">@{thread.username}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                      {lastMsg ? lastMsg.text : 'No messages'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Thread Transcript (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xs overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                {selectedThread.clientName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedThread.clientName} (@{selectedThread.username})
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Platform: {selectedThread.platform} &bull; Thread ID: {selectedThread.id}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              {selectedThread.status}
            </span>
          </div>

          {/* Messages Stream */}
          <div className="p-4 flex-1 space-y-4 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/30">
            {selectedThread.messages.map((msg) => {
              const isSeller = msg.sender === 'seller';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mb-1 px-1">
                    <span>{msg.senderName}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                      isSeller
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs bg-white dark:bg-zinc-900">
            <span className="text-[11px] text-zinc-400 font-mono">
              Synchronized from active Fiverr Chrome session
            </span>
            <button
              onClick={() => alert(`Opening Chrome extension side panel to compose reply for ${selectedThread.clientName}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              <span>Compose with Context</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
