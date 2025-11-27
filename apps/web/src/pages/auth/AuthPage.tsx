import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, TextInput, Card } from '@fanmeet/ui';
import { classNames } from '@fanmeet/utils';
import { useAuth } from '../../contexts/AuthContext';

const highlightStats = [
  {
    title: '300+ creators onboarded',
    description: 'Host exclusive AMA sessions, workshops, and meet & greets.',
  },
  {
    title: '10k+ fan requests',
    description: 'Fans are lining up for authentic, small-group interactions.',
  },
];

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<'fan' | 'creator'>('fan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectMap: Record<'fan' | 'creator' | 'admin', string> = {
        fan: '/fan',
        creator: '/creator',
        admin: '/admin',
      };
      navigate(redirectMap[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const redirectMap: Record<'fan' | 'creator' | 'admin', string> = {
        fan: '/fan',
        creator: '/creator',
        admin: '/admin',
      };

      const authUser =
        mode === 'signup'
          ? await signup({ email, password, role: selectedRole })
          : await login({ email, password });

      const redirectParam = searchParams.get('redirect');
      const defaultTarget = redirectMap[authUser.role];
      const target = redirectParam && redirectParam.trim().length > 0 ? redirectParam : defaultTarget;

      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-70px)] grid-cols-1 bg-gradient-to-b from-white to-[#F8F0FF] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="relative hidden h-full w-full items-start justify-start bg-gradient-to-br from-[#FCE7FF] via-[#F4E6FF] to-[#E5DEFF] px-10 py-9 text-[#050014] md:flex">
        <div className="relative z-10 mx-auto flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium tracking-wide text-[#C045FF]">
              <span className="h-2 w-2 rounded-full bg-[#C045FF]" /> LIVE MOMENTS • REAL CONNECTIONS
            </span>
            <h1 className="text-2xl font-bold leading-tight text-[#050014] md:text-3xl lg:text-4xl">
              Bring creators and fans together through premium digital meetups
            </h1>
            <p className="text-xs text-[#4B445F] md:text-sm lg:text-base">
              Secure bidding, curated events, and rich creator tooling packaged in one vibrant platform.
            </p>
          </div>
          {/* Stats + image only on extra-large screens to save vertical space on laptops and desktops */}
          <div className="hidden xl:flex xl:flex-col xl:gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {highlightStats.map((item) => (
                <Card
                  key={item.title}
                  className="bg-white/10 backdrop-blur-md transition hover:bg-white/20"
                  elevated
                >
                  <div className="flex flex-col gap-2 p-4">
                    <h3 className="text-lg font-semibold text-[#050014]">{item.title}</h3>
                    <p className="text-sm text-[#4B445F]">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="relative mt-2">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                alt="Creators collaborating"
                className="h-36 w-full rounded-3xl object-cover shadow-2xl shadow-[#C045FF]/40"
              />
              <div className="absolute bottom-2 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl bg-white/95 p-3 shadow-xl shadow-[#C045FF]/15">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C045FF]/10 text-2xl">🎥</div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">Creator Spotlight</p>
                    <p className="text-sm text-[#212529]">“My fans love our micro-meet sessions—it feels personal and seamless.”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </section>

      <section className="flex items-start justify-center px-4 py-4 md:px-6 md:py-4">
        <div className="flex w-full max-w-md flex-col gap-4 md:gap-3.5">
          <div className="flex flex-col gap-1.5 text-center md:text-left">
            <Link to="/" className="text-sm font-semibold text-[#C045FF]">
              ← Back to home
            </Link>
            <h2 className="text-2xl font-bold text-[#212529] md:text-3xl">
              {mode === 'login' ? 'Welcome back' : 'Create your FanMeet account'}
            </h2>
            <p className="hidden text-sm text-[#6C757D] lg:block">
              {mode === 'login'
                ? 'Sign in to manage your events, track bids, and stay close to your community.'
                : 'Sign up once to access your fan or creator dashboard and manage all your sessions.'}
            </p>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between rounded-full bg-[#F1F3F5] p-1 text-xs font-medium text-[#495057]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError('');
                }}
                className={classNames(
                  'flex-1 rounded-full px-3 py-1.5 transition-all',
                  mode === 'login' ? 'bg-white text-[#212529] shadow-sm' : 'bg-transparent',
                )}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setFormError('');
                }}
                className={classNames(
                  'flex-1 rounded-full px-3 py-1.5 transition-all',
                  mode === 'signup' ? 'bg-white text-[#212529] shadow-sm' : 'bg-transparent',
                )}
              >
                Sign up
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {mode === 'signup' && (
                <>
                  <span className="text-sm font-medium text-[#212529]">Sign up as</span>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { label: 'Fan', value: 'fan' as const, emoji: '🎟️' },
                        { label: 'Creator', value: 'creator' as const, emoji: '🎨' },
                      ] satisfies Array<{ label: string; value: 'fan' | 'creator'; emoji: string }>
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value)}
                        className={classNames(
                          'flex items-center gap-2.5 rounded-[14px] border-2 px-3.5 py-2.5 text-left transition-all',
                          'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
                          selectedRole === option.value
                            ? 'border-[#C045FF] bg-[#F4E6FF] text-[#212529]'
                            : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#C045FF]/40',
                        )}
                      >
                        <span className="text-lg">{option.emoji}</span>
                        <div>
                          <p className="text-[13px] font-semibold">{option.label}</p>
                          <p className="text-[11px] text-[#6C757D]">
                            {option.value === 'fan' && 'Bid, join meets, and manage your sessions.'}
                            {option.value === 'creator' && 'Host immersive experiences and track earnings.'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextInput
                label="Password"
                placeholder="Enter your password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#6C757D]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
                  Remember me
                </label>
                <Link to="#" className="font-medium text-[#C045FF] hover:text-[#8B3FFF]">
                  Forgot password?
                </Link>
              </div>
            </div>

            {formError ? <p className="text-[11px] font-medium text-[#DC3545]">{formError}</p> : null}

            <Button type="submit" size="md" className="h-9 text-[13px]">
              Continue with email
            </Button>

            <div className="flex items-center gap-2.5">
              <span className="h-px flex-1 bg-[#E9ECEF]" />
              <span className="text-sm font-medium text-[#6C757D]">or</span>
              <span className="h-px flex-1 bg-[#E9ECEF]" />
            </div>

            <div className="grid gap-2">
              <Button variant="secondary" size="md" className="h-9 text-[13px]">
                Continue with Google
              </Button>
              <Button variant="ghost" size="md" className="h-9 text-[13px]">
                Continue with Apple
              </Button>
            </div>
          </form>

          <p className="hidden text-xs text-[#ADB5BD] lg:block">
            By continuing, you agree to our{' '}
            <Link to="#" className="font-medium text-[#C045FF]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="#" className="font-medium text-[#C045FF]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
