
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { ChatProvider } from '@/contexts/ChatContext'; // Import ChatProvider
import { SmoothScrollProvider } from '@/components/common/smooth-scroll-provider';
import { CursorGlow } from '@/components/common/CursorGlow';
import { MoltenGoldLoader } from '@/components/ui/molten-gold-loader';

export const metadata: Metadata = {
  title: 'Sparkle Studio',
  description: 'Discover your next favorite jewelry piece or showcase your collection.',
  icons: {
    icon: '/favicon.ico', // Assuming a favicon might be added later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1519210527641884" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1519210527641884"
          crossOrigin="anonymous"
        ></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap"
          rel="stylesheet"
        />

        <script
          type="module"
          src="https://unpkg.com/@splinetool/viewer@1.12.95/build/spline-viewer.js"
        />
      </head>
      <body className="font-sans antialiased text-foreground bg-background overflow-x-hidden">
        <div className="film-grain" />
        <SmoothScrollProvider>
          <AuthProvider>
            <ChatProvider> 
              <MoltenGoldLoader />
              <CursorGlow />
              {children}
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

