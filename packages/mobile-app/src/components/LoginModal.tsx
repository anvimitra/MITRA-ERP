import React, { useState, useEffect } from 'react';
import { User, School } from '../types';
import { loginUser, checkServerHealth } from '../api';
import { X, Sparkles, Lock, Mail, Building2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  currentSchool?: School | null;
  onClose: () => void;
  onLoginSuccess: (user: User, school: School, linkedStudents?: any[]) => void;
}

export const LoginModal: React.FC<Props> = ({ currentSchool, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState(currentSchool?.code || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server health state
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [checkingServer, setCheckingServer] = useState(false);

  const verifyServer = async () => {
    setCheckingServer(true);
    try {
      const res = await checkServerHealth();
      setServerOnline(res.online);
    } catch {
      setServerOnline(false);
    } finally {
      setCheckingServer(false);
    }
  };

  useEffect(() => {
    verifyServer();
  }, []);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(email, password, schoolCode);
      onLoginSuccess(res.user, res.school, res.linkedStudents);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials or school code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">MITRA-ERP Institutional Sign In</h3>
            <p className="text-xs text-slate-500">Parent, Teacher, Principal & Bus Driver Portal</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional Cloud Security Status Banner */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2 truncate">
            {checkingServer ? (
              <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin flex-shrink-0" />
            ) : serverOnline === true ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
            <div className="truncate">
              <span className="font-bold text-slate-800 block">
                {checkingServer
                  ? 'Connecting to Institutional Cloud...'
                  : serverOnline
                  ? 'Cloud Core: Active & Encrypted'
                  : 'Cloud Core: Connecting...'}
              </span>
              <span className="text-slate-400 text-[10px] block truncate">
                256-Bit SSL • Multi-Tenant Isolated
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            <Lock className="w-3 h-3" />
            <span>Secure</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleManualLogin} className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600">School Tenant Code</label>
              <span className="text-[10px] text-slate-400">(Optional for Super Admin)</span>
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                placeholder="e.g. DPA01 or SCH01"
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Official Email or Mobile Number</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. 9876543210 or user@school.edu"
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
                required
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
            className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 mt-2 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Authenticating with ERP Cloud...' : 'Sign In to Mobile ERP'}</span>
          </button>

          <div className="pt-2 text-[10px] text-slate-500 text-center space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-slate-700 font-medium">💡 <strong>Bus Drivers:</strong> Enter your mobile number as Login ID & password generated by Principal.</p>
            <p className="text-slate-500">👨‍👩‍👦 <strong>Parents:</strong> Enter mobile number & auto-password given upon student admission.</p>
          </div>
        </form>
      </div>
    </div>
  );
};
