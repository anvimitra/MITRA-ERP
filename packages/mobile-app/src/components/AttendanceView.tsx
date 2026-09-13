import React, { useState } from 'react';
import { AttendanceRecord, Student } from '../types';
import { CheckCircle2, Clock, AlertCircle, Calendar, Filter } from 'lucide-react';

interface Props {
  student?: Student | null;
  attendance: AttendanceRecord[];
}

export const AttendanceView: React.FC<Props> = ({ student, attendance }) => {
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  const filtered = attendance.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const total = attendance.length || 1;
  const percentage = Math.round((presentCount / total) * 100);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
        <Calendar className="w-10 h-10 text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">No Student Attendance Data</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Please log in or link a student account to view daily attendance logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Attendance Stats Cards */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-800 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Attendance Analytics</span>
            </h2>
            <p className="text-xs text-slate-500">
              {student.firstName} {student.lastName} ({student.className}-{student.sectionName})
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-purple-700">{percentage}%</span>
            <span className="text-[10px] text-slate-400 block font-semibold">Net Present</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setFilter('present')}
            className={`p-2.5 rounded-xl border text-center transition ${
              filter === 'present'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-black text-emerald-700 block">{presentCount} Days</span>
            <span className="text-[10px] text-slate-500 font-semibold">Present</span>
          </button>

          <button
            onClick={() => setFilter('late')}
            className={`p-2.5 rounded-xl border text-center transition ${
              filter === 'late'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-black text-amber-700 block">{lateCount} Days</span>
            <span className="text-[10px] text-slate-500 font-semibold">Late</span>
          </button>

          <button
            onClick={() => setFilter('absent')}
            className={`p-2.5 rounded-xl border text-center transition ${
              filter === 'absent'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-black text-rose-700 block">{absentCount} Days</span>
            <span className="text-[10px] text-slate-500 font-semibold">Absent</span>
          </button>
        </div>

        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="w-full mt-2 py-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 text-center"
          >
            Clear Filter (Show All Logs)
          </button>
        )}
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">
          Daily Activity Log ({filtered.length} entries)
        </h3>

        {filtered.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center space-x-3">
              {rec.status === 'present' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : rec.status === 'late' ? (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="font-bold text-xs text-slate-800">{rec.date}</p>
                <p className="text-[11px] text-slate-500">{rec.remarks}</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                rec.status === 'present'
                  ? 'bg-emerald-100 text-emerald-800'
                  : rec.status === 'late'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {rec.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
