'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs/legacy';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn, user: currentClerkUser } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  // ── Step 1: User submits email -> Clerk natively sends 6-digit OTP code ──
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (!isLoaded || !signIn) {
      setErrorMsg('Authentication service is initializing. Please wait a moment.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResendStatus('');

    try {
      // If user is currently signed in, sign out first so Clerk allows resetting password
      if (isSignedIn) {
        await signOut().catch(() => {});
      }

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setStep('verify');
    } catch (err: any) {
      console.error('[Clerk Password Reset Error]:', err);

      const isAlreadySignedIn =
        err?.errors?.[0]?.message?.toLowerCase().includes('already signed in') ||
        err?.message?.toLowerCase().includes('already signed in');

      if (isAlreadySignedIn) {
        try {
          await signOut().catch(() => {});
          await signIn.create({
            strategy: 'reset_password_email_code',
            identifier: email.trim(),
          });
          setStep('verify');
          return;
        } catch (retryErr: any) {
          const retryMessage =
            retryErr?.errors?.[0]?.longMessage ||
            retryErr?.errors?.[0]?.message ||
            retryErr?.message ||
            'Please sign out first, then try resetting your password.';
          setErrorMsg(retryMessage);
          return;
        }
      }

      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to send verification code. Please check your email address.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend Code Handler ──
  const handleResendCode = async () => {
    if (!isLoaded || !signIn || !email) return;
    setIsLoading(true);
    setErrorMsg('');
    setResendStatus('');
    try {
      if (isSignedIn) {
        await signOut().catch(() => {});
      }
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setResendStatus('A fresh 6-digit verification code has been sent to your inbox.');
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: User enters OTP code + New Password -> Clerk verifies & updates ──
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    if (!isLoaded || !signIn) {
      setErrorMsg('Authentication service is initializing. Please wait a moment.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });

      if (result.status === 'complete') {
        // 1. Activate Clerk session
        if (setActive && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        // 2. Synchronize password to Supabase PostgreSQL in background for Chrome extension
        fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        }).catch((e) => console.warn('[Supabase Sync Warning]:', e));

        setStep('success');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2200);
      } else {
        console.warn('[Clerk Result Incomplete]:', result);
        setErrorMsg('Verification could not be completed. Please check your code and try again.');
      }
    } catch (err: any) {
      console.error('[Clerk Verification Error]:', err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid or expired verification code.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
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
            {step === 'request'
              ? 'Reset your password'
              : step === 'verify'
              ? 'Enter verification code'
              : 'Password Updated'}
          </h1>
          <p className="text-xs text-zinc-400">
            {step === 'request'
              ? 'Enter your work email and Clerk will send a 6-digit verification code.'
              : step === 'verify'
              ? `We sent a 6-digit code to ${email}. Check your inbox to continue.`
              : 'Your new password is saved. Redirecting to workspace dashboard...'}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isSignedIn && (
            <div className="p-3 mb-4 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-xs text-zinc-300 flex items-center justify-between gap-2">
              <span>
                Active session detected{currentClerkUser?.primaryEmailAddress?.emailAddress ? ` (${currentClerkUser.primaryEmailAddress.emailAddress})` : ''}.
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* ── STEP 1: REQUEST OTP CODE ── */}
          {step === 'request' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Registered Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@agency.com"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clerk Verified Delivery
                </span>
                <span>Instant 6-Digit OTP</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                <span>{isLoading ? 'Sending verification code...' : 'Send 6-Digit Code'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: VERIFY OTP CODE & SET NEW PASSWORD ── */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              {/* 6-Digit Verification Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300 block">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend code</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={10}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 tracking-widest font-mono text-center focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* New Password */}
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
                    placeholder="At least 8 characters"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
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
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                <span>{isLoading ? 'Verifying & updating...' : 'Reset Password & Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change email address</span>
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: SUCCESS ── */}
          {step === 'success' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/80 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">Password Reset Successful!</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your credentials have been securely updated. You are now being signed in to your Memoreply workspace.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  <span>Go to Workspace Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
