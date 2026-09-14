import React, { useState } from 'react';
import { Footprints, Plus, Search, Filter, Calendar, MapPin, Edit3, Trash2, Eye, Camera, Tag } from 'lucide-react';
import { DETECTION_TYPES, BIOTOPES_LIST } from '../data/ebitaData';

export default function ObservationsTab({
  observations = [],
  onOpenNewObservation,
  onViewObservation,
  onEditObservation,
  onDeleteObservation,
  onSelectObservationOnMap
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterBiotope, setFilterBiotope] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredObservations = observations.filter((obs) => {
    const matchesSearch =
      obs.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (obs.description && obs.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (obs.note && obs.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || obs.detectionType === filterType;
    const matchesBiotope = filterBiotope === 'ALL' || obs.biotope === filterBiotope;

    return matchesSearch && matchesType && matchesBiotope;
  });

  return (
    <div className="w-full h-full bg-slate-950 p-4 md:p-6 overflow-y-auto font-sans text-slate-100 flex flex-col space-y-6 select-none">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Footprints className="w-6 h-6 text-amber-400" />
            Журнал Полевых Наблюдений <span className="text-xs font-normal text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded-full">(Changelog)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Хронологический список всех зафиксированных фактов встреч млекопитающих в ГПЗ «Эбита»
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по коду, виду, описанию..."
              className="w-full bg-slate-950 text-xs text-slate-100 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Filter by Detection Type */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              <option value="ALL">Все типы обнаружения</option>
              {DETECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filter by Biotope */}
          <div className="flex items-center gap-2">
            <select
              value={filterBiotope}
              onChange={(e) => setFilterBiotope(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              <option value="ALL">Все биотопы</option>
              {BIOTOPES_LIST.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observation Cards Stream List */}
      {filteredObservations.length > 0 ? (
        <div className="space-y-3">
          {filteredObservations.map((obs) => (
            <div
              key={obs.id}
              onClick={() => {
                if (onViewObservation) onViewObservation(obs);
                else if (onEditObservation) onEditObservation(obs);
              }}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all shadow-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group cursor-pointer"
            >
              {/* Main Information */}
              <div className="flex items-start gap-3 flex-1">
                {obs.photos && obs.photos[0] ? (
                  <img
                    src={obs.photos[0]}
                    alt={obs.species}
                    className="w-16 h-16 rounded-xl object-cover border border-emerald-500/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl flex-shrink-0 text-amber-400">
                    🐾
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {obs.id}
                    </span>
                    <span className="text-sm font-extrabold text-slate-100">
                      {obs.species}
                    </span>
                    <span className="text-xs bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-800">
                      {obs.count} ос.
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-cyan-400" /> {obs.date} {obs.time}
                    </span>
                  </div>

                  <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {obs.detectionType}
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400">Биотоп:</span> {obs.biotope || '—'}
                  </div>

                  {obs.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic">
                      "{obs.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Coordinates & Actions */}
              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{obs.lat?.toFixed(5)}, {obs.lng?.toFixed(5)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectObservationOnMap && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectObservationOnMap(obs);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                      title="Показать на карте"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Карта
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditObservation(obs);
                    }}
                    className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Изм.
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить полевое наблюдение ${obs.id}?`)) {
                        onDeleteObservation(obs.id);
                      }
                    }}
                    className="bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-800 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Footprints className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-sm text-slate-300">Полевых наблюдений не найдено</p>
          <p className="text-xs mt-1">Попробуйте изменить параметры поиска или добавьте первое наблюдение</p>
        </div>
      )}
    </div>
  );
}
