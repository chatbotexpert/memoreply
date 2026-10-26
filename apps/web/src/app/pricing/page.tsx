'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Check,
  Zap,
  Lock,
  CheckCircle2,
  HelpCircle,
  Download,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { EarlyAccessModal } from '@/components/EarlyAccessModal';
import { ThemeToggle } from '@/components/ThemeToggle';

type BillingPeriod = 'monthly' | 'yearly';
type PlanType = 'Starter Free' | 'Freelancer' | 'Agency Pro' | 'Enterprise';

interface PricingTier {
  id: PlanType;
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  seats: string;
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'Starter Free',
    name: 'Starter Free',
    tagline: 'Essential memory extraction for solo freelancers starting out.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    seats: '1 Seat',
    features: [
      '1 Extension Seat (Chrome MV3)',
      'Basic client memory extraction',
      'Fiverr or Upwork adapter',
      'Local IndexedDB offline vault',
      'Community Discord support',
    ],
  },
  {
    id: 'Freelancer',
    name: 'Freelancer',
    tagline: 'Multi-platform memory & scope defense for active sellers.',
    monthlyPrice: 29,
    yearlyPrice: 23,
    seats: '1 Seat',
    features: [
      '1 Extension Seat (Chrome MV3)',
      'Fiverr, Upwork & LinkedIn full sync',
      'Contradiction Engine & Scope Shield',
      'IndexedDB + Cloud Mirror backup',
      'Standard email support (<24h)',
    ],
  },
  {
    id: 'Agency Pro',
    name: 'Agency Pro',
    popular: true,
    badge: 'Popular • Agency Choice',
    tagline: 'Unified memory sync pool for growing agency teams.',
    monthlyPrice: 79,
    yearlyPrice: 63,
    seats: '5 Seats',
    features: [
      '5 Concurrent Extension Seats',
      'Centralized Team Dashboard',
      'Shared Team Memory Mirror pool',
      'Cross-seat contradiction alerts',
      'Priority WebSocket Cloud Gateway',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    tagline: 'Custom pipelines, dedicated replicas & priority SLA.',
    monthlyPrice: 199,
    yearlyPrice: 159,
    seats: '20 Seats',
    features: [
      '20 Concurrent Extension Seats',
      'Custom CRM webhooks & streaming',
      'Dedicated PostgreSQL replica',
      'Team permission controls & audits',
      'Dedicated Account Manager (24/7)',
    ],
  },
];

const FAQS = [
  {
    q: 'How does extension licensing work after I sign up?',
    a: 'Immediately after registration, an authorized License Key (e.g. MR-AGENCY-XXXX-SEC) is generated in your dashboard. You and your team enter this key in the Memoreply Chrome Extension to instantly link your sessions to your agency memory vault.',
  },
  {
    q: 'Can I add more seats as my agency expands?',
    a: 'Yes. You can upgrade from Freelancer to Agency Pro or Enterprise at any time. Additional extension seats become active immediately with zero downtime.',
  },
  {
    q: 'Is our client messaging data private and secure?',
    a: 'Yes, 100%. Memoreply stores extracted context deterministically in client-side IndexedDB with encrypted cloud sync. We never sell data or train public LLMs on your private client negotiations.',
  },
  {
    q: 'Does it work simultaneously across Fiverr, Upwork, and LinkedIn?',
    a: 'Yes. Memoreply includes dedicated DOM adapters for all three major platforms. You can manage clients across different marketplaces simultaneously within the same unified ledger.',
  },
  {
    q: 'Can I cancel my subscription if needed?',
    a: 'Yes, absolutely. You can cancel with 1-click at any time directly from your workspace dashboard. You also have a full 14-day money-back guarantee.',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Agency Pro');
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-950 dark:selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-zinc-300/30 dark:from-zinc-800/20 via-zinc-200/10 dark:via-zinc-900/10 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-[25%] right-[10%] w-[450px] h-[350px] bg-indigo-500/10 dark:bg-indigo-950/15 blur-[130px] opacity-40" />
        <div className="absolute top-[45%] left-[5%] w-[400px] h-[300px] bg-emerald-500/10 dark:bg-emerald-950/10 blur-[120px] opacity-30" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
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
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-250 dark:border-zinc-700/60">
                Pricing
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Overview
            </Link>
            <Link href="/#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Core Modules
            </Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Deterministic Engine
            </Link>
            <Link href="/#platforms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Supported Platforms
            </Link>
            <Link href="/pricing" className="text-zinc-900 dark:text-white font-semibold">
              Pricing & Plans
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-md transition-all cursor-pointer shadow-2xs"
            >
              <span>Sign In</span>
            </Link>

            <button
              onClick={() => setIsEarlyAccessOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:text-zinc-950 dark:bg-white dark:hover:bg-zinc-200 rounded-md transition-all shadow-xs cursor-pointer group"
            >
              <span>Get Early Access</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">
        {/* HERO TITLE & BILLING TOGGLE */}
        <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Pre-Launch Early Access Tiers</span>
            <span className="text-zinc-400 dark:text-zinc-600">&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Batch 1 Allocations</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Predictable, transparent pricing for agencies
          </h1>
          <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Select the license tier that fits your roster. Every plan includes full client memory ledger, multi-platform adapters, and the contradiction protection shield.
          </p>

          {/* Monthly vs Annual Toggle */}
          <div className="mt-10 inline-flex items-center p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                billing === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                billing === 'yearly'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Yearly billing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </section>

        {/* 4 PRICING TIER CARDS - BALANCED SLEEK GRID */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {PRICING_TIERS.map((tier) => {
              const isSelected = selectedPlan === tier.id;
              const price = billing === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
              const annualTotal = tier.yearlyPrice * 12;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlan(tier.id)}
                  className={`p-6 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between ${
                    tier.popular
                      ? 'bg-white dark:bg-zinc-900 border-2 border-indigo-600 dark:border-indigo-500/90 shadow-xl scale-[1.01]'
                      : isSelected
                      ? 'bg-white dark:bg-zinc-900/90 border border-zinc-400 dark:border-zinc-500 ring-1 ring-zinc-400/20 dark:ring-zinc-500/20 shadow-md'
                      : 'bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/60 shadow-xs dark:shadow-none'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white shadow-md whitespace-nowrap">
                      {tier.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{tier.name}</h3>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
                        {tier.seats}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[34px]">
                      {tier.tagline}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">/ month</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                      {tier.monthlyPrice === 0
                        ? 'Free forever'
                        : billing === 'yearly'
                        ? `Billed annually ($${annualTotal}/yr)`
                        : 'Billed monthly'}
                    </span>

                    {/* Features List */}
                    <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                      {tier.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(tier.id);
                        setIsEarlyAccessOpen(true);
                      }}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group ${
                        tier.popular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white'
                      }`}
                    >
                      <span>
                        {tier.id === 'Enterprise'
                          ? 'Join Waitlist'
                          : tier.id === 'Starter Free'
                          ? 'Get Free Access'
                          : 'Get Early Access'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Row */}
          <div className="mt-14 pt-8 border-t border-zinc-900 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>14-Day Money Back Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant License Key Provisioning</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Cancel Anytime with 1-Click</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>100% Client-Side Private Encryption</span>
            </div>
          </div>
        </section>

        {/* FEATURE COMPARISON TABLE */}
        <section className="py-20 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Detailed Comparison
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Compare plan capabilities side-by-side
              </h2>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-zinc-700 dark:text-zinc-400">
                    <th className="p-4 font-semibold">Feature / Module</th>
                    <th className="p-4 font-semibold text-center">Starter Free</th>
                    <th className="p-4 font-semibold text-center">Freelancer</th>
                    <th className="p-4 font-semibold text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      Agency Pro
                    </th>
                    <th className="p-4 font-semibold text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Extension License Seats</td>
                    <td className="p-4 text-center font-mono text-zinc-500 dark:text-zinc-400">1 Seat (Free)</td>
                    <td className="p-4 text-center font-mono text-zinc-700 dark:text-zinc-300">1 Seat</td>
                    <td className="p-4 text-center font-mono font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      5 Seats
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-700 dark:text-zinc-300">20 Seats</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Fiverr, Upwork & LinkedIn Adapters</td>
                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-300">Single (Fiverr / Upwork)</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Full</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Full
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Full</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Contradiction Engine & Scope Shield</td>
                    <td className="p-4 text-center text-zinc-500 dark:text-zinc-400">Basic</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Included</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Multi-Seat
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Multi-Seat + Logs</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Centralized Cloud Sync Mirror</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">Local DB Only</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">Personal Only</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Team Unified
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Dedicated Replica</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">License Key Regeneration & Seat Revocation</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Yes
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes + Granular Roles</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Custom CRM Webhooks & API Streaming</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">—</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">—</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">—</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Included</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Support Channel</td>
                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-400 font-mono">Community Discord</td>
                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-400 font-mono">Standard Email</td>
                    <td className="p-4 text-center font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      Priority Slack / Email
                    </td>
                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-300 font-mono">24/7 Dedicated SLA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="py-20 border-t border-zinc-200 dark:border-zinc-900 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              Got Questions?
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 shadow-xs dark:shadow-none"
              >
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-20 border-t border-zinc-200 dark:border-zinc-900 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-10 sm:p-12 rounded-2xl bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-[400px] h-[180px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

              <h2 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Ready to protect your client agreements?
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                Sign up in under 60 seconds, issue your extension license key, and connect your marketplace accounts.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsEarlyAccessOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:text-zinc-950 dark:bg-white dark:hover:bg-zinc-200 rounded-lg transition-all shadow-md group cursor-pointer"
                >
                  <span>Get Early Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <span>Sign In to Workspace</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/60 dark:bg-zinc-950 py-12 text-xs text-zinc-600 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Memoreply"
              className="w-6 h-6 rounded object-contain shrink-0"
            />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">Memoreply</span>
            <span className="text-zinc-400 dark:text-zinc-600">&bull;</span>
            <span className="text-zinc-600 dark:text-zinc-400">Replies that remember.</span>
          </div>

          <p className="text-[11px] text-zinc-500">
            &copy; 2026 Memoreply. Engineered by HashTurn Digital. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Early Access / Waitlist Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessOpen}
        onClose={() => setIsEarlyAccessOpen(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
}
