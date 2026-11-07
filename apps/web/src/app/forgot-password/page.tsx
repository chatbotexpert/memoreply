'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [directResetUrl, setDirectResetUrl] = useState('');
  const [clerkMagicUrl, setClerkMagicUrl] = useState('');
  const [isSandboxRestricted, setIsSandboxRestricted] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDirectResetUrl('');
    setClerkMagicUrl('');
    setIsSandboxRestricted(false);
    setIsDelivered(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch password recovery email.');
      }

      setSuccessMsg(
        data.message ||
          'A secure password reset link has been dispatched to your email.'
      );
      if (data.resetUrl) {
        setDirectResetUrl(data.resetUrl);
      }
      if (data.clerkMagicUrl) {
        setClerkMagicUrl(data.clerkMagicUrl);
      }
      if (data.isSandboxRestricted && !data.emailDispatchedViaSupabase) {
        setIsSandboxRestricted(true);
      }
      setIsDelivered(Boolean(data.delivered));
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
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
            Reset your password
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your work email address and we will dispatch a secure recovery link via Resend.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {successMsg ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/80 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  {isDelivered ? 'Recovery Email Dispatched' : 'Password Reset Ready'}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{successMsg}</p>
              </div>

              {/* Direct Access Fallback Button */}
              {directResetUrl && (
                <div className="space-y-2 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300">
                      Direct Password Reset Link
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    You can set your new password immediately by clicking the button below:
                  </p>
                  <a
                    href={directResetUrl}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Open Reset Password Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Clerk Magic Link Button */}
              {clerkMagicUrl && (
                <div className="space-y-2 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">
                      Clerk 1-Click Access Ticket
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-mono">
                      Clerk Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Account detected in Clerk. You can sign in immediately with one click:
                  </p>
                  <a
                    href={clerkMagicUrl}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Instant Clerk Magic Sign-In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Resend Sandbox Notice */}
              {isSandboxRestricted && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-300/90 text-left space-y-1">
                  <div className="font-semibold text-amber-200">Resend Sandbox Limitation</div>
                  <div>
                    Resend free test domain (<code>onboarding@resend.dev</code>) only delivers to{' '}
                    <strong>memoreplyext@gmail.com</strong> until a domain (e.g. <code>memoreply.com</code>) is verified on resend.com. Use the direct link above to reset your password now.
                  </div>
                </div>
              )}

              {/* Clerk Alternative */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 text-left space-y-1.5">
                <div className="font-medium text-zinc-300">Signed up via Clerk or Google?</div>
                <div>
                  You can also get an instant 6-digit verification code directly on the Sign-In page by clicking &quot;Forgot password?&quot; inside Clerk.
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] pt-0.5"
                >
                  <span>Go to Clerk Sign-In</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email Field */}
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
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SSL 256-bit Encrypted
                </span>
                <span>Powered by Resend</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                <span>{isLoading ? 'Dispatching via Resend...' : 'Send Password Reset Link'}</span>
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
        </div>
      </div>
    </div>
  );
}

