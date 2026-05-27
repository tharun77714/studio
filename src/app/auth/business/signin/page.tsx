"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, ShieldCheck, MessageSquare, LogIn, ChevronRight } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PhoneInput } from "@/components/common/phone-input";
import { AuthLeftPanel } from "@/components/auth/layout/AuthLeftPanel";
import { AnimatedInput } from "@/components/auth/inputs/AnimatedInput";
import { OTPInput } from "@/components/auth/inputs/OTPInput";
import { staggerContainer, fadeUp, tabContent } from "@/components/auth/motion/variants";

// ─── Constants ──────────────────────────────────────────────────────────────
const ACCENT = "hsl(43 74% 66%)";
const ACCENT_RGB = "212,175,55";

// ─── Schemas ────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});
const phoneSendSchema = z.object({
  phone: z.string().refine((v) => isValidPhoneNumber(v), { message: "Invalid phone number." }),
});
const phoneVerifySchema = z.object({
  code: z.string().length(6, "Enter 6 digits.").regex(/^\d+$/, "Digits only."),
});

type EmailForm = z.infer<typeof emailSchema>;
type PhoneSendForm = z.infer<typeof phoneSendSchema>;
type PhoneVerifyForm = z.infer<typeof phoneVerifySchema>;

// ─── Shimmer Button ──────────────────────────────────────────────────────────
function ShimmerButton({
  children,
  onClick,
  disabled,
  type = "button",
  accentColor = ACCENT,
  accentRgb = ACCENT_RGB,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  accentColor?: string;
  accentRgb?: string;
  className?: string;
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    }
    onClick?.();
  };

  return (
    <motion.button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`
        relative w-full h-12 rounded-xl font-sans font-semibold text-sm
        overflow-hidden cursor-pointer select-none
        transition-shadow duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb},0.9) 0%, rgba(${accentRgb},0.7) 100%)`,
        color: "#050505",
        boxShadow: `0 4px 20px rgba(${accentRgb},0.3), 0 1px 0 rgba(255,255,255,0.15) inset`,
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)`,
          backgroundSize: "200% 100%",
        }}
        initial={{ backgroundPosition: "200% 0" }}
        whileHover={{ backgroundPosition: ["-200% 0", "200% 0"] }}
        transition={{ duration: 0.65, ease: "easeInOut" }}
      />

      {/* Ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            background: "rgba(255,255,255,0.4)",
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

// ─── Ghost Button ────────────────────────────────────────────────────────────
function GhostButton({
  children,
  onClick,
  disabled,
  type = "button",
  accentRgb = ACCENT_RGB,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  accentRgb?: string;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full h-12 rounded-xl font-sans font-medium text-sm text-white overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{ background: `rgba(${accentRgb},0.06)` }}
        transition={{ duration: 0.2 }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {children}
      </span>
    </motion.button>
  );
}

// ─── Tab Pill ────────────────────────────────────────────────────────────────
function TabPill({
  tabs,
  active,
  onChange,
  accentColor = ACCENT,
  accentRgb = ACCENT_RGB,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  accentColor?: string;
  accentRgb?: string;
}) {
  return (
    <div
      className="relative flex rounded-xl p-1 gap-1"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-sans font-medium z-10 transition-colors duration-200"
            style={{ color: isActive ? "#050505" : "rgba(156,163,175,0.9)" }}
          >
            {isActive && (
              <motion.div
                layoutId="business-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: accentColor }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="relative flex items-center my-5">
      <div className="flex-1 h-px bg-white/[0.07]" />
      <span className="mx-4 text-[11px] font-sans text-neutral-500 tracking-widest uppercase">
        or
      </span>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  );
}

// ─── Timer Display ───────────────────────────────────────────────────────────
function TimerDisplay({ seconds, accentColor }: { seconds: number; accentColor: string }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = (seconds / 300) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <motion.circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={75.4}
            strokeDashoffset={75.4 * (1 - pct / 100)}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
        </div>
      </div>
      <span className="text-xs font-sans tabular-nums" style={{ color: accentColor }}>
        {mins}:{secs < 10 ? "0" : ""}{secs}
      </span>
    </div>
  );
}

// ─── Main Sign In Content ───────────────────────────────────────────────────
function BusinessSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [tabDir, setTabDir] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneState, setPhoneState] = useState<"idle" | "code_sent">("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: "", password: "" } });

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) toast({ title: "Authentication Alert", description: err, variant: "destructive" });
  }, [searchParams, toast]);

  useEffect(() => {
    if (phoneState !== "code_sent" || otpTimer <= 0) {
      if (otpTimer === 0) {
        setPhoneState("idle");
        toast({ title: "OTP Expired", description: "Request a new code.", variant: "destructive" });
      }
      return;
    }
    const t = setInterval(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [phoneState, otpTimer, toast]);

  const switchTab = (tab: "email" | "phone") => {
    setTabDir(tab === "phone" ? 1 : -1);
    setActiveTab(tab);
  };

  async function onEmailSubmit(data: EmailForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, expectedRole: "business" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Invalid credentials.");
      await refreshProfile(result);
      toast({ title: "Welcome back!", description: "Accessing your Business Dashboard." });
      router.push("/dashboard");
    } catch (e: any) {
      toast({ title: "Sign In Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onPhoneSend() {
    try {
      const parsed = phoneSendSchema.safeParse({ phone: phoneValue });
      if (!parsed.success) {
        toast({ title: "Invalid number", description: "Enter a valid phone number.", variant: "destructive" });
        return;
      }
      setIsLoading(true);
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not send OTP.");
      setPhoneNumber(phoneValue);
      setPhoneState("code_sent");
      setOtpTimer(300);
      setOtpValue("");
      toast({ title: "OTP Sent!", description: `Code sent to ${phoneValue}` });
    } catch (e: any) {
      toast({ title: "SMS Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onOTPSubmit() {
    try {
      const parsed = phoneVerifySchema.safeParse({ code: otpValue });
      if (!parsed.success) {
        toast({ title: "Invalid OTP", description: "Enter all 6 digits.", variant: "destructive" });
        return;
      }
      setIsLoading(true);
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, code: otpValue, expectedRole: "business" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "OTP verification failed.");
      await refreshProfile(result);
      toast({ title: "Verified!", description: "Accessing your business dashboard..." });
      router.push("/dashboard");
    } catch (e: any) {
      toast({ title: "Verification Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("Google Client ID not configured.");
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const params = new URLSearchParams({
        client_id: clientId, redirect_uri: redirectUri,
        response_type: "code", scope: "openid email profile",
        access_type: "offline", prompt: "select_account", state: "business",
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch (e: any) {
      toast({ title: "Google Sign In Failed", description: e.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#030303" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-[55%] relative flex-shrink-0">
        <AuthLeftPanel variant="business" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
        {/* Subtle right panel bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.02) 0%, transparent 60%)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-8"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <Link
                href="/"
                className="text-neutral-500 hover:text-neutral-300 text-xs font-sans transition-colors flex items-center gap-1"
              >
                Sparkle Studio
              </Link>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className="text-neutral-400 text-xs font-sans">Business Sign In</span>
            </motion.div>

            <motion.h2 variants={fadeUp} className="font-headline text-3xl font-bold text-white mb-2 tracking-tight">
              Sign in to your
              <span
                className="block"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, rgba(212,175,55,0.7))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                business account
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-neutral-500 font-sans text-sm">
              Access your Sparkle Studio business dashboard
            </motion.p>
          </motion.div>

          {/* Tab switcher */}
          <motion.div variants={fadeUp} initial="initial" animate="animate" className="mb-6">
            <TabPill
              tabs={[
                { id: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
                { id: "phone", label: "Phone OTP", icon: <Phone className="w-3.5 h-3.5" /> },
              ]}
              active={activeTab}
              onChange={(id) => switchTab(id as "email" | "phone")}
              accentColor={ACCENT}
              accentRgb={ACCENT_RGB}
            />
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait" custom={tabDir}>
            {activeTab === "email" ? (
              <motion.div
                key="email"
                custom={tabDir}
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <AnimatedInput
                    label="Business Email"
                    type="email"
                    icon={<Mail className="w-4 h-4" />}
                    accentColor={ACCENT}
                    accentRgb={ACCENT_RGB}
                    placeholder="contact@yourcompany.com"
                    error={emailForm.formState.errors.email?.message}
                    {...emailForm.register("email")}
                  />

                  <AnimatedInput
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    icon={<Lock className="w-4 h-4" />}
                    accentColor={ACCENT}
                    accentRgb={ACCENT_RGB}
                    placeholder="••••••••"
                    error={emailForm.formState.errors.password?.message}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    }
                    {...emailForm.register("password")}
                  />

                  <div className="flex justify-end">
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-sans transition-colors"
                      style={{ color: `rgba(${ACCENT_RGB},0.8)` }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <ShimmerButton type="submit" disabled={isLoading} accentColor={ACCENT} accentRgb={ACCENT_RGB}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign In <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </ShimmerButton>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="phone"
                custom={tabDir}
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <AnimatePresence mode="wait">
                  {phoneState === "idle" ? (
                    <motion.div
                      key="phone-send"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-sans text-neutral-400 tracking-wide uppercase pl-1">
                          Mobile Number
                        </label>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: "1.5px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <PhoneInput
                            value={phoneValue}
                            onChange={(v) => setPhoneValue(v ?? "")}
                            placeholder="Enter phone number"
                            className="bg-transparent border-none text-white px-4 py-3.5 text-[15px] font-sans outline-none w-full"
                          />
                        </div>
                      </div>
                      <ShimmerButton onClick={onPhoneSend} disabled={isLoading} accentColor={ACCENT} accentRgb={ACCENT_RGB}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4" /> Send Verification Code</>}
                      </ShimmerButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phone-verify"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      <div
                        className="rounded-xl px-4 py-3 flex items-center justify-between"
                        style={{ background: `rgba(${ACCENT_RGB},0.06)`, border: `1px solid rgba(${ACCENT_RGB},0.15)` }}
                      >
                        <div>
                          <p className="text-[10px] text-neutral-500 font-sans uppercase tracking-wider mb-0.5">Code sent to</p>
                          <p className="text-sm text-white font-sans font-medium">{phoneNumber}</p>
                        </div>
                        <TimerDisplay seconds={otpTimer} accentColor={ACCENT} />
                      </div>

                      <div>
                        <label className="text-xs font-sans text-neutral-400 tracking-wide uppercase pl-1 mb-3 block">
                          <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" style={{ color: ACCENT }} />
                          Enter 6-digit OTP
                        </label>
                        <OTPInput
                          value={otpValue}
                          onChange={setOtpValue}
                          accentColor={ACCENT}
                          accentRgb={ACCENT_RGB}
                        />
                      </div>

                      <ShimmerButton onClick={onOTPSubmit} disabled={isLoading || otpValue.length < 6} accentColor={ACCENT} accentRgb={ACCENT_RGB}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Verify & Sign In</>}
                      </ShimmerButton>

                      <button
                        type="button"
                        onClick={() => { setPhoneState("idle"); setOtpValue(""); }}
                        className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-sans transition-colors"
                      >
                        ← Change number or resend
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google divider */}
          <OrDivider />

          <GhostButton onClick={handleGoogleSignIn} disabled={isLoading} accentRgb={ACCENT_RGB}>
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.473 6.564l3.793 3.201z"/>
              <path fill="#34A853" d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173-2.927 0-5.41-1.982-6.29-4.654L1.908 15.05C3.89 19.064 8.01 21.818 12 21.818c3.218 0 6.073-1.055 8.1-2.873l-4.06-3.6z"/>
              <path fill="#4285F4" d="M23.49 12.273c0-.8-.073-1.573-.209-2.318H12v4.545h6.455a5.527 5.527 0 0 1-2.4 3.636l4.06 3.6c2.373-2.182 3.764-5.4 3.764-9.463z"/>
              <path fill="#FBBC05" d="M5.71 11.864c-.236-.727-.373-1.509-.373-2.318s.137-1.59.373-2.318L1.917 4.027A11.956 11.956 0 0 0 0 9.545c0 2.01.5 3.91 1.382 5.609l4.327-3.29z"/>
            </svg>
            Continue with Google Workspace
          </GhostButton>

          {/* Footer */}
          <p className="text-center text-sm text-neutral-500 font-sans mt-6">
            Don&apos;t have a business account?{" "}
            <Link
              href="/auth/business/signup"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: ACCENT }}
            >
              Register now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function BusinessSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        </div>
      }
    >
      <BusinessSignInContent />
    </Suspense>
  );
}
