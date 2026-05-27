import { Variants } from "framer-motion";

// ─── Easing Curves ───────────────────────────────────────────────────────────
export const ease = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  spring: { type: "spring", stiffness: 380, damping: 32 } as const,
  gentleSpring: { type: "spring", stiffness: 200, damping: 28 } as const,
  bouncy: { type: "spring", stiffness: 500, damping: 26 } as const,
};

// ─── Page / Panel Transitions ─────────────────────────────────────────────────
export const pageSlide: Variants = {
  initial: { opacity: 0, x: 40, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: -30,
    filter: "blur(4px)",
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const pageSlideReverse: Variants = {
  initial: { opacity: 0, x: -40, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: 30,
    filter: "blur(4px)",
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Stagger Container ────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ─── Fade Up (for form fields) ────────────────────────────────────────────────
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Wizard Step Transitions ──────────────────────────────────────────────────
export const stepForward: Variants = {
  initial: { opacity: 0, x: 60, filter: "blur(3px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: -60,
    filter: "blur(3px)",
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const stepBackward: Variants = {
  initial: { opacity: 0, x: -60, filter: "blur(3px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: 60,
    filter: "blur(3px)",
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Left Panel Entry ─────────────────────────────────────────────────────────
export const panelEntry: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

export const panelChild: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Tab Switch ───────────────────────────────────────────────────────────────
export const tabContent: Variants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 20 : -20,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -20 : 20,
    transition: { duration: 0.18 },
  }),
};

// ─── Float (for cards / badges) ───────────────────────────────────────────────
export const floatAnimation = {
  y: [-8, 8, -8],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const floatAnimationSlow = {
  y: [-5, 5, -5],
  transition: {
    duration: 7,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// ─── Scale In (for modals/overlays) ───────────────────────────────────────────
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.22 },
  },
};
