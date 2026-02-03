import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { classNames } from '@fanmeet/utils';
import { Button } from '@fanmeet/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

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
};

type NavItem = NavLinkItem | NavSectionItem;

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'fan' | 'creator' | 'admin';
  menu: NavItem[];
}

export const ProfileMenu = ({ isOpen, onClose, role, menu }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { unreadNotificationsCount, unreadMessagesCount } = useNotifications();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    onClose();
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const basePath = `/${role}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden" />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed bottom-[72px] left-4 right-4 z-[70] max-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-2xl md:hidden"
        style={{
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        {/* Header */}
        <div className="border-b border-[#E9ECEF] bg-gradient-to-r from-[#FCE7FF] to-[#F4E6FF] px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#050014]">
                {role === 'creator' ? 'Creator Menu' : role === 'fan' ? 'Fan Menu' : 'Admin Menu'}
              </h3>
              <p className="text-xs text-[#6C757D]">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6C757D] transition hover:bg-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="max-h-[50vh] overflow-y-auto p-3">
          <nav className="space-y-1">
            {menu.map((item) => {
              if ('type' in item && item.type === 'section') {
                return (
                  <div
                    key={item.label}
                    className="mt-4 mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-[#6C757D]"
                  >
                    {item.label}
                  </div>
                );
              }

              const link = item as NavLinkItem;
              const isDisabled = Boolean(link.disabled);

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
                  end={link.to === basePath}
                  onClick={(event) => {
                    if (isDisabled) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }
                    onClose();
                  }}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all',
                      isDisabled
                        ? 'cursor-not-allowed text-[#ADB5BD]'
                        : isActive
                          ? 'bg-[#F4E6FF] font-semibold text-[#C045FF]'
                          : 'text-[#343A40] hover:bg-[#F8F9FA]'
                    )
                  }
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                  {!isDisabled && badgeCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E9ECEF] bg-[#F8F9FA] p-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full border-none bg-[#050014] text-white hover:bg-[#140423]"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};
