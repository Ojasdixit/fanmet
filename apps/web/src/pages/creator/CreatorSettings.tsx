import { Card, CardContent, CardHeader, Button, TextInput, TextArea, Badge } from '@fanmeet/ui';

const linkedChannels = [
  { id: 'ch-yt', label: 'YouTube', handle: 'youtube.com/@creatormeet', status: 'Connected' },
  { id: 'ch-ig', label: 'Instagram', handle: '@creator.official', status: 'Reconnect required' },
];

const channelStatusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  Connected: 'success',
  'Reconnect required': 'warning',
};

export function CreatorSettings() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Settings</h1>
        <p className="text-sm text-[#6C757D]">
          Fine-tune your public profile, contact preferences, and streaming setup.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card elevated>
          <CardHeader title="Profile information" subtitle="Fans see these details before bidding." />
          <CardContent className="gap-5">
            <TextInput label="Display name" placeholder="Aarti Sharma" defaultValue="Aarti Sharma" />
            <TextInput label="Public username" placeholder="@aartilive" defaultValue="@aartilive" />
            <TextArea
              label="Bio"
              placeholder="Tell your fans what to expect..."
              defaultValue="Host of the Premium AMA series. Love sharing productivity hacks and behind-the-scenes stories."
              rows={4}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Category" placeholder="Creator category" defaultValue="Motivation" />
              <TextInput label="Primary language" placeholder="English" defaultValue="English, Hindi" />
            </div>
            <Button size="lg">Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Contact settings" subtitle="We’ll use this for payouts and urgent reminders." />
          <CardContent className="gap-4">
            <TextInput label="Contact email" placeholder="creator@example.com" defaultValue="hello@aartilive.com" />
            <TextInput label="Phone number" placeholder="+91 98765 43210" defaultValue="+91 98765 43210" />
            <label className="flex items-center gap-3 text-sm text-[#212529]">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Send SMS alerts for high-value bids
            </label>
            <label className="flex items-center gap-3 text-sm text-[#212529]">
              <input type="checkbox" className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Share calendar availability with FanMeet team
            </label>
            <Button variant="secondary" className="self-start">
              Update contact info
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Streaming & channel integrations"
          subtitle="Connect tools to streamline your live experiences."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {linkedChannels.map((channel) => (
            <div key={channel.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#212529]">{channel.label}</p>
                <span className="text-sm text-[#6C757D]">{channel.handle}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={channelStatusVariant[channel.status] ?? 'default'}>{channel.status}</Badge>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          ))}
          <Button variant="ghost" className="self-start">
            + Connect new channel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
