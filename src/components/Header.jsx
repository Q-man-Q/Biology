import React from 'react';
import { Share2, Download, RefreshCw } from 'lucide-react';

export default function Header({ onOpenShare, onOpenExport, onResetAll }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-30 select-none">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
          🗺
        </div>
        <div>
          <h1 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
            ЭБИТА <span className="text-emerald-400 font-normal">| Редактор &amp; Обмен Точками</span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Государственный Природный Заказник «Эбита» (Каргалинский р-н, Актюбинская обл.)
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenShare}
          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold py-1.5 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-all"
        >
          <Share2 className="w-4 h-4 stroke-[2.5]" /> 📲 Поделиться с другом
        </button>

        <button
          onClick={onOpenExport}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-all"
        >
          <Download className="w-4 h-4" /> Экспорт
        </button>

        <button
          onClick={onResetAll}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs transition-all"
          title="Сбросить все границы"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Сброс
        </button>
      </div>

    </header>
  );
}
