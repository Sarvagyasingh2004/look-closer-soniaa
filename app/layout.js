import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import 'lenis/dist/lenis.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const title = 'Soniaa S. · Fractional CMO | Look Closer';
const description =
  'Soniaa S. is a Fractional CMO and the CMO of i-SmokeStack, with roles across India, Dubai and the US: Bosch, FARO, Creaform, Appirio, RoundGlass and more. An interactive profile that turns marketing chaos into clarity.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | Look Closer' },
  description,
  applicationName: 'Look Closer',
  authors: [{ name: 'Sarvagya Singh' }],
  creator: 'Sarvagya Singh',
  keywords: [
    'Soniaa S.', 'Sonia Specialist', 'Fractional CMO', 'Chief Marketing Officer', 'i-SmokeStack',
    'B2B marketing', 'demand generation', 'marketing strategy', 'startup growth', 'brand strategy',
    'marketing operations', 'Marketo Certified Expert', 'IIM Bangalore', 'interactive profile',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'profile',
    url: '/',
    siteName: 'Look Closer',
    locale: 'en_IN',
    title,
    description: 'Move the lens. Watch the chaos make sense. An interactive profile of Soniaa S., Fractional CMO.',
    firstName: 'Soniaa',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: 'Move the lens. Watch the chaos make sense. An interactive profile of Soniaa S., Fractional CMO.',
  },
  category: 'marketing',
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
