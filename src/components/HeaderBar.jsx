import React from 'react';
import { Search, Plus, MapPin, Compass, Sparkles, Filter, Settings } from 'lucide-react';

export default function HeaderBar({
  searchQuery,
  onSearchChange,
  onOpenNewObservation,
  onOpenSettings,
  activeTab,
  onTabChange
}) {
  return (
    <header className="bg-slate-900 border-b border-emerald-900/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30 shadow-lg">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-900/40 border border-emerald-400/30">
          🦊
        </div>
        <div>
          <h1 className="font-black text-base md:text-lg text-slate-100 flex items-center gap-2 tracking-tight">
            ЭБИТА <span className="text-emerald-400 font-bold text-xs md:text-sm tracking-wider uppercase bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">Экологическая карта</span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Государственный природный заказник местного значения
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Поиск по видам, биотопам, кодам (например, Корсак, EB-000124)..."
            className="w-full bg-slate-950/80 text-xs text-slate-100 pl-9 pr-4 py-2 rounded-xl border border-emerald-900/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          title="Настройки системы"
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Настройки</span>
        </button>
      </div>
    </header>
  );
}
