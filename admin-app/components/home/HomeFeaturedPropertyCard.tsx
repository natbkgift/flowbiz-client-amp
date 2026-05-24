import type { PropertyListItem } from '@/app/public/_shared/types';
import { mapPropertyToPublicCardData } from '@/app/_lib/public-card-mappers';
import { PropertyCard as PublicPropertyCard } from '@/components/public-system/components/PropertyCard';
import { getPublicButtonClassName } from '@/components/public-system/tokens/publicUiTokens';
import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';

function propertyCtaLabel(property: PropertyListItem, locale: 'en' | 'th'): string {
  if (property.type === 'rent') {
    return locale === 'th' ? 'เช็กโจทย์การเช่า' : 'Check rental fit';
  }
  return locale === 'th' ? 'เช็กโจทย์การซื้อ' : 'Check buy fit';
}

function propertySourceSurface(property: PropertyListItem): string {
  return property.type === 'rent' ? 'rent_listing_card' : 'buy_listing_card';
}

export function HomeFeaturedPropertyCard({
  property,
  locale,
}: {
  property: PropertyListItem;
  locale: 'en' | 'th';
}) {
  const publicPropertyCard = mapPropertyToPublicCardData(
    {
      ...property,
      isFeatured: true,
    },
    { locale },
  );

  return (
    <div className="home-featured-property-card">
      <PublicPropertyCard
        property={publicPropertyCard}
        ctaLabel={propertyCtaLabel(property, locale)}
        imageSizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 31vw"
      />
      <ShortlistSaveButton
        className={getPublicButtonClassName({
          variant: 'secondary',
          fullWidth: true,
          className: 'home-featured-property-card__shortlist',
        })}
        locale={locale}
        propertyId={property.id}
        sourceSurface={propertySourceSurface(property)}
      />
    </div>
  );
}
