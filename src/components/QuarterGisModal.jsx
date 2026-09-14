import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Layers, MapPin, Compass, Sliders, Save, RefreshCw, Copy, Check, Zap, Download, Edit2 } from 'lucide-react';
import { snapQuarterPolygons, computeOuterBoundaryFromQuarters } from '../utils/snapping';

export const DEFAULT_GIS_CALIBRATION = {
  shiftLat: -0.0355,
  shiftLng: -0.185,
  scaleLat: 2.175,
  scaleLng: 1.9,
  latMin: 51.00,
  latMax: 51.16,
  lngMin: 58.05,
  lngMax: 58.48
};

// Convert percentage coordinates [x%, y%] on photo to geographical [lat, lng] using live calibration
function pctToLatLng(pt, calibration) {
  if (!Array.isArray(pt) || pt.length < 2) return [51.07, 58.30];
  const [x, y] = pt;
  const {
    shiftLat = -0.0355,
    shiftLng = -0.185,
    scaleLat = 2.175,
    scaleLng = 1.9,
    latMin = 51.00,
    latMax = 51.16,
    lngMin = 58.05,
    lngMax = 58.48
  } = calibration || DEFAULT_GIS_CALIBRATION;

  const cx = 45;
  const cy = 45;

  const dx = (x - cx) * scaleLng;
  const dy = (y - cy) * scaleLat;

  const xAdj = cx + dx;
  const yAdj = cy + dy;

  const lat = (latMax - (yAdj / 100) * (latMax - latMin)) + shiftLat;
  const lng = (lngMin + (xAdj / 100) * (lngMax - lngMin)) + shiftLng;

  return [lat, lng];
}

// Inverse Helper: Convert geographical [lat, lng] back to percentage coordinates [x%, y%]
function latLngToPct(lat, lng, calibration) {
  const {
    shiftLat = -0.0355,
    shiftLng = -0.185,
    scaleLat = 2.175,
    scaleLng = 1.9,
    latMin = 51.00,
    latMax = 51.16,
    lngMin = 58.05,
    lngMax = 58.48
  } = calibration || DEFAULT_GIS_CALIBRATION;

  const cx = 45;
  const cy = 45;

  const yAdj = ((latMax - (lat - shiftLat)) / (latMax - latMin)) * 100;
  const xAdj = ((lng - shiftLng - lngMin) / (lngMax - lngMin)) * 100;

  const dy = yAdj - cy;
  const dx = xAdj - cx;

  const y = Number((cy + dy / scaleLat).toFixed(2));
  const x = Number((cx + dx / scaleLng).toFixed(2));

  return [x, y];
}

// Helper: Find index of segment closest to clicked point
function findClosestSegmentIndex(clickPt, polyPts) {
  if (!polyPts || polyPts.length < 2) return 0;
  const [px, py] = clickPt;
  let minDistance = Infinity;
  let bestIndex = 0;

  for (let i = 0; i < polyPts.length; i++) {
    const A = polyPts[i];
    const B = polyPts[(i + 1) % polyPts.length];

    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - A[0]) * dx + (py - A[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = A[0] + t * dx;
    const projY = A[1] + t * dy;
    const dist = Math.hypot(px - projX, py - projY);

    if (dist < minDistance) {
      minDistance = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// Helper: Insert a new point into polygon array right between segment endpoints
function insertVertexInSegment(polyPts, segIndex, newPoint) {
  const roundedPt = [Number(newPoint[0].toFixed(2)), Number(newPoint[1].toFixed(2))];
  const newPoly = [...polyPts];
  newPoly.splice(segIndex + 1, 0, roundedPt);
  return newPoly;
}

export default function QuarterGisModal({
  isOpen,
  onClose,
  quarter,
  quarters = [],
  outerBoundary = [],
  observations = [],
  onAddObservationAtCoords,
  onSaveTransformedBoundaries
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [currentQuarter, setCurrentQuarter] = useState(quarter);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto Snapping State
  const [isSnappingActive, setIsSnappingActive] = useState(false);
  const [snapThreshold, setSnapThreshold] = useState(1.5);

  // Manual Edit State
  const [isManualEditActive, setIsManualEditActive] = useState(false);
  const [editedQuarters, setEditedQuarters] = useState(quarters);

  // Sync editedQuarters when modal opens or quarters prop changes
  useEffect(() => {
    setEditedQuarters(quarters);
  }, [quarters, isOpen]);

  // Compute Snapped Quarters
  const snappedResult = snapQuarterPolygons(isManualEditActive ? editedQuarters : quarters, snapThreshold);
  const displayQuarters = isManualEditActive
    ? editedQuarters
    : (isSnappingActive ? snappedResult.snappedQuarters : quarters);

  // GIS Calibration state (persisted with user's exact parameters as default)
  const [isGisCalibrating, setIsGisCalibrating] = useState(false);
  const [calibration, setCalibration] = useState(() => {
    const saved = localStorage.getItem('ebita_gis_calibration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_GIS_CALIBRATION;
  });

  useEffect(() => {
    setCurrentQuarter(quarter);
  }, [quarter]);

  useEffect(() => {
    if (!isOpen || !currentQuarter || !mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Determine initial center
    const center = currentQuarter.polygon && currentQuarter.polygon.length > 0
      ? pctToLatLng(currentQuarter.polygon[0], calibration)
      : [51.07, 58.30];

    // Initialize Leaflet Map afresh WITH initial center and zoom
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    // Click map to pick location
    map.on('click', (e) => {
      if (onAddObservationAtCoords && !isManualEditActive) {
        onAddObservationAtCoords(e.latlng.lat, e.latlng.lng);
      }
    });

    tileLayerRef.current = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    polygonLayerRef.current = layerGroup;

    // Render ALL 13 Quarters Boundaries (their outer perimeter forms the reserve boundary)
    let selectedPoly = null;

    displayQuarters.forEach((q) => {
      if (!q.polygon || q.polygon.length === 0) return;
      const geoCoords = q.polygon.map((pt) => pctToLatLng(pt, calibration));
      const isSelected = String(q.id) === String(currentQuarter.id);
      const isTek = q.sector?.includes('Терекли');

      const poly = L.polygon(geoCoords, {
        color: isSelected ? '#f59e0b' : (isTek ? '#10b981' : '#06b6d4'),
        weight: isSelected ? 4 : (isSnappingActive || isManualEditActive ? 2.5 : 1.8),
        fillColor: isSelected ? '#f59e0b' : (isTek ? '#10b981' : '#06b6d4'),
        fillOpacity: isSelected ? 0.35 : 0.15
      });

      if (isSelected) {
        selectedPoly = poly;
      }

      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (isManualEditActive && isSelected) {
          // In manual mode, clicking on selected polygon segment divides that segment and inserts point between its endpoints!
          const clickPct = latLngToPct(e.latlng.lat, e.latlng.lng, calibration);
          const qIndex = displayQuarters.findIndex((item) => String(item.id) === String(currentQuarter.id));
          if (qIndex >= 0) {
            const polyPts = displayQuarters[qIndex].polygon;
            const segIdx = findClosestSegmentIndex(clickPct, polyPts);
            
            // Calculate exact segment midpoint
            const A = polyPts[segIdx];
            const B = polyPts[(segIdx + 1) % polyPts.length];
            const midPt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];

            const updatedPoly = insertVertexInSegment(polyPts, segIdx, midPt);

            setEditedQuarters((prev) => {
              const currentList = prev.length > 0 ? prev : displayQuarters;
              return currentList.map((item, idx) => {
                if (idx !== qIndex) return item;
                return { ...item, polygon: updatedPoly };
              });
            });
          }
        } else {
          setCurrentQuarter(q);
        }
      });

      poly.bindTooltip(
        `<div class="text-xs font-sans">
          <div class="font-extrabold ${isSelected ? 'text-amber-400' : 'text-slate-200'}">Квартал №${q.number}</div>
          <div class="text-[10px] text-slate-300">${q.sector || 'Заказник Эбита'}</div>
        </div>`,
        { permanent: isSelected, direction: 'center' }
      );

      poly.addTo(layerGroup);
    });

    // 3. Render Draggable Vertex Handles & Midpoint Add Handles in Manual Edit Mode
    if (isManualEditActive && currentQuarter) {
      const qIndex = displayQuarters.findIndex((q) => String(q.id) === String(currentQuarter.id));
      if (qIndex >= 0 && displayQuarters[qIndex].polygon) {
        const polyPts = displayQuarters[qIndex].polygon;

        // A. Draggable Corner Vertex Markers (Golden circles)
        polyPts.forEach((pt, pIdx) => {
          const latLng = pctToLatLng(pt, calibration);

          const vertexMarker = L.marker(latLng, {
            draggable: true,
            icon: L.divIcon({
              html: `<div class="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-xl cursor-move hover:scale-150 transition-transform"></div>`,
              className: 'vertex-drag-handle',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          });

          // Live Drag updates polygon
          vertexMarker.on('drag', (e) => {
            const newLatLng = e.target.getLatLng();
            const newPct = latLngToPct(newLatLng.lat, newLatLng.lng, calibration);

            setEditedQuarters((prev) => {
              const currentList = prev.length > 0 ? prev : displayQuarters;
              return currentList.map((item, idx) => {
                if (idx !== qIndex) return item;
                const newPoly = [...item.polygon];
                newPoly[pIdx] = newPct;
                return { ...item, polygon: newPoly };
              });
            });
          });

          // Right click to remove vertex
          vertexMarker.on('contextmenu', (e) => {
            L.DomEvent.stopPropagation(e);
            if (polyPts.length <= 3) {
              alert('В полигоне должно оставаться минимум 3 вершины!');
              return;
            }
            setEditedQuarters((prev) => {
              const currentList = prev.length > 0 ? prev : displayQuarters;
              return currentList.map((item, idx) => {
                if (idx !== qIndex) return item;
                const newPoly = item.polygon.filter((_, i) => i !== pIdx);
                return { ...item, polygon: newPoly };
              });
            });
          });

          vertexMarker.bindTooltip(`Узел #${pIdx + 1} (ПКМ: удалить)`, { direction: 'top' });
          vertexMarker.addTo(layerGroup);
        });

        // B. Midpoint "+ Add Vertex" Handles for Every Segment (Divides segment in half & connects strictly to its endpoints!)
        for (let i = 0; i < polyPts.length; i++) {
          const A = polyPts[i];
          const B = polyPts[(i + 1) % polyPts.length];
          const midPt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
          const midLatLng = pctToLatLng(midPt, calibration);

          const midMarker = L.marker(midLatLng, {
            icon: L.divIcon({
              html: `<div class="w-4 h-4 rounded-full bg-emerald-500 border border-slate-950 text-white font-black text-[11px] flex items-center justify-center cursor-pointer hover:scale-150 transition-transform shadow-lg">+</div>`,
              className: 'midpoint-add-handle',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          });

          midMarker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const updatedPoly = insertVertexInSegment(polyPts, i, midPt);

            setEditedQuarters((prev) => {
              const currentList = prev.length > 0 ? prev : displayQuarters;
              return currentList.map((item, idx) => {
                if (idx !== qIndex) return item;
                return { ...item, polygon: updatedPoly };
              });
            });
          });

          midMarker.bindTooltip(`➕ Разделить отрезок #${i + 1} пополам`, { direction: 'top' });
          midMarker.addTo(layerGroup);
        }
      }
    }

    // 4. Force Leaflet to recalculate container size & fit bounds smoothly
    const fitCamera = () => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize();
      if (selectedPoly) {
        mapRef.current.fitBounds(selectedPoly.getBounds(), { padding: [40, 40], animate: true });
      }
    };

    fitCamera();
    const t1 = setTimeout(fitCamera, 100);
    const t2 = setTimeout(fitCamera, 300);

    // Cleanup function
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, currentQuarter, displayQuarters, outerBoundary, calibration, isSnappingActive, isManualEditActive]);

  const handleSaveGisCalibration = () => {
    localStorage.setItem('ebita_gis_calibration', JSON.stringify(calibration));
    alert('Настройки масштаба и гео-привязки сохранены!');
    setIsGisCalibrating(false);
  };

  const handleResetGisCalibration = () => {
    setCalibration(DEFAULT_GIS_CALIBRATION);
    localStorage.setItem('ebita_gis_calibration', JSON.stringify(DEFAULT_GIS_CALIBRATION));
  };

  const handleCopySettings = () => {
    const dataStr = JSON.stringify(calibration, null, 2);
    navigator.clipboard.writeText(dataStr);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadSnappedJson = (snappedQuarters) => {
    const payload = {
      outerBoundary: outerBoundary,
      quarters: snappedQuarters
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebita_points_edited_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !currentQuarter) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
              🗺
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                Квартал №{currentQuarter.number} <span className="text-xs font-normal text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md">{currentQuarter.sector}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Площадь: <span className="font-mono text-emerald-400 font-bold">{currentQuarter.areaHa || '—'}</span> • Настройка и редактирование границ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Edit Toggle Button */}
            <button
              onClick={() => {
                setIsManualEditActive(!isManualEditActive);
                setIsSnappingActive(false);
                setIsGisCalibrating(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                isManualEditActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                  : 'bg-slate-900 text-amber-400 border-amber-500/40 hover:bg-slate-800'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isManualEditActive ? 'Выключить ручной режим' : '✏️ Ручной режим вершин'}</span>
            </button>

            {/* Auto Snapping Toggle Button */}
            <button
              onClick={() => {
                setIsSnappingActive(!isSnappingActive);
                setIsManualEditActive(false);
                setIsGisCalibrating(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                isSnappingActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSnappingActive ? 'Выключить смыкание' : '⚡ Авто-сомкнуть'}</span>
            </button>

            {/* Calibration Mode Toggle */}
            <button
              onClick={() => {
                setIsGisCalibrating(!isGisCalibrating);
                setIsSnappingActive(false);
                setIsManualEditActive(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                isGisCalibrating
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-amber-400 border-amber-500/40 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isGisCalibrating ? 'Выключить юстировку' : '🛠 Юстировка'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leaflet GIS Map View Container */}
        <div className="flex-1 relative overflow-hidden h-full min-h-[350px]">
          <div ref={mapContainerRef} className="w-full h-full z-10 min-h-[350px]" />

          {/* Floating Instructions */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-emerald-900/40 text-xs text-slate-200 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Квартал №{currentQuarter.number} подсвечен золотистым контуром.</span>
          </div>

          {/* MANUAL VERTEX EDITING DRAWER PANEL */}
          {isManualEditActive && (
            <div className="absolute top-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 p-4 rounded-2xl shadow-2xl w-84 text-xs text-slate-100 space-y-3.5 animate-fadeIn max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-extrabold text-amber-400">
                <span>✏️ Ручной редактор узлов Квартала №{currentQuarter.number}</span>
                <button onClick={() => setIsManualEditActive(false)} className="text-slate-400 hover:text-white font-bold">
                  ×
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <span>🖐 Тащите золотые узлы мышкой</span>
                </div>
                <p>• Перетаскивайте точки-узелки для изменения формы квартала.</p>
                <p>• Кликните по контуру полигона для добавления нового узла.</p>
                <p>• ПКМ (правый клик) по узлу для его удаления.</p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    if (onSaveTransformedBoundaries) {
                      onSaveTransformedBoundaries(editedQuarters, outerBoundary);
                      alert(`Ручные изменения для Квартала №${currentQuarter.number} и остальных границ успешно сохранены!`);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Применить и сохранить ручные границы</span>
                </button>

                <button
                  onClick={() => handleDownloadSnappedJson(editedQuarters)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-1.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>💾 Скачать измененный ebita_points.json</span>
                </button>
              </div>
            </div>
          )}

          {/* AUTO-SNAPPING DRAWER PANEL */}
          {isSnappingActive && (
            <div className="absolute top-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500 p-4 rounded-2xl shadow-2xl w-84 text-xs text-slate-100 space-y-3.5 animate-fadeIn max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-extrabold text-emerald-400">
                <span>⚡ Авто-притяжка зазоров (Snapping)</span>
                <button onClick={() => setIsSnappingActive(false)} className="text-slate-400 hover:text-white font-bold">
                  ×
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Порог притяжки узлов:</span>
                  <span className="text-emerald-400 font-mono font-bold">{snapThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.1"
                  value={snapThreshold}
                  onChange={(e) => setSnapThreshold(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Сомкнуто узлов:</span>
                  <span className="text-amber-400 font-extrabold font-mono text-xs">{snappedResult.snappedCount} точек</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Все зазоры между 13 кварталами в пределах {snapThreshold}% притянуты в единые смежные границы.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    if (onSaveTransformedBoundaries) {
                      onSaveTransformedBoundaries(snappedResult.snappedQuarters, outerBoundary);
                      alert('Сомкнутые границы кварталов успешно применены и сохранены!');
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Применить и сохранить кварталы</span>
                </button>

                <button
                  onClick={() => handleDownloadSnappedJson(snappedResult.snappedQuarters)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-1.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>💾 Скачать новый ebita_points.json</span>
                </button>
              </div>
            </div>
          )}

          {/* GIS CALIBRATION SLIDERS PANEL WITH EXPANDED RANGE AND DIRECT NUMERIC INPUTS */}
          {isGisCalibrating && (
            <div className="absolute top-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 p-4 rounded-2xl shadow-2xl w-84 text-xs text-slate-100 space-y-3.5 animate-fadeIn max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-extrabold text-amber-400">
                <span>🛠 Расширенная Юстировка (Широта/Долгота/Масштаб)</span>
                <button onClick={() => setIsGisCalibrating(false)} className="text-slate-400 hover:text-white font-bold">
                  ×
                </button>
              </div>

              {/* Shift Lat (-0.5 to +0.5) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">↕️ Сдвиг Сверху/Снизу (Широта):</span>
                  <input
                    type="number"
                    step="0.0005"
                    value={calibration.shiftLat}
                    onChange={(e) => setCalibration({ ...calibration, shiftLat: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-slate-950 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-700 text-right outline-none"
                  />
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.0005"
                  value={calibration.shiftLat}
                  onChange={(e) => setCalibration({ ...calibration, shiftLat: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Shift Lng (-0.5 to +0.5) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">↔️ Сдвиг Слева/Справа (Долгота):</span>
                  <input
                    type="number"
                    step="0.0005"
                    value={calibration.shiftLng}
                    onChange={(e) => setCalibration({ ...calibration, shiftLng: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-slate-950 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-700 text-right outline-none"
                  />
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.0005"
                  value={calibration.shiftLng}
                  onChange={(e) => setCalibration({ ...calibration, shiftLng: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Scale Lat (0.1 to 4.0) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">🔍 Высота (Scale Lat):</span>
                  <input
                    type="number"
                    step="0.005"
                    value={calibration.scaleLat}
                    onChange={(e) => setCalibration({ ...calibration, scaleLat: parseFloat(e.target.value) || 1 })}
                    className="w-20 bg-slate-950 text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-700 text-right outline-none"
                  />
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.005"
                  value={calibration.scaleLat}
                  onChange={(e) => setCalibration({ ...calibration, scaleLat: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Scale Lng (0.1 to 4.0) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">🔍 Ширина (Scale Lng):</span>
                  <input
                    type="number"
                    step="0.005"
                    value={calibration.scaleLng}
                    onChange={(e) => setCalibration({ ...calibration, scaleLng: parseFloat(e.target.value) || 1 })}
                    className="w-20 bg-slate-950 text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-700 text-right outline-none"
                  />
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.005"
                  value={calibration.scaleLng}
                  onChange={(e) => setCalibration({ ...calibration, scaleLng: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Copy Settings Button */}
              <button
                onClick={handleCopySettings}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 font-bold transition-all text-[11px]"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copySuccess ? 'Настройки скопированы!' : 'Скопировать настройки (JSON)'}</span>
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleResetGisCalibration}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Сброс
                </button>
                <button
                  onClick={handleSaveGisCalibration}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Сохранить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px] hidden sm:block">
            Вы можете кликнуть по соседнему кварталу прямо на карте для переключения выбранной зоны.
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold px-5 py-2 rounded-xl transition-all ml-auto"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}


