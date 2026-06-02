import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sparkle Studio',
    short_name: 'Sparkle',
    description: 'Discover your next favorite jewelry piece or showcase your collection.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0700',
    theme_color: '#0a0700',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
