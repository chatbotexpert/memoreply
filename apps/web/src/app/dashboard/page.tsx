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
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Laptop,
  Download,
  Trash2,
  ExternalLink,
  Zap,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';

import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';

interface MockClientThread {
  id: string;
  platformUserId: string;
  displayName: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn';
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
    id: 'upwork_david_k',
    platformUserId: 'david_k_consulting',
    displayName: 'David Krause',
    platform: 'Upwork',
    lastMessageSnippet: 'Hello Hassaan, we reviewed your Upwork profile regarding enterprise Chrome MV3 architectures. Are you available for a paid consultation?',
    lastActive: '3h ago',
    status: 'Active',
    facts: [
      { label: 'Architecture Audit', verified: true },
      { label: 'Hourly: $85/hr', verified: true },
      { label: 'Enterprise SaaS', verified: true },
    ],
  },
  {
    id: 'linkedin_sarah_j',
    platformUserId: 'sarah_jenkins_tech',
    displayName: 'Sarah Jenkins',
    platform: 'LinkedIn',
    lastMessageSnippet: 'Hi Hassaan, found your profile via your Chrome Extension portfolio. We are looking for someone to build a bespoke workspace side panel.',
    lastActive: '4h ago',
    status: 'Proposal Sent',
    facts: [
      { label: 'Sidecar Architecture', verified: true },
      { label: 'SSO Integration', verified: true },
      { label: 'Budget: $2,400', verified: true },
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
  const [isCopied, setIsCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const { activePlatform, activeWorkspace } = useWorkspace();
  const { user, regenerateLicense, revokeSeat } = useAuth();

  const handleCopyLicense = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.licenseKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenKey = () => {
    regenerateLicense();
    setShowRegenConfirm(false);
  };

  const platformFiltered = RECENT_CLIENTS.filter((c) => {
    if (activePlatform === 'all') return true;
    return c.platform.toLowerCase() === activePlatform.toLowerCase();
  });

  const filteredThreads = platformFiltered.filter(
    (c) =>
      c.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.platformUserId.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.facts.some((f) => f.label.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  // Platform-scaled dynamic metrics
  const statsMap = {
    all: { clients: '198', convs: '558', facts: '2,130', proposals: '1,245' },
    fiverr: { clients: '124', convs: '382', facts: '1,420', proposals: '890' },
    upwork: { clients: '46', convs: '112', facts: '480', proposals: '260' },
    linkedin: { clients: '28', convs: '64', facts: '230', proposals: '95' },
  };

  const currentStats = statsMap[activePlatform] || statsMap.all;
  const seatPercent = user ? Math.round((user.activeSeats / user.maxSeats) * 100) : 60;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Personalized Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              {user?.agencyName || 'Agency Workspace'}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {user?.plan || 'Agency Pro'} Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Logged in as <span className="text-zinc-800 dark:text-zinc-200 font-medium">{user?.name}</span> ({user?.email}) &bull; Active Node: <span className="font-mono text-zinc-700 dark:text-zinc-300">{activeWorkspace.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Workspace Settings</span>
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Manage Plan</span>
          </Link>
        </div>
      </div>

      {/* COMMERCIAL B2B MODULE: Extension License & Team Seats Manager */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white">
              <KeyRound className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Chrome Extension License & Seats
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Commercial B2B
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Each active freelancer or agency seat connects directly to this workspace ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Extension package ready. Load the /dist directory as an unpacked extension via chrome://extensions.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download Extension Build</span>
            </button>
          </div>
        </div>

        {/* License Key & Seat Meter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Col 1: License Key Box (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Agency License Key
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Authorized
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 tracking-wider truncate">
                {user?.licenseKey || 'MR-AGENCY-8849-X92F-PRO'}
              </div>

              <button
                onClick={handleCopyLicense}
                className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                title="Copy License Key"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRegenConfirm(true)}
                className="px-2.5 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shrink-0"
                title="Regenerate License Key"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-500">
              Paste this key into the extension popup under <code className="text-zinc-700 dark:text-zinc-300 font-mono">Settings → License Key</code> to authenticate and mirror client messages.
            </p>

            {showRegenConfirm && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p>
                  Regenerating will revoke the current key. All active extension seats must be updated with the new key.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenKey}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700"
                  >
                    Confirm Regenerate
                  </button>
                  <button
                    onClick={() => setShowRegenConfirm(false)}
                    className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Seat Allocation & Tier Meter (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Extension Seat Utilization
                </span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {user?.activeSeats || 3} / {user?.maxSeats || 5} Seats
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${seatPercent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Plan: <strong className="text-zinc-800 dark:text-zinc-200">{user?.plan || 'Agency Pro'}</strong></span>
                <span>Renews: <strong className="text-zinc-800 dark:text-zinc-200">{user?.renewalDate || 'Nov 22, 2026'}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All {user?.activeSeats || 3} Seats Operational
              </span>
              <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Add More Seats →
              </Link>
            </div>
          </div>
        </div>

        {/* Active Connected Extension Seats List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Connected Extension Instances
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Real-time WebSocket Heartbeat
            </span>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 text-xs">
            {user?.seats && user.seats.length > 0 ? (
              user.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {seat.deviceName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ({seat.browser})
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {seat.platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Last ping: {seat.lastPing} &bull; IP: {seat.ipAddress}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>

                    <button
                      onClick={() => revokeSeat(seat.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Revoke Extension Seat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">
                No active seats connected. Install the extension and input your license key to register your device.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid across platforms */}
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
              {currentStats.clients}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+14 this week</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Fiverr, Upwork & LinkedIn mapped</p>
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
              {currentStats.convs}
            </span>
            <span className="text-xs text-zinc-500 font-mono">threads</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Deduplicated across agency seats</p>
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
              {currentStats.facts}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">0 conflicts</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Budgets, milestones & deliverables</p>
        </Link>

        {/* Metric 4 */}
        <Link
          href="/conversations"
          className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all block group"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              Contract Terms Guarded
            </span>
            <Layers className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-mono">
              {currentStats.proposals}
            </span>
            <span className="text-xs text-zinc-500 font-mono">&lt; 45s avg</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Scope protected from false promises</p>
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
                  Synchronized from active {activeWorkspace.name} sessions via Chrome Extension.
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
                  className="p-4 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                  {user?.agencyName || 'HashTurn Digital'} &bull; Senior Full-Stack Engineer & Extension Specialist
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
              className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-[11px] flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
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
