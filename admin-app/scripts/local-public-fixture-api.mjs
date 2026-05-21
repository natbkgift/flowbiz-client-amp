#!/usr/bin/env node
import http from "node:http";

const HOST = process.env.PUBLIC_FIXTURE_API_HOST || "127.0.0.1";
const PORT = Number.parseInt(process.env.PUBLIC_FIXTURE_API_PORT || process.env.PORT || "8000", 10);
const NOW = "2026-05-01T09:00:00.000Z";

const AREAS = [
  { id: "area_wongamat", slug: "wongamat", name: "Wongamat", city: "Pattaya", status: "published", hero_image_url: "/images/condo-view.png", created_at: NOW, updated_at: NOW },
  { id: "area_jomtien", slug: "jomtien", name: "Jomtien", city: "Pattaya", status: "published", hero_image_url: "/images/project-overview.png", created_at: NOW, updated_at: NOW },
  { id: "area_pratumnak", slug: "pratumnak", name: "Pratumnak", city: "Pattaya", status: "published", hero_image_url: "/images/area-guide-pattaya.png", created_at: NOW, updated_at: NOW },
];

const DEVELOPERS = [
  { id: "dev_meridian", slug: "meridian-sea-homes", name: "Meridian Sea Homes" },
  { id: "dev_eastern_horizon", slug: "eastern-horizon", name: "Eastern Horizon Development" },
  { id: "dev_quiet_living", slug: "quiet-living", name: "Quiet Living Pattaya" },
];

const PROJECTS = [
  {
    id: "proj_skyline_ocean_premier",
    slug: "skyline-ocean-premier",
    name: "Skyline Ocean Premier",
    developer_id: "dev_meridian",
    area_id: "area_wongamat",
    developer: DEVELOPERS[0],
    area: AREAS[0],
    status: "published",
    property_type: "condo",
    delivery_date: "2026-12-01",
    starting_price: 12300000,
    cover_image_url: "/images/condo-view.png",
    hero_image_url: "/images/project-overview.png",
    images: ["/images/project-overview.png", "/images/condo-view.png", "/images/property-pool.png"],
    summary: {
      en: "Premium high-rise project near Wongamat with clear sea-view positioning and a live investment snapshot.",
      th: "โครงการไฮไรส์ระดับพรีเมียมใกล้วงศ์อมาตย์ พร้อมภาพรวมวิวทะเลและสัญญาณลงทุนที่อ่านต่อได้ทันที",
    },
    description: {
      en: "A premium new-build option for buyers who need a project-first read before checking live units, quota, and payment terms.",
      th: "ตัวเลือกโครงการใหม่สำหรับผู้ซื้อที่ต้องอ่านภาพรวมโครงการก่อนเช็กยูนิต โควตา และเงื่อนไขชำระเงินล่าสุด",
    },
    amenities: ["sea-view pool", "fitness", "resident lounge", "covered parking"],
    investment_snapshot: {
      entry_price: "THB 12.3M",
      target_buyer: "premium end-use and investment",
      liquidity_note: "limited comparable sea-view stock",
    },
    location: {
      district: "Wongamat",
      walk_to_beach: "350 m",
      nearest_road: "Naklua Road",
    },
    unit_count: 318,
    floors: 42,
    year_built: null,
    is_featured: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "proj_jomtien_horizon_under_construction",
    slug: "jomtien-horizon-under-construction",
    name: "Jomtien Horizon Under Construction",
    developer_id: "dev_eastern_horizon",
    area_id: "area_jomtien",
    developer: DEVELOPERS[1],
    area: AREAS[1],
    status: "under_construction",
    property_type: "condo",
    delivery_date: "2027-09-01",
    starting_price: 4580000,
    cover_image_url: "/images/property-exterior.png",
    hero_image_url: "/images/hero-banner-20260318.webp",
    images: ["/images/property-exterior.png", "/images/property-interior.png", "/images/property-pool.png"],
    summary: {
      en: "Under-construction Jomtien project with a lower entry point and payment-plan review required before commitment.",
      th: "โครงการจอมเทียนที่อยู่ระหว่างก่อสร้าง ราคาเริ่มต้นเข้าถึงง่ายกว่า และควรเช็กแผนชำระก่อนตัดสินใจ",
    },
    description: {
      en: "Useful for buyers comparing launch-stage pricing against handover timing, construction progress, and quota availability.",
      th: "เหมาะสำหรับผู้ซื้อที่ต้องเทียบราคาเปิดขายกับกำหนดส่งมอบ ความคืบหน้าก่อสร้าง และโควตาที่เหลืออยู่",
    },
    amenities: ["pool", "co-working lounge", "shuttle service"],
    investment_snapshot: {
      entry_price: "THB 4.58M",
      construction_status: "under construction",
      next_check: "handover schedule and payment plan",
    },
    location: {
      district: "Jomtien",
      beach_access: "short drive",
      transit_note: "Baht bus route nearby",
    },
    unit_count: 612,
    floors: 36,
    year_built: null,
    is_featured: false,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "proj_pratumnak_quiet_residence",
    slug: "pratumnak-quiet-residence",
    name: "Pratumnak Quiet Residence",
    developer_id: null,
    area_id: "area_pratumnak",
    developer: null,
    area: AREAS[2],
    status: "published",
    property_type: "condo",
    delivery_date: null,
    starting_price: null,
    cover_image_url: null,
    hero_image_url: null,
    images: ["/images/area-guide-pattaya.png"],
    summary: {
      en: "A thinner optional-field project record used to confirm project pages keep working when price and developer context are pending.",
      th: "ข้อมูลโครงการที่ตั้งใจให้ optional fields บางส่วนว่าง เพื่อยืนยันว่าหน้าโครงการยังทำงานได้เมื่อราคาและผู้พัฒนายังรอยืนยัน",
    },
    description: {
      en: "Use this project to validate fallback copy, image handling, advisor CTA, and unit-empty states.",
      th: "ใช้ทดสอบข้อความ fallback การแสดงภาพ CTA ที่ปรึกษา และสถานะเมื่อยูนิตที่ผูกกับโครงการยังไม่ครบ",
    },
    amenities: null,
    investment_snapshot: null,
    location: {
      district: "Pratumnak",
    },
    unit_count: null,
    floors: null,
    year_built: null,
    is_featured: false,
    created_at: NOW,
    updated_at: NOW,
  },
];

const PROPERTIES = [
  {
    id: "prop_skyline_2br_sea_view",
    source_id: "fixture-skyline-2br",
    slug: "skyline-ocean-premier-2br-sea-view",
    title: "Skyline Ocean Premier 2BR Sea View",
    title_i18n: {
      en: "Skyline Ocean Premier 2BR Sea View",
      th: "สกายไลน์ โอเชียน พรีเมียร์ 2 ห้องนอน วิวทะเล",
    },
    type: "new",
    property_type: "condo",
    price: 16800000,
    currency: "THB",
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 86,
    size: 86,
    address: "Wongamat, Pattaya",
    city: "Pattaya",
    description: "Premium new-launch condo with a sea-view orientation, larger two-bedroom plan, and project-backed decision context for foreign-buyer review.",
    images: ["/images/condo-view.png", "/images/property-interior.png"],
    local_images: ["/images/condo-view.png"],
    cover_image: "/images/condo-view.png",
    status: "available",
    project_id: "proj_skyline_ocean_premier",
    created_at: "2026-04-24T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_skyline_1br_high_floor",
    source_id: "fixture-skyline-1br",
    slug: "skyline-ocean-premier-1br-high-floor",
    title: "Skyline Ocean Premier 1BR High Floor",
    title_i18n: {
      en: "Skyline Ocean Premier 1BR High Floor",
      th: "สกายไลน์ โอเชียน พรีเมียร์ 1 ห้องนอน ชั้นสูง",
    },
    type: "resale",
    property_type: "condo",
    price: 9800000,
    currency: "THB",
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 54,
    size: 54,
    address: "Wongamat, Pattaya",
    city: "Pattaya",
    description: "Complete sale condo fixture with price, media, project link, and unit facts for data-backed buy listing QA.",
    images: ["/images/property-interior.png", "/images/condo-view.png"],
    local_images: ["/images/property-interior.png"],
    cover_image: "/images/property-interior.png",
    status: "available",
    project_id: "proj_skyline_ocean_premier",
    created_at: "2026-05-01T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_jomtien_horizon_1br",
    source_id: "fixture-jomtien-1br",
    slug: "jomtien-horizon-1br-payment-plan",
    title: "Jomtien Horizon 1BR Payment Plan",
    title_i18n: {
      en: "Jomtien Horizon 1BR Payment Plan",
      th: "จอมเทียน ฮอไรซัน 1 ห้องนอน แผนชำระ",
    },
    type: "new",
    property_type: "condo",
    price: 4580000,
    currency: "THB",
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 39,
    size: 39,
    address: "Jomtien, Pattaya",
    city: "Pattaya",
    description: "Under-construction project-linked unit used to confirm payment-plan and handover timing copy remains stable on property detail routes.",
    images: ["/images/property-exterior.png", "/images/property-pool.png"],
    local_images: ["/images/property-exterior.png"],
    cover_image: "/images/property-exterior.png",
    status: "available",
    project_id: "proj_jomtien_horizon_under_construction",
    created_at: "2026-04-18T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_buy_resale_pratumnak",
    source_id: "fixture-pratumnak-resale",
    slug: "pratumnak-resale-quiet-2br",
    title: "Pratumnak Resale Quiet Condo",
    title_i18n: {
      en: "Pratumnak Resale Quiet Condo",
      th: "รีเซลพระตำหนัก โซนเงียบ",
    },
    type: "resale",
    property_type: "condo",
    price: 7200000,
    currency: "THB",
    bedrooms: null,
    bathrooms: null,
    size_sqm: null,
    size: null,
    address: "Pratumnak Hill, Pattaya",
    city: "Pattaya",
    description: null,
    images: ["/images/area-guide-pattaya.png"],
    local_images: [],
    cover_image: null,
    status: "available",
    project_id: "proj_pratumnak_quiet_residence",
    created_at: "2026-04-30T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_rent_jomtien_studio",
    source_id: "fixture-jomtien-rent",
    slug: "jomtien-studio-rent-ready",
    title: "Jomtien Studio Rent Ready",
    title_i18n: {
      en: "Jomtien Studio Rent Ready",
      th: "สตูดิโอจอมเทียน พร้อมเช่า",
    },
    type: "rent",
    property_type: "studio",
    price: 23000,
    currency: "THB",
    bedrooms: 0,
    bathrooms: 1,
    size_sqm: 32,
    size: 32,
    address: "Jomtien, Pattaya",
    city: "Pattaya",
    description: "Compact rental fixture with limited media to verify rent listing and property detail fallback copy.",
    images: ["/images/property-pool.png"],
    local_images: ["/images/property-pool.png"],
    cover_image: "/images/property-pool.png",
    status: "available",
    project_id: null,
    created_at: "2026-04-10T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_rent_central_1br_complete",
    source_id: "fixture-central-rent-1br",
    slug: "central-pattaya-1br-rent-complete",
    title: "Central Pattaya 1BR Rent Complete",
    title_i18n: {
      en: "Central Pattaya 1BR Rent Complete",
      th: "เซ็นทรัลพัทยา 1 ห้องนอน พร้อมเช่า",
    },
    type: "rent",
    property_type: "condo",
    price: 42000,
    currency: "THB",
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 45,
    size: 45,
    address: "Central Pattaya, Pattaya",
    city: "Pattaya",
    description: "Complete rental condo fixture with monthly price, move-in-ready facts, and enough media for rent route QA.",
    images: ["/images/property-interior.png", "/images/property-pool.png", "/images/condo-view.png"],
    local_images: ["/images/property-interior.png", "/images/property-pool.png"],
    cover_image: "/images/property-interior.png",
    status: "available",
    project_id: "proj_skyline_ocean_premier",
    created_at: "2026-05-04T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_wongamat_gallery_3br_many_images",
    source_id: "fixture-wongamat-gallery-3br",
    slug: "wongamat-gallery-3br-many-images",
    title: "Wongamat Gallery 3BR Many Images",
    title_i18n: {
      en: "Wongamat Gallery 3BR Many Images",
      th: "วงศ์อมาตย์ 3 ห้องนอน ภาพครบหลายมุม",
    },
    type: "resale",
    property_type: "condo",
    price: 21400000,
    currency: "THB",
    bedrooms: 3,
    bathrooms: 3,
    size_sqm: 142,
    size: 142,
    address: "Wongamat, Pattaya",
    city: "Pattaya",
    description: "High-media resale fixture for validating gallery density, thumbnail rhythm, and property detail image handling with a realistic premium unit.",
    images: [
      "/images/condo-view.png",
      "/images/project-overview.png",
      "/images/property-interior.png",
      "/images/property-pool.png",
      "/images/property-exterior.png",
      "/images/hero-banner-20260318.webp",
      "/images/area-guide-pattaya.png",
    ],
    local_images: ["/images/condo-view.png", "/images/project-overview.png", "/images/property-interior.png"],
    cover_image: "/images/condo-view.png",
    status: "available",
    project_id: "proj_skyline_ocean_premier",
    created_at: "2026-05-03T09:00:00.000Z",
    updated_at: NOW,
  },
  {
    id: "prop_naklua_compact_no_media",
    source_id: "fixture-naklua-no-media",
    slug: "naklua-compact-no-media-fallback",
    title: "Naklua Compact No Media Fallback",
    title_i18n: {
      en: "Naklua Compact No Media Fallback",
      th: "นาเกลือขนาดกะทัดรัด ไม่มีภาพทดสอบ fallback",
    },
    type: "resale",
    property_type: "condo",
    price: 3900000,
    currency: "THB",
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 34,
    size: 34,
    address: "Naklua, Pattaya",
    city: "Pattaya",
    description: "No-media resale fixture used to verify card and detail fallback surfaces without broken image or empty CTA states.",
    images: null,
    local_images: null,
    cover_image: null,
    status: "available",
    project_id: null,
    created_at: "2026-05-02T09:00:00.000Z",
    updated_at: NOW,
  },
];

function buildShortlistItem(property, position) {
  const project = PROJECTS.find((item) => item.id === property.project_id) ?? null;
  return {
    property_id: property.id,
    slug: property.slug,
    title: property.title,
    project: project?.name ?? null,
    location: [property.address, property.city].filter(Boolean).join(", ") || null,
    price: property.price,
    size: property.size ?? property.size_sqm ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    image: property.cover_image ?? property.local_images?.[0] ?? property.images?.[0] ?? null,
    status: property.status,
    foreign_quota: property.type !== "rent",
    position,
    added_at: NOW,
    source_surface: position === 1 ? "property_detail" : "buy_listing_card",
  };
}

function buildCurrentShortlist(searchParams) {
  const ownerType = searchParams.get("owner_type") || "session";
  const ownerKey = searchParams.get("owner_key") || "fixture-owner-key";
  const shortlistProperties = [
    PROPERTIES.find((item) => item.id === "prop_skyline_2br_sea_view"),
    PROPERTIES.find((item) => item.id === "prop_jomtien_horizon_1br"),
    PROPERTIES.find((item) => item.id === "prop_buy_resale_pratumnak"),
  ].filter(Boolean);

  return {
    id: "shortlist_phase3b_fixture",
    owner_type: ownerType,
    owner_key: ownerKey,
    status: "active",
    title: "Phase 3B QA shortlist",
    intent: "project_compare",
    share_mode: null,
    source_context: { source: "local_public_fixture_api", phase: "3B" },
    created_at: NOW,
    updated_at: NOW,
    last_viewed_at: NOW,
    item_count: shortlistProperties.length,
    items: shortlistProperties.map((property, index) => buildShortlistItem(property, index + 1)),
  };
}

const EVALUATIONS = new Map([
  [
    "proj_skyline_ocean_premier",
    {
      evaluation_version: "fixture-v1",
      project: PROJECTS[0],
      area_statistics: {
        area_id: "area_wongamat",
        avg_price_sqm: "THB 185,000/sqm",
        avg_rent_monthly: "THB 78,000/mo",
        avg_roi_percent: "5.2%",
        total_projects: 18,
        total_units: 4200,
        as_of_date: "2026-05-01",
        avg_price: "THB 185,000/sqm",
        avg_rent: "THB 78,000/mo",
        roi_percent: "5.2%",
        as_of: "May 2026",
      },
      badges: [
        { key: "premium", label: "Premium sea-view positioning" },
        { key: "liquidity", label: "Limited comparable stock" },
      ],
    },
  ],
  [
    "proj_jomtien_horizon_under_construction",
    {
      evaluation_version: "fixture-v1",
      project: PROJECTS[1],
      area_statistics: {
        area_id: "area_jomtien",
        avg_price_sqm: "THB 118,000/sqm",
        avg_rent_monthly: "THB 32,000/mo",
        avg_roi_percent: "4.7%",
        total_projects: 24,
        total_units: 7600,
        as_of_date: "2026-05-01",
        avg_price: "THB 118,000/sqm",
        avg_rent: "THB 32,000/mo",
        roi_percent: "4.7%",
        as_of: "May 2026",
      },
      badges: [
        { key: "construction", label: "Under-construction handover check" },
        { key: "payment", label: "Payment plan should be verified" },
      ],
    },
  ],
]);

const BLOG_POSTS = [
  {
    slug: "wongamat-project-shortlist",
    title: {
      en: "How to read a Wongamat project shortlist",
      th: "วิธีอ่านรายการคัดไว้ของโครงการวงศ์อมาตย์",
    },
    excerpt: {
      en: "A practical guide for comparing sea-view projects, entry price, and live unit availability.",
      th: "คู่มือเทียบโครงการวิวทะเล ราคาเริ่มต้น และยูนิตที่ยังเปิดอยู่จริง",
    },
    category: { en: "Buying guide", th: "คู่มือซื้อ" },
    read_time: { en: "4 min read", th: "อ่าน 4 นาที" },
    published_at: "2026-04-15T09:00:00.000Z",
    updated_at: NOW,
    hero_image_url: "/images/blog-real-estate.png",
  },
];

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function stripApiPrefix(pathname) {
  const normalized = normalizePath(pathname);
  return normalized.startsWith("/api/v1/") ? normalized.slice(4) : normalized;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate(items, searchParams) {
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), items.length || 1), 100);
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: { page, limit, total: items.length },
  };
}

function sortProperties(items, sort) {
  const source = [...items];
  if (sort === "price_asc") return source.sort((left, right) => left.price - right.price);
  if (sort === "price_desc") return source.sort((left, right) => right.price - left.price);
  if (sort === "oldest") return source.sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)));
  return source.sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)));
}

function filterProjects(searchParams) {
  const statusFilter = String(searchParams.get("status_filter") || "").trim().toLowerCase();
  const filtered = statusFilter
    ? PROJECTS.filter((project) => project.status.toLowerCase() === statusFilter)
    : PROJECTS;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), filtered.length || 1), 100);
  const start = (page - 1) * limit;
  return filtered.slice(start, start + limit);
}

function filterProperties(searchParams) {
  const type = String(searchParams.get("type") || "").trim().toLowerCase();
  const projectId = String(searchParams.get("project_id") || "").trim();
  const search = String(searchParams.get("search") || "").trim().toLowerCase();
  const sort = String(searchParams.get("sort") || "newest").trim().toLowerCase();
  const filtered = PROPERTIES.filter((property) => {
    if (type && property.type !== type) return false;
    if (projectId && property.project_id !== projectId) return false;
    if (search) {
      const haystack = `${property.title} ${property.address} ${property.city}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  return sortProperties(filtered, sort);
}

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type,accept",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { detail: "Not found" });
}

function handle(req, res) {
  if (!req.url) return notFound(res);
  if (req.method === "OPTIONS") return json(res, 204, null);

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = stripApiPrefix(url.pathname);
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/v1/shortlists/current") {
    if (req.method !== "GET") return json(res, 405, { detail: "Method not allowed" });
    return json(res, 200, { shortlist: buildCurrentShortlist(url.searchParams) });
  }

  if (req.method !== "GET") return json(res, 405, { detail: "Method not allowed" });

  if (normalizedPath === "/health" || normalizedPath === "/v1/health") {
    return json(res, 200, { ok: true, fixture: "amp-public-phase3b", projectCount: PROJECTS.length, propertyCount: PROPERTIES.length });
  }

  if (normalizedPath === "/v1/projects") {
    return json(res, 200, { data: filterProjects(url.searchParams) });
  }

  const projectSlugMatch = normalizedPath.match(/^\/v1\/projects\/slug\/([^/]+)$/);
  if (projectSlugMatch) {
    const slug = decodeURIComponent(projectSlugMatch[1]);
    const project = PROJECTS.find((item) => item.slug === slug);
    return project ? json(res, 200, { project }) : notFound(res);
  }

  const projectEvaluationMatch = normalizedPath.match(/^\/v1\/projects\/([^/]+)\/evaluation$/);
  if (projectEvaluationMatch) {
    const projectId = decodeURIComponent(projectEvaluationMatch[1]);
    const evaluation = EVALUATIONS.get(projectId);
    return evaluation ? json(res, 200, { evaluation }) : notFound(res);
  }

  if (normalizedPath === "/v1/properties") {
    return json(res, 200, paginate(filterProperties(url.searchParams), url.searchParams));
  }

  const propertySlugMatch = normalizedPath.match(/^\/v1\/properties\/slug\/([^/]+)$/);
  if (propertySlugMatch) {
    const slug = decodeURIComponent(propertySlugMatch[1]);
    const property = PROPERTIES.find((item) => item.slug === slug);
    return property ? json(res, 200, property) : notFound(res);
  }

  const propertyIdMatch = normalizedPath.match(/^\/v1\/properties\/([^/]+)$/);
  if (propertyIdMatch) {
    const propertyId = decodeURIComponent(propertyIdMatch[1]);
    const property = PROPERTIES.find((item) => item.id === propertyId);
    return property ? json(res, 200, property) : notFound(res);
  }

  if (normalizedPath === "/v1/areas") {
    return json(res, 200, { data: AREAS });
  }

  if (normalizedPath === "/v1/content/blog-posts") {
    return json(res, 200, BLOG_POSTS);
  }

  const blogPostMatch = normalizedPath.match(/^\/v1\/content\/blog-posts\/([^/]+)$/);
  if (blogPostMatch) {
    const slug = decodeURIComponent(blogPostMatch[1]);
    const post = BLOG_POSTS.find((item) => item.slug === slug);
    return post
      ? json(res, 200, { ...post, body: { en: [post.excerpt.en], th: [post.excerpt.th] }, related_guides: [], links: [] })
      : notFound(res);
  }

  if (normalizedPath === "/v1/seo/resolve") {
    return json(res, 200, {
      found: false,
      path: url.searchParams.get("path") || "",
      locale: url.searchParams.get("locale") || "en",
    });
  }

  return notFound(res);
}

const server = http.createServer(handle);

server.listen(PORT, HOST, () => {
  process.stdout.write(`AMP public fixture API listening on http://${HOST}:${PORT}\n`);
  process.stdout.write(`Fixture project slugs: ${PROJECTS.map((project) => project.slug).join(", ")}\n`);
});

server.on("error", (error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
