
import React from 'react';

const COLORS = ['#cbd5e0', '#a0aec0', '#718096', '#4a5568'];

export default function LayoutVisualizer({ layout, slabWidth, slabHeight }) {
  const scale = 4; // scale factor for canvas
  const kerf = layout.kerf || 0;

  return (
    <div className="overflow-auto border rounded-lg shadow p-4 bg-white">
      <svg
        width={slabWidth * scale}
        height={slabHeight * scale}
        style={{ border: '1px solid #ddd', background: '#f7fafc' }}
      >
        {layout.cuts.map((cut, idx) => (
          <g key={idx}>
            <rect
              x={cut.x * scale}
              y={cut.y * scale}
              width={cut.rotated ? cut.height * scale : cut.width * scale}
              height={cut.rotated ? cut.width * scale : cut.height * scale}
              fill={COLORS[idx % COLORS.length]}
              stroke="#2d3748"
              strokeWidth={kerf * scale}
            />
            <text
              x={(cut.x + 1) * scale}
              y={(cut.y + 5) * scale}
              fontSize="10"
              fill="#1a202c"
            >
              {cut.width}×{cut.height}{cut.rotated ? ' (rot)' : ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
