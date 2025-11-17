import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';
import { formatCurrency, formatDateTime } from '@fanmeet/utils';

const pastMeets = [
  {
    id: 'hist-1',
    creator: 'Priya Sharma',
    event: 'Backstage AMA',
    date: new Date('2025-01-02T16:00:00'),
    amount: 360,
    highlights: 'Loved the candid behind-the-scenes stories and personal shoutout.'
  },
  {
    id: 'hist-2',
    creator: 'Amit Singh',
    event: 'Productivity Power Hour',
    date: new Date('2024-12-18T15:30:00'),
    amount: 220,
    highlights: 'Great Q&A and actionable frameworks for daily routines.'
  }
];

const upcomingRequests = [
  {
    id: 'req-1',
    creator: 'Riya Kapoor',
    event: 'Glam Session',
    requestedOn: new Date('2025-01-10T14:00:00'),
    status: 'Awaiting response'
  },
  {
    id: 'req-2',
    creator: 'Live with Rohan',
    event: 'Exclusive Acoustic Night',
    requestedOn: new Date('2025-01-08T18:00:00'),
    status: 'Bid placed'
  }
];

const statusVariantMap: Record<string, 'primary' | 'warning' | 'success' | 'danger' | 'default'> = {
  'Awaiting response': 'warning',
  'Bid placed': 'primary',
};

export function FanHistory() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">History</h1>
        <p className="text-sm text-[#6C757D]">
          Catch up on your past sessions and keep tabs on upcoming requests.
        </p>
      </div>

      <Card elevated>
        <CardHeader
          title="Past Experiences"
          subtitle="Rate your meets and revisit standout memories."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-6">
          {pastMeets.map((meet) => (
            <div key={meet.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="primary">{meet.creator}</Badge>
                  <span className="text-sm text-[#6C757D]">{formatDateTime(meet.date)}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[#212529]">{meet.event}</h3>
                <p className="text-sm text-[#6C757D]">{meet.highlights}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-[#6C757D]">Winning Bid</span>
                <span className="text-xl font-semibold text-[#212529]">{formatCurrency(meet.amount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Pending Requests"
          subtitle="Stay updated on events waiting for confirmation."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {upcomingRequests.map((request) => (
            <div key={request.id} className="flex flex-col gap-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[#6C757D]">Requested on {formatDateTime(request.requestedOn)}</p>
                <h3 className="text-lg font-semibold text-[#212529]">{request.event}</h3>
                <p className="text-sm text-[#6C757D]">with {request.creator}</p>
              </div>
              <Badge variant={statusVariantMap[request.status] ?? 'default'}>{request.status}</Badge>
            </div>
          ))}
          <Button variant="ghost" className="self-start">
            View all requests →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
