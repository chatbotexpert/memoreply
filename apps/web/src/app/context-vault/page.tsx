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
  ExternalLink,
  Tag,
  Check,
  X,
} from 'lucide-react';

import { useWorkspace } from '@/context/WorkspaceContext';

interface StoredFact {
  id: string;
  clientName: string;
  username: string;
  category: 'Budget' | 'Timeline' | 'Tech' | 'Scope' | 'Communication';
  fact: string;
  status: 'confirmed' | 'proposed' | 'disputed';
  conflictReason?: string;
  source: 'Fiverr Chat' | 'Upwork Chat' | 'LinkedIn Chat' | 'Seller Policy';
  extractedAt: string;
}

const INITIAL_FACTS: StoredFact[] = [
  {
    id: 'f_1',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Budget',
    fact: 'Fixed order price agreed at $350.00 USD for initial milestone.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '12m ago',
  },
  {
    id: 'f_2',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Timeline',
    fact: 'Client requested 4-day turnaround for Manifest V3 React Side Panel.',
    status: 'proposed',
    source: 'Fiverr Chat',
    extractedAt: '12m ago',
  },
  {
    id: 'f_3',
    clientName: 'Wazeer',
    username: 'wazeer1203',
    category: 'Tech',
    fact: 'Required stack: Chrome Extension Manifest V3, Dexie.js (IndexedDB), React 19.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '10m ago',
  },
  {
    id: 'f_4',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    category: 'Timeline',
    fact: 'Conflict flagged: Client requested 24h delivery, but complex IndexedDB schema requires 3 days.',
    status: 'disputed',
    conflictReason: 'Violates standard 72h minimum policy for full-stack browser extensions.',
    source: 'Fiverr Chat',
    extractedAt: '2h ago',
  },
  {
    id: 'f_5',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    category: 'Budget',
    fact: 'Budget ceiling is $500.00 USD. Milestone payments via standard Fiverr custom offer.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '2h ago',
  },
  {
    id: 'f_upwork_1',
    clientName: 'David Krause',
    username: 'david_k_consulting',
    category: 'Budget',
    fact: 'Fixed order price agreed at $1,800.00 USD for enterprise architecture audit milestone.',
    status: 'confirmed',
    source: 'Upwork Chat',
    extractedAt: '3h ago',
  },
  {
    id: 'f_upwork_2',
    clientName: 'David Krause',
    username: 'david_k_consulting',
    category: 'Tech',
    fact: 'Deliverable requires Dexie.js schema optimization and MV3 service worker lifecycle resilience.',
    status: 'confirmed',
    source: 'Upwork Chat',
    extractedAt: '3h ago',
  },
  {
    id: 'f_linkedin_1',
    clientName: 'Sarah Jenkins',
    username: 'sarah_jenkins_tech',
    category: 'Budget',
    fact: 'Budget ceiling is $2,400.00 USD with milestone delivery schedule on LinkedIn.',
    status: 'proposed',
    source: 'LinkedIn Chat',
    extractedAt: '4h ago',
  },
  {
    id: 'f_linkedin_2',
    clientName: 'Sarah Jenkins',
    username: 'sarah_jenkins_tech',
    category: 'Scope',
    fact: 'Project requires internal CRM background synchronization and zero automated message submission.',
    status: 'confirmed',
    source: 'LinkedIn Chat',
    extractedAt: '4h ago',
  },
  {
    id: 'f_6',
    clientName: 'Alex Miller',
    username: 'alex_miller_dev',
    category: 'Tech',
    fact: 'Requires offline-first architecture with automatic background synchronization.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '3h ago',
  },
  {
    id: 'f_7',
    clientName: 'Sophia Chen',
    username: 'sophia_ux',
    category: 'Tech',
    fact: 'Must follow Linear/Raycast design system tokens with Tailwind v4 styling.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '5h ago',
  },
  {
    id: 'f_8',
    clientName: 'Sophia Chen',
    username: 'sophia_ux',
    category: 'Scope',
    fact: 'Deliverable includes complete Figma wireframes matching and dark/light mode tokens.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '5h ago',
  },
  {
    id: 'f_9',
    clientName: 'Marcus Vance',
    username: 'marcus_ventures',
    category: 'Budget',
    fact: 'Enterprise tier repeat client with $1,200.00 USD completed contract budget.',
    status: 'confirmed',
    source: 'Fiverr Chat',
    extractedAt: '1d ago',
  },
  {
    id: 'f_10',
    clientName: 'HashTurn Seller Policy',
    username: 'seller_rules',
    category: 'Communication',
    fact: 'Strict anti-disintermediation: Never share off-platform emails, WhatsApp, or phone numbers.',
    status: 'confirmed',
    source: 'Seller Policy',
    extractedAt: 'Global Rule',
  },
];

export default function ContextVaultPage() {
  const [facts, setFacts] = useState<StoredFact[]>(INITIAL_FACTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Budget' | 'Timeline' | 'Tech' | 'Scope'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'proposed' | 'disputed'>('all');
  const { activePlatform, activeWorkspace } = useWorkspace();

  React.useEffect(() => {
    let mounted = true;
    async function loadLiveData() {
      try {
        const url = activePlatform !== 'all' ? `/api/vault?platform=${activePlatform}` : '/api/vault';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.facts && data.facts.length > 0) {
            setFacts(data.facts);
          }
        }
      } catch (err) {
        console.warn('Live vault fetch error:', err);
      }
    }
    loadLiveData();
    const timer = setInterval(loadLiveData, 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [activePlatform]);

  const filtered = facts.filter((f) => {
    const matchesSearch =
      f.fact.toLowerCase().includes(search.toLowerCase()) ||
      f.clientName.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || f.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesPlatform =
      activePlatform === 'all' ||
      f.source.toLowerCase().includes(activePlatform.toLowerCase()) ||
      f.source === 'Seller Policy';

    return matchesSearch && matchesCategory && matchesStatus && matchesPlatform;
  });

  const disputesCount = filtered.filter((f) => f.status === 'disputed').length;
  const budgetCount = filtered.filter((f) => f.category === 'Budget').length;
  const techCount = filtered.filter((f) => f.category === 'Tech').length;

  const handleResolveDispute = (id: string, newStatus: 'confirmed' | 'proposed') => {
    setFacts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, conflictReason: undefined } : item))
    );
  };

  const handleDeleteFact = (id: string) => {
    setFacts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Context Vault & Memory Ledger
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <span className={`w-1.5 h-1.5 rounded-full ${activeWorkspace.dotColor}`} />
              {activeWorkspace.name}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time fact repository and contradiction engine extracting budgets, timelines, and constraints for {activeWorkspace.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Synchronizing memory vault with PostgreSQL ledger...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Re-Index Memory</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Synced Facts</div>
          <div className="text-lg font-semibold font-mono text-zinc-900 dark:text-zinc-100 mt-1">{filtered.length}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{activeWorkspace.name}</div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Budget Points</div>
          <div className="text-lg font-semibold font-mono text-emerald-500 mt-1">{budgetCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Fixed & hourly rates</div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Tech Specifications</div>
          <div className="text-lg font-semibold font-mono text-blue-500 mt-1">{techCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Frameworks & APIs</div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Active Contradictions</div>
          <div className={`text-lg font-semibold font-mono mt-1 ${disputesCount > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {disputesCount} Flagged
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Requires resolution</div>
        </div>
      </div>

      {/* Contradiction Flag Alert Banner */}
      {disputesCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-500 tracking-tight">
                Contradiction Engine Flagged {disputesCount} Conflict
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Client <span className="font-mono text-zinc-900 dark:text-zinc-200 font-medium">@alex_miller_dev</span> requested a 24-hour turnaround, which violates your registered delivery guideline for complex extension architectures. Review and resolve below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('disputed')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors shrink-0"
          >
            View Conflict
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search facts, client, or terms..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Category Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
            {(['All', 'Budget', 'Timeline', 'Tech', 'Scope'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
            {(['all', 'confirmed', 'proposed', 'disputed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {st}
                {st === 'disputed' && disputesCount > 0 && (
                  <span className="ml-1 px-1 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-500 font-mono">
                    {disputesCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Facts Ledger Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-500 font-medium">
                <th className="py-2.5 px-4">Client / Source</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-4">Extracted Fact</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Extracted</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No memory facts matching your search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors ${
                      item.status === 'disputed' ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Client & Platform */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.clientName}</div>
                      <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                        <span>@{item.username}</span>
                        <span>•</span>
                        <span className="text-zinc-400">{item.source}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          item.category === 'Budget'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : item.category === 'Timeline'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : item.category === 'Tech'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : item.category === 'Scope'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Extracted Fact */}
                    <td className="py-3 px-4">
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">{item.fact}</p>
                      {item.conflictReason && (
                        <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{item.conflictReason}</span>
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      ) : item.status === 'proposed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Proposed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Disputed</span>
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-right whitespace-nowrap text-[11px] font-mono text-zinc-400">
                      {item.extractedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.status === 'disputed' ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleResolveDispute(item.id, 'confirmed')}
                            className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                            title="Accept client terms & override conflict"
                          >
                            Resolve & Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteFact(item.id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Purge fact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
