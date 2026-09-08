import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { TeacherAllocation, AttendanceRecord, Exam } from '../types';
import { CheckCircle2, UserCheck, Award, Calendar, AlertTriangle, MessageSquare, Send, ShieldAlert, BookOpen } from 'lucide-react';

export const TeacherPortal: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks'>('attendance');
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
      alert('✅ Attendance submitted! Parent alerts & SMS fallback dispatched.');
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
                    Mark presence or absence. Parents receive immediate Push Notification, or Automated Text SMS if inactive on app.
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                s.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
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
                    <MessageSquare size={14} className="text-amber-400" /> Automated Parent Notification & Fallback
                    SMS Dispatch Log
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
                            Channel: {res.dispatchResult?.channel} • Recipient: {res.dispatchResult?.recipientPhone}
                          </div>
                        </div>

                        {res.dispatchResult?.channel === 'AUTOMATED_SMS_FALLBACK' ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            ⚡ Automated Text SMS Sent (Parent Inactive on App)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            📲 Push Notification Sent to Mobile App
                          </span>
                        )}
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
    </div>
  );
};
