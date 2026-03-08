import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
  id: string;
  notification_id: string;
  is_read: boolean;
  created_at: string;
  notification: {
    title: string;
    message: string;
    image_url: string | null;
  };
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchRecent = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_notifications')
      .select('id, notification_id, is_read, created_at, notification:notifications(title, message, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setNotifications((data as unknown as NotificationItem[]) || []);
    setLoading(false);
  };

  const handleToggle = () => {
    if (!isOpen) fetchRecent();
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.is_read) markAsRead(item.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 bg-black border border-white/10 rounded-lg sm:rounded-xl hover:border-primary/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-0.5 sm:px-1 text-[9px] sm:text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 sm:top-12 w-72 sm:w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  to="/notifications"
                  onClick={() => handleNotificationClick(item)}
                  className={`block px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 ${
                    !item.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {!item.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className={!item.is_read ? '' : 'pl-5'}>
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.notification?.title || 'Notification'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.notification?.message || ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-accent/30 transition-colors border-t border-border"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};
