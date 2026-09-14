import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Info, Compass, Plus, ZoomIn, ZoomOut, RotateCcw, Globe, Sliders, Save, RefreshCw, X, Image as ImageIcon, Layers, Footprints, Trash2 } from 'lucide-react';
import QuarterGisModal, { DEFAULT_GIS_CALIBRATION } from './QuarterGisModal';
import { computeOuterBoundaryFromQuarters } from '../utils/snapping';

// Helper: Convert Schema % coordinates to geographical [lat, lng] using saved user calibration
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

// Helper: Point-in-polygon check for lat/lng inside geographic coordinates polygon
function isPointInPolygon(lat, lng, polyCoords) {
  let inside = false;
  for (let i = 0, j = polyCoords.length - 1; i < polyCoords.length; j = i++) {
    const xi = polyCoords[i][0], yi = polyCoords[i][1];
    const xj = polyCoords[j][0], yj = polyCoords[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function MapView({
  quarters = [],
  outerBoundary = [],
  observations = [],
  settings = {},
  selectedObservation = null,
  onSelectObservation,
  onDeleteObservation,
  onAddObservationAtCoords,
  onSaveTransformedBoundaries
}) {
  const { debugMode = true, showPhotoMapButton = true } = settings || {};

  // Main view mode: 'satellite' (Satellite Map with zones) | 'photo' (Photo image map)
  const [viewMode, setViewMode] = useState('satellite');

  // Leaflet Satellite Map Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Photo map zoom state
  const photoContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredQuarter, setHoveredQuarter] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedObsPopup, setSelectedObsPopup] = useState(null);

  // Keep selectedQuarter in ref for event handlers
  const selectedQuarterRef = useRef(selectedQuarter);
  useEffect(() => {
    selectedQuarterRef.current = selectedQuarter;
  }, [selectedQuarter]);

  // Modal for viewing quarter boundary on real GIS Leaflet map
  const [gisModalQuarter, setGisModalQuarter] = useState(null);

  // Calculate observations count in a specific quarter
  const getQuarterObsCount = (q) => {
    if (!q || !observations) return 0;
    const cal = getCalibration();
    const geoPoly = q.polygon ? q.polygon.map((pt) => pctToLatLng(pt, cal)) : [];

    return observations.filter((obs) => {
      if (obs.note && obs.note.includes(`Квартал №${q.number}`)) return true;
      if (obs.lat && obs.lng && geoPoly.length > 0) {
        return isPointInPolygon(obs.lat, obs.lng, geoPoly);
      }
      return false;
    }).length;
  };

  // Get current user calibration from localStorage
  const getCalibration = () => {
    const saved = localStorage.getItem('ebita_gis_calibration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_GIS_CALIBRATION;
  };

  // INITIALIZE MAIN SATELLITE LEAFLET MAP (WITH CLEANUP ON UNMOUNT/MODE TOGGLE)
  useEffect(() => {
    if (viewMode !== 'satellite' || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const cal = getCalibration();
    const initialCenter = quarters.length > 0 && quarters[0].polygon
      ? pctToLatLng(quarters[0].polygon[0], cal)
      : [51.07, 58.30];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    layerGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Map click -> Add field observation ONLY if a quarter is currently selected!
    map.on('click', (e) => {
      if (!selectedQuarterRef.current) {
        return;
      }
      if (onAddObservationAtCoords) {
        const q = selectedQuarterRef.current;
        const noteText = `Квартал №${q.number} (${q.sector || 'Заказник Эбита'})`;
        onAddObservationAtCoords(e.latlng.lat, e.latlng.lng, null, null, noteText);
      }
    });

    tileLayerRef.current = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google'
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

  // RENDER QUARTERS & BOUNDARY ON SATELLITE MAP
  useEffect(() => {
    if (viewMode !== 'satellite' || !mapRef.current || !layerGroupRef.current) return;

    const cal = getCalibration();
    layerGroupRef.current.clearLayers();
    markersGroupRef.current.clearLayers();

    // Render 13 Quarters Polygons on Satellite Map (the quarter boundaries form the reserve perimeter)
    quarters.forEach((q) => {
      if (!q.polygon || q.polygon.length === 0) return;
      const geoCoords = q.polygon.map((pt) => pctToLatLng(pt, cal));
      const isSelected = selectedQuarter?.id === q.id;
      const isTek = q.sector?.includes('Терекли');

      const poly = L.polygon(geoCoords, {
        color: isSelected ? '#f59e0b' : (isTek ? '#10b981' : '#06b6d4'),
        weight: isSelected ? 3.5 : 2.5,
        fillColor: isSelected ? '#f59e0b' : (isTek ? '#10b981' : '#06b6d4'),
        fillOpacity: isSelected ? 0.35 : 0.22
      });

      poly.on('mouseover', function () {
        if (selectedQuarter?.id !== q.id) {
          this.setStyle({ weight: 3.5, fillOpacity: 0.45, color: '#f59e0b' });
        }
        setHoveredQuarter(q);
      });

      poly.on('mouseout', function () {
        if (selectedQuarter?.id !== q.id) {
          this.setStyle({ weight: 2.5, fillOpacity: 0.22, color: isTek ? '#10b981' : '#06b6d4' });
        }
        setHoveredQuarter(null);
      });

      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);

        // If this quarter is NOT selected yet, select it first!
        if (selectedQuarterRef.current?.id !== q.id) {
          setSelectedQuarter(q);
          return;
        }

        // If it IS already selected, click adds an observation at clicked point inside it!
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const noteText = `Квартал №${q.number} (${q.sector || 'Заказник Эбита'})`;

        if (onAddObservationAtCoords) {
          onAddObservationAtCoords(lat, lng, null, null, noteText);
        }
      });

      poly.bindTooltip(
        `<div class="text-xs font-sans">
          <div class="font-extrabold ${isSelected ? 'text-amber-400' : 'text-amber-300'}">Квартал №${q.number}</div>
          <div class="text-[10px] text-slate-300">${q.sector || 'Заказник Эбита'}</div>
        </div>`,
        { permanent: true, direction: 'center' }
      );

      poly.addTo(layerGroupRef.current);
    });

    // 3. Render Observation Markers
    observations.forEach((obs) => {
      if (!obs.lat || !obs.lng) return;
      const customIcon = L.divIcon({
        html: `
          <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-300 shadow-2xl flex items-center justify-center font-bold text-sm">
            🐾
          </div>
        `,
        className: 'custom-marker-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([obs.lat, obs.lng], { icon: customIcon });

      const popupHtml = `
        <div class="p-1 font-sans text-xs max-w-xs space-y-1.5">
          <div class="font-extrabold text-emerald-400 flex items-center justify-between border-b border-slate-700/80 pb-1">
            <span>${obs.id}</span>
            <span class="text-[10px] text-slate-400 font-mono">${obs.date} ${obs.time}</span>
          </div>
          <div>
            <div class="font-extrabold text-slate-100 text-sm">${obs.species} (${obs.count} ос.)</div>
            <div class="text-[11px] text-amber-300 font-semibold mt-0.5">📍 ${obs.detectionType}</div>
            <div class="text-[10px] text-slate-300 mt-0.5 leading-tight">${obs.biotope || '—'}</div>
          </div>
          <div class="flex items-center gap-1.5 pt-1 border-t border-slate-800">
            <button id="view-obs-${obs.id}" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1">
              ✏️ Детали
            </button>
            <button id="delete-obs-${obs.id}" class="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1" title="Удалить наблюдение">
              🗑
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`view-obs-${obs.id}`);
        if (viewBtn && onSelectObservation) {
          viewBtn.onclick = () => onSelectObservation(obs);
        }

        const deleteBtn = document.getElementById(`delete-obs-${obs.id}`);
        if (deleteBtn && onDeleteObservation) {
          deleteBtn.onclick = () => {
            if (window.confirm(`Вы действительно хотите удалить наблюдение ${obs.id} (${obs.species})?`)) {
              mapRef.current.closePopup();
              onDeleteObservation(obs.id);
            }
          };
        }
      });
      marker.addTo(markersGroupRef.current);
    });

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 150);

  }, [viewMode, quarters, outerBoundary, observations, selectedQuarter]);

  // Center camera on selected observation when passed
  useEffect(() => {
    if (!selectedObservation || !selectedObservation.lat || !selectedObservation.lng || !mapRef.current) return;
    const targetLat = Number(selectedObservation.lat);
    const targetLng = Number(selectedObservation.lng);

    mapRef.current.setView([targetLat, targetLng], 16, { animate: true });

    setTimeout(() => {
      if (markersGroupRef.current) {
        markersGroupRef.current.eachLayer((layer) => {
          if (layer.getLatLng) {
            const pos = layer.getLatLng();
            if (Math.abs(pos.lat - targetLat) < 0.0001 && Math.abs(pos.lng - targetLng) < 0.0001) {
              layer.openPopup();
            }
          }
        });
      }
    }, 250);
  }, [selectedObservation, viewMode]);

  // Click on photo map (Observation creation disabled on photo map)
  const handlePhotoClick = (e) => {
    return;
  };

  const activeQuarter = selectedQuarter || hoveredQuarter;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2 select-none">
      
      {/* Top Left Control Bar: Mode Toggle & Info */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2">
        {/* VIEW MODE TOGGLE BUTTONS */}
        <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-emerald-900/40 shadow-xl">
          <button
            onClick={() => setViewMode('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              viewMode === 'satellite'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-300" />
            <span>🛰 Спутниковая карта с зонами</span>
          </button>

          {showPhotoMapButton && (
            <button
              onClick={() => setViewMode('photo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                viewMode === 'photo'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>🖼 Фото карты</span>
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: INTERACTIVE SATELLITE MAP WITH 13 ZONES */}
      {viewMode === 'satellite' ? (
        <div className="w-full h-full relative overflow-hidden flex-1">
          <div ref={mapContainerRef} className="w-full h-full z-10 min-h-[400px]" />
        </div>
      ) : (
        /* MODE 2: ORIGINAL PHOTO MAP IMAGE */
        <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
          <div
            ref={photoContainerRef}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-900/40 cursor-default transition-transform duration-200 flex-shrink-0"
          >
            <img
              src="/photo_2026-09-14_20-04-01.jpg"
              alt="Карта-схема ГПЗ «Эбита»"
              className="w-full h-full object-contain pointer-events-none select-none min-w-[650px]"
            />

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">

              {quarters.map((q) => {
                const isHovered = hoveredQuarter?.id === q.id;
                const isSelected = selectedQuarter?.id === q.id;
                const pointsStr = q.polygon ? q.polygon.map((p) => `${p[0]},${p[1]}`).join(' ') : '';
                const isTek = q.sector?.includes('Терекли');

                return (
                  <polygon
                    key={q.id}
                    points={pointsStr}
                    fill={
                      isSelected
                        ? 'rgba(245, 158, 11, 0.35)'
                        : isHovered
                        ? 'rgba(56, 189, 248, 0.3)'
                        : isTek
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(6, 182, 212, 0.14)'
                    }
                    stroke={isSelected ? '#f59e0b' : isHovered ? '#38bdf8' : isTek ? '#10b981' : '#06b6d4'}
                    strokeWidth={isSelected || isHovered ? '1.2' : '0.6'}
                    strokeDasharray="1.5 1.5"
                    className="transition-colors pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredQuarter(q)}
                    onMouseLeave={() => setHoveredQuarter(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuarter(q);
                    }}
                  />
                );
              })}
            </svg>

            {observations.map((obs) => {
              const xPct = obs.xPct !== undefined ? obs.xPct : (obs.lng > 30 ? ((obs.lng - 58.05) / (58.48 - 58.05)) * 100 : (obs.lng || 50));
              const yPct = obs.yPct !== undefined ? obs.yPct : (obs.lat > 30 ? ((51.16 - obs.lat) / (51.16 - 51.00)) * 100 : (obs.lat || 50));

              return (
                <div
                  key={obs.id}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedObsPopup(obs);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer hover:scale-125 transition-transform"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-300 shadow-2xl flex items-center justify-center font-bold text-sm">
                    🐾
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected/Hovered Quarter Info Floating Card Overlay */}
      {activeQuarter && (
        <div className="absolute bottom-6 left-6 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 p-4 rounded-2xl shadow-2xl w-80 animate-fadeIn text-xs space-y-2.5">
          <div className="font-extrabold text-amber-400 flex items-center justify-between">
            <span className="text-sm">Квартал №{activeQuarter.number}</span>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md border border-amber-800 font-bold">
              {activeQuarter.sector}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Площадь: <span className="font-mono text-emerald-400 font-extrabold">{activeQuarter.areaHa || '—'}</span></span>
            <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-300 font-extrabold font-mono flex items-center gap-1.5 shadow-inner">
              <span>🐾</span>
              <span>{getQuarterObsCount(activeQuarter)} набл.</span>
            </span>
          </div>

          {debugMode && (
            <div className="pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGisModalQuarter(activeQuarter);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] border border-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Детали и привязка к спутнику</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Observation Modal Card */}
      {selectedObsPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                <span>🐾 {selectedObsPopup.id}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {selectedObsPopup.date} {selectedObsPopup.time}
                </span>
              </div>
              <button
                onClick={() => setSelectedObsPopup(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-base font-extrabold text-slate-100">
                {selectedObsPopup.species} ({selectedObsPopup.count} ос.)
              </div>
              {selectedObsPopup.speciesLatin && (
                <div className="text-[11px] text-slate-400 italic font-serif">
                  {selectedObsPopup.speciesLatin}
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Тип обнаружения:</span>
                <span className="text-amber-300 font-bold">📍 {selectedObsPopup.detectionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Биотоп:</span>
                <span className="text-emerald-400 font-medium">{selectedObsPopup.biotope || '—'}</span>
              </div>
              {selectedObsPopup.lat && selectedObsPopup.lng && (
                <div className="flex justify-between font-mono text-[10px] pt-1 border-t border-slate-900">
                  <span className="text-slate-400">Координаты:</span>
                  <span className="text-cyan-300">{selectedObsPopup.lat.toFixed(5)}, {selectedObsPopup.lng.toFixed(5)}</span>
                </div>
              )}
            </div>

            {selectedObsPopup.description && (
              <div className="text-[11px] text-slate-300 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                "{selectedObsPopup.description}"
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const obs = selectedObsPopup;
                  setSelectedObsPopup(null);
                  if (onSelectObservation) onSelectObservation(obs);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5"
              >
                ✏️ Редактировать
              </button>

              <button
                onClick={() => {
                  const obsId = selectedObsPopup.id;
                  const speciesName = selectedObsPopup.species;
                  if (window.confirm(`Вы действительно хотите удалить наблюдение ${obsId} (${speciesName})?`)) {
                    setSelectedObsPopup(null);
                    if (onDeleteObservation) onDeleteObservation(obsId);
                  }
                }}
                className="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold p-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                title="Удалить наблюдение"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive GIS Modal */}
      <QuarterGisModal
        isOpen={!!gisModalQuarter}
        quarter={gisModalQuarter}
        quarters={quarters}
        outerBoundary={outerBoundary}
        observations={observations}
        onClose={() => setGisModalQuarter(null)}
        onAddObservationAtCoords={onAddObservationAtCoords}
        onSaveTransformedBoundaries={onSaveTransformedBoundaries}
      />
    </div>
  );
}

