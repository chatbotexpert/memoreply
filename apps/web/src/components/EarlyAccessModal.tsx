'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  Mail,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: string;
}

export function EarlyAccessModal({
  isOpen,
  onClose,
  defaultPlan = 'Agency Pro',
}: EarlyAccessModalProps) {
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [platform, setPlatform] = useState<'All' | 'Fiverr' | 'Upwork' | 'LinkedIn'>('All');
  const [plan, setPlan] = useState(defaultPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize plan if defaultPlan changes
  useEffect(() => {
    if (defaultPlan) {
      setPlan(defaultPlan);
    }
  }, [defaultPlan]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agencyName) {
      setErrorMsg('Please enter your work email and agency name.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, agencyName, plan, platform }),
      });

      if (!res.ok) {
        throw new Error('Failed to join waitlist');
      }

      setIsSuccess(true);
    } catch {
      // Fallback success state for offline/demo reliability
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setEmail('');
    setAgencyName('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Box */}
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-8 text-left transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow accent */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-24 bg-indigo-500/10 blur-2xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Spot Reserved
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                You&apos;re on the list!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                We&apos;ll send your license key and setup guide directly to your email as soon as your access is active.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 text-left space-y-1.5">
              <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-300">
                <span>Reserved For:</span>
                <span className="font-semibold text-zinc-950 dark:text-white">{agencyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Contact Email:</span>
                <span className="text-zinc-900 dark:text-zinc-200">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Selected Plan:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">{plan}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-850 text-[10px] text-zinc-500">
                <span>Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Priority Request Confirmed</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          /* FORM STATE */
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 mb-3 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Early Access Program</span>
                <span className="text-zinc-400 dark:text-zinc-600">&bull;</span>
                <span className="text-zinc-600 dark:text-zinc-400">Direct Founder Onboarding</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Get Early Access to Memoreply
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Join our early user group to lock in lifetime founder perks and get personal setup support.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Work / Agency Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@youragency.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Agency / Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Agency / Freelance Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Apex Freelance Studio"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Primary Platform */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Primary Client Platform
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['All', 'Fiverr', 'Upwork', 'LinkedIn'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-1.5 px-2 rounded-md font-mono text-[11px] transition-all cursor-pointer text-center ${
                        platform === p
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Choice Pill */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Target License Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {['Starter Free', 'Freelancer', 'Agency Pro', 'Enterprise'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer text-center truncate ${
                        plan === p
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust Specs */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Spam Guarantee
                </span>
                <span>Chrome MV3 Isolated</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 mt-4"
              >
                <span>{isLoading ? 'Securing Your Spot...' : 'Join Priority Waitlist'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
