/**
 * Schema.org JSON-LD generators for all page types.
 *
 * Implements Blueprint doc 10 — SCHEMA MARKUP PLAN.
 * Each function returns a plain object ready for JSON.stringify.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
const LOGO_URL = `${SITE_URL}/images/logo.png`;
const PHONE = process.env.NEXT_PUBLIC_PHONE ?? '+66-33-123-456';

// ---------------------------------------------------------------------------
// 1. Organization (Global — every page)
// ---------------------------------------------------------------------------
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AMP Pattaya',
    url: SITE_URL,
    logo: LOGO_URL,
    description:
      'Real Estate Intelligence Platform for Pattaya property investment, buying, renting, and selling.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: PHONE,
      contactType: 'sales',
      availableLanguage: ['English', 'Thai'],
    },
    sameAs: [
      'https://www.facebook.com/amppattaya',
      'https://line.me/R/ti/p/@amppattaya',
    ],
  };
}

// ---------------------------------------------------------------------------
// 2. BreadcrumbList
// ---------------------------------------------------------------------------
export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// 3. RealEstateListing (Project & Property Pages)
// ---------------------------------------------------------------------------
export function realEstateListingSchema(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  datePosted?: string;
  price?: number;
  currency?: string;
  address?: string;
  locality?: string;
  lat?: number;
  lng?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.datePosted ? { datePosted: opts.datePosted } : {}),
    ...(opts.price
      ? {
          offers: {
            '@type': 'Offer',
            price: String(opts.price),
            priceCurrency: opts.currency ?? 'THB',
            availability: 'https://schema.org/InStock',
            url: opts.url,
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: opts.address ?? '',
      addressLocality: opts.locality ?? 'Pattaya',
      addressRegion: 'Chonburi',
      addressCountry: 'TH',
    },
    ...(opts.lat && opts.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: String(opts.lat),
            longitude: String(opts.lng),
          },
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// 4. Residence (Property Detail)
// ---------------------------------------------------------------------------
export function residenceSchema(opts: {
  name: string;
  description: string;
  sizeSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: opts.name,
    description: opts.description,
    ...(opts.sizeSqm
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: String(opts.sizeSqm),
            unitCode: 'MTK',
          },
        }
      : {}),
    ...(opts.bedrooms != null ? { numberOfBedrooms: opts.bedrooms } : {}),
    ...(opts.bathrooms != null ? { numberOfBathroomsTotal: opts.bathrooms } : {}),
    ...(opts.amenities?.length
      ? {
          amenityFeature: opts.amenities.map((a) => ({
            '@type': 'LocationFeatureSpecification',
            name: a,
            value: true,
          })),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// 5. Product (Project/Property — pricing)
// ---------------------------------------------------------------------------
export function productSchema(opts: {
  name: string;
  image?: string;
  brand?: string;
  lowPrice?: number;
  highPrice?: number;
  currency?: string;
  offerCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.brand
      ? { brand: { '@type': 'Brand', name: opts.brand } }
      : {}),
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(opts.lowPrice ?? 0),
      highPrice: String(opts.highPrice ?? opts.lowPrice ?? 0),
      priceCurrency: opts.currency ?? 'THB',
      offerCount: String(opts.offerCount ?? 1),
      availability: 'https://schema.org/InStock',
    },
  };
}

// ---------------------------------------------------------------------------
// 6. FAQPage (Guide Pages)
// ---------------------------------------------------------------------------
export function faqSchema(
  questions: { question: string; answer: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// 7. Article (Blog/Guide Pages)
// ---------------------------------------------------------------------------
export function articleSchema(opts: {
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.url ? { url: opts.url } : {}),
    author: { '@type': 'Organization', name: 'AMP Pattaya' },
    publisher: {
      '@type': 'Organization',
      name: 'AMP Pattaya',
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

// ---------------------------------------------------------------------------
// 8. WebSite (Homepage only)
// ---------------------------------------------------------------------------
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AMP Pattaya',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/en/smart-finder/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// ---------------------------------------------------------------------------
// 9. RealEstateAgent / LocalBusiness (Homepage + Contact)
// ---------------------------------------------------------------------------
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'AMP Pattaya',
    image: LOGO_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pattaya',
      addressRegion: 'Chonburi',
      addressCountry: 'TH',
    },
    telephone: PHONE,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: 'THB 2,000,000 - 100,000,000',
  };
}

// ---------------------------------------------------------------------------
// 10. Place (Area Guide Pages)
// ---------------------------------------------------------------------------
export function placeSchema(opts: {
  name: string;
  description: string;
  url: string;
  lat?: number;
  lng?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: opts.name,
      addressRegion: 'Chonburi',
      addressCountry: 'TH',
    },
    ...(opts.lat && opts.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: String(opts.lat),
            longitude: String(opts.lng),
          },
        }
      : {}),
  };
}
