import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Settings {
  platform_name: string;
  support_email: string;
  support_phone: string;
  default_timezone: string;
  maintenance_mode: boolean;
  welcome_message: string;
  default_commission: number;
  cancellation_window: number;
  auto_refund_percentage: number;
}

export function AdminSettingsGeneral() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    platform_name: 'FanMeet Five',
    support_email: 'support@fanmeet.com',
    support_phone: '+91 98765 43210',
    default_timezone: 'Asia/Kolkata',
    maintenance_mode: false,
    welcome_message: '',
    default_commission: 10,
    cancellation_window: 12,
    auto_refund_percentage: 90,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', [
            'platform_name', 'support_email', 'support_phone', 'default_timezone',
            'maintenance_mode', 'welcome_message', 'default_commission',
            'cancellation_window', 'auto_refund_percentage'
          ]);

        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        const newSettings: Record<string, any> = { ...settings };
        for (const row of (data ?? []) as any[]) {
          try {
            newSettings[row.key] = JSON.parse(row.value);
          } catch {
            newSettings[row.key] = row.value;
          }
        }
        setSettings(newSettings as Settings);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: update.value, updated_by: update.updated_by, updated_at: update.updated_at })
          .eq('key', update.key);

        if (error) {
          console.error('Error updating setting:', update.key, error);
        }
      }

      alert('Settings saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const newValue = !settings.maintenance_mode;
    const confirmed = window.confirm(
      `Are you sure you want to ${newValue ? 'enable' : 'disable'} maintenance mode?`
    );
    if (!confirmed) return;

    setSettings({ ...settings, maintenance_mode: newValue });

    const { error } = await supabase
      .from('platform_settings')
      .update({ value: JSON.stringify(newValue), updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq('key', 'maintenance_mode');

    if (error) {
      console.error('Error toggling maintenance mode:', error);
      setSettings({ ...settings, maintenance_mode: !newValue });
      alert('Failed to update maintenance mode');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">General Settings</h1>
          <p className="text-sm text-[#6C757D]">Configure platform basics, support contacts, and global defaults.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader title="Platform Info" subtitle="Branding and contact details" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Platform Name"
            value={settings.platform_name}
            onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
          />
          <TextInput
            label="Support Email"
            value={settings.support_email}
            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
          />
          <TextInput
            label="Support Phone"
            value={settings.support_phone}
            onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
          />
          <TextInput
            label="Default Timezone"
            value={settings.default_timezone}
            onChange={(e) => setSettings({ ...settings, default_timezone: e.target.value })}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Welcome Message"
              rows={3}
              placeholder="Displayed to new users"
              value={settings.welcome_message}
              onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Sessions & Commission" subtitle="Monetization and scheduling settings" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Cancellation Window (hours)"
            type="number"
            value={settings.cancellation_window.toString()}
            onChange={(e) => setSettings({ ...settings, cancellation_window: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Default Commission (%)"
            type="number"
            value={settings.default_commission.toString()}
            onChange={(e) => setSettings({ ...settings, default_commission: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Auto Refund Percentage"
            type="number"
            value={settings.auto_refund_percentage.toString()}
            onChange={(e) => setSettings({ ...settings, auto_refund_percentage: parseInt(e.target.value) || 0 })}
          />
          <div className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
            <div>
              <p className="text-sm font-semibold text-[#212529]">
                Auto Refunds: {settings.auto_refund_percentage}%
              </p>
              <p className="text-xs text-[#6C757D]">
                Retain {100 - settings.auto_refund_percentage}% commission from non-winning bids
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Maintenance Mode" subtitle="Temporarily pause user access during updates" />
        <CardContent className={`flex flex-wrap items-center justify-between gap-4 rounded-[16px] border p-5 ${
          settings.maintenance_mode ? 'border-[#DC3545] bg-[#DC3545]/10' : 'border-[#28A745] bg-[#28A745]/10'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${settings.maintenance_mode ? 'text-[#DC3545]' : 'text-[#28A745]'}`}>
              Maintenance mode is currently {settings.maintenance_mode ? 'ON' : 'OFF'}
            </p>
            <p className="text-xs text-[#6C757D]">
              {settings.maintenance_mode
                ? 'Users cannot access the platform. Disable to restore access.'
                : 'Platform is operational. Enable to block user access.'}
            </p>
          </div>
          <Button
            variant={settings.maintenance_mode ? 'secondary' : 'danger'}
            onClick={handleToggleMaintenance}
          >
            {settings.maintenance_mode ? 'Disable Maintenance' : 'Enable Maintenance'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
