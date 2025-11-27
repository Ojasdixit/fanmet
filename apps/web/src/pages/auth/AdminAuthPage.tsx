import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextInput, Card } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';

export function AdminAuthPage() {
  const { login, isAuthenticated, user, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
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
      const authUser = await login({ email, password });

      if (authUser.role !== 'admin') {
        setFormError('This account is not an admin.');
        await logout();
        return;
      }

      navigate('/admin', { replace: true });
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
              <span className="h-2 w-2 rounded-full bg-[#C045FF]" /> ADMIN ACCESS
            </span>
            <h1 className="text-2xl font-bold leading-tight text-[#050014] md:text-3xl lg:text-4xl">
              Sign in to your FanMeet admin console
            </h1>
            <p className="text-xs text-[#4B445F] md:text-sm lg:text-base">
              Manage creators, fans, events, payouts, and platform settings from a single secure dashboard.
            </p>
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
            <h2 className="text-2xl font-bold text-[#212529] md:text-3xl">Admin sign in</h2>
            <p className="text-sm text-[#6C757D]">
              Use your admin credentials to access the platform controls.
            </p>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <TextInput
                label="Admin email"
                placeholder="you@company.com"
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
            </div>

            {formError ? <p className="text-[11px] font-medium text-[#DC3545]">{formError}</p> : null}

            <Button type="submit" size="md" className="h-9 text-[13px]" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in as admin'}
            </Button>

            <Card className="mt-2 border-[#FFE5D9] bg-[#FFF8F3] p-3 text-xs text-[#6C757D]">
              Admin access is restricted. If you believe you should have access, contact the platform owner.
            </Card>
          </form>
        </div>
      </section>
    </div>
  );
}
