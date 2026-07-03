import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { Toaster } from '../components/ui/sonner';
import { Providers } from './providers';
import { AnimatedBackground } from '../components/animated-background';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: 'Brainrot Video Automator',
  description: 'AI-powered short-form video creation and scheduling platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${oswald.variable} font-sans min-h-screen bg-[#06040A] text-white selection:bg-purple-500/30 veldara-theme`}>
        <Providers>
          <AnimatedBackground />
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
