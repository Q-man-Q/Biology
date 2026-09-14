// Share & Transfer Utility for Ebita Boundary Points

// Encode boundary points object into URL Hash string
export function encodePointsToUrlHash(outerBoundary, quarters) {
  try {
    const payload = {
      v: 1,
      date: new Date().toISOString(),
      outer: outerBoundary,
      quarters: quarters.map(q => ({
        id: q.id,
        number: q.number,
        sector: q.sector,
        polygon: q.polygon
      }))
    };
    const jsonStr = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(jsonStr));
    return `${window.location.origin}${window.location.pathname}#points=${base64}`;
  } catch (err) {
    console.error('Failed to encode points to URL', err);
    return null;
  }
}

// Decode URL Hash payload back to boundary data
export function decodePointsFromUrlHash() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#points=')) return null;

    const base64 = hash.replace('#points=', '');
    const jsonStr = decodeURIComponent(atob(base64));
    const payload = JSON.parse(jsonStr);

    if (payload && (payload.outer || payload.quarters)) {
      return payload;
    }
  } catch (err) {
    console.error('Failed to decode points from URL hash', err);
  }
  return null;
}

// Parse imported JSON / GeoJSON / Text string into outer and quarters
export function parseImportedData(rawText) {
  try {
    const data = JSON.parse(rawText);

    // Case 1: GeoJSON FeatureCollection
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      let outer = null;
      let importedQuarters = [];

      data.features.forEach((feat) => {
        if (feat.geometry && feat.geometry.type === 'Polygon') {
          // GeoJSON is [lng, lat] -> convert to [lat, lng]
          const ring = feat.geometry.coordinates[0].map(pt => [pt[1], pt[0]]);
          if (feat.properties?.type === 'outer_boundary' || feat.properties?.name?.includes('Внешняя')) {
            outer = ring;
          } else {
            importedQuarters.push({
              id: feat.properties?.quarterId || (importedQuarters.length + 1),
              number: String(feat.properties?.quarterId || (importedQuarters.length + 1)),
              sector: feat.properties?.sector || "Участок",
              polygon: ring
            });
          }
        }
      });

      return { outer, quarters: importedQuarters.length > 0 ? importedQuarters : null };
    }

    // Case 2: Custom JSON payload { outer, quarters }
    if (data.outerBoundary || data.outer) {
      return {
        outer: data.outerBoundary || data.outer,
        quarters: data.quarters || null
      };
    }
  } catch (err) {
    // Case 3: Raw array of points [[lat, lng], ...]
    try {
      const arr = JSON.parse(rawText);
      if (Array.isArray(arr) && arr.length >= 3 && Array.isArray(arr[0])) {
        return { outer: arr, quarters: null };
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}
