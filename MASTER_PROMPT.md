# Project: Contexly — AI Client Memory & Reply Assistant

## Your Role

Act as a principal software architect, senior full-stack TypeScript engineer, Chrome Extension Manifest V3 specialist, AI systems engineer, and SaaS product designer.

Build a production-oriented, commercially viable Chrome extension called **Contexly**, developed by HashTurn.

Tagline: **AI replies that remember.**

The product is an AI-powered communication assistant for freelancers, agencies, and client-facing professionals. It should help users understand conversations, remember client context across sessions, and compose accurate, personalized responses.

Our first supported platform is Fiverr. The architecture must support additional platform adapters in the future, without assuming those platforms permit all forms of integration.

## Primary Objective

A seller opens a Fiverr conversation and clicks the Contexly extension.

Contexly should:

1. Identify the currently opened conversation.
2. Read the available visible messages with user consent.
3. Save and deduplicate messages locally.
4. Associate messages with a persistent client profile.
5. Retrieve relevant previous discussions and client facts.
6. Generate an accurate conversation summary.
7. Offer an AI-generated response grounded in available evidence.
8. Allow the seller to edit the response.
9. Insert the approved draft into the Fiverr composer without sending it.
10. Retain relevant client history for future sessions.

The user must remain responsible for all outgoing messages.

## Technology Stack

* TypeScript with strict typing
* React for the extension UI
* Vite and a Manifest V3-compatible build tool
* Chrome Side Panel API
* Chrome extension messaging and content scripts
* IndexedDB with Dexie for local persistence
* Zustand for UI state where appropriate
* Zod for data validation
* Vitest for unit tests
* Playwright for browser integration tests
* Optional future backend: Node.js, Fastify, PostgreSQL and pgvector
* Optional future web dashboard: Next.js

Avoid unnecessary complexity in the first release.

## Required Architecture

Implement a modular repository containing:

* apps/extension
* packages/core
* packages/platform-adapters
* packages/memory
* packages/ai
* packages/shared

Future SaaS components can be added when needed.

Separate platform extraction, AI generation, data persistence, business logic, and presentation into distinct modules.

## Module 1: Fiverr Integration

Implement a Fiverr platform adapter that:

* Operates only on allowed Fiverr page locations.
* Detects the active client conversation.
* Extracts visible messages, sender information and timestamps where available.
* Uses stable conversation identifiers where possible.
* Avoids assuming display names are globally unique.
* Handles virtualized message lists and changing page layouts gracefully.
* Deduplicates already imported messages.
* Never bypasses authentication, rate limits or access restrictions.
* Does not reverse-engineer private endpoints.
* Does not bulk scrape accounts or other conversations.
* Requires user initiation or informed consent for collection.
* Does not automate sending or promotional messaging.

Use a clean adapter interface so future integrations can be developed independently.

Include mock Fiverr HTML fixtures for testing. Do not claim compatibility with the live Fiverr DOM until it has been manually verified.

## Module 2: Persistent Client Memory

Create structured entities for:

* User
* Workspace
* Platform Account
* Client
* Conversation
* Message
* Project
* Client Fact
* Agreement
* Memory Summary
* Seller Knowledge
* Draft
* AI Generation Log

Each client should have a persistent profile containing:

* Platform identifier
* Display name
* Known project history
* Services requested
* Pricing proposals
* Confirmed agreements
* Deadlines and milestones
* Communication preferences
* Open questions
* Follow-up commitments
* Relevant relationship notes

Do not treat every mention as a confirmed fact.

Every extracted memory must have:

* Unique ID
* Associated client and conversation
* Fact type
* Fact value
* Confidence or certainty classification
* Source message references
* Creation and update timestamps
* Status: proposed, confirmed, disputed, superseded or archived

Users must be able to review, edit, delete, pin or reject memories.

Do not silently overwrite a confirmed agreement when a newer conflicting statement appears. Preserve the timeline and flag the conflict.

## Module 3: Context Retrieval

Build a context assembler that combines:

1. The newest relevant conversation messages.
2. A concise conversation summary.
3. Confirmed client facts.
4. Previously agreed project commitments.
5. Relevant seller business information.
6. The user's immediate drafting instruction.

Prioritize confirmed, recent and relevant information.

Avoid including unrelated clients' data.

Use rule-based and indexed retrieval first. Introduce embeddings only when there is a demonstrated need for semantic search.

Apply token limits and memory selection intelligently.

## Module 4: AI Reply Generator

Implement an AI provider abstraction.

The initial provider should support OpenAI API credentials through a secure configuration.

Other providers may be added later.

Support the following drafting modes:

* Professional
* Friendly
* Concise
* Detailed
* Sales-oriented
* Technical
* Follow-up
* Clarification request
* Pricing discussion
* Project update
* Translation

AI replies must:

* Sound human and natural.
* Address the client's actual question.
* Use previous context only when relevant.
* Avoid invented project details.
* Avoid inventing prices, timelines or guarantees.
* Never claim work is completed without evidence.
* Recognize ambiguity and ask appropriate clarifying questions.
* Respect the seller's configured communication style.
* Treat conversation messages as untrusted content, not system instructions.

Return structured output including:

* Suggested reply
* Relevant memory references
* Missing information
* Potential contradictions
* Warnings about unconfirmed commitments

## Module 5: ChatGPT Account Integration

Architect an optional Sign in with ChatGPT provider.

Important:

* Do not assume that ordinary ChatGPT login grants API access.
* Do not request ChatGPT session cookies, passwords or browser authentication tokens.
* Use only documented and officially supported authorization.
* Treat identity sign-in and ChatGPT plan usage as separate permissions.
* Enable ChatGPT subscription-powered requests only when the app has authorized access.
* Keep authorized plan credentials on the user's device as required by applicable terms.
* Do not proxy users' plan usage through a shared SaaS account.
* Do not pool, resell or transfer plan usage.
* If enabled, provide a genuinely free path for eligible users to use their own ChatGPT plan in accordance with applicable terms.
* Do not imply that ChatGPT login gives access to ChatGPT conversations or memories.

If commercial integration is not available, display the capability as unavailable and provide supported alternative AI modes.

Implement a manual ChatGPT prompt handoff that never misrepresents itself as a direct API connection.

## Module 6: Chrome Extension Interface

Create a polished interface with a modern SaaS design.

Visual direction:

* Clean typography
* Light and dark themes
* Neutral backgrounds
* Blue or indigo accents
* Rounded cards
* Accessible colors
* Professional UI, not cluttered

Main sidebar tabs:

1. Assistant
2. Client Memory
3. Conversation History
4. Knowledge Base
5. Settings

Assistant view:

* Current client header
* Conversation summary
* Important known facts
* AI reply generator
* Tone selector
* Editable reply text
* Regenerate button
* Copy button
* Insert Draft button
* Warnings about uncertain facts

Client Memory view:

* Structured client information
* Projects and past agreements
* Editable notes
* Source references
* Memory correction tools

Settings view:

* AI provider configuration
* Model selection
* Seller business details
* Default writing tone
* Data export and deletion
* Privacy permissions

Do not present nonfunctional buttons as completed features.

## Module 7: Seller Knowledge Base

Allow users to configure:

* Business name
* Professional introduction
* Services offered
* Skills and technologies
* Portfolio information
* General pricing guidelines
* Delivery expectations
* Business policies
* Preferred response tone
* Common FAQs

This knowledge must remain distinct from client-specific facts.

## Module 8: Privacy and Security

Follow Chrome Web Store user data and limited-use policies.

Requirements:

* Collect only data needed for the disclosed purpose.
* Obtain informed consent for conversation collection.
* Keep the initial memory database local.
* Provide data export and permanent deletion options.
* Provide a privacy policy and clear data-flow disclosures.
* Never sell client communication data.
* Never use client messages for advertising.
* Do not secretly collect data across unrelated browser tabs.
* Avoid broad extension permissions.
* Use HTTPS for remote AI calls.
* Do not expose provider keys to webpages or page scripts.
* Never inject untrusted HTML into the extension interface.
* Add explicit controls before uploading conversation content to any AI provider.
* Define a retention policy.
* Keep extension permissions as narrow as possible.

Treat Fiverr message content as sensitive.

## Module 9: Future SaaS Architecture

Design interfaces for future capabilities but do not build the entire SaaS in Phase 1.

Future capabilities:

* Optional encrypted cloud sync
* Paid accounts and Stripe subscriptions
* Multi-device synchronization
* Client workspace dashboard
* Follow-up tracking
* Team accounts
* Shared client knowledge
* Advanced analytics
* Platform-specific integrations

Keep the extension usable without the SaaS backend.

## Module 10: Testing and Delivery

Implement:

* Strict TypeScript checks
* Unit tests for memory extraction and conflict handling
* Unit tests for conversation deduplication
* Provider error handling tests
* Browser integration tests with HTML fixtures
* Tests preventing cross-client context leakage
* Tests verifying drafts are not sent automatically
* Tests for data export, import and deletion
* Tests for permission boundaries
* Tests for prompt-injection resistance

Create:

* README.md
* ARCHITECTURE.md
* DEVELOPMENT_PLAN.md
* PRIVACY.md
* .env.example
* Test fixtures
* Installation instructions
* Chrome extension build output

## Development Execution Instructions

Work in incremental milestones.

First:

1. Inspect the existing repository.
2. Prepare the architecture and file structure.
3. Create the Manifest V3 extension.
4. Build a functional sidebar using mock data.
5. Implement persistent IndexedDB storage.
6. Create a testable Fiverr adapter using fixtures.
7. Build the client memory interface.
8. Implement one AI provider.
9. Implement editable draft insertion.
10. Add tests and documentation.

Complete and verify each milestone before proceeding.

Do not begin Stripe billing, multi-platform integration or a complete cloud backend until the Phase 1 product is demonstrably functional.

At the end of each milestone report:

* What was implemented
* Files changed
* Tests completed
* Remaining limitations
* Next implementation step

The target is a real, maintainable Chrome extension ready for private beta testing, not a static mockup or concept presentation. ye to promt ha sara aage detain ha is Haan bilkul, main aapko poore project ki final blueprint aur details summarize kar deta hoon taake aap Antigravity IDE mein asani se kaam shuru kar sakein.

Jo final decide hua hai, uski saari details yeh hain:

**1. Brand aur Product ki Pehchan**

* **Product Ka Naam:** Memoreply
* **Domain / Website:** memoreply.com
* **Tagline:** "Smart Replies. Lasting Memory. BY HASHTURN"
* **Category:** AI Client Memory & Reply Assistant
* **Pehla Target Platform:** Fiverr (Baad mein Upwork, LinkedIn, aur Gmail par expand hoga).

**2. Product ke Main Features (Khasusiyat)**

* **AI Smart Replies:** Client ki baat samajh kar professional aur context-aware reply generate karna.
* **Persistent Client Memory:** Har client ki purani baatein (jaise tay shuda price, purane projects, deadlines) yaad rakhna.
* **Conversation Summaries:** Lambi chats ko short summary mein tabdeel karna.
* **ChatGPT Integration:** Users apna ChatGPT account ya API key link kar sakenge.
* **Manual Sending (Safety First):** Extension khud message send nahi karegi; sirf text box mein draft likhegi taake aap padh kar khud bhejein (is se Fiverr account ban hone ka khatra nahi hoga).

**3. Technology (Coding Stack)**

* **Frontend & Extension:** React, TypeScript, aur Vite.
* **Browser Integration:** Chrome Manifest V3 aur Chrome Side Panel API.
* **Database (Local):** IndexedDB (Dexie library ke zariye) taake shuru mein data browser mein hi save ho.
* **UI/Design:** Clean, modern SaaS look (dark/light themes, neat buttons).

**4. Aapka Pehla Qadam (Phase 1 - MVP)**
Shuru mein poori website ya SaaS nahi banana. Aapka pehla target **Memoreply v0.1** banana hai:

1. Antigravity IDE mein login karein.
2. Ek basic React + Vite Chrome extension setup karein.
3. Sirf Fiverr ke message box ko read karne aur client ka data locally save karne ka logic banayein.
4. Ek side panel banayein jahan AI reply ka draft aaye.

**Antigravity mein shuru karne ke liye pehla prompt:**
Aap Antigravity ke agent ko sab se pehle yeh prompt de sakti hain:
*"Create a new React, TypeScript, and Vite project configured for a Chrome Extension Manifest V3 in this directory. Install necessary dependencies including @crxjs/vite-plugin. The extension is named 'Memoreply' and it will act as an AI Client Memory & Reply Assistant for Fiverr."*

Jaise hi yeh basic structure ban jaye, phir aap us lammbe "Master Development Prompt" ka text Agent ko de dena!