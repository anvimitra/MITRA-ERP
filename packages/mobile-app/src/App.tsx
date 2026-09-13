import React, { useState, useEffect } from 'react';
import { School, User, Student, AttendanceRecord, FeeItem, NotificationItem, AppUpdateInfo, ExamReport } from './types';
import {
  fetchSchoolByCode,
  checkAppUpdate,
  fetchLiveNotices,
  fetchMe,
  fetchLiveStudents,
  fetchLiveClasses,
  fetchStudentAttendanceHistory,
  fetchStudentFeesLedger,
  fetchStudentExamReport,
  setMobileToken,
} from './api';
import { SchoolHeader } from './components/SchoolHeader';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { ParentView } from './components/ParentView';
import { TeacherView } from './components/TeacherView';
import { PrincipalView } from './components/PrincipalView';
import { AttendanceView } from './components/AttendanceView';
import { ReportCardView } from './components/ReportCardView';
import { FeesView } from './components/FeesView';
import { NotificationsView } from './components/NotificationsView';
import { LoginModal } from './components/LoginModal';
import { AutoUpdateBanner } from './components/AutoUpdateBanner';
import { DigitalIdCardModal } from './components/DigitalIdCardModal';
import { LogIn, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [school, setSchool] = useState<School | null>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_school');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [student, setStudent] = useState<Student | null>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_student');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_attendance');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [fees, setFees] = useState<FeeItem[]>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_fees');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [latestReport, setLatestReport] = useState<ExamReport | null>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_report');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState<number>(0);
  const [classesCount, setClassesCount] = useState<number>(12);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refreshUserData = async (currentUser: User, currentStudent?: Student) => {
    try {
      if (currentUser.role === 'principal' || currentUser.role === 'accountant' || currentUser.role === 'teacher') {
        const [stuList, classesData] = await Promise.all([
          fetchLiveStudents(),
          fetchLiveClasses(),
        ]);
        setEnrolledStudentsCount(stuList?.length || 0);
        setClassesCount(classesData?.classes?.length || 12);
      }

      const stu = currentStudent || student;
      if (stu?.id) {
        localStorage.setItem('anvimitra_cached_student', JSON.stringify(stu));
        const [att, f, rep] = await Promise.all([
          fetchStudentAttendanceHistory(stu.id),
          fetchStudentFeesLedger(stu.id),
          fetchStudentExamReport(stu.id),
        ]);
        if (att && att.length > 0) {
          setAttendance(att);
          localStorage.setItem('anvimitra_cached_attendance', JSON.stringify(att));
        }
        if (f && f.length > 0) {
          setFees(f);
          localStorage.setItem('anvimitra_cached_fees', JSON.stringify(f));
        }
        if (rep) {
          setLatestReport(rep);
          localStorage.setItem('anvimitra_cached_report', JSON.stringify(rep));
        }
      }
    } catch (err) {
      console.warn('Live data sync offline, kept cached state', err);
    }
  };

  useEffect(() => {
    // 1. Verify existing session with ERP
    fetchMe().then(async (res) => {
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('anvimitra_cached_user', JSON.stringify(res.user));
        if (res.school) {
          setSchool(res.school);
          localStorage.setItem('anvimitra_cached_school', JSON.stringify(res.school));
        }
        if (res.linkedStudents && res.linkedStudents.length > 0) {
          setStudent(res.linkedStudents[0]);
          refreshUserData(res.user, res.linkedStudents[0]);
        } else if (res.user.role === 'principal' || res.user.role === 'accountant' || res.user.role === 'teacher') {
          refreshUserData(res.user);
        } else {
          const liveStus = await fetchLiveStudents();
          if (liveStus && liveStus.length > 0) {
            setStudent(liveStus[0]);
            refreshUserData(res.user, liveStus[0]);
          }
        }
      } else {
        const token = localStorage.getItem('anvimitra_mobile_token');
        if (!token) {
          setShowLogin(true);
        }
      }
    }).catch(() => {
      const token = localStorage.getItem('anvimitra_mobile_token');
      if (!token) setShowLogin(true);
    });

    // 2. Real-time Auto-Update Detection
    checkAppUpdate().then((info) => {
      if (info) {
        setUpdateInfo(info);
        setShowUpdateBanner(true);
      }
    });

    // 3. Fetch live notices/circulars from ERP
    fetchLiveNotices().then((liveNotices) => {
      if (liveNotices && liveNotices.length > 0) {
        setNotifications(liveNotices);
      }
    });

    // 4. Background polling for updates every 3 minutes
    const updateTimer = setInterval(() => {
      checkAppUpdate().then((info) => {
        if (info) {
          setUpdateInfo(info);
          setShowUpdateBanner(true);
        }
      });
    }, 3 * 60 * 1000);

    return () => clearInterval(updateTimer);
  }, []);

  const handleManualCheckUpdate = async () => {
    const info = await checkAppUpdate();
    if (info) {
      setUpdateInfo(info);
      setShowUpdateBanner(true);
    } else {
      alert('✓ Your Mobile App is already running the latest version!');
    }
  };

  const handleLoginSuccess = async (newUser: User, newSchool: School, linkedStudents?: any[]) => {
    setUser(newUser);
    setSchool(newSchool);
    localStorage.setItem('anvimitra_cached_user', JSON.stringify(newUser));
    localStorage.setItem('anvimitra_cached_school', JSON.stringify(newSchool));

    if (linkedStudents && linkedStudents.length > 0) {
      setStudent(linkedStudents[0]);
      refreshUserData(newUser, linkedStudents[0]);
    } else {
      const liveStudents = await fetchLiveStudents();
      if (liveStudents && liveStudents.length > 0) {
        setStudent(liveStudents[0]);
        refreshUserData(newUser, liveStudents[0]);
      } else {
        setStudent(null);
        refreshUserData(newUser);
      }
    }

    if (newUser.role === 'teacher') {
      setActiveTab('teacher');
    } else if (newUser.role === 'principal' || newUser.role === 'accountant') {
      setActiveTab('principal');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setMobileToken(null);
    localStorage.removeItem('anvimitra_cached_user');
    localStorage.removeItem('anvimitra_cached_school');
    localStorage.removeItem('anvimitra_cached_student');
    localStorage.removeItem('anvimitra_cached_attendance');
    localStorage.removeItem('anvimitra_cached_fees');
    localStorage.removeItem('anvimitra_cached_report');
    setUser(null);
    setStudent(null);
    setAttendance([]);
    setFees([]);
    setLatestReport(null);
    setShowLogin(true);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-6">
      {/* Smartphone Frame Container */}
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-[844px] bg-slate-50 sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden relative">
        {/* Dynamic School Header */}
        <SchoolHeader
          school={school}
          user={user}
          unreadCount={unreadCount}
          hasUpdate={!!updateInfo}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
          onCheckUpdate={handleManualCheckUpdate}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 overflow-y-auto no-scrollbar">
          {/* Real-Time Auto-Update Alert Banner */}
          {showUpdateBanner && updateInfo && (
            <AutoUpdateBanner
              updateInfo={updateInfo}
              onDismiss={() => setShowUpdateBanner(false)}
            />
          )}

          {showNotifications ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 mb-2 flex items-center space-x-1"
              >
                <span>← Back to Dashboard</span>
              </button>
              <NotificationsView notifications={notifications} onMarkAllRead={handleMarkAllRead} />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center text-purple-700 mb-4 shadow-inner">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-slate-800">Welcome to MITRA-ERP</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                Log in with your registered Official Email or Mobile Number to access your institutional dashboard.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-600/30 active:scale-98 transition flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to School ERP</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <ParentView
                  student={student}
                  school={school}
                  attendance={attendance}
                  fees={fees}
                  latestReport={latestReport}
                  onChangeTab={setActiveTab}
                  onOpenIdCard={() => setShowIdCard(true)}
                  onCheckUpdate={handleManualCheckUpdate}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView student={student} attendance={attendance} />
              )}

              {activeTab === 'report' && (
                <ReportCardView student={student} school={school} />
              )}

              {activeTab === 'fees' && (
                <FeesView student={student} />
              )}

              {activeTab === 'teacher' && user?.role === 'teacher' && (
                <TeacherView teacher={user} />
              )}

              {activeTab === 'principal' && (user?.role === 'principal' || user?.role === 'accountant') && (
                <PrincipalView
                  principal={user}
                  school={school}
                  studentCount={enrolledStudentsCount}
                  classCount={classesCount}
                />
              )}
            </>
          )}
        </main>

        {/* Persistent Mobile Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          role={user?.role || 'parent'}
          onChangeTab={(tab) => {
            setShowNotifications(false);
            setActiveTab(tab);
          }}
        />

        {/* Login / Persona Switcher Modal */}
        {showLogin && (
          <LoginModal
            currentSchool={school}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* Digital Student Identity Card Modal */}
        {showIdCard && student && (
          <DigitalIdCardModal
            student={student}
            school={school}
            onClose={() => setShowIdCard(false)}
          />
        )}
      </div>
    </div>
  );
};
