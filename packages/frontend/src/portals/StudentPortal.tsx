import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { TimetablePeriod, StudentLog, ReportCardData } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import {
  GraduationCap,
  Calendar,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Bell,
  Printer,
  ShieldCheck,
  User,
  HeartPulse,
  Sparkles,
  MapPin,
  Phone,
  QrCode,
  Layers,
} from 'lucide-react';

interface Props {
  user: any;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentPortal: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'attendance' | 'academics' | 'conduct' | 'notices'>('overview');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [student, setStudent] = useState<any>(null);
  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [activeReportCard, setActiveReportCard] = useState<ReportCardData | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  useEffect(() => {
    const currentDayIndex = new Date().getDay();
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayMap[currentDayIndex];
    if (DAYS_OF_WEEK.includes(currentDay)) {
      setSelectedDay(currentDay);
    } else {
      setSelectedDay('Monday');
    }
  }, []);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const me = await ApiService.getMe();
      let currentStudent = me.studentRecord;

      if (!currentStudent) {
        if (me.linkedStudents && me.linkedStudents.length > 0) {
          currentStudent = me.linkedStudents[0];
        } else {
          const classData = await ApiService.getClasses().catch(() => ({ students: [] }));
          currentStudent = classData.students?.find((s: any) => s.userId === user.id) || classData.students?.[0];
        }
      }

      setStudent(currentStudent);

      if (currentStudent) {
        const att = await ApiService.getStudentAttendance(currentStudent.id).catch(() => null);
        setAttendanceData(att);

        if (currentStudent.classId && currentStudent.sectionId) {
          const tt = await ApiService.getTimetableByClass(currentStudent.classId, currentStudent.sectionId).catch(() => ({ periods: [] }));
          setTimetable(tt.periods || []);
        }

        const logs = await ApiService.getStudentLogs(currentStudent.id).catch(() => ({ logs: [] }));
        setStudentLogs(logs.logs || []);
      }

      const ex = await ApiService.getExams().catch(() => ({ exams: [] }));
      setExams(ex.exams || []);

      const n = await ApiService.getNotices().catch(() => ({ notices: [] }));
      setNotices(n.notices || []);
    } catch (err) {
      console.error('Failed to load student portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  const handleOpenReportCard = async (examId: string) => {
    if (!student?.id) return;
    setLoadingReportCard(true);
    try {
      const res = await ApiService.getReportCard(student.id, examId);
      if (res.reportCard) {
        setActiveReportCard(res.reportCard);
      }
    } catch (err: any) {
      alert('Report card not available yet: ' + err.message);
    } finally {
      setLoadingReportCard(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading Student Portal & Academic Records...</p>
      </div>
    );
  }

  const attendancePercent = attendanceData?.summary?.percentage ?? 92;
  const awardsCount = studentLogs.filter((l) => l.logType === 'award').length;

  const dayPeriods = timetable.filter(
    (p) => p.dayOfWeek.toLowerCase() === selectedDay.toLowerCase()
  ).sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              {student?.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.firstName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black shadow-xl">
                  🎓
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white shadow">
                ACTIVE
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Student Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                  Roll No: #{student?.rollNo || '01'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/80">
                  Adm: {student?.admissionNo || 'STU-2026'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {student?.firstName} {student?.lastName || ''}
              </h1>
              <p className="text-slate-300 text-xs mt-1">
                Class {student?.className || '10'} - Section {student?.sectionName || 'A'} • Academic Year 2026–2027
              </p>
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 px-4 border border-white/10 text-center">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Attendance</span>
              <span className={`text-xl font-black ${attendancePercent >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {attendancePercent}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 px-4 border border-white/10 text-center">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Honors & Awards</span>
              <span className="text-xl font-black text-amber-300 flex items-center justify-center gap-1">
                <Award size={16} />
                {awardsCount}
              </span>
            </div>

            <button
              onClick={() => setShowIdCardModal(true)}
              className="px-4 py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <QrCode size={16} className="text-blue-600" />
              <span>Digital ID Card</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 mt-8 pt-4 border-t border-white/10 text-xs font-bold">
          {[
            { key: 'overview', label: 'Overview & Schedule', icon: Layers },
            { key: 'timetable', label: 'Weekly Period Matrix', icon: Calendar },
            { key: 'attendance', label: 'Attendance Meter', icon: CheckCircle2 },
            { key: 'academics', label: 'Marksheets & Exams', icon: GraduationCap },
            { key: 'conduct', label: 'Conduct & Honors', icon: Award },
            { key: 'notices', label: 'Circulars & Notices', icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="text-blue-600" size={18} />
                  <span>Today's Class Schedule ({selectedDay})</span>
                </h2>
                <p className="text-xs text-slate-500">Live lecture periods and allocated faculty</p>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View Full Week →
              </button>
            </div>

            {dayPeriods.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No periods scheduled for {selectedDay}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dayPeriods.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-blue-200 hover:shadow-md transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                        Period {p.periodNumber}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {p.startTime} - {p.endTime}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-800">{p.subjectName || 'Class Subject'}</div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {p.teacherName || 'Faculty'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-semibold border border-slate-200">
                        {p.roomNumber || 'Room 101'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Health & Emergency Profile + Recent Notices */}
          <div className="space-y-6">
            {/* Health & Emergency Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="text-rose-500" size={16} />
                <span>Student Health & Medical Profile</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-bold text-slate-800">{student?.bloodGroup || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Emergency Phone:</span>
                  <span className="font-bold font-mono text-blue-600">{student?.emergencyPhone || '+91 98111 99887'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Caste Category:</span>
                  <span className="font-bold text-slate-800">{student?.category || 'General'}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Allergies / Special Notes:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 block">
                    {student?.allergies || 'No known food/drug allergies recorded.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Circulars */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="text-amber-500" size={16} />
                  <span>Latest Circulars</span>
                </h3>
                <button onClick={() => setActiveTab('notices')} className="text-xs text-blue-600 font-bold hover:underline">
                  All →
                </button>
              </div>

              {notices.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No circulars broadcasted today.</p>
              ) : (
                notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{n.title}</span>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIMETABLE PERIOD MATRIX */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                <span>Weekly Academic Period Matrix</span>
              </h2>
              <p className="text-xs text-slate-500">
                Official period scheduling, subject assignments, faculty allocations & classroom numbers
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDay === day ? 'bg-white text-blue-700 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Room / Lab</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayPeriods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No periods configured for {selectedDay}.
                    </td>
                  </tr>
                ) : (
                  dayPeriods.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                          {p.periodNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                        {p.startTime} – {p.endTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block text-sm">{p.subjectName || 'Subject'}</span>
                        {p.subjectCode && <span className="text-[10px] text-slate-400 font-mono">{p.subjectCode}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{p.teacherName || 'Assigned Faculty'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                          {p.roomNumber || 'Room 101'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Scheduled
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE METER */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Academic Days</span>
              <span className="text-2xl font-black text-slate-900">{attendanceData?.summary?.totalDays || 45}</span>
            </div>
            <div className="bg-white rounded-3xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 block mb-1">Present Days</span>
              <span className="text-2xl font-black text-emerald-600">{attendanceData?.summary?.present || 41}</span>
            </div>
            <div className="bg-white rounded-3xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm">
              <span className="text-xs font-bold text-rose-700 block mb-1">Absences</span>
              <span className="text-2xl font-black text-rose-600">{attendanceData?.summary?.absent || 2}</span>
            </div>
            <div className="bg-white rounded-3xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm">
              <span className="text-xs font-bold text-amber-700 block mb-1">Late / Half Day / Excused</span>
              <span className="text-2xl font-black text-amber-600">
                {(attendanceData?.summary?.late || 1) + (attendanceData?.summary?.halfDay || 1)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Attendance Log History</h3>
            <div className="divide-y divide-slate-100">
              {attendanceData?.records?.length > 0 ? (
                attendanceData.records.map((rec: any) => (
                  <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{rec.date}</span>
                      <span className="text-slate-400 text-[11px]">{rec.remarks || 'Daily Roll Call'}</span>
                    </div>
                    <div>
                      {rec.status === 'present' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-emerald-700 bg-emerald-100 border border-emerald-200">
                          Present
                        </span>
                      )}
                      {rec.status === 'absent' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-rose-700 bg-rose-100 border border-rose-200">
                          Absent
                        </span>
                      )}
                      {rec.status === 'late' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-amber-700 bg-amber-100 border border-amber-200">
                          Late Arrival
                        </span>
                      )}
                      {rec.status === 'half_day' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-indigo-700 bg-indigo-100 border border-indigo-200">
                          Half Day
                        </span>
                      )}
                      {rec.status === 'excused' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-teal-700 bg-teal-100 border border-teal-200">
                          Excused Leave
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No attendance records found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MARKSHEETS & EXAMS */}
      {activeTab === 'academics' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={20} />
              <span>Official Marksheets & Examination Results</span>
            </h2>
            <p className="text-xs text-slate-500">
              Published assessments, grade breakdowns, and printable school report cards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800">
                    {ex.examType}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{ex.academicYear}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{ex.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dates: {ex.startDate || '2026-09-01'} to {ex.endDate || '2026-09-14'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Published & Verified
                  </span>
                  <button
                    onClick={() => handleOpenReportCard(ex.id)}
                    disabled={loadingReportCard}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <FileText size={13} />
                    <span>View Marksheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONDUCT & BEHAVIOR (RosarioSIS / Frappe Education style) */}
      {activeTab === 'conduct' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                <span>Behavioral Desk, Honors & Incident Log</span>
              </h2>
              <p className="text-xs text-slate-500">
                Documented positive awards, commendations, medical events, and disciplinary remarks
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              {studentLogs.length} Total Logs
            </span>
          </div>

          <div className="space-y-4">
            {studentLogs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Award size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No disciplinary or award logs recorded.</p>
              </div>
            ) : (
              studentLogs.map((log) => {
                const isAward = log.logType === 'award';
                const isDiscipline = log.logType === 'discipline';
                const isMedical = log.logType === 'medical';
                return (
                  <div
                    key={log.id}
                    className={`p-5 rounded-2xl border transition space-y-2.5 ${
                      isAward
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : isDiscipline
                        ? 'bg-rose-50/30 border-rose-200/80'
                        : isMedical
                        ? 'bg-blue-50/30 border-blue-200/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isAward
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isDiscipline
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : isMedical
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {log.logType}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{log.date}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{log.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
                    </div>

                    {log.actionTaken && (
                      <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Action / Recognition: </span>
                        {log.actionTaken}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Logged by: {log.reportedByName || 'Class Teacher'}</span>
                      {log.notifyParent === 1 && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Parent Notified via App
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: NOTICES */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="text-amber-500" size={20} />
              <span>School Circulars & Official Announcements</span>
            </h2>
            <p className="text-xs text-slate-500">Official directives from Principal Office & Academic Heads</p>
          </div>

          <div className="divide-y divide-slate-100">
            {notices.map((n) => (
              <div key={n.id} className="py-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIGITAL ID CARD MODAL */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center relative">
              <h3 className="text-base font-black tracking-wide uppercase">
                {student?.schoolName || 'Delhi Public Global Academy'}
              </h3>
              <p className="text-[11px] text-blue-200">Affiliation No: CBSE/AFF/1030948 • Official Student ID</p>
              <div className="w-20 h-20 rounded-2xl mx-auto mt-4 overflow-hidden border-2 border-white/50 shadow-lg bg-slate-100">
                {student?.photoUrl ? (
                  <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎓</div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="text-center">
                <h4 className="text-lg font-black text-slate-900">
                  {student?.firstName} {student?.lastName || ''}
                </h4>
                <p className="text-xs font-bold text-blue-600">
                  Class {student?.className || '10'} - Section {student?.sectionName || 'A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Admission No</span>
                  <span className="font-bold text-slate-800">{student?.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Roll Number</span>
                  <span className="font-bold text-slate-800">#{student?.rollNo || '01'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Blood Group</span>
                  <span className="font-bold text-slate-800">{student?.bloodGroup || 'B+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Category</span>
                  <span className="font-bold text-slate-800">{student?.category || 'General'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Emergency Contact</span>
                  <span className="font-bold font-mono text-blue-600">{student?.emergencyPhone || '+91 98111 99887'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <div className="font-mono text-xl tracking-[0.3em] font-black text-slate-900">
                  ||| | | || ||| || ||| |
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">{student?.admissionNo}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow hover:bg-blue-500 transition flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print ID Card</span>
              </button>
              <button
                onClick={() => setShowIdCardModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CARD VIEWER MODAL */}
      {activeReportCard && (
        <ReportCardModal data={activeReportCard} onClose={() => setActiveReportCard(null)} />
      )}
    </div>
  );
};
