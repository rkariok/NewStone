
import React from 'react';
import LayoutVisualizer from '../components/LayoutVisualizer';
import { optimizeSlabLayout } from '../utils/layoutEngine';

const parts = Array(20).fill().map(() => ({ width: 36, height: 24 }));

export default function LayoutDemo() {
  const layout = optimizeSlabLayout({
    sheetWidth: 126,
    sheetHeight: 63,
    parts,
    kerf: 0.25
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Slab Layout Demo</h1>
      <p>Optimized layout for 20 parts (36×24) in a 126×63 slab with 0.25" kerf.</p>
      <LayoutVisualizer layout={layout} slabWidth={126} slabHeight={63} />
    </div>
  );
}
