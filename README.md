# Memoreply — Cloud-Synchronized AI Client Memory & Reply Assistant

> **Tagline:** AI replies that remember across devices — engineered for elite freelancers, agencies, and client managers.  
> **Supported Messaging Platforms:** Fiverr Inbox & Order Chat • Upwork Room Messaging • LinkedIn Messaging  
> **Core Architecture:** Chrome Extension Manifest V3 (React 19, TypeScript, Vite) + Cloud Backend (Next.js 16, Prisma 6, Supabase PostgreSQL, Google Drive REST v3)

---

## 📑 Table of Contents
1. [Project Overview & Core Purpose](#1-project-overview--core-purpose)
2. [Complete Tech Stack & Architecture](#2-complete-tech-stack--architecture)
   - [Architectural Topology](#architectural-topology)
   - [Frontend Architecture (Extension & Side Panel)](#frontend-architecture-extension--side-panel)
   - [Backend & Database Architecture (Next.js & Supabase PostgreSQL)](#backend--database-architecture-nextjs--supabase-postgresql)
   - [Google Drive Storage Optimization (Zero DB Bloat)](#google-drive-storage-optimization-zero-db-bloat)
   - [Comprehensive Core File Breakdown](#comprehensive-core-file-breakdown)
3. [Platform Safety & Anti-Bot Guardrails](#3-platform-safety--anti-bot-guardrails)
   - [LinkedIn Strict Safe Mode (100% Anti-Bot Compliant)](#linkedin-strict-safe-mode-100-anti-bot-compliant)
   - [Fiverr & Upwork Safe Interaction & Policy Guardrails](#fiverr--upwork-safe-interaction--policy-guardrails)
4. [UI Components, Buttons & Working Mechanisms](#4-ui-components-buttons--working-mechanisms)
   - [Exhaustive Button Reference Table](#exhaustive-button-reference-table)
   - [Context Tabs & Component Workflow](#context-tabs--component-workflow)
5. [Session Management, Security & Zombie Session Prevention](#5-session-management-security--zombie-session-prevention)
   - [The Zombie Session Problem & Solution](#the-zombie-session-problem--solution)
   - [Complete Logout & Cross-Tab Broadcast Lifecycle](#complete-logout--cross-tab-broadcast-lifecycle)
   - [Dual Authentication Bridge (Clerk + Supabase Auth)](#dual-authentication-bridge-clerk--supabase-auth)
6. [Data Schema & Entity Modeling](#6-data-schema--entity-modeling)
7. [Installation, Environment & Build Guide](#7-installation-environment--build-guide)
8. [Privacy Policy & Legal Compliance](#8-privacy-policy--legal-compliance)

---

## 1. Project Overview & Core Purpose

Freelancers and digital agencies lose hours every day re-reading long chat threads on Fiverr, Upwork, and LinkedIn to recall agreed budgets, technical constraints, revision boundaries, and client communication preferences. Furthermore, switching between desktop computers, laptops, and mobile web dashboards frequently fractures this context.

**Memoreply** solves this problem by acting as an omnipresent memory layer and intelligent response assistant:

- **Seamless Client Memory:** Automatically reads incoming messages, captures crucial client facts (budgets, deliverables, timelines, preferences), flags contradictory terms, and tracks fact statuses (`Proposed`, `Confirmed`, `Disputed`).
- **Cross-Device Synchronization:** Connects local browser messaging directly with an authoritative **Supabase PostgreSQL** database, ensuring that chat threads and memory profiles are synced across all devices in real-time.
- **Storage-Optimized Attachments:** Heavy project attachments, design screenshots, documents, and PDF specifications are securely uploaded to **Google Drive**; only verified reference URLs are stored in PostgreSQL to preserve database speed and storage efficiency.
- **Platform-Safe AI Composition:** Uses contextual AI models to compose personalized, tone-specific draft responses that strictly comply with platform policies (e.g., zero off-platform contact sharing on Fiverr, zero automated typing on LinkedIn).
- **Human-in-the-Loop Review:** Never automatically sends messages. All AI drafts are reviewed in an isolated interface before one-click placement or clipboard copying.

---

## 2. Complete Tech Stack & Architecture

### Architectural Topology

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                   CHROME EXTENSION RUNTIME (Manifest V3)                       │
│                                                                                │
│   ┌────────────────────────┐                    ┌──────────────────────────┐   │
│   │   App.tsx (UI Panel)   │                    │ content.ts (Page Bridge) │   │
│   │ - React 19 / Vite      │                    │ - DOM Scrapers           │   │
│   │ - State & Memory Mgmt  │                    │ - Isolated Safe Inserter │   │
│   └───────────┬────────────┘                    └────────────┬─────────────┘   │
│               │                                              │                 │
│               ├─────────────── chrome.storage.local ─────────┤                 │
│               │           (Queue, Tokens, Cache)             │                 │
│               ▼                                              ▼                 │
│   ┌────────────────────────┐                    ┌──────────────────────────┐   │
│   │  Dexie DB (Local DB)   │                    │ background.ts (Worker)   │   │
│   │ - Offline Memory Cache │                    │ - Tab Lifecycle Watcher  │   │
│   │ - Low-Latency Search   │                    │ - Action Controller      │   │
│   └────────────────────────┘                    └──────────────────────────┘   │
└───────────────────────▲──────────────────────────────────────▲─────────────────┘
                        │                                      │
          POST /api/sync (Full Stream)            POST /api/upload/drive
          GET /api/conversations (Restore)        (Multipart Media Offload)
                        │                                      │
┌───────────────────────▼──────────────────────────────────────▼─────────────────┐
│                    NEXT.JS 16 CLOUD BACKEND (App Router)                       │
│  - Turbopack Engine                                                            │
│  - Edge & Node.js API Routes (`/api/sync`, `/api/upload/drive`, etc.)           │
│  - Clerk Authentication & Web Auth Bridge                                      │
│  - Prisma 6 ORM Layer                                                          │
└───────────────────────▲──────────────────────────────────────▲─────────────────┘
                        │                                      │
             PostgreSQL Prisma Driver                 Google Drive REST API v3
                        │                                      │
┌───────────────────────▼───────────────┐      ┌───────────────▼─────────────────┐
│     SUPABASE POSTGRESQL DATABASE      │      │       GOOGLE DRIVE STORAGE      │
│  - Multi-Tenant Schema                │      │  - Project Files, Images, PDFs  │
│  - Deterministic Message Dedup        │      │  - Drive File IDs               │
│  - Facts, Memory & Tenant Profiles    │      │  - Secure Shareable View URLs   │
└───────────────────────────────────────┘      └─────────────────────────────────┘
```

### Frontend Architecture (Extension & Side Panel)
- **Framework:** React 19 with strict TypeScript typing.
- **Build Tooling:** Vite 8 powered by `@crxjs/vite-plugin` for Manifest V3 compliant bundling with Hot Module Replacement (HMR).
- **Styling:** Custom responsive design system with CSS custom properties (variables), supporting native Dark Mode and Light Mode with high-contrast accessibility.
- **Local Storage Engine:** Dexie.js (IndexedDB wrapper) managing `MemoreplyDB` for instant offline reads, fact filtering, and client caching.

### Backend & Database Architecture (Next.js & Supabase PostgreSQL)
- **Web Application:** Next.js 16 (App Router) with Turbopack compilation.
- **Database Engine:** Supabase PostgreSQL with pooled connection routing (`pgbouncer=true` on port `6543`) and direct session pooling (port `5432`) for schema migrations.
- **ORM:** Prisma 6 with accelerated queries, strict relational mapping, and native enum support.
- **Multi-Tenant Isolation:** All data records (`clients`, `conversations`, `messages`, `client_facts`) are strictly keyed by tenant `userId`. Cross-tenant data leakage is structurally impossible.
- **Deterministic Deduplication:** Messages are constrained by `@@unique([conversationId, deduplicationHash])`. Hashes are generated via SHA-256 (`${convId}_${role}_${timestamp}_${text}`) to guarantee that repeated scrapes or network retries never generate duplicate rows.

### Google Drive Storage Optimization (Zero DB Bloat)
Binary data (screenshots, attachments, project archives) creates massive database bloat and degrades indexing performance. Memoreply solves this with a dedicated Google Drive offloading gateway:

1. **Upload Initiation:** When an attachment or image is detected or attached, the extension passes the file buffer to `POST /api/upload/drive`.
2. **Drive REST Integration (`apps/web/src/lib/googleDrive.ts`):** 
   - Uses standard Google Service Account credentials (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`) with automated RSA-SHA256 JWT bearer token exchange.
   - Executes a multipart upload directly to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
   - Obtains a persistent `fileId`, `webViewLink`, and `webContentLink`.
3. **Database Reference Persistence:** Supabase PostgreSQL persists **only** the string metadata in the `FileAttachment` table and message record (`attachmentUrl`, `attachmentName`, `attachmentType`, `attachmentSize`, `driveFileId`).
4. **Resilient Mock Mode:** If Google Cloud credentials are not configured in staging/local environments, the system generates compliant reference URLs (`https://drive.google.com/file/d/gdrive_.../view`), preventing pipeline crashes.

---

### Comprehensive Core File Breakdown

| File Path | Role & Operational Mechanism |
| :--- | :--- |
| **[`src/content.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/content.ts)** | **Multi-Platform Page Script:** Injected into Fiverr, Upwork, and LinkedIn pages. Inspects the DOM to extract client usernames, avatars, and message bubbles. Enforces LinkedIn Safe Mode (disables DOM injection, skips background observers). Dispatches drafts into active composers and listens for `EXTRACT_CONVERSATION` and `INSERT_DRAFT` runtime messages. |
| **[`src/background.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/background.ts)** | **Service Worker (MV3 Event Hub):** Handles tab activation and URL navigation events. Automatically detects which marketplace the user has active and updates the extension toolbar badge and connection status. Manages long-lived communication between tabs and the UI. |
| **[`src/App.tsx`](file:///c:/Users/Hassaan/Desktop/Extention/src/App.tsx)** | **Main Extension Interface:** Houses the entire React 19 UI (Side Panel/Popup). Manages authentication gates, active conversation feeds, prompt refinement chips, tone pickers, seller knowledge configuration, client fact editing, and cloud sync triggers. |
| **[`src/sync/cloudSync.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/sync/cloudSync.ts)** | **Cloud Synchronization & Offline Queue:** Packages full message streams, extracted client memory, and seller knowledge. Sends HTTP POST requests to `/api/sync`. Manages an offline retry queue (`memoreply_offline_sync_queue`) with exponential backoff that automatically flushes when network connectivity restores. |
| **[`src/adapters/linkedinAdapter.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/adapters/linkedinAdapter.ts)** | **LinkedIn Platform Adapter:** Implements strict anti-bot guardrails for `linkedin.com/messaging`. Performs passive-only DOM scraping on user command. Features safe, non-destructive text placement using the Selection API and triggers automatic clipboard fallback if DOM access is restricted. |
| **[`src/adapters/fiverrAdapter.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/adapters/fiverrAdapter.ts)** | **Fiverr Platform Adapter:** Extracts messages and client details from Fiverr Inbox (`fiverr.com/inbox`) and Order Messaging (`fiverr.com/manage_orders`). Handles draft placement into native textarea and contenteditable inputs. |
| **[`src/adapters/upworkAdapter.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/adapters/upworkAdapter.ts)** | **Upwork Platform Adapter:** Scrapes active Upwork messaging rooms and client contact titles. Provides controlled insertion into Upwork's message composer. |
| **[`src/ui/FloatingWidget.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/ui/FloatingWidget.ts)** | **Injected Draggable Helper (Shadow DOM):** Provides on-page quick action buttons on Fiverr and Upwork. Isolated inside a closed Shadow DOM to avoid CSS bleeding. **Strictly blocked from mounting on LinkedIn.** |
| **[`src/utils/licenseManager.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/utils/licenseManager.ts)** | **Subscription & Auth Gate Enforcer:** Verifies session validity against Supabase, enforces Free Tier limits (50 replies/month), handles in-extension login, and unlocks paid tier features (Agency Pro, Enterprise). |
| **[`src/utils/deduplication.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/utils/deduplication.ts)** | **Deterministic Deduplication Engine:** Generates consistent, collision-free hashes for messages using content properties rather than volatile DOM indexes. |
| **[`apps/web/src/context/AuthContext.tsx`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/context/AuthContext.tsx)** | **Cloud Auth State Manager:** Integrates Clerk user accounts with Supabase Auth. Prevents zombie sessions by clearing `localStorage` and broadcasting `MEMOREPLY_AUTH_LOGOUT` on sign out. |
| **[`apps/web/src/lib/dataService.ts`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/lib/dataService.ts)** | **Prisma PostgreSQL Gateway:** Handles server-side upserts of clients, conversations, and deduplicated messages. Includes in-memory fallback cache for zero-latency dashboard updates. |
| **[`apps/web/src/lib/googleDrive.ts`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/lib/googleDrive.ts)** | **Google Drive REST API Adapter:** Generates JWT tokens for service account authentication and executes multipart file uploads to Google Drive. |
| **[`apps/web/src/app/api/upload/drive/route.ts`](file:///c:/Users/Hassaan/Desktop/Extention/apps/web/src/app/api/upload/drive/route.ts)** | **File Upload API Endpoint:** Accepts multipart FormData or JSON base64 files, uploads them to Google Drive, and saves the file URL reference in Supabase PostgreSQL. |

---

## 3. Platform Safety & Anti-Bot Guardrails

### LinkedIn Strict Safe Mode (100% Anti-Bot Compliant)
LinkedIn monitors client-side browser environments aggressively for synthetic input events, uninvited DOM frame injections, and continuous scraping loops. To ensure that users never risk account restrictions or bans, Memoreply enforces **Strict Safe Mode** whenever `linkedin.com` is active:

1. **Zero DOM Injections:** The floating widget is explicitly blocked in [`src/ui/FloatingWidget.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/ui/FloatingWidget.ts) and [`src/content.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/content.ts):
   ```ts
   if (isLinkedInPage() || window.location.hostname.includes('linkedin.com')) {
     return; // Bypasses DOM injection completely
   }
   ```
2. **Passive-Only Read Architecture:** Background `MutationObserver` loops and `setInterval` polling timers are completely disabled on LinkedIn. Reading conversations occurs **only** when the user explicitly clicks the **"↻ Read Chat"** button in the extension.
3. **Isolated UI Execution:** AI responses are composed and displayed strictly within the extension's isolated side panel/popup window.
4. **1-Click Clipboard Workflow:** The primary recommended action for LinkedIn is **"📋 Copy to Clipboard"**. The user simply pastes with `Ctrl+V` (`Cmd+V`), leaving zero detectable telemetry footprint on LinkedIn's page scripts.
5. **Controlled Insertion Fallback:** If the user clicks **"Safely Insert"**, text is placed into the composer using the standard Selection API without simulated keystroke storms. If any insertion anomaly occurs, the extension immediately copies the draft to the clipboard and alerts the user.

### Fiverr & Upwork Safe Interaction & Policy Guardrails
1. **Zero Auto-Sending:** Memoreply places responses into the composer in a draft state. The seller must manually click the platform's "Send" button.
2. **ToS Communication Filter:** The prompt assembler ([`src/ai/contextAssembler.ts`](file:///c:/Users/Hassaan/Desktop/Extention/src/ai/contextAssembler.ts)) injects strict system constraints:
   - *Never share phone numbers, WhatsApp, Telegram, or email addresses.*
   - *Direct all project payments and milestone offers exclusively through the platform.*
3. **Safe Value Placement:** Uses native property setter descriptors to update textarea values cleanly, followed by natural `input` and `change` events.

---

## 4. UI Components, Buttons & Working Mechanisms

### Exhaustive Button Reference Table

| Button Name | Exact Location | Primary Purpose | Detailed Working Mechanism | Safety & Anti-Bot Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`↻ Read Chat`** | Status bar when active on **LinkedIn** | Manually reads active LinkedIn chat room messages. | Sends `{ type: 'EXTRACT_CONVERSATION' }` to `content.ts`. Parses visible messages, generates deterministic IDs, saves locally to Dexie, and streams payload to Supabase PostgreSQL. | **100% Passive.** Executed strictly on user click. Zero background intervals. |
| **`↻ Refresh`** | Status bar when active on **Fiverr / Upwork** | Rescans the page for new incoming messages. | Sends `{ type: 'EXTRACT_CONVERSATION' }` to content script. Extracts message nodes, computes deduplication hashes, and syncs updates to the database. | Debounced to prevent excessive page scraping. |
| **`Generate Reply`** | Chat & Reply Tab | Composes a context-grounded response. | Compiles recent conversation history, confirmed memory facts, seller business guidelines, and chosen tone into a structured prompt. Dispatches request to the configured AI engine. | Strips conflicting/disputed facts; enforces platform ToS safety rules. |
| **`📋 Copy to Clipboard`** | Reply Card on **LinkedIn** (Primary) | Copies generated draft to system clipboard for instant pasting. | Invokes native `navigator.clipboard.writeText(draftText)`. Displays a green feedback toast: *"Copied to clipboard! Ready to paste into LinkedIn (Ctrl+V)."* | **100% Undetectable.** Interacts with the OS clipboard, not the webpage DOM. |
| **`Copy Text`** | Reply Card on **Fiverr / Upwork** | Copies current draft for manual use. | Copies editor text to system clipboard via standard browser clipboard APIs. | Safe and client-side only. |
| **`Insert into Fiverr`** / **`Insert into Upwork`** | Reply Card on Fiverr / Upwork | Places drafted reply into message composer. | Queries active tab, locates composer input, applies text via prototype value setter or `execCommand`, triggers `input` events, and scrolls composer into view. | Leaves message in draft state. **Never auto-clicks send.** |
| **`Safely Insert`** | Reply Card on **LinkedIn** | Controlled placement into LinkedIn message box. | Sends `INSERT_DRAFT` to `linkedinAdapter.ts`. Focuses `msg-form__contenteditable`, sets text via Selection API. If blocked, automatically copies text to clipboard as fallback. | Non-destructive placement. Zero automated key storms. |
| **`Logout`** | Top Header Navigation | Signs user out and completely wipes credentials. | Purges `memoreply_auth_session`, `memoreply_license_status`, `memoreply_license_key`, `memoreply_user`, `memoreply_token` from `chrome.storage.local`. Sets `memoreply_logged_out: true`. Broadcasts `AUTH_LOGOUT` to all tabs to clear web `localStorage`. | Resets state, redirects to Mandatory Auth Gate, and prevents refresh revival. |
| **`Refine Chips`** | Below Editor Card (*Shorter*, *More Detail*, etc.) | Modifies draft tone on-the-fly. | Sends existing draft with transformation directives (*"Make this more concise"*, *"Add urgency"*) to the AI engine for instant revision. | Operates in memory; updates editor text reactively. |
| **`Clear`** | Editor Actions Bar | Resets editor and variants. | Clears `draftText` and resets variant array to empty state. | Local React state reset. |
| **`Export All Data`** | Settings Tab | Downloads JSON backup of all stored data. | Queries Dexie DB tables (`clients`, `conversations`, `messages`, `clientFacts`, `sellerKnowledge`) and triggers a structured JSON file download via `chrome.downloads` or Blob URL. | Complete data portability. |
| **`Delete All Data`** | Settings Tab | Factory reset of extension database. | Deletes local Dexie database (`MemoreplyDB`) and clears `chrome.storage.local` after user confirmation. | Permanent local data deletion. |

---

## 5. Session Management, Security & Zombie Session Prevention

### The Zombie Session Problem & Solution
A critical flaw in multi-context extensions is the **"Zombie Session"** bug: when a user clicks logout in an extension, refreshing the page or reloading the side panel revives old session tokens or falls back to hardcoded default demo accounts (`seller@hashturn.com`), leaving the extension open.

Memoreply eliminates zombie sessions through an end-to-end multi-layer invalidation protocol:

```
[User clicks Logout]
        │
        ├──► 1. Purge chrome.storage.local
        │       - Removes: memoreply_auth_session, memoreply_license_status,
        │                  memoreply_license_key, memoreply_user, memoreply_token
        │       - Sets: memoreply_logged_out = true
        │
        ├──► 2. Reset React State
        │       - setAuthSession(null)
        │       - setLicenseStatus(null)
        │       - setActiveStoredKey('')
        │
        ├──► 3. Cross-Tab Broadcast (chrome.tabs.sendMessage)
        │       - Dispatches: { type: 'AUTH_LOGOUT' } to ALL browser tabs
        │
        └──► 4. Content Script & Web LocalStorage Purge
                - Removes: localStorage.getItem('memoreply_auth_user')
                - Sets: localStorage.setItem('memoreply_logged_out', 'true')
                - Removes DOM attribute: body.removeAttribute('data-memoreply-auth')
```

### Page Refresh Protection
When any page or extension popup reloads:
1. `AuthContext.tsx` and `src/content.ts` check if `localStorage.getItem('memoreply_logged_out') === 'true'`. If set, all automatic session restoration routines abort immediately.
2. `App.tsx` inspects `chrome.storage.local.get(['memoreply_logged_out'])`. If `true`, it immediately displays the Mandatory In-Extension Auth Gate.
3. Upon a legitimate, fresh login or valid license key activation, `memoreply_logged_out` is deleted, allowing normal synchronized operation.

---

## 6. Data Schema & Entity Modeling

The PostgreSQL database schema is maintained via Prisma (`apps/web/prisma/schema.prisma`):

```prisma
model User {
  id              String           @id @default(uuid())
  email           String           @unique
  name            String?
  role            UserRole         @default(SELLER)
  plan            SubscriptionPlan @default(FREE)
  apiKey          String?          @unique
  repliesUsed     Int              @default(0)
  clients         Client[]
  conversations   Conversation[]
  sellerKnowledge SellerKnowledge?
  @@map("users")
}

model Client {
  id             String         @id @default(uuid())
  userId         String
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform       PlatformType   @default(FIVERR)
  platformUserId String         // Unique platform handle
  displayName    String
  notes          String?        @db.Text
  conversations  Conversation[]
  facts          ClientFact[]
  @@unique([userId, platform, platformUserId])
  @@map("clients")
}

model Conversation {
  id             String             @id @default(uuid())
  userId         String
  user           User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientId       String
  client         Client             @relation(fields: [clientId], references: [id], onDelete: Cascade)
  platform       PlatformType       @default(FIVERR)
  conversationId String             // Platform specific room ID
  status         ConversationStatus @default(ACTIVE)
  url            String?
  messages       Message[]
  @@unique([userId, platform, conversationId])
  @@map("conversations")
}

model Message {
  id                String       @id @default(cuid())
  conversationId    String
  conversation      Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  messageId         String
  senderRole        SenderRole
  senderName        String
  text              String       @db.Text
  timestamp         String
  sentAt            DateTime     @default(now())
  deduplicationHash String       // SHA-256 Hash
  attachmentUrl     String?      @db.Text // Google Drive View URL
  driveFileId       String?      // Google Drive File ID
  @@unique([conversationId, deduplicationHash])
  @@map("messages")
}

model FileAttachment {
  id               String       @id @default(uuid())
  userId           String
  conversationId   String?
  fileName         String
  fileSize         Int
  mimeType         String
  driveFileId      String       // Google Drive File ID
  driveViewUrl     String       @db.Text
  driveDownloadUrl String?      @db.Text
  uploadedAt       DateTime     @default(now())
  @@map("file_attachments")
}
```

---

## 7. Installation, Environment & Build Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Google Chrome:** Version 116+ (Manifest V3 Side Panel API support)

### 2. Environment Variables Configuration
Create a `.env` file in the root directory and in `apps/web/.env`:

```env
# Supabase PostgreSQL Connection Strings
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase API Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Google Drive Storage Integration (Optional - falls back to secure reference URLs if omitted)
GOOGLE_DRIVE_CLIENT_EMAIL="memoreply-drive-sync@[PROJECT].iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="[DRIVE_FOLDER_ID]"
```

### 3. Build & Run Commands
```bash
# 1. Install root & web workspace dependencies
npm install
npm install --prefix apps/web

# 2. Sync database schema with Supabase PostgreSQL
cd apps/web
npx prisma generate
npx prisma db push
cd ../..

# 3. Build the Chrome Extension (Vite MV3)
npm run build

# 4. Build the Next.js Cloud Dashboard
npm run build:web
```

### 4. Load Extension in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the **`dist`** folder located in this repository (`Extention/dist`).
4. The **Memoreply** assistant will appear in your extensions list. Pin it to your toolbar for instant access.

---

## 8. Privacy Policy & Legal Compliance

- **Zero Unsolicited Spying:** Permissions are restricted strictly to active freelancing message pages (`*.fiverr.com/*`, `*.upwork.com/*`, `*.linkedin.com/*`). The extension never reads personal tabs, emails, or browsing histories.
- **Tenant Isolation:** Client facts and chats are isolated per freelancer tenant account (`userId`).
- **Storage Compliance:** Heavy attachments and images are stored in Google Drive; PostgreSQL retains only secure reference pointers.
- **Full Data Ownership:** Users can export all stored client records as a JSON backup or permanently erase their database at any time from the Settings tab.

---

**Engineered with architectural excellence by HashTurn.**  
© 2026 HashTurn Digital. All rights reserved.
