'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Check,
  Building2,
  Mail,
  Lock,
  User,
  Zap,
} from 'lucide-react';
import { useAuth, SaaSPlan } from '@/context/AuthContext';

interface PlanOption {
  id: SaaSPlan;
  name: string;
  price: string;
  billing: string;
  badge?: string;
  seats: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'Freelancer',
    name: 'Freelancer',
    price: '$29',
    billing: 'per month',
    seats: '1 Extension License Seat',
    features: [
      'Unlimited client context extraction',
      'Fiverr, Upwork & LinkedIn adapters',
      'IndexedDB + Cloud mirror backup',
      'Contradiction detection shield',
    ],
  },
  {
    id: 'Agency Pro',
    name: 'Agency Pro',
    price: '$79',
    billing: 'per month',
    badge: 'Most Popular',
    seats: '5 Extension License Seats',
    features: [
      'All Freelancer features included',
      '5 concurrent extension seats',
      'Centralized agency team dashboard',
      'Cross-platform memory sync pool',
      'Priority Cloud Gateway access',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise Agency',
    price: '$199',
    billing: 'per month',
    seats: '20 Extension License Seats',
    features: [
      'All Agency Pro features included',
      '20 concurrent team seats',
      'Custom CRM / Webhook streaming',
      'Dedicated cloud database mirror',
      'SLA & 24/7 technical support',
    ],
  },
];

export default function SignUpPage() {
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlan>('Agency Pro');
  const [name, setName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signup } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !agencyName) {
      setErrorMsg('Please fill in all agency registration fields.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      await signup(name, agencyName, email, password, selectedPlan);
      router.push('/dashboard');
    } catch {
      setErrorMsg('Failed to create agency account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[25%] left-[10%] w-[350px] h-[280px] bg-indigo-950/15 blur-[130px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Memoreply"
              className="w-9 h-9 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="text-left">
              <span className="font-semibold text-lg tracking-tight text-white block">
                Memoreply
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block -mt-1">
                Commercial Agency Platform
              </span>
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white pt-2">
            Get started with Memoreply Workspace
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Choose your agency tier, register your team, and receive instant extension license keys.
          </p>
        </div>

        {/* Plan Selector Grid */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Step 1: Select Your License Tier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-500 ring-2 ring-zinc-500/20 shadow-xl'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-zinc-950 shadow-xs">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white">{plan.name}</h3>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-white bg-white text-zinc-950'
                            : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white font-mono">{plan.price}</span>
                      <span className="text-xs text-zinc-400">/{plan.billing}</span>
                    </div>

                    <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-850 text-zinc-300 border border-zinc-750">
                      {plan.seats}
                    </span>

                    <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-850 text-[11px] font-medium text-center">
                    <span className={isSelected ? 'text-white' : 'text-zinc-500'}>
                      {isSelected ? '✓ Selected Plan' : 'Click to Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Registration Form */}
        <div className="max-w-xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Step 2: Agency Account Details
            </span>
            <p className="text-xs text-zinc-400 mt-1">
              Your license key and workspace dashboard will be provisioned immediately.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">Lead Contact Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Hassaan HashTurn"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Agency Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Agency / Studio Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="HashTurn Digital Solutions"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Agency Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@hashturn.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password (8+ chars)"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
            </div>

            {/* License Guarantee */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant License Provisioning</span>
              </div>
              <p>
                Selected: <span className="text-white font-semibold">{selectedPlan}</span>. You will receive an immediate license key to unlock your Chrome MV3 extension.
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              <span>{isLoading ? 'Issuing License...' : `Buy Access & Issue License Key`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-850">
            <span>Already have an active agency account? </span>
            <Link
              href="/login"
              className="font-medium text-white hover:underline underline-offset-4"
            >
              Sign In to Workspace →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
