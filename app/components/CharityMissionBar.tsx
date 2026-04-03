import React from 'react';

export function CharityMissionBar() {
  return (
    <div className="w-full border-b border-emerald-500/30 bg-gradient-to-r from-emerald-900/60 via-cyan-900/40 to-emerald-900/60 px-4 py-2 text-center text-sm text-emerald-100">
      <span className="font-semibold tracking-wide">wearelegend Mission</span>
      <span className="mx-2 text-emerald-300">|</span>
      <span>Every purchase contributes to transparent, charity-linked impact.</span>
    </div>
  );
}
