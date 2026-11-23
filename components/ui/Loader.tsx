import React from 'react';

// Full-screen loading state: the FitTrack logo only, with the pulse line drawing itself from left to right
// over and over while the app loads (the same line animation as the logo on the home page).
const Loader: React.FC = () => (
  <div className="boot" role="status" aria-live="polite">
    <div className="boot-logo">
      <svg width="88" height="88" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="lgBoot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C389" />
            <stop offset="100%" stopColor="#7ED957" />
          </linearGradient>
        </defs>
        <path className="pulse" pathLength={1} d="M6 34H18L28 14L36 50L44 24L50 34H58" stroke="url(#lgBoot)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="sr-only">Loading</span>
  </div>
);

export default Loader;