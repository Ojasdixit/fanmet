import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const notificationChannels = [
  { id: 'channel-email', label: 'Email', description: 'Transactional and marketing emails', enabled: true },
  { id: 'channel-push', label: 'Push Notifications', description: 'Mobile push via FanMeet app', enabled: true },
  { id: 'channel-sms', label: 'SMS', description: 'Critical alerts and OTP delivery', enabled: false },
  { id: 'channel-whatsapp', label: 'WhatsApp', description: 'High priority creator alerts', enabled: false },
];

const automatedRules = [
  { trigger: 'Bid Won', channel: 'Email + Push', template: 'fan-bid-won', status: 'Active' },
  { trigger: 'Creator Payout Paid', channel: 'Email', template: 'creator-payout', status: 'Active' },
  { trigger: 'Support Ticket Update', channel: 'Email + Push', template: 'ticket-update', status: 'Active' },
  { trigger: 'Dispute Escalated', channel: 'Email + SMS', template: 'dispute-escalated', status: 'Draft' },
];

export function AdminSettingsNotifications() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Notification Settings</h1>
          <p className="text-sm text-[#6C757D]">Control channels, templates, and delivery rules for platform alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Test Delivery</Button>
          <Button>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Channels" subtitle="Enable or disable customer touchpoints." />
        <CardContent className="space-y-3">
          {notificationChannels.map((channel) => (
            <label
              key={channel.id}
              className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]"
            >
              <div>
                <p className="font-semibold">{channel.label}</p>
                <p className="text-xs text-[#6C757D]">{channel.description}</p>
              </div>
              <input type="checkbox" defaultChecked={channel.enabled} className="h-5 w-5 rounded border-[#CED4DA]" />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Automated Rules" subtitle="Template and channel mapping per trigger." />
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Trigger</th>
                <th className="border-b border-[#E9ECEF] py-3">Channel(s)</th>
                <th className="border-b border-[#E9ECEF] py-3">Template</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {automatedRules.map((rule) => (
                <tr key={rule.trigger} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{rule.trigger}</td>
                  <td className="py-3 text-[#6C757D]">{rule.channel}</td>
                  <td className="py-3 text-[#6C757D]">{rule.template}</td>
                  <td className="py-3">
                    <Badge variant={rule.status === 'Active' ? 'success' : 'warning'}>{rule.status}</Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost">
                        Disable
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Fallback &amp; Snooze" subtitle="Configure overrides for critical alerts." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Critical Overrides" placeholder="SMS, Email" defaultValue="Email, SMS" />
          <TextInput label="Snooze Window" placeholder="e.g. 6 hours" defaultValue="6 hours" />
          <TextArea label="Quiet Hours" rows={3} placeholder="List hours and region-specific rules" />
          <TextArea label="Notes" rows={3} placeholder="Escalation path or manual triggers" />
        </CardContent>
      </Card>
    </div>
  );
}
