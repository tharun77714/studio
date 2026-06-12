"use client"

import { UserTypeSelection } from '@/components/landing/user-type-selection'
import styles from './explore-login-section.module.css'

export function ExploreLoginSection() {
  return (
    <section
      id="explore"
      className={styles.section}
      aria-labelledby="explore-heading"
    >
      <div className={styles.headingWrap}>
        <h2 id="explore-heading" className={styles.heading}>
          Choose Your Path
        </h2>
        <div className={styles.divider} />
      </div>

      <UserTypeSelection />

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Sparkle Studio. All Rights Reserved.</p>
      </footer>
    </section>
  )
}
