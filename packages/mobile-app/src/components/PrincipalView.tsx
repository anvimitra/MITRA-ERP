import React, { useState } from 'react';
import { User, School } from '../types';
import { Users, CheckCircle2, TrendingUp, BellRing, Database, Radio } from 'lucide-react';

interface Props {
  principal: User;
  school: School;
}

export const PrincipalView: React.FC<Props> = ({ principal, school }) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    setSentNotice(true);
    setBroadcastMessage('');
    setTimeout(() => setSentNotice(false), 4000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Principal Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-purple-950">
              Executive Principal Desk
            </span>
            <h2 className="font-black text-lg mt-1 text-white">{principal.name}</h2>
            <p className="text-xs text-purple-200">{school.name} ({school.code})</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Student Attendance</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">94.8%</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>+2.4% vs last week</span>
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Fee Inflow (Mtd)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">₹4.85L</p>
          <span className="text-[10px] font-semibold text-slate-400">88% collection efficiency</span>
        </div>
      </div>

      {/* Secondary DB Storage Sync Indicator */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-emerald-950">Local PC Secondary Database</h4>
            <p className="text-[11px] text-emerald-700">Windows .EXE Sync Engine: <span className="font-bold">Active & Synchronized</span></p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
      </div>

      {/* Broadcast Notice to All Parents & Teachers */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 mb-2">
          <BellRing className="w-4 h-4 text-purple-600" />
          <span>Broadcast School Circular</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Dispatches instant App Push to mobile users and SMS fallback to unregistered numbers.
        </p>

        {sentNotice && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Circular broadcasted to all parents and staff successfully!</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-3">
          <textarea
            rows={3}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type urgent announcement or holiday circular..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:from-purple-800 hover:to-indigo-900 active:scale-98 transition flex items-center justify-center space-x-2"
          >
            <Radio className="w-4 h-4" />
            <span>Send School-Wide Notification</span>
          </button>
        </form>
      </div>
    </div>
  );
};
