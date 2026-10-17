# Privacy Policy for Memoreply

**Effective Date:** October 17, 2026  
**Product:** Memoreply (Chrome Extension)  
**Developed by:** HashTurn  

At HashTurn, your privacy, data security, and client confidentiality are our highest priorities. Memoreply is engineered with a **local-first privacy architecture** designed specifically for freelancers, agencies, and client-facing professionals.

---

## 1. Core Privacy Principles

1. **Local-First Storage:** All conversation history, client facts, and seller knowledge base configurations are stored directly in your browser's local IndexedDB (`MemoreplyDB`) via Dexie.js. Your data does not leave your machine unless you explicitly generate an AI reply.
2. **Zero Auto-Sending:** Memoreply strictly inserts draft replies into the message box for your manual review and approval. It never automatically sends messages, preserving complete user oversight and compliance with platform terms of service.
3. **No Unrelated Tab Access:** Memoreply's permissions are restricted strictly to active freelancing message surfaces (`*://*.fiverr.com/*`) and user-authenticated ChatGPT session endpoints. It never monitors or accesses unrelated websites, tabs, or browsing activity.
4. **No Third-Party Data Selling or Advertising:** We do not monetize your data, sell client information to brokers, or use private client conversations for advertising.

---

## 2. Information We Process

### A. Conversation & Client Context
- **What:** Visible client usernames, timestamps, and message history on active Fiverr conversation pages.
- **Why:** To help you maintain persistent memory of client requirements (such as budgets, timelines, and technical requirements) and generate relevant reply suggestions.
- **Where Stored:** Exclusively within your local browser's IndexedDB storage.

### B. AI Reply Generation
- **What:** When you click "Generate Reply", the assembled context (recent messages, relevant client facts, seller profile, and your selected tone) is sent to your authenticated ChatGPT session or configured AI provider.
- **Why:** To generate context-grounded response drafts.
- **Control:** You have complete control over when to trigger reply generation, which tone to use, and whether to include custom instructions.

### C. Seller Knowledge Base
- **What:** Freelancer business details, service catalog, skills, pricing guidelines, and revision policies that you voluntarily configure in the Knowledge Base tab.
- **Where Stored:** Stored locally in your browser's IndexedDB.

---

## 3. Data Export, Portability & Complete Deletion

- **Structured Data Export:** You can export your entire database (conversations, clients, client facts, messages, and seller knowledge base) as a structured JSON backup at any time via the **Settings** tab ("Export All Data").
- **Permanent Data Deletion (Factory Reset):** You can completely clear both your local IndexedDB (`MemoreplyDB`) and `chrome.storage.local` with a single click on "Delete All Data" in the **Settings** tab. This enforces a strict confirmation warning and resets the extension to a completely clean slate.
- **Local Retention Control:** Data remains strictly on your local computer until you choose to delete individual records or execute a factory reset. HashTurn operates zero telemetry or external logging servers.

---

## 4. Permissions & Compliance

- `sidePanel`: Used to display the assistant interface alongside your messaging tabs.
- `storage`: Used to persist local extension settings, theme preference, and session tokens securely in `chrome.storage.local`.
- `scripting` & `tabs`: Used to detect active message threads and insert approved draft text into message composers.
- `host_permissions`: Limited strictly to authorized messaging platforms (`*.fiverr.com`) and ChatGPT web backend services (`*.chatgpt.com`, `*.openai.com`).

---

## 5. Contact & Support

For privacy inquiries, security reports, or support regarding Memoreply, please contact HashTurn at:
- **Email:** support@hashturn.com
- **Website:** https://memoreply.com
