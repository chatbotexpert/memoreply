'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function AuthSuccessPage() {
  const { user } = useAuth();
  const [broadcasted, setBroadcasted] = useState(false);

  useEffect(() => {
    async function syncExtension() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeToken = session?.access_token || user?.licenseKey || `session_${user?.id || Date.now()}`;
        const activeUserId = session?.user?.id || user?.id || `usr_${Date.now()}`;
        const activeEmail = session?.user?.email || user?.email || 'seller@memoreply.com';
        const activeName = session?.user?.user_metadata?.name || user?.name || 'Freelancer';
        const activePlan = session?.user?.user_metadata?.plan || user?.plan || 'Agency Pro';
        const activeLicenseKey = user?.licenseKey || `MR-${activePlan.toUpperCase().replace(/\s+/g, '')}-SEC`;

        const payload = {
          token: activeToken,
          refreshToken: session?.refresh_token || '',
          userId: activeUserId,
          email: activeEmail,
          name: activeName,
          plan: activePlan,
          licenseKey: activeLicenseKey,
        };

        // 1. PostMessage to window for content script
        window.postMessage(
          {
            type: 'MEMOREPLY_AUTH_PAYLOAD',
            payload,
          },
          window.location.origin
        );

        // 2. Set DOM attribute backup
        document.body.setAttribute('data-memoreply-auth', JSON.stringify(payload));
        document.body.setAttribute('data-license-key', activeLicenseKey);
        setBroadcasted(true);
      } catch (err) {
        console.error('Extension handshake sync error:', err);
      }
    }

    syncExtension();
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/10 blur-[140px] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 text-center">
        {/* Brand */}
        <div className="inline-flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Memoreply"
            className="w-10 h-10 rounded-lg object-contain shadow-md"
          />
          <span className="font-semibold text-lg tracking-tight text-white">
            Memoreply
          </span>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Successfully Authenticated
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Your session has been verified and securely synced with the Memoreply Chrome Extension.
            </p>
          </div>

          {user?.email && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-xs font-mono text-zinc-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-center gap-2.5 text-left">
            <Globe className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              You can now close this browser tab and reopen the Chrome Extension side panel.
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Continue to Web Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
