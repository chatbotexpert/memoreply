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
  Menu,
  X,
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
    tagline: 'Save agreed budgets and client notes for solo freelance projects.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    seats: '1 Seat',
    features: [
      '1 Chrome Extension seat',
      'Pin client budgets & milestones',
      'Works on Fiverr & Upwork',
      'Private local storage in your browser',
      'Community Discord support',
    ],
  },
  {
    id: 'Freelancer',
    name: 'Freelancer',
    tagline: 'Keep track of client agreements across all your freelance platforms.',
    monthlyPrice: 29,
    yearlyPrice: 23,
    seats: '1 Seat',
    features: [
      '1 Chrome Extension seat',
      'Fiverr, Upwork & LinkedIn support',
      'Instant reminders when scope changes',
      'Save & insert quick response templates',
      'Fast direct email support (<24h)',
    ],
  },
  {
    id: 'Agency Pro',
    name: 'Agency Pro',
    popular: true,
    badge: 'Most Popular • For Studios',
    tagline: 'Share client notes and agreed terms across your entire agency team.',
    monthlyPrice: 79,
    yearlyPrice: 63,
    seats: '5 Seats',
    features: [
      '5 Team extension seats',
      'Central agency overview dashboard',
      'Shared client notes across team members',
      'Team-wide scope change alerts',
      'Priority direct email & chat support',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    tagline: 'Tailored setup, custom integrations, and dedicated account support.',
    monthlyPrice: 199,
    yearlyPrice: 159,
    seats: '20 Seats',
    features: [
      '20+ Team extension seats',
      'Custom CRM & webhook integrations',
      'Dedicated workspace database',
      'Role permissions & audit history',
      'Dedicated account manager (24/7)',
    ],
  },
];

const FAQS = [
  {
    q: 'How do I activate the Chrome Extension after joining?',
    a: 'Once your workspace is created, you get a personal license key in your dashboard. Simply paste this key into the Memoreply extension popup in Chrome, and your client notes and agreement history will be ready.',
  },
  {
    q: 'Can I add team members as my freelance business grows?',
    a: 'Yes, easily. You can upgrade from Freelancer to Agency Pro at any time to invite additional teammates and share client notes across your team.',
  },
  {
    q: 'Is my client messaging data private and confidential?',
    a: 'Yes, 100%. Memoreply stores your agreements and notes locally inside your browser, with optional private encrypted cloud sync. We never sell your data or share your private client messages.',
  },
  {
    q: 'Does it work simultaneously across Fiverr, Upwork, and LinkedIn?',
    a: 'Yes. Memoreply runs smoothly inside the inbox of Fiverr, Upwork, and LinkedIn, keeping all your client context organized regardless of where you message.',
  },
  {
    q: 'Can I cancel my plan at any time?',
    a: 'Yes, anytime with one click in your settings. There are no contracts or cancellation fees, and all paid plans include a 14-day free trial period.',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Agency Pro');
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-950 dark:selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* Background Gradients (Soft eye-friendly ambient light) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-gradient-to-b from-zinc-200/40 dark:from-zinc-800/20 via-transparent to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[25%] right-[10%] w-[400px] h-[300px] bg-indigo-500/5 dark:bg-indigo-950/15 blur-[130px] opacity-30" />
        <div className="absolute top-[45%] left-[5%] w-[380px] h-[280px] bg-emerald-500/5 dark:bg-emerald-950/10 blur-[120px] opacity-25" />
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
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-250 dark:border-zinc-700/60">
                Pricing
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Overview
            </Link>
            <Link href="/#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              How It Works
            </Link>
            <Link href="/#platforms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Platforms
            </Link>
            <Link href="/pricing" className="text-zinc-900 dark:text-white font-semibold">
              Pricing
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              onClick={() => setIsEarlyAccessOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:text-zinc-950 dark:bg-white dark:hover:bg-zinc-200 rounded-md transition-all shadow-xs cursor-pointer group"
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
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Overview
            </Link>
            <Link
              href="/#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="/#platforms"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              Platforms
            </Link>
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
                  setIsEarlyAccessOpen(true);
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
        {/* HERO TITLE & BILLING TOGGLE */}
        <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Early Access Program</span>
            <span className="text-zinc-400 dark:text-zinc-600">&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">14-Day Free Trial</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Predictable, transparent pricing for freelancers & agencies
          </h1>
          <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your client roster. All plans include client agreement tracking, scope change reminders, and multi-platform support.
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

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto bg-white dark:bg-zinc-900/40 shadow-xs">
              <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-400">
                    <th className="p-4 font-semibold">Feature</th>
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
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Fiverr, Upwork & LinkedIn Support</td>
                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-300">Single (Fiverr / Upwork)</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Full</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Full
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Full</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Scope Change Alerts & Reminders</td>
                    <td className="p-4 text-center text-zinc-500 dark:text-zinc-400">Basic</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Included</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Multi-Seat
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Multi-Seat + Logs</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Shared Workspace & Team Notes</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">Local Only</td>
                    <td className="p-4 text-center text-zinc-400 dark:text-zinc-500">Personal Only</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Team Unified
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Dedicated Setup</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">License Key Management & Revocation</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-x border-zinc-200 dark:border-zinc-800">
                      ✓ Yes
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">✓ Yes + Granular Roles</td>
                  </tr>

                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">Custom CRM & Webhook Integrations</td>
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
