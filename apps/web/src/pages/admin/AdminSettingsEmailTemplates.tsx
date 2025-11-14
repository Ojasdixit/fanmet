import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const templates = [
  {
    id: 'welcome-fan',
    name: 'Fan Welcome Email',
    subject: 'Welcome to FanMeet Five! Your first meet awaits 👋',
    audience: 'New fans',
    updated: 'Jan 10, 2025 · Priya',
    status: 'Active',
  },
  {
    id: 'creator-onboarding',
    name: 'Creator Onboarding Invite',
    subject: 'You’re invited to host on FanMeet Five',
    audience: 'Creator prospects',
    updated: 'Jan 11, 2025 · Rahul',
    status: 'Active',
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    subject: 'Action needed: finalize your payout details',
    audience: 'Creators (Pending KYC)',
    updated: 'Jan 08, 2025 · Nisha',
    status: 'Draft',
  },
];

const snippets = [
  { name: '{{fan_name}}', description: 'Inserts the fan’s first name.' },
  { name: '{{creator_name}}', description: 'Creator display name.' },
  { name: '{{event_title}}', description: 'Event name the email references.' },
  { name: '{{cta_link}}', description: 'Primary button URL.' },
];

export function AdminSettingsEmailTemplates() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Email Templates</h1>
          <p className="text-sm text-[#6C757D]">Manage transactional and lifecycle emails sent by FanMeet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Import Template</Button>
          <Button>Create New Template</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Templates" subtitle="Edit subjects, content, and target rules." />
        <CardContent className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{template.name}</h2>
                  <p className="text-[#6C757D]">Subject: {template.subject}</p>
                  <p className="text-xs text-[#ADB5BD]">Audience: {template.audience}</p>
                </div>
                <Badge variant={template.status === 'Active' ? 'success' : 'warning'}>{template.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[#6C757D]">
                <span>Last updated: {template.updated}</span>
                <span>Template ID: {template.id}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit Content
                </Button>
                <Button size="sm" variant="ghost">
                  Preview
                </Button>
                <Button size="sm" variant="ghost">
                  Duplicate
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active Template" subtitle="Inline editor preview." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <TextInput label="Template Name" defaultValue={templates[0].name} />
            <TextInput label="Email Subject" defaultValue={templates[0].subject} />
            <TextArea label="Preview Text" rows={2} placeholder="Shown in inbox snippet" />
            <TextArea label="Body" rows={10} defaultValue={`Hi {{fan_name}},\n\nThanks for joining FanMeet Five! Explore live meets and bid on your favorites.\n\nButton: {{cta_link}}`} />
            <div className="flex gap-2">
              <Button variant="secondary">Save Draft</Button>
              <Button>Publish</Button>
            </div>
          </div>
          <div className="space-y-3 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
            <h2 className="text-sm font-semibold">Available Snippets</h2>
            <ul className="space-y-2 text-[#6C757D]">
              {snippets.map((snippet) => (
                <li key={snippet.name} className="flex items-center justify-between">
                  <span>{snippet.name}</span>
                  <span>{snippet.description}</span>
                </li>
              ))}
            </ul>
            <TextArea label="Preview" rows={10} defaultValue={`Hi Neha,\n\nThanks for joining FanMeet Five! Your first bid is ready.\n\nCTA: https://fanmeet.app/events`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
