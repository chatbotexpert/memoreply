'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Database,
  Settings,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users, count: 124 },
  { label: 'Conversations', href: '/conversations', icon: MessageSquare, count: 382 },
  { label: 'Context Vault', href: '/memory', icon: Database, count: 1420 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Top Section */}
      <div>
        {/* Workspace Brand Header */}
        <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center tracking-tight shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Memoreply
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Cloud
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-tight">Enterprise Sync</p>
            </div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-3 py-3">
          <button className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between text-left hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                Fiverr Production
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-2 pt-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Platform Views
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-zinc-300/80 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* Sync Status Pill */}
        <div className="px-2.5 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Cloud Gateway</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">v2.0</span>
        </div>

        {/* User Account Item */}
        <div className="flex items-center gap-2.5 px-1.5">
          <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            H
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              HashTurn Seller
            </p>
            <p className="text-[11px] text-zinc-500 truncate font-mono">seller@hashturn.com</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
