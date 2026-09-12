import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { TimetablePeriod, StudentLog, ReportCardData, CertificateItem, StudentTransportItem, LibraryIssueItem, LibraryBookItem } from '../types';
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
  Bus,
  Download,
  X,
  Navigation,
} from 'lucide-react';

interface Props {
  user: any;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentPortal: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timetable' | 'attendance' | 'academics' | 'conduct' | 'notices' | 'certificates' | 'transport' | 'library'
  >('overview');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [student, setStudent] = useState<any>(null);
  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New modules state
  const [studentTransport, setStudentTransport] = useState<StudentTransportItem | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [myBooks, setMyBooks] = useState<LibraryIssueItem[]>([]);
  const [libraryCatalog, setLibraryCatalog] = useState<LibraryBookItem[]>([]);
  const [viewCertModal, setViewCertModal] = useState<CertificateItem | null>(null);
  const [viewAdmitCardModal, setViewAdmitCardModal] = useState<any | null>(null);
  const [loadingAdmitCard, setLoadingAdmitCard] = useState(false);

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

        // Load Transport Details
        const tr = await ApiService.getStudentTransport(currentStudent.id).catch(() => null);
        setStudentTransport(tr?.allocation || null);

        // Load Certificates
        const cr = await ApiService.getCertificates().catch(() => ({ certificates: [] }));
        const myCerts = (cr.certificates || []).filter((c: any) => c.studentId === currentStudent.id);
        setCertificates(myCerts);

        // Load Library Books
        const lr = await ApiService.getLibraryIssues().catch(() => ({ issues: [] }));
        const myIss = (lr.issues || []).filter((i: any) => i.studentId === currentStudent.id);
        setMyBooks(myIss);

        // Load Library Catalog
        const catRes = await ApiService.getLibraryBooks().catch(() => ({ books: [] }));
        setLibraryCatalog(catRes.books || []);
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

  const handleViewAdmitCard = async () => {
    if (!student?.id) return;
    setLoadingAdmitCard(true);
    try {
      const res = await ApiService.getAdmitCardData(student.id);
      if (res.admitCard) {
        setViewAdmitCardModal(res.admitCard);
      }
    } catch (err: any) {
      alert('Admit card not generated yet: ' + err.message);
    } finally {
      setLoadingAdmitCard(false);
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
            { key: 'certificates', label: 'Admit Card & Certificates', icon: FileText },
            { key: 'transport', label: 'My School Bus', icon: Bus },
            { key: 'library', label: 'Library Books', icon: BookOpen },
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

      {/* TAB 7: CERTIFICATES & ADMIT CARD */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Admit Card Highlight Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Official Examination Document
              </span>
              <h2 className="text-xl sm:text-2xl font-black">CBSE Annual Board / Term Exam Admit Card 2026</h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Official hall ticket containing Roll Number, Examination Center details, Subject Date Sheet, and Student Verification code.
              </p>
            </div>
            <button
              onClick={handleViewAdmitCard}
              disabled={loadingAdmitCard}
              className="px-6 py-3.5 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black text-xs shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Printer size={16} className="text-blue-600" />
              <span>{loadingAdmitCard ? 'Generating...' : 'View & Print Admit Card'}</span>
            </button>
          </div>

          {/* Academic Certificates Registry */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                <span>Issued Academic Certificates</span>
              </h3>
              <p className="text-xs text-slate-500">Official certificates authenticated by Principal office</p>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No official certificates issued currently. Request one at the Front Desk / Reception.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                          {cert.certificateType}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">{cert.issueDate}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 pt-1">
                        Certificate No: {cert.certificateNo}
                      </h4>
                      <p className="text-xs text-slate-500">Academic Year: {cert.academicYear || '2026-2027'}</p>
                      {cert.reason && (
                        <p className="text-xs text-slate-600 italic">Purpose: {cert.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setViewCertModal(cert)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 self-start"
                    >
                      <Printer size={14} />
                      <span>View Official Certificate</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: TRANSPORT */}
      {activeTab === 'transport' && (
        <div className="space-y-6">
          {studentTransport ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Bus size={28} />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Transport Active
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">
                      Bus No: {studentTransport.vehicleNo}
                    </h2>
                    <p className="text-xs text-slate-500">Route: {studentTransport.routeName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Bus Model:</span>
                  <span className="text-xs font-black text-slate-800">Tata Starbus School Fleet</span>
                </div>
              </div>

              {/* Stops and Timing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designated Boarding Stop</div>
                  <div className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-rose-500" />
                    <span>{studentTransport.stopName}</span>
                  </div>
                  <p className="text-xs text-slate-500">Arrive 5 mins prior to schedule</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Morning Pickup Schedule</div>
                  <div className="text-xl font-black text-emerald-900 flex items-center gap-2">
                    <Clock size={18} className="text-emerald-600" />
                    <span>{studentTransport.pickupTime}</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">Daily Mon – Sat</p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Afternoon Drop Schedule</div>
                  <div className="text-xl font-black text-blue-900 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    <span>{studentTransport.dropTime}</span>
                  </div>
                  <p className="text-xs text-blue-700 font-medium">Post school dismissal</p>
                </div>
              </div>

              {/* Driver and Emergency Contact Details */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Assigned Driver & Helpline</div>
                  <div className="text-base font-black flex items-center gap-2">
                    <User size={18} />
                    <span>Rajesh Kumar (Authorized Commercial Driver)</span>
                  </div>
                  <p className="text-xs text-slate-300">Commercial License Verified • Regular Vehicle Maintenance Checked</p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="tel:+919876543210"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2"
                  >
                    <Phone size={14} />
                    <span>Call Driver (+91 98765 43210)</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm space-y-3">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
                <Bus size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900">No School Bus Allocated</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You are currently marked as a Self / Private Commuter. To enroll for School Bus Transport, please submit an application at the Front Desk Reception.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Active Issues */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} />
                <span>My Borrowed Library Books</span>
              </h3>
              <p className="text-xs text-slate-500">Active and past books issued on your library card</p>
            </div>

            {myBooks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                No library books currently issued. Browse the catalog below to borrow from the School Library.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBooks.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        b.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                        b.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Due: {b.dueDate}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{b.bookTitle || 'Library Book'}</h4>
                    <p className="text-xs text-slate-500">Author: {b.bookAuthor || 'NCERT / Educational Press'}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500">Issued Date: {b.issueDate}</span>
                      {b.fineAmount > 0 && (
                        <span className="text-rose-600 font-bold">Fine Due: ₹{b.fineAmount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* School Library Catalog Explorer */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">School Library Catalog Explorer</h3>
              <p className="text-xs text-slate-500">Available titles in the central reading room & reference section</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {libraryCatalog.slice(0, 9).map((book) => (
                <div key={book.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                      {book.subject || 'General'}
                    </span>
                    <span className={`text-[10px] font-bold ${book.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {book.availableCopies > 0 ? `${book.availableCopies} Copies Available` : 'All Issued'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 pt-1 line-clamp-1">{book.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">Author: {book.author}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Location: {book.rackNumber || 'Rack A1'}</p>
                </div>
              ))}
            </div>
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

      {/* MODAL: OFFICIAL CBSE ADMIT CARD */}
      {viewAdmitCardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-300 relative my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Printer size={16} className="text-amber-400" />
                <span>Official CBSE Examination Admit Card</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer size={14} />
                  <span>Print Admit Card</span>
                </button>
                <button
                  onClick={() => setViewAdmitCardModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0">
              {/* Board Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-xl font-black uppercase tracking-wide">
                  {viewAdmitCardModal.schoolName || 'DELHI PUBLIC GLOBAL ACADEMY'}
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  Affiliation No: {viewAdmitCardModal.schoolAffiliation || 'CBSE/AFF/1032890'} • Center Code: {viewAdmitCardModal.centerNumber || '8402'}
                </p>
                <div className="inline-block mt-2 px-4 py-1 bg-slate-100 border border-slate-400 rounded-lg text-xs font-black uppercase tracking-wider">
                  {viewAdmitCardModal.examTitle || 'SECONDARY SCHOOL EXAMINATION 2026 • ADMIT CARD'}
                </div>
              </div>

              {/* Candidate Details & Photo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-300 pb-5 text-xs">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 flex-1">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate Roll No:</span>
                    <strong className="text-sm font-mono text-blue-900 font-black">
                      #{viewAdmitCardModal.rollNo || student?.rollNo || '01'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Code:</span>
                    <strong className="text-xs font-mono font-black">{viewAdmitCardModal.rollCode || 'CBSE-2026-0001'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate Name:</span>
                    <strong className="text-xs uppercase font-bold">{viewAdmitCardModal.studentName || student?.firstName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Number:</span>
                    <strong className="text-xs font-mono">{viewAdmitCardModal.admissionNo || student?.admissionNo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Father's Name:</span>
                    <strong className="text-xs uppercase">{viewAdmitCardModal.fatherName || 'Guardian'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Class & Section:</span>
                    <strong className="text-xs">{viewAdmitCardModal.className} - {viewAdmitCardModal.sectionName}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Examination Center:</span>
                    <strong className="text-xs">{viewAdmitCardModal.centerName}</strong>
                  </div>
                </div>

                <div className="w-24 h-28 border-2 border-slate-800 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-3xl font-black shrink-0 self-center">
                  {student?.photoUrl ? (
                    <img src={student.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    '🎓'
                  )}
                </div>
              </div>

              {/* Subject Schedule Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">Subject Examination Schedule</h4>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Sub Code</th>
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Timing</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3 text-center">Invigilator Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {viewAdmitCardModal.schedule?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{item.subCode}</td>
                          <td className="py-2.5 px-3 font-bold">{item.subName}</td>
                          <td className="py-2.5 px-3 font-medium">{item.examDate}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.examTime}</td>
                          <td className="py-2.5 px-3 font-medium">{item.roomNo}</td>
                          <td className="py-2.5 px-3 text-center text-slate-300">__________</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guidelines */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                <strong className="block text-xs uppercase font-black text-amber-900">Important Instructions:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  {viewAdmitCardModal.instructions?.map((inst: string, idx: number) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-8 text-xs font-bold">
                <div className="text-center">
                  <div className="border-b border-slate-800 w-40 mb-1"></div>
                  <span className="text-[10px] uppercase text-slate-600">Candidate Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-900 flex items-center justify-center text-[9px] font-bold text-blue-900 mx-auto mb-1">
                    SCHOOL SEAL
                  </div>
                  <span className="text-[10px] uppercase text-slate-500">Official Stamp</span>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-800 w-40 mb-1"></div>
                  <span className="text-[10px] uppercase text-slate-900 font-black">Principal Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CERTIFICATE */}
      {viewCertModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-300 relative my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                <span>Official School Certificate</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer size={14} />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setViewCertModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-8 text-slate-900 font-serif border-8 border-double border-slate-200 m-4 rounded-2xl bg-gradient-to-b from-amber-50/20 to-white">
              <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
                <h2 className="text-2xl font-black tracking-wider uppercase font-sans text-slate-900">
                  {student?.schoolName || 'DELHI PUBLIC GLOBAL ACADEMY'}
                </h2>
                <p className="text-xs font-sans text-slate-600">CBSE Affiliation No: 1032890 • School Code: 8402</p>
                <div className="pt-4">
                  <h3 className="text-lg font-black uppercase tracking-widest font-sans text-indigo-900 underline decoration-2 underline-offset-8">
                    {viewCertModal.certificateType}
                  </h3>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-sans text-slate-500">
                <span>Ref No: <strong className="font-mono text-slate-800">{viewCertModal.certificateNo}</strong></span>
                <span>Date: <strong className="text-slate-800">{viewCertModal.issueDate}</strong></span>
              </div>

              <div className="text-sm leading-relaxed space-y-4 text-justify text-slate-800">
                <p>
                  This is to officially certify that <strong className="uppercase font-sans font-black">{student?.firstName} {student?.lastName || ''}</strong>, 
                  son/daughter of <strong className="font-sans font-bold">{student?.fatherName || 'Guardian'}</strong>, 
                  bearing Admission Number <strong className="font-mono font-bold">{student?.admissionNo}</strong> and Roll Number <strong className="font-bold">#{student?.rollNo || '01'}</strong>, 
                  is a bona fide student of Class <strong className="font-sans font-bold">{student?.className || '10'} - Section {student?.sectionName || 'A'}</strong> in this institution for the Academic Session <strong className="font-sans font-bold">{viewCertModal.academicYear || '2026-2027'}</strong>.
                </p>
                <p>
                  According to institutional records, his/her general conduct and moral character have been found to be <strong className="font-sans font-bold uppercase">{viewCertModal.conduct || 'Good'}</strong>.
                </p>
                {viewCertModal.reason && (
                  <p className="italic text-xs text-slate-600">
                    This certificate is granted for the purpose of: {viewCertModal.reason}.
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between pt-12 text-xs font-sans font-bold">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 mx-auto mb-1">
                    SEAL
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">Institutional Seal</span>
                </div>

                <div className="text-center">
                  <div className="border-b border-slate-800 w-44 mb-1"></div>
                  <span className="text-xs uppercase text-slate-900 font-black">Principal Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
