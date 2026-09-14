import React from 'react';
import { Trees, Footprints, PawPrint, ChevronRight } from 'lucide-react';
import { BIOTOPES_LIST } from '../data/ebitaData';

export default function BiotopesTab({ observations = [], onSelectBiotopeFilter }) {
  const biotopeStats = BIOTOPES_LIST.map((biotopeName) => {
    const matchedObs = observations.filter((o) => o.biotope === biotopeName);
    const count = matchedObs.length;
    const speciesSet = new Set(matchedObs.map((o) => o.species));

    return {
      name: biotopeName,
      count,
      speciesCount: speciesSet.size,
      speciesList: Array.from(speciesSet)
    };
  });

  return (
    <div className="w-full h-full bg-slate-950 p-4 md:p-6 overflow-y-auto font-sans text-slate-100 flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-emerald-900/30 pb-4">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Trees className="w-6 h-6 text-green-400" />
          Экологические Биотопы Заказника «Эбита»
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Типы природных ландшафтов заказника и распределение зарегистрированных полевых наблюдений
        </p>
      </div>

      {/* Biotope Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biotopeStats.map((b, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl shadow-lg transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-lg font-bold">
                    🌿
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100">{b.name}</h3>
                    <p className="text-[11px] text-slate-400">Ландшафтная зона ГПЗ «Эбита»</p>
                  </div>
                </div>

                <span className="bg-emerald-950 text-emerald-400 font-mono font-extrabold text-xs px-2.5 py-1 rounded-xl border border-emerald-800">
                  {b.count} наблюдений
                </span>
              </div>

              {/* Observed Species in this Biotope */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <PawPrint className="w-3.5 h-3.5 text-orange-400" /> Отмеченные виды ({b.speciesCount}):
                </div>
                {b.speciesList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {b.speciesList.map((sp) => (
                      <span
                        key={sp}
                        className="bg-slate-950 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-800"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">Наблюдения пока не зафиксированы</span>
                )}
              </div>
            </div>

            {/* Filter Action */}
            {onSelectBiotopeFilter && (
              <div className="pt-3 border-t border-slate-800 mt-4 flex justify-end">
                <button
                  onClick={() => onSelectBiotopeFilter(b.name)}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                >
                  <Footprints className="w-3.5 h-3.5 text-amber-400" /> Показать наблюдения <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
