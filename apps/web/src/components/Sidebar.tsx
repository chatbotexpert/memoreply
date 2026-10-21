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

import { useWorkspace, WorkspaceOption } from '@/context/WorkspaceContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const WORKSPACE_COUNTS = {
  all: { clients: 198, conversations: 558, vault: 2130 },
  fiverr: { clients: 124, conversations: 382, vault: 1420 },
  upwork: { clients: 46, conversations: 112, vault: 480 },
  linkedin: { clients: 28, conversations: 64, vault: 230 },
};

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const { activeWorkspace, setWorkspace, workspaces } = useWorkspace();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const counts = WORKSPACE_COUNTS[activeWorkspace.platform] || WORKSPACE_COUNTS.all;

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Clients', href: '/clients', icon: Users, count: counts.clients },
    { label: 'Conversations', href: '/conversations', icon: MessageSquare, count: counts.conversations },
    { label: 'Context Vault', href: '/context-vault', icon: Database, count: counts.vault },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Close dropdown on outside click or escape
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectWorkspace = (ws: WorkspaceOption) => {
    setWorkspace(ws);
    setIsOpen(false);
  };

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
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

        {/* Workspace Switcher Dropdown */}
        <div className="px-3 py-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className={`w-full px-2.5 py-1.5 rounded-md border text-left transition-all shadow-2xs flex items-center justify-between cursor-pointer ${
              isOpen
                ? 'border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-850 ring-2 ring-zinc-400/20 dark:ring-zinc-600/20'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ${activeWorkspace.dotColor} shrink-0`} />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {activeWorkspace.name}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
              }`}
            />
          </button>

          {/* Interactive Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-[calc(100%-4px)] left-3 right-3 z-50 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                Connected Workspaces
              </div>

              <div className="space-y-0.5 px-1 max-h-64 overflow-y-auto">
                {workspaces.map((ws) => {
                  const isSelected = activeWorkspace.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWorkspace(ws)}
                      className={`w-full px-2 py-2 rounded-md text-left flex items-start justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${ws.dotColor} mt-1 shrink-0`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs truncate">{ws.name}</span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {ws.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                            {ws.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-emerald-500 font-bold shrink-0 ml-1 text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Action */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1 px-1">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-[11px] transition-colors"
                >
                  <span>Connect / Manage Workspaces</span>
                  <span className="text-[10px] font-mono text-zinc-400">Settings →</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="px-2 pt-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Platform Views
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
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
