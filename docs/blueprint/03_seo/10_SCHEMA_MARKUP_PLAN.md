# 10 -- SCHEMA MARKUP PLAN

> Phase 3: SEO & Linking Layer -- Structured data (JSON-LD) for all page types.

---

## Overview

AMP Pattaya implements Schema.org structured data via JSON-LD in the `<head>` of every page. This enables rich results in Google Search and provides search engines with explicit signals about content type, pricing, and availability.

---

## Schema Types by Page

| Page Type | Schema Types |
|-----------|-------------|
| All Pages | Organization, Breadcrumb |
| Homepage | Organization, LocalBusiness, WebSite |
| Project Page | RealEstateListing, Product, Breadcrumb |
| Property Detail | RealEstateListing, Product, Breadcrumb |
| Area Guide | Place, Breadcrumb |
| Developer Page | Organization, Breadcrumb |
| Guide/Blog | Article, Breadcrumb, FAQ (if applicable) |
| Contact | LocalBusiness, ContactPoint |

---

## 1. Organization (Global)

Present on every page.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AMP Pattaya",
  "url": "https://amppattaya.com",
  "logo": "https://amppattaya.com/images/logo.png",
  "description": "Real Estate Intelligence Platform for Pattaya property investment, buying, renting, and selling.",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+66-XX-XXX-XXXX",
    "contactType": "sales",
    "availableLanguage": ["English", "Thai"]
  },
  "sameAs": [
    "https://www.facebook.com/amppattaya",
    "https://line.me/R/ti/p/@amppattaya"
  ]
}
```

---

## 2. Breadcrumb (All Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://amppattaya.com/en/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Projects",
      "item": "https://amppattaya.com/en/projects/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "The Riviera Jomtien",
      "item": "https://amppattaya.com/en/projects/the-riviera-jomtien/"
    }
  ]
}
```

---

## 3. RealEstateListing (Project & Property Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "The Riviera Jomtien - 2BR Condo",
  "description": "Luxury 2-bedroom condo in Jomtien Beach area...",
  "url": "https://amppattaya.com/en/projects/the-riviera-jomtien/",
  "image": "https://amppattaya.com/images/projects/riviera-hero.jpg",
  "datePosted": "2025-01-15",
  "validThrough": "2025-12-31",
  "offers": {
    "@type": "Offer",
    "price": "4500000",
    "priceCurrency": "THB",
    "availability": "https://schema.org/InStock",
    "url": "https://amppattaya.com/en/projects/the-riviera-jomtien/"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jomtien Beach Road",
    "addressLocality": "Pattaya",
    "addressRegion": "Chonburi",
    "addressCountry": "TH"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "12.8833",
    "longitude": "100.8667"
  }
}
```

---

## 4. Residence (Property Detail)

For individual units with full specifications:

```json
{
  "@context": "https://schema.org",
  "@type": "Residence",
  "name": "2BR Condo Unit 2305 - The Riviera Jomtien",
  "description": "Fully furnished 2-bedroom condo with sea view...",
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": "65",
    "unitCode": "MTK"
  },
  "numberOfBedrooms": 2,
  "numberOfBathroomsTotal": 1,
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Pool", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Gym", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Parking", "value": true }
  ]
}
```

---

## 5. Product (Property Detail -- for pricing)

Use alongside RealEstateListing for Google Merchant compatibility:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "2BR Condo - The Riviera Jomtien",
  "image": "https://amppattaya.com/images/units/2305-hero.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Heights Holdings"
  },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "3500000",
    "highPrice": "8500000",
    "priceCurrency": "THB",
    "offerCount": "45",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## 6. FAQ (Guide Pages)

For articles structured with Q&A sections:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can a foreigner own a condo in Thailand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, foreigners can own up to 49% of the total unit space in a condominium building under the Condominium Act."
      }
    },
    {
      "@type": "Question",
      "name": "What is the average ROI for Pattaya condos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average rental yield for Pattaya condos ranges from 5-8% annually, depending on location and property type."
      }
    }
  ]
}
```

---

## 7. Article (Blog/Guide Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Condos in Jomtien for Investment in 2025",
  "description": "Comprehensive guide to the top investment condos in Jomtien Beach area...",
  "image": "https://amppattaya.com/images/guides/jomtien-condos.jpg",
  "author": {
    "@type": "Organization",
    "name": "AMP Pattaya"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AMP Pattaya",
    "logo": {
      "@type": "ImageObject",
      "url": "https://amppattaya.com/images/logo.png"
    }
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-02-01"
}
```

---

## 8. WebSite (Homepage only)

Enables Sitelinks Search Box:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AMP Pattaya",
  "url": "https://amppattaya.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://amppattaya.com/en/smart-finder/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 9. LocalBusiness (Homepage + Contact)

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "AMP Pattaya",
  "image": "https://amppattaya.com/images/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Pattaya",
    "addressRegion": "Chonburi",
    "addressCountry": "TH"
  },
  "telephone": "+66-XX-XXX-XXXX",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "09:00",
    "closes": "18:00"
  },
  "priceRange": "THB 2,000,000 - 100,000,000"
}
```

---

## Implementation Notes

### Where to Place JSON-LD

In Next.js, use the `<Script>` component or embed in page metadata:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

### Data Sources

- Organization/LocalBusiness: hardcoded constants
- Breadcrumb: derived from URL path
- RealEstateListing/Residence: from database record
- Article/FAQ: from CMS/article content
- Product: from project/property data

### Validation

Use Google Rich Results Test for every schema type before deployment.

---

## Validation Checklist

- [ ] Organization schema renders on every page
- [ ] Breadcrumb schema matches visible breadcrumbs
- [ ] RealEstateListing schema on all project and property pages
- [ ] FAQ schema on applicable guide pages
- [ ] Article schema on all blog/guide pages
- [ ] No validation errors in Google Rich Results Test
- [ ] No validation errors in Schema.org validator
- [ ] Schema data matches visible page content (no mismatch)
