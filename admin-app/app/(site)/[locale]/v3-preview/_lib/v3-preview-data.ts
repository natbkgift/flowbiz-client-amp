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
  availability: string;
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
  image: string;
};

export type V3ProcessNote = {
  title: string;
  body: string;
  label: string;
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
    slug: 'amp-skyharbor',
    badge: 'Under construction',
    area: 'Wongamat',
    name: 'Skyharbor Residences',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Wongamat',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80&auto=format&fit=crop',
    tone: 'Gallery-first project detail direction for owner review, with price, availability, and project details to confirm.',
  },
  {
    slug: 'jomtien-bay-tower',
    badge: 'Availability to verify',
    area: 'Jomtien',
    name: 'Jomtien Bay Tower',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Jomtien',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80&auto=format&fit=crop',
    tone: 'Project card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'pratumnak-villas',
    badge: 'Availability to verify',
    area: 'Pratumnak Hill',
    name: 'Pratumnak Villas',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Pratumnak Hill',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop',
    tone: 'Villa card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'na-jomtien-residence',
    badge: 'Availability to verify',
    area: 'Na Jomtien',
    name: 'Na Jomtien Residence',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Na Jomtien',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    tone: 'Project card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'central-marina-suites',
    badge: 'Availability to verify',
    area: 'Central Pattaya',
    name: 'Central Marina Suites',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Central Pattaya',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
    tone: 'City project card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'bang-saray-view',
    badge: 'Availability to verify',
    area: 'Bang Saray',
    name: 'Bang Saray View',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Bang Saray',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80&auto=format&fit=crop',
    tone: 'Coastal project card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'skyline-plaza-pattaya',
    badge: 'Availability to verify',
    area: 'Central Pattaya',
    name: 'Skyline Plaza Pattaya',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Central Pattaya',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80&auto=format&fit=crop',
    tone: 'Resale-style card treatment for visual review with commercial details to verify.',
  },
  {
    slug: 'rayong-coast-villas',
    badge: 'Availability to verify',
    area: 'Rayong',
    name: 'Rayong Coast Villas',
    developer: 'Project details subject to confirmation',
    from: 'Price on request',
    availability: 'Availability to verify',
    quota: 'Project details subject to confirmation',
    beach: 'Rayong',
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200&q=80&auto=format&fit=crop',
    tone: 'Villa card treatment for visual review with commercial details to verify.',
  },
];

export const areas: V3Area[] = [
  {
    slug: 'wongamat',
    label: '5-star beaches',
    listings: 'Availability to verify',
    title: 'Wongamat',
    summary: 'Quiet luxury, resort hotels, private condos',
    thesis: '5-star quiet luxury',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'pratumnak-hill',
    label: 'Cosy Beach',
    listings: 'Availability to verify',
    title: 'Pratumnak Hill',
    summary: 'Hillside villas',
    thesis: 'Private hillside living',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'jomtien',
    label: 'Jomtien Beach',
    listings: 'Availability to verify',
    title: 'Jomtien',
    summary: 'Buyer journey to verify',
    thesis: 'Income-first beach corridor',
    image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'central-pattaya',
    label: 'Pattaya Beach',
    listings: 'Availability to verify',
    title: 'Central Pattaya',
    summary: 'Urban, walk-to-everything',
    thesis: 'Urban rental demand',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'na-jomtien',
    label: 'Na Jomtien',
    listings: 'Availability to verify',
    title: 'Na Jomtien',
    summary: 'Quiet beachfront',
    thesis: 'Calm waterfront hold',
    image: 'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1200&q=80&auto=format&fit=crop',
  },
  {
    slug: 'bang-saray',
    label: 'Bang Saray',
    listings: 'Availability to verify',
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
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Marcus Lee',
    role: 'Investor Lead · EN · CN',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Sasha Volkov',
    role: 'Russian-speaking · RU · EN',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Nattapong S.',
    role: 'Property Manager · TH · EN',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop',
  },
  {
    name: 'Lin Wei',
    role: 'Mandarin lead · CN · EN',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
  },
];

export const processNotes: V3ProcessNote[] = [
  {
    title: 'Discovery',
    body: 'Capture buyer intent, preferred zones, budget range, and timing before any recommendation.',
    label: 'Step one',
  },
  {
    title: 'Shortlist',
    body: 'Prepare a project brief with price, availability, and project details marked for confirmation.',
    label: 'Review pack',
  },
  {
    title: 'Viewing',
    body: 'Coordinate questions, viewing notes, floor-plan requests, and advisor follow-up in one place.',
    label: 'Advisor flow',
  },
  {
    title: 'Confirmation',
    body: 'Confirm pricing, availability, ownership route, documents, and timelines before production use.',
    label: 'Final check',
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
