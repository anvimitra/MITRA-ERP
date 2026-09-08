import React from 'react';
import { Student, AttendanceRecord, FeeItem, ExamReport } from '../types';
import { CheckCircle2, AlertCircle, Clock, Award, ArrowRight, Wallet, Calendar, ShieldCheck } from 'lucide-react';
import { TabType } from './BottomNavBar';

interface Props {
  student: Student;
  attendance: AttendanceRecord[];
  fees: FeeItem[];
  latestReport: ExamReport;
  onChangeTab: (tab: TabType) => void;
}

export const ParentView: React.FC<Props> = ({
  student,
  attendance,
  fees,
  latestReport,
  onChangeTab,
}) => {
  const todayRecord = attendance[0];
  const pendingFee = fees.find((f) => f.status === 'pending');
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = Math.round((presentCount / (attendance.length || 1)) * 100);

  return (
    <div className="space-y-4 pb-20">
      {/* Student Profile Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="relative">
            <img
              src={student.photoUrl}
              alt={student.firstName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
              Roll #{student.rollNo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-white truncate leading-snug">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-xs text-purple-200 font-medium">
              {student.className} - {student.sectionName} • Adm #{student.admissionNo}
            </p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="bg-purple-800/80 text-purple-200 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-purple-700">
                Blood: {student.bloodGroup}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                <span>App Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Pulse Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Today's Attendance</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">{todayRecord?.date || 'Today'}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            {todayRecord?.status === 'present' ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : todayRecord?.status === 'late' ? (
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-slate-900 text-sm capitalize">
                {todayRecord?.status === 'present'
                  ? 'Marked Present'
                  : todayRecord?.status === 'late'
                  ? 'Marked Late'
                  : 'Marked Absent'}
              </p>
              <p className="text-xs text-slate-500">{todayRecord?.remarks || 'Verified by Class Teacher'}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Monthly Rate</span>
            <span className="text-base font-extrabold text-purple-700">{attendanceRate}%</span>
          </div>
        </div>

        <button
          onClick={() => onChangeTab('attendance')}
          className="w-full mt-3 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center space-x-1 transition"
        >
          <span>View Monthly Attendance History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fee Due Alert */}
      {pendingFee && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  Fee Reminder
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{pendingFee.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Due: <span className="font-bold text-rose-600">{pendingFee.dueDate}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-slate-900">₹{pendingFee.amount.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onChangeTab('fees')}
            className="w-full mt-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1"
          >
            <span>Pay Fee Online / View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Latest Academic Performance Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Latest Exam Performance</span>
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
            {latestReport.examType}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-3">{latestReport.examName}</p>

        <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-center">
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Total Marks</span>
            <span className="text-sm font-black text-purple-950">
              {latestReport.totalMarks}/{latestReport.maxTotalMarks}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Percentage</span>
            <span className="text-sm font-black text-purple-700">{latestReport.percentage}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Grade</span>
            <span className="text-sm font-black text-emerald-600">{latestReport.overallGrade}</span>
          </div>
        </div>

        <button
          onClick={() => onChangeTab('report')}
          className="w-full mt-3 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center space-x-1 transition"
        >
          <span>Open Full Multi-Template Report Card</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
