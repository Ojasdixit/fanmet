import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextInput, Card } from '@fanmeet/ui';
import { classNames } from '@fanmeet/utils';

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
  const [selectedRole, setSelectedRole] = useState<'fan' | 'creator' | 'admin'>('fan');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setFormError('Please enter your email to continue.');
      return;
    }

    setFormError('');

    const redirectMap: Record<typeof selectedRole, string> = {
      fan: '/fan',
      creator: '/creator',
      admin: '/admin',
    };

    navigate(redirectMap[selectedRole]);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-hidden bg-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="relative hidden w-full items-center justify-center bg-gradient-to-br from-[#FF8C42] via-[#FF6B35] to-[#FF4F1F] p-12 text-white md:flex">
        <div className="relative z-10 flex max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium tracking-wide">
              <span className="h-2 w-2 rounded-full bg-white" /> LIVE MOMENTS • REAL CONNECTIONS
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Bring creators and fans together through premium digital meetups
            </h1>
            <p className="text-base text-white/80 md:text-lg">
              Secure bidding, curated events, and rich creator tooling packaged in one vibrant platform.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {highlightStats.map((item) => (
              <Card
                key={item.title}
                className="bg-white/10 backdrop-blur-md transition hover:bg-white/20"
                elevated
              >
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Creators collaborating"
              className="h-64 w-full rounded-3xl object-cover shadow-2xl shadow-[#FF4F1F]/40"
            />
            <div className="absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-3xl bg-white/95 p-6 shadow-xl shadow-[#FF4F1F]/20">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B35]/10 text-2xl">🎥</div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#FF6B35]">Creator Spotlight</p>
                  <p className="text-sm text-[#212529]">“My fans love our micro-meet sessions—it feels personal and seamless.”</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </section>

      <section className="flex items-center justify-center px-6 py-10 md:px-12">
        <div className="flex w-full max-w-md flex-col gap-10">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <Link to="/" className="text-sm font-semibold text-[#FF6B35]">
              ← Back to home
            </Link>
            <h2 className="text-3xl font-bold text-[#212529] md:text-4xl">Welcome back</h2>
            <p className="text-sm text-[#6C757D]">
              Sign in to manage your events, track bids, and stay close to your community.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[#212529]">Continue as</span>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {(
                  [
                    { label: 'Fan', value: 'fan' as const, emoji: '🎟️' },
                    { label: 'Creator', value: 'creator' as const, emoji: '🎨' },
                    { label: 'Admin', value: 'admin' as const, emoji: '🛠️' },
                  ] satisfies Array<{ label: string; value: 'fan' | 'creator' | 'admin'; emoji: string }>
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedRole(option.value)}
                    className={classNames(
                      'flex items-center gap-3 rounded-[14px] border-2 px-4 py-3 text-left transition-all',
                      'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
                      selectedRole === option.value
                        ? 'border-[#FF6B35] bg-[#FFE5D9] text-[#212529]'
                        : 'border-[#E9ECEF] bg-white text-[#6C757D] hover:border-[#FF6B35]/40'
                    )}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-[#6C757D]">
                        {option.value === 'fan' && 'Bid, join meets, and manage your sessions.'}
                        {option.value === 'creator' && 'Host immersive experiences and track earnings.'}
                        {option.value === 'admin' && 'Oversee creators, events, and payouts.'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#6C757D]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
                  Remember me
                </label>
                <Link to="#" className="font-medium text-[#FF6B35] hover:text-[#FF4F1F]">
                  Forgot password?
                </Link>
              </div>
            </div>

            {formError ? <p className="text-sm font-medium text-[#DC3545]">{formError}</p> : null}

            <Button type="submit" size="lg">
              Continue with email
            </Button>

            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-[#E9ECEF]" />
              <span className="text-sm font-medium text-[#6C757D]">or</span>
              <span className="h-px flex-1 bg-[#E9ECEF]" />
            </div>

            <div className="grid gap-3">
              <Button variant="secondary" size="lg">
                Continue with Google
              </Button>
              <Button variant="ghost" size="lg">
                Continue with Apple
              </Button>
            </div>
          </form>

          <div className="rounded-2xl bg-[#F8F9FA] p-5 text-sm text-[#6C757D]">
            <p className="font-medium text-[#212529]">New here?</p>
            <p className="mt-1">
              Continue to create an account and choose whether you are joining as a fan, creator, or admin team member.
            </p>
          </div>

          <p className="text-xs text-[#ADB5BD]">
            By continuing, you agree to our{' '}
            <Link to="#" className="font-medium text-[#FF6B35]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="#" className="font-medium text-[#FF6B35]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
