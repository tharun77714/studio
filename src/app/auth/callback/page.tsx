"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [statusText, setStatusText] = useState('Securing your luxury jewelry vault...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Get the session details from Supabase Auth client
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session || !session.user) {
          // If no immediate session, wait a brief second for hash fragment parsing
          setTimeout(async () => {
            const retry = await supabase.auth.getSession();
            if (!retry.data.session) {
              router.push('/auth/individual/signin?error=Failed+to+retrieve+auth+session.');
            } else {
              await syncUser(retry.data.session);
            }
          }, 800);
          return;
        }

        await syncUser(session);

      } catch (err: any) {
        console.error('Supabase callback verification failed:', err);
        router.push(`/auth/individual/signin?error=${encodeURIComponent(err.message || 'Authentication exchange failed.')}`);
      }
    };

    const syncUser = async (session: any) => {
      try {
        setStatusText('Synchronizing catalog profiles...');

        // 2. Send the verified user metadata to our MongoDB Sync endpoint
        const syncResponse = await fetch('/api/auth/supabase-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          }),
        });

        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
          throw new Error(syncData.error || 'Failed to link session with MongoDB server.');
        }

        // 3. Update the global react auth context state
        await refreshProfile(syncData);

        setStatusText('Vault unlocked! Entering dashboard...');

        // 4. Smoothly redirect to the user dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);

      } catch (syncError: any) {
        console.error('MongoDB sync failed:', syncError);
        router.push(`/auth/individual/signin?error=${encodeURIComponent(syncError.message || 'Profile synchronization failed.')}`);
      }
    };

    handleAuthCallback();
  }, [router, refreshProfile]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary/30">
      <div className="w-full max-w-md">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center rounded-2xl relative overflow-hidden">
          {/* Champagne gold top border glow */}
          <div className="absolute top-0 inset-x-0 h-[1.5px]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)' }} />
          
          <div className="relative mb-6">
            {/* Spinning Gold Loader */}
            <Loader2 className="h-10 w-10 animate-spin text-accent" style={{ color: 'hsl(var(--accent))' }} />
            <Sparkles className="h-4 w-4 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: 'hsl(var(--accent))' }} />
          </div>

          <h3 className="font-headline text-lg text-white mb-2 tracking-wide uppercase">Vaultech Access</h3>
          <p className="text-sm text-neutral-400 font-sans animate-pulse">{statusText}</p>
        </Card>
      </div>
    </main>
  );
}
