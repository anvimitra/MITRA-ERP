import React, { useState } from 'react';
import { User, School } from '../types';
import { loginUser } from '../api';
import { X, Sparkles, UserCheck, Shield, Users, Lock, Mail, Building2 } from 'lucide-react';

interface Props {
  currentSchool: School;
  onClose: () => void;
  onLoginSuccess: (user: User, school: School) => void;
}

export const LoginModal: React.FC<Props> = ({ currentSchool, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState(currentSchool.code || 'LSK01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(email, password, schoolCode);
      onLoginSuccess(res.user, res.school);
      onClose();
    } catch {
      setError('Invalid credentials or school code');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (roleEmail: string) => {
    setLoading(true);
    try {
      const res = await loginUser(roleEmail, 'dummy123', 'LSK01');
      onLoginSuccess(res.user, res.school);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">ERP Persona Login</h3>
            <p className="text-xs text-slate-500">Sign in to LSK Academy or switch role</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        {/* 1-Click Demo Personas */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 tracking-wider">
            1-Click Instant Persona Sign-In
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickPersona('parent.aryan@gmail.com')}
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-purple-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-950">Parent (Aryan)</p>
                <p className="text-[10px] text-purple-600">App Active User</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickPersona('parent.zara@gmail.com')}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">Parent (Zara)</p>
                <p className="text-[10px] text-amber-600">SMS Fallback Target</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickPersona('rani@lskacademy.edu')}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">Teacher (Rani)</p>
                <p className="text-[10px] text-indigo-600">Class 8-A Teacher</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickPersona('principal@lskacademy.edu')}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition flex items-center space-x-2"
            >
              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">Principal</p>
                <p className="text-[10px] text-emerald-600">Executive Desk</p>
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">or sign in with credentials</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={handleManualLogin} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">School Tenant Code</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                placeholder="LSK01"
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent.aryan@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Mobile ERP'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
