# AMP Demo Website

Demo website for **Asset Management Property** (amppattaya.com) with mock data for client presentation and design approval.

## Purpose

- Client design approval and feedback
- UX testing and validation
- Marketing material preview
- Design handoff to Phase X development
- Demo for stakeholders before backend implementation

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, flexbox, grid
- **JavaScript (Vanilla)** - No frameworks or dependencies
- **No backend required** - Fully static site with client-side logic
- **Mock data** - 24 diverse properties for demonstration

## Features

### Pages

1. **index.html** - Home page
   - Sticky header with navigation
   - Hero section with search form
   - 6 featured properties
   - 6 popular area cards
   - Contact footer

2. **listing.html** - Property listing page
   - Filter sidebar (desktop) / bottom sheet (mobile)
   - 24 property cards in responsive grid
   - Client-side filtering by intent, type, area, beds, price
   - Sort options (updated, newest, price)
   - Results count and pagination UI

3. **detail.html** - Property detail page
   - Image gallery with 12 photos
   - Lightbox functionality
   - Property information and facts
   - Description with TH/EN language tabs
   - Amenities grid with icons
   - Agent contact card
   - Inquiry form
   - 4 similar properties
   - Sticky CTA on mobile

### Components

- **Buttons** - Primary, accent, secondary styles with hover effects
- **Badges** - Featured, available, updated indicators
- **Property Cards** - Consistent card design with image, price, facts
- **Forms** - Styled inputs, selects, textareas with validation
- **Filters** - Toggle switches, checkboxes, chips for selection
- **Gallery** - Thumbnail navigation and full-screen lightbox
- **Sticky CTA** - Mobile-only bottom action bar

### Functionality

- ✅ Client-side property filtering
- ✅ URL parameter state management
- ✅ Image gallery with keyboard navigation
- ✅ Mobile hamburger menu
- ✅ Language switch button (visual only)
- ✅ Form validation
- ✅ Smooth scroll for anchor links
- ✅ Responsive design for all devices

## Brand Identity

Based on **AMP_MVP_BLUEPRINT_v0.2.md Section 10**:

### Colors

```css
--color-primary: #1744BE;     /* AMP Blue */
--color-accent: #F05A43;      /* AMP Coral */
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
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Core styles + variables
│   │   ├── components.css       # Reusable components
│   │   └── responsive.css       # Mobile breakpoints
│   │
│   ├── js/
│   │   ├── mock-data.js         # 24 mock properties
│   │   ├── filters.js           # Filter logic
│   │   ├── gallery.js           # Image lightbox
│   │   └── main.js              # Site-wide JS
│   │
│   └── images/
│       └── .gitkeep             # Placeholder
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
- ❌ No authentication or user accounts
- ❌ Language switch is visual only (no actual translation)
- ❌ Images are placeholders (via placeholder.com)
- ❌ No payment or booking functionality
- ❌ No admin panel or content management

## Support

For questions or feedback about this demo:

- **Project Repository**: [github.com/natbkgift/flowbiz-client-amp](https://github.com/natbkgift/flowbiz-client-amp)
- **Documentation**: See `/docs/ops/AMP_MVP_BLUEPRINT_v0.2.md`

---

**Built with ❤️ for Asset Management Property**  
Demo Website • 2026
