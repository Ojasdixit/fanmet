import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `text-base font-medium transition-colors ${
    isActive ? 'text-[#FF6B35]' : 'text-[#6C757D] hover:text-[#FF6B35]'
  }`;

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {!isLanding && (
        <>
          <header className="sticky top-0 z-50 flex h-[70px] items-center justify-between border-b border-[#E9ECEF] bg-white px-6 md:px-12">
            <div className="flex items-center gap-6 md:gap-10">
              <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold text-[#FF6B35]">
                FanMeet
              </NavLink>
              <nav className="hidden gap-6 md:flex">
                <NavLink to="/fan" className={navLinkClasses}>
                  Browse Events
                </NavLink>
                <a href="#how-it-works" className="text-base font-medium text-[#6C757D] transition-colors hover:text-[#FF6B35]">
                  How It Works
                </a>
                <NavLink to="/creator" className={navLinkClasses}>
                  For Creators
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 md:flex">
                <Button variant="secondary" size="sm" onClick={() => navigate('/auth')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </div>
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-[#E9ECEF] p-2 text-[#343A40] md:hidden"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                <span className="sr-only">Toggle navigation</span>
                <div className="flex flex-col gap-[3px]">
                  <span className="h-[2px] w-4 bg-[#343A40]" />
                  <span className="h-[2px] w-4 bg-[#343A40]" />
                  <span className="h-[2px] w-4 bg-[#343A40]" />
                </div>
              </button>
            </div>
          </header>
          {isMobileMenuOpen && (
            <div className="border-b border-[#E9ECEF] bg-white px-6 py-3 md:hidden">
              <nav className="flex flex-col gap-3">
                <NavLink
                  to="/fan"
                  className={navLinkClasses}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Events
                </NavLink>
                <a
                  href="#how-it-works"
                  className="text-base font-medium text-[#6C757D] transition-colors hover:text-[#FF6B35]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <NavLink
                  to="/creator"
                  className={navLinkClasses}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  For Creators
                </NavLink>
                <div className="mt-2 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/auth');
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/auth');
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </>
      )}
      <main className="bg-gradient-to-b from-white to-[#FFE5D9]">
        <Outlet />
      </main>
    </div>
  );
};
