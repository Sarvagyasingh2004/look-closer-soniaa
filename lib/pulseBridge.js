// Lets Scene 04 find the Pulse funnel: where a sent card should land, and a way to flash it on arrival.
// The Pulse scene fills these in when it mounts.

export const pulseBridge = {
  // Returns { x, y } in viewport coordinates for the "Reached out" stage, or null.
  target: () => null,
  // Flashes a ring around the visitor's dot.
  burst: () => {},
  // The Pulse section element.
  section: null,
  // Returns the scroll position where the funnel is fully built, or null.
  scrollTarget: null,
};
