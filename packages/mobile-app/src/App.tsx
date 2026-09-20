import React, { useState, useEffect } from 'react';
import { School, User, Student, AttendanceRecord, FeeItem, NotificationItem, AppUpdateInfo, ExamReport } from './types';
import {
  fetchSchoolByCode,
  checkAppUpdate,
  fetchLiveNotices,
  fetchUserNotifications,
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
import { SuperAdminView } from './components/SuperAdminView';
import { DriverView } from './components/DriverView';
import { AttendanceView } from './components/AttendanceView';
import { ReportCardView } from './components/ReportCardView';
import { FeesView } from './components/FeesView';
import { NotificationsView } from './components/NotificationsView';
import { LoginModal } from './components/LoginModal';
import { AutoUpdateBanner } from './components/AutoUpdateBanner';
import { DigitalIdCardModal } from './components/DigitalIdCardModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { requestAppNotificationPermission, showSystemNotification, playNotificationSound } from './utils/sound';
import { LogIn, Sparkles, AlertTriangle, BellRing } from 'lucide-react';

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
  const [allLinkedStudents, setAllLinkedStudents] = useState<Student[]>(() => {
    try {
      const cached = localStorage.getItem('anvimitra_cached_linked_students');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
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
  const [showNotifBanner, setShowNotifBanner] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'default';
    }
    return false;
  });

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

        // Set role-appropriate initial tab
        if (res.user.role === 'super_admin') {
          setActiveTab('schools');
        } else if (res.user.role === 'principal' || res.user.role === 'accountant') {
          setActiveTab('overview');
        } else if (res.user.role === 'teacher') {
          setActiveTab('attendance');
        } else if (res.user.role === 'driver') {
          setActiveTab('trip');
        } else {
          setActiveTab('home');
        }

        if (res.user.role === 'parent') {
          if (res.linkedStudents && res.linkedStudents.length > 0) {
            setAllLinkedStudents(res.linkedStudents);
            localStorage.setItem('anvimitra_cached_linked_students', JSON.stringify(res.linkedStudents));
            const currentCachedStu = student || res.linkedStudents[0];
            const matchedCurrent = res.linkedStudents.find((s: any) => s.id === currentCachedStu?.id) || res.linkedStudents[0];
            setStudent(matchedCurrent);
            refreshUserData(res.user, matchedCurrent);
          } else {
            setAllLinkedStudents([]);
            setStudent(null);
            localStorage.removeItem('anvimitra_cached_linked_students');
            refreshUserData(res.user);
          }
        } else if (res.user.role === 'principal' || res.user.role === 'accountant' || res.user.role === 'teacher' || res.user.role === 'super_admin' || res.user.role === 'driver') {
          setAllLinkedStudents([]);
          setStudent(null);
          refreshUserData(res.user);
        } else {
          if (res.linkedStudents && res.linkedStudents.length > 0) {
            setAllLinkedStudents(res.linkedStudents);
            setStudent(res.linkedStudents[0]);
            refreshUserData(res.user, res.linkedStudents[0]);
          } else {
            const liveStus = await fetchLiveStudents();
            if (liveStus && liveStus.length > 0) {
              setAllLinkedStudents(liveStus);
              setStudent(liveStus[0]);
              refreshUserData(res.user, liveStus[0]);
            }
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

    // 3. Fetch live notifications (attendance, fee due, circulars) from ERP
    fetchUserNotifications().then((liveNotifs) => {
      if (liveNotifs && liveNotifs.length > 0) {
        setNotifications(liveNotifs);
        // Play chime and show system lock screen alert for newest unread notification
        const latestUnread = liveNotifs.find((n) => !n.read);
        if (latestUnread) {
          const lastAlertedId = localStorage.getItem('anvimitra_last_alerted_notif');
          if (lastAlertedId !== latestUnread.id) {
            localStorage.setItem('anvimitra_last_alerted_notif', latestUnread.id);
            showSystemNotification(latestUnread.title, latestUnread.message);
          }
        }
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

    if (newUser.role === 'parent') {
      if (linkedStudents && linkedStudents.length > 0) {
        setAllLinkedStudents(linkedStudents);
        localStorage.setItem('anvimitra_cached_linked_students', JSON.stringify(linkedStudents));
        setStudent(linkedStudents[0]);
        refreshUserData(newUser, linkedStudents[0]);
      } else {
        setAllLinkedStudents([]);
        setStudent(null);
        localStorage.removeItem('anvimitra_cached_linked_students');
        refreshUserData(newUser);
      }
    } else if (newUser.role === 'principal' || newUser.role === 'accountant' || newUser.role === 'teacher' || newUser.role === 'super_admin' || newUser.role === 'driver') {
      setAllLinkedStudents([]);
      setStudent(null);
      refreshUserData(newUser);
    } else {
      if (linkedStudents && linkedStudents.length > 0) {
        setAllLinkedStudents(linkedStudents);
        setStudent(linkedStudents[0]);
        refreshUserData(newUser, linkedStudents[0]);
      } else {
        const liveStudents = await fetchLiveStudents();
        if (liveStudents && liveStudents.length > 0) {
          setAllLinkedStudents(liveStudents);
          setStudent(liveStudents[0]);
          refreshUserData(newUser, liveStudents[0]);
        } else {
          setAllLinkedStudents([]);
          setStudent(null);
          refreshUserData(newUser);
        }
      }
    }

    if (newUser.role === 'super_admin') {
      setActiveTab('schools');
    } else if (newUser.role === 'principal' || newUser.role === 'accountant') {
      setActiveTab('overview');
    } else if (newUser.role === 'teacher') {
      setActiveTab('attendance');
    } else if (newUser.role === 'driver') {
      setActiveTab('trip');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setMobileToken(null);
    localStorage.removeItem('anvimitra_cached_user');
    localStorage.removeItem('anvimitra_cached_school');
    localStorage.removeItem('anvimitra_cached_student');
    localStorage.removeItem('anvimitra_cached_linked_students');
    localStorage.removeItem('anvimitra_cached_attendance');
    localStorage.removeItem('anvimitra_cached_fees');
    localStorage.removeItem('anvimitra_cached_report');
    setUser(null);
    setStudent(null);
    setAllLinkedStudents([]);
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
          <ErrorBoundary>
            {/* Real-Time Auto-Update Alert Banner */}
            {showUpdateBanner && updateInfo && (
              <AutoUpdateBanner
                updateInfo={updateInfo}
                onDismiss={() => setShowUpdateBanner(false)}
              />
            )}

            {/* Notification Permission & Sound Prompt Banner */}
            {showNotifBanner && (
              <div className="mb-3 bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 animate-fade-in border border-purple-400/30">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold shrink-0 shadow">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold leading-tight truncate">Enable Live Alerts & Chimes</h4>
                    <p className="text-[10px] text-purple-200 truncate">Get attendance, bus & notices on lock screen with audio</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={async () => {
                      const res = await requestAppNotificationPermission();
                      setShowNotifBanner(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-[11px] shadow transition active:scale-95 whitespace-nowrap"
                  >
                    Allow / अनुमति दें
                  </button>
                  <button
                    onClick={() => setShowNotifBanner(false)}
                    className="p-1 text-purple-300 hover:text-white text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
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
                {/* Services Suspended Notice for School users */}
                {school && school.servicesEnabled === false && user.role !== 'super_admin' && (
                  <div className="mb-3 bg-rose-50 border border-rose-300 rounded-2xl p-3.5 shadow-sm text-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                        Services Suspended
                      </span>
                    </div>
                    <p className="text-xs font-bold text-rose-950">
                      ERP Services are Temporarily Suspended
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Super Admin ne is school ki services temporarily disable kar di hain. Aap dashboard dekh sakte hain lekin koi naya record add ya edit nahi kar sakte. Services reactivate karane ke liye Super Admin se sampark karein.
                    </p>
                  </div>
                )}

                {user.role === 'driver' ? (
                  <DriverView driver={user} school={school} />
                ) : user.role === 'super_admin' ? (
                  <SuperAdminView
                    user={user}
                    onUpdateUser={setUser}
                    activeSubTab={(activeTab === 'add_school' || activeTab === 'system') ? activeTab : 'schools'}
                    onSubTabChange={(t) => setActiveTab(t as TabType)}
                  />
                ) : user.role === 'principal' || user.role === 'accountant' ? (
                <PrincipalView
                  principal={user}
                  school={
                    school || {
                      id: user.schoolId || 'school-1',
                      name: 'School',
                      code: 'SCH',
                      domain: '',
                      logoUrl: '',
                      primaryColor: '#2563eb',
                      secondaryColor: '#1e40af',
                    }
                  }
                  activeSubTab={
                    activeTab === 'students' || activeTab === 'parents' || activeTab === 'staff' || activeTab === 'fees' || activeTab === 'operations'
                      ? activeTab
                      : 'overview'
                  }
                  onSubTabChange={(t) => setActiveTab(t as TabType)}
                />
              ) : user.role === 'teacher' ? (
                <TeacherView
                  teacher={user}
                  activeSubTab={
                    activeTab === 'marks' || activeTab === 'leaves' || activeTab === 'notices'
                      ? activeTab
                      : 'attendance'
                  }
                  onSubTabChange={(t) => setActiveTab(t as TabType)}
                />
              ) : (
                <>
                  {/* Multi-Child Switcher Banner across all tabs */}
                  {allLinkedStudents.length > 1 && (
                    <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-3 shadow-md mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black tracking-tight">Active Ward:</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        {allLinkedStudents.map((child) => {
                          const isSelected = child.id === student?.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                setStudent(child);
                                localStorage.setItem('anvimitra_cached_student', JSON.stringify(child));
                                if (user) refreshUserData(user, child);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                                isSelected
                                  ? 'bg-amber-400 text-purple-950 shadow-sm scale-105'
                                  : 'bg-white/10 hover:bg-white/20 text-purple-100'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">
                                {child.firstName[0]}
                              </span>
                              <span>{child.firstName}</span>
                              <span className="text-[10px] opacity-75 font-mono">({child.className})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'home' && (
                    <ParentView
                      student={student}
                      school={school}
                      attendance={attendance}
                      fees={fees}
                      latestReport={latestReport}
                      linkedStudents={allLinkedStudents}
                      onSelectStudent={(child) => {
                        setStudent(child);
                        localStorage.setItem('anvimitra_cached_student', JSON.stringify(child));
                        if (user) refreshUserData(user, child);
                      }}
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
                </>
              )}
            </>
          )}
          </ErrorBoundary>
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
