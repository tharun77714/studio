"use client"

import { useRef } from 'react'
import { useAboutParallax } from './hooks/useAboutParallax'
import styles from './AboutSection.module.css'

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgLayerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLCanvasElement>(null)
  const headingWrapRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)

  useAboutParallax({
    sectionRef,
    bgLayerRef,
    particlesRef,
    headingWrapRef,
    copyRef,
    headingRef,
    subRef,
    bodyRef,
  })

  return (
    <section ref={sectionRef} className={styles.about} aria-labelledby="about-heading">
      <div ref={bgLayerRef} className={styles.bgLayer} aria-hidden />
      <canvas ref={particlesRef} className={styles.particles} aria-hidden />
      <div className={styles.inner}>
        <div ref={headingWrapRef} className={styles.headingWrap}>
          <h2 ref={headingRef} id="about-heading" className={styles.heading}>
            About Sparkle Studio
          </h2>
        </div>
        <div ref={copyRef} className={styles.copy}>
          <p ref={subRef} className={styles.subheading}>
            Reimagining jewelry customization with AI and immersive technology.
          </p>
          <p ref={bodyRef} className={styles.body}>
            Sparkle Studio combines AI-powered customization, AR try-on experiences, and modern
            jewelry design to create a new era of personalized luxury shopping.
          </p>
        </div>
      </div>
    </section>
  )
}

