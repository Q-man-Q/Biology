import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('ebita_eco_observations');
      localStorage.removeItem('ebita_eco_reserve_points');
      localStorage.removeItem('ebita_app_settings');
      localStorage.removeItem('ebita_gis_calibration');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-100">
                Произошла ошибка отображения
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Приложение столкнулось с непредвиденной ошибкой в данных или памяти браузера.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-red-300 overflow-x-auto max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" /> Перезагрузить
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="flex-1 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-500/50 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Очистить кэш
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
