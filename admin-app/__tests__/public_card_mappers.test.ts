import { describe, expect, it } from 'vitest';

import {
  mapProjectToPublicCardData,
  mapPropertyToPublicCardData,
} from '@/app/_lib/public-card-mappers';

describe('public card data mappers', () => {
  it('maps full property data into the public property card contract', () => {
    const card = mapPropertyToPublicCardData({
      id: 'property-1',
      source_id: 'source-1',
      title: 'Riviera California - #RT04076 | Renthai',
      type: 'resale',
      property_type: 'sea_view_condo',
      price: 8900000,
      bedrooms: 2,
      bathrooms: 2,
      size_sqm: 65,
      address: 'Wongamat',
      city: 'Pattaya',
      images: ['/images/property-interior.png'],
      local_images: ['/images/property-exterior.png'],
      cover_image: '/images/property-pool.png',
      status: 'published',
      slug: 'riviera-california-sea-view',
      view: 'Sea view',
      is_featured: true,
    });

    expect(card).toMatchObject({
      id: 'property-1',
      title: 'Riviera California',
      href: '/en/property/riviera-california-sea-view',
      imageSrc: '/images/property-pool.png',
      imageAlt: 'Riviera California in Wongamat',
      location: 'Wongamat',
      priceLabel: 'THB 8,900,000',
      listingType: 'sale',
      propertyType: 'Sea View Condo',
      bedrooms: 2,
      bathrooms: 2,
      sizeLabel: '65 sqm',
      viewLabel: 'Sea view',
      statusLabel: 'Published',
      isFeatured: true,
    });
  });

  it('maps missing optional property fields without broken text or crashes', () => {
    const card = mapPropertyToPublicCardData({
      id: 'property-minimal',
      source_id: 'source-minimal',
      title: '',
      type: 'resale',
      price: 0,
      address: '',
      city: '',
      images: null,
      local_images: null,
      cover_image: null,
      status: '',
      slug: null,
    });

    expect(card.title).toBe('Pattaya property');
    expect(card.href).toBe('/en/public/properties/property-minimal');
    expect(card.imageSrc).toBe('/images/property-placeholder.svg');
    expect(card.imageAlt).toBe('Pattaya property in Pattaya');
    expect(card.location).toBe('Pattaya');
    expect(card.priceLabel).toBe('Price on request');
    expect(card.propertyType).toBeUndefined();
    expect(card.bedrooms).toBeUndefined();
    expect(card.bathrooms).toBeUndefined();
    expect(card.sizeLabel).toBeUndefined();
    expect(card.viewLabel).toBeUndefined();
    expect(card.statusLabel).toBeUndefined();
    expect(card.isFeatured).toBe(false);
  });

  it('maps sale and rent listing types correctly', () => {
    const sale = mapPropertyToPublicCardData({
      id: 'sale-1',
      title: 'Sale property',
      type: 'new',
      price: 1,
      address: 'Jomtien',
      city: 'Pattaya',
      images: null,
      status: 'published',
      slug: 'sale-property',
    });
    const rent = mapPropertyToPublicCardData({
      id: 'rent-1',
      title: 'Rent property',
      type: 'rent',
      price: 1,
      address: 'Jomtien',
      city: 'Pattaya',
      images: null,
      status: 'published',
      slug: 'rent-property',
    });

    expect(sale.listingType).toBe('sale');
    expect(rent.listingType).toBe('rent');
    expect(rent.href).toBe('/en/property/rent-property');
  });

  it('maps full project data into the public project card contract', () => {
    const card = mapProjectToPublicCardData({
      id: 'project-1',
      slug: 'once-wongamat',
      name: 'Once Wongamat',
      status: 'new_launch',
      cover_image_url: '/images/project-overview.png',
      hero_image_url: '/images/property-exterior.png',
      images: ['/images/property-pool.png'],
      starting_price: 4200000,
      area: { id: 'area-1', slug: 'wongamat', name: 'Wongamat' },
      highlights: ['Foreign quota available', 'Beach access'],
      features: ['High-floor sea views'],
      tags: ['Beach access'],
      completion_year: 2028,
      created_at: null,
      updated_at: null,
    });

    expect(card).toMatchObject({
      id: 'project-1',
      name: 'Once Wongamat',
      href: '/en/projects/once-wongamat',
      imageSrc: '/images/project-overview.png',
      imageAlt: 'Project image for Once Wongamat in Wongamat',
      location: 'Wongamat',
      startingPriceLabel: 'From THB 4,200,000',
      completionLabel: 'Completion 2028',
      statusLabel: 'New Launch',
      highlights: ['Foreign quota available', 'Beach access', 'High-floor sea views'],
    });
  });

  it('maps missing optional project fields without broken text or crashes', () => {
    const card = mapProjectToPublicCardData({
      id: 'project-minimal',
      slug: '',
      name: '',
      status: '',
      cover_image_url: null,
      hero_image_url: null,
      images: null,
      starting_price: null,
      created_at: null,
      updated_at: null,
    });

    expect(card.name).toBe('Pattaya project');
    expect(card.href).toBe('/en/projects');
    expect(card.imageSrc).toBe('/images/project-overview.png');
    expect(card.imageAlt).toBe('Project image for Pattaya project in Pattaya');
    expect(card.location).toBe('Pattaya');
    expect(card.startingPriceLabel).toBe('Price on request');
    expect(card.completionLabel).toBeUndefined();
    expect(card.statusLabel).toBeUndefined();
    expect(card.highlights).toBeUndefined();
  });

  it('generates safe internal hrefs even when source values look external', () => {
    const property = mapPropertyToPublicCardData({
      id: 'property-external',
      title: 'External-looking property',
      type: 'resale',
      price: 1000000,
      address: 'Pattaya',
      city: 'Pattaya',
      images: null,
      status: 'published',
      slug: 'https://example.com/bad-path',
      href: 'https://example.com/ignored',
    });
    const project = mapProjectToPublicCardData({
      id: 'project-external',
      slug: 'https://example.com/project',
      name: 'External-looking project',
      status: 'published',
      starting_price: 1000000,
      created_at: null,
      updated_at: null,
      href: 'https://example.com/ignored',
    });

    expect(property.href).toBe('/en/property/https%3A%2F%2Fexample.com%2Fbad-path');
    expect(project.href).toBe('/en/projects/https%3A%2F%2Fexample.com%2Fproject');
    expect(property.href.startsWith('/en/')).toBe(true);
    expect(project.href.startsWith('/en/')).toBe(true);
  });

  it('uses explicit image alt when provided and falls back to descriptive alt text otherwise', () => {
    const property = mapPropertyToPublicCardData({
      id: 'property-alt',
      title: 'Arom Wongamat',
      type: 'resale',
      price: 1000000,
      address: 'Wongamat',
      city: 'Pattaya',
      images: null,
      status: 'published',
      slug: 'arom-wongamat',
      imageAlt: 'Custom property image alt',
    });
    const project = mapProjectToPublicCardData({
      id: 'project-alt',
      slug: 'grand-solaire-noble',
      name: 'Grand Solaire Noble',
      status: 'published',
      starting_price: 1000000,
      area_name: 'Central Pattaya',
      created_at: null,
      updated_at: null,
    });

    expect(property.imageAlt).toBe('Custom property image alt');
    expect(project.imageAlt).toBe('Project image for Grand Solaire Noble in Central Pattaya');
  });

  it('uses price fallback for missing property and project prices', () => {
    const property = mapPropertyToPublicCardData({
      id: 'property-price',
      title: 'Price fallback property',
      type: 'resale',
      price: Number.NaN,
      address: 'Pattaya',
      city: 'Pattaya',
      images: null,
      status: 'published',
      slug: 'price-fallback-property',
    });
    const project = mapProjectToPublicCardData({
      id: 'project-price',
      slug: 'price-fallback-project',
      name: 'Price fallback project',
      status: 'published',
      starting_price: 0,
      created_at: null,
      updated_at: null,
    });

    expect(property.priceLabel).toBe('Price on request');
    expect(project.startingPriceLabel).toBe('Price on request');
  });
});
