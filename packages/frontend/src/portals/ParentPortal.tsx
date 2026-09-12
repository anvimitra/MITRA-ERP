import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { ReportCardData, TimetablePeriod, StudentLog, CertificateItem, StudentTransportItem, LibraryIssueItem } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import {
  Calendar,
  Award,
  Receipt,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Printer,
  FileText,
  ShieldAlert,
  Bus,
  BookOpen,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react';

interface Props {
  user: any;
  studentId: string;
}

export const ParentPortal: React.FC<Props> = ({ user, studentId }) => {
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'timetable' | 'exams' | 'discipline' | 'fees' | 'notifications' | 'transport' | 'certificates' | 'library'
  >('attendance');
  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feesData, setFeesData] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New modules state
  const [studentTransport, setStudentTransport] = useState<StudentTransportItem | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryIssueItem[]>([]);
  const [viewAdmitCardModal, setViewAdmitCardModal] = useState<any | null>(null);
  const [viewCertModal, setViewCertModal] = useState<CertificateItem | null>(null);
  const [loadingAdmitCard, setLoadingAdmitCard] = useState(false);

  // Report card modal state
  const [activeReportCard, setActiveReportCard] = useState<ReportCardData | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const att = await ApiService.getStudentAttendance(studentId).catch(() => null);
      setAttendanceData(att);

      const fees = await ApiService.getStudentFees(studentId).catch(() => null);
      setFeesData(fees);

      const ex = await ApiService.getExams().catch(() => ({ exams: [] }));
      setExams(ex.exams || []);

      const notifs = await ApiService.getMyAlerts().catch(() => ({ notifications: [] }));
      setNotifications(notifs.notifications || []);

      // Load Student Logs
      const logs = await ApiService.getStudentLogs(studentId).catch(() => ({ logs: [] }));
      setStudentLogs(logs.logs || []);

      // Load Timetable
      const me = await ApiService.getMe().catch(() => null);
      const child = me?.linkedStudents?.find((s: any) => s.id === studentId);
      if (child?.classId && child?.sectionId) {
        const tt = await ApiService.getTimetableByClass(child.classId, child.sectionId).catch(() => ({ periods: [] }));
        setTimetable(tt.periods || []);
      } else {
        // Fallback: try loading for Class 10 / Section A or Class 8 / Section A
        const isLSK = studentId.includes('lsk') || studentId.includes('aryan') || studentId.includes('zara');
        const classId = isLSK ? 'class-school-lsk-01-8' : 'class-10';
        const secId = isLSK ? 'sec-class-school-lsk-01-8-a' : 'sec-10-a';
        const tt = await ApiService.getTimetableByClass(classId, secId).catch(() => ({ periods: [] }));
        setTimetable(tt.periods || []);
      }

      // Load Transport Details
      const tr = await ApiService.getStudentTransport(studentId).catch(() => null);
      setStudentTransport(tr?.allocation || null);

      // Load Certificates
      const cr = await ApiService.getCertificates().catch(() => ({ certificates: [] }));
      const myCerts = (cr.certificates || []).filter((c: any) => c.studentId === studentId);
      setCertificates(myCerts);

      // Load Library Books
      const lr = await ApiService.getLibraryIssues().catch(() => ({ issues: [] }));
      const myIss = (lr.issues || []).filter((i: any) => i.studentId === studentId);
      setLibraryBooks(myIss);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleOpenReportCard = async (examId: string) => {
    setLoadingReportCard(true);
    try {
      const res = await ApiService.getReportCard(studentId, examId);
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
    setLoadingAdmitCard(true);
    try {
      const res = await ApiService.getAdmitCardData(studentId);
      if (res.admitCard) {
        setViewAdmitCardModal(res.admitCard);
      }
    } catch (err: any) {
      alert('Admit card not generated yet: ' + err.message);
    } finally {
      setLoadingAdmitCard(false);
    }
  };

  const isRahul = studentId === 'stu-rahul-01';
  const studentName = isRahul ? 'Rahul Sharma' : 'Priya Patel';

  return (
    <div className="space-y-8">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-3xl font-black shadow-lg">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Student Ward Profile</span>
              {user.appInstalled === 1 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  📱 Mobile App Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  🔔 In-App Notifications Active
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">{studentName}</h1>
            <p className="text-slate-300 text-xs mt-1">Class 10 - Section A • Delhi Public Global Academy</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 bg-white/10 backdrop-blur p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'attendance' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'timetable' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>Child Timetable</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'exams' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Award size={13} />
            <span>Exams & Report Cards</span>
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'discipline' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <ShieldAlert size={13} />
            <span>Conduct & Awards</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'fees' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Receipt size={13} />
            <span>Fees Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'notifications' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Bell size={13} />
            <span>Notification Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'transport' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Bus size={13} />
            <span>School Bus</span>
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'certificates' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Admit Card & Certs</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'library' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Library Books</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live Attendance & History */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Today's Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  isRahul ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              >
                {isRahul ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Today's Attendance</span>
                <span className="text-xl font-black text-slate-900 block">
                  {isRahul ? 'PRESENT' : 'ABSENT'}
                </span>
                <span className="text-[11px] text-slate-500">Marked on 2026-09-06</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Term Attendance Rate</span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {attendanceData?.percentage || 95}%
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Complies with CBSE 75% rule</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Class Teacher in Charge</span>
              <div className="text-base font-black text-slate-900 mt-1">Mrs. Sunita Sharma</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified via ERP authorization</p>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Past Attendance Records</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Teacher Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData?.history?.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{att.date}</td>
                      <td className="py-3 px-4 text-slate-600">Class 10-A</td>
                      <td className="py-3 px-4">
                        {att.status === 'present' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Present
                          </span>
                        )}
                        {att.status === 'absent' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Absent
                          </span>
                        )}
                        {att.status === 'late' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Late Arrival
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{att.remarks || 'Regular'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Exams & Attractive Report Cards */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Academic Examinations & Progress Cards</h2>
                <p className="text-xs text-slate-500">
                  Select any examination cycle to view and print the student's result card across 4 attractive design templates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {ex.examType}
                      </span>
                      <span className="text-[10px] text-slate-400">2026-2027</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2">{ex.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Scholastic evaluation with marks & CBSE 9-point scale grading.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenReportCard(ex.id)}
                    disabled={loadingReportCard}
                    className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>View Report Card (4 Templates)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fees Ledger & Receipts */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Fee Demand</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹ {feesData?.totalFeeAmount?.toLocaleString() || '23,000'}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Academic Year 2026-27</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Amount Paid</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ₹ {feesData?.totalPaidAmount?.toLocaleString() || '0'}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Receipt Issued</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Outstanding Balance</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                ₹ {feesData?.balanceDue?.toLocaleString() || '23,000'}
              </div>
              <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">Due by 10th of Month</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Official Payment History & Receipts</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Receipt No</th>
                    <th className="py-2.5 px-4">Payment Date</th>
                    <th className="py-2.5 px-4">Amount Paid</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feesData?.payments?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.receiptNo}</td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹ {p.amountPaid.toLocaleString()}</td>
                      <td className="py-3 px-4 uppercase text-slate-600">{p.paymentMode}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!feesData?.payments || feesData.payments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Child Timetable Matrix */}
      {activeTab === 'timetable' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                <span>Class Timetable & Daily Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Weekly lectures, subject teacher allocations, and classroom locations for your child
              </p>
            </div>

            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDay === d ? 'bg-white text-blue-700 shadow font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timetable
              .filter((p) => p.dayOfWeek.toLowerCase() === selectedDay.toLowerCase())
              .sort((a, b) => a.periodNumber - b.periodNumber)
              .map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-md transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      Period {p.periodNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {p.startTime} - {p.endTime}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{p.subjectName || 'Subject'}</h4>
                    <p className="text-xs text-slate-600">Faculty: {p.teacherName || 'Assigned Teacher'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Classroom:</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {p.roomNumber || 'Room 101'}
                    </span>
                  </div>
                </div>
              ))}
            {timetable.filter((p) => p.dayOfWeek.toLowerCase() === selectedDay.toLowerCase()).length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
                No periods scheduled for {selectedDay}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Conduct, Discipline & Awards Feed */}
      {activeTab === 'discipline' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-amber-500" size={20} />
              <span>Student Conduct, Honors & Incident History</span>
            </h2>
            <p className="text-xs text-slate-500">
              Official school records of achievements, awards, teacher observations, and disciplinary notes
            </p>
          </div>

          <div className="space-y-4">
            {studentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No behavioral or award records logged for this student.
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
                        ? 'bg-amber-50/40 border-amber-200'
                        : isDiscipline
                        ? 'bg-rose-50/30 border-rose-200'
                        : isMedical
                        ? 'bg-blue-50/30 border-blue-200'
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
                      <span>Logged by: {log.reporterName || 'Class Faculty'}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified School Record
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: In-App Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Parent Notification Feed & Alert History</h2>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      In-App Push Delivered
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">No notifications yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Transport & School Bus */}
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
                  <span className="text-[11px] font-bold text-slate-500">Fleet:</span>
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
                  <p className="text-xs text-slate-500">Please accompany ward 5 mins prior</p>
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
                  <p className="text-xs text-blue-700 font-medium">Post school dispersal</p>
                </div>
              </div>

              {/* Driver and Emergency Contact Details */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Designated Driver & School Helpline</div>
                  <div className="text-base font-black flex items-center gap-2">
                    <User size={18} />
                    <span>Rajesh Kumar (School Authorized Driver)</span>
                  </div>
                  <p className="text-xs text-slate-300">Police Verified • Speed Governed Vehicle</p>
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
                Your ward is currently registered as a Self Commuter. To opt for school transport, contact Front Desk Reception.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Admit Card & Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Admit Card Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Official Board Document
              </span>
              <h2 className="text-xl sm:text-2xl font-black">CBSE Annual Board / Term Exam Admit Card 2026</h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Official verified hall ticket with Candidate Roll Number, Examination Center, Subject Date Sheet, and Student Guidelines.
              </p>
            </div>
            <button
              onClick={handleViewAdmitCard}
              disabled={loadingAdmitCard}
              className="px-6 py-3.5 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black text-xs shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Printer size={16} className="text-blue-600" />
              <span>{loadingAdmitCard ? 'Loading...' : 'View & Print Ward Admit Card'}</span>
            </button>
          </div>

          {/* Academic Certificates */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                <span>Ward's Academic Certificates</span>
              </h3>
              <p className="text-xs text-slate-500">Official certificates authenticated by School Principal</p>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No certificates issued currently. To request Bonafide or Character certificates, apply at the Front Desk.
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

      {/* Tab 7: Library Books */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} />
                <span>Ward's Library Account & Issued Books</span>
              </h3>
              <p className="text-xs text-slate-500">Check active borrowings and return due dates to prevent overdue fines</p>
            </div>

            {libraryBooks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No books currently borrowed from the school library.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryBooks.map((b) => (
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
                      <span className="text-slate-500">Issue Date: {b.issueDate}</span>
                      {b.fineAmount > 0 && (
                        <span className="text-rose-600 font-bold">Fine: ₹{b.fineAmount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Report Card Modal */}
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
                      #{viewAdmitCardModal.rollNo || '01'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Code:</span>
                    <strong className="text-xs font-mono font-black">{viewAdmitCardModal.rollCode || 'CBSE-2026-0001'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate Name:</span>
                    <strong className="text-xs uppercase font-bold">{viewAdmitCardModal.studentName || studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Number:</span>
                    <strong className="text-xs font-mono">{viewAdmitCardModal.admissionNo || 'DPGA-2026'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Father's Name:</span>
                    <strong className="text-xs uppercase">{viewAdmitCardModal.fatherName || 'Parent / Guardian'}</strong>
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
                  🎓
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
                <strong className="block text-xs uppercase font-black text-amber-900">Important Instructions for Parents & Candidate:</strong>
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
                  DELHI PUBLIC GLOBAL ACADEMY
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
                  This is to officially certify that <strong className="uppercase font-sans font-black">{studentName}</strong>, 
                  son/daughter of <strong className="font-sans font-bold">{user.name || 'Guardian'}</strong>, 
                  is a bona fide student in this institution for the Academic Session <strong className="font-sans font-bold">{viewCertModal.academicYear || '2026-2027'}</strong>.
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
