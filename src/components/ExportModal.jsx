import React, { useState } from 'react';
import { X, Download, FileCode, Code, Check, Copy } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, outerBoundary, quarters }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!isOpen) return null;

  // Prepare full data payload
  const fullDataJSON = {
    exportDate: new Date().toISOString(),
    reserveName: "Государственный Природный Заказник «Эбита»",
    outerBoundary: outerBoundary,
    quarters: quarters.map(q => ({
      id: q.id,
      number: q.number,
      sector: q.sector,
      polygon: q.polygon
    }))
  };

  // Prepare GeoJSON
  const geoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Внешняя граница ГПЗ «Эбита»", type: "outer_boundary" },
        geometry: {
          type: "Polygon",
          coordinates: [outerBoundary.map(p => [p[1], p[0]])] // GeoJSON format is [lng, lat]
        }
      },
      ...quarters.map(q => ({
        type: "Feature",
        properties: { name: `Квартал ${q.number}`, sector: q.sector, quarterId: q.id },
        geometry: {
          type: "Polygon",
          coordinates: [q.polygon.map(p => [p[1], p[0]])]
        }
      }))
    ]
  };

  // Prepare JavaScript Code File content
  const jsCodeContent = `// Сгенерированный файл координат заказника «Эбита»
// Дата экспорта: ${new Date().toLocaleString()}

export const MAP_CENTER = [51.070, 58.300];
export const MAP_INITIAL_ZOOM = 11;

export const EBITA_OUTER_BOUNDARY = ${JSON.stringify(outerBoundary, null, 2)};

export const EBITA_QUARTERS = ${JSON.stringify(quarters.map(q => ({
  id: q.id,
  number: q.number,
  sector: q.sector,
  color: q.color,
  polygon: q.polygon
})), null, 2)};
`;

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-400">Экспорт &amp; Сохранение Координат</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* JSON */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <FileCode className="w-4 h-4" /> JSON Файл
            </div>
            <p className="text-xs text-slate-400 flex-1">
              Структурированный файл координат со всеми 13 кварталами и внешней границей.
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => downloadFile('ebita_boundary_points.json', JSON.stringify(fullDataJSON, null, 2), 'application/json')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Скачать .json
              </button>
              <button
                onClick={() => handleCopyText(JSON.stringify(fullDataJSON, null, 2), 'json')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'json' ? 'Скопировано!' : 'Скопировать'}
              </button>
            </div>
          </div>

          {/* GeoJSON */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Code className="w-4 h-4" /> GeoJSON Standard
            </div>
            <p className="text-xs text-slate-400 flex-1">
              Стандартный ГИС-формат GeoJSON для работы в QGIS, ArcGIS и картсервисах.
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => downloadFile('ebita_zones.geojson', JSON.stringify(geoJSON, null, 2), 'application/geo+json')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Скачать .geojson
              </button>
              <button
                onClick={() => handleCopyText(JSON.stringify(geoJSON, null, 2), 'geojson')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                {copiedType === 'geojson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'geojson' ? 'Скопировано!' : 'Скопировать'}
              </button>
            </div>
          </div>

          {/* JS File */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <FileCode className="w-4 h-4" /> JavaScript (.js)
            </div>
            <p className="text-xs text-slate-400 flex-1">
              Файл `ebitaZones.js` с готовым кодом массивов для интеграции в любой веб-проект.
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => downloadFile('ebitaZones.js', jsCodeContent, 'text/javascript')}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Скачать ebitaZones.js
              </button>
              <button
                onClick={() => handleCopyText(jsCodeContent, 'js')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                {copiedType === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'js' ? 'Скопировано!' : 'Скопировать'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
