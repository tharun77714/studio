"use client"

import { AICustomizationSection } from '@/components/cinematic/AICustomizationSection'
import { AboutSection } from '@/components/cinematic/AboutSection'
import { CinematicScrollHero } from '@/components/cinematic/CinematicScrollHero'
import { ExploreLoginSection } from '@/components/landing/explore-login-section'

export default function LandingPage() {
  return (
    <>
      <CinematicScrollHero />
      <AboutSection />
      <AICustomizationSection />
      <ExploreLoginSection />
    </>
  )
}
