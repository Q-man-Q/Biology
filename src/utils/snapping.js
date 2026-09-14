/**
 * Topological Snapping Utility for Quarter Polygons
 * Snaps vertices that are within a distance threshold to close gaps/slivers between adjacent polygons.
 */

function pointToSegmentProjection(P, A, B) {
  const [px, py] = P;
  const [ax, ay] = A;
  const [bx, by] = B;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { dist: Math.hypot(px - ax, py - ay), proj: [ax, ay] };

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const dist = Math.hypot(px - projX, py - projY);

  return { dist, proj: [Number(projX.toFixed(2)), Number(projY.toFixed(2))] };
}

export function snapQuarterPolygons(quarters, threshold = 1.5) {
  if (!Array.isArray(quarters) || quarters.length === 0) {
    return { snappedQuarters: quarters, snappedCount: 0 };
  }

  // Deep copy original quarters
  const newQuarters = quarters.map((q) => ({
    ...q,
    polygon: q.polygon ? q.polygon.map((pt) => [Number(pt[0]), Number(pt[1])]) : []
  }));

  // Step 1: Cluster close vertices across all quarters
  const allVertices = [];
  newQuarters.forEach((q, qIndex) => {
    q.polygon.forEach((pt, pIndex) => {
      allVertices.push({
        qIndex,
        pIndex,
        x: pt[0],
        y: pt[1]
      });
    });
  });

  const parent = allVertices.map((_, idx) => idx);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  };

  for (let i = 0; i < allVertices.length; i++) {
    for (let j = i + 1; j < allVertices.length; j++) {
      const dx = allVertices[i].x - allVertices[j].x;
      const dy = allVertices[i].y - allVertices[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist <= threshold) {
        union(i, j);
      }
    }
  }

  const clusters = {};
  allVertices.forEach((v, idx) => {
    const root = find(idx);
    if (!clusters[root]) clusters[root] = [];
    clusters[root].push(v);
  });

  let snappedCount = 0;

  Object.values(clusters).forEach((cluster) => {
    if (cluster.length > 1) {
      const avgX = Number((cluster.reduce((sum, v) => sum + v.x, 0) / cluster.length).toFixed(2));
      const avgY = Number((cluster.reduce((sum, v) => sum + v.y, 0) / cluster.length).toFixed(2));
      cluster.forEach((v) => {
        newQuarters[v.qIndex].polygon[v.pIndex] = [avgX, avgY];
      });
      snappedCount += cluster.length;
    }
  });

  // Step 2: Edge-Projection Snapping for remaining unclustered points near neighbor edges
  newQuarters.forEach((q1, q1Idx) => {
    q1.polygon.forEach((pt, pIdx) => {
      let minDist = threshold * 0.8;
      let bestProj = null;

      newQuarters.forEach((q2, q2Idx) => {
        if (q1Idx === q2Idx) return;
        const poly2 = q2.polygon;
        for (let i = 0; i < poly2.length; i++) {
          const A = poly2[i];
          const B = poly2[(i + 1) % poly2.length];
          const { dist, proj } = pointToSegmentProjection(pt, A, B);
          if (dist > 0.001 && dist < minDist) {
            minDist = dist;
            bestProj = proj;
          }
        }
      });

      if (bestProj) {
        newQuarters[q1Idx].polygon[pIdx] = bestProj;
        snappedCount++;
      }
    });
  });

  return { snappedQuarters: newQuarters, snappedCount };
}

/**
 * Extract exact outer perimeter polygon loop from a collection of adjacent quarter polygons.
 */
export function computeOuterBoundaryFromQuarters(quarters) {
  if (!Array.isArray(quarters) || quarters.length === 0) return [];

  function getKey(pt) {
    return `${Number(pt[0]).toFixed(4)},${Number(pt[1]).toFixed(4)}`;
  }

  const edgeCounts = new Map();
  const edgeMap = new Map();

  quarters.forEach((q) => {
    const poly = q.polygon;
    if (!poly || poly.length === 0) return;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const k1 = getKey(p1);
      const k2 = getKey(p2);
      const uKey = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      edgeCounts.set(uKey, (edgeCounts.get(uKey) || 0) + 1);

      if (!edgeMap.has(k1)) edgeMap.set(k1, []);
      edgeMap.get(k1).push({ p1, p2, k1, k2, uKey });
    }
  });

  const nextMap = new Map();
  let firstEdge = null;

  edgeMap.forEach((edges) => {
    edges.forEach((e) => {
      if (edgeCounts.get(e.uKey) === 1) {
        if (!firstEdge) firstEdge = e;
        nextMap.set(e.k1, e.p2);
      }
    });
  });

  if (!firstEdge) return [];

  const outerPolygon = [];
  let currPt = firstEdge.p1;
  let currKey = getKey(currPt);
  const startKey = currKey;

  for (let i = 0; i < 500; i++) {
    outerPolygon.push(currPt);
    const nextPt = nextMap.get(currKey);
    if (!nextPt) break;
    currPt = nextPt;
    currKey = getKey(currPt);
    if (currKey === startKey) break;
  }

  return outerPolygon;
}
