import React from 'react';
import {
  X,
  Bell,
  TrendingDown,
  MessageSquare,
  Bookmark,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react';
import { NotificationItem } from '../types/furniture';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'listing_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'listing_rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'listing_submitted':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'price_drop':
        return <TrendingDown className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-[#0052FF]" />;
      case 'saved_item':
        return <Bookmark className="w-4 h-4 text-amber-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'listing_approved':
        return 'bg-emerald-50 text-emerald-600';
      case 'listing_rejected':
        return 'bg-red-50 text-red-600';
      case 'listing_submitted':
        return 'bg-amber-50 text-amber-600';
      case 'price_drop':
        return 'bg-emerald-50 text-emerald-600';
      case 'message':
        return 'bg-blue-50 text-[#0052FF]';
      case 'saved_item':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#0052FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-gray-900 leading-none">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-[#0052FF] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-[#0052FF] hover:underline font-bold"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2.5 divide-y divide-gray-100/60 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-gray-700">No notifications yet</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                Updates regarding your listings, approvals, and messages will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(notif);
                }}
                className={`p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                  notif.read
                    ? 'bg-white hover:bg-gray-50/80'
                    : 'bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100/80 shadow-2xs'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${getIconBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-xs text-gray-900 truncate">{notif.title}</h4>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#0052FF] shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
