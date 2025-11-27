import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  accountStatus: string;
}

interface SecuritySettings {
  require_2fa: boolean;
  session_timeout: number;
  password_min_length: number;
}

export function AdminSettingsSecurity() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    require_2fa: true,
    session_timeout: 45,
    password_min_length: 12,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch admin users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, role, created_at, account_status')
          .eq('role', 'admin');

        if (usersData) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', usersData.map((u: any) => u.id));

          const profileMap = new Map<string, string>();
          for (const p of (profilesData ?? []) as any[]) {
            profileMap.set(p.user_id, p.display_name || 'Admin');
          }

          const mapped: AdminUser[] = usersData.map((u: any) => ({
            id: u.id,
            email: u.email,
            displayName: profileMap.get(u.id) ?? u.email.split('@')[0],
            createdAt: u.created_at,
            accountStatus: u.account_status ?? 'active',
          }));

          setAdmins(mapped);
        }

        // Fetch security settings
        const { data: settingsData } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['require_2fa', 'session_timeout', 'password_min_length']);

        if (settingsData) {
          const newSettings: Record<string, any> = { ...settings };
          for (const row of settingsData as any[]) {
            try {
              newSettings[row.key] = JSON.parse(row.value);
            } catch {
              newSettings[row.key] = row.value;
            }
          }
          setSettings(newSettings as SecuritySettings);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: 'require_2fa', value: JSON.stringify(settings.require_2fa) },
        { key: 'session_timeout', value: JSON.stringify(settings.session_timeout) },
        { key: 'password_min_length', value: JSON.stringify(settings.password_min_length) },
      ];

      for (const update of updates) {
        await supabase
          .from('platform_settings')
          .update({ value: update.value, updated_by: user?.id, updated_at: new Date().toISOString() })
          .eq('key', update.key);
      }

      alert('Security settings saved!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspendAdmin = async (adminId: string) => {
    if (adminId === user?.id) {
      alert('You cannot suspend yourself');
      return;
    }

    const confirmed = window.confirm('Suspend this admin account?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('users')
      .update({ account_status: 'suspended' })
      .eq('id', adminId);

    if (error) {
      console.error('Error suspending admin:', error);
      alert('Failed to suspend admin');
      return;
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, accountStatus: 'suspended' } : a))
    );
  };

  const handleReactivateAdmin = async (adminId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ account_status: 'active' })
      .eq('id', adminId);

    if (error) {
      console.error('Error reactivating admin:', error);
      alert('Failed to reactivate admin');
      return;
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, accountStatus: 'active' } : a))
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Security &amp; Access</h1>
          <p className="text-sm text-[#6C757D]">Control admin access and authentication policies.</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader title="Access Policies" subtitle="Security requirements for admin accounts" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Session Timeout (minutes)"
            type="number"
            value={settings.session_timeout.toString()}
            onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Minimum Password Length"
            type="number"
            value={settings.password_min_length.toString()}
            onChange={(e) => setSettings({ ...settings, password_min_length: parseInt(e.target.value) || 8 })}
          />
          <label className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-[#212529]">Require 2FA for all admins</p>
              <p className="text-xs text-[#6C757D]">Mandatory via authenticator app or SMS backup.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.require_2fa ? 'success' : 'warning'}>
                {settings.require_2fa ? 'Enabled' : 'Disabled'}
              </Badge>
              <input
                type="checkbox"
                checked={settings.require_2fa}
                onChange={(e) => setSettings({ ...settings, require_2fa: e.target.checked })}
                className="h-5 w-5 rounded border-[#CED4DA]"
              />
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Admin Users" subtitle={`${admins.length} admin accounts`} />
        <CardContent className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div>
                <p className="font-semibold">{admin.displayName}</p>
                <p className="text-[#6C757D]">{admin.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={admin.accountStatus === 'active' ? 'success' : 'danger'}>
                  {admin.accountStatus}
                </Badge>
                {admin.id !== user?.id && (
                  admin.accountStatus === 'active' ? (
                    <Button size="sm" variant="ghost" onClick={() => handleSuspendAdmin(admin.id)}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => handleReactivateAdmin(admin.id)}>
                      Reactivate
                    </Button>
                  )
                )}
                {admin.id === user?.id && (
                  <Badge variant="primary">You</Badge>
                )}
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading...' : 'No admin users found'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Security Overview" subtitle="Current security status" />
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className={`rounded-[16px] border p-4 text-sm ${settings.require_2fa ? 'border-[#28A745]/30 bg-[#28A745]/10 text-[#28A745]' : 'border-[#DC3545]/30 bg-[#DC3545]/10 text-[#DC3545]'}`}>
            <p className="font-semibold">2FA Status</p>
            <p className="text-xs">{settings.require_2fa ? 'Required for all admins' : 'Not required - Enable for better security'}</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm text-[#212529]">
            <p className="font-semibold">Session Timeout</p>
            <p className="text-xs text-[#6C757D]">{settings.session_timeout} minutes</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4 text-sm text-[#212529]">
            <p className="font-semibold">Active Admins</p>
            <p className="text-xs text-[#6C757D]">{admins.filter((a) => a.accountStatus === 'active').length} of {admins.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
