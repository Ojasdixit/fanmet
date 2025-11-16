import { Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const generalSettings = {
  platformName: 'FanMeet Five',
  supportEmail: 'support@fanmeet.com',
  supportPhone: '+91 98765 43210',
  defaultTimezone: 'Asia/Kolkata',
  maintenanceMode: false,
  sessionDurations: ['5 minutes', '10 minutes', '15 minutes'],
  cancellationWindow: '12 hours',
  defaultCommission: '10%',
};

export function AdminSettingsGeneral() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">General Settings</h1>
          <p className="text-sm text-[#6C757D]">Configure platform basics, support contacts, and global defaults.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Platform Info" subtitle="Branding and contact details." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Platform Name" defaultValue={generalSettings.platformName} />
          <TextInput label="Support Email" defaultValue={generalSettings.supportEmail} />
          <TextInput label="Support Phone" defaultValue={generalSettings.supportPhone} />
          <TextInput label="Default Timezone" defaultValue={generalSettings.defaultTimezone} />
          <div className="md:col-span-2">
            <TextArea label="Welcome Message" rows={3} placeholder="Displayed on creator onboarding" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Sessions & Commission" subtitle="Tune monetisation and scheduling experiences." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Default Session Durations" defaultValue={generalSettings.sessionDurations.join(', ')} />
          <TextInput label="Cancellation Window" defaultValue={generalSettings.cancellationWindow} />
          <TextInput label="Default Commission" defaultValue={generalSettings.defaultCommission} />
          <label className="flex items-center justify-between rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
            <div>
              <p className="text-sm font-semibold text-[#212529]">Enable 90% Auto Refunds</p>
              <p className="text-xs text-[#6C757D]">Retain 10% commission from non-winning bids.</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CED4DA]" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Maintenance Mode" subtitle="Temporarily pause user access during updates." />
        <CardContent className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#F4E6FF] bg-[#F4E6FF]/50 p-5">
          <div>
            <p className="text-sm font-semibold text-[#C045FF]">
              Maintenance mode is currently {generalSettings.maintenanceMode ? 'ON' : 'OFF'}.
            </p>
            <p className="text-xs text-[#6C757D]">Notify users about downtime and expected ETA.</p>
          </div>
          <Button variant="primary">Toggle Maintenance</Button>
        </CardContent>
      </Card>
    </div>
  );
}
