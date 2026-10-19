'use client';

import React, { useState } from 'react';
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface StoredFact {
  id: string;
  clientName: string;
  username: string;
  category: 'Budget' | 'Timeline' | 'Scope' | 'Tech Stack' | 'Communication' | 'Preference';
  fact: string;
  status: 'confirmed' | 'proposed' | 'disputed';
  conflictReason?: string;
  source: 'extracted' | 'manual';
  createdAt: string;
}

const VAULT_FACTS: StoredFact[] = [
  {
    id: 'f_1',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Budget',
    fact: 'Budget mentioned: $350.00 standard fixed price.',
    status: 'confirmed',
    source: 'extracted',
    createdAt: '12m ago',
  },
  {
    id: 'f_2',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Timeline',
    fact: 'Requested 4-day delivery schedule.',
    status: 'proposed',
    source: 'extracted',
    createdAt: '12m ago',
  },
  {
    id: 'f_3',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Tech Stack',
    fact: 'Requires Manifest V3 Chrome extension with React side panel.',
    status: 'confirmed',
    source: 'manual',
    createdAt: '10m ago',
  },
  {
    id: 'f_4',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    category: 'Scope',
    fact: 'Client requested complete offline IndexedDB state persistence.',
    status: 'confirmed',
    source: 'extracted',
    createdAt: '2h ago',
  },
  {
    id: 'f_5',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    category: 'Timeline',
    fact: 'Target release deadline: End of current sprint (Friday).',
    status: 'confirmed',
    source: 'extracted',
    createdAt: '2h ago',
  },
  {
    id: 'f_6',
    clientName: 'Sophia Chen',
    username: 'sophia_ux',
    category: 'Tech Stack',
    fact: 'Design tokens must follow strict 4px/8px grid with Inter typography.',
    status: 'confirmed',
    source: 'extracted',
    createdAt: '5h ago',
  },
  {
    id: 'f_7',
    clientName: 'Marcus Vance',
    username: 'marcus_ventures',
    category: 'Communication',
    fact: 'Prefers communication via project milestones with video walkthroughs.',
    status: 'confirmed',
    source: 'manual',
    createdAt: '1d ago',
  },
];

export default function ContextVaultPage() {
  const [facts, setFacts] = useState<StoredFact[]>(VAULT_FACTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const categories = ['All', 'Budget', 'Timeline', 'Scope', 'Tech Stack', 'Communication'];
  const statuses = ['All', 'confirmed', 'proposed', 'disputed'];

  const filtered = facts.filter((item) => {
    const matchesSearch =
      item.fact.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.username.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleCycleStatus = (factId: string) => {
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id !== factId) return f;
        const nextMap: Record<string, 'confirmed' | 'proposed' | 'disputed'> = {
          proposed: 'confirmed',
          confirmed: 'disputed',
          disputed: 'proposed',
        };
        return { ...f, status: nextMap[f.status] };
      })
    );
  };

  const handleDelete = (factId: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Context Vault & Memory Ledger
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Persistent specifications extracted from conversations and preserved across multi-session interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {facts.length} Verified Context Points
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memory records..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 focus:outline-hidden capitalize"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.clientName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">@{item.username}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {item.category}
                  </span>
                  <button
                    onClick={() => handleCycleStatus(item.id)}
                    title="Click to cycle status: Confirmed → Disputed → Proposed"
                    className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-medium transition-all ${
                      item.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : item.status === 'disputed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400">
                    [{item.source}]
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  {item.fact}
                </p>

                {item.conflictReason && (
                  <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    <span>Contradiction: {item.conflictReason}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono text-zinc-400">{item.createdAt}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Remove record from Context Vault"
                  className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
