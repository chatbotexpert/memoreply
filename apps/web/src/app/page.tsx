'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Code2,
  Workflow,
  Lock,
  RefreshCw,
  Zap,
  Globe,
  Compass,
  FileCheck2,
  Check,
  Copy,
  Download,
  X,
} from 'lucide-react';

type ToneType = 'Professional' | 'Milestone' | 'Concise' | 'Friendly' | 'Direct';

const DEMO_RESPONSES: Record<ToneType, string> = {
  Professional:
    "Hi Alex,\n\nThank you for reaching out. Per our agreed project scope, delivering the complete React 19 extension requires 7 business days to ensure full QA and Dexie DB schema integrity. We can deliver the core UI prototype by Thursday, with full completion adhering to the $500 milestone budget.\n\nLet me know if you would like me to structure this into two milestone checkpoints.",
  Milestone:
    "Hi Alex,\n\nTo accommodate your Thursday target while protecting codebase stability, here is the suggested milestone structure:\n\n• Milestone 1 (Thursday): Core side panel UI + DOM extractor ($250)\n• Milestone 2 (Monday): IndexedDB sync + background service worker ($250)\n\nTotal Budget: $500 (locked). Ready to initiate the contract when you confirm!",
  Concise:
    "Hi Alex, reviewed the request. Thursday is feasible for the prototype, but full release requires our agreed 7-day sprint at $500. Can deliver Milestone 1 by Thursday if confirmed today.",
  Friendly:
    "Hi Alex! Great to hear from you. We would love to accelerate this for you! To keep our $500 budget intact without skipping QA testing, I can deliver the functional UI side panel this Thursday, and the full backend sync right after. How does that sound?",
  Direct:
    "Alex, full delivery by Thursday conflicts with the 7-day scope agreed earlier. I can provide the UI prototype Thursday and complete all requirements by Monday within the $500 budget. Let me know how to proceed.",
};

export default function LandingPage() {
  const [selectedTone, setSelectedTone] = useState<ToneType>('Professional');
  const [isCopied, setIsCopied] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'fiverr' | 'upwork' | 'linkedin'>('fiverr');

  const handleCopyDemo = () => {
    navigator.clipboard.writeText(DEMO_RESPONSES[selectedTone]);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background Decorative Gradients (Linear Minimalist) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[300px] bg-emerald-950/10 blur-[120px] opacity-40" />
        <div className="absolute top-[50%] left-[5%] w-[450px] h-[350px] bg-indigo-950/10 blur-[130px] opacity-30" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Memoreply"
              className="w-8 h-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white">
                Memoreply
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800/90 text-zinc-400 border border-zinc-700/60">
                by HashTurn
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">
              Core Modules
            </a>
            <a href="#how-it-works" className="hover:text-zinc-100 transition-colors">
              Deterministic Engine
            </a>
            <a href="#comparison" className="hover:text-zinc-100 transition-colors">
              Why Memoreply
            </a>
            <a href="#platforms" className="hover:text-zinc-100 transition-colors">
              Supported Platforms
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Install Extension</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-all shadow-xs cursor-pointer group"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 mb-8 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-400">Release v0.2</span>
              <span className="text-zinc-600">&bull;</span>
              <span>Deterministic Context Engine & Cloud Mirror</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              AI replies that <span className="text-zinc-400 underline decoration-zinc-800 underline-offset-8">remember</span>.
            </h1>

            {/* Sub-headline / Value Proposition */}
            <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Never forget a budget cap, deadline agreement, or deliverable scope. Memoreply extracts persistent memory directly from client messaging threads across <span className="text-zinc-200 font-medium">Fiverr</span>, <span className="text-zinc-200 font-medium">Upwork</span>, and <span className="text-zinc-200 font-medium">LinkedIn</span> to compose bulletproof, context-verified responses in 1-click.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg transition-all shadow-md group cursor-pointer"
              >
                <span>Open Workspace Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setShowInstallModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>Install Chrome Extension</span>
              </button>
            </div>

            {/* Architecture Highlights Pill Row */}
            <div className="mt-12 pt-8 border-t border-zinc-850/80 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero ChatGPT Tab Handoffs</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-400" />
                <span>IndexedDB + Postgres Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span>Deterministic Fact Extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Chrome MV3 Isolated Engine</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE PRODUCT SHOWCASE (Linear / Vercel style simulator) */}
          <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 sm:p-3 shadow-2xl backdrop-blur-xl">
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-zinc-500">
                  memoreply://engine/session/active-thread
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  DOM Adapter Hooked
                </span>
                <span className="text-zinc-500">Platform: Fiverr Messaging</span>
              </div>
            </div>

            {/* Simulator Grid (3 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Column 1: Client Thread (4 cols) */}
              <div className="lg:col-span-4 bg-zinc-950 rounded-lg border border-zinc-800/80 p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300">
                        A
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">Alex Miller</div>
                        <div className="text-[10px] font-mono text-zinc-500">@alex_miller_dev &bull; Fiverr</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">14:02 PM</span>
                  </div>

                  {/* Message History */}
                  <div className="mt-4 space-y-3">
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/50 text-xs text-zinc-400">
                      <span className="text-[10px] font-mono text-zinc-500 block mb-1">Yesterday &bull; Proposal</span>
                      &ldquo;We need a Chrome MV3 Extension with React 19. Budget is firm at $500 with a 7-day delivery timeline.&rdquo;
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-200">
                      <span className="text-[10px] font-mono text-amber-400 block mb-1 font-semibold">New Client Message (Just now)</span>
                      &ldquo;Understood! But can we actually rush this and have the full working extension delivered by Thursday instead? Same $500 budget.&rdquo;
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-850 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
                  <span>Thread ID: fiverr_alex_miller</span>
                  <span className="text-emerald-500">Sync status: Synced</span>
                </div>
              </div>

              {/* Column 2: Context Vault & Contradiction Alert (4 cols) */}
              <div className="lg:col-span-4 bg-zinc-950 rounded-lg border border-zinc-800/80 p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <Database className="w-4 h-4 text-zinc-400" />
                      <span>Context Ledger Facts</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                      2 Verified
                    </span>
                  </div>

                  {/* Extracted Facts */}
                  <div className="mt-3 space-y-2 text-xs font-mono">
                    <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-zinc-300">Budget: $500.00</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Fixed</span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-zinc-300">Original Scope: 7 Days</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Milestone 1</span>
                    </div>

                    {/* CONTRADICTION ALERT BOX */}
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/60 space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold font-sans">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Contradiction Detected</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 font-sans leading-relaxed">
                        Client requests Thursday delivery (~48h), contradicting the agreed 7-day engineering timeline.
                      </p>
                      <div className="pt-1 flex items-center gap-2 text-[10px] text-amber-400/80">
                        <span className="px-1.5 py-0.2 rounded bg-amber-900/50 font-mono">Status: DISPUTED</span>
                        <span>Composer guarded against false promises.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Engine: deterministic-v2</span>
                  <span>Latency: 14ms</span>
                </div>
              </div>

              {/* Column 3: QuillBot-Style Inline Composer (4 cols) */}
              <div className="lg:col-span-4 bg-zinc-950 rounded-lg border border-zinc-800/80 p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      <span>Inline Response Composer</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      QuillBot-Style
                    </span>
                  </div>

                  {/* Interactive Tone Switchers */}
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1.5">Select Synthesizer Tone:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      {(['Professional', 'Milestone', 'Concise', 'Friendly', 'Direct'] as ToneType[]).map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setSelectedTone(tone)}
                          className={`px-2 py-1 rounded text-center font-medium transition-all cursor-pointer ${
                            selectedTone === tone
                              ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Synthesized Response Output Box */}
                  <div className="mt-3 relative">
                    <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-sans min-h-[140px] whitespace-pre-wrap">
                      {DEMO_RESPONSES[selectedTone]}
                    </div>
                    <button
                      onClick={handleCopyDemo}
                      className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-2 border-t border-zinc-850 flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert('In Chrome, this injects the drafted response directly into the active Fiverr / Upwork textarea with zero clipboard pasting!');
                    }}
                    className="w-full py-2 px-3 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Insert into Fiverr Composer</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE MODULES / FEATURES GRID */}
        <section id="features" className="py-20 border-t border-zinc-900 bg-zinc-950/60 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Architectural Foundation
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Engineered for High-Stakes Client Communication
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-400">
                Generic chatbots hallucinate timelines and forget past agreements. Memoreply combines deterministic context retention with inline execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1: Persistent Client Memory */}
              <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Persistent Client Memory
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Never dig through 200 past messages to recall what was agreed. Memoreply continuously parses client threads into verified facts—budget caps, milestone definitions, revision clauses, and technical stacks—stored deterministically in local IndexedDB with PostgreSQL cloud replication.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Deterministic Extraction</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Cross-Session Retention</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Zero Hallucinations</span>
                </div>
              </div>

              {/* Feature 2: Contradiction Engine */}
              <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Contradiction Engine
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Clients often casually tighten deadlines or expand scope midway through a project. Memoreply compares every incoming sentence against historical facts, flagging conflicting statements as <span className="font-mono text-amber-300">DISPUTED</span> before you hit send. Protect yourself from impossible commitments.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Real-Time Fact Auditing</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Scope Creep Shield</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Integrity Validation</span>
                </div>
              </div>

              {/* Feature 3: QuillBot-Style Inline Response Composer */}
              <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  QuillBot-Style Inline Composer
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Generate, rephrase, expand, or structure milestone offers right inside your platform messaging window. Tune tones from Professional to Direct, enforce minimum project rules, and insert the formatted text with a single keystroke.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Multi-Tone Synthesis</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Milestone Breakdown</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">1-Click Native Paste</span>
                </div>
              </div>

              {/* Feature 4: Cross-Platform Adapters */}
              <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform">
                  <Workflow className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Cross-Platform Adapters
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Built-in DOM adapters handle the distinct interface quirks of Fiverr, Upwork, and LinkedIn. It reads active message elements, injects replies seamlessly, and transmits background sync payloads without ever opening an external ChatGPT tab.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Fiverr Inbox & Orders</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">Upwork Rooms</span>
                  <span className="px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60">LinkedIn Sales Nav</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / PIPELINE SECTION */}
        <section id="how-it-works" className="py-20 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Execution Workflow
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                How Memoreply Operates in Real Time
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-400">
                A seamless 4-step pipeline that turns messy platform chat threads into verified communication ledgers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-lg bg-zinc-900/40 border border-zinc-800/80 relative space-y-3">
                <span className="text-xs font-mono text-zinc-500 block">STEP 01</span>
                <h4 className="text-base font-semibold text-white">DOM Fact Extraction</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  As you open a client thread on Fiverr, Upwork, or LinkedIn, the extension automatically extracts key discussion nodes, budgets, and deadlines.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-lg bg-zinc-900/40 border border-zinc-800/80 relative space-y-3">
                <span className="text-xs font-mono text-zinc-500 block">STEP 02</span>
                <h4 className="text-base font-semibold text-white">Contradiction Audit</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every new phrase is cross-checked against your Seller Knowledge Base and confirmed historical facts. Any conflicting claims trigger immediate alerts.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-lg bg-zinc-900/40 border border-zinc-800/80 relative space-y-3">
                <span className="text-xs font-mono text-zinc-500 block">STEP 03</span>
                <h4 className="text-base font-semibold text-white">Inline Synthesis</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The QuillBot-style composer drafts human, milestone-ready responses right inside the native message box with zero external browser tabs.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-lg bg-zinc-900/40 border border-zinc-800/80 relative space-y-3">
                <span className="text-xs font-mono text-zinc-500 block">STEP 04</span>
                <h4 className="text-base font-semibold text-white">Cloud Sync Mirror</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deduplicated messages and client ledgers silently sync to your Memoreply Cloud Dashboard for team oversight, backup, and historical tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON MATRIX (Linear / Vercel Enterprise style) */}
        <section id="comparison" className="py-20 border-t border-zinc-900 bg-zinc-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Architectural Comparison
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Traditional AI Chatbots vs. Memoreply
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-400">
                Why client-facing professionals replace copy-pasting into ChatGPT tabs with Memoreply.
              </p>
            </div>

            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full text-left border-collapse border border-zinc-800 rounded-lg overflow-hidden text-xs">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-mono">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-semibold text-zinc-500">ChatGPT / Claude Tabs</th>
                    <th className="p-4 font-semibold text-white bg-zinc-850 border-l border-zinc-700">Memoreply Context Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  <tr className="hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-300">Thread Context Persistence</td>
                    <td className="p-4 text-zinc-500">Lost on tab close / memory purge</td>
                    <td className="p-4 text-emerald-400 font-semibold bg-zinc-900/50 border-l border-zinc-800">
                      Persistent in IndexedDB + Postgres
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-300">Contradiction Detection</td>
                    <td className="p-4 text-zinc-500">None &bull; Will accept conflicting scope</td>
                    <td className="p-4 text-emerald-400 font-semibold bg-zinc-900/50 border-l border-zinc-800">
                      Automated DISPUTED alerts
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-300">Native Platform Integration</td>
                    <td className="p-4 text-zinc-500">Manual copy & paste back and forth</td>
                    <td className="p-4 text-emerald-400 font-semibold bg-zinc-900/50 border-l border-zinc-800">
                      1-click native DOM composer injection
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-300">Seller Rules & Guidelines</td>
                    <td className="p-4 text-zinc-500">Must re-prompt every single session</td>
                    <td className="p-4 text-emerald-400 font-semibold bg-zinc-900/50 border-l border-zinc-800">
                      Enforced globally on every draft
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-300">Average Reply Turnaround</td>
                    <td className="p-4 text-zinc-500">3 - 5 minutes of tab gymnastics</td>
                    <td className="p-4 text-emerald-400 font-semibold bg-zinc-900/50 border-l border-zinc-800">
                      &lt; 45 seconds total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SUPPORTED PLATFORMS SECTION */}
        <section id="platforms" className="py-20 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Native Connectors
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Seamless Cross-Platform Adapters
              </h2>
              <p className="mt-4 text-sm text-zinc-400">
                Memoreply isolates DOM selectors so you operate with full speed regardless of platform UI changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Fiverr */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                    Fiverr Adapter v2
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Fiverr Messaging & Orders</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Hooks directly into active Fiverr inbox threads, order requirement pages, and custom offer composers. Captures gig packages, extra revision requests, and buyer attachments.
                </p>
              </div>

              {/* Upwork */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 text-blue-400 border border-blue-800/80">
                    Upwork Adapter v2
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Upwork Work Rooms</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Extracts hourly rate caps, fixed-price milestone agreements, and client interview questions directly from Upwork Messages without page refreshes.
                </p>
              </div>

              {/* LinkedIn */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/60 text-indigo-400 border border-indigo-800/80">
                    LinkedIn Adapter v2
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white">LinkedIn Messaging & Sales Nav</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tracks corporate lead facts, company size notes, and executive consulting inquiries. Composes concise, executive-level replies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-20 border-t border-zinc-900 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-10 sm:p-14 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-[500px] h-[200px] bg-white/5 blur-3xl rounded-full pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Never lose context in a client negotiation again.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
                Launch your centralized workspace dashboard or install the Chrome Extension into your browser in under 60 seconds.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-lg transition-all shadow-md group cursor-pointer"
                >
                  <span>Open Workspace Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={() => setShowInstallModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>Install Extension</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER & BRANDING */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Memoreply"
                  className="w-6 h-6 rounded object-contain shrink-0"
                />
                <span className="font-semibold text-sm text-white tracking-tight">Memoreply</span>
              </div>
              <p className="text-zinc-400 text-xs">
                AI replies that remember.
              </p>
              <div className="pt-2 text-[11px] text-zinc-500 font-mono">
                Developed by <span className="text-zinc-300 font-semibold">HashTurn</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                Workspace
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link href="/clients" className="hover:text-zinc-300 transition-colors">
                    Tracked Clients
                  </Link>
                </li>
                <li>
                  <Link href="/conversations" className="hover:text-zinc-300 transition-colors">
                    Synced Conversations
                  </Link>
                </li>
                <li>
                  <Link href="/context-vault" className="hover:text-zinc-300 transition-colors">
                    Context Vault Ledger
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="hover:text-zinc-300 transition-colors">
                    Workspace Settings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Engine */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                Platform Engines
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a href="#features" className="hover:text-zinc-300 transition-colors">
                    Contradiction Engine
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-zinc-300 transition-colors">
                    Inline Response Composer
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-300 transition-colors">
                    Fiverr DOM Adapter
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-300 transition-colors">
                    Upwork Rooms Adapter
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-300 transition-colors">
                    LinkedIn Sales Nav Adapter
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Specs */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                Security & Source
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="https://github.com/chatbotexpert/memoreply"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
                <li>
                  <span className="text-zinc-400">Chrome MV3 Certified</span>
                </li>
                <li>
                  <span className="text-zinc-400">Zero LLM Model Training</span>
                </li>
                <li>
                  <span className="text-zinc-400">Deterministic Offline Mode</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-zinc-500">
              &copy; 2026 Memoreply. Engineered by HashTurn Digital. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational &bull; Cloud Gateway v2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* INSTALL EXTENSION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative text-left space-y-5">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <img
                src="/logo.png"
                alt="Memoreply"
                className="w-10 h-10 rounded-lg object-contain mb-3 shrink-0"
              />
              <h3 className="text-base font-semibold text-white">Install Memoreply Extension</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Manifest V3 certified companion for Chrome, Brave, and Edge.
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block font-semibold uppercase">Step 1: Download or Build</span>
                <p className="text-zinc-300">
                  Load the unpacked extension directory (<code className="text-emerald-400 font-mono">/dist</code>) in your browser.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block font-semibold uppercase">Step 2: Enable in Browser</span>
                <p className="text-zinc-300">
                  Navigate to <code className="text-zinc-200 font-mono">chrome://extensions</code>, enable <span className="font-semibold text-white">Developer mode</span>, and click <span className="font-semibold text-white">Load unpacked</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/chatbotexpert/memoreply"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 text-center rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>View GitHub Releases</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShowInstallModal(false)}
                className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
