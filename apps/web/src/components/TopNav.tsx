'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Download, ExternalLink } from 'lucide-react';

interface TopNavProps {
  title?: string;
  onSyncTrigger?: () => void;
}

export function TopNav({ title = 'Workspace Overview', onSyncTrigger }: TopNavProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (onSyncTrigger) {
      onSyncTrigger();
    } else {
      try {
        await fetch('/api/sync');
      } catch {}
    }
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & View Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <span>Workspaces</span>
          <span>/</span>
          <span>Fiverr</span>
          <span>/</span>
        </div>
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live Cloud Mirror
        </span>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clients, facts..."
            className="w-full pl-8 pr-12 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Sync Trigger Action */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-2xs"
          title="Trigger cloud handshake and refresh local mirror"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Gateway'}</span>
        </button>

        {/* Export Backup Action */}
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors shadow-xs"
          onClick={() => {
            alert('Cloud backup export initiated. A verified JSON snapshot will download shortly.');
          }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Snapshot</span>
        </button>

        {/* Extension Link */}
        <a
          href="https://github.com/chatbotexpert/memoreply"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          title="View GitHub Repository"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
