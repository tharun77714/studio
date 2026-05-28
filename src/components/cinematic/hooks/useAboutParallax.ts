"use client"

/* eslint-disable react-hooks/immutability */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createGoldParticles, drawGoldParticles } from '../lib/goldParticles'

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(pointer: coarse)').matches
}

type AboutElements = {
  sectionRef: RefObject<HTMLElement | null>
  bgLayerRef: RefObject<HTMLDivElement | null>
  particlesRef: RefObject<HTMLCanvasElement | null>
  headingWrapRef: RefObject<HTMLDivElement | null>
  copyRef: RefObject<HTMLDivElement | null>
  headingRef: RefObject<HTMLElement | null>
  subRef: RefObject<HTMLElement | null>
  bodyRef: RefObject<HTMLElement | null>
}

export function useAboutParallax(elements: Readonly<AboutElements>): void {
  const inViewRef = useRef(false)
  const lastDrawMsRef = useRef(0)

  useLayoutEffect(() => {
    const section = elements.sectionRef.current
    const bg = elements.bgLayerRef.current
    const canvasNode = elements.particlesRef.current
    const headingWrap = elements.headingWrapRef.current
    const copy = elements.copyRef.current
    const heading = elements.headingRef.current
    const sub = elements.subRef.current
    const body = elements.bodyRef.current

    if (!section || !bg || !canvasNode || !headingWrap || !copy || !heading || !sub || !body)
      return

    const reduced = prefersReducedMotion()
    const mobile = window.innerWidth < 768 || isCoarsePointer()

    if (reduced) {
      gsap.set([headingWrap, sub, body], { opacity: 1, y: 0, scale: 1 })
      return
    }

    const ctx = canvasNode.getContext('2d', { alpha: true })
    if (!ctx) return

    const particleCount = mobile ? 55 : 110
    const particles = createGoldParticles(particleCount)
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
      drawGoldParticles(ctx, cssW, cssH, particles, 0.5, now * 0.001)
    }
    raf = requestAnimationFrame(loop)

    const ctxGsap = gsap.context(() => {
      gsap.set(headingWrap, { opacity: 0, y: 48, scale: 0.94 })
      gsap.set([sub, body], { opacity: 0, y: 32 })

      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: mobile ? 0.95 : 1.2,
          invalidateOnRefresh: true,
          onEnter: () => (inViewRef.current = true),
          onEnterBack: () => (inViewRef.current = true),
          onLeave: () => (inViewRef.current = false),
          onLeaveBack: () => (inViewRef.current = false),
        },
      })

      parallaxTl.to(bg, { yPercent: -22, ease: 'none' }, 0)
      parallaxTl.to(canvasNode, { yPercent: -14, ease: 'none' }, 0)
      parallaxTl.to(copy, { yPercent: -6, ease: 'none' }, 0)

      const headingTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'bottom 25%',
          scrub: mobile ? 0.9 : 1.1,
          invalidateOnRefresh: true,
        },
      })

      headingTl.fromTo(
        headingWrap,
        { opacity: 0, y: 56, scale: 0.92 },
        { opacity: 1, y: -48, scale: 1.06, ease: 'none' },
        0,
      )

      const copyTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 58%',
          end: 'center 32%',
          scrub: mobile ? 0.85 : 1,
          invalidateOnRefresh: true,
        },
      })

      copyTl.to(sub, { opacity: 1, y: 0, ease: 'power2.out', duration: 1 }, 0)
      copyTl.to(body, { opacity: 1, y: 0, ease: 'power2.out', duration: 1 }, 0.4)

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
    elements.bgLayerRef,
    elements.particlesRef,
    elements.headingWrapRef,
    elements.copyRef,
    elements.headingRef,
    elements.subRef,
    elements.bodyRef,
  ])
}

