import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Button, Avatar, Badge } from '@fanmeet/ui';
import { classNames } from '@fanmeet/utils';

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
      { type: 'link', to: '/fan/bids', label: 'My Bids', icon: '🎫' },
      { type: 'link', to: '/fan/meets', label: 'Upcoming Meets', icon: '📹' },
      { type: 'link', to: '/fan/history', label: 'History', icon: '📜' },
      { type: 'link', to: '/fan/wallet', label: 'Wallet & Refunds', icon: '💰' },
      { type: 'link', to: '/fan/notifications', label: 'Notifications', icon: '🔔', badge: 3 },
      { type: 'link', to: '/fan/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
  creator: {
    title: 'Creator Control Room',
    menu: [
      { type: 'link', to: '/creator', label: 'Overview', icon: '📊' },
      { type: 'link', to: '/creator/events', label: 'My Events', icon: '🎫' },
      { type: 'link', to: '/creator/events/new', label: 'Create Event', icon: '➕' },
      { type: 'link', to: '/creator/earnings', label: 'Earnings', icon: '💰' },
      { type: 'link', to: '/creator/withdrawals', label: 'Withdrawals', icon: '🏦' },
      { type: 'link', to: '/creator/meets', label: 'Upcoming Meets', icon: '📹' },
      { type: 'link', to: '/creator/notifications', label: 'Notifications', icon: '🔔' },
      { type: 'link', to: '/creator/settings', label: 'Settings', icon: '⚙️' },
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
      { type: 'link', to: '/admin/featured', label: 'Featured Creators', icon: '⭐' },
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

  const basePath = useMemo(() => `/${role}`, [role]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <aside className="sticky top-0 hidden h-screen max-h-screen w-[260px] flex-shrink-0 border-r border-[#E9ECEF] bg-white md:flex md:flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar initials="RK" size="lg" />
            <div className="text-lg font-semibold text-[#212529]">Hey, Rahul!</div>
            <Badge variant="primary">Premium</Badge>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {config.menu.map((item) => {
              if ('type' in item && item.type === 'section') {
                return (
                  <div key={item.label} className="mt-4 mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ADB5BD]">
                    {item.label}
                  </div>
                );
              }

              const link = item as NavLinkItem;
              const isDisabled = Boolean(link.disabled);
              const shouldUseExact = link.to === basePath;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={shouldUseExact}
                  onClick={(event) => {
                    if (isDisabled) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 rounded-[12px] border border-transparent bg-white px-5 py-3 text-base transition-all shadow-[var(--shadow-sm)]',
                      isDisabled
                        ? 'cursor-not-allowed text-[#ADB5BD] opacity-70'
                        : isActive
                        ? 'border-[#FF6B35] text-[#212529] shadow-[var(--shadow-md)]'
                        : 'text-[#6C757D] hover:border-[#FFE5D9] hover:text-[#212529]'
                    )
                  }
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  {!isDisabled && link.badge ? <Badge variant="danger">{link.badge}</Badge> : null}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="px-6 pb-6">
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#6C757D]">
            Logout
          </Button>
        </div>
      </aside>
      <div className="flex w-full flex-col">
        <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-[#E9ECEF] bg-white px-6 shadow-sm">
          <div className="text-xl font-semibold text-[#212529]">{config.title}</div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                className="h-11 rounded-[12px] border-2 border-[#E9ECEF] px-4 pr-10 text-sm focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                placeholder="Search events, creators…"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#6C757D]">🔍</span>
            </div>
            <Button variant="ghost" size="icon">
              🔔
            </Button>
            <Avatar initials="RK" size="sm" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-12 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
