# Clerk + Supabase Integration Guide for Memoreply

This guide outlines how Clerk authentication is connected to your Supabase PostgreSQL database and how requests are securely verified.

---

## 1. Overview of the Architecture

* **Authentication Provider:** [Clerk](https://clerk.com) handles user registration, Google OAuth ("Continue with Google"), Email/Password, MFA, sessions, and user management.
* **Database & Ledger:** [Supabase](https://supabase.com) manages the PostgreSQL database (`User`, `Client`, `Conversation`, `ClientFact`, `SellerKnowledge`) via Prisma and Supabase REST/Admin API.
* **Extension Bridge:** `chrome.storage.local` receives the authenticated Clerk user identity via the `content.ts` handshake bridge when logging in on `memoreply.com`.

---

## 2. Setting Up Clerk JWT Template for Supabase

To allow Clerk users to query Supabase PostgreSQL tables directly using Row-Level Security (RLS):

1. **Open Clerk Dashboard:**
   * Navigate to **Configure** ➔ **JWT Templates** ➔ **New Template**.
   * Select **Supabase** from the template list.

2. **Template Configuration:**
   * **Name:** `supabase`
   * **Token Lifetime:** `60` seconds (or default `3600`)
   * **Signing Algorithm:** `HS256`
   * **Signing Key:** Paste your Supabase **JWT Secret** (found in Supabase Dashboard ➔ **Project Settings** ➔ **API** ➔ **JWT Settings** ➔ **JWT Secret**).

3. **Claims Payload:**
   Ensure the template JSON contains:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "app_metadata": {
       "provider": "clerk"
     },
     "user_metadata": {
       "id": "{{user.id}}",
       "name": "{{user.full_name}}",
       "plan": "{{user.public_metadata.plan}}",
       "licenseKey": "{{user.public_metadata.licenseKey}}"
     }
   }
   ```
   Save the template.

---

## 3. Environment Variables Configuration

Ensure the following variables are present in your local `.env` and in your **Vercel Project Settings**:

```env
# Clerk Authentication (clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_your_actual_clerk_key"
CLERK_SECRET_KEY="sk_live_your_actual_clerk_secret"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Supabase Credentials (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 4. How the Chrome Extension Syncs

1. When a user installs the extension, they can click **"Sign In with Web / Google"** or enter their credentials.
2. The web login page (`/login`) renders Clerk's `<SignIn />` component with the dark theme matching Memoreply.
3. Upon completing sign-in via Google or Email:
   * Next.js `AuthContext` detects the session via `useUser()`.
   * It broadcasts `MEMOREPLY_AUTH_PAYLOAD` with the user ID, email, plan, and license key.
   * The extension content script (`src/content.ts`) catches this event on `memoreply.com`.
   * It writes `memoreply_auth_session` and `memoreply_license_status` to `chrome.storage.local`.
   * The Chrome Extension immediately unlocks all features (Fiverr/Upwork/LinkedIn bars, AI replies, and client memory ledger).
