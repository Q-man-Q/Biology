import React from 'react';
import { Footprints, PawPrint, Trees, Calendar } from 'lucide-react';

export default function FooterBar({
  observationsCount = 0,
  speciesCount = 0,
  biotopesCount = 0,
  lastObservationDate = '—'
}) {
  return (
    <footer className="bg-slate-900 border-t border-emerald-900/40 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-300 z-30 select-none shadow-inner">
      <div className="flex flex-wrap items-center gap-4 font-medium text-[11px] md:text-xs">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Footprints className="w-3.5 h-3.5 text-amber-400" />
          <span>Наблюдений:</span>
          <span className="font-extrabold text-emerald-400 font-mono">{observationsCount}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <PawPrint className="w-3.5 h-3.5 text-orange-400" />
          <span>Видов:</span>
          <span className="font-extrabold text-amber-400 font-mono">{speciesCount}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Trees className="w-3.5 h-3.5 text-green-400" />
          <span>Биотопов:</span>
          <span className="font-extrabold text-green-400 font-mono">{biotopesCount}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Последнее:</span>
          <span className="font-bold text-slate-200 font-mono">{lastObservationDate}</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 hidden sm:block">
        ГПЗ «Эбита» • Система мониторинга биоразнообразия
      </div>
    </footer>
  );
}
