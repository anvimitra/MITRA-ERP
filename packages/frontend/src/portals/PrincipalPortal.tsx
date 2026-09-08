import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { Users, GraduationCap, Calendar, BookOpen, UserCheck, ShieldAlert, Award, Plus, Check } from 'lucide-react';

export const PrincipalPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'class-teachers' | 'subject-allocations' | 'exams'>('overview');
  const [classesData, setClassesData] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [ctClassId, setCtClassId] = useState('class-10');
  const [ctSectionId, setCtSectionId] = useState('sec-10-a');
  const [ctTeacherId, setCtTeacherId] = useState('user-teacher-sharma');

  const [subTeacherId, setSubTeacherId] = useState('user-teacher-verma');
  const [subClassId, setSubClassId] = useState('class-10');
  const [subSectionId, setSubSectionId] = useState('sec-10-a');
  const [subSubjectId, setSubSubjectId] = useState('sub-sci');

  // Exam creation state
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('sa2');

  const loadData = async () => {
    setLoading(true);
    try {
      const cData = await ApiService.getClasses();
      setClassesData(cData);
      const eData = await ApiService.getExams();
      setExams(eData.exams || []);
    } catch (err) {
      console.error('Error loading principal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.assignClassTeacher(ctClassId, ctSectionId, ctTeacherId);
      alert('✅ Class Teacher assigned successfully! Attendance permission updated.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAssignSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.assignSubjectTeacher(subTeacherId, subClassId, subSectionId, subSubjectId);
      alert('✅ Subject Teacher allocated successfully! Marks entry permission updated.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createExam({
        name: newExamName,
        examType: newExamType as any,
        academicYear: '2026-2027',
      });
      alert('✅ Exam schedule added successfully!');
      setNewExamName('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Principal Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2 inline-block">
            ACADEMIC HEAD & INSTITUTION CONTROL
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Principal Administration Hub</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Configure Class Teachers (for Attendance authorization), assign Subject Faculties (for Marks evaluation), and manage examination cycles.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-white/10 backdrop-blur p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'overview' ? 'bg-white text-indigo-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('class-teachers')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'class-teachers' ? 'bg-white text-indigo-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            Class Teachers (Attendance RBAC)
          </button>
          <button
            onClick={() => setActiveTab('subject-allocations')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'subject-allocations' ? 'bg-white text-indigo-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            Subject Allocations (Marks RBAC)
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'exams' ? 'bg-white text-indigo-950 shadow' : 'text-white/80 hover:text-white'
            }`}
          >
            Exams & Terms
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</div>
              <div className="text-3xl font-black text-slate-900 mt-1">4 Students</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Admission Records Active</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Teaching Staff</div>
              <div className="text-3xl font-black text-slate-900 mt-1">2 Faculty</div>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">All Roles Allocated</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Today's Attendance</div>
              <div className="text-3xl font-black text-slate-900 mt-1">75.0%</div>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">3 Present, 1 Absent (Priya)</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Active Exam</div>
              <div className="text-3xl font-black text-slate-900 mt-1">SA1 (Term 1)</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Marks Publishing Ready</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Class Teachers Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <UserCheck className="text-blue-600" size={18} /> Active Class Teacher Assignments
              </h2>
              <p className="text-xs text-slate-500 mb-4">Strict attendance entry privilege granted to designated class teachers</p>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-950 block">Class 10 - Section A</span>
                    <span className="text-slate-500">Teacher: Mrs. Sunita Sharma</span>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                    Authorized for Attendance
                  </span>
                </div>
              </div>
            </div>

            {/* Active Subject Allocations Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={18} /> Active Subject Teacher Allocations
              </h2>
              <p className="text-xs text-slate-500 mb-4">Strict marks entry privilege granted to designated subject faculties</p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">Mathematics (MATH-041) • Class 10-A</span>
                    <span className="text-slate-500">Faculty: Mrs. Sunita Sharma</span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px]">
                    Authorized for Marks
                  </span>
                </div>
                <div className="p-3 bg-cyan-50/60 border border-cyan-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-950 block">Science & Tech (SCI-086) • Class 10-A</span>
                    <span className="text-slate-500">Faculty: Mr. Amit Verma</span>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-600 text-white font-bold rounded-lg text-[10px]">
                    Authorized for Marks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Class Teachers Allocation */}
      {activeTab === 'class-teachers' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Designate Class Teacher for Attendance</h2>
            <p className="text-xs text-slate-500">
              Only the assigned Class Teacher has the security permission to mark and modify student daily attendance.
            </p>
          </div>

          <form onSubmit={handleAssignClassTeacher} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Class</label>
              <select
                value={ctClassId}
                onChange={(e) => setCtClassId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Section</label>
              <select
                value={ctSectionId}
                onChange={(e) => setCtSectionId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.sections?.map((s: any) => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Teacher</label>
              <select
                value={ctTeacherId}
                onChange={(e) => setCtTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.teachers?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Check size={14} /> Assign Class Teacher
              </button>
            </div>
          </form>

          {/* Current Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Existing Class Teacher Assignments
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-4">Designated Class Teacher</th>
                    <th className="py-2.5 px-4">Permission Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Class 10</td>
                    <td className="py-3 px-4">Section A</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">Mrs. Sunita Sharma</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Attendance Authorized
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Subject Allocations */}
      {activeTab === 'subject-allocations' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Allocate Subject Teacher for Marks Entry</h2>
            <p className="text-xs text-slate-500">
              Only the faculty allocated to a subject in a specific class and section can enter test and examination marks.
            </p>
          </div>

          <form onSubmit={handleAssignSubjectTeacher} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Faculty</label>
              <select
                value={subTeacherId}
                onChange={(e) => setSubTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.teachers?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Class</label>
              <select
                value={subClassId}
                onChange={(e) => setSubClassId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <select
                value={subSectionId}
                onChange={(e) => setSubSectionId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.sections?.map((s: any) => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject</label>
              <select
                value={subSubjectId}
                onChange={(e) => setSubSubjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.subjects?.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition"
              >
                Allocate Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Exams & Terms */}
      {activeTab === 'exams' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Examination Cycles & Assessment Modules</h2>
              <p className="text-xs text-slate-500">
                Supports SA1, SA2, SA3, Half Yearly, Yearly Exams and Weekly Assessment Tests.
              </p>
            </div>
          </div>

          {/* Add Exam Form */}
          <form onSubmit={handleCreateExam} className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-bold text-slate-700 mb-1">Exam Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Summative Assessment 2 (SA2)"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="w-48">
              <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
              <select
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                <option value="weekly">Weekly Assessment Test</option>
                <option value="unit">Unit Test (UT)</option>
                <option value="sa1">SA1 (Summative Assessment 1)</option>
                <option value="sa2">SA2 (Summative Assessment 2)</option>
                <option value="sa3">SA3 (Summative Assessment 3)</option>
                <option value="half_yearly">Half Yearly Examination</option>
                <option value="yearly">Annual / Yearly Board Exam</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition"
            >
              Add Exam Term
            </button>
          </form>

          {/* Exams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div key={ex.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">{ex.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                      {ex.examType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">Academic Year: {ex.academicYear}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Ready for Marks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
