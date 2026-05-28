"use client"

import gsap from 'gsap'
import { useLayoutEffect, type RefObject } from 'react'

export function useIntroLift(
  introRef: RefObject<HTMLElement | null>,
  stageClipRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): void {
  useLayoutEffect(() => {
    if (!enabled) return

    const introEl = introRef.current
    const stageEl = stageClipRef.current
    if (!introEl || !stageEl) return

    const ctx = gsap.context(() => {
      gsap.set(introEl, {
        yPercent: 0,
        xPercent: 0,
        scale: 1,
        opacity: 1,
        visibility: 'visible',
      })

      gsap.set(stageEl, {
        yPercent: 8,
        opacity: 1,
      })

      const tl = gsap.timeline()
      tl.to(
        introEl,
        {
          yPercent: -140,
          scale: 0.6,
          duration: 1.6,
          ease: 'power2.inOut',
        },
        0,
      )

      tl.to(
        stageEl,
        {
          yPercent: 0,
          duration: 1.6,
          ease: 'power2.inOut',
        },
        0,
      )
    }, introEl)

    return () => ctx.revert()
  }, [enabled, introRef, stageClipRef])
}

