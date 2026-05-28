"use client"

import { useRef } from 'react'
import {
  SPLINE_SCENE_URL,
  useAICustomizationParallax,
} from './hooks/useAICustomizationParallax'
import { SplineViewer } from './SplineViewer'
import styles from './AICustomizationSection.module.css'

const NETWORKS_SPLINE_SCENE =
  'https://prod.spline.design/wJFCzkQ5IWt80gEt/scene.splinecode'

export function AICustomizationSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgGlowRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLCanvasElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const cardsFloatRef = useRef<HTMLDivElement>(null)

  useAICustomizationParallax({
    sectionRef,
    bgGlowRef,
    particlesRef,
    cardsRef,
    cardsFloatRef,
  })

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="ai-custom-heading"
    >
      <div ref={bgGlowRef} className={styles.bgGlow} aria-hidden />
      <canvas ref={particlesRef} className={styles.particles} aria-hidden />

      <div ref={cardsRef} className={styles.cards}>
        <div ref={cardsFloatRef} className={styles.cardsFloat}>
          <div className={styles.cardsGrid}>
            <article className={styles.card} aria-labelledby="ai-custom-heading">
              <div className={styles.cardInner}>
                <div className={styles.splineWrap} aria-hidden>
                  <SplineViewer
                    url={SPLINE_SCENE_URL}
                    className={styles.splineHost}
                  />
                </div>
                <div className={styles.text}>
                  <h2 id="ai-custom-heading" className={styles.heading}>
                    AI-Powered Customization
                  </h2>
                  <p className={styles.subheading}>
                    Transform jewelry designs instantly with intelligent AI-assisted
                    customization.
                  </p>
                </div>
              </div>
            </article>

            <article className={styles.card} aria-labelledby="ar-tryon-heading">
              <div className={styles.cardInner}>
                <div className={styles.iconWrap} aria-hidden>
                  <div className={styles.iconOrb} />
                  <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 10.5c2.2-3.2 5.8-3.2 8 0"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4.5 12c3.8-6 11.2-6 15 0"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10.2 13.3a2.2 2.2 0 1 0 3.6 0"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className={styles.text}>
                  <h2 id="ar-tryon-heading" className={styles.headingSmall}>
                    AR Try-On
                  </h2>
                  <p className={styles.subheading}>
                    Preview fit, scale, and sparkle in real time — effortlessly,
                    anywhere.
                  </p>
                </div>
              </div>
            </article>

            <article
              className={`${styles.card} ${styles.cardNetworks}`}
              aria-labelledby="networks-heading"
            >
              <div className={styles.cardInner}>
                <div className={styles.splineWrap} aria-hidden>
                  <SplineViewer
                    url={NETWORKS_SPLINE_SCENE}
                    className={styles.splineHost}
                  />
                </div>
                <div className={styles.text}>
                  <h2 id="networks-heading" className={styles.headingSmall}>
                    Networks
                  </h2>
                  <p className={styles.subheading}>
                    Connect designers, stores, and clients into one premium
                    customization flow.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

