import SmoothScroll from '@/components/SmoothScroll';
import Tracker from '@/components/Tracker';
import ProgressLine from '@/components/ProgressLine';
import Hero from '@/components/Hero';
import Connect from '@/components/Connect';
import Root from '@/components/Root';
import MakeSense from '@/components/MakeSense';
import Pulse from '@/components/Pulse';
import Closing from '@/components/Closing';

const LINKEDIN = 'https://www.linkedin.com/in/soniaspecialist/';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Structured data (JSON-LD): tells search engines in a fixed vocabulary who this page is about.
// Every fact here is from her public LinkedIn profile, the same facts the page shows.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${siteUrl}/#page`,
      url: `${siteUrl}/`,
      name: 'Look Closer · Soniaa S.',
      inLanguage: 'en',
      about: { '@id': `${siteUrl}/#soniaa` },
      mainEntity: { '@id': `${siteUrl}/#soniaa` },
      creator: { '@type': 'Person', name: 'Sarvagya Singh' },
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#soniaa`,
      name: 'Soniaa S.',
      jobTitle: 'Fractional CMO',
      description: 'I notice what others don’t. The gaps, the confusion, the unspoken story, and I help make sense of it.',
      sameAs: [LINKEDIN],
      worksFor: { '@type': 'Organization', name: 'i-SmokeStack' },
      alumniOf: [
        { '@type': 'CollegeOrUniversity', name: 'IIM Bangalore' },
        { '@type': 'CollegeOrUniversity', name: 'Symbiosis' },
        { '@type': 'CollegeOrUniversity', name: 'Maharshi Dayanand University' },
      ],
      knowsAbout: ['Marketing strategy', 'Demand generation', 'Brand', 'Messaging', 'Marketing operations', 'Lead management'],
      knowsLanguage: ['Hindi', 'English', 'Punjabi', 'French', 'German'],
      hasCredential: { '@type': 'EducationalOccupationalCredential', name: 'Marketo Certified Expert' },
    },
  ],
};

// Five scenes, each showing a different side of Soniaa S.:
// 01 how she sees · 02 how she thinks · 03 how she grew · 04 how she helps · 05 how she measures
export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="rotate-note" role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18.5h2" />
        </svg>
        <b>Turn your phone upright</b>
        <span>This story is built for a tall screen</span>
      </div>
      <SmoothScroll />
      <Tracker />
      <ProgressLine />
      <main>
        <Hero />
        <Connect />
        <Root />
        <MakeSense />
        <Pulse />
        <Closing />
      </main>
      <footer className="site-footer">
        <p>
          An interactive profile of Soniaa S., built by Sarvagya Singh for the i-SmokeStack Developer Challenge.
          All content from her public LinkedIn profile.
        </p>
      </footer>
    </>
  );
}
