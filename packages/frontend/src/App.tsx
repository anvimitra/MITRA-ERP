import React, { useState, useEffect } from 'react';
import { ApiService } from './api';
import { User, School, Role, ReportCardData } from './types';
import { Navbar } from './components/Navbar';
import { SuperAdminPortal } from './portals/SuperAdminPortal';
import { PrincipalPortal } from './portals/PrincipalPortal';
import { TeacherPortal } from './portals/TeacherPortal';
import { AccountantPortal } from './portals/AccountantPortal';
import { ParentPortal } from './portals/ParentPortal';
import { StudentPortal } from './portals/StudentPortal';
import { MobileAppSimulator } from './components/MobileAppSimulator';
import { ReportCardModal } from './components/ReportCardModal';
import { Smartphone, School as SchoolIcon, ShieldCheck, LogIn, Key, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showMobileSim, setShowMobileSim] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSchoolCode, setLoginSchoolCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    const initAuth = async () => {
      const token = ApiService.getToken();
      if (token) {
        try {
          const res = await ApiService.getMe();
          setUser(res.user);
          setSchool(res.school);
          setLinkedStudents(res.linkedStudents || []);
          if (res.linkedStudents?.length > 0) {
            setSelectedStudentId(res.linkedStudents[0].id);
          }
        } catch (err) {
          ApiService.setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await ApiService.login(email, password, loginSchoolCode);
      setUser(res.user);
      setSchool(res.school);
      setLinkedStudents(res.linkedStudents || []);
      if (res.linkedStudents?.length > 0) {
        setSelectedStudentId(res.linkedStudents[0].id);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    ApiService.setToken(null);
    setUser(null);
    setSchool(null);
  };

  const handleOpenQuickReportCard = async () => {
    try {
      if (!selectedStudentId) return;
      const res = await ApiService.getReportCard(selectedStudentId, 'exam-sa1-term1');
      if (res.reportCard) {
        setReportCardData(res.reportCard);
      }
    } catch (e: any) {
      alert('Error loading report card: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white text-xs">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-bold text-sm tracking-wide">Connecting to ANVIMITRA-ERP Cloud Core...</span>
      </div>
    );
  }

  // Not logged in -> Show Professional Secure Login Page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-500/25 mb-3 font-black text-2xl">
              <SchoolIcon size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">ANVIMITRA-ERP</h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-Tenant Cloud ERP & Academic Management System
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-400 mb-1">School Identification Code</label>
              <input
                type="text"
                placeholder="e.g. DPA01 or SCH01"
                value={loginSchoolCode}
                onChange={(e) => setLoginSchoolCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">Official Email or Mobile Number</label>
              <input
                type="text"
                required
                placeholder="e.g. principal@school.edu or 9876543210"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">Security Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>{loggingIn ? 'Authenticating with School Core...' : 'Secure Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Professional Navbar */}
      <Navbar
        user={user}
        school={school}
        onLogout={handleLogout}
        linkedStudents={linkedStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
      />

      {/* Main Content Rendered strictly based on Authenticated Role */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {user.role === 'super_admin' && <SuperAdminPortal />}
        {(user.role === 'principal' || user.role === 'accountant') && <PrincipalPortal userRole={user.role} school={school} />}
        {user.role === 'teacher' && <TeacherPortal user={user} />}
        {user.role === 'parent' && <ParentPortal user={user} studentId={selectedStudentId} />}
        {user.role === 'student' && <StudentPortal user={user} />}
      </main>

      {/* Floating Action: Open Mobile App Simulator */}
      <div className="no-print fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowMobileSim(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-blue-500/40 border border-white/20 transition transform hover:-translate-y-0.5"
        >
          <Smartphone size={16} />
          <span>Launch School Mobile App Simulator</span>
        </button>
      </div>

      {/* Mobile App Simulator Modal */}
      {showMobileSim && (
        <MobileAppSimulator
          school={school}
          user={user}
          onClose={() => setShowMobileSim(false)}
          onOpenReportCard={handleOpenQuickReportCard}
        />
      )}

      {/* Report Card Viewer Modal */}
      {reportCardData && (
        <ReportCardModal data={reportCardData} onClose={() => setReportCardData(null)} />
      )}
    </div>
  );
};
