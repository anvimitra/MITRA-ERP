import React, { useState, useEffect } from 'react';
import { School, User, Student, AttendanceRecord, FeeItem, NotificationItem, AppUpdateInfo } from './types';
import {
  LSK_SCHOOL_DEFAULT,
  DEFAULT_STUDENT,
  DEFAULT_STUDENTS_LIST,
  MOCK_ATTENDANCE,
  MOCK_FEES,
  MOCK_REPORTS,
  MOCK_NOTIFICATIONS,
  fetchSchoolByCode,
  checkAppUpdate,
  fetchLiveNotices,
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

export const App: React.FC = () => {
  const [school, setSchool] = useState<School>(LSK_SCHOOL_DEFAULT);
  const [user, setUser] = useState<User | null>({
    id: 'user-parent-aryan-lsk',
    schoolId: 'school-lsk-01',
    role: 'parent',
    name: 'Rohit Mishra (Aryan\'s Father)',
    email: 'parent.aryan@gmail.com',
    phone: '+91 98333 44556',
    appInstalled: 1,
  });

  const [student, setStudent] = useState<Student>(DEFAULT_STUDENT);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // 1. Attempt to load fresh school branding on load
    fetchSchoolByCode('LSK01').then((res) => {
      if (res) setSchool(res);
    });

    // 2. Real-time Auto-Update Detection
    checkAppUpdate().then((info) => {
      if (info) {
        setUpdateInfo(info);
        setShowUpdateBanner(true);
      }
    });

    // 3. Fetch live notices/circulars
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
      alert('✓ Your Mobile App is already running the latest version (v1.2.0)!');
    }
  };

  const handleLoginSuccess = (newUser: User, newSchool: School) => {
    setUser(newUser);
    setSchool(newSchool);

    if (newUser.role === 'teacher') {
      setActiveTab('teacher');
    } else if (newUser.role === 'principal') {
      setActiveTab('principal');
    } else {
      // If logging in as Zara's parent
      if (newUser.email.includes('zara')) {
        const zaraStu = DEFAULT_STUDENTS_LIST.find((s) => s.id === 'lsk-stu-zara-02');
        if (zaraStu) setStudent(zaraStu);
      } else {
        setStudent(DEFAULT_STUDENT);
      }
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
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
          ) : (
            <>
              {activeTab === 'home' && (
                <ParentView
                  student={student}
                  attendance={MOCK_ATTENDANCE}
                  fees={MOCK_FEES}
                  latestReport={MOCK_REPORTS['sa1']}
                  onChangeTab={setActiveTab}
                  onOpenIdCard={() => setShowIdCard(true)}
                  onCheckUpdate={handleManualCheckUpdate}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView student={student} attendance={MOCK_ATTENDANCE} />
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

              {activeTab === 'principal' && user?.role === 'principal' && (
                <PrincipalView principal={user} school={school} />
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
        {showIdCard && (
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
