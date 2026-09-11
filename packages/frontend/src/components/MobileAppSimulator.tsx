import React, { useState } from 'react';
import { School, User } from '../types';
import { Bell, Calendar, Award, Receipt, Shield, CheckCircle2, ChevronRight, Smartphone, X, Download } from 'lucide-react';

interface Props {
  school: School | null;
  user: User;
  onClose: () => void;
  onOpenReportCard: () => void;
}

export const MobileAppSimulator: React.FC<Props> = ({ school, user, onClose, onOpenReportCard }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'fees' | 'card'>('home');
  const [schoolCode, setSchoolCode] = useState(school?.code || 'DPS01');

  // Dynamic branding simulation
  const isDPS = schoolCode === 'DPS01';
  const brandName = isDPS ? 'Delhi Public Global' : 'St. Xavier International';
  const brandColor = isDPS ? '#1e40af' : '#059669';
  const brandCode = isDPS ? 'DPS01' : 'STX02';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Container */}
      <div className="relative flex flex-col items-center">
        {/* Top Floating Controls */}
        <div className="mb-4 flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-xs text-white">
          <Smartphone size={16} className="text-blue-400" />
          <span className="font-bold">White-Label Mobile App Simulator</span>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">School Branding:</span>
            <select
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="bg-slate-800 text-white font-bold px-2 py-1 rounded-lg border border-slate-700"
            >
              <option value="DPS01">DPS01 (Delhi Public)</option>
              <option value="STX02">STX02 (St. Xavier)</option>
            </select>
          </div>
          <span className="text-slate-500">|</span>
          <a
            href="https://github.com/anvimitra/MITRA-ERP/releases/latest/download/MITRA-ERP.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-xl text-xs shadow transition"
            title="Download latest compiled MITRA-ERP APK build with auto-update"
          >
            <Download size={13} />
            <span>Download MITRA-ERP APK</span>
          </a>
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Smartphone Hardware Frame */}
        <div className="w-[360px] h-[720px] bg-black rounded-[50px] p-3 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
          {/* Phone Speaker & Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800 ml-2"></div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 bg-slate-50 rounded-[40px] overflow-y-auto flex flex-col text-slate-900 text-xs">
            {/* Mobile Header with Dynamic School Branding */}
            <div
              className="pt-8 pb-5 px-5 text-white shadow-md relative"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                    {brandCode} Mobile Campus
                  </span>
                  <h2 className="text-base font-black text-white">{brandName}</h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white relative">
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                </div>
              </div>

              {/* Child Card in Mobile Header */}
              <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow">
                    🎓
                  </div>
                  <div>
                    <span className="font-bold text-white block">Rahul Sharma</span>
                    <span className="text-[10px] text-white/80">Class 10-A • Roll #1</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400 text-emerald-950">
                  Present Today
                </span>
              </div>
            </div>

            {/* Body Tabs */}
            <div className="flex-1 p-4 space-y-4">
              {/* Push Notification Simulation Toast */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={15} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block text-[11px]">Instant Attendance Alert</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Rahul has been marked <strong>PRESENT</strong> by Class Teacher Mrs. Sunita Sharma at 08:30 AM.
                  </p>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={onOpenReportCard}
                  className="bg-white border border-slate-200 hover:border-blue-300 p-3 rounded-2xl text-left shadow-sm transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <Award size={18} />
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">Exam Report Card</span>
                  <span className="text-[10px] text-slate-400">View SA1 & Yearly Card</span>
                </button>

                <div className="bg-white border border-slate-200 p-3 rounded-2xl text-left shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Receipt size={18} />
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">Fee Reminder</span>
                  <span className="text-[10px] text-emerald-600 font-bold">₹ 0 Due (Paid)</span>
                </div>
              </div>

              {/* Academic Highlights */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Academic Progress (SA1 Term 1)
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Mathematics</span>
                      <span className="font-bold text-blue-700">94/100 (Grade A1)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Science & Tech</span>
                      <span className="font-bold text-blue-700">89/100 (Grade A2)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '89%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* In-App Notifications Note for Parent */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[10px] text-blue-900">
                <strong>🔔 Real-Time App Notifications:</strong> Daily attendance, CBSE exam marks, fee receipts, and school broadcast circulars are delivered directly to this mobile app in real time!
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center text-slate-400">
              <button className="flex flex-col items-center gap-0.5 text-blue-600 font-bold">
                <Calendar size={17} />
                <span className="text-[9px]">Home</span>
              </button>
              <button onClick={onOpenReportCard} className="flex flex-col items-center gap-0.5 hover:text-slate-600">
                <Award size={17} />
                <span className="text-[9px]">Report</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 hover:text-slate-600">
                <Receipt size={17} />
                <span className="text-[9px]">Fees</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 hover:text-slate-600">
                <Shield size={17} />
                <span className="text-[9px]">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
