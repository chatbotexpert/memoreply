'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type PlatformFilter = 'all' | 'fiverr' | 'upwork' | 'linkedin';

export interface WorkspaceOption {
  id: string;
  name: string;
  platform: PlatformFilter;
  status: 'active' | 'syncing' | 'connected';
  badge: string;
  description: string;
  dotColor: string;
}

export const WORKSPACES: WorkspaceOption[] = [
  {
    id: 'fiverr-prod',
    name: 'Fiverr Production',
    platform: 'fiverr',
    status: 'active',
    badge: 'Primary',
    description: 'Inbox & Orders Mirror',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'upwork-main',
    name: 'Upwork Workroom',
    platform: 'upwork',
    status: 'active',
    badge: 'Live Sync',
    description: 'Workrooms & Proposals Ledger',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'linkedin-main',
    name: 'LinkedIn Messaging',
    platform: 'linkedin',
    status: 'active',
    badge: 'Live Sync',
    description: 'Direct Threads & InMail',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'all-marketplaces',
    name: 'Unified Workspace (All)',
    platform: 'all',
    status: 'connected',
    badge: 'Enterprise',
    description: 'Cross-Platform Aggregate',
    dotColor: 'bg-indigo-500',
  },
];

interface WorkspaceContextType {
  activeWorkspace: WorkspaceOption;
  activePlatform: PlatformFilter;
  setWorkspace: (ws: WorkspaceOption) => void;
  setPlatform: (platform: PlatformFilter) => void;
  workspaces: WorkspaceOption[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceOption>(WORKSPACES[0]);

  // Load saved workspace on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('memoreply_active_workspace');
      if (savedId) {
        const found = WORKSPACES.find((w) => w.id === savedId);
        if (found) {
          setActiveWorkspace(found);
          return;
        }
      }
      const savedPlatform = localStorage.getItem('memoreply_active_platform') as PlatformFilter;
      if (savedPlatform) {
        const foundByPlatform = WORKSPACES.find((w) => w.platform === savedPlatform);
        if (foundByPlatform) {
          setActiveWorkspace(foundByPlatform);
        }
      }
    } catch {}
  }, []);

  const handleSetWorkspace = (ws: WorkspaceOption) => {
    setActiveWorkspace(ws);
    try {
      localStorage.setItem('memoreply_active_workspace', ws.id);
      localStorage.setItem('memoreply_active_platform', ws.platform);
    } catch {}
  };

  const handleSetPlatform = (platform: PlatformFilter) => {
    const found = WORKSPACES.find((w) => w.platform === platform) || WORKSPACES[0];
    handleSetWorkspace(found);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        activePlatform: activeWorkspace.platform,
        setWorkspace: handleSetWorkspace,
        setPlatform: handleSetPlatform,
        workspaces: WORKSPACES,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
