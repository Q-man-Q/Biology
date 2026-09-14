import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Save, Calendar, Clock, Hash, Search, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { MAMMALS_SPECIES, BIOTOPES_LIST, DETECTION_TYPES } from '../data/ebitaData';

export default function ObservationModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isReadOnly = false,
  onRequestPickOnMap
}) {
  const [modeReadOnly, setModeReadOnly] = useState(isReadOnly);
  const [recordId, setRecordId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [detectionType, setDetectionType] = useState(DETECTION_TYPES[0]);
  const [species, setSpecies] = useState('');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [biotope, setBiotope] = useState(BIOTOPES_LIST[0]);
  const [vegetation, setVegetation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoInput, setPhotoInput] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModeReadOnly(isReadOnly);
      if (initialData) {
        setRecordId(initialData.id || `EB-${Math.floor(100000 + Math.random() * 900000)}`);
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setTime(initialData.time || new Date().toTimeString().slice(0, 5));
        setLat(initialData.lat ? Number(initialData.lat).toFixed(6) : '51.070000');
        setLng(initialData.lng ? Number(initialData.lng).toFixed(6) : '58.300000');
        setDetectionType(initialData.detectionType || DETECTION_TYPES[0]);
        setSpecies(initialData.species || MAMMALS_SPECIES[0].name);
        setCount(initialData.count || 1);
        setBiotope(initialData.biotope || BIOTOPES_LIST[0]);
        setVegetation(initialData.vegetation || '');
        setDescription(initialData.description || '');
        setPhotos(initialData.photos || []);
        setNote(initialData.note || '');
      } else {
        setRecordId(`EB-${Math.floor(100000 + Math.random() * 900000)}`);
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setLat('51.070000');
        setLng('58.300000');
        setDetectionType(DETECTION_TYPES[0]);
        setSpecies(MAMMALS_SPECIES[0].name);
        setCount(1);
        setBiotope(BIOTOPES_LIST[0]);
        setVegetation('');
        setDescription('');
        setPhotos([]);
        setNote('');
      }
      setIsSpeciesDropdownOpen(false);
      setSpeciesSearch('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const filteredSpecies = MAMMALS_SPECIES.filter(s =>
    s.name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.latinName.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotos([...photos, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedMammal = MAMMALS_SPECIES.find(s => s.name === species);
    const observationObj = {
      id: recordId,
      date,
      time,
      lat: parseFloat(lat) || 51.07,
      lng: parseFloat(lng) || 58.30,
      detectionType,
      species: species || 'Неизвестный вид',
      speciesLatin: selectedMammal ? selectedMammal.latinName : '',
      count: parseInt(count, 10) || 1,
      biotope,
      vegetation,
      description,
      photos,
      note,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(observationObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg font-bold">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wide">
                  {modeReadOnly ? 'ПРОСМОТР НАБЛЮДЕНИЯ' : 'ПОЛЕВОЕ НАБЛЮДЕНИЕ'}
                </h2>
                {modeReadOnly && (
                  <span className="bg-amber-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-700/60">
                    👁 Только просмотр
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <Hash className="w-3 h-3" /> № записи: <span className="font-bold text-slate-200">{recordId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-200">

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Дата
              </label>
              <input
                type="date"
                value={date}
                disabled={modeReadOnly}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Время
              </label>
              <input
                type="time"
                value={time}
                disabled={modeReadOnly}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
              />
            </div>
          </div>

          {/* Coordinates & Map Picker */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 📍 КООРДИНАТЫ
              </label>
              {!modeReadOnly && onRequestPickOnMap && (
                <button
                  type="button"
                  onClick={() => onRequestPickOnMap((pickedLat, pickedLng) => {
                    setLat(pickedLat.toFixed(6));
                    setLng(pickedLng.toFixed(6));
                  })}
                  className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                >
                  📍 Определить на карте
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Широта (Lat):</span>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  disabled={modeReadOnly}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="51.XXXXXX"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Долгота (Lng):</span>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  disabled={modeReadOnly}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="58.XXXXXX"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
                />
              </div>
            </div>
          </div>

          {/* Detection Type Radio Grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              ТИП ОБНАРУЖЕНИЯ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DETECTION_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] transition-all ${
                    modeReadOnly ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    detectionType === type
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="detectionType"
                    value={type}
                    disabled={modeReadOnly}
                    checked={detectionType === type}
                    onChange={() => !modeReadOnly && setDetectionType(type)}
                    className="hidden"
                  />
                  <span className={`w-2.5 h-2.5 rounded-full border ${detectionType === type ? 'bg-emerald-400 border-emerald-300' : 'border-slate-600'}`}></span>
                  <span className="truncate">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Species Select Dropdown with Search */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ВИД МЛЕКОПИТАЮЩЕГО (Актюбинская область)
            </label>
            
            <div
              onClick={() => !modeReadOnly && setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 flex items-center justify-between transition-all ${
                modeReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🦊</span>
                <span className="font-bold text-slate-100">{species || 'Выберите вид...'}</span>
              </div>
              {!modeReadOnly && <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {/* Dropdown Popup */}
            {!modeReadOnly && isSpeciesDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-emerald-500/40 rounded-xl shadow-2xl z-30 overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={speciesSearch}
                      onChange={(e) => setSpeciesSearch(e.target.value)}
                      placeholder="Поиск вида..."
                      className="w-full bg-slate-900 text-xs text-slate-100 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/50">
                  {filteredSpecies.length > 0 ? (
                    filteredSpecies.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSpecies(s.name);
                          setIsSpeciesDropdownOpen(false);
                        }}
                        className={`p-2.5 flex items-center justify-between hover:bg-emerald-950/60 cursor-pointer transition-all ${
                          species === s.name ? 'bg-emerald-900/40 text-emerald-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{s.name}</div>
                          <div className="text-[10px] text-slate-500 italic">{s.latinName}</div>
                        </div>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                          {s.category}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      onClick={() => {
                        if (speciesSearch) setSpecies(speciesSearch);
                        setIsSpeciesDropdownOpen(false);
                      }}
                      className="p-3 text-center text-slate-400 hover:bg-slate-800 cursor-pointer"
                    >
                      Использовать свой вид: <span className="text-emerald-400 font-bold">"{speciesSearch}"</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Count of Individuals & Biotope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                КОЛИЧЕСТВО ОСОБЕЙ
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={count}
                disabled={modeReadOnly}
                onChange={(e) => setCount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none font-bold disabled:opacity-90 disabled:cursor-default"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                БИОТОП
              </label>
              <select
                value={biotope}
                disabled={modeReadOnly}
                onChange={(e) => setBiotope(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
              >
                {BIOTOPES_LIST.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vegetation */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              РАСТИТЕЛЬНОСТЬ
            </label>
            <input
              type="text"
              value={vegetation}
              disabled={modeReadOnly}
              onChange={(e) => setVegetation(e.target.value)}
              placeholder="Опишите растительность (например, типчаково-ковыльная степь)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
            />
          </div>

          {/* Observation Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ОПИСАНИЕ НАБЛЮДЕНИЯ
            </label>
            <textarea
              rows={3}
              value={description}
              disabled={modeReadOnly}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание обнаружения, поведение животных, особенности рельефа..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none resize-none disabled:opacity-90 disabled:cursor-default"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-emerald-400" /> ФОТОГРАФИИ
            </label>

            {!modeReadOnly && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  placeholder="Вставьте URL фотографии..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  + Добавить
                </button>
                <label className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Файл
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Photo Previews */}
            {photos.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40">
                    <img src={url} alt={`Photo ${idx+1}`} className="w-full h-full object-cover" />
                    {!modeReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : modeReadOnly && (
              <div className="text-slate-500 italic text-[11px]">Фотографии отсутствуют</div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ПРИМЕЧАНИЕ
            </label>
            <input
              type="text"
              value={note}
              disabled={modeReadOnly}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Дополнительная информация или пометки..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-90 disabled:cursor-default"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {modeReadOnly ? (
              <>
                <button
                  type="button"
                  onClick={() => setModeReadOnly(false)}
                  className="bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 font-bold px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                >
                  ✏️ РЕДАКТИРОВАТЬ
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-2.5 rounded-xl transition-all uppercase tracking-wider text-[11px]"
                >
                  ЗАКРЫТЬ
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider text-[11px]"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950 transition-all uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  СОХРАНИТЬ
                </button>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
