import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// ── Define Public Routes ──────────────────────────────────────────
// Public pages: Landing page, Pricing, Ungated Extension Download, Auth pages
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing(.*)',
  '/api/download(.*)',
  '/api/waitlist(.*)',
  '/api/sync(.*)',
  '/api/auth(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/reset-password(.*)',
  '/forgot-password(.*)',
  '/favicon.ico',
  '/icon.png',
  '/logo.png',
]);

export default clerkMiddleware(async (auth, request) => {
  // If route is private (e.g. /dashboard, /clients, /context-vault, /settings, /memory), protect it
  if (!isPublicRoute(request)) {
    // Only enforce auth if keys are present, otherwise allow smooth local dev inspection
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('dummy')) {
      await auth.protect();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
