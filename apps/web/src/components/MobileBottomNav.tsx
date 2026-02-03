import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { classNames } from '@fanmeet/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

// SVG Icons as components for cleaner look
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={classNames('h-6 w-6', active ? 'text-[#C045FF]' : 'text-[#6C757D]')}
  >
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={classNames('h-6 w-6', active ? 'text-[#C045FF]' : 'text-[#6C757D]')}
  >
    <path fillRule="evenodd" d="M6.75 2.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v1.5h4.5V2.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75V4.5h1.5A2.25 2.25 0 0121 6.75v12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75v-12A2.25 2.25 0 015.25 4.5h1.5V2.25zm9 15a.75.75 0 00-1.5 0v.75h-.75a.75.75 0 000 1.5h.75v.75a.75.75 0 001.5 0v-.75h.75a.75.75 0 000-1.5h-.75v-.75z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={classNames('h-7 w-7', active ? 'text-[#C045FF]' : 'text-white')}
  >
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
  </svg>
);

const MessageIcon = ({ active, badge }: { active: boolean; badge?: number }) => {
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <div className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={classNames('h-6 w-6', active ? 'text-[#C045FF]' : 'text-[#6C757D]')}
      >
        <path fillRule="evenodd" d="M4.804 21.644A6.75 6.75 0 005.25 21a6.75 6.75 0 006.75-6.75V12a6.75 6.75 0 00-6.75-6.75H5.25A6.75 6.75 0 005.25 21h.75a.75.75 0 000-1.5h-.75A5.25 5.25 0 015.25 5.25h1.5A5.25 5.25 0 0112 10.5v3.75a5.25 5.25 0 01-5.25 5.25h-.75a5.25 5.25 0 01-3.536-1.464.75.75 0 00-1.06 1.06c.39.39.842.704 1.336.943zM12.75 6.75a.75.75 0 00-1.5 0V9.75H9a.75.75 0 000 1.5h2.25V13.5a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V6.75z" clipRule="evenodd" />
        <path d="M5.25 6.75a.75.75 0 01.75-.75h12a.75.75 0 01.75.75v12a.75.75 0 01-.75.75h-12a.75.75 0 01-.75-.75v-12z" opacity="0" />
        <path d="M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75zm2.25-.75a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75h-15z" />
      </svg>
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {badge && badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
  );
};

const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={classNames('h-6 w-6', active ? 'text-[#C045FF]' : 'text-[#6C757D]')}
  >
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

interface MobileBottomNavProps {
  role: 'fan' | 'creator' | 'admin';
  onProfileClick: () => void;
}

export const MobileBottomNav = ({ role, onProfileClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadMessagesCount } = useNotifications();

  const isActive = (path: string) => {
    if (path === '/creator' || path === '/fan') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Creator: 5 items (Home, Meetings, Create, Messages, Profile)
  // Fan: 4 items (Home, Meetings, Messages, Profile) - no Create
  const isCreator = role === 'creator';
  const basePath = `/${role}`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E9ECEF]/80 bg-white shadow-[0_-6px_24px_rgba(5,0,20,0.08)] md:hidden"
      style={{
        paddingTop: '0.4rem',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {/* Home */}
        <NavLink
          to={basePath}
          end
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
        >
          {({ isActive: active }) => (
            <>
              <HomeIcon active={active} />
              <span
                className={classNames(
                  'text-[10px] font-medium',
                  active ? 'text-[#C045FF]' : 'text-[#6C757D]'
                )}
              >
                Home
              </span>
            </>
          )}
        </NavLink>

        {/* Meetings */}
        <NavLink
          to={`${basePath}/meets`}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
        >
          {({ isActive: active }) => (
            <>
              <CalendarIcon active={active} />
              <span
                className={classNames(
                  'text-[10px] font-medium',
                  active ? 'text-[#C045FF]' : 'text-[#6C757D]'
                )}
              >
                Meets
              </span>
            </>
          )}
        </NavLink>

        {/* Create - Only for creators */}
        {isCreator && (
          <button
            type="button"
            onClick={() => navigate('/creator/events/new')}
            className="flex h-12 w-12 -mt-4 items-center justify-center rounded-full bg-[#050014] shadow-lg active:scale-95 transition-transform"
          >
            <PlusIcon active={false} />
          </button>
        )}

        {/* Messages */}
        <NavLink
          to={`${basePath}/messages`}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
        >
          {({ isActive: active }) => (
            <>
              <MessageIcon active={active} badge={unreadMessagesCount} />
              <span
                className={classNames(
                  'text-[10px] font-medium',
                  active ? 'text-[#C045FF]' : 'text-[#6C757D]'
                )}
              >
                Messages
              </span>
            </>
          )}
        </NavLink>

        {/* Profile */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
        >
          <UserIcon active={false} />
          <span className="text-[10px] font-medium text-[#6C757D]">Profile</span>
        </button>
      </div>
    </nav>
  );
};
