// Small line icons for the ideas in Sonia's "whole picture".
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true };

export const ICONS = {
  brand: (
    <svg {...base} strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  ),
  messaging: (
    <svg {...base} strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 5h16v11H10l-5 4v-4H4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  ),
  operations: (
    <svg {...base} strokeLinecap="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  ),
  revenue: (
    <svg {...base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M6 16v-3M10.5 16v-6M15 16V8" />
      <path d="M14 4.5l5-.5-.5 5" />
      <path d="M19 4l-6 6" />
    </svg>
  ),
  execution: (
    <svg {...base} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="13" r="7.5" />
      <circle cx="11" cy="13" r="3.2" />
      <path d="M11 13l8.5-8.5" />
      <path d="M16.5 4.5h3v3" />
    </svg>
  ),
  conversion: (
    <svg {...base} strokeLinejoin="round">
      <path d="M3.5 4.5h17l-6.5 7.5v6.5l-4 2v-8.5z" />
    </svg>
  ),
  people: (
    <svg {...base} strokeLinecap="round">
      <circle cx="8" cy="8.5" r="2.8" />
      <circle cx="16" cy="8.5" r="2.8" />
      <path d="M2.8 19.5c.4-3.1 2.6-5 5.2-5s4.8 1.9 5.2 5" />
      <path d="M10.8 19.5c.4-3.1 2.6-5 5.2-5s4.8 1.9 5.2 5" />
    </svg>
  ),
};

export function LensIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </svg>
  );
}
