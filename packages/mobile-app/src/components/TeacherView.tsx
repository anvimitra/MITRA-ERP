import React, { useState, useEffect } from 'react';
import { User, Student, StaffLeaveItem, ExamItem, NotificationItem } from '../types';
import {
  submitClassAttendance,
  fetchLiveStudents,
  fetchLiveClasses,
  fetchStaffLeaves,
  applyStaffLeave,
  fetchExamsList,
  fetchMarksSheet,
  saveExamMarks,
  fetchLiveNotices,
  fetchMyAllocations,
} from '../api';
import {
  Check,
  X,
  Clock,
  Send,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  UserCheck,
  RefreshCw,
  Briefcase,
  Plus,
  BellRing,
  Layers,
  Save,
  Search,
  Bus,
} from 'lucide-react';
import { LiveBusMapModal } from './LiveBusMapModal';

interface Props {
  teacher: User;
  activeSubTab?: 'attendance' | 'marks' | 'leaves' | 'notices';
  onSubTabChange?: (tab: 'attendance' | 'marks' | 'leaves' | 'notices') => void;
}

export const TeacherView: React.FC<Props> = ({ teacher, activeSubTab: externalTab, onSubTabChange }) => {
  const [internalTab, setInternalTab] = useState<'attendance' | 'marks' | 'leaves' | 'notices'>('attendance');
  const activeSubTab = externalTab || internalTab;
  const setActiveSubTab = (tab: 'attendance' | 'marks' | 'leaves' | 'notices') => {
    setInternalTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classList, setClassList] = useState<any[]>([]);
  const [sectionList, setSectionList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [students, setStudents] = useState<
    Array<Student & { status: 'present' | 'absent' | 'late'; marks?: number | ''; remarks?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attSearch, setAttSearch] = useState('');
  const [marksSearch, setMarksSearch] = useState('');
  const [showFleetTracking, setShowFleetTracking] = useState(false);

  // Marks Entry state
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState('exam-sa1');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [savingMarks, setSavingMarks] = useState(false);
  const [allocations, setAllocations] = useState<any>(null);
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');

  // Leaves state
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Notices state
  const [notices, setNotices] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadClassData();
    fetchStaffLeaves().then(setLeaves).catch(() => {});
    fetchExamsList().then((list) => {
      if (list && list.length > 0) {
        setExams(list);
        setSelectedExam(list[0].id);
      }
    }).catch(() => {});
    fetchLiveNotices().then(setNotices).catch(() => {});
  }, []);

  const loadClassData = async () => {
    setLoading(true);
    try {
      const [alloc, studentsData] = await Promise.all([
        fetchMyAllocations(),
        fetchLiveStudents(),
      ]);
      setAllocations(alloc);

      // 1. Filter attendance classes to ONLY those where teacher is Class Teacher
      if (alloc.classTeacherOf && alloc.classTeacherOf.length > 0) {
        const allowedClassIds = new Set(alloc.classTeacherOf.map((ct: any) => ct.classId));
        const allowedClasses = (alloc.allClasses || []).filter((c: any) => allowedClassIds.has(c.id));
        setClassList(allowedClasses);
        setSelectedClassId(alloc.classTeacherOf[0].classId);
        setSelectedSectionId(alloc.classTeacherOf[0].sectionId);
      } else {
        setClassList([]);
        setSelectedClassId('');
        setSelectedSectionId('');
      }

      // 2. Configure subjects assigned for Marks Entry
      if (alloc.subjectsAssigned && alloc.subjectsAssigned.length > 0) {
        const firstAlloc = alloc.subjectsAssigned[0];
        setSelectedAllocationId(firstAlloc.id);
        const sub = alloc.allSubjects?.find((s: any) => s.id === firstAlloc.subjectId);
        setSelectedSubject(sub?.name || 'Subject');
      }

      if (studentsData?.length > 0) {
        setStudents(
          studentsData.map((s) => ({
            ...s,
            status: 'present',
            marks: '',
          }))
        );
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load marks sheet when exam or subject or class changes
  const loadMarksSheetData = async (examId: string, classId: string, sectionId: string, subject: string) => {
    if (!examId || !classId) return;
    try {
      const sheet = await fetchMarksSheet(examId, classId, sectionId || 'sec-a', subject);
      if (sheet && sheet.length > 0) {
        setStudents((prev) =>
          prev.map((s) => {
            const entry = sheet.find((sh) => sh.studentId === s.id);
            return {
              ...s,
              marks: entry && entry.marksObtained !== '' ? entry.marksObtained : s.marks ?? '',
            };
          })
        );
      }
    } catch (err) {
      console.warn('Marks sheet fetch error', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'marks' && selectedClassId) {
      loadMarksSheetData(selectedExam, selectedClassId, selectedSectionId, selectedSubject);
    }
  }, [activeSubTab, selectedExam, selectedClassId, selectedSectionId, selectedSubject]);

  const toggleStatus = (id: string, newStatus: 'present' | 'absent' | 'late') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const updateStudentMarks = (id: string, val: string) => {
    const limit = maxMarks > 0 ? maxMarks : 100;
    const num = val === '' ? '' : Math.min(limit, Math.max(0, parseInt(val) || 0));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, marks: num } : s))
    );
  };

  // Save Attendance to ERP
  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: s.status,
        remarks: s.status === 'late' ? 'Marked late' : undefined,
      }));

      await submitClassAttendance(selectedClassId || 'class-1', selectedSectionId || 'sec-a', selectedDate, records);
      setFeedback('✅ Attendance recorded successfully! Instant In-App Notifications dispatched to all parents.');
    } catch (err: any) {
      setFeedback(err.message || 'Error recording attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Save Exam Marks to ERP
  const handleSaveMarks = async () => {
    setSavingMarks(true);
    setFeedback(null);

    try {
      let targetClassId = selectedClassId;
      let targetSectionId = selectedSectionId;
      let targetSubjectId = selectedSubject;

      if (allocations?.subjectsAssigned && selectedAllocationId) {
        const curAlloc = allocations.subjectsAssigned.find((a: any) => a.id === selectedAllocationId);
        if (curAlloc) {
          targetClassId = curAlloc.classId;
          targetSectionId = curAlloc.sectionId;
          targetSubjectId = curAlloc.subjectId;
        }
      }

      const marksList = students.map((s) => ({
        studentId: s.id,
        marksObtained: typeof s.marks === 'number' ? s.marks : 0,
        maxMarks: maxMarks || 100,
        remarks: 'Recorded by Teacher via Mobile App',
      }));

      await saveExamMarks(
        selectedExam || 'exam-sa1',
        targetClassId || 'class-1',
        targetSectionId || 'sec-a',
        targetSubjectId,
        marksList
      );

      setFeedback(`✅ Subject marks for ${selectedSubject} (Out of ${maxMarks}) saved successfully!`);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to save subject marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  // Apply Leave
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    setSubmittingLeave(true);
    try {
      const start = new Date(leaveStartDate);
      const end = new Date(leaveEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      await applyStaffLeave({
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        totalDays,
        reason: leaveReason.trim(),
      });

      setShowApplyModal(false);
      setLeaveReason('');
      setFeedback('✅ Leave application submitted to Principal for review.');
      const updated = await fetchStaffLeaves();
      setLeaves(updated || []);
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Teacher Role Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base leading-tight">{teacher.name}</h2>
            <p className="text-xs text-purple-200">
              Role: <span className="font-bold text-amber-300">Faculty / Teacher</span>
            </p>
            <p className="text-[11px] text-purple-300">
              Department: <span className="font-bold text-emerald-300">Academic Staff</span>
            </p>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-white/10 text-[10px] font-bold">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeSubTab === 'attendance' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveSubTab('marks')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeSubTab === 'marks' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Marks Entry
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeSubTab === 'leaves' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Leaves
          </button>
          <button
            onClick={() => setActiveSubTab('notices')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeSubTab === 'notices' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Circulars
          </button>
        </div>
      </div>

      {/* Live School Bus Tracking Shortcut for Faculty */}
      <button
        onClick={() => setShowFleetTracking(true)}
        className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 flex items-center justify-between transition shadow-sm"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Bus className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-amber-950">Live School Bus Fleet Tracking</h4>
            <p className="text-[10px] text-amber-700">Check live positions of school buses & arrival status</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
          Live GPS
        </span>
      </button>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-semibold flex items-start space-x-2 bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{feedback}</div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ATTENDANCE MODE */}
      {activeSubTab === 'attendance' && (
        classList.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-dashed border-amber-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Attendance Taking Restricted</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Under school governance rules, attendance roll call is strictly restricted to designated Class Teachers. You are not currently assigned as a Class Teacher for any section.
            </p>
          </div>
        ) : (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">Daily Attendance Roll Call</h3>
                {loading && <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />}
              </div>
              <p className="text-xs text-slate-500">Tap status badge to mark Present, Absent, or Late</p>
            </div>
            <div className="flex items-center gap-2">
              {classList.length > 0 && (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700"
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700"
              />
            </div>
          </div>

          {/* Search student by name or roll */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or roll no..."
              value={attSearch}
              onChange={(e) => setAttSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            {students.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {loading ? 'Loading class students...' : 'No students found in this class.'}
              </div>
            ) : (
              students
                .filter((stu) => {
                  if (!attSearch.trim()) return true;
                  const q = attSearch.toLowerCase().trim();
                  return (
                    `${stu.firstName} ${stu.lastName || ''}`.toLowerCase().includes(q) ||
                    String(stu.admissionNo || '').toLowerCase().includes(q) ||
                    String(stu.rollNo || '').toLowerCase().includes(q)
                  );
                })
                .map((stu) => (
                <div
                  key={stu.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={stu.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">
                        {stu.firstName} {stu.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Roll #{stu.rollNo || '-'} • Adm: {stu.admissionNo}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Toggle Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleStatus(stu.id, 'present')}
                      className={`p-1.5 rounded-lg text-xs font-black transition ${
                        stu.status === 'present'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Present"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStatus(stu.id, 'late')}
                      className={`p-1.5 rounded-lg text-xs font-black transition ${
                        stu.status === 'late'
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Late"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStatus(stu.id, 'absent')}
                      className={`p-1.5 rounded-lg text-xs font-black transition ${
                        stu.status === 'absent'
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Absent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={isSubmitting || students.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording & Notifying Parents...' : 'Submit Attendance & Notify Parents'}</span>
          </button>
        </div>
        )
      )}

      {/* MARKS ENTRY MODE */}
      {activeSubTab === 'marks' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full text-xs font-semibold p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-800"
              >
                {exams.length > 0 ? (
                  exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="exam-sa1">SA1 Exam</option>
                    <option value="exam-sa2">SA2 Exam</option>
                    <option value="exam-sa3">SA3 Exam</option>
                    <option value="exam-halfyearly">Half Yearly Exam</option>
                    <option value="exam-yearly">Yearly Exam</option>
                    <option value="exam-weekly-01">Weekly Test 1</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Subject</label>
              {allocations?.subjectsAssigned?.length > 0 ? (
                <select
                  value={selectedAllocationId}
                  onChange={(e) => {
                    const aId = e.target.value;
                    setSelectedAllocationId(aId);
                    const curAlloc = allocations.subjectsAssigned.find((a: any) => a.id === aId);
                    if (curAlloc) {
                      setSelectedClassId(curAlloc.classId);
                      setSelectedSectionId(curAlloc.sectionId);
                      const sub = allocations.allSubjects?.find((s: any) => s.id === curAlloc.subjectId);
                      setSelectedSubject(sub?.name || 'Subject');
                    }
                  }}
                  className="w-full text-xs font-semibold p-2 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 font-bold"
                >
                  {allocations.subjectsAssigned.map((a: any) => {
                    const sub = allocations.allSubjects?.find((s: any) => s.id === a.subjectId);
                    const cls = allocations.allClasses?.find((c: any) => c.id === a.classId);
                    const sec = allocations.allSections?.find((s: any) => s.id === a.sectionId);
                    return (
                      <option key={a.id} value={a.id}>
                        {sub?.name || 'Subject'} • {cls?.name || 'Class'} ({sec?.name || 'A'})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="text-[11px] p-2 bg-amber-50 text-amber-900 font-medium rounded-xl border border-amber-200">
                  No subjects assigned to you
                </div>
              )}
            </div>
          </div>

          {/* Teacher Configurable Maximum Marks */}
          <div className="flex items-center justify-between p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-purple-950 block">Assessment Total (Max Marks)</span>
              <span className="text-[10px] text-purple-700">Enter total out of which marks are scored</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                min="1"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Math.max(1, parseInt(e.target.value) || 50))}
                className="w-16 p-1 text-center font-black text-xs text-purple-950 bg-white border border-purple-300 rounded-lg shadow-sm"
              />
              <span className="text-xs font-bold text-purple-900">Marks</span>
            </div>
          </div>

          {/* Search student by name or roll */}
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or roll no..."
              value={marksSearch}
              onChange={(e) => setMarksSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:bg-white"
            />
          </div>

          <div className="space-y-2 mt-2">
            {students.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No students enrolled to grade.
              </div>
            ) : (
              students
                .filter((stu) => {
                  if (!marksSearch.trim()) return true;
                  const q = marksSearch.toLowerCase().trim();
                  return (
                    `${stu.firstName} ${stu.lastName || ''}`.toLowerCase().includes(q) ||
                    String(stu.admissionNo || '').toLowerCase().includes(q) ||
                    String(stu.rollNo || '').toLowerCase().includes(q)
                  );
                })
                .map((stu) => (
                <div
                  key={stu.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">
                      {stu.firstName} {stu.lastName}
                    </h4>
                    <p className="text-[10px] text-slate-400">Roll #{stu.rollNo || '-'} • Adm: {stu.admissionNo}</p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      placeholder="--"
                      value={stu.marks ?? ''}
                      onChange={(e) => updateStudentMarks(stu.id, e.target.value)}
                      className="w-16 p-1 text-center font-black text-sm text-purple-900 bg-white border border-slate-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <span className="text-xs text-slate-400 font-semibold">/ {maxMarks}</span>
                    {stu.marks !== '' && typeof stu.marks === 'number' && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                        {stu.marks / (maxMarks || 1) >= 0.91 ? 'A1' :
                         stu.marks / (maxMarks || 1) >= 0.81 ? 'A2' :
                         stu.marks / (maxMarks || 1) >= 0.71 ? 'B1' :
                         stu.marks / (maxMarks || 1) >= 0.61 ? 'B2' :
                         stu.marks / (maxMarks || 1) >= 0.51 ? 'C1' :
                         stu.marks / (maxMarks || 1) >= 0.41 ? 'C2' :
                         stu.marks / (maxMarks || 1) >= 0.33 ? 'D' : 'E'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSaveMarks}
            disabled={savingMarks || students.length === 0}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingMarks ? 'Saving Marks to ERP...' : 'Save & Lock Subject Marks'}</span>
          </button>
        </div>
      )}

      {/* LEAVES MODE */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>My Leave Applications ({leaves.length})</span>
            </h3>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-3 py-1.5 bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {leaves.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border p-4">
                No leave requests filed yet. Tap "Apply" above to submit a leave request.
              </div>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-100 text-purple-800">
                      {l.leaveType} LEAVE
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium">{l.reason}</p>
                  <p className="text-[10px] text-slate-400">
                    {l.startDate} to {l.endDate} ({l.totalDays} Days)
                  </p>
                  {l.reviewRemarks && (
                    <p className="text-[10px] text-purple-700 bg-purple-50 p-1.5 rounded-lg">
                      Principal Note: {l.reviewRemarks}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* NOTICES & CIRCULARS */}
      {activeSubTab === 'notices' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
            <BellRing className="w-4 h-4 text-purple-600" />
            <span>Official School Circulars ({notices.length})</span>
          </h3>

          <div className="space-y-2">
            {notices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border p-4">
                No active circulars from the Principal.
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">{n.title}</strong>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-slate-900">Apply for Faculty Leave</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                  <option value="DUTY">On Duty (OD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Reason for Leave *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for your absence..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-4"
              >
                <Briefcase className="w-4 h-4" />
                <span>{submittingLeave ? 'Submitting...' : 'Submit Leave to Principal'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Live Bus Tracking Modal */}
      {showFleetTracking && (
        <LiveBusMapModal
          isFleetView={true}
          onClose={() => setShowFleetTracking(false)}
        />
      )}
    </div>
  );
};
