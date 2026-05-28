"use client"

import { useEffect, useRef, useState } from 'react'

type Props = {
  url: string
  className?: string
}

export function SplineViewer({ url, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )

    io.observe(host)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!mounted) return

    const host = hostRef.current
    if (!host) return

    let cancelled = false

    const ensureDefined = async () => {
      const ce = window.customElements
      if (ce && !ce.get('spline-viewer')) {
        try {
          await Promise.race([
            ce.whenDefined('spline-viewer'),
            new Promise<void>((resolve) => setTimeout(resolve, 2500)),
          ])
        } catch {
          // ignore
        }
      }
    }

    const viewer = document.createElement('spline-viewer')
    viewer.setAttribute('url', url)
    viewer.setAttribute('loading', 'lazy')
    viewer.style.width = '100%'
    viewer.style.height = '100%'
    viewer.style.display = 'block'

    void ensureDefined().then(() => {
      if (cancelled) return
      host.appendChild(viewer)
    })

    return () => {
      cancelled = true
      viewer.remove()
    }
  }, [mounted, url])

  return <div ref={hostRef} className={className} />
}

