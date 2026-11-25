import { ImageResponse } from 'next/og';

// The preview card shown when the link is shared on LinkedIn, WhatsApp, Slack or X.
export const alt = 'Look Closer: an interactive profile of Soniaa S., Fractional CMO';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  // Noise words sit in the top and bottom bands only, so they never touch the headline.
  const noise = [['positioning?', 4, 6], ['ICP', 30, 9], ['CAC', 47, 4], ['GTM', 66, 8], ['churn', 86, 5], ['funnel', 6, 86], ['pipeline', 27, 89], ['leads', 50, 84], ['messaging', 68, 90]];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0A0E1A', color: '#F2EDE4', position: 'relative', fontFamily: 'sans-serif' }}>
        {noise.map(([w, x, y], i) => (
          <div key={w} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: 26 + (i % 3) * 8, color: '#6B7385', opacity: 0.35 }}>{w}</div>
        ))}
        <div style={{ position: 'absolute', right: 120, top: 135, width: 340, height: 340, borderRadius: 340, border: '10px solid #7CF2C0', background: '#121829', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#7CF2C0' }}>clarity</div>
        <div style={{ position: 'absolute', right: 60, top: 440, width: 150, height: 26, borderRadius: 13, background: '#2a3248', transform: 'rotate(45deg)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', width: 680 }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#7CF2C0', textTransform: 'uppercase' }}>Look closer</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, marginTop: 18 }}>I notice what others don’t.</div>
          <div style={{ fontSize: 32, color: '#AEB4C2', marginTop: 26 }}>Soniaa S. · Fractional CMO</div>
        </div>
      </div>
    ),
    size,
  );
}
