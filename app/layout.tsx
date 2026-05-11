import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BoodLooking — Optimiseur de réservations hôtelières',
  description: 'Trouvez des hôtels avec un meilleur rapport qualité-prix que votre réservation actuelle',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.className} h-full`}>
      <body className="h-full bg-white antialiased">{children}</body>
    </html>
  );
}
