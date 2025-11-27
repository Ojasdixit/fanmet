import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';

interface NotificationRule {
  id: string;
  triggerEvent: string;
  channels: string[];
  templateId: string | null;
  status: string;
}

interface Channel {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultChannels: Channel[] = [
  { id: 'email', label: 'Email', description: 'Transactional and marketing emails', enabled: true },
  { id: 'push', label: 'Push Notifications', description: 'Mobile push via FanMeet app', enabled: true },
  { id: 'sms', label: 'SMS', description: 'Critical alerts and OTP delivery', enabled: false },
  { id: 'whatsapp', label: 'WhatsApp', description: 'High priority creator alerts', enabled: false },
];

const triggerOptions = [
  'bid_placed', 'bid_won', 'bid_refunded', 'event_created', 'event_cancelled',
  'withdrawal_approved', 'withdrawal_rejected', 'meet_scheduled', 'meet_completed',
  'support_ticket_update', 'dispute_escalated', 'creator_approved'
];

export function AdminSettingsNotifications() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [channels, setChannels] = useState<Channel[]>(defaultChannels);
  const [isLoading, setIsLoading] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newChannels, setNewChannels] = useState<string[]>(['email']);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('trigger_event', { ascending: true });

      if (error) {
        console.error('Error fetching notification rules:', error);
        return;
      }

      const mapped: NotificationRule[] = (data ?? []).map((r: any) => ({
        id: r.id,
        triggerEvent: r.trigger_event,
        channels: r.channels ?? [],
        templateId: r.template_id,
        status: r.status,
      }));

      setRules(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const handleToggleChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleCreateRule = async () => {
    if (!newTrigger) {
      alert('Select a trigger event');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('notification_rules').insert({
        trigger_event: newTrigger,
        channels: newChannels,
        status: 'active',
      });

      if (error) {
        console.error('Error creating rule:', error);
        alert('Failed to create rule. It may already exist.');
        return;
      }

      await fetchRules();
      setNewTrigger('');
      alert('Rule created successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRuleStatus = async (rule: NotificationRule) => {
    const newStatus = rule.status === 'active' ? 'disabled' : 'active';
    const { error } = await supabase
      .from('notification_rules')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', rule.id);

    if (error) {
      console.error('Error updating rule:', error);
      alert('Failed to update rule');
      return;
    }

    await fetchRules();
  };

  const handleDeleteRule = async (ruleId: string) => {
    const confirmed = window.confirm('Delete this notification rule?');
    if (!confirmed) return;

    const { error } = await supabase.from('notification_rules').delete().eq('id', ruleId);

    if (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
      return;
    }

    await fetchRules();
  };

  const formatTrigger = (trigger: string) =>
    trigger.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Notification Settings</h1>
          <p className="text-sm text-[#6C757D]">Control channels, templates, and delivery rules for platform alerts.</p>
        </div>
        <Badge variant="primary">{rules.length} rules configured</Badge>
      </div>

      <Card>
        <CardHeader title="Channels" subtitle="Enable or disable notification channels" />
        <CardContent className="space-y-3">
          {channels.map((channel) => (
            <label
              key={channel.id}
              className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529] cursor-pointer"
            >
              <div>
                <p className="font-semibold">{channel.label}</p>
                <p className="text-xs text-[#6C757D]">{channel.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={channel.enabled ? 'success' : 'warning'}>
                  {channel.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <input
                  type="checkbox"
                  checked={channel.enabled}
                  onChange={() => handleToggleChannel(channel.id)}
                  className="h-5 w-5 rounded border-[#CED4DA]"
                />
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Automated Rules" subtitle="Template and channel mapping per trigger" />
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Trigger</th>
                <th className="border-b border-[#E9ECEF] py-3">Channel(s)</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529] font-medium">
                    {formatTrigger(rule.triggerEvent)}
                  </td>
                  <td className="py-3 text-[#6C757D]">
                    {rule.channels.length > 0 ? rule.channels.join(', ') : '-'}
                  </td>
                  <td className="py-3">
                    <Badge variant={rule.status === 'active' ? 'success' : 'warning'}>
                      {rule.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleRuleStatus(rule)}
                      >
                        {rule.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#6C757D]">
                    {isLoading ? 'Loading...' : 'No notification rules configured'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Add New Rule" subtitle="Configure a new notification trigger" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6C757D] mb-1">
              Trigger Event
            </label>
            <select
              className="w-full rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm"
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
            >
              <option value="">Select trigger...</option>
              {triggerOptions.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {formatTrigger(trigger)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6C757D] mb-1">
              Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {['email', 'push', 'sms'].map((ch) => (
                <label key={ch} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={newChannels.includes(ch)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewChannels([...newChannels, ch]);
                      } else {
                        setNewChannels(newChannels.filter((c) => c !== ch));
                      }
                    }}
                  />
                  {ch.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreateRule} disabled={isLoading || !newTrigger}>
              Create Rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
