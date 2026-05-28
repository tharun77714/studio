"use client"

/* eslint-disable react-hooks/immutability */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createGoldParticles, drawGoldParticles } from '../lib/goldParticles'

gsap.registerPlugin(ScrollTrigger)

const SPLINE_SCENE =
  'https://prod.spline.design/OIVSsQEj72vcCgTh/scene.splinecode'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(pointer: coarse)').matches
}

type Elements = {
  sectionRef: RefObject<HTMLElement | null>
  bgGlowRef: RefObject<HTMLDivElement | null>
  particlesRef: RefObject<HTMLCanvasElement | null>
  cardsRef: RefObject<HTMLDivElement | null>
  cardsFloatRef: RefObject<HTMLDivElement | null>
}

export function useAICustomizationParallax(elements: Readonly<Elements>): void {
  const inViewRef = useRef(false)
  const lastDrawMsRef = useRef(0)

  useLayoutEffect(() => {
    const section = elements.sectionRef.current
    const bgGlow = elements.bgGlowRef.current
    const canvasNode = elements.particlesRef.current
    const cards = elements.cardsRef.current
    const cardsFloat = elements.cardsFloatRef.current

    if (!section || !bgGlow || !canvasNode || !cards || !cardsFloat) return

    const reduced = prefersReducedMotion()
    const mobile = window.innerWidth < 768 || isCoarsePointer()

    if (reduced) {
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 })
      return
    }

    const ctx = canvasNode.getContext('2d', { alpha: true })
    if (!ctx) return

    const particles = createGoldParticles(mobile ? 40 : 75, 9900)
    let raf = 0
    let running = true
    let cssW = 1
    let cssH = 1

    const resizeCanvas = () => {
      const w = Math.max(1, section.clientWidth)
      const h = Math.max(1, section.offsetHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = w
      cssH = h
      canvasNode.width = Math.floor(w * dpr)
      canvasNode.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    const ro = new ResizeObserver(() => {
      resizeCanvas()
      ScrollTrigger.refresh()
    })
    ro.observe(section)

    const loop = (now: number) => {
      if (!running) return
      raf = requestAnimationFrame(loop)
      if (!inViewRef.current) return
      if (now - lastDrawMsRef.current < 33) return
      lastDrawMsRef.current = now
      ctx.clearRect(0, 0, cssW, cssH)
      drawGoldParticles(ctx, cssW, cssH, particles, 0.38, now * 0.001)
    }
    raf = requestAnimationFrame(loop)

    const ctxGsap = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 40, scale: 0.98 })

      gsap.to(cardsFloat, {
        y: -12,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: mobile ? 0.95 : 1.15,
          invalidateOnRefresh: true,
          onEnter: () => (inViewRef.current = true),
          onEnterBack: () => (inViewRef.current = true),
          onLeave: () => (inViewRef.current = false),
          onLeaveBack: () => (inViewRef.current = false),
        },
      })

      parallaxTl.to(bgGlow, { yPercent: -16, ease: 'none' }, 0)
      parallaxTl.to(canvasNode, { yPercent: -8, ease: 'none' }, 0)
      parallaxTl.to(cards, { yPercent: -5, ease: 'none' }, 0)

      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'center 45%',
          scrub: mobile ? 0.88 : 1.05,
          invalidateOnRefresh: true,
        },
      })

      revealTl.to(
        cards,
        { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 1 },
        0,
      )

      ScrollTrigger.refresh()
    }, section)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      ctxGsap.revert()
    }
  }, [
    elements.sectionRef,
    elements.bgGlowRef,
    elements.particlesRef,
    elements.cardsRef,
    elements.cardsFloatRef,
  ])
}

export const SPLINE_SCENE_URL = SPLINE_SCENE

