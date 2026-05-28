"use client"

import { AICustomizationSection } from '@/components/cinematic/AICustomizationSection'
import { AboutSection } from '@/components/cinematic/AboutSection'
import { CinematicScrollHero } from '@/components/cinematic/CinematicScrollHero'

export default function LandingPage() {
  return (
    <>
      <CinematicScrollHero />
      <AboutSection />
      <AICustomizationSection />
    </>
  )
}
