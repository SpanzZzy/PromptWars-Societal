import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PreferencesProvider } from '@/components/PreferencesContext';
import { AssistantDrawer } from '@/components/AssistantDrawer';

export const metadata: Metadata = {
  title: 'SignalBridge — Civic Intelligence & Public Service Navigation',
  description:
    'SignalBridge converts multilingual speech (Marathi, Hindi, English), photos, and documents into structured, evidence-backed civic reports and actionable next steps in Pune.',
  keywords: ['SignalBridge', 'Civic Technology', 'Gemini AI', 'Pune', 'Kalyani Nagar', 'Public Services', 'Marathi', 'Hindi', 'Civic Infrastructure'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white transition-colors duration-150">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <PreferencesProvider>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
            {children}
          </main>
          <Footer />
          <AssistantDrawer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
