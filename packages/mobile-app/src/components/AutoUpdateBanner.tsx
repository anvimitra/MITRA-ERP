import React, { useState } from 'react';
import { AppUpdateInfo } from '../types';
import { Sparkles, Download, RefreshCw, CheckCircle2, X, ArrowUpCircle } from 'lucide-react';

interface Props {
  updateInfo: AppUpdateInfo | null;
  onDismiss: () => void;
}

export const AutoUpdateBanner: React.FC<Props> = ({ updateInfo, onDismiss }) => {
  const [updating, setUpdating] = useState(false);
  const [updateDone, setUpdateDone] = useState(false);

  if (!updateInfo) return null;

  const handleApplyUpdate = () => {
    setUpdating(true);

    // If running in browser or PWA:
    setTimeout(() => {
      // Direct APK download link for Android / Capacitor:
      if (updateInfo.latestApkUrl) {
        window.open(updateInfo.latestApkUrl, '_blank');
      }

      setUpdating(false);
      setUpdateDone(true);

      // Force fresh cache reload for web client
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }, 800);
  };

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-3.5 rounded-2xl shadow-lg border border-blue-400/30 mb-3 relative overflow-hidden animate-fadeIn">
      {/* Decorative Glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 mt-0.5">
            <ArrowUpCircle className="w-5 h-5 text-amber-300 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wide">AUTO-UPDATE READY</span>
              <span className="text-[10px] bg-amber-400 text-purple-950 font-extrabold px-1.5 py-0.2 rounded-full">
                v{updateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-blue-100 leading-snug">
              {updateInfo.releaseNotes || 'New enhancements and bug fixes are ready for your device.'}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={handleApplyUpdate}
          disabled={updating || updateDone}
          className="flex-1 py-1.5 px-3 bg-white text-blue-900 hover:bg-blue-50 active:scale-98 text-xs font-black rounded-xl shadow transition flex items-center justify-center space-x-1.5"
        >
          {updating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Applying Update...</span>
            </>
          ) : updateDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restarting App...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Update Now (1-Click)</span>
            </>
          )}
        </button>

        <a
          href={updateInfo.latestApkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 bg-blue-900/60 hover:bg-blue-900 border border-blue-400/40 text-[11px] font-bold rounded-xl text-blue-100 hover:text-white transition flex items-center space-x-1"
        >
          <span>APK</span>
        </a>
      </div>
    </div>
  );
};
