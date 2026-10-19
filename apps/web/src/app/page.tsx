'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Shield,
  Layers,
} from 'lucide-react';

interface MockClientThread {
  id: string;
  platformUserId: string;
  displayName: string;
  platform: 'Fiverr';
  lastMessageSnippet: string;
  lastActive: string;
  status: 'Active' | 'Proposal Sent' | 'Completed';
  facts: Array<{ label: string; verified: boolean }>;
}

const RECENT_CLIENTS: MockClientThread[] = [
  {
    id: 'fiverr_wazeer1203',
    platformUserId: 'wazeer1203',
    displayName: 'Wazeer',
    platform: 'Fiverr',
    lastMessageSnippet: 'Hi wazeer1203, thank you for reaching out to HashTurn Freelance Solutions! I would be happy to discuss your project...',
    lastActive: 'Just now',
    status: 'Active',
    facts: [
      { label: 'Chrome Extension MV3', verified: true },
      { label: 'Budget: $350', verified: true },
      { label: 'Timeline: 4 Days', verified: false },
    ],
  },
  {
    id: 'fiverr_alex_miller',
    platformUserId: 'alex_miller_dev',
    displayName: 'Alex Miller',
    platform: 'Fiverr',
    lastMessageSnippet: 'Understood. We need the React 19 side panel with IndexedDB storage ready by Friday.',
    lastActive: '2h ago',
    status: 'Proposal Sent',
    facts: [
      { label: 'React 19 / Vite', verified: true },
      { label: 'Budget: $500', verified: true },
      { label: 'Dexie DB', verified: true },
    ],
  },
  {
    id: 'fiverr_sophia_design',
    platformUserId: 'sophia_ux',
    displayName: 'Sophia Chen',
    platform: 'Fiverr',
    lastMessageSnippet: 'The Figma wireframes have been updated with the Linear design system styles.',
    lastActive: '5h ago',
    status: 'Active',
    facts: [
      { label: 'Figma Integration', verified: true },
      { label: 'Next.js 15 App', verified: true },
    ],
  },
  {
    id: 'fiverr_marcus_v',
    platformUserId: 'marcus_ventures',
    displayName: 'Marcus Vance',
    platform: 'Fiverr',
    lastMessageSnippet: 'Order completed and 5-star review left! Thanks for the clean code delivery.',
    lastActive: '1d ago',
    status: 'Completed',
    facts: [
      { label: 'Paid: $1,200', verified: true },
      { label: 'Full Monorepo', verified: true },
    ],
  },
];

export default function DashboardOverviewPage() {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredThreads = RECENT_CLIENTS.filter(
    (c) =>
      c.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.platformUserId.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.facts.some((f) => f.label.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Workspace Intelligence
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time synchronization mirror for Fiverr client communications, memory facts, and seller policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            PostgreSQL Schema Synced
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Link
          href="/clients"
          className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all block group"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              Tracked Clients
            </span>
            <Users className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
              124
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+14 this week</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">100% platform user mapped</p>
        </Link>

        {/* Metric 2 */}
        <Link
          href="/conversations"
          className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all block group"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              Synced Conversations
            </span>
            <MessageSquare className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
              382
            </span>
            <span className="text-xs text-zinc-500 font-mono">threads</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Deduplicated across reloads</p>
        </Link>

        {/* Metric 3 */}
        <Link
          href="/context-vault"
          className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all block group"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              Verified Context Points
            </span>
            <Database className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
              1,420
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">0 conflicts</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Specs, timelines & budgets</p>
        </Link>

        {/* Metric 4 */}
        <Link
          href="/conversations"
          className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all block group"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              Deterministic Proposals Compiled
            </span>
            <Layers className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
              890
            </span>
            <span className="text-xs text-zinc-500 font-mono">&lt; 45s avg</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Inserted directly into Fiverr</p>
        </Link>
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Threads Table (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Recent Synced Conversations
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Synchronized from active Fiverr inbox sessions via Chrome Extension.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter records..."
                    className="pl-8 pr-3 py-1 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-md focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                        {thread.displayName.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {thread.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        @{thread.platformUserId}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {thread.platform}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-medium ${
                          thread.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : thread.status === 'Proposal Sent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 italic">
                      &ldquo;{thread.lastMessageSnippet}&rdquo;
                    </p>

                    {/* Context Tags Strip */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {thread.facts.map((fact) => (
                        <span
                          key={fact.label}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{fact.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">{thread.lastActive}</span>
                    <Link
                      href="/context-vault"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                      <span>Context Ledger</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Seller Guidelines & Rules Summary */}
        <div className="space-y-6">
          {/* Active Seller Guidelines Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                  Seller Guidelines
                </h3>
                <p className="text-[11px] text-zinc-500">Active Business Scope</p>
              </div>
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 text-[11px] block font-mono">Identity & Role</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                  HashTurn Digital &bull; Senior Full-Stack Engineer & Extension Specialist
                </p>
              </div>

              <div>
                <span className="text-zinc-400 text-[11px] block font-mono">Minimum Budget Scope</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                  $100.00 order minimum &bull; Standard $40/hr
                </p>
              </div>

              <div>
                <span className="text-zinc-400 text-[11px] block font-mono">Revision Policy</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                  2 rounds of revisions included &bull; Bug fixes always complimentary
                </p>
              </div>

              <div>
                <span className="text-zinc-400 text-[11px] block font-mono">Strict Communication Boundary</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 text-[11px] bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-200/60 dark:border-zinc-700/60">
                  &ldquo;Never share external contact info. Request Figma/wireframes before quoting. Emphasize milestone delivery.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Memory Engine Integrity Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                  Contradiction Engine
                </h3>
                <p className="text-[11px] text-zinc-500">Integrity & Fact Checking</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>100% Valid</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When clients mention new requirements that contradict previously confirmed terms (e.g. changing delivery from 7 days to 24 hours), the context engine automatically flags them as <span className="font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">DISPUTED</span> so your response composer never commits to impossible deadlines.
            </p>

            <Link
              href="/context-vault"
              className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[11px] flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
            >
              <span className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                Active Contradictions:
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                0 Active Flagged →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
