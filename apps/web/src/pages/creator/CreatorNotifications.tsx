import { Card, CardContent, CardHeader, Badge, Button } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';

const notifications = [
  {
    id: 'creator-alert-1',
    title: 'Bid surge on "Premium AMA"',
    description: '6 new bids were placed in the last hour. Consider engaging fans with a teaser.',
    timestamp: new Date('2025-01-11T10:20:00'),
    type: 'bid'
  },
  {
    id: 'creator-alert-2',
    title: 'Session reminder',
    description: 'Rahul Kumar will join your "Premium AMA" session tomorrow at 5:00 PM.',
    timestamp: new Date('2025-01-11T08:00:00'),
    type: 'reminder'
  },
  {
    id: 'creator-alert-3',
    title: 'Platform update',
    description: 'New analytics insights are available to download from your earnings dashboard.',
    timestamp: new Date('2025-01-10T21:15:00'),
    type: 'update'
  }
];

const typeVariantMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
  bid: 'danger',
  reminder: 'warning',
  update: 'primary'
};

export function CreatorNotifications() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Notifications</h1>
        <p className="text-sm text-[#6C757D]">
          Respond quickly to live bids, upcoming sessions, and new platform opportunities.
        </p>
      </div>

      <Card elevated>
        <CardHeader
          title="Latest alerts"
          subtitle="Everything you need to stay in sync with your fans."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {notifications.map((alert) => (
            <div key={alert.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={typeVariantMap[alert.type] ?? 'default'} pill={false}>
                    {alert.title}
                  </Badge>
                  <span className="text-xs text-[#6C757D]">{formatDateTime(alert.timestamp)}</span>
                </div>
                <p className="text-sm text-[#212529]">{alert.description}</p>
              </div>
              {alert.type === 'bid' ? (
                <Button size="sm">Open event</Button>
              ) : alert.type === 'reminder' ? (
                <Button variant="secondary" size="sm">
                  View agenda
                </Button>
              ) : null}
            </div>
          ))}
          <Button variant="ghost" className="self-start">
            View all alerts →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Notification preferences"
          subtitle="Choose how you’d like to be notified across FanMeet."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          <div className="flex flex-col gap-4 text-sm text-[#212529]">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Email alerts for new bids and bid surges
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Push reminders 2 hours before sessions
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Monthly product and analytics digest
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
