'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your agency work email.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setErrorMsg('Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••••••');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-[10%] right-[15%] w-[300px] h-[250px] bg-emerald-950/10 blur-[120px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
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
                Agency & Workspace Cloud
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white pt-2">
            Sign in to your agency workspace
          </h1>
          <p className="text-xs text-zinc-400">
            Manage your extension licenses, team seats, and client memory ledgers.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Agency Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@agency.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched to your email.');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-zinc-400">Remember this device</span>
              </label>

              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                SSO Encrypted
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              <span>{isLoading ? 'Verifying Session...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Fillers for Instant Review */}
          <div className="mt-6 pt-5 border-t border-zinc-850">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2 text-center">
              1-Click Instant Demo Access:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('agency@hashturn.com')}
                className="py-1.5 px-2.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-indigo-400" />
                <span>Agency Pro</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('freelancer@alexmiller.io')}
                className="py-1.5 px-2.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-emerald-400" />
                <span>Freelancer Tier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-zinc-400">
          <span>Don&apos;t have an active agency license? </span>
          <Link
            href="/signup"
            className="font-medium text-white hover:underline underline-offset-4"
          >
            Get Started & Buy Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
