import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `text-base font-medium transition-colors ${
    isActive ? 'text-[#FF6B35]' : 'text-[#6C757D] hover:text-[#FF6B35]'
  }`;

export const AppShell = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <header className="sticky top-0 z-50 flex h-[70px] items-center justify-between border-b border-[#E9ECEF] bg-white px-6 md:px-12">
        <div className="flex items-center gap-10">
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
          <Button variant="secondary" size="sm" onClick={() => navigate('/auth')}>
            Login
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </header>
      <main className="bg-gradient-to-b from-white to-[#FFE5D9]">
        <Outlet />
      </main>
    </div>
  );
};
