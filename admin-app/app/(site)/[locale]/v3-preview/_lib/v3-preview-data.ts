export type V3PreviewRoute =
  | 'home'
  | 'listing'
  | 'area-guide'
  | 'calculator'
  | 'finder'
  | 'compare'
  | 'contact'
  | 'project-detail'
  | 'property-detail';

export type V3Project = {
  slug: string;
  badge: string;
  area: string;
  name: string;
  developer: string;
  from: string;
  yield: string;
  quota: string;
  beach: string;
  image: string;
  tone: string;
};

export type V3Area = {
  slug: string;
  label: string;
  listings: string;
  title: string;
  summary: string;
  thesis: string;
  image: string;
};

export type V3Advisor = {
  name: string;
  role: string;
  rating: string;
  image: string;
};

export const previewRoutes = new Set([
  'listing',
  'buy',
  'projects',
  'new-projects',
  'area-guide',
  'areas',
  'calculator',
  'invest',
  'finder',
  'smart-finder',
  'compare',
  'contact',
  'project',
  'property',
]);

export function resolveV3PreviewRoute(slug: string[] = []): V3PreviewRoute | null {
  const [first] = slug;

  if (!first) return 'home';
  if (first === 'listing' || first === 'buy' || first === 'projects' || first === 'new-projects') return 'listing';
  if (first === 'area-guide' || first === 'areas') return 'area-guide';
  if (first === 'calculator' || first === 'invest') return 'calculator';
  if (first === 'finder' || first === 'smart-finder') return 'finder';
  if (first === 'compare') return 'compare';
  if (first === 'contact') return 'contact';
  if (first === 'project') return 'project-detail';
  if (first === 'property') return 'property-detail';

  return null;
}

export const projects: V3Project[] = [
  {
    slug: 'skyharbor-residences',
    badge: 'New launch',
    area: 'Wongamat',
    name: 'Skyharbor Residences',
    developer: 'AMP Property Group · Q4 2026',
    from: '฿6.9M',
    yield: '6.8%',
    quota: '32% of 49%',
    beach: '80m',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80&auto=format&fit=crop',
    tone: 'Oceanfront tower with a refined arrival sequence and investor-grade unit mix.',
  },
  {
    slug: 'jomtien-bay-tower',
    badge: 'Best yield',
    area: 'Jomtien',
    name: 'Jomtien Bay Tower',
    developer: 'Sansiri × AMP · Q2 2027',
    from: '฿4.0M',
    yield: '7.4%',
    quota: '18% of 49%',
    beach: '220m',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80&auto=format&fit=crop',
    tone: 'High-yield beach corridor with efficient plans and remote buyer support.',
  },
  {
    slug: 'pratumnak-villas',
    badge: 'Move-in ready',
    area: 'Pratumnak Hill',
    name: 'Pratumnak Villas',
    developer: 'AMP Property Group · Ready to move',
    from: '฿29M',
    yield: '5.2%',
    quota: '71% of 49%',
    beach: '380m',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop',
    tone: 'Private hillside villas for buyers prioritizing space and quiet access.',
  },
  {
    slug: 'na-jomtien-residence',
    badge: 'Early bird -12%',
    area: 'Na Jomtien',
    name: 'Na Jomtien Residence',
    developer: 'Property Perfect · Q1 2028',
    from: '฿4.5M',
    yield: '6.9%',
    quota: '8% of 49%',
    beach: '50m',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    tone: 'Quiet beachfront plan with a slower lifestyle and early allocation window.',
  },
  {
    slug: 'central-marina-suites',
    badge: 'Highest yield',
    area: 'Central Pattaya',
    name: 'Central Marina Suites',
    developer: 'AP Thailand · Q3 2026',
    from: '฿3.0M',
    yield: '8.1%',
    quota: '41% of 49%',
    beach: '450m',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
    tone: 'Urban rental thesis near shopping, restaurants, and short-stay demand.',
  },
  {
    slug: 'bang-saray-view',
    badge: 'Quiet zone',
    area: 'Bang Saray',
    name: 'Bang Saray View',
    developer: 'Origin Property · Q4 2027',
    from: '฿3.2M',
    yield: '6.4%',
    quota: '4% of 49%',
    beach: '120m',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80&auto=format&fit=crop',
    tone: 'Fishing-village atmosphere with lower density and long-hold positioning.',
  },
  {
    slug: 'skyline-plaza-pattaya',
    badge: 'Foreign quota full',
    area: 'Central Pattaya',
    name: 'Skyline Plaza Pattaya',
    developer: 'Sansiri · Ready to move',
    from: '฿4.7M',
    yield: '6%',
    quota: '49% of 49%',
    beach: '200m',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80&auto=format&fit=crop',
    tone: 'Completed city project with strong walkability and limited foreign quota.',
  },
  {
    slug: 'rayong-coast-villas',
    badge: 'Beachfront villa',
    area: 'Rayong',
    name: 'Rayong Coast Villas',
    developer: 'AMP Property Group · Q2 2027',
    from: '฿19M',
    yield: '5.6%',
    quota: '0% of 49%',
    beach: 'Beachfront',
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200&q=80&auto=format&fit=crop',
    tone: 'Beachfront villa inventory for lifestyle-first buyers beyond central Pattaya.',
  },
];

export const areas: V3Area[] = [
  {
    slug: 'wongamat',
    label: '5-star beaches',
    listings: '14 listings',
    title: 'Wongamat',
    summary: 'Quiet luxury, resort hotels, private condos',
    thesis: '5-star quiet luxury',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'pratumnak-hill',
    label: 'Cosy Beach',
    listings: '22 listings',
    title: 'Pratumnak Hill',
    summary: 'Hillside villas',
    thesis: 'Private hillside living',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'jomtien',
    label: 'Jomtien Beach',
    listings: '38 listings',
    title: 'Jomtien',
    summary: 'High-yield investor',
    thesis: 'Income-first beach corridor',
    image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'central-pattaya',
    label: 'Pattaya Beach',
    listings: '47 listings',
    title: 'Central Pattaya',
    summary: 'Urban, walk-to-everything',
    thesis: 'Urban rental demand',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'na-jomtien',
    label: 'Na Jomtien',
    listings: '19 listings',
    title: 'Na Jomtien',
    summary: 'Quiet beachfront',
    thesis: 'Calm waterfront hold',
    image: 'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'bang-saray',
    label: 'Bang Saray',
    listings: '11 listings',
    title: 'Bang Saray',
    summary: 'Local fishing village',
    thesis: 'Low-density coastal life',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop',
  },
];

export const advisors: V3Advisor[] = [
  {
    name: 'Khun Apinya',
    role: 'Senior Advisor · TH · EN',
    rating: '4.95',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Marcus Lee',
    role: 'Investor Lead · EN · CN',
    rating: '4.92',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Sasha Volkov',
    role: 'Russian-speaking · RU · EN',
    rating: '4.88',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Nattapong S.',
    role: 'Property Manager · TH · EN',
    rating: '4.97',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Lin Wei',
    role: 'Mandarin lead · CN · EN',
    rating: '4.85',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
  },
];

export const testimonials = [
  {
    quote: 'AMP walked me through foreign ownership rules in 20 minutes — and found a 7.2% net-yield 1BR three weeks later.',
    author: 'Sven L. · Stockholm · 1BR Jomtien',
  },
  {
    quote: "They're the only Pattaya brokerage that gave me a written rental-return forecast before I signed. Numbers held up after 12 months.",
    author: 'David W. · Singapore · 2BR Wongamat',
  },
  {
    quote: 'Sasha managed everything remotely. She filmed five viewings on FaceTime and helped my notary in Moscow.',
    author: 'Anna M. · Moscow · Penthouse',
  },
  {
    quote: '3 units, 2 years. Each one cash-flowing within 60 days of handover. The property management team is the real moat.',
    author: 'James T. · Sydney · Portfolio investor',
  },
];

export const faqs = [
  'Can foreigners own property in Thailand?',
  'Do I need to be in Thailand to buy?',
  'How are funds transferred?',
  'What ongoing costs should I expect?',
  'How does AMP make money?',
  'What happens after I sign?',
];

export const heroImage = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80&auto=format&fit=crop';
export const contactHeroImage = 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1400&q=80&auto=format&fit=crop';
