import React from 'react';
import { User, School, Role } from '../types';
import { LogOut, Bell, School as SchoolIcon, Users, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';

interface Props {
  user: User;
  school: School | null;
  onLogout: () => void;
  onSwitchPersona?: (email: string, password: string) => void;
  linkedStudents?: any[];
  selectedStudentId?: string;
  onSelectStudent?: (studentId: string) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<Props> = ({
  user,
  school,
  onLogout,
  onSwitchPersona,
  linkedStudents = [],
  selectedStudentId,
  onSelectStudent,
  unreadCount = 2,
}) => {
  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">SUPER ADMIN</span>;
      case 'principal':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">PRINCIPAL & BURSAR</span>;
      case 'teacher':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">TEACHER</span>;
      case 'accountant':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">PRINCIPAL & ACCOUNTS</span>;
      case 'parent':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">PARENT</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">USER</span>;
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* School Branding */}
        <div className="flex items-center gap-3">
          {school?.logoUrl ? (
            <img src={school.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              <SchoolIcon size={22} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
                {school ? school.name : 'ANVIMITRA-ERP'}
              </h1>
              {school && (
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-mono rounded font-bold">
                  {school.code}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Cloudflare Edge Architecture • Single Multi-Role Platform</p>
          </div>
        </div>

        {/* Persona Switcher & User Controls */}
        <div className="flex items-center gap-3">
          {/* Multi-Child Switcher for Parents */}
          {user.role === 'parent' && linkedStudents.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-amber-800 font-bold">Ward:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => onSelectStudent && onSelectStudent(e.target.value)}
                className="bg-transparent font-semibold text-amber-950 focus:outline-none cursor-pointer"
              >
                {linkedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName || ''} (Class {s.classId}-{s.sectionId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Details */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(user.role)}
              <button
                onClick={onLogout}
                title="Secure Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                <LogOut size={13} />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
