'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  logout: () => void;
  regenerateLicense: () => void;
  revokeSeat: (seatId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const router = useRouter();

  // Load user session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('memoreply_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      } else {
        // Persist default demo user for seamless out-of-the-box exploration
        localStorage.setItem('memoreply_auth_user', JSON.stringify(DEFAULT_USER));
        setUser(DEFAULT_USER);
        setIsAuthenticated(true);
      }
    } catch {
      setUser(DEFAULT_USER);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    // If logging in with existing or matching email, load or generate user
    const existing = user && user.email.toLowerCase() === email.toLowerCase() ? user : null;
    const resolvedUser: UserProfile = existing || {
      ...DEFAULT_USER,
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
      agencyName: `${email.split('@')[0]} Agency`,
    };

    setUser(resolvedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('memoreply_auth_user', JSON.stringify(resolvedUser));
    } catch {}
    return true;
  };

  const signup = async (
    name: string,
    agencyName: string,
    email: string,
    _password: string,
    plan: SaaSPlan
  ): Promise<boolean> => {
    const maxSeats = plan === 'Freelancer' ? 1 : plan === 'Agency Pro' ? 5 : 20;
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const licenseKey = `MR-${plan.toUpperCase().replace(/\s+/g, '')}-${randomHex}-SEC`;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      agencyName,
      email,
      plan,
      licenseKey,
      activeSeats: 1,
      maxSeats,
      renewalDate: 'November 22, 2026',
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
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('memoreply_auth_user');
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
