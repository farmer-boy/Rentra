import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      setNotifications(data);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    setSavingId(id);
    setError('');
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Notification could not be updated.');
    } finally {
      setSavingId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await api.patch('/notifications/read-all');
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Notifications could not be updated.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <section>
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
          <p className={`mt-1 text-sm ${mutedText}`}>
            {unreadCount ? `${unreadCount} unread` : 'Updates for your account'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Updating...' : 'Mark all read'}
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          <span>{error}</span>
          <button type="button" onClick={() => void loadNotifications()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className={`text-sm ${mutedText}`}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className={`p-8 text-center border rounded-xl ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
          <Bell className={`mx-auto mb-3 ${mutedText}`} size={28} />
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>You’re all caught up</p>
          <p className={`mt-1 text-sm ${mutedText}`}>New account updates will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-start justify-between gap-4 p-4 border rounded-xl ${
                isDark
                  ? notification.isRead ? 'border-white/10 bg-white/5' : 'border-green-500/30 bg-green-500/10'
                  : notification.isRead ? 'border-gray-200 bg-white' : 'border-green-200 bg-green-50'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{notification.title}</p>
                  {!notification.isRead && <span className="w-2 h-2 bg-green-500 rounded-full" aria-label="Unread" />}
                </div>
                <p className={`mt-1 text-sm ${mutedText}`}>{notification.message}</p>
                <p className={`mt-2 text-xs ${mutedText}`}>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => void markRead(notification.id)}
                  disabled={savingId === notification.id}
                  className={`shrink-0 text-xs font-semibold ${isDark ? 'text-green-300 hover:text-green-200' : 'text-green-700 hover:text-green-800'} disabled:opacity-60`}
                >
                  {savingId === notification.id ? 'Saving...' : 'Mark read'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
