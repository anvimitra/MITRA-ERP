import React from 'react';
import {
  Home,
  CalendarCheck,
  FileText,
  CreditCard,
  UserCheck,
  Shield,
  Users,
  Briefcase,
  Radio,
  Building2,
  PlusCircle,
  Server,
  BookOpen,
  Layers,
  Bus,
  ClipboardList,
} from 'lucide-react';
import { Role } from '../types';

export type TabType =
  | 'home'
  | 'attendance'
  | 'report'
  | 'fees'
  | 'teacher'
  | 'principal'
  | 'overview'
  | 'students'
  | 'parents'
  | 'staff'
  | 'operations'
  | 'marks'
  | 'homework'
  | 'leaves'
  | 'notices'
  | 'schools'
  | 'add_school'
  | 'system'
  | 'trip';

interface Props {
  activeTab: TabType;
  role: Role;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<Props> = ({ activeTab, role, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex justify-around items-center">
        {/* 1. SUPER ADMIN NAVIGATION */}
        {role === 'super_admin' && (
          <>
            <button
              onClick={() => onChangeTab('schools')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'schools' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className={`w-5 h-5 ${activeTab === 'schools' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Schools</span>
            </button>

            <button
              onClick={() => onChangeTab('add_school')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'add_school' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className={`w-5 h-5 ${activeTab === 'add_school' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">+ School</span>
            </button>

            <button
              onClick={() => onChangeTab('system')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'system' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Server className={`w-5 h-5 ${activeTab === 'system' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Cloud ERP</span>
            </button>
          </>
        )}

        {/* 2. PRINCIPAL & ACCOUNTANT NAVIGATION */}
        {(role === 'principal' || role === 'accountant') && (
          <>
            <button
              onClick={() => onChangeTab('overview')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'overview' || activeTab === 'principal' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className={`w-5 h-5 ${activeTab === 'overview' || activeTab === 'principal' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Dashboard</span>
            </button>

            <button
              onClick={() => onChangeTab('students')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'students' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'students' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Students</span>
            </button>

            <button
              onClick={() => onChangeTab('parents')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'parents' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className={`w-5 h-5 ${activeTab === 'parents' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Parents</span>
            </button>

            <button
              onClick={() => onChangeTab('staff')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'staff' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className={`w-5 h-5 ${activeTab === 'staff' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Staff</span>
            </button>

            <button
              onClick={() => onChangeTab('fees')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'fees' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${activeTab === 'fees' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Fees</span>
            </button>

            <button
              onClick={() => onChangeTab('operations')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                activeTab === 'operations' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Radio className={`w-5 h-5 ${activeTab === 'operations' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] mt-0.5">Circulars</span>
            </button>
          </>
        )}

        {/* 3. TEACHER NAVIGATION */}
        {role === 'teacher' && (
          <>
            <button
              onClick={() => onChangeTab('attendance')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'attendance' || activeTab === 'teacher' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarCheck className={`w-5 h-5 ${activeTab === 'attendance' || activeTab === 'teacher' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Attendance</span>
            </button>

            <button
              onClick={() => onChangeTab('marks')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                activeTab === 'marks' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === 'marks' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Marks</span>
            </button>

            <button
              onClick={() => onChangeTab('homework')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                activeTab === 'homework' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className={`w-5 h-5 ${activeTab === 'homework' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Homework</span>
            </button>

            <button
              onClick={() => onChangeTab('leaves')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                activeTab === 'leaves' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className={`w-5 h-5 ${activeTab === 'leaves' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Leaves</span>
            </button>

            <button
              onClick={() => onChangeTab('notices')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'notices' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Radio className={`w-5 h-5 ${activeTab === 'notices' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Circulars</span>
            </button>
          </>
        )}

        {/* 4. PARENT & STUDENT NAVIGATION */}
        {(role === 'parent' || role === 'student') && (
          <>
            <button
              onClick={() => onChangeTab('home')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'home' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Home</span>
            </button>

            <button
              onClick={() => onChangeTab('attendance')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'attendance' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarCheck className={`w-5 h-5 ${activeTab === 'attendance' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Attendance</span>
            </button>

            <button
              onClick={() => onChangeTab('report')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'report' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'report' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Reports</span>
            </button>

            <button
              onClick={() => onChangeTab('fees')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'fees' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${activeTab === 'fees' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">Fees</span>
            </button>
          </>
        )}

        {/* 5. DRIVER NAVIGATION */}
        {role === 'driver' && (
          <button
            onClick={() => onChangeTab('trip')}
            className={`flex flex-col items-center py-1 px-6 rounded-2xl transition ${
              activeTab === 'trip' ? 'text-amber-600 font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bus className={`w-6 h-6 ${activeTab === 'trip' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Live Bus Trip</span>
          </button>
        )}
      </div>
    </nav>
  );
};
