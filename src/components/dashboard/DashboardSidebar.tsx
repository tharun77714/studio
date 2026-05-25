"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from "framer-motion";
import { AnimatedSparkleIcon } from '@/components/common/animated-sparkle-icon';
import { Home, Network, Palette, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthNavMenu } from '@/components/common/AuthNavMenu';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { toggleChat, conversations, isChatOpen } = useChat();

  const totalUnreadMessages = user ? conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0) : 0;
  const isBusinessUser = profile?.role === 'business';

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home, show: true },
    { name: "Networks", href: "/dashboard/networks", icon: Network, show: true },
    { name: "AI Customizer", href: "/dashboard/customizer", icon: Palette, show: true },
    { name: "Reviews", href: "/dashboard/reviews", icon: Star, show: isBusinessUser },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="sticky top-0 z-40 h-screen hidden md:flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.25,1)]"
    >
      <div className="flex h-20 items-center px-4 justify-between">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <AnimatedSparkleIcon className="h-6 w-6 text-primary shrink-0 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <span className="font-headline text-lg font-medium text-foreground tracking-widest uppercase">Sparkle</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center mt-2">
            <AnimatedSparkleIcon className="h-6 w-6 text-primary shrink-0 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-card text-muted-foreground shadow-xl hover:text-foreground hover:border-white/20 hover:scale-110 transition-all z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="px-4 py-2">
        <div className="h-px w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent" />
      </div>

      <nav className="flex-1 space-y-2 p-3 mt-4">
        {navItems.map((item) => {
          if (!item.show) return null;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span className={cn(
                "group relative flex items-center gap-4 rounded-xl px-3 py-3 text-xs font-medium uppercase tracking-wider transition-all duration-300",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", stiffness: 40, damping: 20, mass: 0.5 }}
                  />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors z-10", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                {!isCollapsed && <span className="truncate z-10">{item.name}</span>}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-4 mb-4">
        <div className="px-1">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        
        {user && (
          <button 
            onClick={toggleChat} 
            className={cn(
              "group relative flex w-full items-center gap-4 rounded-xl px-3 py-3 text-xs font-medium uppercase tracking-wider transition-all duration-300",
              isChatOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isChatOpen && (
              <motion.div 
                layoutId="activeChatIndicator"
                className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/20"
                transition={{ type: "spring", stiffness: 40, damping: 20, mass: 0.5 }}
              />
            )}
            <div className="relative z-10">
              <MessageSquare className="h-4 w-4 shrink-0" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                </span>
              )}
            </div>
            {!isCollapsed && <span className="z-10">Messages</span>}
          </button>
        )}
        <div className={cn("flex", isCollapsed ? "justify-center px-0" : "px-3")}>
          <AuthNavMenu />
        </div>
      </div>
    </motion.aside>
  );
}
