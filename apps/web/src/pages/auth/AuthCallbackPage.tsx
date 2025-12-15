import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    const finish = async () => {
      try {
        const code = params.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('error');
            setMessage(error.message || 'Could not complete authentication.');
            return;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          setStatus('error');
          setMessage('No session found. Please try logging in again.');
          return;
        }

        setStatus('success');
        setMessage('Success! Redirecting…');
        setTimeout(() => navigate('/auth', { replace: true }), 800);
      } catch {
        setStatus('error');
        setMessage('Could not complete authentication.');
      }
    };

    void finish();
  }, [navigate, params]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
      <Card elevated className="p-5">
        <h1 className="text-xl font-semibold text-[#212529]">Auth Callback</h1>
        <p className="mt-2 text-sm text-[#6C757D]">{message}</p>

        {status === 'error' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/auth', { replace: true })}>Go to login</Button>
            <Button variant="secondary" onClick={() => navigate('/', { replace: true })}>
              Home
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
