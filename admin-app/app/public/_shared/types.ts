export type CompanyInfoItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
};

export type CompanyListResponse = {
  data: CompanyInfoItem[];
};

export type PropertyListItem = {
  id: string;
  source_id: string;
  title: string;
  type: 'new' | 'resale' | 'rent' | string;
  price: number;
  city: string;
  images: string[] | null;
  status: string;
  slug: string | null;
};

export type PropertyListResponse = {
  data: PropertyListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type PropertyDetail = {
  id: string;
  source_id: string;
  title: string;
  description: string | null;
  type: 'new' | 'resale' | 'rent' | string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  address: string;
  city: string;
  images: string[] | null;
  status: string;
};
