
// layoutOptimizer.js
export function fitTopsOnSlab(slabWidth, slabHeight, topWidth, topHeight, kerf = 0.25) {
  // Convert dimensions to avoid floating point errors
  const scale = 100;
  slabWidth = Math.floor(slabWidth * scale);
  slabHeight = Math.floor(slabHeight * scale);
  topWidth = Math.floor(topWidth * scale);
  topHeight = Math.floor(topHeight * scale);
  kerf = Math.floor(kerf * scale);

  const tops = [];
  const occupied = [];

  function fits(x, y, w, h) {
    for (const r of occupied) {
      if (x < r.x + r.w + kerf &&
          x + w + kerf > r.x &&
          y < r.y + r.h + kerf &&
          y + h + kerf > r.y) {
        return false;
      }
    }
    return (x + w <= slabWidth) && (y + h <= slabHeight);
  }

  function place(w, h) {
    for (let y = 0; y <= slabHeight - h; y += kerf) {
      for (let x = 0; x <= slabWidth - w; x += kerf) {
        if (fits(x, y, w, h)) {
          occupied.push({ x, y, w, h });
          tops.push({ x, y, w, h });
          return true;
        }
      }
    }
    return false;
  }

  while (true) {
    if (!place(topWidth, topHeight) && !place(topHeight, topWidth)) break;
  }

  return tops.length;
}
