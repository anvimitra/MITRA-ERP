import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { TeacherAllocation, AttendanceRecord, Exam, TimetablePeriod, StudentLog } from '../types';
import { CheckCircle2, UserCheck, Award, Calendar, AlertTriangle, MessageSquare, Send, ShieldAlert, BookOpen, Clock, Plus, Trash2, X } from 'lucide-react';

export const TeacherPortal: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'schedule' | 'discipline'>('attendance');
  const [teacherSchedule, setTeacherSchedule] = useState<TimetablePeriod[]>([]);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('Monday');
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    studentId: '',
    logType: 'award',
    title: '',
    description: '',
    actionTaken: '',
    date: new Date().toISOString().split('T')[0],
    notifyParent: true,
  });
  const [allocations, setAllocations] = useState<TeacherAllocation | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance state
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsAttendance, setStudentsAttendance] = useState<AttendanceRecord[]>([]);
  const [submittingAtt, setSubmittingAtt] = useState(false);
  const [attDispatchResult, setAttDispatchResult] = useState<any[] | null>(null);

  // Marks entry state
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');
  const [marksStudents, setMarksStudents] = useState<any[]>([]);
  const [savingMarks, setSavingMarks] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const alloc = await ApiService.getMyAllocations();
      setAllocations(alloc);

      const examRes = await ApiService.getExams();
      setExams(examRes.exams || []);
      if (examRes.exams?.length > 0) {
        setSelectedExamId(examRes.exams[0].id);
      }

      if (alloc.subjectsAssigned?.length > 0) {
        setSelectedAllocationId(alloc.subjectsAssigned[0].id);
      }

      // If class teacher, load attendance for assigned class
      if (alloc.classTeacherOf?.length > 0) {
        const ct = alloc.classTeacherOf[0];
        const attRes = await ApiService.getClassAttendance(ct.classId, ct.sectionId, attDate);
        setStudentsAttendance(attRes.students || []);
      }

      // Load Teacher's Teaching Schedule
      const sched = await ApiService.getTimetableByTeacher(user.id).catch(() => ({ periods: [] }));
      setTeacherSchedule(sched.periods || []);

      // Load School Student Logs
      const logs = await ApiService.getSchoolStudentLogs().catch(() => ({ logs: [] }));
      setStudentLogs(logs.logs || []);
    } catch (err) {
      console.error('Error loading teacher portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateChange = async (newDate: string) => {
    setAttDate(newDate);
    if (allocations?.classTeacherOf?.length) {
      const ct = allocations.classTeacherOf[0];
      const attRes = await ApiService.getClassAttendance(ct.classId, ct.sectionId, newDate);
      setStudentsAttendance(attRes.students || []);
    }
  };

  const handleMarkAllPresent = () => {
    setStudentsAttendance((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'present',
      }))
    );
  };

  const handleStatusChange = (studentId: string, status: any) => {
    setStudentsAttendance((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.studentId || !logForm.title || !logForm.description) {
      alert('Please select student and fill in title & description');
      return;
    }
    try {
      await ApiService.createStudentLog(logForm);
      alert('✅ Student observation / award log recorded & parent notified!');
      setShowLogModal(false);
      setLogForm({
        studentId: '',
        logType: 'award',
        title: '',
        description: '',
        actionTaken: '',
        date: new Date().toISOString().split('T')[0],
        notifyParent: true,
      });
      const logs = await ApiService.getSchoolStudentLogs().catch(() => ({ logs: [] }));
      setStudentLogs(logs.logs || []);
    } catch (err: any) {
      alert('Error saving log: ' + err.message);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!allocations?.classTeacherOf?.length) return;
    const ct = allocations.classTeacherOf[0];

    setSubmittingAtt(true);
    setAttDispatchResult(null);
    try {
      const res = await ApiService.markAttendance(
        ct.classId,
        ct.sectionId,
        attDate,
        studentsAttendance.map((s) => ({
          studentId: s.studentId,
          status: s.status === 'unmarked' ? 'present' : s.status,
          remarks: s.remarks,
        }))
      );

      setAttDispatchResult(res.alertDispatches || []);
      alert('✅ Attendance submitted! Parent in-app push notifications dispatched.');
    } catch (err: any) {
      alert('Error marking attendance: ' + err.message);
    } finally {
      setSubmittingAtt(false);
    }
  };

  // Marks entry loader
  const loadMarksSheet = async (examId: string, allocId: string) => {
    if (!allocations || !examId || !allocId) return;
    const alloc = allocations.subjectsAssigned.find((a) => a.id === allocId);
    if (!alloc) return;

    try {
      const res = await ApiService.getMarksSheet(examId, alloc.classId, alloc.sectionId, alloc.subjectId);
      setMarksStudents(res.students || []);
    } catch (err) {
      console.error('Error loading marks sheet:', err);
    }
  };

  useEffect(() => {
    if (selectedExamId && selectedAllocationId) {
      loadMarksSheet(selectedExamId, selectedAllocationId);
    }
  }, [selectedExamId, selectedAllocationId]);

  const handleMarkValueChange = (studentId: string, value: string) => {
    const num = Number(value);
    setMarksStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          const marksObtained = isNaN(num) ? 0 : num;
          const maxMarks = s.maxMarks || 100;
          const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
          let grade = 'E';
          if (pct >= 91) grade = 'A1';
          else if (pct >= 81) grade = 'A2';
          else if (pct >= 71) grade = 'B1';
          else if (pct >= 61) grade = 'B2';
          else if (pct >= 51) grade = 'C1';
          else if (pct >= 41) grade = 'C2';
          else if (pct >= 33) grade = 'D';

          return { ...s, marksObtained: value, grade };
        }
        return s;
      })
    );
  };

  const handleSaveMarks = async () => {
    if (!allocations || !selectedExamId || !selectedAllocationId) return;
    const alloc = allocations.subjectsAssigned.find((a) => a.id === selectedAllocationId);
    if (!alloc) return;

    setSavingMarks(true);
    try {
      await ApiService.recordMarks(
        selectedExamId,
        alloc.classId,
        alloc.sectionId,
        alloc.subjectId,
        marksStudents.map((s) => ({
          studentId: s.studentId,
          marksObtained: Number(s.marksObtained) || 0,
          maxMarks: Number(s.maxMarks) || 100,
          remarks: s.remarks,
        }))
      );
      alert('✅ Marks saved successfully! Grades and report cards updated.');
    } catch (err: any) {
      alert('Error saving marks: ' + err.message);
    } finally {
      setSavingMarks(false);
    }
  };

  const isClassTeacher = allocations?.isClassTeacher;

  return (
    <div className="space-y-8">
      {/* Teacher Workspace Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <UserCheck size={16} /> Faculty Portal • Strict Role-Based Execution
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            {isClassTeacher
              ? '✅ You are the designated Class Teacher for Class 10-A (Authorized to mark daily attendance).'
              : '🔒 You are a Subject Faculty (Science). Attendance is restricted to the Class Teacher.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-white/10 backdrop-blur p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'attendance' ? 'bg-white text-blue-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span>Class Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'marks' ? 'bg-white text-blue-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Award size={14} />
            <span>Marks & Evaluation</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'schedule' ? 'bg-white text-blue-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>My Teaching Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === 'discipline' ? 'bg-white text-blue-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Conduct & Awards Desk</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Attendance Taking */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {!isClassTeacher ? (
            /* Restricted Security Banner */
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 mx-auto mb-3">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-lg font-bold text-amber-950">Permission Denied: Class Teacher Restricted</h2>
              <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                Per the ERP security policy, only the designated <strong>Class Teacher (Mrs. Sunita Sharma)</strong> is authorized to mark daily attendance for Class 10-A. You have subject evaluation permissions under the "Marks & Evaluation" tab.
              </p>
            </div>
          ) : (
            /* Attendance Management Screen */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Daily Attendance Entry • Class 10 (Section A)</h2>
                  <p className="text-xs text-slate-500">
                    Mark presence or absence. Parents receive instant In-App Push Notifications.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                    <Calendar size={14} className="text-blue-600" />
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-transparent focus:outline-none font-bold"
                    />
                  </div>
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Mark All Present
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Adm No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentsAttendance.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.rollNo || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{s.admissionNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, 'present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, 'absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, 'late')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, 'half_day')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'half_day'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Half Day
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentId, 'excused')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'excused'
                                  ? 'bg-teal-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add remark..."
                              value={s.remarks || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStudentsAttendance((prev) =>
                                  prev.map((item) =>
                                    item.studentId === s.studentId ? { ...item, remarks: val } : item
                                  )
                                );
                              }}
                              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-full focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogForm({
                                  studentId: s.studentId,
                                  logType: 'observation',
                                  title: '',
                                  description: '',
                                  actionTaken: '',
                                  date: attDate,
                                  notifyParent: true,
                                });
                                setShowLogModal(true);
                              }}
                              title="Log Student Observation"
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 whitespace-nowrap"
                            >
                              + Log
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Total Students: <strong>{studentsAttendance.length}</strong> • Present:{' '}
                  <strong className="text-emerald-600">
                    {studentsAttendance.filter((s) => s.status === 'present').length}
                  </strong>{' '}
                  • Absent:{' '}
                  <strong className="text-rose-600">
                    {studentsAttendance.filter((s) => s.status === 'absent').length}
                  </strong>
                </p>

                <button
                  onClick={handleSubmitAttendance}
                  disabled={submittingAtt}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Send size={14} />
                  <span>{submittingAtt ? 'Dispatching...' : 'Submit Attendance & Send Alerts'}</span>
                </button>
              </div>

              {/* Live Alert Dispatch Results Banner */}
              {attDispatchResult && attDispatchResult.length > 0 && (
                <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-400" /> Automated Parent In-App Notification Dispatch Log
                  </h3>
                  <div className="space-y-2 text-xs">
                    {attDispatchResult.map((res, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-white">{res.studentName}</strong> was marked{' '}
                          <span className="text-rose-400 font-bold uppercase">{res.status}</span>.
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Channel: In-App Push Notification • Recipient: {res.dispatchResult?.recipientPhone}
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                          📲 In-App Push Delivered
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Marks & Assessment Entry */}
      {activeTab === 'marks' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Subject Marks & Grade Evaluation</h2>
            <p className="text-xs text-slate-500">
              Only subjects and classes officially assigned to you appear in the selector below.
            </p>
          </div>

          {/* Allocation & Exam Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Examination Cycle</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.examType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Assigned Class & Subject</label>
              <select
                value={selectedAllocationId}
                onChange={(e) => setSelectedAllocationId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {allocations?.subjectsAssigned?.map((a) => {
                  const sub = allocations.allSubjects?.find((s) => s.id === a.subjectId);
                  const cls = allocations.allClasses?.find((c) => c.id === a.classId);
                  return (
                    <option key={a.id} value={a.id}>
                      {sub?.name || 'Subject'} • {cls?.name || 'Class'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4 text-center">Max Marks</th>
                  <th className="py-3 px-4 text-center">Calculated Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.rollNo || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{s.admissionNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Marks"
                        value={s.marksObtained}
                        onChange={(e) => handleMarkValueChange(s.studentId, e.target.value)}
                        className="w-24 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">100</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {s.grade || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveMarks}
              disabled={savingMarks}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              {savingMarks ? 'Saving...' : 'Save & Publish Marks to Report Cards'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: My Teaching Schedule */}
      {activeTab === 'schedule' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                <span>My Weekly Teaching Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Weekly period timetable allocated to {user.name} across classes and labs
              </p>
            </div>

            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedScheduleDay(d)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedScheduleDay === d
                      ? 'bg-white text-blue-700 shadow font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teacherSchedule
              .filter((p) => p.dayOfWeek.toLowerCase() === selectedScheduleDay.toLowerCase())
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
                    <p className="text-xs font-bold text-blue-600">
                      {p.className || 'Class 10'} • Section {p.sectionName || 'A'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Room:</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {p.roomNumber || 'Room 101'}
                    </span>
                  </div>
                </div>
              ))}
            {teacherSchedule.filter((p) => p.dayOfWeek.toLowerCase() === selectedScheduleDay.toLowerCase()).length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
                No teaching lectures scheduled for {selectedScheduleDay}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Student Conduct & Awards Desk */}
      {activeTab === 'discipline' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-amber-500" size={20} />
                <span>Student Behavioral Desk & Awards</span>
              </h2>
              <p className="text-xs text-slate-500">
                Log academic achievements, awards, conduct notes, and medical visits with instant parent alert
              </p>
            </div>

            <button
              onClick={() => {
                setLogForm({
                  studentId: studentsAttendance[0]?.studentId || '',
                  logType: 'award',
                  title: '',
                  description: '',
                  actionTaken: '',
                  date: new Date().toISOString().split('T')[0],
                  notifyParent: true,
                });
                setShowLogModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Log New Observation</span>
            </button>
          </div>

          <div className="space-y-3">
            {studentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No behavioral or award records logged yet.
              </div>
            ) : (
              studentLogs.map((log) => {
                const isAward = log.logType === 'award';
                const isDiscipline = log.logType === 'discipline';
                const isMedical = log.logType === 'medical';
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition space-y-1.5 ${
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
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
                        <span className="font-extrabold text-sm text-slate-900">{log.studentName || 'Student'}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold">{log.date}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800">{log.title}</h4>
                    <p className="text-xs text-slate-600">{log.description}</p>

                    {log.actionTaken && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold">Action / Reward: </span>
                        {log.actionTaken}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Reported by: {log.reporterName || user.name}</span>
                      {log.notifyParent === 1 && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Parent Alert Dispatched
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

      {/* Modal: Log Student Observation */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />
                <span>Log Student Observation / Incident</span>
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student</label>
                  <select
                    required
                    value={logForm.studentId}
                    onChange={(e) => setLogForm({ ...logForm, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">-- Choose Student --</option>
                    {studentsAttendance.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} (#{s.rollNo || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Record Type</label>
                  <select
                    value={logForm.logType}
                    onChange={(e) => setLogForm({ ...logForm, logType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="award">Award / Recognition</option>
                    <option value="observation">Teacher Observation / Commendation</option>
                    <option value="discipline">Disciplinary Incident / Infraction</option>
                    <option value="medical">Medical Room / Health Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title / Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place in Science Quiz / Late Arrival"
                  value={logForm.title}
                  onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe details, context, and student reaction..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corrective Action Taken / Award Given</label>
                <input
                  type="text"
                  placeholder="e.g. Verbal guidance / Certificate awarded / Sent to infirmary"
                  value={logForm.actionTaken}
                  onChange={(e) => setLogForm({ ...logForm, actionTaken: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={logForm.notifyParent}
                    onChange={(e) => setLogForm({ ...logForm, notifyParent: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Dispatch in-app notification to parents</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
                >
                  Save & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
