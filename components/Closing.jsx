'use client';

import { reachedOut } from '@/lib/journey';

export const LINKEDIN = 'https://www.linkedin.com/in/soniaspecialist/';

export default function Closing() {
  return (
    <section className="closing grid-bg" aria-labelledby="closing-title">
      <div className="closing-inner">
        <span className="eyebrow">Thank you for looking closer</span>
        <h2 className="closing-title" id="closing-title">Bring her your chaos.</h2>
        <p>
          She’s <em>“always open to connecting with people who are building, learning, or growing.”</em>
        </p>
        <div className="closing-actions">
          <a className="btn-primary" href={LINKEDIN} target="_blank" rel="noopener" style={{ textDecoration: 'none' }} onClick={() => reachedOut('linkedin')}>
            Connect on LinkedIn ↗
          </a>
          <a className="btn-ghost" href="#notice">Back to the noise ↑</a>
        </div>
      </div>
    </section>
  );
}
