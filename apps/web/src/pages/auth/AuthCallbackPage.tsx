import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';
import type { UserRole } from '../../contexts/AuthContext';

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

        const roleRedirectMap: Record<UserRole, string> = {
          fan: '/fan',
          creator: '/creator',
          admin: '/admin',
        };

        let targetPath: string | null = null;

        const redirectParam = params.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
          targetPath = redirectParam;
        }

        if (!targetPath) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            setStatus('error');
            setMessage('Unable to load your account. Please sign in again.');
            return;
          }

          const { data: userRow } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          const inferredRole = (userRow?.role || user.user_metadata?.role || 'fan') as UserRole;
          targetPath = roleRedirectMap[inferredRole] ?? '/fan';
        }

        navigate(targetPath ?? '/fan', { replace: true });
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
