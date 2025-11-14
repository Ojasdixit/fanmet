import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';

const demographics = {
  age: [
    { label: '18-24', value: '35%' },
    { label: '25-34', value: '42%' },
    { label: '35-44', value: '18%' },
    { label: '45+', value: '5%' },
  ],
  gender: [
    { label: 'Male', value: '58%' },
    { label: 'Female', value: '40%' },
    { label: 'Other', value: '2%' },
  ],
};

const activity = {
  dau: 450,
  wau: 820,
  mau: 1247,
  sessionDuration: '12m 34s',
  sessionsPerUser: 3.2,
  bounceRate: '18%',
};

const segments = [
  { name: 'High Value Users', share: '12%', description: '5+ bids/month · Avg spend ₹1,200 · LTV ₹4,500' },
  { name: 'Regular Users', share: '28%', description: '2-4 bids/month · Avg spend ₹600 · LTV ₹1,800' },
  { name: 'Occasional Users', share: '35%', description: '1 bid/month · Avg spend ₹250 · LTV ₹750' },
  { name: 'Inactive Users', share: '25%', description: 'No activity in 30+ days · at-risk' },
];

const churn = {
  rate: '8.2%',
  churnedUsers: 102,
  atRisk: 156,
  reasons: [
    'Didn’t win events · 45%',
    'Too expensive · 28%',
    'Limited creator selection · 18%',
    'Technical issues · 6%',
    'Other · 3%',
  ],
};

export function AdminUserAnalytics() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">User Analytics</h1>
          <p className="text-sm text-[#6C757D]">Understand who your users are and how they behave across the funnel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Cohorts</Button>
          <Button>Create Segment</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Demographics" subtitle="Age and gender split" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Age Distribution</p>
            <ul className="mt-3 space-y-2 text-[#6C757D]">
              {demographics.age.map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <Badge variant="primary">{item.value}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Gender Split</p>
            <ul className="mt-3 space-y-2 text-[#6C757D]">
              {demographics.gender.map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <Badge variant="primary">{item.value}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Activity Metrics" subtitle="Engagement over the last 30 days" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Daily Active Users', value: activity.dau },
            { label: 'Weekly Active Users', value: activity.wau },
            { label: 'Monthly Active Users', value: activity.mau },
            { label: 'DAU/MAU Ratio', value: '36%' },
            { label: 'WAU/MAU Ratio', value: '66%' },
            { label: 'Avg Session Duration', value: activity.sessionDuration },
            { label: 'Sessions per User', value: activity.sessionsPerUser },
            { label: 'Bounce Rate', value: activity.bounceRate },
          ].map((metric) => (
            <div key={metric.label} className="rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
              <p className="text-[#6C757D]">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="User Segments" subtitle="Behavior-based clusters" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          {segments.map((segment) => (
            <div key={segment.name} className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{segment.name}</h2>
                <Badge variant="primary">{segment.share}</Badge>
              </div>
              <p className="mt-3 text-[#6C757D]">{segment.description}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary">
                  View Users
                </Button>
                <Button size="sm" variant="ghost">
                  Create Campaign
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Churn Analysis" subtitle="Keep an eye on at-risk users" />
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-6 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Churn Rate</p>
            <p className="text-3xl font-semibold text-[#DC3545]">{churn.rate}</p>
            <p className="mt-3">Churned Users: {churn.churnedUsers}</p>
            <p>At-risk Predictions: {churn.atRisk}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary">
                Send Win-Back Campaign
              </Button>
              <Button size="sm" variant="ghost">
                View Survey Data
              </Button>
            </div>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <p className="text-[#6C757D]">Top Reasons for Churn</p>
            <ul className="mt-3 space-y-2 text-[#6C757D]">
              {churn.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
