'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Database,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  ExternalLink,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface ClientItem {
  id: string;
  name: string;
  username: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn';
  totalMessages: number;
  lastContact: string;
  budget?: string;
  factsCount: number;
  status: 'Active' | 'Delivered' | 'Pending Offer';
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
    lastContact: '10m ago',
    budget: '$350',
    factsCount: 4,
    status: 'Active',
    notes: 'Interested in building a high-performance Chrome Extension MV3 with React and side panel.',
    tags: ['Chrome Extension', 'React 19', 'Urgent'],
  },
  {
    id: 'fiverr_alex_miller',
    name: 'Alex Miller',
    username: 'alex_miller_dev',
    platform: 'Fiverr',
    totalMessages: 48,
    lastContact: '2h ago',
    budget: '$500',
    factsCount: 6,
    status: 'Pending Offer',
    notes: 'Long-term client. Prefers milestone-based deliveries and daily asynchronous video updates.',
    tags: ['Dexie DB', 'Next.js 15', 'Full-Stack'],
  },
  {
    id: 'fiverr_sophia_chen',
    name: 'Sophia Chen',
    username: 'sophia_ux',
    platform: 'Fiverr',
    totalMessages: 32,
    lastContact: '5h ago',
    budget: '$750',
    factsCount: 5,
    status: 'Active',
    notes: 'Design team lead. Strict about pixel-perfect implementation of Figma tokens and typography.',
    tags: ['Figma Sync', 'Tailwind v4', 'Design System'],
  },
  {
    id: 'fiverr_marcus_vance',
    name: 'Marcus Vance',
    username: 'marcus_ventures',
    platform: 'Fiverr',
    totalMessages: 84,
    lastContact: '1d ago',
    budget: '$1,200',
    factsCount: 8,
    status: 'Delivered',
    notes: 'Serial agency owner. Routinely places repeat orders for custom internal browser tools.',
    tags: ['Agency Tier', 'Enterprise', 'Repeat Client'],
  },
  {
    id: 'fiverr_elena_rostova',
    name: 'Elena Rostova',
    username: 'elena_tech',
    platform: 'Fiverr',
    totalMessages: 22,
    lastContact: '2d ago',
    budget: '$450',
    factsCount: 3,
    status: 'Active',
    notes: 'Needs custom automation scripts and Supabase database connector.',
    tags: ['PostgreSQL', 'Python', 'Automation'],
  },
  {
    id: 'upwork_david_k',
    name: 'David Krause',
    username: 'david_k_consulting',
    platform: 'Upwork',
    totalMessages: 19,
    lastContact: '3d ago',
    budget: '$1,800',
    factsCount: 7,
    status: 'Active',
    notes: 'Architecture audit for enterprise SaaS Chrome sidecar extension.',
    tags: ['Upwork Pro', 'Enterprise', 'Architecture'],
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>(CLIENT_DATA as ClientItem[]);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Fiverr' | 'Upwork' | 'LinkedIn'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending Offer' | 'Delivered'>('All');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function loadLiveData() {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.clients && data.clients.length > 0) {
            setClients(data.clients);
          }
        }
      } catch (err) {
        console.warn('Live clients fetch error, using local state:', err);
      }
    }
    loadLiveData();
    const timer = setInterval(loadLiveData, 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'All' || c.platform === platformFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Client Ledger & Directory
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              124 Synced Clients
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Centralized client relationship ledger synced across active marketplace conversations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/conversations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open Conversation Stream</span>
          </Link>
          <Link
            href="/context-vault"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Context Vault</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, username, or tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Platform Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
            {(['All', 'Fiverr', 'Upwork', 'LinkedIn'] as const).map((p) => (
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

          {/* Status Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
            {(['All', 'Active', 'Pending Offer', 'Delivered'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Table / Ledger View */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-500 font-medium">
                <th className="py-2.5 px-4">Client Identity</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total Messages</th>
                <th className="py-2.5 px-3 text-right">Budget Scope</th>
                <th className="py-2.5 px-3 text-right">Verified Facts</th>
                <th className="py-2.5 px-3 text-right">Last Contact</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No clients matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Identity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                          {client.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {client.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            @{client.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          client.platform === 'Fiverr'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        }`}
                      >
                        {client.platform}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          client.status === 'Active'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : client.status === 'Pending Offer'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>

                    {/* Total Messages */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-zinc-800 dark:text-zinc-200">
                      {client.totalMessages} msgs
                    </td>

                    {/* Budget */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        {client.budget || '—'}
                      </span>
                    </td>

                    {/* Facts Count */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-zinc-700 dark:text-zinc-300">
                      {client.factsCount} facts
                    </td>

                    {/* Last Contact */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-zinc-400 text-[11px]">
                      {client.lastContact}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/conversations"
                          className="px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Open Messages"
                        >
                          View Thread
                        </Link>
                        <Link
                          href="/context-vault"
                          className="px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View Extracted Facts"
                        >
                          Context Ledger
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
