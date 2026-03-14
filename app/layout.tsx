import type {Metadata} from 'next';
import './globals.css';
import HamburgerMenu from '@/components/HamburgerMenu';

export const metadata: Metadata = {
  title: 'e-Dnevnik',
  description: 'Sustav e-Dnevnik za nastavnike',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hr">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <HamburgerMenu />
        {children}
      </body>
    </html>
  );
}
