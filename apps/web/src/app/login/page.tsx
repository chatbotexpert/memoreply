'use client';

import React from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { ShieldCheck, Sparkles, Download, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-gradient-to-b from-emerald-500/10 via-zinc-900/10 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-[10%] right-[15%] w-[320px] h-[280px] bg-cyan-950/15 blur-[120px] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Memoreply"
              className="w-10 h-10 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                Memoreply
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase block mt-0.5">
                Agency & Workspace Cloud
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            Sign In to Workspace
          </h1>
          <p className="text-xs text-zinc-400">
            Access client memory, conversation ledgers, and license seats
          </p>
        </div>

        {/* Clerk Sign-In Component */}
        <div className="flex justify-center w-full">
          <SignIn
            routing="hash"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#10b981',
                colorBackground: '#18181b',
                colorForeground: '#f4f4f5',
                colorMutedForeground: '#a1a1aa',
              },
              elements: {
                rootBox: 'w-full shadow-2xl',
                card: 'bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl rounded-2xl w-full p-6',
                headerTitle: 'text-zinc-100 font-bold text-lg',
                headerSubtitle: 'text-zinc-400 text-xs',
                socialButtonsBlockButton:
                  'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-100 text-sm font-medium transition-colors',
                socialButtonsBlockButtonText: 'text-zinc-100 font-medium',
                dividerLine: 'bg-zinc-800',
                dividerText: 'text-zinc-500 text-xs uppercase',
                formFieldLabel: 'text-zinc-300 text-xs font-semibold',
                formFieldInput:
                  'bg-zinc-950 border-zinc-800 text-zinc-100 text-sm rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
                formButtonPrimary:
                  'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold py-2.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all',
                footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold',
                identityPreviewText: 'text-zinc-200',
                identityPreviewEditButtonIcon: 'text-emerald-400',
              },
            }}
          />
        </div>

        {/* Public Extension Download Callout */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 text-center backdrop-blur-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-zinc-200">Just need the Chrome Extension?</p>
              <p className="text-[11px] text-zinc-400">Download directly without signing in</p>
            </div>
          </div>
          <a
            href="/api/download"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            Download ZIP
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Clerk & Supabase Secured
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Zero-Cloud Local Privacy
          </span>
        </div>
      </div>
    </div>
  );
}
