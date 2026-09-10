import React from 'react';
import { School, User } from '../types';
import { Bell, Sparkles, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  school: School;
  user: User | null;
  unreadCount: number;
  hasUpdate?: boolean;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onCheckUpdate?: () => void;
}

export const SchoolHeader: React.FC<Props> = ({
  school,
  user,
  unreadCount,
  hasUpdate,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  onCheckUpdate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white shadow-lg pt-safe">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* School Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
            <img
              src={school.logoUrl || '/school-icon.svg'}
              alt={school.name}
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base leading-tight tracking-tight text-white">{school.name}</h1>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-purple-950">
                {school.code}
              </span>
            </div>
            <p className="text-xs text-purple-200 flex items-center space-x-1">
              <span>Smart ERP Mobile</span>
              <span>•</span>
              <span className="capitalize font-medium text-emerald-300">
                {user ? `${user.role} mode` : 'Guest'}
              </span>
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2">
          {onCheckUpdate && (
            <button
              onClick={onCheckUpdate}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition active:scale-95 text-white"
              title="Check for App Updates"
            >
              <RefreshCw className={`w-4 h-4 text-purple-200 ${hasUpdate ? 'text-amber-300 animate-spin' : ''}`} />
              {hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
              )}
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition active:scale-95 text-white"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 transition active:scale-95 text-purple-100 hover:text-white"
              title="Logout / Switch Persona"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-purple-950 text-xs font-bold shadow-md hover:bg-amber-300 active:scale-95 transition flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
