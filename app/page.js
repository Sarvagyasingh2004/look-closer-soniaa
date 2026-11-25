import SmoothScroll from '@/components/SmoothScroll';
import Tracker from '@/components/Tracker';
import ProgressLine from '@/components/ProgressLine';
import Hero from '@/components/Hero';
import Connect from '@/components/Connect';
import Root from '@/components/Root';
import MakeSense from '@/components/MakeSense';
import Pulse from '@/components/Pulse';
import Closing from '@/components/Closing';

// Five scenes, each showing a different side of Soniaa S.:
// 01 how she sees · 02 how she thinks · 03 how she grew · 04 how she helps · 05 how she measures
export default function Page() {
  return (
    <>
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
