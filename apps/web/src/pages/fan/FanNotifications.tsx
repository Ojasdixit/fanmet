import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';

const alerts = [
  {
    id: 'alert-1',
    type: 'Bid Update',
    message: 'Your bid on "Meet & Greet - Q&A Session" was outbid by Priya Sharma.',
    timestamp: new Date('2025-01-11T09:30:00'),
    status: 'actionable'
  },
  {
    id: 'alert-2',
    type: 'Meet Reminder',
    message: 'Reminder: You won the session with Amit Singh happening tomorrow at 5 PM.',
    timestamp: new Date('2025-01-11T08:05:00'),
    status: 'reminder'
  },
  {
    id: 'alert-3',
    type: 'System',
    message: 'New feature! Fans can now earn loyalty points for every successful bid.',
    timestamp: new Date('2025-01-10T22:45:00'),
    status: 'info'
  }
];

const statusVariantMap: Record<string, 'primary' | 'warning' | 'success' | 'danger' | 'default'> = {
  actionable: 'danger',
  reminder: 'warning',
  info: 'primary',
};

export function FanNotifications() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Notifications</h1>
        <p className="text-sm text-[#6C757D]">
          Stay updated on bids, upcoming meets, and platform announcements.
        </p>
      </div>

      <Card elevated>
        <CardHeader
          title="Latest alerts"
          subtitle="Important updates that might need your attention"
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[alert.status] ?? 'default'} pill={false}>
                    {alert.type}
                  </Badge>
                  <span className="text-xs text-[#6C757D]">{formatDateTime(alert.timestamp)}</span>
                </div>
                <p className="text-sm text-[#212529]">{alert.message}</p>
              </div>
              {alert.status === 'actionable' ? (
                <Button size="sm">Review bid</Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Notification Preferences"
          subtitle="Choose how you’d like to stay in the loop"
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Email notifications for new bids and outbids
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Reminders 24 hours before a scheduled meet
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Product updates and feature announcements
            </label>
          </div>
          <Button variant="secondary" className="self-start">
            Save preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
