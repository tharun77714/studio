"use client"

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getLetterboxRect } from '../lib/canvasLetterbox'
import {
  createDustParticles,
  drawDustParticles,
  dustIntensityFromProgress,
  type DustParticle,
} from '../lib/particles'
import { smoothstep } from '../lib/smoothstep'
import { allFrameUrls, FRAME_COUNT } from '../lib/sequenceFrameUrls'
import { drawWatermarkMask } from '../lib/watermarkMask'

gsap.registerPlugin(ScrollTrigger)

async function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  const images = urls.map((url) => {
    const img = new Image()
    img.src = url
    return img
  })

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve, reject) => {
          const done = () => resolve()
          const fail = () => reject(new Error(`Failed to load frame: ${img.src}`))

          if (img.complete && img.naturalWidth > 0) {
            void decodeIfPossible(img).then(done).catch(done)
            return
          }

          img.onload = () => {
            void decodeIfPossible(img).then(done).catch(done)
          }
          img.onerror = () => fail()
        }),
    ),
  )

  return images
}

async function decodeIfPossible(img: HTMLImageElement): Promise<void> {
  if (typeof img.decode === 'function') {
    try {
      await img.decode()
    } catch {
      // ignore
    }
  }
}

function clampDpr(preferredMax: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(dpr, preferredMax)
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(pointer: coarse)').matches
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const easeSequence = gsap.parseEase('power2.inOut')
const easeZoom = gsap.parseEase('power1.out')

type Status = 'loading' | 'ready' | 'error'

export function useCinematicSequence(
  sectionRef: React.RefObject<HTMLElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  zoomRef: React.RefObject<HTMLDivElement | null>,
  popTitleRef?: React.RefObject<HTMLDivElement | null>,
): { status: Status; reducedMotion: boolean } {
  const [status, setStatus] = useState<Status>('loading')
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)

  const framesRef = useRef<HTMLImageElement[] | null>(null)
  const particlesRef = useRef<DustParticle[]>([])
  const sequenceProgressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const introStartSecRef = useRef<number | null>(null)
  const contentCenterBiasXRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    preloadImages(allFrameUrls())
      .then((imgs) => {
        if (cancelled) return
        if (imgs.length !== FRAME_COUNT) {
          setStatus('error')
          return
        }
        const broken = imgs.some((i) => i.naturalWidth === 0)
        if (broken) {
          setStatus('error')
          return
        }
        framesRef.current = imgs
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    if (status !== 'ready') return

    const section = sectionRef.current
    const canvas = canvasRef.current
    const zoomEl = zoomRef.current
    const frames = framesRef.current
    const popEl = popTitleRef?.current ?? null
    if (!section || !canvas || !zoomEl || !frames?.length) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const computeBias = (img: HTMLImageElement): number => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w <= 0 || h <= 0) return 0

      const sampleW = 220
      const sampleH = Math.max(1, Math.round((h / w) * sampleW))
      const off = document.createElement('canvas')
      off.width = sampleW
      off.height = sampleH
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return 0
      octx.drawImage(img, 0, 0, sampleW, sampleH)
      const data = octx.getImageData(0, 0, sampleW, sampleH).data

      const marginX = Math.floor(sampleW * 0.08)
      const marginY = Math.floor(sampleH * 0.08)
      const thr = 26

      let sumW = 0
      let sumX = 0

      for (let y = marginY; y < sampleH - marginY; y++) {
        const row = y * sampleW * 4
        for (let x = marginX; x < sampleW - marginX; x++) {
          const i = row + x * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
          if (lum <= thr) continue
          const wgt = lum - thr
          sumW += wgt
          sumX += wgt * x
        }
      }

      if (sumW <= 1e-6) return 0
      const meanX = sumX / sumW
      const normCenter = meanX / (sampleW - 1)
      const bias = 0.5 - normCenter
      return Math.max(-0.18, Math.min(0.18, bias))
    }

    contentCenterBiasXRef.current = computeBias(frames[0])

    const mobile = window.innerWidth < 768 || isCoarsePointer()
    const maxDpr = mobile ? 2 : 2.5
    const shell = canvas.parentElement as HTMLElement | null
    if (!shell) return

    particlesRef.current = createDustParticles(mobile ? 56 : 112)
    sequenceProgressRef.current = reducedMotion ? 0.48 : 0

    const applyCanvasSize = () => {
      const rect = shell.getBoundingClientRect()
      const wCss = Math.max(1, rect.width)
      const hCss = Math.max(1, rect.height)
      const dpr = clampDpr(maxDpr)

      canvas.style.width = `${wCss}px`
      canvas.style.height = `${hCss}px`
      const bw = Math.max(1, Math.floor(wCss * dpr))
      const bh = Math.max(1, Math.floor(hCss * dpr))
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw
        canvas.height = bh
      }
    }

    applyCanvasSize()
    const ro = new ResizeObserver(() => {
      applyCanvasSize()
    })
    ro.observe(shell)

    const ctxGsap = gsap.context(() => {
      const endMult = mobile ? 6.5 : 9

      ScrollTrigger.create({
        id: 'cinematic-hero-scrub',
        trigger: section,
        start: 'top top',
        end: reducedMotion ? '+=120' : () => `+=${Math.round(window.innerHeight * endMult)}`,
        pin: !reducedMotion,
        pinSpacing: !reducedMotion,
        anticipatePin: reducedMotion ? 0 : 1,
        scrub: reducedMotion ? 0 : mobile ? 0.88 : 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress
          sequenceProgressRef.current = reducedMotion ? 0.48 : easeSequence(p)
        },
      })
    }, section)

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop)

      const timeSec = now * 0.001
      if (introStartSecRef.current === null) introStartSecRef.current = timeSec
      const seq = sequenceProgressRef.current
      const bw = canvas.width
      const bh = canvas.height

      const img0Base = frames[0]
      const iw = img0Base.naturalWidth
      const ih = img0Base.naturalHeight

      const zoomT = easeZoom(seq)
      const scale = 1 + 0.17 * zoomT
      zoomEl.style.transform = `scale(${scale})`

      const u = seq * (frames.length - 1)
      const i0 = Math.floor(u)
      const i1 = Math.min(i0 + 1, frames.length - 1)
      let t = u - i0
      t = smoothstep(0, 1, t)

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, bw, bh)

      const rect = getLetterboxRect(bw, bh, iw, ih)
      const biasX = contentCenterBiasXRef.current
      const centeredRect = { ...rect, dx: rect.dx + rect.dw * biasX }

      const a = frames[i0]
      const b = frames[i1]

      const introT = Math.min(1, (timeSec - (introStartSecRef.current ?? timeSec)) / 0.85)
      const fadeIn = smoothstep(0, 1, introT)
      const vignetteAlpha = (1 - fadeIn) * 0.92

      ctx.globalAlpha = fadeIn
      ctx.drawImage(a, centeredRect.dx, centeredRect.dy, centeredRect.dw, centeredRect.dh)
      if (i0 !== i1) {
        ctx.globalAlpha = fadeIn * t
        ctx.drawImage(b, centeredRect.dx, centeredRect.dy, centeredRect.dw, centeredRect.dh)
      }
      ctx.globalAlpha = 1

      if (vignetteAlpha > 0.001) {
        ctx.fillStyle = `rgba(0,0,0,${vignetteAlpha})`
        ctx.fillRect(0, 0, bw, bh)
      }

      drawWatermarkMask(ctx, centeredRect)

      const dust = dustIntensityFromProgress(seq)
      drawDustParticles(ctx, bw, bh, particlesRef.current, dust, timeSec)

      if (popEl) {
        const appear = smoothstep(0.62, 0.72, seq)
        popEl.style.opacity = String(appear)
        popEl.style.setProperty('--popLift', `${Math.round((1 - appear) * 10)}px`)
      }

      const edge = ctx.createRadialGradient(
        bw * 0.5,
        bh * 0.5,
        Math.min(bw, bh) * 0.28,
        bw * 0.5,
        bh * 0.5,
        Math.max(bw, bh) * 0.72,
      )
      edge.addColorStop(0, 'rgba(0,0,0,0)')
      edge.addColorStop(1, `rgba(0,0,0,${0.22 * (0.35 + seq * 0.65)})`)
      ctx.fillStyle = edge
      ctx.fillRect(0, 0, bw, bh)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      ctxGsap.revert()
    }
  }, [status, reducedMotion, sectionRef, canvasRef, zoomRef, popTitleRef])

  return { status, reducedMotion }
}

