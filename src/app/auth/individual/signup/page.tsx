"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isValidPhoneNumber } from "react-phone-number-input";
import dynamic from "next/dynamic";
import React from "react";
import {
  Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  MapPin, Phone, CheckCircle, Sparkles, Gem,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/common/phone-input";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ACCENT = "hsl(43 74% 66%)"; // Champagne Gold
const ACCENT_RGB = "212,175,55";

const DynamicAddressAutocompleteInput = dynamic(
  () => import("@/components/common/address-autocomplete-input").then((m) => m.AddressAutocompleteInput),
  { ssr: false }
);
const StoreLocationPicker = dynamic(
  () => import("@/components/networks/StoreLocationPicker").then((m) => m.StoreLocationPicker),
  { ssr: false }
);

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  defaultShippingAddressText: z.string().optional(),
  defaultShippingAddressLat: z.number().optional(),
  defaultShippingAddressLng: z.number().optional(),
  defaultShippingAddressPincode: z.string().optional(),
  individualPhoneNumber: z.string().refine((v) => isValidPhoneNumber(v), { message: "Invalid phone number." }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match.", path: ["confirmPassword"] });

type FormValues = z.infer<typeof schema>;

// ─── Minimal Luxury Input ───────────────────────────────────────────────────
const LuxuryInput = React.forwardRef<HTMLInputElement, any>(({ label, icon, error, ...props }, ref) => {
  return (
    <div className="space-y-1.5 relative group">
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
          className={`w-full bg-black/[0.02] border ${error ? "border-red-400" : "border-black/[0.08]"} rounded-xl py-3 pl-10 pr-10 text-[14px] font-sans text-[#0a0700] placeholder:text-neutral-400/80 outline-none transition-all duration-300 focus:bg-white/50 focus:border-[${ACCENT}] focus:ring-4 focus:ring-[${ACCENT}]/10 shadow-[0_2px_10px_rgba(0,0,0,0.01)_inset]`}
        />
        {props.rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
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
function LuxuryBtn({ children, onClick, disabled, type = "button", variant = "primary" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; variant?: "primary" | "ghost" }) {
  return (
    <motion.button
      type={type} disabled={disabled} onClick={onClick}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`relative w-full h-12 rounded-xl font-sans font-semibold text-[13px] overflow-hidden cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 ${variant === "primary" ? "shadow-[0_8px_30px_rgba(0,0,0,0.12)]" : ""}`}
      style={variant === "primary" ? { background: "#0a0700", color: "#ffffff" } : { background: "rgba(0,0,0,0.04)", color: "#0a0700", border: "1px solid rgba(0,0,0,0.1)" }}
    >
      {variant === "primary" && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Account", icon: User },
  { label: "Personal", icon: MapPin },
  { label: "Confirm", icon: CheckCircle },
];

function StepProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done ? "#0a0700" : active ? "rgba(0,0,0,0.05)" : "transparent",
                  borderColor: done || active ? "#0a0700" : "rgba(0,0,0,0.1)",
                }}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: active ? "#0a0700" : "rgba(0,0,0,0.4)" }} />
                )}
              </motion.div>
              <span
                className="text-[10px] font-sans tracking-wide font-medium"
                style={{ color: active ? "#0a0700" : done ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 relative overflow-hidden rounded-full bg-black/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#0a0700]"
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────
const slide = (dir: number) => ({
  initial: { x: dir * 40, opacity: 0, rotateY: dir * 4, filter: "blur(4px)" },
  animate: { x: 0, opacity: 1, rotateY: 0, filter: "blur(0px)", transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { x: dir * -40, opacity: 0, rotateY: dir * -4, filter: "blur(4px)", transition: { duration: 0.26 } },
});

export default function IndividualSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "", email: "", password: "", confirmPassword: "",
      defaultShippingAddressText: "", defaultShippingAddressPincode: "", individualPhoneNumber: "",
    },
    mode: "onChange",
  });

  const goNext = async () => {
    let valid = false;
    if (step === 0) valid = await form.trigger(["fullName", "email", "password", "confirmPassword"]);
    if (step === 1) valid = await form.trigger(["individualPhoneNumber"]);
    if (valid) { setDir(1); setStep((s) => s + 1); }
  };

  const goBack = () => { setDir(-1); setStep((s) => s - 1); };

  const handlePlaceSelected = (place: { address: string; latitude: number; longitude: number; pincode?: string } | null) => {
    if (place) {
      form.setValue("defaultShippingAddressText", place.address, { shouldValidate: true });
      form.setValue("defaultShippingAddressLat", place.latitude, { shouldValidate: true });
      form.setValue("defaultShippingAddressLng", place.longitude, { shouldValidate: true });
      if (place.pincode) form.setValue("defaultShippingAddressPincode", place.pincode, { shouldValidate: true });
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup-individual", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to sign up.");
      if (result.user) {
        toast({ title: "Account Created!", description: "Welcome to Sparkle Studio. Please sign in." });
        router.push("/auth/individual/signin");
      }
    } catch (e: any) {
      toast({ title: "Registration Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const w = form.watch();

  const metallicBase = `linear-gradient(145deg, rgba(${ACCENT_RGB}, 0.8) 0%, rgba(${ACCENT_RGB}, 0.4) 50%, rgba(10,10,10,0.9) 100%)`;
  const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 selection:bg-[#0a0700] selection:text-white">
      {/* Full-screen aurora */}
      <AuroraBackground variant="gold" className="fixed" />

      {/* Cinematic Diagonal Card Shell */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[460px] my-8 min-h-[600px] rounded-[32px] overflow-hidden"
        style={{
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset`,
        }}
      >
        {/* Background Layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: metallicBase }}>
          <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: noiseTexture }} />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full h-full p-8 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.05]">
              <Gem className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-[#0a0700] text-sm font-semibold font-headline tracking-wide">Sparkle Studio</div>
              <div className="text-[9px] font-sans tracking-[0.2em] uppercase text-[#0a0700]/60">Personal Account</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold leading-tight tracking-tighter text-[#0a0700] mb-2">
              Join Sparkle
            </h1>
            <p className="text-[#0a0700]/60 text-[13px] font-sans font-medium">Discover luxury jewelry in 3 steps</p>
          </div>

          {/* Step progress */}
          <StepProgress step={step} />

          {/* ── Sliding step content ── */}
          <div className="flex-1" style={{ perspective: "900px" }}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait" custom={dir}>
                {/* ── Step 0: Account Info ── */}
                {step === 0 && (
                  <motion.div key="step0" custom={dir}
                    variants={{ initial: slide(dir).initial, animate: slide(1).animate, exit: slide(dir).exit }}
                    initial="initial" animate="animate" exit="exit"
                    style={{ transformStyle: "preserve-3d" }}
                    className="space-y-4"
                  >
                    <LuxuryInput
                      label="Full Name" icon={<User className="w-4 h-4" />}
                      placeholder="e.g. Alex Smith" error={form.formState.errors.fullName?.message}
                      {...form.register("fullName")}
                    />
                    <LuxuryInput
                      label="Email Address" type="email" icon={<Mail className="w-4 h-4" />}
                      placeholder="you@example.com" error={form.formState.errors.email?.message}
                      {...form.register("email")}
                    />
                    <LuxuryInput
                      label="Password" type={showPw ? "text" : "password"} icon={<Lock className="w-4 h-4" />}
                      placeholder="Min. 8 characters" error={form.formState.errors.password?.message}
                      rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-[#0a0700]/50 hover:text-[#0a0700] transition-colors">{showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>}
                      {...form.register("password")}
                    />
                    <LuxuryInput
                      label="Confirm Password" type={showCPw ? "text" : "password"} icon={<Lock className="w-4 h-4" />}
                      placeholder="Re-enter password" error={form.formState.errors.confirmPassword?.message}
                      rightElement={<button type="button" onClick={() => setShowCPw(!showCPw)} className="text-[#0a0700]/50 hover:text-[#0a0700] transition-colors">{showCPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>}
                      {...form.register("confirmPassword")}
                    />
                    <div className="pt-2">
                      <LuxuryBtn onClick={goNext} type="button" variant="primary">
                        <span>Continue</span> <ArrowRight className="w-4 h-4" />
                      </LuxuryBtn>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 1: Personal Details ── */}
                {step === 1 && (
                  <motion.div key="step1" custom={dir}
                    variants={{ initial: slide(dir).initial, animate: slide(1).animate, exit: slide(dir).exit }}
                    initial="initial" animate="animate" exit="exit"
                    style={{ transformStyle: "preserve-3d" }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-semibold pl-1 flex items-center gap-1.5">
                        Phone Number
                      </label>
                      <div className="bg-black/[0.02] border border-black/[0.08] rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.01)_inset] focus-within:bg-white/50 focus-within:border-[#0a0700]/20 transition-all">
                        <PhoneInput
                          value={phoneValue}
                          onChange={(v) => { setPhoneValue(v ?? ""); form.setValue("individualPhoneNumber", v ?? "", { shouldValidate: true }); }}
                          placeholder="Enter phone number"
                          className="bg-transparent border-none text-[#0a0700] px-4 py-3.5 text-[15px] font-sans outline-none w-full placeholder:text-neutral-400"
                        />
                      </div>
                      {form.formState.errors.individualPhoneNumber && (
                        <p className="text-[10px] text-red-500 pl-1">{form.formState.errors.individualPhoneNumber.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-semibold pl-1 flex items-center gap-1.5">
                        Shipping Address <span className="text-neutral-400 font-medium normal-case tracking-normal ml-1">(Optional)</span>
                      </label>
                      <div className="bg-black/[0.02] border border-black/[0.08] rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.01)_inset] focus-within:bg-white/50 focus-within:border-[#0a0700]/20 transition-all">
                        <DynamicAddressAutocompleteInput
                          onPlaceSelectedAction={handlePlaceSelected}
                          initialValue={w.defaultShippingAddressText}
                          placeholder="Search your address"
                        />
                      </div>
                      <button
                        type="button" onClick={() => setIsMapOpen(true)}
                        className="flex items-center justify-center gap-2 text-[11px] font-sans font-semibold transition-colors px-3 py-2.5 rounded-lg w-full text-[#0a0700]/70 bg-black/[0.03] hover:bg-black/[0.05] border border-black/[0.05]"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Pick location on map
                      </button>
                    </div>

                    <LuxuryInput
                      label="Pincode (Optional)" icon={<MapPin className="w-4 h-4" />}
                      placeholder="Enter pincode" error={form.formState.errors.defaultShippingAddressPincode?.message}
                      {...form.register("defaultShippingAddressPincode")}
                    />

                    <div className="flex gap-3 pt-2">
                      <div className="w-1/3">
                        <LuxuryBtn onClick={goBack} type="button" variant="ghost">
                          <ArrowLeft className="w-4 h-4" />
                        </LuxuryBtn>
                      </div>
                      <div className="w-2/3">
                        <LuxuryBtn onClick={goNext} type="button" variant="primary">
                          <span>Continue</span> <ArrowRight className="w-4 h-4" />
                        </LuxuryBtn>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Confirmation ── */}
                {step === 2 && (
                  <motion.div key="step2" custom={dir}
                    variants={{ initial: slide(dir).initial, animate: slide(1).animate, exit: slide(dir).exit }}
                    initial="initial" animate="animate" exit="exit"
                    style={{ transformStyle: "preserve-3d" }}
                    className="space-y-5"
                  >
                    {/* Summary */}
                    <div className="rounded-xl p-5 space-y-3 bg-black/[0.03] border border-black/[0.06]">
                      <p className="text-[9px] text-[#0a0700]/50 font-sans uppercase tracking-widest flex items-center gap-1.5 mb-1 font-bold">
                        <Sparkles className="w-3 h-3" style={{ color: ACCENT }} /> Account Summary
                      </p>
                      {[
                        { label: "Name", value: w.fullName },
                        { label: "Email", value: w.email },
                        { label: "Phone", value: w.individualPhoneNumber || phoneValue || "—" },
                        { label: "Address", value: w.defaultShippingAddressText || "Not provided" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between text-[11px] font-sans gap-4 font-medium">
                          <span className="text-[#0a0700]/50 shrink-0">{row.label}</span>
                          <span className="text-[#0a0700] text-right truncate max-w-[70%]">{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2.5">
                      {["Discover 50,000+ authenticated pieces", "Expert certification on every item", "Free returns within 30 days"].map((b) => (
                        <div key={b} className="flex items-center gap-2.5 text-[11px] font-sans font-medium text-[#0a0700]/70">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border border-black/[0.05]" style={{ background: `rgba(${ACCENT_RGB},0.15)` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                          </div>
                          {b}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <div className="w-1/3">
                        <LuxuryBtn onClick={goBack} type="button" variant="ghost">
                          <ArrowLeft className="w-4 h-4" />
                        </LuxuryBtn>
                      </div>
                      <div className="w-2/3">
                        <LuxuryBtn type="submit" disabled={isLoading} variant="primary">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span> <Sparkles className="w-4 h-4" /></>}
                        </LuxuryBtn>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center pt-4">
            <p className="text-[12px] font-sans text-[#0a0700]/70 font-medium">
              Already have an account?{" "}
              <Link href="/auth/individual/signin" className="text-[#0a0700] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Map dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Select Location</DialogTitle>
            <DialogDescription className="text-neutral-400">Pick your exact location on the map.</DialogDescription>
          </DialogHeader>
          {StoreLocationPicker && (
            <StoreLocationPicker
              initialLocation={w.defaultShippingAddressLat && w.defaultShippingAddressLng ? { lat: w.defaultShippingAddressLat!, lng: w.defaultShippingAddressLng! } : undefined}
              onLocationSelectAction={(loc) => {
                form.setValue("defaultShippingAddressLat", loc.lat, { shouldValidate: true });
                form.setValue("defaultShippingAddressLng", loc.lng, { shouldValidate: true });
                if (loc.address) form.setValue("defaultShippingAddressText", loc.address, { shouldValidate: true });
                setIsMapOpen(false);
              }}
            />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="text-neutral-400 hover:text-white">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
