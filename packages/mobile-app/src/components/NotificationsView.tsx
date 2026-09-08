import React from 'react';
import { NotificationItem } from '../types';
import { Bell, MessageSquare, CheckCheck, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<Props> = ({ notifications, onMarkAllRead }) => {
  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-sm text-slate-800 flex items-center space-x-1.5">
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Alerts & Notifications</span>
          </h2>
          <p className="text-xs text-slate-500">Live feed from school administrative office</p>
        </div>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark read</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3.5 rounded-2xl border transition ${
              notif.read ? 'bg-white border-slate-200' : 'bg-purple-50/70 border-purple-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    notif.channel === 'AUTOMATED_SMS_FALLBACK'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {notif.channel === 'AUTOMATED_SMS_FALLBACK' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-xs text-slate-900">{notif.title}</h4>
                    {notif.channel === 'AUTOMATED_SMS_FALLBACK' && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        SMS Sent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1.5">{notif.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
