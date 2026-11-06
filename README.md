# Memoreply — AI Client Memory & Reply Assistant

> **Tagline:** AI replies that remember across devices.  
> **Developed by:** HashTurn  
> **Target Platforms:** Google Chrome (Manifest V3) • Next.js Cloud Dashboard • Fiverr • Upwork • LinkedIn Messaging  
> **Architecture:** Chrome Extension (React 19 + TypeScript + Vite) + Cloud Backend (Next.js 16 + Prisma + Supabase PostgreSQL + Google Drive)

---

## 📑 Table of Contents
1. [Architectural Overview](#-architectural-overview)
2. [Supabase PostgreSQL Cloud Synchronization](#-supabase-postgresql-cloud-synchronization)
3. [Google Drive Storage Optimization](#-google-drive-storage-optimization)
4. [Platform Safety & Anti-Bot Guardrails (Fiverr & LinkedIn)](#-platform-safety--anti-bot-guardrails)
5. [Interactive Button Reference & Working Mechanisms](#-interactive-button-reference--working-mechanisms)
6. [Authentication, Sessions & Logout Flow](#-authentication-sessions--logout-flow)
7. [Repository Structure](#-repository-structure)
8. [Installation & Development Guide](#-installation--development-guide)
9. [Privacy & Compliance](#-privacy--compliance)

---

## 🏛️ Architectural Overview

Memoreply is a multi-tier workspace designed for freelancers, agency owners, and client-facing professionals. It bridges real-time messaging on freelance platforms with persistent, cross-device client memory and context-grounded AI reply generation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Chrome Extension (Manifest V3)                       │
│  - React 19 UI (Side Panel / Popup)                                    │
│  - Platform Content Scripts (Fiverr, Upwork, LinkedIn)                 │
│  - Local Dexie IndexedDB (Offline cache & low-latency search)          │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │                               │
        Real-time API Sync              Google Drive Upload
        (POST /api/sync)             (POST /api/upload/drive)
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                  Next.js 16 Cloud Web Dashboard                        │
│  - Edge / Node REST API Gateways                                       │
│  - Prisma ORM Layer                                                    │
│  - Clerk Authentication & Web Session Bridge                           │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │                               │
       PostgreSQL Database               Cloud File Storage
  (Supabase Managed Postgres)         (Google Drive REST API)
  - Users, Clients, Conversations     - Documents, PDFs, Images, Media
  - Full Message History Streams      - Secure View & Download URLs Only
  - Structured Memory Facts
```

### Core Design Highlights:
- **Dual Storage Strategy:** Fast local IndexedDB (`Dexie`) provides zero-latency rendering and offline readiness in the browser, while **Supabase PostgreSQL** serves as the authoritative cloud source of truth across all devices.
- **Zero Binary DB Bloat:** Large documents, screenshots, and image attachments are routed directly to **Google Drive**; only verified reference URLs and metadata are stored in PostgreSQL.
- **Anti-Bot & Anti-Ban Strict Compliance:** Dedicated platform adapters enforce read-only passive extraction on LinkedIn and safe draft placement without automated keystroke storms or auto-submitting.

---

## 🗄️ Supabase PostgreSQL Cloud Synchronization

Memoreply synchronizes client profiles, complete conversation streams, and extracted memory facts directly to a managed **Supabase PostgreSQL** database.

### 1. Database Schema (`apps/web/prisma/schema.prisma`)
The PostgreSQL schema enforces strict multi-tenant isolation per freelancer (`userId`):

- **`User` (`users`):** Tenant account, subscription tier (`FREE`, `PRO`, `ENTERPRISE`), reply quota, and API tokens.
- **`Client` (`clients`):** Isolated per user. Uniquely keyed by `@@unique([userId, platform, platformUserId])`. Two different freelancers can interact with the same client handle without collision or leakage.
- **`Conversation` (`conversations`):** Tracks threads, status (`ACTIVE`, `COMPLETED`), URLs, and extracted client emails.
- **`Message` (`messages`):** Persists full message bodies, roles (`CLIENT`, `SELLER`, `SYSTEM`), timestamps, and Google Drive attachment references.
  - **Deterministic Deduplication:** Uniquely constrained by `@@unique([conversationId, deduplicationHash])`. Deduplication hashes are computed via SHA-256 (`${convId}_${role}_${timestamp}_${text}`) to eliminate duplicate rows on sync re-triggers.
- **`FileAttachment` (`file_attachments`):** Stores metadata (`fileName`, `fileSize`, `mimeType`, `driveFileId`, `driveViewUrl`) for heavy attachments hosted in Google Drive.
- **`ClientFact` (`client_facts`):** Category-tagged facts (`BUDGET`, `TIMELINE`, `SCOPE`, `TECH_STACK`) with contradiction flags (`PROPOSED`, `CONFIRMED`, `DISPUTED`).
- **`SellerKnowledge` (`seller_knowledge`):** Business identity, service catalogue, pricing terms, and communication hours.

### 2. Synchronization Lifecycle (`src/sync/cloudSync.ts`)
1. **Extraction:** The content script extracts visible messages and client metadata from the active chat room.
2. **Payload Construction:** Assembles conversation data, full message history, extracted facts, and seller knowledge.
3. **Transmission:** Dispatches HTTP `POST` to `/api/sync` authenticated via Bearer token.
4. **Offline Resilience:** If network connectivity is lost, payloads are queued locally in `chrome.storage.local` (`memoreply_offline_sync_queue`). When the browser's `online` event fires, the queue automatically flushes with exponential retry protection.
5. **Cross-Device Restoration:** On new device sign-ins, `fetchConversationsFromCloud()` restores historical conversation threads directly from PostgreSQL into the active UI.

---

## ☁️ Google Drive Storage Optimization

Storing raw binary files, high-resolution screenshots, or large PDF specification sheets directly inside PostgreSQL leads to database bloat, expensive egress, and slowed query performance. Memoreply solves this using Google Drive.

```
[Client / Extension]
        │
        ▼ (Document / PDF / Screenshot Upload)
[Next.js API: /api/upload/drive]
        │
        ├──► Upload binary to Google Drive (REST v3 API)
        │    - Multipart / Related Upload
        │    - Generates Drive File ID & Secure View Link
        │
        └──► Persist ONLY Reference to Supabase PostgreSQL
             - attachmentUrl: "https://drive.google.com/file/d/..."
             - driveFileId: "1AbC2dEfG3hIjK..."
             - fileName, fileSize, mimeType
```

### Architecture Features:
- **Zero Binary Bloat in DB:** PostgreSQL stores only strings (file ID and secure view URL).
- **Service Account & OAuth Compatible:** [`apps/web/src/lib/googleDrive.ts`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/lib/googleDrive.ts) supports standard Google Service Account credentials (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`) with automated JWT signing.
- **Resilient Fallback Mode:** In development or environments where Google Cloud credentials are not yet configured, the system generates validated secure reference URLs so database writes and dashboard rendering never break or throw unhandled exceptions.
- **Interactive UI Integration:** The cloud dashboard ([`apps/web/src/app/conversations/page.tsx`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/app/conversations/page.tsx)) renders clickable Google Drive attachment badges directly alongside chat bubbles.

---

## 🛡️ Platform Safety & Anti-Bot Guardrails

Freelance and social platforms employ sophisticated automated bot detection telemetry. Memoreply enforces platform-specific security policies:

### 1. LinkedIn Anti-Bot Safety Guardrails
LinkedIn has one of the strictest anti-bot inspection engines on the web, monitoring DOM tree mutations, synthetic event dispatching, and rapid automated background typing.

Memoreply enforces **Strict Safe Mode** on LinkedIn:
- **100% Passive / Read-Only Operation:** The extension never runs automated background scrapers, continuous `MutationObserver` loops, or `setInterval` polls on LinkedIn. Chat reading occurs **strictly upon manual user request**.
- **Zero DOM Injections:** The floating widget ([`FloatingWidget.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/ui/FloatingWidget.ts)) is completely disabled and blocked from mounting inside the LinkedIn DOM.
- **Isolated UI Panel:** Generated replies and client memory facts remain strictly inside the extension's isolated popup / side panel, never leaking into LinkedIn's execution scope.
- **Safe Insertion & Clipboard Fallback:**
  - **Primary Workflow:** 1-Click **"Copy to Clipboard"** allows the user to paste manually with `Ctrl+V` (`Cmd+V`), which is 100% undetectable by anti-bot telemetry.
  - **Secondary Workflow:** A controlled **"Safely Insert"** button focuses the composer and uses native `document.execCommand('insertText')` without synthetic keydown storms. If blocked, it immediately triggers the clipboard fallback.

### 2. Fiverr & Upwork Guardrails
- **Zero Auto-Sending:** Memoreply strictly inserts draft responses into the composer for manual review. It **never** auto-clicks the "Send" button.
- **ToS Policy Prompt Filters:** The context assembler ([`src/ai/contextAssembler.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/ai/contextAssembler.ts)) injects guardrail system instructions preventing the AI from sharing off-platform contact details (email, phone, Telegram), ensuring full Fiverr Terms of Service compliance.

---

## 🔘 Interactive Button Reference & Working Mechanisms

The following table provides a breakdown of all core buttons, their context, purpose, and exact working mechanisms:

| Button Label | Location & Context | Purpose | Detailed Working Mechanism | Safety & Anti-Bot Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`↻ Read Chat`** | Platform status bar when active on **LinkedIn** | Manually triggers reading of the active LinkedIn messaging thread. | Dispatches `chrome.tabs.sendMessage({ type: 'EXTRACT_CONVERSATION' })` to the active tab. The LinkedIn adapter inspects visible DOM elements, parses messages, computes deterministic deduplication IDs, and saves to local storage & cloud database. | **100% Passive.** Runs once per user click. Zero background intervals, zero continuous DOM mutation watching. |
| **`↻ Refresh`** | Platform status bar when active on **Fiverr** or **Upwork** | Rescans the active conversation room to capture newly received messages. | Sends `EXTRACT_CONVERSATION` to the content script. Parses messages, extracts client facts, synchronizes changes to IndexedDB, and queues a payload push to Supabase PostgreSQL. | Respects debounced limits to avoid aggressive re-scraping of the page. |
| **`📋 Copy to Clipboard (Recommended)`** | Reply generation card when on **LinkedIn** | Copies the generated response to the OS clipboard for manual pasting into LinkedIn. | Invokes `navigator.clipboard.writeText(draftText)`. Displays a green confirmation toast: *"Copied to clipboard! Ready to paste into LinkedIn (Ctrl+V)."* | **Safest Anti-Bot Method.** Completely bypasses page scripting and DOM event listeners. |
| **`Copy Text`** | Reply generation card when on **Fiverr** / **Upwork** | Copies the generated reply for external use or manual pasting. | Copies current draft text from the state into the system clipboard via standard browser clipboard APIs. | Safe, client-side only. |
| **`Insert into Fiverr`** / **`Insert into Chat`** | Reply generation card on Fiverr / Upwork | Places the generated reply directly into the active platform's message composer. | Queries the active tab, locates the composer (`textarea` or `contenteditable`), sets the text value using prototype property descriptors or `execCommand`, dispatches synthetic `input` and `change` events, and scrolls composer into view. | **Never auto-submits.** Leaves message in draft state for user review and approval. |
| **`Safely Insert`** | Reply generation card on LinkedIn | Controlled text placement into LinkedIn message composer. | Sends `INSERT_DRAFT` message to `linkedinAdapter.ts`. Selects target container `div.msg-form__contenteditable`, sets text via standard Selection API without rapid key simulation. If blocked, automatically copies text to clipboard as fallback. | Non-destructive. Falls back to clipboard if any insertion anomaly is detected. |
| **`Logout`** | Top navigation bar (Header) | Completely signs out user, purges credentials, and resets extension auth gate. | Purges all session keys from `chrome.storage.local` (`memoreply_auth_session`, `memoreply_license_status`, `memoreply_license_key`, `memoreply_user`, `memoreply_token`). Sets `memoreply_logged_out: true`. Broadcasts `AUTH_LOGOUT` message across all open tabs to clear web `localStorage` and prevent refresh revivals. | Resets memory state, unmounts session, and redirects extension to the Mandatory Auth Gate. |
| **`Generate Reply`** | Chat & Reply tab | Generates context-grounded response using configured AI model. | Gathers conversation history, client memory facts, seller knowledge profile, and selected tone. Calls OpenAI API or local engine, streams response into editor card. | Deduplicates context and excludes disputed facts. |
| **`Clear`** | Inline reply editor card | Clears editor contents and variants. | Resets `draftText` and `variants` array to empty state. | Local React state reset only. |

---

## 🔐 Authentication, Sessions & Logout Flow

Memoreply implements a dual authentication bridge connecting Clerk, Supabase Auth, and the Chrome Extension:

```
[Web App (Next.js)] ◄────── User logs in via Clerk / Supabase ──────► [Extension Bridge]
        │                                                                    │
   localStorage                                                      chrome.storage.local
  - memoreply_auth_user                                              - memoreply_auth_session
  - data-memoreply-auth                                              - memoreply_license_status
        │                                                                    │
        ▼ (User clicks Logout)                                               ▼ (User clicks Logout)
  - localStorage purged                                              - chrome.storage.local purged
  - memoreply_logged_out: true                                       - memoreply_logged_out: true
  - PostMessage: MEMOREPLY_AUTH_LOGOUT                               - chrome.tabs.sendMessage: AUTH_LOGOUT
```

### Complete Session Purging Implementation:
1. **Explicit Logout Flag:** When logging out from either the extension or the web app, an explicit flag `memoreply_logged_out = 'true'` is written to both `localStorage` and `chrome.storage.local`.
2. **Page Refresh Protection:** During page reload, `AuthContext.tsx` and `src/content.ts` check for `memoreply_logged_out`. If present, all automatic restoration routines abort immediately, preventing stale default or dummy accounts from resurrecting the session.
3. **Cross-Tab Bidirectional Purge:**
   - Logging out in the extension broadcasts `AUTH_LOGOUT` to all open browser tabs, wiping residual data from `memoreply.com` or `localhost`.
   - Logging out on the web app posts `MEMOREPLY_AUTH_LOGOUT`, which the extension content script receives to purge `chrome.storage.local`.
4. **Clean Login Re-activation:** Fresh login or manual license key entry explicitly clears the `memoreply_logged_out` flag, restoring normal sync operations.

---

## 📁 Repository Structure

```
memoreply/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── vite.config.ts             # Vite build & CRXJS packaging pipeline
├── package.json               # Root scripts (build, test, lint)
├── PRIVACY.md                 # Public privacy policy & zero-cloud terms
├── README.md                  # This documentation file
│
├── src/                       # Chrome Extension Source Code (React 19 + TypeScript)
│   ├── main.tsx               # Extension entry point
│   ├── App.tsx                # Main extension interface & multi-tab UI
│   ├── background.ts          # Service worker (tab tracking & message bus)
│   ├── content.ts             # Content script (platform extraction & bridge)
│   ├── types.ts               # Shared TypeScript models and messages
│   ├── adapters/              # Platform-specific scraping & insertion
│   │   ├── index.ts           # Adapter router
│   │   ├── types.ts           # PlatformAdapter interface
│   │   ├── fiverrAdapter.ts   # Fiverr inbox & order scraper
│   │   ├── upworkAdapter.ts   # Upwork room scraper
│   │   └── linkedinAdapter.ts # LinkedIn Messaging adapter (Strict Safe Mode)
│   ├── ai/                    # Context retrieval & AI prompt assembly
│   │   ├── contextAssembler.ts# ToS-compliant context builder
│   │   └── directEngine.ts    # OpenAI / Local AI proxy provider
│   ├── db/                    # Local IndexedDB storage (Dexie)
│   │   ├── index.ts           # Schema: clients, conversations, messages, facts
│   │   └── repository.ts      # Repository functions & CRUD
│   ├── sync/
│   │   └── cloudSync.ts       # Supabase Cloud sync & offline queue manager
│   ├── ui/
│   │   └── FloatingWidget.ts  # Shadow DOM floating helper (Fiverr/Upwork only)
│   └── utils/
│       ├── deduplication.ts   # SHA-256 deterministic message hashing
│       └── licenseManager.ts  # License check & free tier limit gates
│
└── apps/web/                  # Cloud Dashboard & Backend (Next.js 16 + Prisma)
    ├── package.json           # Web dependencies (@clerk/nextjs, prisma, etc.)
    ├── prisma/
    │   └── schema.prisma      # PostgreSQL schema for Supabase
    ├── private/
    │   └── memoreply-extension-v0.1.1.zip # Compiled distribution archive
    └── src/
        ├── app/               # Next.js App Router
        │   ├── api/sync/      # Core extension synchronization gateway
        │   ├── api/upload/    # Google Drive document & media upload route
        │   ├── api/conversations/ # Cross-device thread fetching endpoint
        │   ├── dashboard/     # SaaS client & memory overview
        │   └── conversations/ # Live transcript viewer with Drive attachments
        ├── context/           # AuthContext (Clerk + Supabase Auth)
        └── lib/
            ├── dataService.ts # Prisma live PostgreSQL queries & caching
            ├── googleDrive.ts # Google Drive REST API integration
            ├── prisma.ts      # Prisma client singleton
            └── supabase.ts    # Supabase JS SDK client
```

---

## 🚀 Installation & Development Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Google Chrome:** Version 116+ (Manifest V3 Side Panel API support)

### 2. Environment Configuration
Create a `.env` file in the root and in `apps/web/.env`:

```env
# Supabase PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase API Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# Google Drive API (Optional - uses mock reference fallback if omitted)
GOOGLE_DRIVE_CLIENT_EMAIL="memoreply-drive-sync@[PROJECT].iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="[DRIVE_FOLDER_ID]"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Build Commands
```bash
# Install root and web dependencies
npm install
npm install --prefix apps/web

# Generate Prisma Client & Sync Database
cd apps/web
npx prisma generate
npx prisma db push
cd ../..

# Build Chrome Extension (Manifest V3)
npm run build

# Build Next.js Cloud Dashboard
npm run build:web
```

### 4. Load Extension in Chrome
1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `dist/` directory inside this repository.
4. Pin the **Memoreply** extension to your toolbar.

---

## 📄 Privacy & Compliance

- **Multi-Tenant Isolation:** Client conversations and memory facts are strictly partitioned by tenant ID (`userId`).
- **Zero Binary Bloat:** Attachments and images are held in Google Drive; database queries remain lightweight.
- **Platform Integrity:** Memoreply enforces strict human-in-the-loop review. It never auto-sends messages, never performs rapid bot-like typing, and respects the safety rules of every supported marketplace.

---

**Developed with precision by HashTurn.** © 2026 HashTurn Digital. All rights reserved.
