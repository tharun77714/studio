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
import {
  Loader2, Building, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  FileText, MapPin, User, Phone, CheckCircle, Gem,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/common/phone-input";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { AnimatedInput } from "@/components/auth/inputs/AnimatedInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ACCENT = "hsl(43 74% 66%)";
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
  businessName: z.string().min(2, "Business name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  gstNumber: z.string().min(15).max(15).regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format."),
  businessAddressText: z.string().min(10, "Business address is required."),
  businessAddressLat: z.number().optional(),
  businessAddressLng: z.number().optional(),
  businessPincode: z.string().min(1, "Pincode is required."),
  contactPersonName: z.string().min(2, "Contact name is required."),
  contactPhoneNumber: z.string().refine((v) => isValidPhoneNumber(v), { message: "Invalid phone number." }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match.", path: ["confirmPassword"] });

type FormValues = z.infer<typeof schema>;

// ─── Shimmer Button ──────────────────────────────────────────────────────────
function ShimmerButton({
  children, onClick, disabled, type = "button", variant = "primary",
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: "button" | "submit"; variant?: "primary" | "ghost";
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const ref = useRef<HTMLButtonElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      setRipples((p) => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 700);
    }
    onClick?.();
  };
  return (
    <motion.button
      ref={ref} type={type} disabled={disabled} onClick={handleClick}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className="relative h-12 w-full rounded-xl font-sans font-semibold text-[13px] overflow-hidden cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-5"
      style={
        variant === "primary"
          ? {
              background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.95), rgba(${ACCENT_RGB},0.65))`,
              color: "#0a0700",
              boxShadow: `0 6px 28px rgba(${ACCENT_RGB},0.35),0 1px 0 rgba(255,255,255,0.18) inset`,
            }
          : {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
            }
      }
    >
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.38) 50%, transparent 70%)", backgroundSize: "200% 100%" }}
          initial={{ backgroundPosition: "200% 0" }}
          whileHover={{ backgroundPosition: ["-200% 0", "200% 0"] }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
      {ripples.map((r) => (
        <motion.span key={r.id} className="absolute rounded-full pointer-events-none"
          style={{ left: r.x, top: r.y, width: 8, height: 8, marginLeft: -4, marginTop: -4, background: variant === "primary" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)" }}
          initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 22, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} />
      ))}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Account", icon: Mail },
  { label: "Business", icon: Building },
  { label: "Contact", icon: User },
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
                  background: done
                    ? `rgba(${ACCENT_RGB},1)`
                    : active
                    ? `rgba(${ACCENT_RGB},0.2)`
                    : "rgba(255,255,255,0.06)",
                  borderColor: done || active
                    ? `rgba(${ACCENT_RGB},0.8)`
                    : "rgba(255,255,255,0.12)",
                }}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
              >
                {done ? (
                  <CheckCircle className="w-4 h-4" style={{ color: "#0a0700" }} />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: done ? "#0a0700" : active ? ACCENT : "rgba(107,114,128,1)" }} />
                )}
              </motion.div>
              <span
                className="text-[10px] font-sans tracking-wide"
                style={{ color: active ? ACCENT : done ? "rgba(255,255,255,0.6)" : "rgba(107,114,128,0.8)" }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 relative overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: ACCENT }}
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
  initial: { x: dir * 60, opacity: 0, rotateY: dir * 8, filter: "blur(4px)" },
  animate: { x: 0, opacity: 1, rotateY: 0, filter: "blur(0px)", transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { x: dir * -60, opacity: 0, rotateY: dir * -8, filter: "blur(4px)", transition: { duration: 0.26 } },
});

export default function BusinessSignUpPage() {
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
      businessName: "", email: "", password: "", confirmPassword: "",
      gstNumber: "", businessAddressText: "", businessPincode: "", contactPersonName: "", contactPhoneNumber: "",
    },
    mode: "onChange",
  });

  const goNext = async () => {
    let valid = false;
    if (step === 0) valid = await form.trigger(["businessName", "email", "password", "confirmPassword"]);
    if (step === 1) valid = await form.trigger(["gstNumber", "businessAddressText", "businessPincode"]);
    if (valid) { setDir(1); setStep((s) => s + 1); }
  };

  const goBack = () => { setDir(-1); setStep((s) => s - 1); };

  const handlePlaceSelected = (place: { address: string; latitude: number; longitude: number; pincode?: string } | null) => {
    if (place) {
      form.setValue("businessAddressText", place.address, { shouldValidate: true });
      form.setValue("businessAddressLat", place.latitude, { shouldValidate: true });
      form.setValue("businessAddressLng", place.longitude, { shouldValidate: true });
      if (place.pincode) form.setValue("businessPincode", place.pincode, { shouldValidate: true });
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup-business", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to sign up.");
      if (result.user) {
        toast({ title: "Business Account Created!", description: "Welcome to Sparkle Studio. Please sign in." });
        router.push("/auth/business/signin");
      }
    } catch (e: any) {
      toast({ title: "Registration Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const w = form.watch();

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4">
      {/* Full-screen aurora */}
      <AuroraBackground variant="gold" className="fixed" />

      {/* Centered card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[480px] my-8"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "rgba(10,8,5,0.72)",
            backdropFilter: "blur(28px) saturate(1.4)",
            border: "1px solid rgba(212,175,55,0.18)",
            boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(212,175,55,0.2) inset`,
          }}
        >
          {/* Top gold rim */}
          <div className="absolute top-0 inset-x-0 h-[1.5px]"
            style={{ background: `linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.7),transparent)` }} />

          <div className="px-8 pt-9 pb-8">
            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `rgba(${ACCENT_RGB},0.15)`, border: `1px solid rgba(${ACCENT_RGB},0.3)` }}>
                <Gem className="w-4.5 h-4.5" style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="text-white text-sm font-semibold font-headline tracking-wide">Sparkle Studio</div>
                <div className="text-[10px] font-sans tracking-[0.15em] uppercase" style={{ color: `rgba(${ACCENT_RGB},0.7)` }}>Business Portal</div>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="mb-7">
              <h1 className="font-headline text-[28px] font-bold leading-tight tracking-tight mb-1.5"
                style={{ background: `linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.7) 55%,rgba(${ACCENT_RGB},0.65) 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Business Registration
              </h1>
              <p className="text-neutral-500 text-sm font-sans">Create your business account in 3 steps</p>
            </motion.div>

            {/* Step progress */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
              <StepProgress step={step} />
            </motion.div>

            {/* ── Sliding step content ── */}
            <div style={{ perspective: "900px" }}>
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
                      <AnimatedInput
                        label="Business Name"
                        icon={<Building className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="Your Company Inc."
                        error={form.formState.errors.businessName?.message}
                        {...form.register("businessName")}
                      />
                      <AnimatedInput
                        label="Business Email"
                        type="email"
                        icon={<Mail className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="contact@yourcompany.com"
                        error={form.formState.errors.email?.message}
                        {...form.register("email")}
                      />
                      <AnimatedInput
                        label="Password"
                        type={showPw ? "text" : "password"}
                        icon={<Lock className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="Min. 8 characters"
                        error={form.formState.errors.password?.message}
                        rightElement={
                          <button type="button" onClick={() => setShowPw(!showPw)} className="text-neutral-400 hover:text-white transition-colors">
                            {showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        }
                        {...form.register("password")}
                      />
                      <AnimatedInput
                        label="Confirm Password"
                        type={showCPw ? "text" : "password"}
                        icon={<Lock className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="Re-enter password"
                        error={form.formState.errors.confirmPassword?.message}
                        rightElement={
                          <button type="button" onClick={() => setShowCPw(!showCPw)} className="text-neutral-400 hover:text-white transition-colors">
                            {showCPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        }
                        {...form.register("confirmPassword")}
                      />
                      <div className="pt-2">
                        <ShimmerButton onClick={goNext} type="button" variant="primary">
                          <span>Continue</span> <ArrowRight className="w-4 h-4" />
                        </ShimmerButton>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 1: Business Details ── */}
                  {step === 1 && (
                    <motion.div key="step1" custom={dir}
                      variants={{ initial: slide(dir).initial, animate: slide(1).animate, exit: slide(dir).exit }}
                      initial="initial" animate="animate" exit="exit"
                      style={{ transformStyle: "preserve-3d" }}
                      className="space-y-4"
                    >
                      <AnimatedInput
                        label="GST Number"
                        icon={<FileText className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="e.g. 29ABCDE1234F1Z5"
                        error={form.formState.errors.gstNumber?.message}
                        {...form.register("gstNumber")}
                      />

                      <div className="space-y-2">
                        <label className="text-[11px] font-sans text-neutral-400 tracking-[0.12em] uppercase pl-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Business Address
                        </label>
                        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                          <DynamicAddressAutocompleteInput
                            onPlaceSelectedAction={handlePlaceSelected}
                            initialValue={w.businessAddressText}
                            placeholder="Search your business address"
                          />
                        </div>
                        {form.formState.errors.businessAddressText && (
                          <p className="text-xs text-red-400 pl-1">{form.formState.errors.businessAddressText.message}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMapOpen(true)}
                          className="flex items-center justify-center gap-2 text-xs font-sans transition-colors px-3 py-2.5 rounded-lg w-full"
                          style={{ color: `rgba(${ACCENT_RGB},0.85)`, background: `rgba(${ACCENT_RGB},0.06)`, border: `1px solid rgba(${ACCENT_RGB},0.15)` }}
                        >
                          <MapPin className="w-3.5 h-3.5" /> Pick location on map
                        </button>
                      </div>

                      <AnimatedInput
                        label="Pincode"
                        icon={<MapPin className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="Enter pincode"
                        error={form.formState.errors.businessPincode?.message}
                        {...form.register("businessPincode")}
                      />

                      <div className="flex gap-3 pt-2">
                        <div className="w-1/3">
                          <ShimmerButton onClick={goBack} type="button" variant="ghost">
                            <ArrowLeft className="w-4 h-4" /> <span>Back</span>
                          </ShimmerButton>
                        </div>
                        <div className="w-2/3">
                          <ShimmerButton onClick={goNext} type="button" variant="primary">
                            <span>Continue</span> <ArrowRight className="w-4 h-4" />
                          </ShimmerButton>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Contact & Confirm ── */}
                  {step === 2 && (
                    <motion.div key="step2" custom={dir}
                      variants={{ initial: slide(dir).initial, animate: slide(1).animate, exit: slide(dir).exit }}
                      initial="initial" animate="animate" exit="exit"
                      style={{ transformStyle: "preserve-3d" }}
                      className="space-y-4"
                    >
                      <AnimatedInput
                        label="Contact Person Name"
                        icon={<User className="w-4 h-4" />}
                        accentColor={ACCENT} accentRgb={ACCENT_RGB}
                        placeholder="e.g. Jane Doe"
                        error={form.formState.errors.contactPersonName?.message}
                        {...form.register("contactPersonName")}
                      />

                      <div className="space-y-2">
                        <label className="text-[11px] font-sans text-neutral-400 tracking-[0.12em] uppercase pl-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Contact Phone
                        </label>
                        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                          <PhoneInput
                            value={phoneValue}
                            onChange={(v) => {
                              setPhoneValue(v ?? "");
                              form.setValue("contactPhoneNumber", v ?? "", { shouldValidate: true });
                            }}
                            placeholder="Enter phone number"
                            className="bg-transparent border-none text-white px-4 py-3.5 text-[15px] font-sans outline-none w-full"
                          />
                        </div>
                        {form.formState.errors.contactPhoneNumber && (
                          <p className="text-xs text-red-400 pl-1">{form.formState.errors.contactPhoneNumber.message}</p>
                        )}
                      </div>

                      {/* Summary card */}
                      <div className="rounded-xl p-4 space-y-2 mt-2"
                        style={{ background: `rgba(${ACCENT_RGB},0.04)`, border: `1px solid rgba(${ACCENT_RGB},0.12)` }}>
                        <p className="text-[10px] text-neutral-500 font-sans uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Gem className="w-3 h-3" style={{ color: ACCENT }} /> Summary
                        </p>
                        {[
                          { label: "Business", value: w.businessName },
                          { label: "Email", value: w.email },
                          { label: "GST", value: w.gstNumber },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between text-xs font-sans">
                            <span className="text-neutral-500">{row.label}</span>
                            <span className="text-neutral-300 truncate max-w-[60%] text-right font-medium">{row.value || "—"}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <div className="w-1/3">
                          <ShimmerButton onClick={goBack} type="button" variant="ghost">
                            <ArrowLeft className="w-4 h-4" /> <span>Back</span>
                          </ShimmerButton>
                        </div>
                        <div className="w-2/3">
                          <ShimmerButton type="submit" disabled={isLoading} variant="primary">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span> <CheckCircle className="w-4 h-4" /></>}
                          </ShimmerButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-neutral-500 font-sans mt-8">
              Already have an account?{" "}
              <Link href="/auth/business/signin" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
                Sign In
              </Link>
            </p>
          </div>

          {/* Bottom gold rim */}
          <div className="absolute bottom-0 inset-x-0 h-[1px]"
            style={{ background: `linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.3),transparent)` }} />
        </div>
      </motion.div>

      {/* Map dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Select Store Location</DialogTitle>
            <DialogDescription className="text-neutral-400">Pin your exact business location on the map.</DialogDescription>
          </DialogHeader>
          {StoreLocationPicker && (
            <StoreLocationPicker
              initialLocation={w.businessAddressLat && w.businessAddressLng ? { lat: w.businessAddressLat, lng: w.businessAddressLng } : undefined}
              onLocationSelectAction={(loc) => {
                form.setValue("businessAddressLat", loc.lat, { shouldValidate: true });
                form.setValue("businessAddressLng", loc.lng, { shouldValidate: true });
                if (loc.address) form.setValue("businessAddressText", loc.address, { shouldValidate: true });
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
