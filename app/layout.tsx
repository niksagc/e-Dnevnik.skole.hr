import type {Metadata} from 'next';
import './globals.css';
import HamburgerMenu from '@/components/HamburgerMenu';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'e-Dnevnik',
  description: 'Sustav e-Dnevnik za nastavnike',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hr">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseProvider>
            <HamburgerMenu />
            {children}
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
