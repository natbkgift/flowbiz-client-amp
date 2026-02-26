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
  address: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  property_type?: string | null;
  area_id?: string | null;
  developer_id?: string | null;
  view_label?: string | null;
  tags?: string[] | null;
  created_at?: string;
  images: string[] | null;
  local_images?: string[] | null;
  cover_image?: string | null;
  status: string;
  slug: string | null;
  project_id?: string | null;
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
  size_sqm?: number | null;
  address: string;
  city: string;
  images: string[] | null;
  local_images?: string[] | null;
  cover_image?: string | null;
  status: string;
  slug?: string | null;
  project_id?: string | null;
  property_type?: string;
  furnishing?: string | null;
  view?: string | null;
  floor?: number | null;
};
