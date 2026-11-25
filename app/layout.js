import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import 'lenis/dist/lenis.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Look Closer · Soniaa S.',
  description:
    'An interactive profile of Soniaa S., Fractional CMO. “I notice what others don’t.” Look closer, and the chaos makes sense.',
  openGraph: {
    title: 'Look Closer · Soniaa S.',
    description: 'Move the lens. Watch the chaos make sense.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#0A0E1A',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
