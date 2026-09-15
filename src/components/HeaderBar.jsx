import React from 'react';
import { Search, Plus, Settings, LogIn, LogOut, ShieldAlert, UserCheck } from 'lucide-react';

export default function HeaderBar({
  searchQuery,
  onSearchChange,
  onOpenNewObservation,
  onOpenSettings,
  user,
  isAdmin,
  onLogin,
  onLogout
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
            placeholder="🔍 Поиск по видам, биотопам, кодам..."
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

      {/* Auth & Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Add Observation button - always visible, triggers Auth modal if guest */}
        <button
          onClick={onOpenNewObservation}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md shadow-emerald-950 border border-emerald-400/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Наблюдение</span>
        </button>

        {user ? (
          <>
            {/* User Profile Badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full border border-emerald-500/40" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                  {user.displayName || user.email}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  {isAdmin ? '👑 Администратор' : '🔬 Исследователь'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 active:scale-95 text-slate-400 font-medium text-xs p-2 rounded-xl border border-slate-700 transition-all"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Google Sign-In Button */}
            <button
              onClick={onLogin}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md border border-teal-400/30 flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Войти</span>
            </button>
          </>
        )}

        {/* Settings modal trigger */}
        <button
          onClick={onOpenSettings}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs p-2 rounded-xl border border-slate-700 transition-all"
          title="Настройки системы"
        >
          <Settings className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </header>
  );
}
