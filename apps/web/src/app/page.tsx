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
  Menu,
  Smartphone,
  Video,
  Sparkles,
} from 'lucide-react';

import { EarlyAccessModal } from '@/components/EarlyAccessModal';
import { ThemeToggle } from '@/components/ThemeToggle';

type ReplyScenario = 'Scope Reminder' | 'Offer Checkpoints' | 'Rush Fee Option' | 'Platform Terms';

interface ReplyTemplate {
  title: string;
  badge: string;
  explanation: string;
  response: string;
}

const REPLY_TEMPLATES: Record<ReplyScenario, ReplyTemplate> = {
  'Scope Reminder': {
    title: 'Polite Scope Reminder',
    badge: 'Scope Protected',
    explanation: 'Politely clarifies that the confirmed delivery date is Monday to ensure high-quality work.',
    response:
      "Hi Alex,\n\nThanks for reaching out! In our initial agreement, the delivery date was set for Monday so we have enough time to test everything thoroughly.\n\nIf you need the first version earlier by Thursday, I'd be happy to deliver the initial preview then, and finish the final revisions by Monday. Let me know if that works for you!",
  },
  'Offer Checkpoints': {
    title: 'Split into Two Milestones',
    badge: '2 Milestones',
    explanation: 'Splits the project into two $250 checkpoints so the client gets an early deliverable.',
    response:
      "Hi Alex,\n\nTo help you meet your Thursday target while keeping the project on track, we can split this into two milestones:\n\n• Milestone 1 (Thursday): Initial prototype and layout review ($250)\n• Milestone 2 (Monday): Final implementation, testing, and delivery ($250)\n\nLet me know if that sounds good and I'll send over the milestone breakdown!",
  },
  'Rush Fee Option': {
    title: 'Offer Rush Delivery',
    badge: 'Rush Fee',
    explanation: 'Offers earlier delivery by prioritizing their project ahead of queue with a rush fee.',
    response:
      "Hi Alex,\n\nUnderstood! A Thursday delivery would mean working overtime and prioritizing your project ahead of my other queue orders. I can definitely make Thursday happen with a $150 rush fee, or we can stick to our original Monday delivery at the agreed $500. Let me know what you prefer!",
  },
  'Platform Terms': {
    title: 'Keep Payments Safe',
    badge: 'Platform Terms',
    explanation: 'Ensures conversations and milestones stay protected directly on Fiverr/Upwork.',
    response:
      "Hi Alex,\n\nSounds good! Just a quick reminder that all milestone offers, payments, and final files will be handled directly through Fiverr to keep both of us covered under platform policies. Excited to start on this!",
  },
};

export default function LandingPage() {
  const [selectedScenario, setSelectedScenario] = useState<ReplyScenario>('Scope Reminder');
  const [isCopied, setIsCopied] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'fiverr' | 'upwork' | 'linkedin'>('fiverr');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);
  const [selectedEarlyAccessPlan, setSelectedEarlyAccessPlan] = useState('Agency Pro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCopyDemo = () => {
    navigator.clipboard.writeText(REPLY_TEMPLATES[selectedScenario].response);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-950 dark:selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* Background Decorative Gradients (Soft, eye-friendly ambient lighting) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-zinc-200/40 dark:from-zinc-800/20 via-transparent to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-[380px] h-[280px] bg-emerald-500/5 dark:bg-emerald-950/10 blur-[120px] opacity-30" />
        <div className="absolute top-[50%] left-[5%] w-[420px] h-[320px] bg-indigo-500/5 dark:bg-indigo-950/10 blur-[130px] opacity-25" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-[#fafafa]/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Memoreply"
              className="w-8 h-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-white">
                Memoreply
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                by HashTurn
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              How It Works
            </a>
            <a href="#comparison" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Why Memoreply
            </a>
            <a href="#platforms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Platforms
            </a>
            <a href="#roadmap" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Roadmap
            </a>
            <a href="#download" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-200">
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Download</span>
            </a>
            <Link href="/pricing" className="text-zinc-900 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors font-semibold">
              Pricing
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              onClick={() => {
                setSelectedEarlyAccessPlan('Agency Pro');
                setIsEarlyAccessOpen(true);
              }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md transition-all shadow-xs cursor-pointer group"
            >
              <span>Get Early Access</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md border border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#fafafa] dark:bg-zinc-950 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#comparison"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Why Memoreply
            </a>
            <a
              href="#platforms"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Platforms
            </a>
            <a
              href="#roadmap"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Roadmap
            </a>
            <a
              href="#download"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            >
              Download Extension
            </a>
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-semibold text-zinc-950 dark:text-white"
            >
              Pricing
            </Link>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setSelectedEarlyAccessPlan('Agency Pro');
                  setIsEarlyAccessOpen(true);
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Get Early Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-16 pb-14 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 mb-6 sm:mb-8 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Early Access Program</span>
              <span className="text-zinc-400 dark:text-zinc-600">&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free 14-Day Trial</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1] sm:leading-[1.08]">
              Replies that <span className="text-zinc-500 dark:text-zinc-400 underline decoration-zinc-300 dark:decoration-zinc-800 underline-offset-8">remember</span>.
            </h1>

            {/* Sub-headline / Value Proposition */}
            <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Never forget an agreed price, deadline, or deliverable in client chat. Memoreply keeps your agreed project terms visible right next to your conversations on <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Fiverr</span>, <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Upwork</span>, and <span className="text-zinc-900 dark:text-zinc-200 font-semibold">LinkedIn</span> so you always reply with confidence.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setSelectedEarlyAccessPlan('Agency Pro');
                  setIsEarlyAccessOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-all shadow-md group cursor-pointer"
              >
                <span>Get Early Access</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:border-zinc-700 rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download Extension</span>
              </a>

              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
              >
                <span>Pricing &amp; Plans</span>
              </a>
            </div>

            {/* Benefit Highlights Pill Row */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-zinc-200 dark:border-zinc-850/80 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2.5 sm:gap-y-3 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Works in Fiverr & Upwork</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>Private browser storage</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Catch scope changes early</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>1-click quick replies</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE PRODUCT SHOWCASE (Linear / Vercel style simulator) */}
          <div className="mt-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/70 p-2 sm:p-3 shadow-2xl backdrop-blur-xl transition-colors">
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800/80 mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  Memoreply Extension &bull; Fiverr Inbox (Alex Miller)
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Extension Active
                </span>
                <span className="text-zinc-500">Platform: Fiverr</span>
              </div>
            </div>

            {/* Simulator Grid (3 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Column 1: Client Thread (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800/80 p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-850">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                        A
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Alex Miller</div>
                        <div className="text-[10px] font-mono text-zinc-500">@alex_miller_dev &bull; Fiverr</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">14:02 PM</span>
                  </div>

                  {/* Message History */}
                  <div className="mt-4 space-y-3">
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block mb-1">Agreed Terms (Yesterday)</span>
                      &ldquo;We need a Chrome MV3 Extension with React 19. Budget is firm at $500 with a 7-day delivery timeline.&rdquo;
                    </div>

                    <div className="bg-zinc-100/90 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200">
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block mb-1 font-semibold">New Client Message (Just now)</span>
                      &ldquo;Understood! But can we actually rush this and have the full working extension delivered by Thursday instead? Same $500 budget.&rdquo;
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
                  <span>Client: Alex Miller</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Terms pinned</span>
                </div>
              </div>

              {/* Column 2: Context Vault & Scope Notice (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800/80 p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-850">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span>Agreed Project Terms</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                      2 Pinned Terms
                    </span>
                  </div>

                  {/* Extracted Facts */}
                  <div className="mt-3 space-y-2 text-xs font-mono">
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-zinc-800 dark:text-zinc-300">Budget: $500.00</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Fixed</span>
                    </div>

                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-zinc-800 dark:text-zinc-300">Agreed Timeline: 7 Days</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Due Monday</span>
                    </div>

                    {/* SCOPE NOTICE BOX */}
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold font-sans">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Scope Notice</span>
                      </div>
                      <p className="text-[11px] text-amber-900 dark:text-amber-200/90 font-sans leading-relaxed">
                        Client requested Thursday delivery (~4 days early) without adjusting the agreed scope or budget.
                      </p>
                      <div className="pt-1 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400/80 font-sans">
                        <span className="px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/50 font-mono text-amber-900 dark:text-amber-300 font-semibold">Scope Changed</span>
                        <span>Remind client of Monday date or offer rush option.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Storage: Private local vault</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Protected</span>
                </div>
              </div>

              {/* Column 3: Quick Reply Assistant (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800/80 p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-850">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Quick Reply Assistant</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                      {REPLY_TEMPLATES[selectedScenario].badge}
                    </span>
                  </div>

                  {/* Interactive Reply Option Selectors */}
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1.5">Choose a response approach:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {(Object.keys(REPLY_TEMPLATES) as ReplyScenario[]).map((scenario) => (
                        <button
                          key={scenario}
                          onClick={() => setSelectedScenario(scenario)}
                          className={`px-2.5 py-1.5 rounded text-left font-medium transition-all cursor-pointer truncate ${
                            selectedScenario === scenario
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
                              : 'bg-zinc-50 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          {scenario}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reply Explanation */}
                  <div className="mt-2.5 px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                    <span className="truncate">{REPLY_TEMPLATES[selectedScenario].explanation}</span>
                  </div>

                  {/* Reply Box */}
                  <div className="mt-3 relative">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 leading-relaxed font-sans min-h-[140px] whitespace-pre-wrap">
                      {REPLY_TEMPLATES[selectedScenario].response}
                    </div>
                    <button
                      onClick={handleCopyDemo}
                      className="absolute top-2 right-2 p-1.5 rounded bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert('In Chrome, this inserts the response directly into the active Fiverr chat box.');
                    }}
                    className="w-full py-2 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Insert Response into Fiverr</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES GRID */}
        <section id="features" className="py-20 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/60 relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Why Freelancers Use Memoreply
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Everything you agreed with your client, right when you reply
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                No more digging through 50+ past messages or messy notepad files to remember what was promised.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1: Pinned Project Terms */}
              <div className="p-8 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white mb-6 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
                  Pinned Project Terms
                </h3>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Never dig through past messages to recall what was agreed. Confirmed prices, milestone deliverables, and agreed deadlines stay pinned right next to your active chat, so you never have to ask &ldquo;what did we agree on again?&rdquo;
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Agreed Milestones</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Confirmed Pricing</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Always Visible</span>
                </div>
              </div>

              {/* Feature 2: Scope Change Reminders */}
              <div className="p-8 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white mb-6 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
                  Scope Change Reminders
                </h3>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Clients often casually tighten deadlines or add new deliverables midway through a conversation. Memoreply highlights when a new message conflicts with previously agreed terms before you accidentally commit.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Scope Change Alerts</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Deadline Protection</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Clear Boundaries</span>
                </div>
              </div>

              {/* Feature 3: Polite, Professional Replies */}
              <div className="p-8 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white mb-6 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
                  Polite, Professional Replies
                </h3>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Handle scope pushback with confident, courteous responses. Easily suggest milestone splits, offer rush fee options, or remind clients of confirmed timelines with a single click right into your message box.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Polite Templates</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">1-Click Insert</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Customizable Wording</span>
                </div>
              </div>

              {/* Feature 4: Works Inside Your Freelance Inboxes */}
              <div className="p-8 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white mb-6 group-hover:scale-105 transition-transform">
                  <Workflow className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
                  Works Inside Your Freelance Inboxes
                </h3>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Memoreply works natively inside the messaging tabs of Fiverr, Upwork, and LinkedIn. It reads active conversation context and inserts clean responses without ever opening external notepad tabs.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Fiverr Inbox</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">Upwork Rooms</span>
                  <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">LinkedIn Messages</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Simple Workflow
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                How Memoreply works in your daily client chat
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                A simple, non-intrusive companion that saves hours of communication headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 relative space-y-3 shadow-xs">
                <span className="text-xs font-mono text-zinc-500 block">STEP 01</span>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">Open Client Chat</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Chat with your client normally on Fiverr, Upwork, or LinkedIn. Memoreply runs seamlessly right inside your active inbox.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 relative space-y-3 shadow-xs">
                <span className="text-xs font-mono text-zinc-500 block">STEP 02</span>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">Terms Stay Pinned</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Agreed budgets, timelines, and deliverables are automatically organized in your sidebar so you can reference them at any time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 relative space-y-3 shadow-xs">
                <span className="text-xs font-mono text-zinc-500 block">STEP 03</span>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">Scope Reminders</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  If a client requests earlier delivery or extra revisions without adjusting the budget, you get a clear, helpful heads-up.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 relative space-y-3 shadow-xs">
                <span className="text-xs font-mono text-zinc-500 block">STEP 04</span>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white">Send Confident Replies</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pick a polite quick response or insert your confirmed agreement terms directly into the message box with 1 click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON MATRIX */}
        <section id="comparison" className="py-20 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Comparison
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Scattered Notes vs. Memoreply
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Why freelancers stop relying on sticky notes, browser tabs, and memory.
              </p>
            </div>

            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full min-w-[580px] text-left border-collapse border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-xs bg-white dark:bg-zinc-900/40 shadow-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                    <th className="p-4 font-semibold">Situation</th>
                    <th className="p-4 font-semibold text-zinc-500">Scattered Notes &amp; Memory</th>
                    <th className="p-4 font-semibold text-zinc-950 dark:text-white bg-zinc-200/70 dark:bg-zinc-850 border-l border-zinc-300 dark:border-zinc-700">With Memoreply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-300">Remembering agreed terms</td>
                    <td className="p-4 text-zinc-500">Buried in 100+ past chat messages and easy to miss</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-zinc-900/50 border-l border-zinc-200 dark:border-zinc-800">
                      Pinned right next to your active chat
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-300">Spotting scope changes</td>
                    <td className="p-4 text-zinc-500">Often accepted accidentally without realizing the extra work</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-zinc-900/50 border-l border-zinc-200 dark:border-zinc-800">
                      Instant reminder before you say yes
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-300">Drafting pushback replies</td>
                    <td className="p-4 text-zinc-500">Awkward phrasing, hesitations, and missed boundaries</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-zinc-900/50 border-l border-zinc-200 dark:border-zinc-800">
                      Polite, ready-to-use quick response templates
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-300">Platform workflow</td>
                    <td className="p-4 text-zinc-500">Switching back and forth between browser tabs and notepads</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-zinc-900/50 border-l border-zinc-200 dark:border-zinc-800">
                      Works directly inside Fiverr, Upwork &amp; LinkedIn
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-300">Time to verify agreements</td>
                    <td className="p-4 text-zinc-500">3 to 5 minutes of frantic scrolling</td>
                    <td className="p-4 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/40 dark:bg-zinc-900/50 border-l border-zinc-200 dark:border-zinc-800">
                      Instant (under 10 seconds)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SUPPORTED PLATFORMS SECTION */}
        <section id="platforms" className="py-20 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Supported Inboxes
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Works where you talk to clients every day
              </h2>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Built natively for the freelance platforms you use to close deals and deliver work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Fiverr */}
              <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                    Fiverr Support
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Fiverr Messaging &amp; Orders</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Works directly in active Fiverr inbox threads, order requirement pages, and custom offer composers. Keeps track of gig packages, revisions, and milestone notes.
                </p>
              </div>

              {/* Upwork */}
              <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80">
                    Upwork Support
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Upwork Work Rooms</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tracks agreed hourly rate limits, fixed-price milestone deliverables, and interview discussions directly inside Upwork Messages.
                </p>
              </div>

              {/* LinkedIn */}
              <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                    LinkedIn Support
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">LinkedIn Messaging &amp; InMail</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Keeps client agreements, proposal estimates, and consulting terms organized right next to your LinkedIn conversation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/70 dark:bg-zinc-950/70 relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Pricing &amp; Plans
              </span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Simple, transparent plans for freelancers &amp; teams
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Choose the plan that fits your client roster. All plans include client agreement tracking, scope change reminders, and multi-platform support.
              </p>

              {/* Monthly vs Annual Toggle */}
              <div className="mt-8 inline-flex items-center p-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-white text-zinc-950 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-white dark:bg-white text-zinc-950 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>Yearly billing</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 font-semibold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* 4 Pricing Tier Cards - Balanced Sleek Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
              {/* Card 0: Starter Free */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Starter Free</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
                      1 Seat
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[34px]">
                    Pin client budgets and notes for solo freelance projects.
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
                      $0
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                    Free forever &bull; No card required
                  </span>

                  <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">1 Chrome Extension seat</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Pin client budgets &amp; milestones</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Works on Fiverr &amp; Upwork</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Private local storage in browser</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Community Discord support</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Starter Free');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-transparent font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Get Free Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 1: Freelancer */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Freelancer</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-750 shrink-0">
                      1 Seat
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[34px]">
                    Keep track of client agreements across all your freelance platforms.
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
                      {billingCycle === 'yearly' ? '$23' : '$29'}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                    {billingCycle === 'yearly' ? 'Billed annually ($276/yr)' : 'Billed monthly'}
                  </span>

                  <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-850 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">1 Chrome Extension seat</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Fiverr, Upwork &amp; LinkedIn support</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Scope change alerts &amp; reminders</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Private browser storage + backup</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Direct email support (&lt;24h)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Freelancer');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-transparent font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Get Early Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Agency Pro (Highlighted) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-indigo-600/70 dark:border-indigo-500/80 shadow-xl shadow-indigo-500/5 dark:shadow-2xl scale-[1.01] relative flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white shadow-xs whitespace-nowrap">
                  Popular &bull; Team Choice
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Agency Pro</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                      5 Seats
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[34px]">
                    Shared client agreements and notes for growing freelance teams.
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
                      {billingCycle === 'yearly' ? '$63' : '$79'}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                    {billingCycle === 'yearly' ? 'Billed annually ($756/yr)' : 'Billed monthly'}
                  </span>

                  <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">5 Chrome Extension seats</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Centralized agency workspace</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Shared client notes across team</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Scope change reminders on all seats</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Priority direct email &amp; chat support</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Agency Pro');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group cursor-pointer"
                  >
                    <span>Get Early Access</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Card 3: Enterprise */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Enterprise</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-750 shrink-0">
                      20 Seats
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[34px]">
                    Custom workspace setup, CRM integrations, and dedicated support.
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
                      {billingCycle === 'yearly' ? '$159' : '$199'}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                    {billingCycle === 'yearly' ? 'Billed annually ($1,908/yr)' : 'Billed monthly'}
                  </span>

                  <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-850 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">20+ Chrome Extension seats</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Custom CRM &amp; webhook integrations</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Dedicated workspace database</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Role permissions &amp; member access</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">Dedicated Account Manager (24/7)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Enterprise');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-transparent font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Join Waitlist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Badges Row */}
            <div className="mt-14 pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Instant License Key Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Cancel Anytime with 1-Click</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Private Local Browser Storage</span>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT ROADMAP SECTION */}
        <section id="roadmap" className="py-24 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/60 dark:bg-zinc-950/60 relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Product Roadmap &amp; Journey</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                The Future of Client Memory
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Memoreply is evolving from a browser extension into an omnipresent intelligent layer that protects your agreements everywhere you communicate.
              </p>
            </div>

            {/* 3 Milestone Roadmap Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto relative">
              {/* Milestone 1: Phase 1 */}
              <div className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Phase 1 &bull; Live Early Access
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Q4 2026</span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-750">
                    <Globe className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Phase 1: Extension (Only Web)
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Manifest V3 companion living directly inside Fiverr Inbox, Upwork Rooms, and LinkedIn Messages with zero context switching.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Pinned client agreement terms sidebar</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Scope creep &amp; deadline contradiction alerts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>1-click polite response insertion</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>100% private local browser storage</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    Available Now
                  </span>
                  <a
                    href="#download"
                    className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-white hover:underline cursor-pointer"
                  >
                    <span>Download Extension</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Milestone 2: Phase 2 */}
              <div className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/60 border border-indigo-200 dark:border-indigo-950/80 flex flex-col justify-between shadow-xs hover:border-indigo-300 dark:hover:border-indigo-900 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Phase 2 &bull; In Development
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Q1 2027</span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                    <Smartphone className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Phase 2: Mobile Keyboard (Mobile)
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Custom iOS &amp; Android keyboard extension bringing your client agreement ledger into WhatsApp, Telegram, Slack, and mobile inboxes.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>Context bar right above the mobile keyboard</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>Auto-suggests agreed prices &amp; delivery dates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>Quick-paste invoice &amp; milestone terms on phone</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>End-to-end encrypted mobile sync</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                    Private Beta Soon
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Agency Pro');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-white hover:underline cursor-pointer"
                  >
                    <span>Reserve Mobile Spot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Milestone 3: Phase 3 */}
              <div className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Phase 3 &bull; Planned
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Q2 2027</span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-750">
                    <Video className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Phase 3: Meeting AI Assistant
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Ambient intelligence for Google Meet, Zoom, and Loom discovery calls that extracts agreed terms and stops accidental verbal discounts.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                      <span>Live term extraction during kickoff calls</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                      <span>Automatic post-call agreement recap generation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                      <span>Real-time verbal scope creep warning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                      <span>Auto-syncs verbal notes directly to client card</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-500 font-semibold text-[11px]">
                    Research &amp; Specs
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEarlyAccessPlan('Enterprise');
                      setIsEarlyAccessOpen(true);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-white hover:underline cursor-pointer"
                  >
                    <span>Request Early Specs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXTENSION DOWNLOAD & DIRECT ACCESS SECTION */}
        <section id="download" className="py-20 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Col: Info & Direct Download CTAs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Manifest V3 Certified</span>
                    <span className="text-zinc-400">&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Chrome &bull; Brave &bull; Edge</span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Download the Memoreply Extension
                    </h2>
                    <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                      Get the unpacked production build of Memoreply. Works 100% locally in your browser with offline support and zero background telemetry.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="/memoreply-extension.zip"
                      download="memoreply-extension.zip"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs transition-all shadow-md group cursor-pointer"
                    >
                      <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Download Extension (.ZIP)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowInstallModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-750 font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <Terminal className="w-4 h-4 text-zinc-500" />
                      <span>Installation Guide</span>
                    </button>

                    <a
                      href="https://github.com/chatbotexpert/memoreply"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Trust Specs */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Safe &amp; Sandboxed
                    </span>
                    <span>&bull;</span>
                    <span>Version 0.1.0 Beta</span>
                    <span>&bull;</span>
                    <span>175 KB Clean Bundle</span>
                  </div>
                </div>

                {/* Right Col: 3-Step Quick Install Preview */}
                <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                    Fast 3-Step Setup
                  </span>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">Download &amp; Unzip</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Extract the downloaded zip into a local folder on your computer.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">Open chrome://extensions</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Enable &quot;Developer mode&quot; in the top-right toggle of your browser.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">Click &quot;Load unpacked&quot;</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Select the extracted folder. Memoreply activates instantly in Fiverr &amp; Upwork!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-20 border-t border-zinc-200 dark:border-zinc-900 relative transition-colors">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 sm:p-10 lg:p-14 rounded-2xl bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/5 dark:bg-white/5 blur-3xl rounded-full pointer-events-none" />

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Never undercharge or overcommit on a client project again.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                Join our early access program today and get 14 days of free access to Memoreply.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectedEarlyAccessPlan('Agency Pro');
                    setIsEarlyAccessOpen(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-all shadow-md group cursor-pointer"
                >
                  <span>Get Early Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#download"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download Extension</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER & BRANDING */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 py-12 text-xs text-zinc-500 transition-colors">
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
                <span className="font-semibold text-sm text-zinc-900 dark:text-white tracking-tight">Memoreply</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                Replies that remember.
              </p>
              <div className="pt-2 text-[11px] text-zinc-500 font-mono">
                Developed by <span className="text-zinc-800 dark:text-zinc-300 font-semibold">HashTurn</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-400 block font-semibold">
                Workspace
              </span>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link href="/dashboard" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link href="/clients" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Tracked Clients
                  </Link>
                </li>
                <li>
                  <Link href="/conversations" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Synced Conversations
                  </Link>
                </li>
                <li>
                  <Link href="/context-vault" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Context Vault Ledger
                  </Link>
                </li>
                <li>
                  <a href="#roadmap" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Product Roadmap
                  </a>
                </li>
                <li>
                  <a href="#download" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors text-emerald-600 dark:text-emerald-400 font-medium">
                    Download Extension (.ZIP)
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors text-zinc-900 dark:text-white font-medium">
                    Pricing & Plans
                  </a>
                </li>
                <li>
                  <Link href="/settings" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Workspace Settings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Engine */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-400 block font-semibold">
                Platform Engines
              </span>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <a href="#features" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Contradiction Engine
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Scope & Policy Guard
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Fiverr DOM Adapter
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    Upwork Rooms Adapter
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors">
                    LinkedIn Sales Nav Adapter
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Specs */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-400 block font-semibold">
                Security & Source
              </span>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="https://github.com/chatbotexpert/memoreply"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-950 dark:hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">Chrome MV3 Certified</span>
                </li>
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">100% Client-Side Privacy & Encryption</span>
                </li>
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">Deterministic Offline Mode</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-zinc-500">
              &copy; 2026 Memoreply. Engineered by HashTurn Digital. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational &bull; Cloud Gateway v2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* INSTALL EXTENSION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative text-left space-y-5 transition-colors">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <img
                src="/logo.png"
                alt="Memoreply"
                className="w-10 h-10 rounded-lg object-contain mb-3 shrink-0"
              />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Install Memoreply Extension</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Manifest V3 certified companion for Chrome, Brave, and Edge.
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block font-semibold uppercase">Step 1: Download or Build</span>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Load the unpacked extension directory (<code className="text-emerald-600 dark:text-emerald-400 font-mono">/dist</code>) in your browser.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block font-semibold uppercase">Step 2: Enable in Browser</span>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Navigate to <code className="text-zinc-800 dark:text-zinc-200 font-mono">chrome://extensions</code>, enable <span className="font-semibold text-zinc-950 dark:text-white">Developer mode</span>, and click <span className="font-semibold text-zinc-950 dark:text-white">Load unpacked</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href="/memoreply-extension.zip"
                download="memoreply-extension.zip"
                className="w-full sm:flex-1 py-2 px-3 text-center rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ZIP</span>
              </a>

              <a
                href="https://github.com/chatbotexpert/memoreply"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-2 px-3 text-center rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-transparent font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>GitHub Releases</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full sm:w-auto py-2 px-3 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early Access / Waitlist Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessOpen}
        onClose={() => setIsEarlyAccessOpen(false)}
        defaultPlan={selectedEarlyAccessPlan}
      />
    </div>
  );
}
