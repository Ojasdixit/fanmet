import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, TextInput } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'saving' | 'saved'>('checking');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus('idle');
        setError('This reset link is invalid or expired. Please request a new one.');
        return;
      }
      setStatus('ready');
    };

    void checkSession();
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim() || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('saving');
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Could not update password.');
      setStatus('ready');
      return;
    }

    setStatus('saved');
    setTimeout(() => navigate('/auth', { replace: true }), 800);
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
        <h1 className="text-xl font-semibold text-[#212529]">Set a new password</h1>
        <p className="mt-1 text-sm text-[#6C757D]">Choose a strong password you haven’t used before.</p>

        {error ? <p className="mt-3 text-xs font-medium text-[#DC3545]">{error}</p> : null}

        {status === 'idle' ? (
          <div className="mt-4">
            <Button onClick={() => navigate('/auth/forgot-password')}>Request new reset link</Button>
          </div>
        ) : (
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
            <TextInput
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
            <TextInput
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <Button type="submit" disabled={status !== 'ready'}>
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Update password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
