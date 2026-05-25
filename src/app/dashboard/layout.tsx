"use client";

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AnimatedSparkleIcon } from '@/components/common/animated-sparkle-icon';
import { AuthNavMenu } from '@/components/common/AuthNavMenu';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { isChatOpen } = useChat();

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/20">
      {/* Ambient WebGL Atmospheric Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/5 blur-[180px]" />
      </div>

      {/* Desktop Sidebar */}
      <DashboardSidebar />
      
      {/* Mobile Header (Fallback) */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <AnimatedSparkleIcon className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          </Link>
          <AuthNavMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col relative z-10 w-full">
        <main 
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-16 py-12 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.25,1)] ${
            isChatOpen && user ? 'xl:pr-[24rem]' : ''
          }`}
        >
          {children}
        </main>
      </div>
      
      {user && <ChatSidebar />}
    </div>
  );
}
