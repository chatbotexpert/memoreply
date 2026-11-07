'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [accountEmail, setAccountEmail] = useState('');
  const [tokenHash, setTokenHash] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // Listen for recovery session from URL query params or URL hash
  useEffect(() => {
    const handleRecoverySession = async () => {
      if (typeof window === 'undefined') return;
      try {
        const url = new URL(window.location.href);
        const hash = url.searchParams.get('token_hash') || url.searchParams.get('token') || '';
        const emailParam = url.searchParams.get('email') || '';
        const type = (url.searchParams.get('type') as any) || 'recovery';

        if (emailParam) {
          setAccountEmail(emailParam);
        }
        if (hash) {
          setTokenHash(hash);
          const { error } = await supabase.auth.verifyOtp({
            token_hash: hash,
            type: type === 'recovery' ? 'recovery' : 'email',
          });
          if (error) {
            console.warn('[Recovery Verification Warning]:', error.message);
          } else {
            console.log('[Recovery Session]: Token verified successfully');
          }
        }

        // Also check hash fragment (#access_token=...)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            console.log('[Recovery Session]: Session established from URL hash');
          }
        }

        // Try getting current authenticated user email
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email && !emailParam) {
          setAccountEmail(userData.user.email);
        }
      } catch (err) {
        console.error('[Recovery Error]:', err);
      }
    };

    handleRecoverySession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session?.user?.email) {
          setAccountEmail(session.user.email);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. First attempt update via robust backend API (updates Supabase Admin + Clerk simultaneously)
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountEmail,
          password,
          tokenHash,
        }),
      });

      const apiData = await res.json().catch(() => null);

      if (res.ok && apiData?.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2200);
        return;
      }

      // 2. Fallback to client-side Supabase session update
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw new Error(apiData?.error || error.message);
      }

      setIsSuccess(true);

      // Broadcast updated session for extension
      if (data.user && typeof window !== 'undefined') {
        const authPayload = {
          userId: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'Agency User',
          plan: data.user.user_metadata?.plan || 'Agency Pro',
        };
        window.postMessage(
          { type: 'MEMOREPLY_AUTH_PAYLOAD', payload: authPayload },
          window.location.origin
        );
      }

      setTimeout(() => {
        router.push('/login');
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to update password. Please request a new recovery link.');
    } finally {
      setIsLoading(false);
    }
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
            Set New Password
          </h1>
          <p className="text-xs text-zinc-400">
            Choose a secure password for your Memoreply agency workspace account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isSuccess ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/80 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Password Updated Successfully!</h3>
              <p className="text-xs text-zinc-400">
                Your credentials have been updated and synchronized with the Chrome extension. Redirecting to your dashboard...
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-emerald-400 text-zinc-950 font-bold text-xs"
                >
                  <span>Go to Workspace Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Account Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="seller@agency.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                <span>{isLoading ? 'Updating Password...' : 'Save & Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

