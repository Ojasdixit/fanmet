import { format } from 'date-fns';
import { Bell, Check, Settings } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';

export function CreatorNotifications() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
          <p className="text-[#6C757D]">Manage your alerts and preferences</p>
        </div>
        <button
          onClick={() => markAllNotificationsAsRead()}
          className="flex items-center gap-2 text-sm font-medium text-[#FF6B35] hover:text-[#E85D2E]"
        >
          <Check className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#111827]">Latest alerts</h2>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-[#6C757D]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-4 rounded-lg border p-4 transition-colors cursor-pointer ${notification.read
                        ? 'border-transparent bg-white'
                        : 'border-[#FFE5D9] bg-[#FFF5F2]'
                      }`}
                    onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                  >
                    <div className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full ${notification.read ? 'bg-[#F8F9FA] text-[#6C757D]' : 'bg-[#FFE5D9] text-[#FF6B35]'
                      }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${notification.read ? 'text-[#111827]' : 'text-[#FF6B35]'}`}>
                          {notification.title}
                        </h3>
                        <span className="whitespace-nowrap text-xs text-[#6C757D]">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#6C757D]">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#FF6B35]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#6C757D]" />
              <h2 className="text-lg font-semibold text-[#111827]">Preferences</h2>
            </div>
            <div className="space-y-4">
              {['Email notifications', 'Push notifications', 'SMS alerts'].map((setting) => (
                <div key={setting} className="flex items-center justify-between">
                  <span className="text-sm text-[#111827]">{setting}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="peer h-6 w-11 rounded-full bg-[#E9ECEF] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#FF6B35] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FFE5D9]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
