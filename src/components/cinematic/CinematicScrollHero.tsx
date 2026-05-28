"use client"

import { useRef } from 'react'
import { useCinematicSequence } from './hooks/useCinematicSequence'
import { useIntroLift } from './hooks/useIntroLift'
import { SvgDrawSparkle } from './SvgDrawSparkle'
import styles from './CinematicScrollHero.module.css'

export function CinematicScrollHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const stageClipRef = useRef<HTMLDivElement>(null)
  const popTitleRef = useRef<HTMLDivElement>(null)

  const { status, reducedMotion } = useCinematicSequence(
    sectionRef,
    canvasRef,
    zoomRef,
    popTitleRef,
  )

  const introEnabled = status === 'ready' && !reducedMotion
  useIntroLift(introRef, stageClipRef, introEnabled)

  return (
    <section
      ref={sectionRef}
      className={styles.hero}
      aria-label={
        reducedMotion ? 'Jewelry hero still' : 'Scroll-driven jewelry sequence'
      }
    >
      <div className={styles.inner}>
        <div ref={zoomRef} className={styles.zoom}>
          <div className={styles.shell}>
            <div ref={stageClipRef} className={styles.stageClip}>
              <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
            </div>

            <div ref={popTitleRef} className={styles.popTitle} aria-hidden>
              <div className={styles.popTitleInner}>SPARKLE STUDIO</div>
            </div>

            {introEnabled && (
              <div ref={introRef} className={styles.intro}>
                <div className={styles.introInner}>
                  <div className={styles.introSparkle}>
                    <SvgDrawSparkle className={styles.sparkleSvg} />
                  </div>
                  <p className={styles.introTitle}>Sparkle Studio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudText}>Loading</span>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.hud} role="alert">
          <span className={styles.hudText}>Could not load sequence</span>
        </div>
      )}
    </section>
  )
}

