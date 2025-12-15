import { Card, CardContent, CardHeader } from '@fanmeet/ui';

export function CreatorGuidePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Creator Guide</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">How to run great FanMeet sessions</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          A simple guide to help creators deliver high-quality, safe, and consistent fan experiences.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="Before your event" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Ensure stable internet and a quiet environment.</li>
              <li>Confirm your event title, duration, and time.</li>
              <li>Set expectations in the description (topics, rules).</li>
            </ul>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="During the call" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Start on time and keep the conversation friendly.</li>
              <li>Do not share personal contact details.</li>
              <li>End the call immediately if the fan is abusive.</li>
            </ul>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="After the call" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Mark the meet status correctly in the dashboard.</li>
              <li>Withdraw earnings after clearance (as applicable).</li>
              <li>Report issues via Support.</li>
            </ul>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="Payout readiness" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Complete profile approval (verified status).</li>
              <li>Add bank/UPI details in Settings.</li>
              <li>Keep KYC details accurate to avoid payout delays.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
