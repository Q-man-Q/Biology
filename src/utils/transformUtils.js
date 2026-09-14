// Utility for 2D affine transformation (Offset X, Offset Y, Scale X, Scale Y, Rotation)

export function transformPoint(pt, center, transform) {
  if (!Array.isArray(pt) || pt.length < 2) return pt;
  const [x, y] = pt;
  const [cx, cy] = center;
  const { offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1, rotation = 0 } = transform;

  // 1. Shift relative to center
  let dx = (x - cx) * scaleX;
  let dy = (y - cy) * scaleY;

  // 2. Rotate if angle != 0
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    dx = rx;
    dy = ry;
  }

  // 3. Re-center and apply offset
  const xNew = Number((cx + dx + offsetX).toFixed(2));
  const yNew = Number((cy + dy + offsetY).toFixed(2));

  return [xNew, yNew];
}

export function transformPolygon(polygon, center, transform) {
  if (!Array.isArray(polygon)) return [];
  return polygon.map((pt) => transformPoint(pt, center, transform));
}
