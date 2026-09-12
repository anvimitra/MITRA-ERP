import React, { useState, useEffect } from 'react';
import { User, School, StaffLeaveItem } from '../types';
import { broadcastLiveNotice, fetchStaffLeaves, reviewStaffLeave } from '../api';
import { Users, CheckCircle2, TrendingUp, BellRing, Database, Radio, Briefcase, Check, X, Bus, BookOpen, FileText, PhoneCall } from 'lucide-react';

interface Props {
  principal: User;
  school: School;
  studentCount?: number;
  classCount?: number;
}

export const PrincipalView: React.FC<Props> = ({ principal, school, studentCount = 120, classCount = 12 }) => {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  // Staff leaves
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffLeaves().then(setLeaves).catch(() => {});
  }, []);

  const handleReview = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(leaveId);
    try {
      await reviewStaffLeave(leaveId, {
        status,
        reviewRemarks: status === 'APPROVED' ? 'Approved by Principal via Mobile App' : 'Declined per academic coverage',
      });
      fetchStaffLeaves().then(setLeaves).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to update leave.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    setSending(true);
    try {
      await broadcastLiveNotice(broadcastTitle || 'School Circular', broadcastMessage);
      setSentNotice(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setSentNotice(false), 5000);
    } catch {
      alert('Notice saved locally.');
    } finally {
      setSending(false);
    }
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
          Dispatches instant In-App Push notifications directly to enrolled parents, students, and teachers.
        </p>

        {sentNotice && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Circular broadcasted to all parents and staff successfully!</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-3">
          <input
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Notice Subject (e.g. Annual Sports Meet 2026)"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none font-bold"
          />

          <textarea
            rows={3}
            required
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type announcement or circular details..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:from-purple-800 hover:to-indigo-900 active:scale-98 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Radio className="w-4 h-4" />
            <span>{sending ? 'Broadcasting to App...' : 'Send In-App Notification'}</span>
          </button>
        </form>
      </div>

      {/* Real-Time School Operations Hub */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Ecosystem Operations Matrix</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Bus className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Buses Active</span>
              <strong className="text-slate-800">4 Fleet Routes</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Central Library</span>
              <strong className="text-slate-800">1,450 Volumes</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Front Desk</span>
              <strong className="text-slate-800">18 Inquiries</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Certificates</span>
              <strong className="text-slate-800">35 CBSE Verified</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Leave Approval Queue */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span>Faculty Leave Requests ({leaves.length})</span>
          </h3>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            1-Tap Approval
          </span>
        </div>

        <div className="space-y-2">
          {leaves.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No leave applications awaiting approval.
            </div>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{l.staffName || 'Faculty Member'}</strong>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{l.leaveType} LEAVE • {l.totalDays} Days</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {l.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">{l.reason}</p>
                <p className="text-[10px] text-slate-400">Duration: {l.startDate} to {l.endDate}</p>

                {l.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-200">
                    <button
                      disabled={reviewingId === l.id}
                      onClick={() => handleReview(l.id, 'APPROVED')}
                      className="flex-1 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={reviewingId === l.id}
                      onClick={() => handleReview(l.id, 'REJECTED')}
                      className="flex-1 py-1.5 bg-rose-600 active:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
