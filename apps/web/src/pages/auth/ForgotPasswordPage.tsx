import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, TextInput } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/update-password`;
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setStatus('sending');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message || 'Could not send reset email.');
      setStatus('idle');
      return;
    }

    setStatus('sent');
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <Link to="/auth" className="text-sm font-semibold text-[#C045FF]">
          ← Back to login
        </Link>
        <Button variant="secondary" size="sm" onClick={() => navigate('/')}
        >
          Home
        </Button>
      </div>

      <Card elevated className="p-5">
        <h1 className="text-xl font-semibold text-[#212529]">Reset your password</h1>
        <p className="mt-1 text-sm text-[#6C757D]">
          Enter your email and we’ll send you a link to set a new password.
        </p>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error ? <p className="text-xs font-medium text-[#DC3545]">{error}</p> : null}

          {status === 'sent' ? (
            <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-3 text-sm text-[#6C757D]">
              Reset link sent. Please check your inbox (and spam folder).
            </div>
          ) : null}

          <Button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
