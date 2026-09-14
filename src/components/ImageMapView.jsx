import React, { useState, useRef, useEffect } from 'react';
import { Layers, Move, RefreshCw, Save, Trash2, Plus, Copy, Check, Share2, Download, Eye, MapPin } from 'lucide-react';

export default function ImageMapView({
  quarters = [],
  outerBoundary = [],
  onSaveCustomBoundary,
  onResetAllBoundaries,
  onOpenShare,
  onOpenExport
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Selected Target for Editing: 'outer' or quarter ID (1..13)
  const [selectedTarget, setSelectedTarget] = useState('outer');
  const [activeVertices, setActiveVertices] = useState([]); // array of [x%, y%]

  // Dragging & click prevention state
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hoveredQuarterId, setHoveredQuarterId] = useState(null);
  const [clickMode, setClickMode] = useState('drag'); // 'drag' (only move handles) | 'add' (click map to add new points)

  const justDraggedRef = useRef(false);

  // Manual input state
  const [inputX, setInputX] = useState('');
  const [inputY, setInputY] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync activeVertices when selectedTarget changes or props update
  useEffect(() => {
    if (selectedTarget === 'outer') {
      setActiveVertices(outerBoundary ? outerBoundary.map(p => [...p]) : []);
    } else {
      const qId = parseInt(selectedTarget, 10);
      const q = quarters.find(item => item.id === qId);
      setActiveVertices((q && q.polygon) ? q.polygon.map(p => [...p]) : []);
    }
  }, [selectedTarget, outerBoundary, quarters]);

  // Convert mouse event position to relative [x%, y%] coordinates
  const getRelativeCoords = (e) => {
    if (!containerRef.current) return [0, 0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  };

  // Click on image container to add new vertex point (ONLY if clickMode === 'add' and not dragging)
  const handleContainerClick = (e) => {
    if (justDraggedRef.current || draggingIdx !== null) {
      justDraggedRef.current = false;
      return;
    }

    if (e.target.closest('.vertex-handle') || e.target.closest('.no-map-click')) {
      return;
    }

    // Only add points if user explicitly activated 'add' mode or pressed Add
    if (clickMode === 'add') {
      const [x, y] = getRelativeCoords(e);
      const updated = [...activeVertices, [x, y]];
      setActiveVertices(updated);
    }
  };

  // Start dragging handle
  const handleMarkerMouseDown = (e, idx) => {
    e.stopPropagation();
    justDraggedRef.current = true;
    setDraggingIdx(idx);
  };

  // Mouse move handler for live 60fps dragging over image
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingIdx === null || !containerRef.current) return;
      justDraggedRef.current = true;
      const [x, y] = getRelativeCoords(e);

      setActiveVertices(prev => {
        const copy = [...prev];
        copy[draggingIdx] = [x, y];
        return copy;
      });
    };

    const handleMouseUp = () => {
      if (draggingIdx !== null) {
        setDraggingIdx(null);
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 150);
      }
    };

    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIdx]);

  // Save current target vertices
  const handleSaveCurrentTarget = () => {
    if (activeVertices.length < 3) {
      alert('Укажите не менее 3 точек для формирования замкнутого полигона!');
      return;
    }
    onSaveCustomBoundary(selectedTarget, activeVertices);
    alert('Точки сохранены в память!');
  };

  // Remove point by index
  const handleRemovePointIndex = (idx) => {
    if (activeVertices.length <= 3) {
      alert('Минимальное число точек для полигона — 3!');
      return;
    }
    const updated = activeVertices.filter((_, i) => i !== idx);
    setActiveVertices(updated);
  };

  // Manual input add
  const handleAddManualPoint = (e) => {
    e.preventDefault();
    const xNum = parseFloat(inputX);
    const yNum = parseFloat(inputY);
    if (isNaN(xNum) || isNaN(yNum)) {
      alert('Введите корректные процентные координаты X% и Y% (0..100)!');
      return;
    }
    setActiveVertices([...activeVertices, [xNum, yNum]]);
    setInputX('');
    setInputY('');
  };

  // Copy JSON coordinates
  const handleCopyCoords = () => {
    const text = JSON.stringify(activeVertices, null, 2);
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getTargetName = () => {
    if (selectedTarget === 'outer') return 'Внешняя граница ГПЗ «Эбита»';
    const q = quarters.find(item => String(item.id) === String(selectedTarget));
    return q ? `Квартал №${q.number} (${q.sector})` : `Квартал ${selectedTarget}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden select-none">
      
      {/* Map Image Canvas Area */}
      <div className="relative flex-1 h-[60vh] md:h-full bg-slate-900 overflow-hidden flex items-center justify-center p-2">
        
        {/* Interactive Map Image Container */}
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className={`relative max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${clickMode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ aspectRatio: '1.5 / 1' }}
        >
          {/* Official Topographic Map Schema Image */}
          <img
            ref={imageRef}
            src="/ebita_map_schema.jpg"
            alt="Карта-схема ГПЗ «Эбита»"
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* SVG Layer for Rendered Polygons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            
            {/* Outer Reserve Boundary */}
            {outerBoundary && outerBoundary.length > 0 && (
              <polygon
                points={outerBoundary.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="rgba(16, 185, 129, 0.08)"
                stroke="#10b981"
                strokeWidth={selectedTarget === 'outer' ? '0.8' : '1.2'}
                strokeDasharray={selectedTarget === 'outer' ? '2 2' : '3 3'}
              />
            )}

            {/* Quarters Polygons */}
            {quarters.map((q) => {
              const isSelected = String(selectedTarget) === String(q.id);
              const isHovered = hoveredQuarterId === q.id;
              const pointsStr = q.polygon.map(p => `${p[0]},${p[1]}`).join(' ');

              return (
                <polygon
                  key={q.id}
                  points={pointsStr}
                  fill={isSelected ? 'rgba(245, 158, 11, 0.15)' : (isHovered ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.12)')}
                  stroke={isSelected ? '#f59e0b' : (isHovered ? '#38bdf8' : q.color)}
                  strokeWidth={isSelected ? '1' : '0.6'}
                  strokeDasharray="1.5 1.5"
                  className="transition-colors pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredQuarterId(q.id)}
                  onMouseLeave={() => setHoveredQuarterId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTarget(String(q.id));
                  }}
                />
              );
            })}

            {/* Active Editing Live Polygon (Yellow Highlight) */}
            {activeVertices && activeVertices.length >= 3 && (
              <polygon
                points={activeVertices.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="rgba(251, 191, 36, 0.25)"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            )}
          </svg>

          {/* Draggable Vertex Handles sitting directly on top of the image */}
          {activeVertices.map((pt, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => handleMarkerMouseDown(e, idx)}
              onClick={(e) => e.stopPropagation()}
              style={{ left: `${pt[0]}%`, top: `${pt[1]}%` }}
              className="vertex-handle absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
              title={`Точка #${idx + 1} [${pt[0]}%, ${pt[1]}%]`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-slate-950 ring-4 ring-amber-400/60 text-slate-950 font-black text-xs flex items-center justify-center shadow-2xl font-mono pointer-events-auto">
                {idx + 1}
              </div>
            </div>
          ))}

        </div>

        {/* Top Banner Guide with Mode Selector */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border-2 border-amber-500 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-100 flex flex-wrap items-center gap-3 no-map-click">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="uppercase">Режим карты:</span>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => setClickMode('drag')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] ${
                clickMode === 'drag' ? 'bg-amber-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" /> 🖐 Только перетаскивать точки
            </button>

            <button
              onClick={() => setClickMode('add')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] ${
                clickMode === 'add' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> ➕ Добавлять новые точки кликом
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls & Coordinates Panel */}
      <div className="w-full md:w-[420px] h-[40vh] md:h-full bg-slate-900 border-l border-slate-800 flex flex-col p-4 overflow-y-auto custom-scrollbar z-20">
        
        {/* Object Selector */}
        <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
            1. Выберите квартал для расстановки точек:
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-bold rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
          >
            <option value="outer">🌳 Внешняя граница заказника «Эбита»</option>
            <optgroup label="Кварталы заказника">
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>Квартал №{q.number} ({q.sector} — {q.areaHa})</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Save & Share Bar */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveCurrentTarget}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-all"
          >
            <Save className="w-4 h-4" /> СОХРАНИТЬ ТОЧКИ
          </button>

          <button
            onClick={onOpenShare}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" /> 📲 Передать другу
          </button>
        </div>

        {/* Manual Input Form */}
        <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-2">
            2. Ручной ввод координат в процентах (X%, Y%):
          </div>
          <form onSubmit={handleAddManualPoint} className="flex gap-2">
            <input
              type="text"
              placeholder="X % (0..100)"
              value={inputX}
              onChange={(e) => setInputX(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Y % (0..100)"
              value={inputY}
              onChange={(e) => setInputY(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Добавить
            </button>
          </form>
        </div>

        {/* Points Table List */}
        <div className="flex-1 flex flex-col min-h-[220px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-850 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Точки объекта {getTargetName()}:</span>
            <span className="font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Точек: {activeVertices.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1 text-xs font-mono">
            {activeVertices.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                Нет точек. Кликните по карте-схеме, чтобы поставить первую точку.
              </div>
            ) : (
              activeVertices.map((pt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/50 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>
                      [X: {pt[0]}%, Y: {pt[1]}%]
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemovePointIndex(idx)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Удалить эту точку"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Copy & Reset Actions */}
        <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={handleCopyCoords}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all"
          >
            {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copySuccess ? 'Скопировано!' : 'Скопировать массив точек'}
          </button>

          <button
            onClick={onResetAllBoundaries}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 p-2 rounded-xl"
            title="Сбросить все точки"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
