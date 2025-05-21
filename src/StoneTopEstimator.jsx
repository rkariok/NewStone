
import React, { useState } from 'react';

function optimizeTopsPerSlab(slabWidth, slabHeight, topWidth, topHeight, kerf = 0.25) {
  const orient1 = {
    topsWide: Math.floor(slabWidth / (topWidth + kerf)),
    topsHigh: Math.floor(slabHeight / (topHeight + kerf))
  };
  const orient2 = {
    topsWide: Math.floor(slabWidth / (topHeight + kerf)),
    topsHigh: Math.floor(slabHeight / (topWidth + kerf))
  };
  const count1 = orient1.topsWide * orient1.topsHigh;
  const count2 = orient2.topsWide * orient2.topsHigh;
  return Math.max(count1, count2);
}

export default function StoneTopEstimator() {
  const [width, setWidth] = useState(60);
  const [depth, setDepth] = useState(25.5);
  const [quantity, setQuantity] = useState(2);
  const [slabWidth, setSlabWidth] = useState(126);
  const [slabHeight, setSlabHeight] = useState(63);
  const [log, setLog] = useState("");

  const handleCalc = async () => {
    const topsPerSlab = optimizeTopsPerSlab(slabWidth, slabHeight, width, depth);
    const slabsNeeded = Math.ceil(quantity / topsPerSlab);
    const payload = {
      data: [
        {
          Timestamp: new Date().toLocaleString(),
          Stone: "Sample Stone",
          Size: `${width}x${depth}`,
          Qty: quantity,
          TopsPerSlab: topsPerSlab,
          SlabsNeeded: slabsNeeded
        }
      ]
    };

    setLog(`Tops/slab: ${topsPerSlab}, Slabs needed: ${slabsNeeded}`);

    try {
      const res = await fetch("https://sheetdb.io/api/v1/meao888u7pgqn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      console.log("SheetDB Response:", json);
      alert("Submitted successfully!");
    } catch (err) {
      console.error("SheetDB error:", err);
      alert("Submission failed.");
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: 20 }}>
      <h2>Stone Estimator</h2>
      <label>Width (in): <input type="number" value={width} onChange={e => setWidth(+e.target.value)} /></label><br />
      <label>Depth (in): <input type="number" value={depth} onChange={e => setDepth(+e.target.value)} /></label><br />
      <label>Quantity: <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} /></label><br />
      <label>Slab Width: <input type="number" value={slabWidth} onChange={e => setSlabWidth(+e.target.value)} /></label><br />
      <label>Slab Height: <input type="number" value={slabHeight} onChange={e => setSlabHeight(+e.target.value)} /></label><br /><br />
      <button onClick={handleCalc}>Calculate and Submit</button>
      <pre>{log}</pre>
    </div>
  );
}
