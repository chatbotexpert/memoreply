'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export type SaaSPlan = 'Freelancer' | 'Agency Pro' | 'Enterprise';

export interface ExtensionSeat {
  id: string;
  deviceName: string;
  browser: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn' | 'Multi';
  lastPing: string;
  ipAddress: string;
  status: 'active' | 'idle';
}

export interface UserProfile {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  plan: SaaSPlan;
  licenseKey: string;
  activeSeats: number;
  maxSeats: number;
  renewalDate: string;
  isLicensed: boolean;
  seats: ExtensionSeat[];
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_hashturn_agency',
  name: 'Hassaan HashTurn',
  agencyName: 'HashTurn Digital Solutions',
  email: 'seller@hashturn.com',
  plan: 'Agency Pro',
  licenseKey: 'MR-AGENCY-8849-X92F-PRO',
  activeSeats: 3,
  maxSeats: 5,
  renewalDate: 'November 22, 2026',
  isLicensed: true,
  seats: [
    {
      id: 'seat_1',
      deviceName: 'Workstation Mac M3 Pro',
      browser: 'Chrome 131 (MV3)',
      platform: 'Fiverr',
      lastPing: '2 mins ago',
      ipAddress: '192.168.1.104',
      status: 'active',
    },
    {
      id: 'seat_2',
      deviceName: 'Agency Windows Rig',
      browser: 'Chrome 131 (MV3)',
      platform: 'Upwork',
      lastPing: '14 mins ago',
      ipAddress: '192.168.1.112',
      status: 'active',
    },
    {
      id: 'seat_3',
      deviceName: 'Outreach Laptop',
      browser: 'Brave 1.70 (MV3)',
      platform: 'LinkedIn',
      lastPing: '1 hour ago',
      ipAddress: '172.16.0.45',
      status: 'idle',
    },
  ],
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (
    name: string,
    agencyName: string,
    email: string,
    password: string,
    plan: SaaSPlan
  ) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => void;
  regenerateLicense: () => void;
  revokeSeat: (seatId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const router = useRouter();

  // Clerk Authentication Hooks
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // 1. Sync Clerk User to Memoreply State & Chrome Extension Bridge
  useEffect(() => {
    if (isClerkLoaded && isClerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const name =
        clerkUser.fullName ||
        clerkUser.firstName ||
        email.split('@')[0].replace(/[._-]/g, ' ') ||
        'Agency User';
      const userMeta = (clerkUser.publicMetadata || {}) as Record<string, any>;
      const plan: SaaSPlan = (userMeta.plan as SaaSPlan) || 'Agency Pro';
      const cleanKey =
        userMeta.licenseKey ||
        `MR-${plan.toUpperCase().replace(/\s+/g, '')}-ACTIVE-SEC`;
      const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;

      const activeUser: UserProfile = {
        id: clerkUser.id,
        name,
        agencyName: (userMeta.agencyName as string) || `${name}'s Workspace`,
        email,
        plan,
        licenseKey: cleanKey,
        activeSeats: 1,
        maxSeats,
        renewalDate: 'Monthly Plan',
        isLicensed: true,
        seats: [
          {
            id: `seat_${clerkUser.id.substring(0, 8)}`,
            deviceName: 'Active Chrome Browser',
            browser: 'Chrome (MV3)',
            platform: 'Multi',
            lastPing: 'Just now',
            ipAddress: '127.0.0.1',
            status: 'active',
          },
        ],
      };

      setUser(activeUser);
      setIsAuthenticated(true);

      try {
        localStorage.setItem('memoreply_auth_user', JSON.stringify(activeUser));
      } catch {}

      // Broadcast auth payload for Chrome Extension handshake
      const authPayload = {
        token: `clerk_${clerkUser.id}`,
        userId: clerkUser.id,
        email,
        name,
        plan,
        licenseKey: cleanKey,
      };

      if (typeof window !== 'undefined') {
        window.postMessage(
          { type: 'MEMOREPLY_AUTH_PAYLOAD', payload: authPayload },
          window.location.origin
        );
        if (document.body) {
          document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
        }
      }
      return;
    }

    if (isClerkLoaded && !isClerkSignedIn) {
      // Check for stored local/offline session fallback
      const stored = localStorage.getItem('memoreply_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsAuthenticated(true);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [isClerkLoaded, isClerkSignedIn, clerkUser]);

  // Sync Supabase Auth session on mount (Legacy / Dual compatibility)
  useEffect(() => {
    async function initSupabaseAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const userMeta = session.user.user_metadata || {};
          const plan: SaaSPlan = (userMeta.plan as SaaSPlan) || 'Freelancer';
          const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;

          const activeUser: UserProfile = {
            id: session.user.id,
            name: userMeta.name || session.user.email?.split('@')[0] || 'Agency User',
            agencyName: userMeta.agencyName || 'Personal Workspace',
            email: session.user.email || '',
            plan,
            licenseKey: userMeta.licenseKey || `MR-${plan.toUpperCase().replace(/\s+/g, '')}-SEC`,
            activeSeats: 1,
            maxSeats,
            renewalDate: 'Monthly Plan',
            isLicensed: true,
            seats: [],
          };

          setUser(activeUser);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('memoreply_auth_user', JSON.stringify(activeUser));
          } catch {}
          return;
        }

        // Fallback to localStorage if offline/persisted
        const stored = localStorage.getItem('memoreply_auth_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        const stored = localStorage.getItem('memoreply_auth_user');
        if (stored) {
          setUser(JSON.parse(stored));
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    }

    initSupabaseAuth();

    // Listen for auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          const userMeta = session.user.user_metadata || {};
          const plan: SaaSPlan = (userMeta.plan as SaaSPlan) || 'Freelancer';
          const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;

          const activeUser: UserProfile = {
            id: session.user.id,
            name: userMeta.name || session.user.email?.split('@')[0] || 'Agency User',
            agencyName: userMeta.agencyName || 'Personal Workspace',
            email: session.user.email || '',
            plan,
            licenseKey: userMeta.licenseKey || `MR-${plan.toUpperCase().replace(/\s+/g, '')}-SEC`,
            activeSeats: 1,
            maxSeats,
            renewalDate: 'Monthly Plan',
            isLicensed: true,
            seats: [],
          };

          setUser(activeUser);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('memoreply_auth_user', JSON.stringify(activeUser));
          } catch {}
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          try {
            localStorage.removeItem('memoreply_auth_user');
          } catch {}
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    const isDemo =
      !password ||
      password === '••••••••••••' ||
      email.toLowerCase().includes('agency@hashturn.com') ||
      email.toLowerCase().includes('freelancer@alexmiller.io') ||
      email.toLowerCase().includes('seller@hashturn.com');

    // 1. If it's a demo account or quick demo button, bypass password check seamlessly
    if (isDemo) {
      const plan: SaaSPlan = email.toLowerCase().includes('freelancer') ? 'Freelancer' : 'Agency Pro';
      const maxSeats = plan === 'Freelancer' ? 1 : 5;
      const resolvedUser: UserProfile = {
        ...DEFAULT_USER,
        id: `demo_usr_${Date.now()}`,
        email,
        name: email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
        agencyName: `${email.split('@')[0]} Agency`,
        plan,
        maxSeats,
        isLicensed: true,
      };

      setUser(resolvedUser);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('memoreply_auth_user', JSON.stringify(resolvedUser));
      } catch {}

      const authPayload = {
        token: `demo_jwt_token_${Date.now()}`,
        refreshToken: `demo_refresh_${Date.now()}`,
        userId: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
        plan: resolvedUser.plan,
        licenseKey: resolvedUser.licenseKey,
      };

      if (typeof window !== 'undefined') {
        window.postMessage(
          {
            type: 'MEMOREPLY_AUTH_PAYLOAD',
            payload: authPayload,
          },
          window.location.origin
        );
        if (document.body) {
          document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
        }
      }
      return true;
    }

    // 2. Real Authenticate with Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If email is not yet confirmed by user in Supabase, allow instant workspace access
        if (error.message.toLowerCase().includes('email not confirmed')) {
          const resolvedUser: UserProfile = {
            id: `usr_${Date.now()}`,
            name: email.split('@')[0],
            agencyName: `${email.split('@')[0]} Workspace`,
            email,
            plan: 'Agency Pro',
            licenseKey: `MR-AGENCYPRO-ACTIVE-SEC`,
            activeSeats: 1,
            maxSeats: 5,
            renewalDate: 'Monthly Plan',
            isLicensed: true,
            seats: [],
          };
          setUser(resolvedUser);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('memoreply_auth_user', JSON.stringify(resolvedUser));
          } catch {}

          const authPayload = {
            token: `confirmed_token_${Date.now()}`,
            refreshToken: `confirmed_refresh_${Date.now()}`,
            userId: resolvedUser.id,
            email: resolvedUser.email,
            name: resolvedUser.name,
            plan: resolvedUser.plan,
            licenseKey: resolvedUser.licenseKey,
          };

          if (typeof window !== 'undefined') {
            window.postMessage({ type: 'MEMOREPLY_AUTH_PAYLOAD', payload: authPayload }, window.location.origin);
            if (document.body) document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
          }
          return true;
        }

        // If user is not yet registered in Supabase Auth, attempt seamless signup
        if (error.message.toLowerCase().includes('invalid login') || error.message.toLowerCase().includes('user not found')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: email.split('@')[0],
                plan: 'Agency Pro',
              },
            },
          });

          if (!signUpError && signUpData.user && signUpData.session) {
            const resolvedUser: UserProfile = {
              id: signUpData.user.id,
              name: email.split('@')[0],
              agencyName: `${email.split('@')[0]} Agency`,
              email,
              plan: 'Agency Pro',
              licenseKey: `MR-AGENCYPRO-DEMO-SEC`,
              activeSeats: 1,
              maxSeats: 5,
              renewalDate: 'Monthly Plan',
              isLicensed: true,
              seats: [],
            };
            setUser(resolvedUser);
            setIsAuthenticated(true);
            try {
              localStorage.setItem('memoreply_auth_user', JSON.stringify(resolvedUser));
            } catch {}

            const authPayload = {
              token: signUpData.session.access_token,
              refreshToken: signUpData.session.refresh_token,
              userId: signUpData.user.id,
              email: signUpData.user.email,
              name: resolvedUser.name,
              plan: resolvedUser.plan,
              licenseKey: resolvedUser.licenseKey,
            };

            if (typeof window !== 'undefined') {
              window.postMessage({ type: 'MEMOREPLY_AUTH_PAYLOAD', payload: authPayload }, window.location.origin);
              if (document.body) document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
            }
            return true;
          }
        }
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        const userMeta = data.user.user_metadata || {};
        const plan: SaaSPlan = (userMeta.plan as SaaSPlan) || 'Freelancer';
        const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;

        const resolvedUser: UserProfile = {
          id: data.user.id,
          name: userMeta.name || email.split('@')[0],
          agencyName: userMeta.agencyName || 'Personal Workspace',
          email: data.user.email || email,
          plan,
          licenseKey: userMeta.licenseKey || `MR-${plan.toUpperCase().replace(/\s+/g, '')}-SEC`,
          activeSeats: 1,
          maxSeats,
          renewalDate: 'Monthly Plan',
          isLicensed: true,
          seats: [],
        };

        setUser(resolvedUser);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('memoreply_auth_user', JSON.stringify(resolvedUser));
        } catch {}

        // Broadcast session for Chrome Extension handshake
        const authPayload = {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          userId: data.user.id,
          email: data.user.email,
          name: resolvedUser.name,
          plan: resolvedUser.plan,
          licenseKey: resolvedUser.licenseKey,
        };

        if (typeof window !== 'undefined') {
          window.postMessage(
            {
              type: 'MEMOREPLY_AUTH_PAYLOAD',
              payload: authPayload,
            },
            window.location.origin
          );

          if (document.body) {
            document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
          }
        }

        return true;
      }
    } catch (err: any) {
      throw err;
    }

    return true;
  };

  const signup = async (
    name: string,
    agencyName: string,
    email: string,
    password: string,
    plan: SaaSPlan
  ): Promise<boolean> => {
    const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const licenseKey = `MR-${plan.toUpperCase().replace(/\s+/g, '')}-${randomHex}-SEC`;

    // 1. Real Signup on Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          agencyName,
          plan,
          licenseKey,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // 2. Dispatch verification & welcome email via Resend in the background
    try {
      fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          plan,
          licenseKey,
          password,
        }),
      }).catch((e) => console.warn('[Resend Signup Dispatch Warning]:', e));
    } catch {}

    const newUser: UserProfile = {
      id: data.user?.id || `usr_${Date.now()}`,
      name,
      agencyName,
      email,
      plan,
      licenseKey,
      activeSeats: 1,
      maxSeats,
      renewalDate: 'Monthly Plan',
      isLicensed: true,
      seats: [
        {
          id: `seat_${Date.now()}`,
          deviceName: 'Primary Agency Chrome Browser',
          browser: 'Chrome 131 (MV3)',
          platform: 'Multi',
          lastPing: 'Just now',
          ipAddress: '127.0.0.1',
          status: 'active',
        },
      ],
    };

    setUser(newUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('memoreply_auth_user', JSON.stringify(newUser));
    } catch {}

    // Broadcast session for Chrome Extension handshake
    const token = data.session?.access_token || `session_usr_${Date.now()}`;
    const refreshToken = data.session?.refresh_token || `refresh_usr_${Date.now()}`;
    const authPayload = {
      token,
      refreshToken,
      userId: data.user?.id || newUser.id,
      email: data.user?.email || newUser.email,
      name: newUser.name,
      plan: newUser.plan,
      licenseKey: newUser.licenseKey,
    };

    if (typeof window !== 'undefined') {
      window.postMessage(
        {
          type: 'MEMOREPLY_AUTH_PAYLOAD',
          payload: authPayload,
        },
        window.location.origin
      );

      if (document.body) {
        document.body.setAttribute('data-memoreply-auth', JSON.stringify(authPayload));
      }
    }

    return true;
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to dispatch password recovery email.');
    }
    return true;
  };

  const logout = async () => {
    try {
      await clerkSignOut();
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('memoreply_auth_user');
      if (document.body) {
        document.body.removeAttribute('data-memoreply-auth');
      }
      if (typeof window !== 'undefined') {
        window.postMessage(
          { type: 'MEMOREPLY_AUTH_PAYLOAD', payload: null },
          window.location.origin
        );
      }
    } catch {}
    router.push('/login');
  };

  const regenerateLicense = () => {
    if (!user) return;
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const updated = {
      ...user,
      licenseKey: `MR-${user.plan.toUpperCase().replace(/\s+/g, '')}-${randomHex}-SEC`,
    };
    setUser(updated);
    try {
      localStorage.setItem('memoreply_auth_user', JSON.stringify(updated));
    } catch {}
  };

  const revokeSeat = (seatId: string) => {
    if (!user) return;
    const remainingSeats = user.seats.filter((s) => s.id !== seatId);
    const updated = {
      ...user,
      seats: remainingSeats,
      activeSeats: remainingSeats.length,
    };
    setUser(updated);
    try {
      localStorage.setItem('memoreply_auth_user', JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        sendPasswordReset,
        logout,
        regenerateLicense,
        revokeSeat,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
