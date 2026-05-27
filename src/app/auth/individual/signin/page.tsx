"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, ShieldCheck, MessageSquare, LogIn, Gem } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PhoneInput } from "@/components/common/phone-input";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { AnimatedInput } from "@/components/auth/inputs/AnimatedInput";
import { OTPInput } from "@/components/auth/inputs/OTPInput";

const ACCENT = "hsl(262 83% 68%)";
const ACCENT_RGB = "139,92,246";

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

function PrimaryBtn({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const fire = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) { const id = Date.now(); setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }]); setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 700); }
    onClick?.();
  };
  return (
    <motion.button ref={ref} type={type} disabled={disabled} onClick={fire}
      whileHover={disabled ? {} : { scale: 1.018, y: -1 }} whileTap={disabled ? {} : { scale: 0.96 }}
      className="relative w-full h-12 rounded-2xl font-sans font-semibold text-[13px] text-white overflow-hidden select-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: `linear-gradient(135deg,rgba(${ACCENT_RGB},0.9),rgba(${ACCENT_RGB},0.65))`, boxShadow: `0 6px 28px rgba(${ACCENT_RGB},0.35),0 1px 0 rgba(255,255,255,0.12) inset` }}>
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.28) 50%,transparent 70%)", backgroundSize: "200% 100%" }}
        initial={{ backgroundPosition: "200% 0" }} whileHover={{ backgroundPosition: ["-200% 0","200% 0"] }} transition={{ duration: 0.6 }} />
      {ripples.map((r) => (<motion.span key={r.id} className="absolute rounded-full pointer-events-none"
        style={{ left: r.x, top: r.y, width: 8, height: 8, marginLeft: -4, marginTop: -4, background: "rgba(255,255,255,0.35)" }}
        initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 22, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} />))}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

function GoogleBtn({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" disabled={disabled} onClick={onClick} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="relative w-full h-11 rounded-2xl font-sans font-medium text-[13px] text-white/80 hover:text-white flex items-center justify-center gap-3 overflow-hidden transition-colors"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
        style={{ background: `rgba(${ACCENT_RGB},0.06)` }} transition={{ duration: 0.2 }} />
      <svg className="w-4 h-4 shrink-0 relative z-10" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.473 6.564l3.793 3.201z"/>
        <path fill="#34A853" d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173-2.927 0-5.41-1.982-6.29-4.654L1.908 15.05C3.89 19.064 8.01 21.818 12 21.818c3.218 0 6.073-1.055 8.1-2.873l-4.06-3.6z"/>
        <path fill="#4285F4" d="M23.49 12.273c0-.8-.073-1.573-.209-2.318H12v4.545h6.455a5.527 5.527 0 0 1-2.4 3.636l4.06 3.6c2.373-2.182 3.764-5.4 3.764-9.463z"/>
        <path fill="#FBBC05" d="M5.71 11.864c-.236-.727-.373-1.509-.373-2.318s.137-1.59.373-2.318L1.917 4.027A11.956 11.956 0 0 0 0 9.545c0 2.01.5 3.91 1.382 5.609l4.327-3.29z"/>
      </svg>
      <span className="relative z-10">Continue with Google</span>
    </motion.button>
  );
}

function Timer({ secs }: { secs: number }) {
  const pct = secs / 300; const m = Math.floor(secs / 60), s = secs % 60;
  return (
    <div className="flex items-center gap-2">
      <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5"/>
        <motion.circle cx="14" cy="14" r="10" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={62.8} strokeDashoffset={62.8*(1-pct)} transition={{ duration: 0.5 }} />
      </svg>
      <span className="text-xs tabular-nums font-sans" style={{ color: ACCENT }}>{m}:{s<10?"0":""}{s}</span>
    </div>
  );
}

const makeSlide = (dir: number) => ({
  initial: { x: dir*60, opacity:0, rotateY: dir*8, filter:"blur(4px)" },
  animate: { x:0, opacity:1, rotateY:0, filter:"blur(0px)", transition:{ duration:0.38, ease:[0.25,0.1,0.25,1] as const } },
  exit: { x:dir*-60, opacity:0, rotateY:dir*-8, filter:"blur(4px)", transition:{ duration:0.26 } },
});

function IndividualSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"email"|"phone">("email");
  const [tabDir, setTabDir] = useState(1);
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

  const switchTab = (t: "email"|"phone") => { setTabDir(t==="phone"?1:-1); setActiveTab(t); };

  async function onEmailSubmit(data: EmailForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...data,expectedRole:"individual"}) });
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
      const res = await fetch("/api/auth/phone/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:phoneNumber,code:otpValue,expectedRole:"individual"}) });
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
      const params = new URLSearchParams({ client_id:clientId, redirect_uri:redirectUri, response_type:"code", scope:"openid email profile", access_type:"offline", prompt:"select_account", state:"individual" });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch(e:any) { toast({ title:"Google Failed", description:e.message, variant:"destructive" }); setIsLoading(false); }
  };

  const sv = makeSlide(tabDir);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4">
      <AuroraBackground variant="violet" className="fixed" />

      <motion.div initial={{ opacity:0, y:24, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.5, ease:[0.25,0.1,0.25,1] }}
        className="relative z-10 w-full max-w-[420px]" style={{ perspective:"1000px" }}>

        <div className="relative rounded-3xl overflow-hidden"
          style={{ background:"rgba(8,5,18,0.75)", backdropFilter:"blur(28px) saturate(1.4)",
            border:"1px solid rgba(139,92,246,0.2)",
            boxShadow:`0 32px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04) inset,0 1px 0 rgba(139,92,246,0.22) inset` }}>

          {/* Top violet rim */}
          <div className="absolute top-0 inset-x-0 h-[1.5px]"
            style={{ background:`linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.7),transparent)` }} />

          <div className="px-8 pt-9 pb-8">
            {/* Logo */}
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.4 }}
              className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:`rgba(${ACCENT_RGB},0.12)`, border:`1px solid rgba(${ACCENT_RGB},0.28)` }}>
                <Gem className="w-4.5 h-4.5" style={{ color:ACCENT }} />
              </div>
              <div>
                <div className="text-white text-sm font-semibold font-headline tracking-wide">Sparkle Studio</div>
                <div className="text-[10px] font-sans tracking-[0.15em] uppercase" style={{ color:`rgba(${ACCENT_RGB},0.65)` }}>Personal Account</div>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.4 }} className="mb-7">
              <h1 className="font-headline text-[28px] font-bold leading-tight tracking-tight mb-1.5"
                style={{ background:`linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.7) 55%,rgba(${ACCENT_RGB},0.65) 100%)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Welcome back
              </h1>
              <p className="text-neutral-500 text-sm font-sans">Your sparkle awaits — sign in to continue</p>
            </motion.div>

            {/* Tab switcher */}
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.35 }}
              className="relative flex rounded-xl p-1 mb-6"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
              {(["email","phone"] as const).map((tab,i) => {
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => switchTab(tab)}
                    className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-sans font-medium z-10 transition-colors duration-200"
                    style={{ color: active ? "#ffffff" : "rgba(156,163,175,0.85)" }}>
                    {active && (<motion.div layoutId="ind-tab" className="absolute inset-0 rounded-lg"
                      style={{ background:`rgba(${ACCENT_RGB},0.85)` }}
                      transition={{ type:"spring", stiffness:360, damping:32 }} />)}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {i===0 ? <Mail className="w-3.5 h-3.5"/> : <Phone className="w-3.5 h-3.5"/>}
                      {i===0 ? "Email" : "Phone OTP"}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Sliding tab content */}
            <div style={{ perspective:"900px" }}>
              <AnimatePresence mode="wait" custom={tabDir}>
                {activeTab === "email" ? (
                  <motion.div key="email" variants={sv} initial="initial" animate="animate" exit="exit" style={{ transformStyle:"preserve-3d" }}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                      <AnimatedInput label="Email Address" type="email" icon={<Mail className="w-4 h-4"/>}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB} placeholder="you@example.com"
                        error={emailForm.formState.errors.email?.message} {...emailForm.register("email")} />
                      <AnimatedInput label="Password" type={showPw?"text":"password"} icon={<Lock className="w-4 h-4"/>}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB} placeholder="••••••••"
                        error={emailForm.formState.errors.password?.message}
                        rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-neutral-400 hover:text-white transition-colors">{showPw?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>}
                        {...emailForm.register("password")} />
                      <div className="flex justify-end -mt-1">
                        <Link href="/auth/forgot-password" className="text-xs font-sans hover:opacity-80 transition-opacity" style={{ color:`rgba(${ACCENT_RGB},0.75)` }}>Forgot password?</Link>
                      </div>
                      <PrimaryBtn type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><span>Sign In</span><ArrowRight className="w-4 h-4"/></>}
                      </PrimaryBtn>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="phone" variants={sv} initial="initial" animate="animate" exit="exit" style={{ transformStyle:"preserve-3d" }}>
                    <AnimatePresence mode="wait">
                      {phoneState === "idle" ? (
                        <motion.div key="send" initial={{ x:30,opacity:0,filter:"blur(4px)" }} animate={{ x:0,opacity:1,filter:"blur(0px)" }} exit={{ x:-30,opacity:0,filter:"blur(4px)" }} transition={{ duration:0.3 }} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-sans text-neutral-400 tracking-[0.12em] uppercase pl-1">Mobile Number</label>
                            <div className="rounded-xl overflow-hidden" style={{ border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)" }}>
                              <PhoneInput value={phoneValue} onChange={(v) => setPhoneValue(v??"")} placeholder="Enter phone number"
                                className="bg-transparent border-none text-white px-4 py-3.5 text-[15px] font-sans outline-none w-full" />
                            </div>
                          </div>
                          <PrimaryBtn onClick={onPhoneSend} disabled={isLoading}>
                            {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<><MessageSquare className="w-4 h-4"/><span>Send Code</span></>}
                          </PrimaryBtn>
                        </motion.div>
                      ) : (
                        <motion.div key="verify" initial={{ x:30,opacity:0,filter:"blur(4px)" }} animate={{ x:0,opacity:1,filter:"blur(0px)" }} exit={{ x:-30,opacity:0,filter:"blur(4px)" }} transition={{ duration:0.3 }} className="space-y-5">
                          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                            style={{ background:`rgba(${ACCENT_RGB},0.06)`, border:`1px solid rgba(${ACCENT_RGB},0.15)` }}>
                            <div>
                              <p className="text-[10px] text-neutral-500 font-sans uppercase tracking-wider mb-0.5">Code sent to</p>
                              <p className="text-sm text-white font-sans font-medium">{phoneNumber}</p>
                            </div>
                            <Timer secs={otpTimer}/>
                          </div>
                          <div>
                            <label className="text-[11px] font-sans text-neutral-400 tracking-[0.12em] uppercase pl-1 mb-3 block">
                              <ShieldCheck className="w-3.5 h-3.5 inline mr-1" style={{ color:ACCENT }}/> Enter OTP
                            </label>
                            <OTPInput value={otpValue} onChange={setOtpValue} accentColor={ACCENT} accentRgb={ACCENT_RGB} />
                          </div>
                          <PrimaryBtn onClick={onOTPSubmit} disabled={isLoading||otpValue.length<6}>
                            {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<><LogIn className="w-4 h-4"/><span>Verify & Sign In</span></>}
                          </PrimaryBtn>
                          <button type="button" onClick={() => { setPhoneState("idle"); setOtpValue(""); }}
                            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-sans transition-colors">← Change number</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center my-5">
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.07)" }}/>
              <span className="mx-4 text-[11px] font-sans text-neutral-600 tracking-widest uppercase">or</span>
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.07)" }}/>
            </div>

            <GoogleBtn onClick={handleGoogle} disabled={isLoading} />

            <p className="text-center text-sm text-neutral-500 font-sans mt-6">
              New here?{" "}
              <Link href="/auth/individual/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color:ACCENT }}>Create account</Link>
            </p>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-[1px]"
            style={{ background:`linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.3),transparent)` }} />
        </div>
      </motion.div>
    </div>
  );
}

export default function IndividualSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color:ACCENT }}/></div>}>
      <IndividualSignInContent />
    </Suspense>
  );
}
