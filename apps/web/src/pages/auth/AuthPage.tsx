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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [isFanSignupOpen, setIsFanSignupOpen] = useState(false);
  const [isCreatorSignupOpen, setIsCreatorSignupOpen] = useState(false);
  const [fanSignup, setFanSignup] = useState({ email: '', password: '', confirmPassword: '' });
  const [creatorSignup, setCreatorSignup] = useState({ email: '', password: '', confirmPassword: '', bio: '' });
  const [fanSignupStatus, setFanSignupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [creatorSignupStatus, setCreatorSignupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isFanSubmitting, setIsFanSubmitting] = useState(false);
  const [isCreatorSubmitting, setIsCreatorSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, resendVerificationEmail, loginWithGoogle, isAuthenticated, user } = useAuth();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [oauthError, setOauthError] = useState('');

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
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const redirectMap: Record<'fan' | 'creator' | 'admin', string> = {
        fan: '/fan',
        creator: '/creator',
        admin: '/admin',
      };

      const authUser = await login({ email, password });

      const redirectParam = searchParams.get('redirect');
      const defaultTarget = redirectMap[authUser.role];
      const target = redirectParam && redirectParam.trim().length > 0 ? redirectParam : defaultTarget;

      navigate(target, { replace: true });
    } catch (error) {
      let message = 'Something went wrong. Please try again.';
      if (error instanceof Error) {
        message = error.message;
        if (/already\s+(registered|exists)/i.test(message) || /user\s+already/i.test(message)) {
          setShowExistingAccountModal(true);
        }
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmitting) return;
    setOauthError('');
    setIsGoogleSubmitting(true);
    try {
      const redirectParam = searchParams.get('redirect');
      await loginWithGoogle({
        redirectTo: redirectParam && redirectParam.startsWith('/') ? redirectParam : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not start Google sign-in. Please try again.';
      setOauthError(message);
      setIsGoogleSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setFormError('');
    setFormSuccess('');
    if (!email.trim()) {
      setFormError('Enter your email first, then click resend.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resendVerificationEmail({ email: email.trim() });
      setFormSuccess('Verification email sent. Please check your inbox.');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not resend verification email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async <T extends { email: string; password: string; confirmPassword: string }>(
    role: 'fan' | 'creator',
    form: T,
    setForm: React.Dispatch<React.SetStateAction<T>>,
    setStatus: (value: { type: 'success' | 'error'; message: string } | null) => void,
    setOpen: (value: boolean) => void,
    setLoading: (value: boolean) => void,
  ) => {
    if (!form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setStatus(null);
    setLoading(true);

    try {
      await signup({ email: form.email.trim(), password: form.password, role });
      setStatus({
        type: 'success',
        message: 'Account created! Please verify your email to continue.',
      });
      setForm({ ...form, password: '', confirmPassword: '' });
    } catch (error) {
      let message = 'Could not complete signup.';
      if (error instanceof Error) {
        message = error.message;
        if (/already\s+(registered|exists)/i.test(message) || /user\s+already/i.test(message)) {
          setShowExistingAccountModal(true);
          setOpen(false);
        }
      }
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showExistingAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4E6FF] text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-semibold text-[#050014]">Account already exists</h3>
            <p className="mt-2 text-sm text-[#6C757D]">
              Looks like {email || 'this email'} is already registered. Try logging in, or use another email to create a
              new account.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setMode('login');
                  setShowExistingAccountModal(false);
                }}
              >
                Go to login
              </Button>
              <Button variant="secondary" onClick={() => setShowExistingAccountModal(false)}>
                Use a different email
              </Button>
            </div>
          </div>
        </div>
      )}
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
              <h2 className="text-2xl font-bold text-[#212529] md:text-3xl">Welcome back</h2>
              <p className="hidden text-sm text-[#6C757D] lg:block">
                Sign in to manage your events, track bids, and stay close to your community.
              </p>
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
                  <Link to="/auth/forgot-password" className="font-medium text-[#C045FF] hover:text-[#8B3FFF]">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {formError ? <p className="text-[11px] font-medium text-[#DC3545]">{formError}</p> : null}
              {formSuccess ? <p className="text-[11px] font-medium text-[#198754]">{formSuccess}</p> : null}

              <Button
                type="submit"
                size="md"
                className="h-9 text-[13px]"
                disabled={isSubmitting}
              >
                Continue with email
              </Button>

              {mode === 'login' ? (
                <button
                  type="button"
                  className="text-left text-[12px] font-medium text-[#C045FF] hover:text-[#8B3FFF]"
                  onClick={handleResendVerification}
                  disabled={isSubmitting}
                >
                  Resend verification email
                </button>
              ) : null}

              <div className="flex items-center gap-2.5">
                <span className="h-px flex-1 bg-[#E9ECEF]" />
                <span className="text-sm font-medium text-[#6C757D]">or</span>
                <span className="h-px flex-1 bg-[#E9ECEF]" />
              </div>

              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="h-9 text-[13px]"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isGoogleSubmitting}
                >
                  {isGoogleSubmitting ? 'Connecting to Google…' : 'Continue with Google'}
                </Button>
                <Button variant="ghost" size="md" className="h-9 text-[13px]">
                  Continue with Apple
                </Button>
              </div>

              {oauthError ? <p className="text-[11px] font-medium text-[#DC3545]">{oauthError}</p> : null}
            </form>

            <div className="rounded-2xl border border-dashed border-[#E9ECEF] bg-white/60 p-4">
              <p className="text-sm font-semibold text-[#212529]">New here?</p>
              <p className="text-xs text-[#6C757D]">Choose your path to create a FanMeet account.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => setIsFanSignupOpen(true)}>
                  Sign up as Fan
                </Button>
                <Button onClick={() => setIsCreatorSignupOpen(true)}>Sign up as Creator</Button>
              </div>
            </div>

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

      {isFanSignupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#050014]">Join as a Fan</h3>
                <p className="text-xs text-[#6C757D]">Bid on events, join virtual meets, and build connections.</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-[#E9ECEF] px-3 py-1 text-sm text-[#343A40] hover:bg-[#F8F9FA]"
                onClick={() => {
                  setIsFanSignupOpen(false);
                  setFanSignupStatus(null);
                }}
              >
                ✕
              </button>
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignupSubmit(
                  'fan',
                  fanSignup,
                  setFanSignup,
                  setFanSignupStatus,
                  setIsFanSignupOpen,
                  setIsFanSubmitting,
                );
              }}
            >
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                required
                value={fanSignup.email}
                onChange={(event) => setFanSignup((prev) => ({ ...prev, email: event.target.value }))}
              />
              <TextInput
                label="Password"
                type="password"
                required
                value={fanSignup.password}
                onChange={(event) => setFanSignup((prev) => ({ ...prev, password: event.target.value }))}
              />
              <TextInput
                label="Confirm Password"
                type="password"
                required
                value={fanSignup.confirmPassword}
                onChange={(event) => setFanSignup((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />

              {fanSignupStatus ? (
                <p
                  className={classNames(
                    'text-[11px] font-medium',
                    fanSignupStatus.type === 'success' ? 'text-[#198754]' : 'text-[#DC3545]',
                  )}
                >
                  {fanSignupStatus.message}
                </p>
              ) : null}

              <Button type="submit" disabled={isFanSubmitting}>
                {isFanSubmitting ? 'Creating account…' : 'Create fan account'}
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {isCreatorSignupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#050014]">Join as a Creator</h3>
                <p className="text-xs text-[#6C757D]">
                  Host intimate sessions, monetize meets, and access creator tooling.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-[#E9ECEF] px-3 py-1 text-sm text-[#343A40] hover:bg-[#F8F9FA]"
                onClick={() => {
                  setIsCreatorSignupOpen(false);
                  setCreatorSignupStatus(null);
                }}
              >
                ✕
              </button>
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignupSubmit(
                  'creator',
                  creatorSignup,
                  setCreatorSignup,
                  setCreatorSignupStatus,
                  setIsCreatorSignupOpen,
                  setIsCreatorSubmitting,
                );
              }}
            >
              <TextInput
                label="Creator email"
                placeholder="studio@you.com"
                type="email"
                required
                value={creatorSignup.email}
                onChange={(event) => setCreatorSignup((prev) => ({ ...prev, email: event.target.value }))}
              />
              <TextInput
                label="Password"
                type="password"
                required
                value={creatorSignup.password}
                onChange={(event) => setCreatorSignup((prev) => ({ ...prev, password: event.target.value }))}
              />
              <TextInput
                label="Confirm Password"
                type="password"
                required
                value={creatorSignup.confirmPassword}
                onChange={(event) => setCreatorSignup((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
              <TextInput
                label="Tell us about your audience"
                placeholder="Optional - e.g. 250k IG, podcast host, etc."
                value={creatorSignup.bio}
                onChange={(event) => setCreatorSignup((prev) => ({ ...prev, bio: event.target.value }))}
              />

              {creatorSignupStatus ? (
                <p
                  className={classNames(
                    'text-[11px] font-medium',
                    creatorSignupStatus.type === 'success' ? 'text-[#198754]' : 'text-[#DC3545]',
                  )}
                >
                  {creatorSignupStatus.message}
                </p>
              ) : null}

              <Button type="submit" disabled={isCreatorSubmitting}>
                {isCreatorSubmitting ? 'Creating creator profile…' : 'Apply as creator'}
              </Button>
              <p className="text-[11px] text-[#6C757D]">
                Creators undergo a quick review before gaining full access. We’ll email you within 24 hours.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
