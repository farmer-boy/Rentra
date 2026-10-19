import { Bell, CheckCheck } from 'lucide-react';
import { ApiError } from '../../api/api-error';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/useRentraQueries';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const notifications = (notificationsQuery.data ?? []) as Notification[];
  const loading = notificationsQuery.isPending;
  const savingId = markReadMutation.isPending ? markReadMutation.variables : null;
  const markingAll = markAllMutation.isPending;
  const errorCause = notificationsQuery.error ?? markReadMutation.error ?? markAllMutation.error;
  const error = errorCause instanceof ApiError
    ? errorCause.message
    : errorCause
      ? 'Notifications could not be updated.'
      : '';
  const loadNotifications = () => notificationsQuery.refetch();
  const markRead = (id: string) => markReadMutation.mutate(id);
  const markAllRead = () => markAllMutation.mutate();

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const mutedText = 'text-text-muted';

  return (
    <section>
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Notifications</h1>
          <p className={`mt-1 text-sm ${mutedText}`}>
            {unreadCount ? `${unreadCount} unread` : 'Updates for your account'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-contrast bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
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
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <Bell className={`mx-auto mb-3 ${mutedText}`} size={28} />
          <p className="font-semibold text-text">You’re all caught up</p>
          <p className={`mt-1 text-sm ${mutedText}`}>New account updates will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
                notification.isRead ? 'border-border bg-surface' : 'border-primary/30 bg-primary-soft'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text">{notification.title}</p>
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
                  onClick={() => markRead(notification.id)}
                  disabled={savingId === notification.id}
                  className="shrink-0 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-60"
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
