import React from 'react';
import { Layers, MapPin, CheckCircle, Globe, Compass } from 'lucide-react';

export default function MapsTab({ activeLayer, onChangeLayer, quartersCount = 13 }) {
  const mapSources = [
    {
      id: 'osm',
      name: 'OpenStreetMap (Векторная схема)',
      description: 'Интерактивная топографическая карта OpenStreetMap с дорожной сетью и рельефом.',
      badge: 'Рекомендуется'
    },
    {
      id: 'sat_google',
      name: 'Google Satellite + Гибрид',
      description: 'Спутниковые снимки высокой точности с нанесением названий населенных пунктов и рек.',
      badge: 'Спутник'
    },
    {
      id: 'sat_esri',
      name: 'Esri World Imagery',
      description: 'Детальная космическая съемка земной поверхности от компании Esri.',
      badge: 'Космоснимок'
    }
  ];

  return (
    <div className="w-full h-full bg-slate-950 p-4 md:p-6 overflow-y-auto font-sans text-slate-100 flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-emerald-900/30 pb-4">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-cyan-400" />
          Картографическая Подложка и Слои
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Выбор источника карты и настройка отображения геоданных заказника «Эбита»
        </p>
      </div>

      {/* Map Tile Options */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          ОФИЦИАЛЬНЫЙ ИСТОЧНИК СНОСКИ КАРТЫ:
        </label>

        <div className="bg-slate-900 border border-emerald-500/50 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-amber-950 px-2 py-0.5 rounded text-amber-300 border border-amber-800">
                🛰 Спутниковая съемка
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Google Satellite (Спутник высокой точности)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Высокодетализированные космоснимки поверхности Заказника «Эбита» с привязкой гибридного слоя.
            </p>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap">
            ✓ Активная подложка
          </div>
        </div>
      </div>

      {/* Map Boundary Layers Info */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" /> Геопространственные слои заказника
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-400">Внешняя граница «Эбиты»</div>
              <div className="text-[11px] text-slate-400">Векторный полигон замкнутого периметра</div>
            </div>
            <span className="text-emerald-400 font-bold">Включено</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-cyan-400">Секторы и Кварталы ({quartersCount})</div>
              <div className="text-[11px] text-slate-400">Тереклинский и Эбитинский участки</div>
            </div>
            <span className="text-cyan-400 font-bold">Включено</span>
          </div>
        </div>
      </div>
    </div>
  );
}
