import React from 'react';
import { Home, CalendarCheck, FileText, CreditCard, UserCheck, Shield } from 'lucide-react';
import { Role } from '../types';

export type TabType = 'home' | 'attendance' | 'report' | 'fees' | 'teacher' | 'principal';

interface Props {
  activeTab: TabType;
  role: Role;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<Props> = ({ activeTab, role, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex justify-around items-center">
        {/* Home Tab */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'home' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Attendance Tab */}
        <button
          onClick={() => onChangeTab('attendance')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'attendance' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className={`w-5 h-5 ${activeTab === 'attendance' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Attendance</span>
        </button>

        {/* Report Card Tab */}
        <button
          onClick={() => onChangeTab('report')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'report' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className={`w-5 h-5 ${activeTab === 'report' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Reports</span>
        </button>

        {/* Fees Tab */}
        <button
          onClick={() => onChangeTab('fees')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'fees' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className={`w-5 h-5 ${activeTab === 'fees' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Fees</span>
        </button>

        {/* Role-specific Tab (Teacher or Principal) */}
        {role === 'teacher' && (
          <button
            onClick={() => onChangeTab('teacher')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
              activeTab === 'teacher' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className={`w-5 h-5 ${activeTab === 'teacher' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Teacher Desk</span>
          </button>
        )}

        {role === 'principal' && (
          <button
            onClick={() => onChangeTab('principal')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
              activeTab === 'principal' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className={`w-5 h-5 ${activeTab === 'principal' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};
