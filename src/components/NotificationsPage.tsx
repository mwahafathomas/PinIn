import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  Store,
  MessageSquare,
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
} from 'lucide-react';
import { NotificationItem } from '../types/furniture';
import { formatNotificationTime } from '../services/notificationsService';

interface NotificationCardProps {
  notif: NotificationItem;
  onDelete: (id: string) => void;
  getIcon: (type: NotificationItem['type']) => React.ReactNode;
  getIconBg: (type: NotificationItem['type']) => string;
}

const SwipeableNotificationItem: React.FC<NotificationCardProps> = ({
  notif,
  onDelete,
  getIcon,
  getIconBg,
}) => {
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);

  // Trash button opacity and scale based on left drag
  const deleteOpacity = useTransform(x, [0, -30, -70], [0, 0.6, 1]);
  const deleteScale = useTransform(x, [0, -40, -80], [0.7, 0.9, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -40 || info.velocity.x < -300) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl group select-none">
      {/* Background Revealed Action: Red Delete / Bin button on the right */}
      <div className="absolute inset-y-0 right-0 w-24 bg-red-600 rounded-3xl flex items-center justify-center pr-1 z-0 shadow-inner">
        <motion.button
          type="button"
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          onClick={() => onDelete(notif.id)}
          className="flex flex-col items-center justify-center text-white hover:text-red-100 active:scale-95 transition-transform p-3 w-full h-full cursor-pointer"
          aria-label="Delete notification"
        >
          <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center shadow-md">
            <Trash2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-extrabold mt-1">Delete</span>
        </motion.button>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -90, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -85 : 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        style={{ x }}
        className={`relative z-10 p-4 rounded-3xl border-2 transition-colors flex items-start gap-3.5 shadow-xs touch-pan-y cursor-grab active:cursor-grabbing ${
          notif.read
            ? 'bg-white border-gray-200 hover:border-gray-300'
            : 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-50'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 pointer-events-none ${getIconBg(
            notif.type
          )}`}
        >
          {getIcon(notif.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
              {notif.title}
            </h3>
            <span className="text-[10px] font-semibold text-gray-400 shrink-0">
              {formatNotificationTime(notif)}
            </span>
          </div>
          <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
            {notif.message}
          </p>
          {notif.rejectionReason && (
            <div className="mt-2 p-2.5 rounded-xl bg-red-50/80 border border-red-200/80 text-[11px] text-red-800">
              <span className="font-bold">Reason for rejection: </span>
              <span>{notif.rejectionReason}</span>
            </div>
          )}
        </div>

        {/* Unread indicator dot */}
        {!notif.read && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF] shrink-0 mt-1.5 pointer-events-none" />
        )}
      </motion.div>
    </div>
  );
};

interface NotificationsPageProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
  onOpenSearch?: () => void;
  onOpenMessages?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDeleteNotification,
  onOpenSearch,
  onOpenMessages,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  // Automatically mark all notifications as read when opening this page if any are unread
  useEffect(() => {
    if (isOpen && notifications.some((n) => !n.read)) {
      onMarkAllRead();
    }
  }, [isOpen, notifications, onMarkAllRead]);

  if (!isOpen) return null;

  // Filter only allowed notification types:
  // 1. Welcome to PinIn
  // 2. Listing under review (listing_submitted)
  // 3. Listing approved or rejected (listing_approved / listing_rejected)
  const filteredNotifications = notifications.filter((n) =>
    ['system', 'listing_submitted', 'listing_approved', 'listing_rejected'].includes(n.type)
  );

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'listing_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'listing_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'listing_submitted':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'system':
      default:
        return <Info className="w-5 h-5 text-[#0052FF]" />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'listing_approved':
        return 'bg-emerald-50 border-emerald-200';
      case 'listing_rejected':
        return 'bg-red-50 border-red-200';
      case 'listing_submitted':
        return 'bg-amber-50 border-amber-200';
      case 'system':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteNotification) {
      onDeleteNotification(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Left spacer for symmetrical centering without back button */}
          <div className="w-8" aria-hidden="true" />

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          {/* Clean spacer for symmetrical centering */}
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Middle: Notifications list (Scrollable in middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pt-4 pb-6 space-y-3 text-left">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">
              Activity &amp; Alerts
            </h1>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-xs text-center space-y-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <CheckCheck className="w-8 h-8 opacity-40" />
            </div>
            <h2 className="text-base font-black text-gray-900">
              You are all caught up!
            </h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Listing review updates and approval status notifications will show up here and be sent to your mobile device.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SwipeableNotificationItem
                    notif={notif}
                    onDelete={handleDelete}
                    getIcon={getIcon}
                    getIconBg={getIconBg}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
          {/* Marketplace Icon at bottom left */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#0052FF] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Marketplace"
          >
            <div className="relative flex items-center justify-center">
              <Store className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#0052FF]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#0052FF]">
              Marketplace
            </span>
          </button>

          {/* Messages Icon in middle */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMessages) onOpenMessages();
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Messages"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#0052FF]">
              messages
            </span>
          </button>

          {/* Notifications Icon (Active state) at bottom right */}
          <button
            type="button"
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Notifications active"
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#0052FF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-[#0052FF]">
              Notifications
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
