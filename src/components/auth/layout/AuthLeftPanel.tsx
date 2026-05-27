"use client";

import React from "react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/auth/visuals/AuroraBackground";
import { panelEntry, panelChild, floatAnimation, floatAnimationSlow } from "@/components/auth/motion/variants";
import { Gem, Sparkles, TrendingUp, Shield, Star, Users } from "lucide-react";

interface AuthLeftPanelProps {
  variant: "business" | "individual";
}

const BUSINESS_CONTENT = {
  badge: "B2B Commerce Platform",
  headline: "Power Your\nJewelry Business",
  subtext:
    "Join 2,400+ jewelry businesses using Sparkle Studio to manage inventory, connect with suppliers, and grow revenue.",
  accent: "hsl(43 74% 66%)",
  accentRgb: "212,175,55",
  stats: [
    { value: "₹2.4Cr+", label: "GMV Processed" },
    { value: "2,400+", label: "Businesses" },
    { value: "99.9%", label: "Uptime" },
  ],
  testimonial: {
    quote: "Sparkle Studio transformed how we manage our wholesale operations. Revenue up 3× in 8 months.",
    author: "Priya Mehta",
    role: "CEO, Mehta Jewels Pvt. Ltd.",
    avatar: "PM",
  },
  features: ["Real-time inventory sync", "GST-compliant billing", "Supplier network access"],
  Icon: TrendingUp,
};

const INDIVIDUAL_CONTENT = {
  badge: "Luxury Jewelry Discovery",
  headline: "Your Sparkle\nAwaits You",
  subtext:
    "Discover curated luxury jewelry from India's finest craftsmen. Authenticate, verify, and own with confidence.",
  accent: "hsl(262 83% 68%)",
  accentRgb: "139,92,246",
  stats: [
    { value: "50K+", label: "Pieces Listed" },
    { value: "4.9★", label: "Avg Rating" },
    { value: "100%", label: "Authenticated" },
  ],
  testimonial: {
    quote: "Found my dream wedding necklace here. The authentication process gave me complete peace of mind.",
    author: "Ananya Kapoor",
    role: "Verified Buyer, Mumbai",
    avatar: "AK",
  },
  features: ["Blockchain authentication", "Expert certification", "Free returns within 30 days"],
  Icon: Star,
};

export function AuthLeftPanel({ variant }: AuthLeftPanelProps) {
  const content = variant === "business" ? BUSINESS_CONTENT : INDIVIDUAL_CONTENT;
  const { accent, accentRgb, Icon } = content;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-10 lg:p-14">
      {/* Aurora background */}
      <AuroraBackground variant={variant === "business" ? "gold" : "violet"} />

      {/* Content */}
      <motion.div
        variants={panelEntry}
        initial="initial"
        animate="animate"
        className="relative z-30 flex flex-col h-full justify-between"
      >
        {/* Top: Logo + Badge */}
        <motion.div variants={panelChild} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(${accentRgb},0.3), rgba(${accentRgb},0.1))`,
                border: `1px solid rgba(${accentRgb},0.4)`,
                boxShadow: `0 4px 20px rgba(${accentRgb},0.2)`,
              }}
            >
              <Gem className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-white font-headline text-sm font-semibold tracking-wide">
                Sparkle Studio
              </div>
              <div className="text-[10px] font-sans tracking-[0.15em] uppercase" style={{ color: `rgba(${accentRgb},0.8)` }}>
                {content.badge}
              </div>
            </div>
          </div>

          {/* Live badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[10px] text-neutral-400 font-sans tracking-wide">Live</span>
          </div>
        </motion.div>

        {/* Center: Hero headline */}
        <motion.div variants={panelChild} className="flex-1 flex flex-col justify-center py-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 w-fit"
            style={{
              background: `rgba(${accentRgb},0.1)`,
              border: `1px solid rgba(${accentRgb},0.25)`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-xs font-sans font-medium" style={{ color: accent }}>
              {variant === "business" ? "Trusted by top jewelers" : "India's #1 luxury jewelry platform"}
            </span>
          </div>

          <h1
            className="font-headline text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-[-0.03em] mb-5"
            style={{
              background: `linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.7) 60%, rgba(${accentRgb},0.6) 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              whiteSpace: "pre-line",
            }}
          >
            {content.headline}
          </h1>

          <p className="text-neutral-400 font-sans text-base leading-relaxed max-w-sm">
            {content.subtext}
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-2 mt-6">
            {content.features.map((feat, i) => (
              <motion.div
                key={feat}
                variants={panelChild}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(${accentRgb},0.2)` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                </div>
                <span className="text-sm text-neutral-300 font-sans">{feat}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom: Stats + Testimonial card */}
        <motion.div variants={panelChild} className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {content.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="text-xl font-headline font-bold leading-none mb-0.5"
                  style={{ color: accent }}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] text-neutral-500 font-sans tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Floating testimonial card */}
          <motion.div
            animate={floatAnimationSlow}
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" style={{ color: accent }} />
              ))}
            </div>
            <p className="text-neutral-300 text-sm font-sans leading-relaxed mb-3 italic">
              &ldquo;{content.testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-headline font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.4), rgba(${accentRgb},0.2))`,
                  border: `1px solid rgba(${accentRgb},0.4)`,
                  color: accent,
                }}
              >
                {content.testimonial.avatar}
              </div>
              <div>
                <div className="text-xs text-white font-sans font-medium">
                  {content.testimonial.author}
                </div>
                <div className="text-[10px] text-neutral-500 font-sans">
                  {content.testimonial.role}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
