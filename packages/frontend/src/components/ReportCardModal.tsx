import React, { useState } from 'react';
import { ReportCardData } from '../types';
import { ModernGradientTemplate } from '../templates/ModernGradientTemplate';
import { CbseOfficialTemplate } from '../templates/CbseOfficialTemplate';
import { MinimalExecutiveTemplate } from '../templates/MinimalExecutiveTemplate';
import { JuniorVibrantTemplate } from '../templates/JuniorVibrantTemplate';
import { Printer, X, Sparkles, Layout, FileText, Smile } from 'lucide-react';

interface Props {
  data: ReportCardData;
  onClose: () => void;
}

export const ReportCardModal: React.FC<Props> = ({ data, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'cbse' | 'minimal' | 'junior'>('modern');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-between overflow-y-auto">
      {/* Top Controller Bar (Hidden during Print) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Layout size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">ANVIMITRA Attractive Report Card Engine</h2>
            <p className="text-[11px] text-slate-400">Select an attractive template & print or export as PDF</p>
          </div>
        </div>

        {/* Template Switcher Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setSelectedTemplate('modern')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedTemplate === 'modern'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles size={13} />
            <span>Modern Gradient</span>
          </button>

          <button
            onClick={() => setSelectedTemplate('cbse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedTemplate === 'cbse'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText size={13} />
            <span>CBSE Standard</span>
          </button>

          <button
            onClick={() => setSelectedTemplate('minimal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedTemplate === 'minimal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layout size={13} />
            <span>Executive Minimal</span>
          </button>

          <button
            onClick={() => setSelectedTemplate('junior')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedTemplate === 'junior'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smile size={13} />
            <span>Junior Vibrant</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Report Card Render Area */}
      <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        {selectedTemplate === 'modern' && <ModernGradientTemplate data={data} />}
        {selectedTemplate === 'cbse' && <CbseOfficialTemplate data={data} />}
        {selectedTemplate === 'minimal' && <MinimalExecutiveTemplate data={data} />}
        {selectedTemplate === 'junior' && <JuniorVibrantTemplate data={data} />}
      </div>
    </div>
  );
};
