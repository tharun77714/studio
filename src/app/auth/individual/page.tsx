"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Mail, Phone, Chrome } from "lucide-react";
import { FlipCard } from "@/components/auth/layout/FlipCard";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { LuxuryInput } from "@/components/auth/inputs/LuxuryInput";
import { LuxuryBtn } from "@/components/auth/inputs/LuxuryBtn";
import { OTPInput } from "@/components/auth/inputs/OTPInput";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type AuthMode = "email" | "phone" | "google";

export default function IndividualAuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontMode, setFrontMode] = useState<AuthMode>("email");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const { loginIndividual } = useAuth();

  // "Vault Entry" Success Sequence
  const handleSuccess = async (data: any) => {
    setIsSuccess(true);
    await new Promise(r => setTimeout(r, 1200)); // wait for Vault Entry dissolve animation
    router.push("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(r => setTimeout(r, 1000));
      await handleSuccess({ id: "user_123" });
    } catch(e:any) {
      toast({ title: "Sign In Failed", variant: "destructive" });
      setIsLoading(false);
    }
  };

  // Shared Header for both sides
  const Header = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-8 z-20 relative">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-[#0a0700]/50 hover:text-[#0a0700] transition-colors bg-white/40 px-3 py-1.5 rounded-full border border-black/[0.05]">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#0a0700]/70 hover:text-[#0a0700] transition-colors bg-black/[0.03] px-3 py-1.5 rounded-full border border-black/[0.05]"
        >
          {isFlipped ? "Sign In instead" : "Create Account"}
        </button>
      </div>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.05]">
          <Sparkles className="w-5 h-5 text-[hsl(43,74%,66%)]" />
        </div>
        <div>
          <div className="text-[#0a0700] text-sm font-semibold font-headline tracking-wide">Sparkle Studio</div>
          <div className="text-[9px] font-sans tracking-[0.2em] uppercase text-[#0a0700]/60">Personal</div>
        </div>
      </div>
      <div>
        <h1 className="font-headline text-3xl font-bold leading-tight tracking-tighter text-[#0a0700] mb-2">
          {title}
        </h1>
        <p className="text-[#0a0700]/60 text-[13px] font-sans font-medium">
          {subtitle}
        </p>
      </div>
    </div>
  );

  const FrontContent = (
    <>
      <Header title={frontMode === "phone" ? "Phone Auth" : "Welcome Back"} subtitle="Secure access to your personal creative space." />
      
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {frontMode === "email" ? (
            <motion.form 
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.36, 1] }}
              onSubmit={handleSignIn}
              className="flex flex-col gap-4"
            >
              <LuxuryInput label="Email Address" type="email" required />
              <LuxuryInput label="Password" type="password" required />
              
              <div className="flex items-center justify-between mt-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded-md border border-black/10 flex items-center justify-center group-hover:border-black/30 transition-colors">
                    <input type="checkbox" className="opacity-0 absolute" />
                    <motion.div initial={false} className="w-2 h-2 rounded-sm bg-black opacity-0 group-has-[:checked]:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[12px] font-sans font-medium text-[#0a0700]/60 group-hover:text-[#0a0700]/80">Remember me</span>
                </label>
                <Link href="#" className="text-[12px] font-sans font-semibold text-[#0a0700]/60 hover:text-[#0a0700] transition-colors">
                  Forgot password?
                </Link>
              </div>

              <LuxuryBtn type="submit" isLoading={isLoading}>Sign In</LuxuryBtn>
            </motion.form>
          ) : (
            <motion.form 
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.36, 1] }}
              onSubmit={handleSignIn}
              className="flex flex-col gap-6"
            >
              <LuxuryInput label="Phone Number" type="tel" required />
              <div className="pt-2 pb-4">
                <p className="text-[12px] font-sans font-medium text-[#0a0700]/60 mb-3">Verification Code</p>
                <OTPInput value={otp} onChange={setOtp} length={6} />
              </div>
              <LuxuryBtn type="submit" isLoading={isLoading}>Verify & Enter</LuxuryBtn>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col gap-4 relative z-20">
        <div className="flex items-center gap-4">
          <div className="h-px bg-black/[0.06] flex-1" />
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#0a0700]/40">Or continue with</span>
          <div className="h-px bg-black/[0.06] flex-1" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <LuxuryBtn 
            type="button" 
            variant="google" 
            onClick={() => { setFrontMode("google"); handleSignIn({ preventDefault: ()=>{} } as any); }}
          >
            <Chrome className="w-4 h-4" /> Google
          </LuxuryBtn>
          <LuxuryBtn 
            type="button" 
            variant="google"
            onClick={() => setFrontMode(frontMode === "email" ? "phone" : "email")}
          >
            {frontMode === "email" ? <><Phone className="w-4 h-4" /> Phone</> : <><Mail className="w-4 h-4" /> Email</>}
          </LuxuryBtn>
        </div>
      </div>
    </>
  );

  const BackContent = (
    <>
      <Header title="Create Account" subtitle="Join Sparkle Studio." />
      <div className="flex-1 relative flex flex-col justify-center">
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSignIn}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <LuxuryInput label="First Name" required />
            <LuxuryInput label="Last Name" required />
          </div>
          <LuxuryInput label="Email Address" type="email" required />
          <LuxuryInput label="Password" type="password" required />
          
          <LuxuryBtn type="submit" isLoading={isLoading} className="mt-4">
            Create Account
          </LuxuryBtn>
        </motion.form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#050505]">
      <AuroraBackground variant="gold" isSuccess={isSuccess} />
      
      <FlipCard
        isFlipped={isFlipped}
        frontMode={frontMode}
        backMode="email"
        isSuccess={isSuccess}
        variant="gold"
        frontContent={FrontContent}
        backContent={BackContent}
      />
    </div>
  );
}
