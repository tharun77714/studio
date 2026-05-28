"use client"

import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'

type Props = {
  className?: string
  color?: string
}

export function SvgDrawSparkle({ className, color = 'rgba(212, 175, 55, 1)' }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const paths = Array.from(svg.querySelectorAll('path'))
    if (paths.length === 0) return

    const ctx = gsap.context(() => {
      for (const p of paths) {
        const len = p.getTotalLength()
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
        p.style.opacity = '0'
      }

      const main = paths[0]
      main.style.fill = 'rgba(212, 175, 55, 0)'

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.to(paths, { opacity: 1, duration: 0.2, stagger: 0.03 }, 0)
      tl.to(paths, { strokeDashoffset: 0, duration: 1.6, stagger: 0.06 }, 0)
      tl.to(
        main,
        {
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            main.style.fill = color
          },
        },
        0.2,
      )
      tl.to(
        svg,
        {
          scale: 1.03,
          transformOrigin: '50% 50%',
          duration: 0.7,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        },
        1.15,
      )
    }, svg)

    return () => ctx.revert()
  }, [color])

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      role="presentation"
      aria-hidden="true"
      style={{
        stroke: color,
        filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.6))',
      }}
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  )
}

