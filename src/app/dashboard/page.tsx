"use client";

import { useAuth } from '@/hooks/useAuth'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, UserCircle, Building, Palette, Sparkles } from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 40, damping: 20, mass: 0.5 } }
};

export default function DashboardPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/'); 
    }
  }, [user, authLoading, router]);

  if (authLoading || !profile) { 
    return (
      <div className="space-y-12">
        <Skeleton className="h-20 w-1/2 rounded-2xl bg-white/5" />
        <div className="grid md:grid-cols-12 gap-8">
          <Skeleton className="h-80 md:col-span-8 rounded-3xl bg-white/5" />
          <Skeleton className="h-80 md:col-span-4 rounded-3xl bg-white/5" />
        </div>
      </div>
    );
  }
  
  const userRole = profile.role;
  const displayName = profile.role === 'business' ? profile.business_name : profile.full_name;
  
  // Luxury copy
  const welcomeTitle = userRole === 'individual' ? "Curate Your Collection." : "Elevate Your Brand.";
  const subtitle = userRole === 'individual' ? "Discover pieces that tell your unique story." : "Showcase your masterful creations to a discerning audience.";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-16"
    >
      {/* Massive Cinematic Header */}
      <motion.div variants={itemVariants} className="max-w-4xl">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-foreground tracking-tighter leading-[1.1] drop-shadow-sm">
          {welcomeTitle}
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-muted-foreground font-light tracking-wide max-w-2xl">
          Welcome back, <span className="text-foreground font-medium">{displayName}</span>. <br className="hidden md:block"/>{subtitle}
        </p>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-8 auto-rows-min">
        
        {/* Main Network Card - Spans 8 columns */}
        <motion.div variants={itemVariants} className="md:col-span-8">
          <Card className="h-full min-h-[360px] flex flex-col justify-between overflow-hidden relative group border-white/5 bg-black/40 hover:bg-black/60">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out" />
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                  <Sparkles className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                </div>
                <CardTitle className="font-headline text-3xl md:text-4xl tracking-tight">The Network</CardTitle>
              </div>
              <CardDescription className="text-lg md:text-xl font-light text-muted-foreground/80 max-w-md leading-relaxed">
                {userRole === 'individual' 
                  ? 'Immerse yourself in a curated selection of fine jewelry from around the world.'
                  : 'Manage your portfolio, track engagement, and orchestrate your business presence.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 mt-auto">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-sm uppercase tracking-widest bg-foreground text-background hover:scale-105 hover:bg-foreground/90 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <Link href="/dashboard/networks">
                  Enter Network <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Customizer Card - Spans 4 columns */}
        <motion.div variants={itemVariants} className="md:col-span-4">
          <Card className="h-full min-h-[360px] flex flex-col justify-between bg-gradient-to-b from-white/5 to-transparent border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out" />
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/5">
                  <Palette className="h-6 w-6 text-accent drop-shadow-[0_0_8px_rgba(15,160,206,0.6)]" />
                </div>
                <CardTitle className="font-headline text-2xl">Studio AI</CardTitle>
              </div>
              <CardDescription className="text-base font-light leading-relaxed">
                Architect your imagination. Design bespoke pieces using our generative AI engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto relative z-10">
              <Button asChild variant="outline" className="w-full rounded-full py-6 uppercase tracking-widest text-xs border-white/10 hover:bg-white/10 transition-colors duration-300">
                <Link href="/dashboard/customizer">Launch Studio</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Card - Spans 12 columns (wide banner) */}
        <motion.div variants={itemVariants} className="md:col-span-12">
          <Card className="flex flex-col sm:flex-row items-center justify-between p-8 md:p-10 bg-black/20 border-white/5 group hover:border-white/10 transition-colors duration-500">
            <div className="flex items-center gap-6 mb-6 sm:mb-0">
              <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.25,1)]">
                {userRole === 'individual' ? <UserCircle className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" /> : <Building className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />}
              </div>
              <div>
                <h3 className="text-2xl font-headline font-semibold text-foreground tracking-tight">Identity & Settings</h3>
                <p className="text-muted-foreground font-light mt-1">Configure your profile, security, and preferences.</p>
              </div>
            </div>
            <Button asChild variant="ghost" className="rounded-full px-6 py-6 uppercase tracking-widest text-xs hover:bg-white/10 transition-all duration-300 group-hover:translate-x-2">
              <Link href={userRole === 'individual' ? "/dashboard/profile/individual" : "/dashboard/networks"}>
                Manage Identity <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}