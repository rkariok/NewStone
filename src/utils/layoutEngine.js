
export function optimizeSlabLayout({ sheetWidth, sheetHeight, parts, kerf = 0 }) {
  const placements = [];
  const sheet = { width: sheetWidth, height: sheetHeight };
  let x = 0, y = 0, rowHeight = 0;

  const tryPlace = (part, rotated) => {
    const w = rotated ? part.height : part.width;
    const h = rotated ? part.width : part.height;

    if (x + w > sheet.width) {
      x = 0;
      y += rowHeight + kerf;
      rowHeight = 0;
    }

    if (y + h > sheet.height) return false;

    placements.push({
      ...part,
      x,
      y,
      rotated,
    });

    x += w + kerf;
    rowHeight = Math.max(rowHeight, h);
    return true;
  };

  for (const part of parts) {
    let placed = tryPlace(part, false);
    if (!placed) placed = tryPlace(part, true);
    if (!placed) break;
  }

  return { cuts: placements, kerf };
}
