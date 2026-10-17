# Memoreply — Master Development Plan & Roadmap

**Project:** Memoreply (AI Client Memory & Reply Assistant)  
**Developed by:** HashTurn  
**Architecture:** Chrome Extension Manifest V3 • React 19 • TypeScript • Dexie.js (IndexedDB) • OpenAI API

---

## 🏁 Phase 1: MVP Release (Completed ✅)

Phase 1 focused on creating a production-grade, commercially viable Chrome extension targeting Fiverr sellers, establishing persistent client memory and context-aware AI reply generation.

### Completed Milestones

- [x] **Milestone 1: Project Foundation & Build Pipeline**
  - Configured Vite + React 19 + TypeScript.
  - Integrated `@crxjs/vite-plugin` for Chrome Manifest V3 bundling.
  - Set up background service worker and content script architecture.
  - Created high-resolution branding icons (16px, 48px, 128px).

- [x] **Milestone 2: Fiverr Platform Integration (Module 1)**
  - Implemented inbox and order messaging detection (`/inbox/*`, `/messages/*`, `/manage_orders/*`).
  - Scraped conversation DOM with support for multiple Fiverr layout variants.
  - Extracted client handles, avatars, timestamps, and classified sender roles (`client`, `seller`, `system`).
  - Deduplicated messages using deterministic hashing.
  - Built React-compatible draft insertion engine into Fiverr composer (enforcing strict manual-send rule).

- [x] **Milestone 3: Persistent Client Memory (Module 2)**
  - Configured Dexie.js schema wrapping browser IndexedDB (`MemoreplyDB`).
  - Implemented entity tables: `clients`, `conversations`, `messages`, `clientFacts`, `sellerKnowledge`.
  - Built heuristic fact extraction for budget, timeline, and technical stack.
  - Implemented full CRUD operations for client facts and personal seller notes.
  - Built database export (JSON backup) and clear/reset utilities.

- [x] **Milestone 4: Context Retrieval & Assembly Engine (Module 3)**
  - Built logic to retrieve recent messages, client facts, and seller profile from IndexedDB.
  - Created structured prompt assembly enforcing strict Fiverr ToS compliance (zero off-platform contact sharing).
  - Designed tone adaptation for 6 communication styles.

- [x] **Milestone 5: AI Reply Generator (Module 4)**
  - Built direct OpenAI Chat Completions API provider (`gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`).
  - Implemented comprehensive error handling (401 invalid key, 429 quota exhaustion, rate limits).
  - Built secure API key storage in `chrome.storage.local`.
  - Created lightweight non-destructive connection testing tool.
  - Included context-aware offline sample draft generator when no key is set.

- [x] **Milestone 6: Extension User Interface (Module 6)**
  - Developed full-featured Side Panel UI using custom CSS tokens.
  - Dark Mode and Light Mode support with smooth transitions.
  - Real-time connection status pill (🟢 Connected, 🟡 Idle, ⚪ Offline).
  - Built-in Demo Mode ("Load Demo Chat") for testing without live Fiverr chats.
  - Toast notification system for instant user feedback.

- [x] **Milestone 7: Seller Knowledge Base (Module 7)**
  - Dedicated UI tab for freelancer profile, brand identity, offered services, and skills.
  - Configurable pricing policies, minimum order scope, and revision terms.
  - Automatic injection of seller knowledge into every AI prompt.

- [x] **Milestone 8: Privacy & Data Management (Module 8)**
  - Local-first privacy architecture: 100% of conversations and client facts stored inside browser IndexedDB.
  - Full structured JSON export (`exportAllData()`) downloading clients, conversations, messages, facts, and knowledge base.
  - Irreversible factory reset (`clearAllData()` + `chrome.storage.local.clear()`) with strict confirmation modal.

- [x] **Milestone 10: Testing & Delivery (Module 10)**
  - Automated testing setup with Vitest and Playwright.
  - Unit tests covering deterministic hashing, message deduplication, prompt assembly, and memory contradiction detection.
  - Comprehensive documentation suite: `README.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`, and `PRIVACY.md`.
  - Verified 100% clean TypeScript build with zero errors.

---

## 🔮 Phase 2: Platform Expansion & Advanced Intelligence (Roadmap)

### Milestone 11: Multi-Platform Adapter Architecture
- Abstract platform adapter interface to support multiple freelance portals.
- **Upwork Adapter:** Content script for Upwork Rooms / Messages (`upwork.com/messages/*`).
- **LinkedIn Adapter:** Content script for LinkedIn messaging threads.

### Milestone 12: Semantic Search & Vector Embeddings
- Integrate local vector embeddings (e.g. Transformers.js / WebGPU or OpenAI text-embedding-3-small) into IndexedDB.
- Semantic search across past conversations: recall how similar client objections, pricing discussions, or technical hurdles were solved previously.

### Milestone 13: Multi-Provider AI Architecture
- Extend AI Provider abstraction to support Anthropic Claude 3.5 Sonnet and Google Gemini 2.0 Flash alongside OpenAI.
- Provider fallback cascade if primary API experiences rate limits or balance issues.

### Milestone 14: Client Sentiment & Deal Analytics
- Automatic client sentiment badge (Hot Lead 🔥, Hesitant 🤔, Ready to Order 🚀).
- Win-rate analytics tracking which communication tones yield the highest offer acceptance rates.
