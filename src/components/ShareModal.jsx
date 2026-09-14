import React, { useState } from 'react';
import { encodePointsToUrlHash, parseImportedData } from '../utils/shareUtils';
import { X, Share2, Copy, Check, Upload, Download, Send, FileJson, Link as LinkIcon } from 'lucide-react';

export default function ShareModal({
  isOpen,
  onClose,
  outerBoundary,
  quarters,
  onImportNewData
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState(null);

  if (!isOpen) return null;

  // Generate shareable link
  const shareableUrl = encodePointsToUrlHash(outerBoundary, quarters) || window.location.href;

  // Generate clean text for Telegram chat
  const chatTextContent = `🗺 Координаты Заказника «Эбита»:\n\nВнешняя граница (${outerBoundary.length} точек):\n${JSON.stringify(outerBoundary)}\n\nОткрыть на карте: ${shareableUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyChatText = () => {
    navigator.clipboard.writeText(chatTextContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content) {
        const parsed = parseImportedData(String(content));
        if (parsed && (parsed.outer || parsed.quarters)) {
          onImportNewData(parsed);
          setImportSuccessMsg('Точки успешно загружены на карту из файла!');
        } else {
          setImportError('Не удалось распознать формат файла. Загрузите .json или .geojson файл!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportFile = () => {
    const data = {
      date: new Date().toISOString(),
      reserveName: "Государственный Природный Заказник «Эбита»",
      outerBoundary,
      quarters: quarters.map(q => ({ id: q.id, number: q.number, sector: q.sector, polygon: q.polygon }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebita_points_for_friend_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-400">Передача Точек Другу &amp; Импорт</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method 1: Share Link */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <LinkIcon className="w-4 h-4" /> СПОСОБ 1: Отправить готовой ссылкой (Самый простой!)
          </div>
          <p className="text-xs text-slate-400">
            Скопируйте ссылку ниже и отправьте другу в Telegram / WhatsApp. Когда друг откроет ссылку, точки автоматически загрузятся на его карте. Он отредактирует их и пришлет вам ссылку обратно!
          </p>

          <div className="flex gap-2 items-center mt-1">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="flex-1 bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-300 rounded-lg px-3 py-2 outline-none select-all overflow-hidden"
            />
            <button
              onClick={handleCopyLink}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'ССЫЛКА СКОПИРОВАНА!' : 'СКОПИРОВАТЬ ССЫЛКУ'}
            </button>
          </div>
        </div>

        {/* Method 2: Export & Import JSON File */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Send File */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Download className="w-4 h-4" /> СПОСОБ 2: Передать файлом
            </div>
            <p className="text-xs text-slate-400 flex-1">
              Скачайте текущие точки в один небольшой файл `.json` и отправьте его другу.
            </p>
            <button
              onClick={handleExportFile}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <FileJson className="w-4 h-4" /> Скачать ebita_points.json
            </button>
          </div>

          {/* Receive File */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Upload className="w-4 h-4" /> Загрузить файл от друга
            </div>
            <p className="text-xs text-slate-400 flex-1">
              Выберите файл `.json` или `.geojson`, который вам прислал друг.
            </p>

            <label className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" /> Загрузить файл друга...
              <input
                type="file"
                accept=".json,.geojson,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Success / Error Banners */}
        {importSuccessMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {importError && (
          <div className="bg-red-950/80 border border-red-500 text-red-300 p-3 rounded-xl text-xs font-bold">
            {importError}
          </div>
        )}

        {/* Method 3: Copy Text to Telegram */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Или скопируйте текст координат для отправки в соообщении:</span>
          <button
            onClick={handleCopyChatText}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
            {copiedText ? 'Текст скопирован!' : 'Скопировать текст для Telegram'}
          </button>
        </div>

      </div>
    </div>
  );
}
