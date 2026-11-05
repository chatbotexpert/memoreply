import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Check if valid Clerk credentials are provided
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

const isClerkReady =
  Boolean(clerkPublishableKey) &&
  !clerkPublishableKey?.includes('dummy') &&
  clerkPublishableKey?.startsWith('pk_') &&
  Boolean(clerkSecretKey) &&
  !clerkSecretKey?.includes('demo') &&
  clerkSecretKey?.startsWith('sk_');

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

const clerkHandler = isClerkReady
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
    })
  : null;

export default function middleware(request: NextRequest, event: any) {
  // Graceful fallback: If Clerk credentials are not yet configured or throw on edge, proceed safely
  if (clerkHandler) {
    try {
      return clerkHandler(request, event);
    } catch (err) {
      console.warn('[Clerk Middleware Graceful Fallback]:', err);
      return NextResponse.next();
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
