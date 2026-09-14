import React, { useState } from 'react';
import { PawPrint, Search, Footprints, Tag } from 'lucide-react';
import { MAMMALS_SPECIES } from '../data/ebitaData';

export default function SpeciesTab({ observations = [], onSelectSpeciesFilter }) {
  const [search, setSearch] = useState('');

  // Calculate observations count and individuals count per species
  const speciesStats = MAMMALS_SPECIES.map((s) => {
    const matchedObs = observations.filter(
      (o) => o.species.toLowerCase() === s.name.toLowerCase() || (o.speciesLatin && o.speciesLatin.toLowerCase() === s.latinName.toLowerCase())
    );
    const obsCount = matchedObs.length;
    const totalIndividuals = matchedObs.reduce((sum, o) => sum + (parseInt(o.count, 10) || 1), 0);

    return {
      ...s,
      obsCount,
      totalIndividuals
    };
  });

  const filteredSpecies = speciesStats.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.latinName.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-slate-950 p-4 md:p-6 overflow-y-auto font-sans text-slate-100 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-orange-400" />
            Виды Млекопитающих Заказника «Эбита»
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Каталог фауны млекопитающих Актюбинской области, отмеченных на территории ГПЗ «Эбита»
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск вида или латинского названия..."
            className="w-full bg-slate-900 text-xs text-slate-100 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Grid of Clean Species Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpecies.map((s) => (
          <div
            key={s.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              {/* Header with Icon & Category Tag */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xl font-bold">
                    🦊
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-wide">{s.name}</h3>
                    <p className="text-xs text-slate-400 italic font-mono">{s.latinName}</p>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase bg-slate-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md">
                  {s.category}
                </span>

                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md">
                  {s.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {s.description}
              </p>
            </div>

            {/* Footer Stats & Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-slate-300">
                  <Footprints className="w-3.5 h-3.5 text-amber-400" />
                  <span>Встреч:</span>
                  <span className="font-extrabold text-emerald-400 font-mono">{s.obsCount}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <span>Особей:</span>
                  <span className="font-extrabold text-amber-400 font-mono">{s.totalIndividuals}</span>
                </div>
              </div>

              {onSelectSpeciesFilter && (
                <button
                  onClick={() => onSelectSpeciesFilter(s.name)}
                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                >
                  Наблюдения
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
