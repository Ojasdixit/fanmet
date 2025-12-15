import { Link } from 'react-router-dom';

type FooterLink = { label: string; to: string };

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const columns: FooterColumn[] = [
  {
    title: 'For Fans',
    links: [
      { label: 'Browse Events', to: '/browse-events' },
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'FAQs', to: '/faq' },
      { label: 'Free Events', to: '/free-events' },
    ],
  },
  {
    title: 'For Creators',
    links: [
      { label: 'Apply Now', to: '/apply' },
      { label: 'Creator Guide', to: '/creator-guide' },
      { label: 'Earnings Calculator', to: '/earnings-calculator' },
      { label: 'Success Stories', to: '/success-stories' },
      { label: 'Creator FAQs', to: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Team', to: '/team' },
      { label: 'Press & Media', to: '/press' },
      { label: "Careers (We're Hiring!)", to: '/careers' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help-center' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Terms of Service', to: '/terms-of-service' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Refund Policy', to: '/refund-policy' },
      { label: 'Cancellation Policy', to: '/cancellation-policy' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#1B1C1F] px-6 py-14 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <div className="text-2xl font-bold text-[#C045FF]">FanMeet</div>
            <p className="text-sm text-[#ADB5BD]">Connecting fans and creators, one call at a time.</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#ADB5BD]">
              <span className="rounded-full border border-[#343A40] px-3 py-1">Razorpay</span>
              <span className="rounded-full border border-[#343A40] px-3 py-1">UPI</span>
              <span className="rounded-full border border-[#343A40] px-3 py-1">Visa</span>
              <span className="rounded-full border border-[#343A40] px-3 py-1">Mastercard</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">{col.title}</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#ADB5BD]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link className="hover:text-white" to={link.to}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-[#343A40] pt-6 text-center text-xs text-[#6C757D]">
          © {new Date().getFullYear()} FanMeet. Made with ❤️ in India. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
