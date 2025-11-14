import { Card, CardContent, CardHeader, TextInput, TextArea, Button, Badge } from '@fanmeet/ui';

const securityLog = [
  {
    id: 'sec-1',
    title: 'Logged in from Chrome on Windows',
    timestamp: 'Jan 11, 2025 • 11:05 AM',
    location: 'New Delhi, IN',
    status: 'Trusted session'
  },
  {
    id: 'sec-2',
    title: 'Password changed successfully',
    timestamp: 'Jan 05, 2025 • 08:42 PM',
    location: 'Mumbai, IN',
    status: 'Secure'
  }
];

const statusVariantMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
  'Trusted session': 'primary',
  Secure: 'success'
};

export function FanSettings() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Settings</h1>
        <p className="text-sm text-[#6C757D]">
          Update your profile details, preferences, and review recent security activity.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card elevated>
          <CardHeader title="Profile" subtitle="Let creators know who they’re meeting." />
          <CardContent className="gap-5">
            <TextInput label="Full name" placeholder="Rahul Kumar" defaultValue="Rahul Kumar" />
            <TextInput label="Public username" placeholder="@rahul_fan" defaultValue="@rahul_fan" />
            <TextArea
              label="About you"
              placeholder="Share your interests, favorite creators, and background."
              defaultValue="Fan of live AMAs and backstage stories. Looking forward to connecting with inspiring creators!"
              rows={4}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Preferred language" placeholder="English" defaultValue="English, Hindi" />
              <TextInput label="Timezone" placeholder="IST" defaultValue="Asia/Kolkata (IST)" />
            </div>
            <Button size="lg">Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Communication" subtitle="Choose how we keep you informed." />
          <CardContent className="gap-4 text-sm text-[#212529]">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Email me when I’m outbid on an event
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Remind me 24 hours before a meet
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded border-[#CBD5F5] text-[#FF6B35] focus:ring-[#FF6B35]" />
              Send me creator spotlights and platform updates
            </label>
            <Button variant="secondary" className="self-start">
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Security activity"
          subtitle="Recent actions that impact your account safety."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {securityLog.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#212529]">{entry.title}</h3>
                <p className="text-sm text-[#6C757D]">{entry.timestamp} · {entry.location}</p>
              </div>
              <Badge variant={statusVariantMap[entry.status] ?? 'default'}>{entry.status}</Badge>
            </div>
          ))}
          <Button variant="ghost" className="self-start">
            Review all security events →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
