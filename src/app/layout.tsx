
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { ChatProvider } from '@/contexts/ChatContext'; // Import ChatProvider

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        <AuthProvider>
          <ChatProvider> {/* Wrap children with ChatProvider inside AuthProvider */}
            {children}
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
