'use client';

import React, { useState } from 'react';
import {
  Key,
  Shield,
  Database,
  Download,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('memo_live_9f82d1b68536c045968186fcb699');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Seller Profile state
  const [businessName, setBusinessName] = useState('HashTurn Digital');
  const [roleTitle, setRoleTitle] = useState('Senior Full-Stack Engineer & Extension Specialist');
  const [pricingPolicy, setPricingPolicy] = useState('Minimum order $100. Standard rate $40/hr. Milestones for projects >$500.');
  const [revisionPolicy, setRevisionPolicy] = useState('2 rounds of revisions included. Bug fixes are always free.');
  const [communicationRules, setCommunicationRules] = useState(
    'Never share external contact info. Request Figma/wireframes before quoting. Emphasize fast delivery.'
  );

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const handleSaveGuidelines = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Business guidelines and policies saved to cloud. Extension will replicate on next sync.');
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
          Cloud & Workspace Settings
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Configure API keys, extension sync pairing, database endpoints, and global seller guidelines.
        </p>
      </div>

      {/* Section 1: Extension Pairing Token & Gateway */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Extension Cloud Gateway Pairing
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authenticate your Chrome extension to push conversations directly to this cloud dashboard.
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            Active Pairing
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Cloud API Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300"
              />
              <button
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Paste this token in your Chrome extension settings under Cloud Sync Gateway.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Sync Endpoint URL
            </label>
            <input
              type="text"
              readOnly
              value="https://memoreply-api.hashturn.com/api/sync"
              className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Global Seller Policies */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Global Seller Knowledge Base
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rules and guidelines configured here are referenced by smart reply composers.
            </p>
          </div>
          <button
            onClick={handleSaveGuidelines}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Guidelines'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Business / Agency Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Professional Role
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Pricing Scope & Minimum Budget Policy
            </label>
            <textarea
              rows={2}
              value={pricingPolicy}
              onChange={(e) => setPricingPolicy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Revision & Deliverables Policy
            </label>
            <textarea
              rows={2}
              value={revisionPolicy}
              onChange={(e) => setRevisionPolicy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Communication Boundaries
            </label>
            <textarea
              rows={2}
              value={communicationRules}
              onChange={(e) => setCommunicationRules(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Danger Zone */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200/80 dark:border-rose-900/40 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            Danger Zone: Purge Cloud Ledger
          </h3>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300/80 leading-relaxed">
          Completely erase all cloud-synced conversations, client records, and memory facts from the PostgreSQL database. This action does NOT affect your local browser IndexedDB copy.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you strictly sure you want to purge all cloud records?')) {
              alert('Cloud ledger reset.');
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
        >
          Purge Cloud Records
        </button>
      </div>
    </div>
  );
}
