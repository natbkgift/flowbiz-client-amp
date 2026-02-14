# AMP Demo Website

Demo website for **Asset Management Property** (amppattaya.com) with real branding, complete bilingual support, and admin dashboard for client presentation.

## Purpose

- Client design approval and feedback
- UX testing and validation
- Marketing material preview
- Admin backend demonstration
- Design handoff to Phase X development
- Full-featured demo for stakeholders before backend implementation

## Technology Stack

- **HTML5** - Semantic markup with accessibility
- **CSS3** - Custom properties, flexbox, grid, responsive design
- **JavaScript (Vanilla)** - No frameworks or dependencies
- **Lucide Icons** - Lightweight, MIT-licensed icon system
- **Unsplash Images** - High-quality property photos
- **i18n Support** - Complete Thai/English bilingual system
- **No backend required** - Fully static site with client-side logic
- **Mock data** - 24 diverse properties + admin data for demonstration

## Features

### Public Pages

1. **index.html** - Home page
   - Real AMP logo and branding
   - Lucide icons throughout navigation
   - Hero section with bilingual search form
   - 6 featured properties with real Unsplash images
   - 6 popular area cards
   - Full i18n support (TH/EN)
   - Contact footer

2. **listing.html** - Property listing page
   - Filter sidebar (desktop) / bottom sheet (mobile)
   - 24 property cards with real images
   - Client-side filtering by intent, type, area, beds, price
   - Sort options (updated, newest, price)
   - Results count and pagination UI
   - Full i18n support

3. **detail.html** - Property detail page
   - Image gallery with 12 real property photos
   - Lightbox functionality
   - Property information with icons
   - Description with TH/EN language tabs
   - Amenities grid with Lucide icons
   - Agent contact card
   - Inquiry form with validation
   - 4 similar properties
   - Sticky CTA on mobile
   - Full i18n support

4. **about.html** - About Us page
   - Company introduction
   - Why Choose AMP (4 feature cards)
   - Team section with photos
   - Office location with Google Maps
   - Full i18n support

5. **contact.html** - Contact page
   - Contact form with validation
   - Contact information cards
   - Google Maps embed
   - Office hours and location
   - Full i18n support

6. **thank-you.html** - Form confirmation
   - Success message
   - Quick contact options
   - Navigation links

7. **buy-condo-pattaya/index.html** - English buy funnel landing page
   - High-intent foreign buyer messaging
   - Curated listings + CTA form + WhatsApp tracking
   - 4-step process, FAQ, and reviews block

### Admin Pages

1. **admin/login.html** - Admin login
   - Clean login form with AMP logo
   - Email/password with validation
   - Remember me checkbox
   - Redirects to dashboard

2. **admin/dashboard.html** - Admin dashboard
   - 4 stats cards (properties, leads)
   - Recent leads table
   - Quick action buttons
   - Recent activities feed
   - Responsive sidebar navigation

3. **admin/properties.html** - Properties management
   - Data table with 24 properties
   - Filters (status, type, area, search)
   - Property thumbnails
   - Edit/Delete actions
   - Pagination

4. **admin/property-edit.html** - Property editor
   - Complete property form (matching Blueprint schema)
   - 7 sections: Basic, Location, Content, Specs, Pricing, Media, SEO
   - Real-time slug preview
   - Mock photo upload
   - Save/Cancel actions

5. **admin/leads.html** - Leads management
   - 15 mock leads with full data
   - Status badges (New, Assigned, Contacted, Closed)
   - Filters (status, date range, property, search)
   - Lead detail modal
   - Status summary cards

6. **admin/qa-report.html** - QA Report
   - Last sync information
   - Summary stats (blockers, warnings, passed)
   - Issues table with severity badges
   - Property ID links to edit page
   - Re-sync button

### Components

- **Buttons** - Primary, accent, secondary styles with hover effects
- **Badges** - Featured, available, updated indicators
- **Property Cards** - Consistent card design with image, price, facts
- **Forms** - Styled inputs, selects, textareas with validation
- **Filters** - Toggle switches, checkboxes, chips for selection
- **Gallery** - Thumbnail navigation and full-screen lightbox
- **Sticky CTA** - Mobile-only bottom action bar

### Functionality

**Public Site:**
- ✅ Client-side property filtering
- ✅ URL parameter state management
- ✅ Image gallery with keyboard navigation
- ✅ Mobile hamburger menu
- ✅ Complete bilingual support (Thai/English)
- ✅ Language toggle with localStorage persistence
- ✅ Form validation (Thai phone numbers, emails)
- ✅ Smooth scroll for anchor links
- ✅ Responsive design for all devices
- ✅ Real property images from Unsplash
- ✅ Lucide icon system throughout

**Admin Dashboard:**
- ✅ Admin login with validation
- ✅ Responsive sidebar navigation
- ✅ Stats cards with real-time data
- ✅ Properties list with filtering and search
- ✅ Property editor with full Blueprint schema
- ✅ Leads management with status tracking
- ✅ QA report with issue tracking
- ✅ Mobile-responsive admin layout
- ✅ Bilingual admin interface

## Brand Identity

Based on **AMP_MVP_BLUEPRINT_v0.2.md Section 10**:

### Logo

- **Real AMP Logo**: SVG format with official branding
- **Colors**: 
  - Orange/Coral: `#E8734A` (roof icon, "Management")
  - Blue: `#1744BE` ("Asset", "Property")
- **Files**: 
  - `logo-amp.svg` - Color version for light backgrounds
  - `logo-amp-white.svg` - White version for dark backgrounds
  - `favicon.svg` - Favicon with roof icon

### Colors

```css
--color-primary: #1744BE;     /* AMP Blue */
--color-accent: #F05A43;      /* AMP Coral */
--color-orange: #E8734A;      /* AMP Orange */
--color-white: #FFFFFF;
--color-text: #0F172A;
--color-gray-50: #F8FAFC;
--color-gray-100: #F1F5F9;
--color-gray-300: #CBD5E1;
--color-gray-600: #475569;
--color-success: #16A34A;
```

### Typography

- **Font Family**: Prompt (Google Fonts)
- **H1**: 28px mobile, 34px desktop
- **H2**: 22px mobile, 24px desktop
- **Body**: 16px
- **Line Height**: 1.5

### Breakpoints

- **XS**: 320-359px (small Android)
- **S**: 360-389px (most Android)
- **M**: 390-430px (iPhone 13/14/15)
- **Tablet**: 768-1023px
- **Desktop**: 1024px+

## File Structure

```
demo-website/
├── index.html                    # Home page
├── listing.html                  # Property listing
├── detail.html                   # Property detail
├── about.html                    # About Us page
├── contact.html                  # Contact page
├── thank-you.html                # Form confirmation
│
├── admin/                        # Admin dashboard
│   ├── login.html               # Admin login
│   ├── dashboard.html           # Dashboard with stats
│   ├── properties.html          # Properties list
│   ├── property-edit.html       # Property editor
│   ├── leads.html               # Leads management
│   └── qa-report.html           # QA report
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Core styles + variables
│   │   ├── components.css       # Reusable components
│   │   ├── responsive.css       # Mobile breakpoints
│   │   └── admin.css            # Admin-specific styles
│   │
│   ├── js/
│   │   ├── mock-data.js         # 24 mock properties
│   │   ├── admin-mock-data.js   # Admin data (leads, activities)
│   │   ├── i18n.js              # Internationalization (TH/EN)
│   │   ├── filters.js           # Filter logic
│   │   ├── gallery.js           # Image lightbox
│   │   └── main.js              # Site-wide JS
│   │
│   └── images/
│       ├── logo-amp.svg         # AMP logo (color)
│       ├── logo-amp-white.svg   # AMP logo (white)
│       └── favicon.svg          # Favicon
│
└── README.md                     # This file
```

## Mock Data Specification

### 24 Diverse Properties

**Distribution by Intent:**
- 12 properties for rent
- 12 properties for sale

**Distribution by Type:**
- 10 condos
- 6 houses
- 4 villas
- 2 townhomes
- 2 land plots

**Distribution by Area:**
- 8 Pattaya
- 6 Jomtien
- 4 Na Jomtien
- 3 Bang Saray
- 3 Pratumnak

**Distribution by Bedrooms:**
- 4 studios
- 8 one-bedroom
- 6 two-bedroom
- 4 three-bedroom
- 2 four-bedroom+

**Price Ranges:**
- **Rent**: 8,000 - 80,000 THB/month
- **Sale**: 2,000,000 - 25,000,000 THB

## How to Use

### Local Development

1. Clone or download this repository
2. Open any HTML file directly in a modern web browser
3. No build step or server required

```bash
# Simply open in browser
open index.html

# Or use a local server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

### Testing

1. **Home Page**: Navigate to different sections, test search form
2. **Listing Page**: Test all filters, sorting, and property card links
3. **Detail Page**: Test gallery, lightbox, language tabs, forms
4. **Mobile**: Test on real devices or use browser dev tools
5. **Navigation**: Verify all links work correctly between pages

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Design Notes

### Responsive Behavior

- **Mobile (< 768px)**: Single column, hamburger menu, sticky CTA
- **Tablet (768-1023px)**: Two-column grid, visible nav
- **Desktop (1024px+)**: Three-column grid, sidebar filters

### Color Usage

- **Primary Blue (#1744BE)**: Navigation, links, buttons
- **Accent Coral (#F05A43)**: Prices, CTAs, featured badges
- **Success Green (#16A34A)**: Available badges, positive actions
- **Grays**: Text, borders, backgrounds with proper contrast

### Accessibility

- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Sufficient color contrast ratios
- Alt text on all images

## Next Steps

After client approval and design validation:

1. **Convert to templates** (PR-012)
   - Convert HTML to Jinja2 templates
   - Add template inheritance and includes
   - Prepare for backend integration

2. **Backend integration** (Phase X)
   - Connect to FastAPI backend
   - Replace mock data with real API calls
   - Implement lead submission
   - Add event tracking

3. **Production deployment**
   - Deploy static files to hosting
   - Set up CDN for images
   - Configure analytics
   - Launch with real property data

## Demo Limitations

This is a **demo website** with the following limitations:

- ❌ No real data - all properties are mock/placeholder
- ❌ No backend - forms don't actually submit
- ❌ No real authentication - admin login is mock only
- ✅ Language switching works (Thai/English with i18n.js)
- ✅ Real property images from Unsplash
- ❌ No payment or booking functionality
- ✅ Admin panel is fully functional (mock data)
- ❌ Admin actions (save, delete, etc.) are simulated
- ❌ No email notifications or CRM integration

## Support

For questions or feedback about this demo:

- **Project Repository**: [github.com/natbkgift/flowbiz-client-amp](https://github.com/natbkgift/flowbiz-client-amp)
- **Documentation**: See `/docs/ops/AMP_MVP_BLUEPRINT_v0.2.md`

---

**Built with ❤️ for Asset Management Property**  
Demo Website • 2026
