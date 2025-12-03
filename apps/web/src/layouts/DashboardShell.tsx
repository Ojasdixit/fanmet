import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Button, Avatar, Badge } from '@fanmeet/ui';
import { classNames } from '@fanmeet/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';

type NavSectionItem = {
  type: 'section';
  label: string;
};

type NavLinkItem = {
  type: 'link';
  to: string;
  label: string;
  icon: string;
  disabled?: boolean;
  badge?: number;
};

type NavItem = NavLinkItem | NavSectionItem;

const roleConfig: Record<
  'fan' | 'creator' | 'admin',
  {
    title: string;
    menu: NavItem[];
  }
> = {
  fan: {
    title: 'Fan Dashboard',
    menu: [
      { type: 'link', to: '/fan', label: 'Browse Events', icon: '🏠' },
      { type: 'link', to: '/fan/following', label: 'Following', icon: '👥' },
      { type: 'link', to: '/fan/bids', label: 'My Bids', icon: '🎫' },
      { type: 'link', to: '/fan/meets', label: 'Upcoming Meets', icon: '📹' },
      { type: 'link', to: '/fan/history', label: 'History', icon: '📜' },
      { type: 'link', to: '/fan/wallet', label: 'Payment History', icon: '💳' },
      { type: 'link', to: '/fan/messages', label: 'Messages', icon: '💬' },
      { type: 'link', to: '/fan/notifications', label: 'Notifications', icon: '🔔' },
      { type: 'link', to: '/fan/settings', label: 'Settings', icon: '⚙️' },
      { type: 'link', to: '/fan/support', label: 'Help & Support', icon: '🆘' },
    ],
  },
  creator: {
    title: 'Creator Control Room',
    menu: [
      { type: 'link', to: '/creator', label: 'Overview', icon: '📊' },
      { type: 'link', to: '/creator/events', label: 'My Events', icon: '🎫' },
      { type: 'link', to: '/creator/events/new', label: 'Create Event', icon: '➕' },
      { type: 'link', to: '/creator/profile-setup', label: 'Profile Setup', icon: '👤' },
      { type: 'link', to: '/creator/followers', label: 'Followers', icon: '👥' },
      { type: 'link', to: '/creator/earnings', label: 'Earnings', icon: '💰' },
      { type: 'link', to: '/creator/withdrawals', label: 'Withdrawals', icon: '🏦' },
      { type: 'link', to: '/creator/meets', label: 'Upcoming Meets', icon: '📹' },
      { type: 'link', to: '/creator/messages', label: 'Messages', icon: '💬' },
      { type: 'link', to: '/creator/notifications', label: 'Notifications', icon: '🔔' },
      { type: 'link', to: '/creator/settings', label: 'Settings', icon: '⚙️' },
      { type: 'link', to: '/creator/support', label: 'Help & Support', icon: '🆘' },
    ],
  },
  admin: {
    title: 'Admin Command Center',
    menu: [
      { type: 'link', to: '/admin', label: 'Dashboard', icon: '📊' },
      { type: 'section', label: 'USER MANAGEMENT' },
      { type: 'link', to: '/admin/users', label: 'All Users', icon: '👥' },
      { type: 'link', to: '/admin/creators', label: 'Creators Management', icon: '🎨' },
      { type: 'link', to: '/admin/fans', label: 'Fans Management', icon: '🎭' },
      { type: 'section', label: 'CONTENT MANAGEMENT' },
      { type: 'link', to: '/admin/events', label: 'Events Management', icon: '🎫' },
      { type: 'link', to: '/admin/featured', label: 'Featured Creators', icon: '📣' },
      { type: 'link', to: '/admin/announcements', label: 'Announcements', icon: '📢' },
      { type: 'section', label: 'FINANCIAL' },
      { type: 'link', to: '/admin/payments', label: 'Payments & Transactions', icon: '💰' },
      { type: 'link', to: '/admin/withdrawals', label: 'Withdrawal Requests', icon: '🏦' },
      { type: 'link', to: '/admin/refunds', label: 'Refunds Management', icon: '💳' },
      { type: 'link', to: '/admin/revenue-analytics', label: 'Revenue Analytics', icon: '📊' },
      { type: 'link', to: '/admin/platform-commission', label: 'Platform Commission', icon: '🧾' },
      { type: 'section', label: 'REPORTS & ANALYTICS' },
      { type: 'link', to: '/admin/business-analytics', label: 'Business Analytics', icon: '📈' },
      { type: 'link', to: '/admin/user-analytics', label: 'User Analytics', icon: '📉' },
      { type: 'link', to: '/admin/revenue-reports', label: 'Revenue Reports', icon: '💹' },
      { type: 'link', to: '/admin/event-analytics', label: 'Event Analytics', icon: '📊' },
      { type: 'link', to: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍' },
      { type: 'section', label: 'SUPPORT & MODERATION' },
      { type: 'link', to: '/admin/support-tickets', label: 'Support Tickets', icon: '🎧' },
      { type: 'link', to: '/admin/reports-flags', label: 'Reports & Flags', icon: '🚫' },
      { type: 'link', to: '/admin/disputes', label: 'Dispute Management', icon: '⚠️' },
      { type: 'section', label: 'PLATFORM SETTINGS' },
      { type: 'link', to: '/admin/settings/general', label: 'General Settings', icon: '⚙️' },
      { type: 'link', to: '/admin/settings/pricing', label: 'Pricing & Commission', icon: '💵' },
      { type: 'link', to: '/admin/settings/email-templates', label: 'Email Templates', icon: '📧' },
      { type: 'link', to: '/admin/settings/notifications', label: 'Notification Settings', icon: '🔔' },
      { type: 'link', to: '/admin/settings/security', label: 'Security & Access', icon: '🔐' },
      { type: 'section', label: 'SYSTEM' },
      { type: 'link', to: '/admin/system/logs', label: 'System Logs', icon: '🔧' },
      { type: 'link', to: '/admin/system/bulk-actions', label: 'Bulk Actions', icon: '📤' },
      { type: 'link', to: '/admin/system/backup', label: 'Database Backup', icon: '🗄️' },
      { type: 'section', label: 'ACCOUNT' },
      { type: 'link', to: '/admin/profile', label: 'My Profile', icon: '👤' },
    ],
  },
};

export type DashboardRole = keyof typeof roleConfig;

interface DashboardShellProps {
  role: DashboardRole;
}

export const DashboardShell = ({ role }: DashboardShellProps) => {
  const config = roleConfig[role];
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { notifications, unreadNotificationsCount, unreadMessagesCount, markAllNotificationsAsRead } = useNotifications();

  // Get user initials from email/username
  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || 'U';
  const displayName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : user?.email?.split('@')[0] || 'User';

  const basePath = useMemo(() => `/${role}`, [role]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<'none' | 'notifications' | 'profile'>('none');
    const [searchQuery, setSearchQuery] = useState('');


  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const minWidth = 220;
      const maxWidth = 420;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, event.clientX));
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const renderNavItems = (options?: { closeOnSelect?: boolean }) =>
    config.menu.map((item) => {
      if ('type' in item && item.type === 'section') {
        return (
          <div
            key={item.label}
            className="mt-4 mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
          >
            {item.label}
          </div>
        );
      }

      const link = item as NavLinkItem;
      const isDisabled = Boolean(link.disabled);
      const shouldUseExact = link.to === basePath;

      // Determine badge count dynamically
      let badgeCount = 0;
      if (link.label === 'Notifications') {
        badgeCount = unreadNotificationsCount;
      } else if (link.label === 'Messages') {
        badgeCount = unreadMessagesCount;
      }

      return (
        <NavLink
          key={link.to}
          to={link.to}
          end={shouldUseExact}
          onClick={(event) => {
            if (isDisabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            if (options?.closeOnSelect) {
              setIsSidebarOpen(false);
            }
          }}
          className={({ isActive }) =>
            classNames(
              'flex items-center gap-3 rounded-[12px] border border-transparent px-5 py-3 text-base transition-all',
              isDisabled
                ? 'cursor-not-allowed text-white/40 opacity-60'
                : isActive
                  ? 'bg-white/10 text-white font-semibold shadow-[0_18px_45px_rgba(0,0,0,0.65)]'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
            )
          }
        >
          <span
            className={classNames(
              'flex-1',
              role === 'admin' ? 'font-semibold tracking-wide' : '',
              isSidebarCollapsed ? 'hidden' : ''
            )}
          >
            {link.label}
          </span>
          {!isDisabled && badgeCount > 0 ? <Badge variant="danger">{badgeCount}</Badge> : null}
        </NavLink>
      );
    });

  const renderRightPanelContent = () => {
    if (activeRightPanel === 'notifications') {
      return (
        <>
          <div className="flex items-center justify-between border-b border-[#E9ECEF] px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-[#212529]">Notifications</div>
              <div className="text-xs text-[#6C757D]">Latest updates on your bids and meets.</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="border-none bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => markAllNotificationsAsRead()}
            >
              Mark all read
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {notifications.length === 0 ? (
              <div className="text-center text-sm text-[#6C757D] py-4">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="rounded-[12px] bg-white/90 p-3 shadow-sm">
                  <div className="text-sm font-semibold text-[#212529]">{notification.title}</div>
                  <div className="text-xs text-[#6C757D]">{notification.message}</div>
                  <div className="mt-1 text-[10px] text-[#ADB5BD]">
                    {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[#E9ECEF] p-4">
            <Button
              variant="secondary"
              size="sm"
              className="w-full border-none bg-white text-[#050014] hover:bg-[#F8F9FA]"
              onClick={() => navigate(`/${role}/notifications`)}
            >
              View all notifications
            </Button>
          </div>
        </>
      );
    }

    if (activeRightPanel === 'profile') {
      return (
        <>
          <div className="flex items-center gap-3 border-b border-[#E9ECEF] px-5 py-4">
            <Avatar initials={userInitials} size="md" />
            <div>
              <div className="text-sm font-semibold text-[#212529]">{displayName}</div>
              <div className="text-xs text-[#6C757D]">{role.charAt(0).toUpperCase() + role.slice(1)} account • Premium</div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="rounded-[12px] bg-white/90 p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6C757D]">Payment Info</div>
              <div className="mt-1 text-sm font-semibold text-[#212529]">Auto-refund enabled</div>
              <div className="mt-1 text-xs text-[#6C757D]">90% refund for unsuccessful bids</div>
            </div>
            <div className="grid gap-2 text-sm text-[#343A40]">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[10px] bg-white/90 px-3 py-2 text-left shadow-sm hover:bg-[#F8F9FA]"
                onClick={() => navigate(`/${role}/wallet`)}
              >
                <span>Payment history</span>
                <span>→</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[10px] bg-white/90 px-3 py-2 text-left shadow-sm hover:bg-[#F8F9FA]"
                onClick={() => navigate(`/${role}/meets`)}
              >
                <span>Upcoming meets</span>
                <span>→</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[10px] bg-white/90 px-3 py-2 text-left shadow-sm hover:bg-[#F8F9FA]"
                onClick={() => navigate(`/${role}/settings`)}
              >
                <span>Profile & settings</span>
                <span>→</span>
              </button>
            </div>
          </div>
          <div className="border-t border-[#E9ECEF] p-4">
            <Button
              variant="secondary"
              size="sm"
              className="w-full border-none bg-[#050014] text-white hover:bg-[#140423]"
              onClick={() => {
                // Logic to switch account could go here
                handleLogout();
              }}
            >
              Switch account
            </Button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <aside
        className="sticky top-0 hidden h-screen max-h-screen flex-shrink-0 border-r border-[#1F2933] bg-gradient-to-b from-[#050014] via-[#050014] to-[#140423] text-white md:flex md:flex-col relative"
        style={{ width: isSidebarCollapsed ? 80 : sidebarWidth }}
      >
        <div
          className={classNames(
            'flex flex-1 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-8',
            isSidebarCollapsed ? 'px-3' : 'px-6'
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar initials={userInitials} size="lg" />
            <div
              className={classNames(
                'text-lg font-semibold text-white',
                isSidebarCollapsed ? 'hidden' : ''
              )}
            >
              Hey, {displayName}!
            </div>
            {!isSidebarCollapsed ? <Badge variant="primary">Premium</Badge> : null}
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {renderNavItems()}
          </nav>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-[#050014] text-xs text-white shadow-md transition hover:bg-white hover:text-[#050014] md:flex"
        >
          {isSidebarCollapsed ? '»' : '«'}
        </button>
        <div
          className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize md:block"
          onMouseDown={() => setIsResizing(true)}
        />
        <div className="px-6 pb-6">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-start rounded-[8px] bg-black px-4 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full w-[260px] flex-col border-r border-[#1F2933] bg-gradient-to-b from-[#050014] via-[#050014] to-[#140423] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">{config.title}</span>
              <button
                type="button"
                className="rounded-md border border-white/30 p-1 text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-4">
              <nav className="flex flex-1 flex-col gap-1">{renderNavItems({ closeOnSelect: true })}</nav>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-start rounded-[8px] bg-black px-4 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeRightPanel !== 'none' && (
        <div
          className="fixed inset-y-0 right-0 z-30 hidden w-80 flex-col border-l border-[#E9ECEF] bg-gradient-to-b from-[#FFF7FF] via-[#F4E6FF] to-[#F5F0FF] shadow-[0_0_45px_rgba(15,23,42,0.25)] backdrop-blur-xl md:flex"
          onMouseLeave={() => setActiveRightPanel('none')}
        >
          {renderRightPanelContent()}
        </div>
      )}
      <div className="flex w-full flex-col">
        <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-[#E9ECEF] bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center justify-center rounded-md border border-[#E9ECEF] p-2 text-[#343A40] md:hidden"
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              <span className="sr-only">Open sidebar</span>
              <div className="flex flex-col gap-[3px]">
                <span className="h-[2px] w-4 bg-[#343A40]" />
                <span className="h-[2px] w-4 bg-[#343A40]" />
                <span className="h-[2px] w-4 bg-[#343A40]" />
              </div>
            </button>
            <div className="text-xl font-semibold text-[#212529]">{config.title}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                className="h-11 rounded-[12px] border-2 border-[#E9ECEF] px-4 pr-10 text-sm focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                placeholder="Search events, creators…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = role === 'fan' ? '/fan' : '/browse-events';
                    navigate(`${target}?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#6C757D]">🔍</span>
            </div>
            <div
              className="hidden md:block"
              onMouseEnter={() => setActiveRightPanel('notifications')}
            >
              <Button
                variant="secondary"
                size="icon"
                className="bg-black text-white border-none hover:bg-black/90 relative"
              >
                🔔
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>
            </div>
            <div
              className="hidden md:block"
              onMouseEnter={() => setActiveRightPanel('profile')}
            >
              <Avatar initials={userInitials} size="sm" />
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="secondary"
                size="icon"
                className="bg-black text-white border-none hover:bg-black/90 relative"
                onClick={() => setActiveRightPanel(activeRightPanel === 'notifications' ? 'none' : 'notifications')}
              >
                🔔
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>
              <Avatar initials={userInitials} size="sm" />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-12 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
