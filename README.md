# Memoreply — AI Client Memory & Reply Assistant

> **Tagline:** AI replies that remember.  
> **Developed by:** HashTurn  
> **Target Platform:** Google Chrome (Manifest V3) • Fiverr Inbox & Messaging

Memoreply is a production-oriented Chrome extension designed for freelancers, agencies, and client-facing professionals. It reads incoming conversations on freelance platforms (starting with Fiverr), retains client context and confirmed preferences across sessions using local IndexedDB storage, and composes accurate, personalized AI responses via OpenAI.

---

## 🌟 Core Features (Phase 1 MVP)

- **Fiverr Platform Integration (Module 1):**
  - Content script detects Fiverr inbox and order messaging pages.
  - Automatically scrapes conversation threads, extracting client handles, avatars, messages, and timestamps.
  - Deduplicates messages using deterministic hashing.
  - Safe Draft Insertion: Injects drafted replies directly into Fiverr's message composer without auto-sending (seller reviews and sends manually).

- **Persistent Client Memory (Module 2):**
  - IndexedDB storage powered by Dexie.js (`MemoreplyDB`).
  - Structured entities: Clients, Conversations, Messages, and Client Facts.
  - Heuristic & AI extraction of client constraints (budget, timeline, technical preferences).
  - **Advanced Memory Flags:** Each fact is tagged with a status (`Proposed`, `Confirmed`, `Disputed`) with one-click toggling.
  - **Memory Conflict & Contradiction Detection:** Automatically flags contradictions if a client proposes conflicting terms (e.g. altered budget or changed timeline) with clear warning badges.
  - Ability to add, view, edit, and delete client notes and facts in the UI.

- **Context Retrieval & Assembly Engine (Module 3):**
  - Automatically retrieves relevant conversation history, client facts, and seller knowledge.
  - Excludes disputed facts and highlights confirmed specifications.
  - Assembles structured prompts compliant with Fiverr ToS (strictly prevents sharing off-platform contact details).

- **AI Reply Generator & Backend Modes (Module 4):**
  - Direct integration with OpenAI Chat Completions API (`gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`).
  - Zero-cost **ChatGPT Web Session Integration** (`auth.json` upload) with tab-bridge automation.
  - Tone selector: *Professional*, *Friendly*, *Concise*, *Detailed*, *Pitch / Offer*, *Follow-up*.
  - Optional custom directives field for on-the-fly prompt tuning.
  - Smart offline fallback template generator when no API key is set.

- **Chrome Extension Interface (Module 6):**
  - Modern, responsive React + TypeScript Side Panel (`index.html`).
  - Dark Mode and Light Mode support.
  - Live connection status pill (🟢 Connected, 🟡 Idle, ⚪ Offline).
  - Built-in **Demo Mode ("Load Demo Chat")** for instant testing without opening Fiverr.
  - Toast notification system for clear user feedback.

- **Seller Knowledge Base (Module 7):**
  - Dedicated UI tab to configure freelancer profile, brand identity, offered services, core skills, pricing policy, revision terms, and working hours.
  - Injected into AI prompts so every reply reflects the seller's true capabilities and business rules.

- **Data Management & Privacy (Module 8):**
  - **Data Export:** Instant structured JSON backup download of all conversations, clients, client facts, and seller knowledge base.
  - **Data Deletion (Factory Reset):** Strict confirmation prompt that completely clears both IndexedDB (`MemoreplyDB`) and `chrome.storage.local`, resetting the extension to a clean slate.

- **Automated Testing & Delivery (Module 10):**
  - Vitest unit testing suite for deterministic deduplication, prompt assembly, and memory conflict detection.
  - Playwright end-to-end testing setup.
  - Comprehensive architectural and development documentation.

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- **Google Chrome** (version 116 or newer with Side Panel API support).
- **Node.js** (v18 or higher) & **npm**.

### 2. Install Dependencies & Build
Open a terminal in the project directory:

```bash
# Install dependencies (including Vitest & Playwright)
npm install

# Run automated unit tests
npm test

# Build the extension for production
npm run build
```

This compiles the React application and Chrome extension bundles into the `dist/` directory.

### 3. Load the Unpacked Extension in Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the address bar.
3. In the top-right corner, toggle on **Developer mode**.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist`** folder inside this project directory (`c:\Users\Hassaan\Desktop\Extention\dist`).
6. You will see **Memoreply — AI Client Memory & Reply Assistant** appear in your extension list!

---

## 🧪 Automated Testing Suite (Module 10)

Memoreply is equipped with an automated test suite using **Vitest** and **Playwright**:

```bash
# Run unit tests once
npm test

# Run unit tests in interactive watch mode
npm run test:watch

# Run Playwright E2E test suite
npm run test:e2e
```

### Test Coverage Highlights:
- **Deduplication (`tests/unit/deduplication.test.ts`):** Validates deterministic hashing and ensures DOM re-scrapes never duplicate stored records.
- **Context Assembler (`tests/unit/contextAssembler.test.ts`):** Tests prompt construction, Fiverr policy safety checks, and seller knowledge injection.
- **Memory Contradiction Detection (`tests/unit/memoryConflict.test.ts`):** Tests fact extraction, status tagging (`proposed`, `confirmed`, `disputed`), and automated conflict detection when contradictory requirements are sent.

---

## 💻 How to Use the Extension

### Testing with Demo Data (No Fiverr required):
1. Click the **Memoreply** extension icon in your Chrome toolbar to open the Side Panel.
2. In the top status bar, click **"Load Demo Chat"**.
3. The conversation thread between client Alex Miller and you will load into the feed and save into IndexedDB.
4. Switch to the **🧠 Client Memory** tab to view extracted facts (Budget: $650, Timeline: 2 weeks) and test toggling statuses (`Proposed` → `Confirmed` → `Disputed`).
5. Switch to the **📚 Knowledge Base** tab to customize your skills, services, and pricing policies.
6. Switch back to **💬 Chat & Reply**, select a tone (e.g. *Pitch / Offer*), and click **"Generate Reply"**.
7. Test the **"Copy"** button to copy your draft to clipboard!

### Using on Live Fiverr:
1. Open [fiverr.com/inbox](https://www.fiverr.com/inbox) in Chrome and click on any client chat thread.
2. Open the Memoreply Side Panel.
3. Click the **🔄 Refresh** button in the top right to sync visible messages into IndexedDB.
4. Generate a reply tailored to the conversation.
5. Click **📥 Insert into Fiverr** — the reply will be safely typed into the Fiverr message box ready for your final review and submission!

### Configuring AI Backend:
- **Option A (ChatGPT Web Session — Free):** Export `auth.json` from `chatgpt.com/api/auth/session` and upload it in the Settings tab.
- **Option B (OpenAI API Key):** Paste your official API key (`sk-...`) in the Settings tab.

---

## 🛠️ Project Structure

```
├── manifest.json              # Chrome Manifest V3 configuration
├── vite.config.ts             # Vite + CRXJS plugin configuration
├── vitest.config.ts           # Vitest unit test configuration
├── playwright.config.ts       # Playwright E2E test configuration
├── package.json               # Project dependencies and test scripts
├── index.html                 # Extension Side Panel HTML entry point
├── tests/
│   ├── setup.ts               # Test setup (fake-indexeddb & mock Chrome APIs)
│   ├── unit/
│   │   ├── deduplication.test.ts      # Message hashing & deduplication tests
│   │   ├── contextAssembler.test.ts   # Prompt builder & policy safety tests
│   │   └── memoryConflict.test.ts     # Fact status & contradiction tests
│   └── e2e/
│       └── extension.spec.ts          # Playwright smoke & DOM integrity test
├── public/
│   └── icons/                 # Extension icons (16px, 48px, 128px)
├── src/
│   ├── main.tsx               # React application entry point
│   ├── App.tsx                # Side Panel UI (Modules 6, 7 & 8)
│   ├── types.ts               # Shared TypeScript models and messages
│   ├── index.css              # Design system tokens and styles
│   ├── background.ts          # Background service worker (lifecycle & routing)
│   ├── content.ts             # Fiverr content script (DOM extraction & composer)
│   ├── utils/
│   │   └── deduplication.ts   # Deterministic hashing & deduplication
│   ├── db/
│   │   ├── index.ts           # Dexie IndexedDB schema & entity definitions
│   │   └── repository.ts      # CRUD, status flags, export & delete utilities
│   └── ai/
│       ├── types.ts           # AI Provider & Context interfaces
│       ├── contextAssembler.ts# Context retrieval and prompt assembler (Module 3)
│       └── openai.ts          # OpenAI & ChatGPT session provider (Module 4)
└── dist/                      # Compiled unpacked extension ready for Chrome
```

---

## 🔒 Privacy & Security

- **Local Storage First:** All conversation messages, client facts, and seller profile information are stored exclusively on your device inside browser IndexedDB (`MemoreplyDB`).
- **Data Export & Portability:** Export all stored data as a structured JSON file at any time.
- **Permanent Data Deletion:** One-click factory reset clears both IndexedDB and `chrome.storage.local`.
- **Fiverr ToS Compliant:** Memoreply never auto-submits messages, never bypasses Fiverr controls, and enforces strict prompt policies preventing off-platform communication.

---

## 📄 License & Credits
Developed by **HashTurn** © 2026. All rights reserved.
