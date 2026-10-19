'use client';

import React, { useState } from 'react';
import { Users, Search, Filter, MessageSquare, Database, ArrowUpRight, CheckCircle2, Plus } from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  username: string;
  platform: 'Fiverr' | 'Upwork';
  totalMessages: number;
  lastActive: string;
  budget?: string;
  factsCount: number;
  notes: string;
  tags: string[];
}

const CLIENT_DATA: ClientItem[] = [
  {
    id: 'fiverr_wazeer1203',
    name: 'Wazeer',
    username: 'wazeer1203',
    platform: 'Fiverr',
    totalMessages: 14,
    lastActive: '10m ago',
    budget: '$350',
    factsCount: 4,
    notes: 'Interested in building a high-performance Chrome Extension MV3 with React and side panel.',
    tags: ['Chrome Extension', 'React 19', 'Urgent'],
  },
  {
    id: 'fiverr_alex_miller',
    name: 'Alex Miller',
    username: 'alex_miller_dev',
    platform: 'Fiverr',
    totalMessages: 48,
    lastActive: '2h ago',
    budget: '$500',
    factsCount: 6,
    notes: 'Long-term client. Prefers milestone-based deliveries and daily asynchronous video updates.',
    tags: ['Dexie DB', 'Next.js 15', 'Full-Stack'],
  },
  {
    id: 'fiverr_sophia_chen',
    name: 'Sophia Chen',
    username: 'sophia_ux',
    platform: 'Fiverr',
    totalMessages: 32,
    lastActive: '5h ago',
    budget: '$750',
    factsCount: 5,
    notes: 'Design team lead. Strict about pixel-perfect implementation of Figma tokens and typography.',
    tags: ['Figma Sync', 'Tailwind v4', 'Design System'],
  },
  {
    id: 'fiverr_marcus_vance',
    name: 'Marcus Vance',
    username: 'marcus_ventures',
    platform: 'Fiverr',
    totalMessages: 84,
    lastActive: '1d ago',
    budget: '$1,200',
    factsCount: 8,
    notes: 'Serial agency owner. Routinely places repeat orders for custom internal browser tools.',
    tags: ['Agency Tier', 'Enterprise', 'Repeat Client'],
  },
  {
    id: 'fiverr_elena_rostova',
    name: 'Elena Rostova',
    username: 'elena_tech',
    platform: 'Fiverr',
    totalMessages: 22,
    lastActive: '2d ago',
    budget: '$450',
    factsCount: 3,
    notes: 'Needs custom automation scripts and Supabase database connector.',
    tags: ['PostgreSQL', 'Python', 'Automation'],
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Fiverr' | 'Upwork'>('All');

  const filtered = CLIENT_DATA.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'All' || c.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Client Directory
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Centralized client relationship ledger synced across active marketplace conversations.
          </p>
        </div>

        <button
          onClick={() => alert('Manual client profile entry is coming in next update. Use Chrome extension to auto-extract.')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Client</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or tag..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
            {(['All', 'Fiverr', 'Upwork'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  platformFilter === p
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      <span>@{client.username}</span>
                      <span>&bull;</span>
                      <span className="text-zinc-500">{client.platform}</span>
                    </div>
                  </div>
                </div>

                {client.budget && (
                  <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {client.budget}
                  </span>
                )}
              </div>

              {/* Notes */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                {client.notes}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {client.totalMessages} msgs
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-500" />
                  {client.factsCount} facts
                </span>
              </div>

              <button
                onClick={() => alert(`Context Ledger for ${client.name} (Platform: ${client.platform}, ID: ${client.username})`)}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <span>View Memory Ledger</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
