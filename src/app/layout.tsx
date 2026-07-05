import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AuthProvider } from '@/components/auth/auth-provider';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Parking.Prac - 자동차 주차 연습 시뮬레이션',
  description: '누구나 쉽고 재밌게 즐기는 안전한 가상 공간 속 2D 주차 연습 시뮬레이터',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
