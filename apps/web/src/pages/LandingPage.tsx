import React, { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import { Button, Card, CardContent, CardHeader, Avatar, Badge } from '@fanmeet/ui';
import SphereImageGrid, { type ImageData } from '../components/SphereImageGrid';
import heroImage from '../../Ready-to-Share Social Media Posts to Amplify Your Brand on Pinterest.jpeg';
import { AnimatedTestimonials, type Testimonial } from '../components/ui/animated-testimonials2';

const featuredCreators = [
  {
    name: 'Priya Sharma',
    category: '🎮 Gamer',
    followers: '52K followers',
    priceRange: '₹120-₹360',
    avatar: 'PS',
    highlight: 'Speedruns & strategy coaching',
  },
  {
    name: 'Rohan Gupta',
    category: '🍳 Chef',
    followers: '68K followers',
    priceRange: '₹90-₹280',
    avatar: 'RG',
    highlight: 'Teaches restaurant-style recipes',
  },
  {
    name: 'Amit Singh',
    category: '🎨 Artist',
    followers: '74K followers',
    priceRange: '₹150-₹400',
    avatar: 'AS',
    highlight: 'Live sketching + portfolio reviews',
  },
  {
    name: 'Neha Kapoor',
    category: '🎧 Life Coach',
    followers: '38K followers',
    priceRange: '₹200-₹420',
    avatar: 'NK',
    highlight: 'Career clarity & confidence boosts',
  },
  {
    name: 'Arjun Mehta',
    category: '🎤 Musician',
    followers: '81K followers',
    priceRange: '₹110-₹300',
    avatar: 'AM',
    highlight: 'Song breakdowns + songwriting tips',
  },
  {
    name: 'Sana Rao',
    category: '💪 Fitness',
    followers: '46K followers',
    priceRange: '₹95-₹260',
    avatar: 'SR',
    highlight: 'At-home workouts & accountability',
  },
];

const creatorImageUrls = [
  'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181670/pexels-photo-1181670.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181681/pexels-photo-1181681.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181672/pexels-photo-1181672.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181680/pexels-photo-1181680.jpeg?auto=compress&cs=tinysrgb&w=800',
];

const featuredCreatorImages: ImageData[] = Array.from({ length: 32 }).map((_, index) => {
  const creator = featuredCreators[index % featuredCreators.length];
  const imageUrl = creatorImageUrls[index % creatorImageUrls.length];

  return {
    id: `featured-${index}`,
    src: imageUrl,
    alt: creator.name,
    title: creator.name,
    description: `${creator.category} · ${creator.highlight}`,
  };
});

const processSteps = [
  {
    icon: '🎯',
    title: 'Pick Your Creator',
    description: 'Find someone you want to meet. Could be a YouTuber, chef, gamer, or anyone awesome!',
    step: '1',
  },
  {
    icon: '💰',
    title: "Bid (It's Like an Auction)",
    description: "Place a bid to win a video call. The highest bid wins! Don't worry - if you lose, you get most of your money back!",
    step: '2',
  },
  {
    icon: '🎥',
    title: 'Meet Them on Video Call',
    description: 'If you win, you get 5-10 minutes to chat one-on-one. How cool is that?!',
    step: '3',
  },
];

const socialProofStatsTop = [
  { value: '1,247', label: 'Happy Fans Joined' },
  { value: '200', label: 'Video Meets Completed' },
  { value: '95%', label: 'Success Rate (Fans Win)' },
];

const socialProofStatsBottom = [
  { value: '89', label: 'Creators Active Now' },
  { value: '₹4.5L', label: 'Total Money Creators Earned' },
  { value: '10', label: 'Minutes Average Meeting Time' },
  { value: '2-10', label: 'Minutes Call Length Options' },
];

const fanVideoTestimonials = [
  {
    name: 'Priya · 24 · Mumbai',
    quote:
      "I met Rohan who's my favorite gamer. I was so nervous I cried! He was so kind and gave me tips on streaming. Best day ever!",
    context: 'Met Rohan · Gaming Creator',
    duration: '45 sec clip',
  },
  {
    name: 'Rahul · 19 · Delhi',
    quote:
      "My sister gifted me a FanMeet call with Chef Amit for my birthday. He taught me his signature dish! Better than any material gift!",
    context: 'Met Chef Amit · Cooking Creator',
    duration: '38 sec clip',
  },
  {
    name: 'Sneha · 22 · Bangalore',
    quote:
      'I was stuck choosing between two career paths. I bid ₹400 to talk to a life coach creator. Her advice was clearer than months of googling!',
    context: 'Met Ria · Life Coach Creator',
    duration: '42 sec clip',
  },
];

const creatorVideoTestimonials = [
  {
    name: 'Priya Sharma · Content Creator · 52K followers',
    quote:
      "I've done brand deals, sponsorships, everything. But FanMeet is different. I actually get to TALK to my supporters. I earned ₹45,000 last month and it helps fund new content!",
    duration: '60 sec clip',
  },
  {
    name: 'Rohan Verma · Gaming Streamer · 48K followers',
    quote:
      'My fans are the reason I do this. FanMeet lets me give back. These 10-minute calls remind me why I started. Plus, the extra income upgrades my setup. Win-win!',
    duration: '75 sec clip',
  },
];

const photoReviews = [
  {
    id: 'photo-1',
    quote: 'Dreams come true! 💫',
    context: 'Got cooking tips from Chef Amit!',
  },
  {
    id: 'photo-2',
    quote: 'Best birthday surprise ever 🎉',
    context: 'He sang my favourite song live!',
  },
  {
    id: 'photo-3',
    quote: 'She remembered my username!! 😭',
    context: 'Finally spoke to my art icon',
  },
  {
    id: 'photo-4',
    quote: 'Career clarity in 10 minutes',
    context: 'Life coach gave me a plan',
  },
  {
    id: 'photo-5',
    quote: 'We geeked out over anime 🤓',
    context: 'Felt like chatting with a friend',
  },
  {
    id: 'photo-6',
    quote: 'He reviewed my vlog setup 📹',
    context: 'Got technical tips + motivation',
  },
];

const realFanmeetImageUrls = [
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181670/pexels-photo-1181670.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800',
];

const textReviews = [
  {
    quote:
      "I've been following Chef Amit for 2 years on YouTube and never thought I'd get to talk to him personally. FanMeet made it possible! He gave me tips on starting my own food blog and even shared his secret recipe. Best ₹350 I ever spent. Thank you FanMeet! 🙏",
    name: 'Neha Kapoor, 26 · Food Blogger · Mumbai',
    met: 'Met: Chef Amit Gupta',
  },
  {
    quote:
      'As an introvert, I was scared to bid. But I really wanted career advice from Aditi. I won at ₹280. The call was so comfortable! She answered all my questions and even followed up with resources via email. Worth every rupee.',
    name: 'Anonymous Fan, 23 · Software Engineer',
    met: 'Met: Aditi Sharma (Career Coach)',
  },
  {
    quote:
      "Booked a FanMeet for my little brother with his favourite tech creator. They both nerded out about gadgets for 10 minutes. He's still smiling a week later. ₹300 very well spent!",
    name: 'Pooja Malhotra, 27 · Pune',
    met: 'Met: Tech with Raj',
  },
  {
    quote:
      'I used FanMeet to get feedback on my indie game from a gaming creator I admire. He gave me 3 actionable tips and shared my demo with his Discord server. Instant confidence boost!',
    name: 'Harsh Patel, 21 · Game Developer · Ahmedabad',
    met: 'Met: Rohan Live',
  },
];

const trustPillars = [
  {
    icon: '🔐',
    title: 'Secure Payments',
    bullets: [
      'All payments encrypted via Razorpay',
      'Your card details never touch our servers',
      'Same security as Amazon & Flipkart',
    ],
    badge: 'Razorpay Partner',
  },
  {
    icon: '💳',
    title: 'Safe Refunds',
    bullets: [
      'Get 90% back if you do not win',
      'Instant & automatic – no forms to fill',
      '₹1.2 lakh refunded with 98.5% success rate',
    ],
    badge: '90% Refund Guarantee',
  },
  {
    icon: '✅',
    title: 'Verified Creators',
    bullets: [
      'Every creator manually approved by our team',
      'Identity + social media checks',
      'No fake accounts allowed',
    ],
    badge: 'Human Verified',
  },
  {
    icon: '📞',
    title: '24/7 Support',
    bullets: [
      'Real humans reply within 2.3 hours',
      'Email, chat, or call anytime',
      'We stay with you till the call ends',
    ],
    badge: 'Always On',
  },
];

const pricingOptions = [
  {
    title: 'Paid Events (Bidding)',
    description: 'Highest bid wins a 5-10 minute one-on-one call.',
    highlights: [
      'Starting bids at ₹50 or ₹100',
      'If you lose, 90% is refunded automatically',
      'Average winning bid ₹250-₹400',
    ],
    story:
      '“I bid ₹250 for a 10-minute call with my favourite YouTuber. I won! The other 22 bidders got ₹225 back. Losing would cost only ₹25 – cheaper than a coffee!” – Rahul, College Student, Delhi',
    cta: 'Browse Paid Events',
  },
  {
    title: 'Free Events (Lucky Draw)',
    description: 'Zero cost entries for surprise video calls.',
    highlights: [
      '₹0 entry – completely free',
      'Random winner chosen, no risk at all',
      'Calls last 5-10 minutes just like paid events',
    ],
    story: '“I joined a free draw for Chef Amit and actually got picked! No money spent, just pure luck.” – Priya, Food Blogger, Mumbai',
    cta: 'Join Free Draws',
  },
];

const creatorBenefits = [
  {
    icon: '💰',
    title: 'Earn Real Money',
    bullets: [
      'Set your own price (₹50 or ₹100 base)',
      'Keep 90% of earnings – top creators make ₹30k-₹50k/month',
      'No upfront costs or hidden fees',
    ],
  },
  {
    icon: '👥',
    title: 'Connect With Supporters',
    bullets: [
      'Meet the fans who actually watch your content',
      'Get direct feedback, ideas, and motivation',
      'Turn casual viewers into superfans',
    ],
  },
  {
    icon: '⏰',
    title: 'Complete Flexibility',
    bullets: [
      'Create events whenever you want',
      'Choose 5 or 10 minute durations',
      'Cancel anytime – work from anywhere',
    ],
  },
  {
    icon: '📈',
    title: 'Grow Your Brand',
    bullets: [
      'Get featured on our homepage',
      'Reach new potential fans',
      'We promote your events for you',
    ],
  },
  {
    icon: '🎯',
    title: 'Zero Hassle',
    bullets: [
      'We handle payments, refunds, and tech',
      'Dashboard to track every meet',
      'Payouts in 2-3 business days via UPI/bank',
    ],
  },
];

const teamMembers = [
  {
    name: 'Arjun Singh',
    role: 'Founder',
    bio: "I once drove 8 hours to meet my favourite musician. Worth it. Now I help others meet their heroes from the couch!",
    funFact: 'Biggest fan of Samay Raina',
  },
  {
    name: 'Priya Mehta',
    role: 'Co-Founder',
    bio: 'Former food blogger (15K followers). I know both sides of the fan-creator equation. We built this for YOU.',
    funFact: 'Made 47 prototypes before the final design',
  },
  {
    name: 'Rahul Verma',
    role: 'Tech Lead',
    bio: 'I make sure calls never lag and payments stay secure. Boring? Yes. Important? Also yes.',
    funFact: 'Fixed a bug at 3 AM while eating Maggi',
  },
  {
    name: 'Neha Kapoor',
    role: 'Customer Support',
    bio: 'I reply to every email personally. Got a question? I am on it!',
    funFact: 'Fastest typer in the team (110 WPM)',
  },
  {
    name: 'Amit Gupta',
    role: 'Marketing',
    bio: 'I find awesome creators, make memes, and keep the community buzzing.',
    funFact: 'Binged 200 YouTube channels for research',
  },
  {
    name: 'Sneha Sharma',
    role: 'Operations',
    bio: 'I approve creator applications and keep every event running smooth.',
    funFact: 'Interviewed 89 creators personally',
  },
];

const teamImageUrls = [
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544723795-432537d12f6c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb0b90c07c1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1525130413817-9e0b0a50b9d5?auto=format&fit=crop&w=900&q=80',
];

const teamTestimonials: Testimonial[] = teamMembers.map((member, index) => ({
  quote: member.bio,
  name: member.name,
  designation: member.role,
  src: teamImageUrls[index % teamImageUrls.length],
}));

const faqItems = [
  {
    category: 'Fans',
    question: "What if I don't win the bid?",
    answer:
      'You automatically get 90% of your money back within 5-7 business days. If you bid ₹200, you only risk ₹20 – less than a movie ticket!',
  },
  {
    category: 'Fans',
    question: 'How do I know creators are real?',
    answer:
      'Every creator is manually verified by our team. We check social media, identity, and test their video setup. No fake accounts allowed.',
  },
  {
    category: 'Fans',
    question: 'What can I talk about in the call?',
    answer:
      "Anything! Ask questions, get advice, request shoutouts, share your story. It's your 10 minutes. Just be kind and respectful.",
  },
  {
    category: 'Fans',
    question: 'What if my internet is bad?',
    answer:
      'Our video software works on 3G/4G. If there is a technical issue on our end, you get 100% refund or a reschedule – your choice.',
  },
  {
    category: 'Creators',
    question: 'How do payouts work?',
    answer:
      'You keep 90% of the winning bid. Withdraw anytime via UPI or bank transfer. We process payouts within 2-3 business days.',
  },
  {
    category: 'Creators',
    question: 'What if a fan is rude?',
    answer: 'End the call immediately. We ban that user and you still keep your earnings. Your safety comes first.',
  },
  {
    category: 'Creators',
    question: 'Do I need lots of followers?',
    answer:
      'If you have 1,000+ followers or a unique skill people want to learn, you are good to go. Smaller creators often get more bids!',
  },
  {
    category: 'General',
    question: 'Is FanMeet available outside India?',
    answer:
      'Right now we are India-only, but the waitlist is open. Drop your email and we will notify you when we expand.',
  },
  {
    category: 'General',
    question: 'How is this different from Cameo?',
    answer:
      'Cameo is pre-recorded videos. FanMeet is live, two-way conversations. Ask follow-ups, share screens, and build a real connection.',
  },
];

const pressEntries = [
  {
    type: 'press',
    name: 'YourStory',
    quote: '“FanMeet is building India’s most intimate creator-fan marketplace.”',
    url: '#',
  },
  {
    type: 'press',
    name: 'Inc42',
    quote: '“A refreshing take on live interactions. Fans are bidding for moments, not merch.”',
    url: '#',
  },
  {
    type: 'social',
    name: '@creatorsneha',
    quote: '“Just wrapped my third FanMeet. Tears, laughs, and a fan who wants to start creating again. 💛”',
    url: '#',
  },
  {
    type: 'social',
    name: '@chefamit',
    quote: '“FanMeet calls feel like cooking with friends. 25 bids last night!”',
    url: '#',
  },
];

const comparisonRows = [
  {
    feature: 'Real-time interaction',
    fanmeet: '✅ Yes',
    social: '❌ One-way comments',
    cameo: '❌ Pre-recorded',
  },
  {
    feature: 'Two-way conversation',
    fanmeet: '✅ Talk & listen',
    social: '❌ No',
    cameo: '❌ No',
  },
  {
    feature: 'Length of experience',
    fanmeet: '5-10 minutes',
    social: 'Few seconds',
    cameo: '30-60 seconds',
  },
  {
    feature: 'Ask follow-up questions',
    fanmeet: '✅ Unlimited',
    social: '❌ Maybe answered',
    cameo: '❌ No',
  },
  {
    feature: 'Typical price',
    fanmeet: '₹50-₹400',
    social: 'Free (ignored)',
    cameo: '₹500-₹5000',
  },
  {
    feature: 'Refund if you do not win',
    fanmeet: '✅ 90-100%',
    social: 'N/A',
    cameo: '❌ No',
  },
];

const successStories = [
  {
    title: 'From Fan to Friend',
    before: 'Rahul followed gaming creator Rohan for 3 years without a single reply.',
    during: 'He won a ₹320 bid and spent 10 minutes discussing streaming tips.',
    after:
      'Rohan now recognizes Rahul in chat and they exchange DMs about upcoming games. Confidence boosted x100.',
  },
  {
    title: 'Career-Changing Advice',
    before: 'Priya was torn between UX design and product management.',
    during: 'She paid ₹400 to chat with a career coach creator who mapped a 90-day plan.',
    after:
      'Priya launched her own service studio within two months. Her first paying client came from that creator’s recommendation.',
  },
  {
    title: 'Gift That Made Her Cry',
    before: 'Amit wanted a meaningful birthday surprise for his partner, an art lover.',
    during:
      'He booked a FanMeet with her favourite illustrator who live-sketched her while they talked.',
    after: 'She cried happy tears and the sketch now hangs in their living room.',
  },
];

const footerLinks = {
  fanmeet: {
    tagline: 'Connecting fans and creators, one call at a time.',
    socials: [
      { label: 'Instagram', url: '#' },
      { label: 'Twitter', url: '#' },
      { label: 'YouTube', url: '#' },
      { label: 'LinkedIn', url: '#' },
    ],
  },
  fans: [
    { label: 'Browse Events', url: '#' },
    { label: 'How It Works', url: '#how-it-works' },
    { label: 'Pricing', url: '#pricing' },
    { label: 'FAQs', url: '#faq' },
    { label: 'Free Events', url: '#' },
  ],
  creators: [
    { label: 'Apply Now', url: '#creators' },
    { label: 'Creator Guide', url: '#' },
    { label: 'Earnings Calculator', url: '#' },
    { label: 'Success Stories', url: '#success-stories' },
    { label: 'Creator FAQs', url: '#faq' },
  ],
  company: [
    { label: 'About Us', url: '#team' },
    { label: 'Our Team', url: '#team' },
    { label: 'Press & Media', url: '#press' },
    { label: "Careers (We're Hiring!)", url: '#' },
    { label: 'Blog', url: '#' },
  ],
  support: [
    { label: 'Help Center', url: '#' },
    { label: 'Contact Us', url: '#' },
    { label: 'Terms of Service', url: '#' },
    { label: 'Privacy Policy', url: '#' },
    { label: 'Refund Policy', url: '#' },
  ],
};

const paymentLogos = ['Razorpay', 'Visa', 'Mastercard', 'UPI'];

interface GradientBarsProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
}

const GradientBars: React.FC<GradientBarsProps> = ({
  numBars = 18,
  gradientFrom = 'rgba(192,69,255,0.9)',
  gradientTo = 'rgba(255,255,255,0)',
  animationDuration = 2.2,
  className = '',
}) => {
  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);

    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <>
      <style>{`
        @keyframes pulseBar {
          0% { transform: scaleY(var(--initial-scale)); }
          100% { transform: scaleY(calc(var(--initial-scale) * 0.7)); }
        }
      `}</style>
      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}>
        <div
          className="flex h-full"
          style={{
            width: '100%',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {Array.from({ length: numBars }).map((_, index) => {
            const height = calculateHeight(index, numBars);
            const barStyle: CSSProperties & { ['--initial-scale']: number } = {
              flex: `1 0 calc(100% / ${numBars})`,
              maxWidth: `calc(100% / ${numBars})`,
              height: '100%',
              background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
              transform: `scaleY(${height / 100})`,
              transformOrigin: 'bottom',
              transition: 'transform 0.5s ease-in-out',
              animation: `pulseBar ${animationDuration}s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.1}s`,
              outline: '1px solid rgba(0, 0, 0, 0)',
              boxSizing: 'border-box',
              ['--initial-scale']: height / 100,
            };

            return <div key={index} style={barStyle} />;
          })}
        </div>
      </div>
    </>
  );
};

const ContainerScroll: React.FC<{
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}> = ({ titleComponent, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const scaleRange = isMobile ? [0.9, 1] : [1.05, 1];

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      className="h-[38rem] md:h-[49rem] flex justify-center relative px-2 md:px-16"
      ref={containerRef}
    >
      <div
        className="py-5 md:py-8 w-full relative"
        style={{ perspective: '1000px' }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <ScrollCard rotate={rotate} scale={scale}>
          {children}
        </ScrollCard>
      </div>
    </div>
  );
};

const Header: React.FC<{
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}> = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center mb-6 md:mb-8"
    >
      {titleComponent}
    </motion.div>
  );
};

const ScrollCard: React.FC<{
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}> = ({ rotate, scale, children }) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className="max-w-5xl mx-auto h-[28rem] md:h-[38rem] w-full border-4 border-[#6C6C6C] p-3 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 flex">
        {children}
      </div>
    </motion.div>
  );
};

export function LandingPage() {
  const navigate = useNavigate();
  const [activeCreatorCategory, setActiveCreatorCategory] = useState<string>('All');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredCreators =
    activeCreatorCategory === 'All'
      ? featuredCreators
      : featuredCreators.filter((creator) =>
          creator.category.toLowerCase().includes(activeCreatorCategory.toLowerCase()),
        );

  return (
    <div className="flex flex-col">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-[#050014] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,213,255,0.32)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.32)_0,_transparent_55%)]" />
        <div className="relative z-10 mx-auto flex max-w-none flex-col px-2 pb-4 pt-6 md:max-w-7xl md:px-8 md:pb-6 md:pt-8">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-6 md:gap-10">
              <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
                <span className="h-8 w-8 rounded-2xl bg-gradient-to-br from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] shadow-[0_0_25px_rgba(192,69,255,0.6)]" />
                <span>FanMeet</span>
              </div>
              <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
                <button
                  type="button"
                  onClick={() => navigate('/browse-events')}
                  className="transition-colors hover:text-white"
                >
                  Browse Events
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/how-it-works')}
                  className="transition-colors hover:text-white"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/for-creators')}
                  className="transition-colors hover:text-white"
                >
                  For Creators
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden rounded-full border border-white/30 bg-black/40 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white hover:bg-black/60 hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] md:inline-flex"
                onClick={() => navigate('/auth')}
              >
                Log in
              </button>
              <button
                type="button"
                className="hidden rounded-full border border-transparent bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] px-4 py-1.5 text-xs font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(192,69,255,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E6FF00] md:inline-flex"
                onClick={() => navigate('/auth')}
              >
                Sign up
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-full border border-white/40 bg-black/40 p-2 text-white shadow-md backdrop-blur-xl transition-colors md:hidden"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                <span className="sr-only">Toggle navigation</span>
                <div className="flex flex-col gap-[3px]">
                  <span className="h-[2px] w-4 bg-white" />
                  <span className="h-[2px] w-4 bg-white" />
                  <span className="h-[2px] w-4 bg-white" />
                </div>
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/20 bg-black/70 p-4 text-sm md:hidden">
              <button
                type="button"
                className="w-full rounded-full bg-white/10 px-4 py-2 text-left font-medium text-white hover:bg-white/20"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/browse-events');
                }}
              >
                Browse Events
              </button>
              <button
                type="button"
                className="w-full rounded-full bg-white/10 px-4 py-2 text-left font-medium text-white hover:bg-white/20"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/how-it-works');
                }}
              >
                How It Works
              </button>
              <button
                type="button"
                className="w-full rounded-full bg-white/10 px-4 py-2 text-left font-medium text-white hover:bg-white/20"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/for-creators');
                }}
              >
                For Creators
              </button>
              <div className="mt-1 flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-full border border-white/40 bg-black/60 px-4 py-2 text-center text-xs font-medium text-white hover:bg-black/80"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/auth');
                  }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="w-full rounded-full bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] px-4 py-2 text-center text-xs font-semibold text-white shadow-md hover:shadow-[0_0_25px_rgba(192,69,255,0.8)]"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/auth');
                  }}
                >
                  Sign up
                </button>
              </div>
            </div>
          )}
          <motion.div
            className="mt-6 flex flex-col gap-8 md:mt-12 md:flex-row md:items-stretch"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="flex w-full flex-col md:w-1/2 lg:w-3/5">
              <div className="max-w-xl space-y-6">
                <p
                  className="inline-block text-xl font-normal text-white/90 drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)] sm:text-2xl"
                  style={{ fontFamily: 'cursive' }}
                >
                  meet your favourite creators on fanmet
                </p>
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                  Live 1:1 video calls
                  <span className="block text-[#FACC15]">with the people you actually care about.</span>
                </h1>
                <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF]" />
                <p className="max-w-lg text-sm text-white/80 sm:text-base">
                  Bid in tiny live auctions to win 5–10 minute video hangs with creators, gamers, chefs, coaches and other
                  internet favourites. If you don&apos;t win, you get most of your money back.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/fan')}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(192,69,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6FF00] focus-visible:ring-offset-2"
                  >
                    Explore live meets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('how-it-works');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/40 px-5 py-2.5 text-sm font-medium text-white shadow-md backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-black/70"
                  >
                    <span className="mr-2 text-base">▶️</span>
                    How FanMeet works
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 text-xs text-white/80 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22C55E]/20 text-sm">🔒</span>
                  <span>90% refund if you don&apos;t win the bid.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D5FF]/20 text-sm">✅</span>
                  <span>Verified creators, safe payments, no fake profiles.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EC4899]/20 text-sm">🇮🇳</span>
                  <span>Built in India for Indian fans &amp; creators.</span>
                </div>
              </div>
            </div>
            <motion.div
              className="hidden w-full h-[280px] md:block md:h-[440px] md:w-1/2 lg:h-[530px] lg:w-2/5"
              initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
              animate={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}
              transition={{ duration: 1.2, ease: 'circOut' }}
            >
              <div className="h-full w-full overflow-hidden rounded-[32px] shadow-[0_28px_80px_rgba(0,0,0,0.85)]">
                <img
                  src={heroImage}
                  alt="FanMeet colourful hero"
                  className="h-full w-full object-cover"
                />
                <div className="hidden h-full w-full rounded-[32px] bg-gradient-to-t from-black/60 via-black/10 to-transparent md:block" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: ANIMATED EXPLAINER VIDEO */}
      <section id="how-it-works" className="bg-white px-6 py-16 md:px-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#140423]">Scroll through how FanMeet works</h2>
            <p className="mt-2 text-base text-[#4A3B78]">
              Cards stack as you scroll, revealing every piece of the fan-meet journey – from bidding to posting your own events.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <motion.article
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF6B9D] via-[#FFC46B] to-[#E6FF00] p-[1px] shadow-[0_18px_45px_rgba(255,107,157,0.55)]"
              whileHover={{ y: -12, rotateX: 3, rotateY: -3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <div className="flex h-full flex-col rounded-[26px] bg-white/95 p-5 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#C045FF]">Step 1</p>
                <h3 className="text-lg font-semibold text-[#140423]">How it works</h3>
                <p className="mt-2 text-sm text-[#4A3B78]">
                  Browse upcoming events, pick your creator, and place a bid to win a live 1:1 video call.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[#4A3B78]">
                  {processSteps.map((step) => (
                    <li key={step.step} className="flex gap-2">
                      <span className="mt-0.5 text-base">{step.icon}</span>
                      <div>
                        <p className="font-medium text-[#140423]">{step.title}</p>
                        <p className="text-xs text-[#6C5A9C]">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>

            <motion.article
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE66B] via-[#E6FF00] to-[#00F0FF] p-[1px] shadow-[0_18px_45px_rgba(0,240,255,0.45)]"
              whileHover={{ y: -12, rotateX: 3, rotateY: 3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <div className="flex h-full flex-col rounded-[26px] bg-white/95 p-5 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#00A3FF]">Step 2</p>
                <h3 className="text-lg font-semibold text-[#140423]">Featured creators</h3>
                <p className="mt-2 text-sm text-[#4A3B78]">
                  Discover creators across categories. Tap a chip to filter the grid.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {['All', 'Beauty', 'Cosplay', 'Fitness', 'Music', 'Sports', 'Gaming'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCreatorCategory(category)}
                      className={
                        'rounded-full px-3 py-1 font-medium transition-colors ' +
                        (activeCreatorCategory === category
                          ? 'bg-[#140423] text-white'
                          : 'bg-white/80 text-[#4A3B78] hover:bg-white')
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 text-xs text-[#4A3B78] md:grid-cols-2">
                  {filteredCreators.slice(0, 4).map((creator) => (
                    <div
                      key={creator.name}
                      className="flex items-center gap-2 rounded-2xl bg-[#F8F5FF] px-3 py-2"
                    >
                      <Avatar initials={creator.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <p className="text-xs font-semibold text-[#140423]">{creator.name}</p>
                          <Badge variant="primary" className="px-2 py-0.5 text-[9px] leading-tight">
                            Verified
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#6C5A9C]">
                          {creator.category} · {creator.followers}
                        </p>
                        <p className="text-[11px] text-[#C045FF]">From {creator.priceRange}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>

            <motion.article
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#00F0FF] via-[#6B6BFF] to-[#C045FF] p-[1px] shadow-[0_18px_45px_rgba(107,107,255,0.55)]"
              whileHover={{ y: -12, rotateX: -3, rotateY: 3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <div className="flex h-full flex-col rounded-[26px] bg-white/95 p-5 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#C045FF]">Step 3</p>
                <h3 className="text-lg font-semibold text-[#140423]">Get verified as a creator</h3>
                <p className="mt-2 text-sm text-[#4A3B78]">
                  Apply once, get verified, and start hosting paid or free fan meets from anywhere.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[#4A3B78]">
                  <li>• 1K+ followers or a unique skill people want to learn</li>
                  <li>• Simple KYC & social verification by our team</li>
                  <li>• 90% payout on every winning bid · no hidden fees</li>
                </ul>
                <button
                  type="button"
                  onClick={() => navigate('/creator')}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#140423] shadow-md transition-transform hover:-translate-y-0.5"
                >
                  Apply to get verified
                </button>
              </div>
            </motion.article>

          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURED CREATORS */}
      <section
        className="bg-[radial-gradient(circle_at_top,_#FDF4FF_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#ECFEFF_0,_#FFFFFF_55%)] px-6 py-20 md:px-16"
        id="featured"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Who Can You Meet on FanMeet?</h2>
            <p className="mt-2 text-base text-[#6C757D]">We have creators from every field!</p>
          </div>

          <div className="flex w-full flex-col items-center justify-center">
            <div className="w-[250px] h-[250px] md:w-[420px] md:h-[420px] flex items-center justify-center">
              <SphereImageGrid
                images={featuredCreatorImages}
                containerSize={280}
                sphereRadius={130}
                autoRotate
                autoRotateSpeed={0.35}
                dragSensitivity={0.7}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: SOCIAL PROOF NUMBERS */}
      <section className="hidden bg-[radial-gradient(circle_at_top,_#00D5FF_0,_#050014_50%),radial-gradient(circle_at_bottom,_#F97316_0,_#050014_55%)] px-6 py-16 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Join Thousands of Happy Fans! 🎉</h2>
            <p className="text-lg text-[#ADB5BD]">Real numbers from real people having real conversations</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {socialProofStatsTop.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-bold text-[#FACC15]">{stat.value}</div>
                <div className="text-sm text-[#ADB5BD]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {socialProofStatsBottom.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-bold text-[#22C55E]">{stat.value}</div>
                <div className="text-sm text-[#ADB5BD]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: OVERVIEW VIDEO (FULL-WIDTH) */}
      <section className="relative overflow-hidden bg-[#050014] px-6 py-16 text-white md:px-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,213,255,0.32)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.32)_0,_transparent_55%)]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] md:items-center">
          <div className="space-y-4 text-left text-white">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#E6FF00] backdrop-blur-md">
              LIVE DEMO
            </p>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.6rem]">
              See how a real FanMeet feels in under 2 minutes
            </h2>
            <p className="max-w-xl text-sm text-white/80 sm:text-base">
              Watch a real fan bid, win, and jump into a live video call with their favourite creator. No scripts, no actors
              – just genuine reactions.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>• What the bidding screen looks like in action</li>
              <li>• How we keep calls safe, timed, and high-quality</li>
              <li>• The moment a fan realises their call is actually happening</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-3xl">
            <div className="relative overflow-hidden rounded-[28px] bg-black/40 p-[2px] shadow-[0_20px_60px_rgba(5,0,20,0.7)]">
              <div className="relative aspect-video w-full overflow-hidden rounded-[24px] bg-black">
                {!videoPlaying ? (
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(true)}
                    className="group relative h-full w-full"
                  >
                    <img
                      src="https://cdn.prod.website-files.com/62c48d78ef34931f8a604ef5/67630876396363c467036ede_video-poster.webp"
                      alt="FanMeet overview video preview"
                      className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white">
                      <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-md">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#C045FF] shadow-lg">
                          ▶
                        </span>
                        <span className="text-xs sm:text-sm">Play 2 min overview</span>
                      </div>
                      <p className="max-w-md text-xs text-white/80 sm:text-sm">
                        "This feels like a private show with your favourite creator. I forgot we were on camera." – real fan
                      </p>
                    </div>
                  </button>
                ) : (
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube.com/embed/S5IQtZlgNC8?autoplay=1&rel=0&modestbranding=1"
                    title="FanMeet overview video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: VIDEO TESTIMONIALS - CREATORS */}
      <section className="bg-[radial-gradient(circle_at_top,_#FDF4FF_0,_#F8F9FA_55%),radial-gradient(circle_at_bottom,_#ECFEFF_0,_#F8F9FA_55%)] px-6 py-20 md:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Creators Love FanMeet Too</h2>
            <p className="mt-2 text-base text-[#6C757D]">Hear how meaningful conversations boost their community and income</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {creatorVideoTestimonials.map((video) => (
              <Card key={video.name} elevated className="overflow-hidden border border-[#E9ECEF]">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-[#212529] via-[#343A40] to-[#212529]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#C045FF] shadow">
                      ▶️ {video.duration}
                    </span>
                  </div>
                </div>
                <CardContent className="flex flex-col gap-4 p-6">
                  <p className="text-sm font-semibold text-[#212529]">{video.name}</p>
                  <p className="text-sm text-[#6C757D]">“{video.quote}”</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: PHOTO REVIEWS WITH CARDS */}
      <section className="bg-[radial-gradient(circle_at_top,_#FFF7ED_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#FDF4FF_0,_#FFFFFF_55%)] px-6 py-16 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Real FanMeets</h2>
            <p className="mt-2 text-base text-[#6C757D]">
              Real moments and reactions captured from live FanMeet calls.
            </p>
          </div>

          <div className="flex flex-col gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, index) => {
              const photo = photoReviews[index % photoReviews.length];
              const fullReview = textReviews[index % textReviews.length];
              const imageUrl = realFanmeetImageUrls[index % realFanmeetImageUrls.length];

              return (
                <ContainerScroll
                  key={`${photo.id}-scroll-${index}`}
                  titleComponent={
                    <div className="mt-6 md:mt-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#C045FF]">
                        Real FanMeet #{index + 1}
                      </p>
                      <p className="mt-1 text-sm text-[#6C757D]">{photo.context}</p>
                    </div>
                  }
                >
                  <div className="flex h-full">
                    <div className="flex h-full flex-col md:flex-row gap-4 rounded-2xl bg-white p-3 md:p-4 shadow-md border border-[#F1F3F5] w-full">
                      <div className="w-full md:w-1/2">
                        <div className="h-full w-full overflow-hidden rounded-xl">
                          <img
                            src={imageUrl}
                            alt={photo.context}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#C045FF]">
                            Full Review
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#212529]">
                            “{fullReview.quote}”
                          </p>
                        </div>
                        <div className="mt-3 flex flex-col gap-1 text-xs text-[#6C757D]">
                          <span className="font-semibold text-[#212529]">{fullReview.name}</span>
                          <span>{fullReview.met}</span>
                          <span className="text-[11px] text-[#868E96]">Moment: {photo.context}</span>
                          <span className="flex items-center gap-1 text-[#C045FF]">
                            {'★★★★★'.split('').map((star, starIndex) => (
                              <span key={`${photo.id}-star-${starIndex}`}>{star}</span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ContainerScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 11: TRUST & SAFETY */}
      <section
        className="bg-[radial-gradient(circle_at_top,_#FDF4FF_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#ECFEFF_0,_#FFFFFF_55%)] px-6 py-20 md:px-16"
        id="trust"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Trust Comes First</h2>
            <p className="mt-2 text-base text-[#6C757D]">We built FanMeet to be safe, secure, and fan-friendly from day one.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {trustPillars.map((pillar) => (
              <Card key={pillar.title} elevated className="h-full border border-[#F1F3F5]">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center gap-3 text-[#C045FF]">
                    <span className="text-2xl">{pillar.icon}</span>
                    <span className="text-sm font-semibold uppercase tracking-wide text-[#6C757D]">{pillar.badge}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#212529]">{pillar.title}</h3>
                  <ul className="space-y-2 text-sm text-[#6C757D]">
                    {pillar.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="text-[#C045FF]">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 12: PRICING EXPLAINED */}
      <section
        className="bg-[radial-gradient(circle_at_top,_#ECFEFF_0,_#F8F9FA_55%),radial-gradient(circle_at_bottom,_#FDF4FF_0,_#F8F9FA_55%)] px-6 py-20 md:px-16"
        id="pricing"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Two Ways to Meet Your Heroes</h2>
            <p className="mt-2 text-base text-[#6C757D]">Whether you want to bid or try your luck, FanMeet keeps it fair and transparent.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {pricingOptions.map((option) => (
              <Card key={option.title} elevated className="border border-[#E9ECEF] bg-white">
                <CardHeader title={option.title} subtitle={option.description} className="border-b border-[#F1F3F5]" />
                <CardContent className="flex flex-col gap-4 p-6">
                  <ul className="space-y-3 text-sm text-[#212529]">
                    {option.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <span className="text-[#C045FF]">✔</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-[14px] bg-[#FFF3ED] p-4 text-sm text-[#6C757D]">{option.story}</p>
                  <Button className="mt-2 w-full" variant="secondary">
                    {option.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 14: MEET THE TEAM */}
      <section
        className="bg-[radial-gradient(circle_at_top,_#FDF4FF_0,_#F8F9FA_55%),radial-gradient(circle_at_bottom,_#ECFEFF_0,_#F8F9FA_55%)] px-6 py-20 md:px-16"
        id="team"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-[0.25em] text-[#212529]">ABOUT US</h2>
          </div>
          <AnimatedTestimonials testimonials={teamTestimonials} autoplay />
        </div>
      </section>

      {/* SECTION 15: FAQ */}
      <section
        className="hidden bg-[radial-gradient(circle_at_top,_#FFF7ED_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#FDF4FF_0,_#FFFFFF_55%)] px-6 py-20 md:px-16"
        id="faq"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Questions? We Already Answered Them.</h2>
            <p className="mt-2 text-base text-[#6C757D]">Everything fans and creators ask before hitting that “Bid” or “Apply” button.</p>
          </div>

          <div className="flex flex-col gap-4">
            {faqItems.map((faq) => (
              <details key={`${faq.category}-${faq.question}`} className="group rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-[#212529]">
                  <span className="text-[#C045FF]">[{faq.category}]</span>
                  <span className="flex-1 text-[#212529]">{faq.question}</span>
                  <span className="text-[#ADB5BD] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#6C757D]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 16: PRESS & SOCIAL LOVE */}
      <section
        className="hidden bg-[radial-gradient(circle_at_top,_#00D5FF_0,_#050014_50%),radial-gradient(circle_at_bottom,_#EC4899_0,_#050014_55%)] px-6 py-20 text-white md:px-16"
        id="press"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">People Are Talking About FanMeet</h2>
            <p className="mt-2 text-base text-[#CED4DA]">Press features, creator shoutouts, and community buzz.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {pressEntries.map((entry) => (
              <Card key={`${entry.type}-${entry.name}`} className="border border-[#343A40] bg-[#2C3036]">
                <CardContent className="flex flex-col gap-3 p-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#C045FF]">
                    {entry.type === 'press' ? 'As Seen In' : 'From the Community'}
                  </span>
                  <h3 className="text-lg font-semibold text-[#212529]">{entry.name}</h3>
                  <p className="text-sm text-[#212529]">{entry.quote}</p>
                  <Button variant="ghost" className="self-start px-0 text-sm text-[#C045FF]">
                    Read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 17: HOW WE'RE DIFFERENT */}
      <section
        className="hidden bg-[radial-gradient(circle_at_top,_#ECFEFF_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#FDF4FF_0,_#FFFFFF_55%)] px-6 py-20 md:px-16"
        id="comparison"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Why FanMeet Beats DMs and Cameo</h2>
            <p className="mt-2 text-base text-[#6C757D]">The only place for real, two-way conversations with creators you admire.</p>
          </div>

          <div className="overflow-x-auto rounded-[18px] border border-[#E9ECEF]">
            <table className="min-w-full divide-y divide-[#E9ECEF]">
              <thead className="bg-[#F8F9FA] text-sm uppercase tracking-wide text-[#6C757D]">
                <tr>
                  <th className="px-4 py-3 text-left">Feature</th>
                  <th className="px-4 py-3 text-left text-[#C045FF]">FanMeet</th>
                  <th className="px-4 py-3 text-left">Commenting</th>
                  <th className="px-4 py-3 text-left">Paid Shoutouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-sm text-[#212529]">
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="bg-white">
                    <td className="px-4 py-3 font-medium text-[#212529]">{row.feature}</td>
                    <td className="px-4 py-3 text-[#20C997]">{row.fanmeet}</td>
                    <td className="px-4 py-3 text-[#6C757D]">{row.social}</td>
                    <td className="px-4 py-3 text-[#6C757D]">{row.cameo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-sm text-[#6C757D]">FanMeet is the only place to have a REAL conversation with creators you admire.</p>
        </div>
      </section>

      {/* SECTION 18: SUCCESS STORIES */}
      <section
        className="hidden bg-[radial-gradient(circle_at_top,_#FDF4FF_0,_#F8F9FA_55%),radial-gradient(circle_at_bottom,_#FFF7ED_0,_#F8F9FA_55%)] px-6 py-20 md:px-16"
        id="success-stories"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#212529]">Three Stories You Will Brag About Later</h2>
            <p className="mt-2 text-base text-[#6C757D]">Real transformations from fans who hit “Bid” and never looked back.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {successStories.map((story) => (
              <Card key={story.title} elevated className="border border-[#E9ECEF]">
                <CardContent className="flex h-full flex-col gap-3 p-6">
                  <h3 className="text-lg font-semibold text-[#212529]">{story.title}</h3>
                  <div className="space-y-2 text-sm text-[#6C757D]">
                    <p>
                      <span className="font-semibold text-[#212529]">Before:</span> {story.before}
                    </p>
                    <p>
                      <span className="font-semibold text-[#212529]">During:</span> {story.during}
                    </p>
                    <p>
                      <span className="font-semibold text-[#212529]">After:</span> {story.after}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 19: FINAL CTA */}
      <section className="bg-[radial-gradient(circle_at_top,_#FFF7ED_0,_#FFFFFF_55%),radial-gradient(circle_at_bottom,_#FDF4FF_0,_#FFFFFF_55%)] px-6 py-20 md:px-16">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[#F1F3F5] bg-[radial-gradient(circle_at_top,_#FDF2EC_0,_#FFFFFF_70%)] p-10 text-center shadow-[var(--shadow-lg)]">
          <h2 className="text-3xl font-bold text-[#212529]">Ready to Meet Your Hero?</h2>
          <p className="mt-3 text-base text-[#6C757D]">Join 1,247 people who already had life-changing conversations.</p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="px-8 text-base">
              Browse Events & Start Bidding →
            </Button>
            <Button size="lg" variant="secondary" className="px-8 text-base">
              Apply to Become a Creator →
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[16px] bg-white p-4 text-sm text-[#6C757D]">
              “I bid ₹280, won the call, and my creator remembered me on stream a week later.” – Neeraj, Pune
            </div>
            <div className="rounded-[16px] bg-white p-4 text-sm text-[#6C757D]">
              “Applications took 2 minutes. I now run weekly coaching calls and finally understand my fans.” – Ananya, Creator
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-[#6C757D]">
            <span>✅ 90% Refund Guarantee</span>
            <span>✅ Verified Creators Only</span>
            <span>✅ Secure Payments</span>
            <span>✅ 24/7 Support</span>
          </div>
        </div>
      </section>

      {/* SECTION 20: FOOTER */}
      <footer className="bg-[#1B1C1F] px-6 py-16 text-white md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
            <div className="space-y-6">
              <div>
                <div className="text-2xl font-bold text-[#C045FF]">FanMeet</div>
                <p className="mt-2 text-sm text-[#ADB5BD]">{footerLinks.fanmeet.tagline}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#ADB5BD]">
                {paymentLogos.map((logo) => (
                  <span key={logo} className="rounded-full border border-[#343A40] px-3 py-1">
                    {logo}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[#ADB5BD]">
                {footerLinks.fanmeet.socials.map((social) => (
                  <Button key={social.label} variant="ghost" className="px-0 text-sm text-[#ADB5BD]">
                    {social.label} →
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">For Fans</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#ADB5BD]">
                  {footerLinks.fans.map((item) => (
                    <li key={item.label}>{item.label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">For Creators</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#ADB5BD]">
                  {footerLinks.creators.map((item) => (
                    <li key={item.label}>{item.label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#ADB5BD]">
                  {footerLinks.company.map((item) => (
                    <li key={item.label}>{item.label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#C045FF]">Support</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#ADB5BD]">
                  {footerLinks.support.map((item) => (
                    <li key={item.label}>{item.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#343A40] pt-6 text-center text-xs text-[#6C757D]">
            © {new Date().getFullYear()} FanMeet. Made with ❤️ in India. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
