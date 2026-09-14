import React, { useState } from 'react';
import { Download, Upload, Copy, Check, FileCode, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function ExportTab({
  observations = [],
  outerBoundary = [],
  quarters = [],
  onImportData,
  onResetData
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate GeoJSON representation
  const generateGeoJSON = () => {
    const features = observations.map((obs) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [obs.lng, obs.lat]
      },
      properties: {
        id: obs.id,
        species: obs.species,
        speciesLatin: obs.speciesLatin,
        detectionType: obs.detectionType,
        count: obs.count,
        biotope: obs.biotope,
        date: obs.date,
        time: obs.time,
        description: obs.description
      }
    }));

    return {
      type: 'FeatureCollection',
      name: 'Ebita_Field_Observations',
      features
    };
  };

  // Generate CSV representation
  const generateCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Lat', 'Lng', 'Species', 'Latin', 'Count', 'DetectionType', 'Biotope', 'Description'];
    const rows = observations.map((o) => [
      o.id,
      o.date,
      o.time,
      o.lat,
      o.lng,
      `"${(o.species || '').replace(/"/g, '""')}"`,
      `"${(o.speciesLatin || '').replace(/"/g, '""')}"`,
      o.count,
      `"${(o.detectionType || '').replace(/"/g, '""')}"`,
      `"${(o.biotope || '').replace(/"/g, '""')}"`,
      `"${(o.description || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // Download helper
  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      reserveName: 'Государственный Природный Заказник «Эбита»',
      outerBoundary,
      quarters,
      observations
    };
    downloadFile(JSON.stringify(data, null, 2), `ebita_observations_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportGeoJSON = () => {
    downloadFile(JSON.stringify(generateGeoJSON(), null, 2), `ebita_geojson_${new Date().toISOString().split('T')[0]}.geojson`, 'application/json');
  };

  const handleExportCSV = () => {
    downloadFile(generateCSV(), `ebita_observations_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleCopyJSON = () => {
    const data = {
      outerBoundary,
      quarters,
      observations
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (onImportData) {
          onImportData(parsed);
          alert('Данные успешно импортированы!');
        }
      } catch (err) {
        alert('Ошибка при чтении файла JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full bg-slate-950 p-4 md:p-6 overflow-y-auto font-sans text-slate-100 flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-emerald-900/30 pb-4">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Download className="w-6 h-6 text-indigo-400" />
          Экспорт и Импорт Геоданных Заказника
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Выгрузка зафиксированных полевых наблюдений, границы и кварталов в стандартизованных форматах
        </p>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* JSON Export */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg mb-2">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-100">Формат JSON</h3>
            <p className="text-xs text-slate-400 mt-1">
              Полный дамп геоданных включая наблюдения, кварталы и внешнюю границу.
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Скачать JSON
          </button>
        </div>

        {/* GeoJSON Export */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg mb-2">
              🌍
            </div>
            <h3 className="font-extrabold text-sm text-slate-100">Формат GeoJSON</h3>
            <p className="text-xs text-slate-400 mt-1">
              Стандартный пространственный формат для QGIS, ArcGIS и ГИС-платформ.
            </p>
          </div>
          <button
            onClick={handleExportGeoJSON}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Скачать GeoJSON
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-100">Таблица CSV / Excel</h3>
            <p className="text-xs text-slate-400 mt-1">
              Табличный вид для анализа в Microsoft Excel или Google Таблицах.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-amber-950 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Скачать CSV
          </button>
        </div>
      </div>

      {/* Quick Clipboard Copy & File Import */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="font-extrabold text-sm text-slate-200">Дополнительные действия</h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyJSON}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
          >
            {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copySuccess ? 'Скопировано!' : 'Скопировать JSON в буфер'}</span>
          </button>

          <label className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4" /> Импортировать JSON (например, points file)
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {onResetData && (
            <button
              onClick={() => {
                if (confirm('Вы уверены, что хотите сбросить данные к исходным?')) {
                  onResetData();
                }
              }}
              className="bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all ml-auto"
            >
              <RefreshCw className="w-4 h-4" /> Сбросить данные
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
