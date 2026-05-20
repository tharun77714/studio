"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
export interface User {
  id: string;
  email: string;
  role: 'individual' | 'business';
}

export interface Session {
  user: User;
}

export interface Profile {
  id: string;
  role: 'individual' | 'business' | null;
  email?: string;
  full_name?: string;
  default_shipping_address_text?: string;
  default_shipping_address_lat?: number | null;
  default_shipping_address_lng?: number | null;
  individual_phone_number?: string;
  business_name?: string;
  gst_number?: string;
  business_type?: string;
  business_address_text?: string;
  business_address_lat?: number | null;
  business_address_lng?: number | null;
  contact_person_name?: string;
  contact_phone_number?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (prefetchedData?: { session: Session | null; profile: Profile | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async (prefetchedData?: { session: Session | null; profile: Profile | null }) => {
    if (prefetchedData) {
      setSession(prefetchedData.session);
      setUser(prefetchedData.session?.user ?? null);
      setProfile(prefetchedData.profile);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = await response.json();

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setProfile(data.profile ?? null);
    } catch (error) {
      console.error('Failed to refresh auth session:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
    });
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
