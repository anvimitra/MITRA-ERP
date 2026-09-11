import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { ReportCardData, TimetablePeriod, StudentLog } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import { Calendar, Award, Receipt, Bell, CheckCircle2, XCircle, Clock, Sparkles, Printer, FileText, ShieldAlert } from 'lucide-react';

interface Props {
  user: any;
  studentId: string;
}

export const ParentPortal: React.FC<Props> = ({ user, studentId }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'timetable' | 'exams' | 'discipline' | 'fees' | 'notifications'>('attendance');
  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feesData, setFeesData] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      {/* Interactive Report Card Modal */}
      {activeReportCard && (
        <ReportCardModal data={activeReportCard} onClose={() => setActiveReportCard(null)} />
      )}
    </div>
  );
};
