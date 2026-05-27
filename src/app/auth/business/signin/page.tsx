"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, ShieldCheck, MessageSquare, LogIn, Gem, ArrowLeft } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PhoneInput } from "@/components/common/phone-input";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { FlipCard } from "@/components/auth/layout/FlipCard";
import { OTPInput } from "@/components/auth/inputs/OTPInput";

const ACCENT = "hsl(43 74% 66%)"; // Champagne Gold
const ACCENT_RGB = "212,175,55";

const emailSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});
const phoneSendSchema = z.object({
  phone: z.string().refine((v) => isValidPhoneNumber(v), { message: "Invalid phone number." }),
});
const phoneVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});
type EmailForm = z.infer<typeof emailSchema>;

// ─── Minimal Luxury Input ───────────────────────────────────────────────────
const LuxuryInput = React.forwardRef<HTMLInputElement, any>(({ label, icon, error, ...props }, ref) => {
  return (
    <div className="space-y-1.5 relative group z-20">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-semibold">{label}</span>
      </div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#0a0700] transition-colors">
          {icon}
        </div>
        <input
          ref={ref}
          {...props}
          style={{
            borderColor: error ? "rgba(248,113,113,1)" : "rgba(0,0,0,0.08)",
          }}
          className={`w-full bg-black/[0.02] border rounded-xl py-3 pl-10 pr-10 text-[14px] font-sans text-[#0a0700] placeholder:text-neutral-400/80 outline-none transition-all duration-300 focus:bg-white/50 shadow-[0_2px_10px_rgba(0,0,0,0.01)_inset] focus:border-[${ACCENT}] focus:ring-4 focus:ring-[${ACCENT}]/10 relative z-20`}
        />
        {props.rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30">
            {props.rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 pl-1">{error}</p>}
    </div>
  );
});
LuxuryInput.displayName = "LuxuryInput";

// ─── Luxury Button ────────────────────────────────────────────────────────
function LuxuryBtn({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <motion.button
      type={type} disabled={disabled} onClick={onClick}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className="relative w-full h-12 rounded-xl font-sans font-semibold text-[13px] overflow-hidden cursor-pointer flex items-center justify-center gap-2 group shadow-[0_8px_30px_rgba(0,0,0,0.12)] disabled:opacity-50 z-20"
      style={{
        background: "#0a0700",
        color: "#ffffff",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function Timer({ secs }: { secs: number }) {
  const pct = secs / 300; const m = Math.floor(secs / 60), s = secs % 60;
  return (
    <div className="flex items-center gap-2">
      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2.5"/>
        <motion.circle cx="14" cy="14" r="10" fill="none" stroke="#0a0700" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={62.8} strokeDashoffset={62.8*(1-pct)} transition={{ duration: 0.5 }} />
      </svg>
      <span className="text-[11px] tabular-nums font-sans font-medium text-[#0a0700]">{m}:{s<10?"0":""}{s}</span>
    </div>
  );
}

function BusinessSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [phoneState, setPhoneState] = useState<"idle"|"sent">("idle");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email:"", password:"" } });

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) toast({ title:"Auth Error", description:err, variant:"destructive" });
  }, [searchParams, toast]);

  useEffect(() => {
    if (phoneState !== "sent" || otpTimer <= 0) {
      if (otpTimer === 0) { setPhoneState("idle"); toast({ title:"OTP Expired", variant:"destructive" }); }
      return;
    }
    const t = setInterval(() => setOtpTimer((p) => p-1), 1000);
    return () => clearInterval(t);
  }, [phoneState, otpTimer, toast]);

  async function onEmailSubmit(data: EmailForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...data,expectedRole:"business"}) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error||"Invalid credentials.");
      await refreshProfile(result);
      toast({ title:"Welcome to Sparkle Studio!" });
      router.push("/dashboard");
    } catch(e:any) { toast({ title:"Sign In Failed", description:e.message, variant:"destructive" }); }
    finally { setIsLoading(false); }
  }

  async function onPhoneSend() {
    const p = phoneSendSchema.safeParse({ phone:phoneValue });
    if (!p.success) { toast({ title:"Invalid number", variant:"destructive" }); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/phone/send", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:phoneValue}) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setPhoneNumber(phoneValue); setPhoneState("sent"); setOtpTimer(300); setOtpValue("");
      toast({ title:"OTP Sent!" });
    } catch(e:any) { toast({ title:"SMS Failed", description:e.message, variant:"destructive" }); }
    finally { setIsLoading(false); }
  }

  async function onOTPSubmit() {
    const p = phoneVerifySchema.safeParse({ code:otpValue });
    if (!p.success) { toast({ title:"Enter 6 digits", variant:"destructive" }); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/phone/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:phoneNumber,code:otpValue,expectedRole:"business"}) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      await refreshProfile(result);
      toast({ title:"Welcome back!" });
      router.push("/dashboard");
    } catch(e:any) { toast({ title:"Verification Failed", description:e.message, variant:"destructive" }); }
    finally { setIsLoading(false); }
  }

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("Google Client ID not configured.");
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const params = new URLSearchParams({ client_id:clientId, redirect_uri:redirectUri, response_type:"code", scope:"openid email profile", access_type:"offline", prompt:"select_account", state:"business" });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch(e:any) { toast({ title:"Google Failed", description:e.message, variant:"destructive" }); setIsLoading(false); }
  };

  const TopHeader = () => (
    <div className="mb-8 z-20 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.05]">
            <Gem className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <div className="text-[#0a0700] text-sm font-semibold font-headline tracking-wide">Sparkle Studio</div>
            <div className="text-[9px] font-sans tracking-[0.2em] uppercase text-[#0a0700]/60">Business</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#0a0700]/70 hover:text-[#0a0700] transition-colors bg-black/[0.03] px-3 py-1.5 rounded-full border border-black/[0.05]"
        >
          {isFlipped ? "Use Email" : "Use Phone"}
        </button>
      </div>
      <div>
        <h1 className="font-headline text-3xl font-bold leading-tight tracking-tighter text-[#0a0700] mb-2">
          {isFlipped ? "Phone Auth" : "Sign In"}
        </h1>
        <p className="text-[#0a0700]/60 text-[13px] font-sans font-medium">
          Secure access to your business dashboard.
        </p>
      </div>
    </div>
  );

  const FrontContent = (
    <div className="flex-1 flex flex-col h-full z-20 relative">
      <TopHeader />
      <div className="flex-1">
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <LuxuryInput
            label="Email Address" type="email" icon={<Mail className="w-4 h-4"/>}
            placeholder="contact@yourcompany.com" error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />
          <LuxuryInput
            label="Password" type={showPw?"text":"password"} icon={<Lock className="w-4 h-4"/>}
            placeholder="••••••••" error={emailForm.formState.errors.password?.message}
            rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-[#0a0700]/50 hover:text-[#0a0700] transition-colors"><div className="p-2">{showPw?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</div></button>}
            {...emailForm.register("password")}
          />
          <div className="flex justify-end pt-1 pb-4 z-20 relative">
            <Link href="/auth/forgot-password" className="text-[11px] font-sans font-semibold text-[#0a0700]/60 hover:text-[#0a0700] transition-colors relative z-20">Forgot password?</Link>
          </div>
          <LuxuryBtn type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><span>Continue</span><ArrowRight className="w-4 h-4"/></>}
          </LuxuryBtn>
        </form>

        <div className="relative flex items-center my-6 z-20">
          <div className="flex-1 h-px bg-[#0a0700]/10"/>
          <span className="mx-4 text-[9px] font-sans font-bold text-[#0a0700]/40 tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-[#0a0700]/10"/>
        </div>

        <button type="button" disabled={isLoading} onClick={handleGoogle}
          className="relative z-20 w-full h-11 rounded-xl font-sans font-semibold text-[13px] text-[#0a0700] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-black/[0.05] flex items-center justify-center gap-3 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.473 6.564l3.793 3.201z"/>
            <path fill="#34A853" d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173-2.927 0-5.41-1.982-6.29-4.654L1.908 15.05C3.89 19.064 8.01 21.818 12 21.818c3.218 0 6.073-1.055 8.1-2.873l-4.06-3.6z"/>
            <path fill="#4285F4" d="M23.49 12.273c0-.8-.073-1.573-.209-2.318H12v4.545h6.455a5.527 5.527 0 0 1-2.4 3.636l4.06 3.6c2.373-2.182 3.764-5.4 3.764-9.463z"/>
            <path fill="#FBBC05" d="M5.71 11.864c-.236-.727-.373-1.509-.373-2.318s.137-1.59.373-2.318L1.917 4.027A11.956 11.956 0 0 0 0 9.545c0 2.01.5 3.91 1.382 5.609l4.327-3.29z"/>
          </svg>
          Continue with Google
        </button>
      </div>
      <div className="mt-8 text-center z-20 relative">
        <p className="text-[12px] font-sans text-[#0a0700]/70 font-medium">
          New to Sparkle? <Link href="/auth/business/signup" className="text-[#0a0700] font-bold hover:underline relative z-20">Apply for an account</Link>
        </p>
      </div>
    </div>
  );

  const BackContent = (
    <div className="flex-1 flex flex-col h-full z-20 relative">
      <TopHeader />
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phoneState === "idle" ? (
            <motion.div key="send" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="space-y-6">
              <div className="space-y-1.5 relative z-20">
                <label className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-semibold pl-1">Mobile Number</label>
                <div className="bg-black/[0.02] border border-black/[0.08] rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.01)_inset] focus-within:bg-white/50 focus-within:border-[#0a0700]/20 transition-all">
                  <PhoneInput value={phoneValue} onChange={(v) => setPhoneValue(v??"")} placeholder="Enter phone number"
                    className="bg-transparent border-none text-[#0a0700] px-4 py-3.5 text-[15px] font-sans outline-none w-full placeholder:text-neutral-400 relative z-20" />
                </div>
              </div>
              <LuxuryBtn onClick={onPhoneSend} disabled={isLoading}>
                {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<><MessageSquare className="w-4 h-4"/><span>Send Code</span></>}
              </LuxuryBtn>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="space-y-6">
              <div className="rounded-xl px-4 py-3.5 flex items-center justify-between bg-black/[0.03] border border-black/[0.06] relative z-20">
                <div>
                  <p className="text-[9px] text-[#0a0700]/50 font-sans uppercase tracking-widest mb-0.5 font-bold">Code sent to</p>
                  <p className="text-[13px] text-[#0a0700] font-sans font-bold tracking-wide">{phoneNumber}</p>
                </div>
                <Timer secs={otpTimer}/>
              </div>
              <div className="relative z-20">
                <label className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-semibold pl-1 mb-2 block">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" style={{ color:ACCENT }}/> Enter OTP
                </label>
                <div className="relative z-30">
                  <OTPInput value={otpValue} onChange={setOtpValue} accentColor="#0a0700" accentRgb="10,7,0" />
                </div>
              </div>
              <LuxuryBtn onClick={onOTPSubmit} disabled={isLoading||otpValue.length<6}>
                {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<><LogIn className="w-4 h-4"/><span>Verify & Sign In</span></>}
              </LuxuryBtn>
              <button type="button" onClick={() => { setPhoneState("idle"); setOtpValue(""); }}
                className="w-full text-center text-xs font-semibold text-[#0a0700]/50 hover:text-[#0a0700] font-sans transition-colors flex items-center justify-center gap-1 relative z-20">
                <ArrowLeft className="w-3 h-3"/> Change number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-8 text-center z-20 relative">
        <p className="text-[12px] font-sans text-[#0a0700]/70 font-medium">
          New to Sparkle? <Link href="/auth/business/signup" className="text-[#0a0700] font-bold hover:underline relative z-20">Apply for an account</Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 selection:bg-[#0a0700] selection:text-white">
      <AuroraBackground variant="gold" className="fixed" />
      <motion.div 
        className="w-full max-w-[440px] z-10"
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <FlipCard
          isFlipped={isFlipped}
          frontContent={FrontContent}
          backContent={BackContent}
          variant="gold"
        />
      </motion.div>
    </div>
  );
}

export default function BusinessSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color:ACCENT }}/></div>}>
      <BusinessSignInContent />
    </Suspense>
  );
}
