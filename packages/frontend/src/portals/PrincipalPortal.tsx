import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import {
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Award,
  Plus,
  Check,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserPlus,
  Sparkles,
  X,
} from 'lucide-react';

export const PrincipalPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'faculty' | 'class-teachers' | 'subject-allocations' | 'exams'
  >('students');

  const [classesData, setClassesData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Student search & filter
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Student Add/Edit Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({
    admissionNo: '',
    rollNo: '',
    firstName: '',
    lastName: '',
    classId: '',
    sectionId: '',
    gender: 'Male',
    dob: '2012-05-15',
    bloodGroup: 'B+',
    fatherName: '',
    motherName: '',
    primaryPhone: '',
    email: '',
    address: '',
  });

  // Faculty Add/Edit Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    password: '',
  });

  // Class Teacher assignment state
  const [ctClassId, setCtClassId] = useState('');
  const [ctSectionId, setCtSectionId] = useState('');
  const [ctTeacherId, setCtTeacherId] = useState('');

  // Subject assignment state
  const [subTeacherId, setSubTeacherId] = useState('');
  const [subClassId, setSubClassId] = useState('');
  const [subSectionId, setSubSectionId] = useState('');
  const [subSubjectId, setSubSubjectId] = useState('');

  // Exam state
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('sa2');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, sData, stData, eData] = await Promise.all([
        ApiService.getClasses(),
        ApiService.getStudents(),
        ApiService.getTeachers(),
        ApiService.getExams(),
      ]);

      setClassesData(cData);
      setStudents(sData.students || []);
      setStaffList(stData.staff || []);
      setExams(eData.exams || []);

      if (cData?.classes?.length > 0) {
        setCtClassId(cData.classes[0].id);
        setSubClassId(cData.classes[0].id);
      }
      if (cData?.sections?.length > 0) {
        setCtSectionId(cData.sections[0].id);
        setSubSectionId(cData.sections[0].id);
      }
      if (stData?.staff?.length > 0) {
        const teachers = stData.staff.filter((t: any) => t.role === 'teacher');
        if (teachers.length > 0) {
          setCtTeacherId(teachers[0].id);
          setSubTeacherId(teachers[0].id);
        }
      }
      if (cData?.subjects?.length > 0) {
        setSubSubjectId(cData.subjects[0].id);
      }
    } catch (err) {
      console.error('Error loading principal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Student Handlers ---
  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      admissionNo: `ADM-${Date.now().toString().slice(-4)}`,
      rollNo: String(students.length + 1),
      firstName: '',
      lastName: '',
      classId: classesData?.classes?.[0]?.id || '',
      sectionId: classesData?.sections?.[0]?.id || '',
      gender: 'Male',
      dob: '2012-05-15',
      bloodGroup: 'B+',
      fatherName: '',
      motherName: '',
      primaryPhone: '',
      email: '',
      address: '',
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (s: any) => {
    setEditingStudentId(s.id);
    setStudentForm({
      admissionNo: s.admissionNo || '',
      rollNo: s.rollNo !== null ? String(s.rollNo) : '',
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      classId: s.classId || classesData?.classes?.[0]?.id || '',
      sectionId: s.sectionId || classesData?.sections?.[0]?.id || '',
      gender: s.gender || 'Male',
      dob: s.dob || '',
      bloodGroup: s.bloodGroup || 'B+',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      primaryPhone: s.primaryPhone || '',
      email: s.email || '',
      address: s.address || '',
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await ApiService.updateStudent(editingStudentId, studentForm);
        alert('✅ Student details updated successfully!');
      } else {
        await ApiService.createStudent(studentForm);
        alert('✅ New Student admitted successfully!');
      }
      setShowStudentModal(false);
      const res = await ApiService.getStudents();
      setStudents(res.students || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}" from the system?`)) return;
    try {
      await ApiService.deleteStudent(id);
      alert('✅ Student record deleted.');
      const res = await ApiService.getStudents();
      setStudents(res.students || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- Faculty Handlers ---
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createTeacher(staffForm);
      alert('✅ Faculty/Staff member registered successfully!');
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', phone: '', role: 'teacher', password: '' });
      const res = await ApiService.getTeachers();
      setStaffList(res.staff || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeactivateStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate staff member "${name}"?`)) return;
    try {
      await ApiService.deleteTeacher(id);
      alert('✅ Staff deactivated.');
      const res = await ApiService.getTeachers();
      setStaffList(res.staff || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- Assignments & Exams ---
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
    if (!newExamName) return;
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

  // Filter students list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      studentSearch === '' ||
      s.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.admissionNo?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = selectedClassFilter === '' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Principal Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wide">
              Principal Administration Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Live Database Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">School Academic & Faculty Operations</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Real-time multi-tenant school ERP: Manage student admissions, faculty roster, attendance authorizations, subject allocations, and examinations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/80 backdrop-blur p-1.5 rounded-2xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap size={15} />
            <span>Students ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'faculty' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users size={15} />
            <span>Faculty ({staffList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('class-teachers')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'class-teachers' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck size={15} />
            <span>Class Teachers</span>
          </button>
          <button
            onClick={() => setActiveTab('subject-allocations')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'subject-allocations' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen size={15} />
            <span>Subject Allocations</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'exams' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award size={15} />
            <span>Exams</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Overview</span>
          </button>
        </div>
      </div>

      {/* ================= TAB: STUDENTS (LIVE CRUD) ================= */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="text-blue-600" size={24} />
                Student Admission & Records Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add new students, update contact/academic details, or deactivate records. All changes save directly to the school database.
              </p>
            </div>

            <button
              onClick={handleOpenAddStudent}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <UserPlus size={16} />
              <span>Admit New Student</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Classes</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class & Section</th>
                  <th className="px-4 py-3">Parent / Guardian</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No students found matching current search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.admissionNo}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{s.rollNo || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[11px]">
                          {s.className} - {s.sectionName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {s.fatherName || s.motherName || <span className="text-slate-400 italic">Not set</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {s.primaryPhone || <span className="text-slate-400 italic">Not set</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] border border-rose-200">
                          {s.bloodGroup || 'O+'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            title="Edit Student"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, `${s.firstName} ${s.lastName}`)}
                            title="Delete Student"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: FACULTY & STAFF ================= */}
      {activeTab === 'faculty' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-600" size={24} />
                Faculty & Staff Administration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register teachers and administrative staff, assign login credentials, and manage active status.
              </p>
            </div>

            <button
              onClick={() => setShowStaffModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              <UserPlus size={16} />
              <span>Register Faculty / Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{st.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border uppercase ${
                          st.role === 'principal'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : st.role === 'teacher'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{st.email}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{st.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {st.isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {st.role !== 'principal' && st.isActive ? (
                        <button
                          onClick={() => handleDeactivateStaff(st.id, st.name)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 p-1"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: CLASS TEACHER ASSIGNMENT ================= */}
      {activeTab === 'class-teachers' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Designate Class Teacher for Attendance</h2>
            <p className="text-xs text-slate-500">
              Only designated Class Teachers hold security authorization to mark, modify, and dispatch student attendance notifications.
            </p>
          </div>

          <form
            onSubmit={handleAssignClassTeacher}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Class</label>
              <select
                value={ctClassId}
                onChange={(e) => setCtClassId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
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
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Faculty</label>
              <select
                value={ctTeacherId}
                onChange={(e) => setCtTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.teachers?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Save Allocation</span>
              </button>
            </div>
          </form>

          {/* Current Allocations Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-wide">Current Class Teacher Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classesData?.classTeacherAssignments?.map((a: any) => {
                const c = classesData.classes?.find((x: any) => x.id === a.classId);
                const s = classesData.sections?.find((x: any) => x.id === a.sectionId);
                const t = classesData.teachers?.find((x: any) => x.id === a.teacherId);
                return (
                  <div key={a.id} className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-blue-950 text-sm">
                        {c?.name || a.classId} - Section {s?.name || a.sectionId}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        Class Teacher: <span className="font-bold text-slate-900">{t?.name || a.teacherId}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                      Authorized
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: SUBJECT ALLOCATIONS ================= */}
      {activeTab === 'subject-allocations' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Allocate Subject Teachers for Examination Grading</h2>
            <p className="text-xs text-slate-500">
              Only designated Subject Teachers hold security authorization to enter and submit student marks for evaluation cycles.
            </p>
          </div>

          <form
            onSubmit={handleAssignSubjectTeacher}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class</label>
              <select
                value={subClassId}
                onChange={(e) => setSubClassId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
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
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
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
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Teacher</label>
              <select
                value={subTeacherId}
                onChange={(e) => setSubTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                {classesData?.teachers?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Authorize</span>
              </button>
            </div>
          </form>

          {/* Current Subject Allocations */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-wide">Active Subject Allocations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classesData?.subjectAllocations?.map((a: any) => {
                const c = classesData.classes?.find((x: any) => x.id === a.classId);
                const s = classesData.sections?.find((x: any) => x.id === a.sectionId);
                const sub = classesData.subjects?.find((x: any) => x.id === a.subjectId);
                const t = classesData.teachers?.find((x: any) => x.id === a.teacherId);
                return (
                  <div key={a.id} className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-indigo-950 text-sm">{sub?.name || a.subjectId}</div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        {c?.name} ({s?.name}) • Faculty:{' '}
                        <span className="font-bold text-slate-900">{t?.name || a.teacherId}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px]">
                      Marks Ready
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: EXAMS ================= */}
      {activeTab === 'exams' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Examination Cycles & Schedules</h2>
            <p className="text-xs text-slate-500">
              Configure Summative & Formative evaluation periods (Weekly, SA-1, SA-2, Annual).
            </p>
          </div>

          <form
            onSubmit={handleCreateExam}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
          >
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Exam Cycle Title</label>
              <input
                type="text"
                placeholder="e.g. Summative Assessment 2 (Term 2)"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Evaluation Category</label>
              <select
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
              >
                <option value="weekly">Weekly Assessment</option>
                <option value="sa1">SA-1 (Term 1)</option>
                <option value="sa2">SA-2 (Term 2)</option>
                <option value="sa3">SA-3 (Unit Test)</option>
                <option value="half_yearly">Half Yearly Examination</option>
                <option value="yearly">Annual Examination</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Publish Schedule</span>
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exams.map((ex) => (
              <div key={ex.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
                    {ex.examType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">2026-2027</span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">{ex.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{students.length} Students</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Active in Database</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Faculty & Staff</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{staffList.length} Roster</div>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">Teaching & Accounts</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Classes Configured</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{classesData?.classes?.length || 0} Classes</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Multi-Section Enabled</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Exams Scheduled</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{exams.length} Cycles</div>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">Academic Year 2026-27</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIT / EDIT STUDENT ================= */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowStudentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingStudentId ? 'Edit Student Record' : 'Student Admission Form'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter academic enrollment and parent contact details. Saved directly to the school database.
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.admissionNo}
                    onChange={(e) => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll No</label>
                  <input
                    type="number"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={studentForm.bloodGroup}
                    onChange={(e) => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    value={studentForm.sectionId}
                    onChange={(e) => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Parent / Guardian Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={studentForm.fatherName}
                      onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={studentForm.motherName}
                      onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={studentForm.primaryPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, primaryPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition"
                >
                  {editingStudentId ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FACULTY / STAFF ================= */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowStaffModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">Register Faculty / Staff</h3>
            <p className="text-xs text-slate-500 mb-5">
              Create a login account with authorized permissions for teaching or administration.
            </p>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Role *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="teacher">Teacher / Faculty</option>
                  <option value="accountant">Accountant / Cashier</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@school.edu"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
