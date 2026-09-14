import React from 'react';
import { Map, Footprints, PawPrint, Trees, Layers, Download, Compass, ChevronRight } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, observationsCount = 0 }) {
  const menuItems = [
    { id: 'home', label: 'Главная', icon: Map, color: 'text-emerald-400', badge: null },
    { id: 'observations', label: 'Наблюдения', icon: Footprints, color: 'text-amber-400', badge: observationsCount },
    { id: 'species', label: 'Виды', icon: PawPrint, color: 'text-orange-400', badge: null },
    { id: 'biotopes', label: 'Биотопы', icon: Trees, color: 'text-green-400', badge: null },
    { id: 'maps', label: 'Карты', icon: Layers, color: 'text-cyan-400', badge: null },
    { id: 'export', label: 'Экспорт', icon: Download, color: 'text-indigo-400', badge: null }
  ];

  return (
    <aside className="w-56 md:w-64 bg-slate-900 border-r border-emerald-900/30 flex flex-col justify-between select-none z-20 flex-shrink-0">
      {/* Sidebar Header / Title */}
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>НАВИГАЦИЯ</span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1">
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Reserve Info Card in Sidebar Footer */}
      <div className="p-3 m-2 rounded-xl bg-slate-950/80 border border-emerald-900/30 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ГПЗ «Эбита»
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Левобережье реки Урал, Каргалинский р-н, Актюбинская область.
        </p>
      </div>
    </aside>
  );
}
