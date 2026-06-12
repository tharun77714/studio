"use client"

import styles from './ScrollToExploreArrow.module.css'

export function ScrollToExploreArrow() {
  const scrollToExplore = () => {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <button
      type="button"
      className={styles.cue}
      onClick={scrollToExplore}
      aria-label="Scroll to sign in options"
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 5v12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M7.5 14.5 12 19l4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
