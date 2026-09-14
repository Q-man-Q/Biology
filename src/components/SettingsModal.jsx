import React from 'react';
import { X, Settings, Sliders, ImageIcon, Download, Upload, RefreshCw, FileCode, Check } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  observations = [],
  outerBoundary = [],
  quarters = [],
  onImportData,
  onResetData
}) {
  if (!isOpen) return null;

  const { debugMode = true, showPhotoMapButton = true } = settings || {};

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
    downloadFile(JSON.stringify(data, null, 2), `ebita_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportGeoJSON = () => {
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
    const geoJsonData = {
      type: 'FeatureCollection',
      name: 'Ebita_Field_Observations',
      features
    };
    downloadFile(JSON.stringify(geoJsonData, null, 2), `ebita_geojson_${new Date().toISOString().split('T')[0]}.geojson`, 'application/json');
  };

  const handleExportCSV = () => {
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
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `ebita_observations_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-lg">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wide">
                НАСТРОЙКИ СИСТЕМЫ
              </h2>
              <p className="text-[11px] text-slate-400">
                Конфигурация режимов отображения, экспорт и импорт геоданных
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          
          {/* Section 1: Display & Debug Toggles */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> РЕЖИМЫ ОТОБРАЖЕНИЯ И ИНСТРУМЕНТЫ
            </h3>

            {/* Toggle 1: Debug Mode */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-100 flex items-center gap-2">
                  <span>🐞 Дебаг-режим (Юстировка и Редактирование Границ)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Показывает кнопки настройки гео-масштаба, авто-сомкнуть зазоры и ручной режим редактирования вершин.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => onUpdateSettings({ ...settings, debugMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Toggle 2: Photo Map Button Visibility */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-100 flex items-center gap-2">
                  <span>🖼 Кнопка переключения «Фото карты»</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Отображает кнопку переключения на режим оригинального фото карты над спутниковой картой.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={showPhotoMapButton}
                  onChange={(e) => onUpdateSettings({ ...settings, showPhotoMapButton: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Section 2: Export & Import */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-2">
              <Download className="w-4 h-4" /> ЭКСПОРТ И ИМПОРТ ГЕОДАННЫХ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleExportJSON}
                className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON Дамп</span>
              </button>

              <button
                onClick={handleExportGeoJSON}
                className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>GeoJSON</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Таблица CSV</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Загрузка и сброс:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Импортировать JSON файл</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                {onResetData && (
                  <button
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите сбросить все данные к исходным?')) {
                        onResetData();
                        onClose();
                      }
                    }}
                    className="bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-800 font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Сброс данных</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-2 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
}
