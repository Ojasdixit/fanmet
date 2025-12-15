import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';
import { useNavigate } from 'react-router-dom';

export function ApplyPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Apply Now</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Become a verified creator on FanMeet</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Submit your creator profile, complete verification, and start hosting paid or free events.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="Eligibility" subtitle="Who can apply?" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Creators with a real audience (recommended 1,000+ followers) or a valuable skill.</li>
              <li>Valid identity verification (KYC) and a payout method (bank/UPI).</li>
              <li>Willingness to follow safety and community guidelines.</li>
            </ul>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="How to apply" subtitle="It takes a few minutes." />
          <CardContent className="space-y-3 text-sm text-[#6C757D]">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Create an account.</li>
              <li>Select role: Creator.</li>
              <li>Complete profile setup and submit for approval.</li>
              <li>Wait for verification status.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate('/auth')}>Sign up / Login</Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/for-creators')}>Learn more</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
