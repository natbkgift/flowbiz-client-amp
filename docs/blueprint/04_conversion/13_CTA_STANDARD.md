# 13 -- CTA STANDARD

> Phase 4: Conversion & Funnel Layer -- Defines all call-to-action types, styling, and placement rules.

---

## CTA Hierarchy

### Primary CTA

The main conversion action on the page. Only one primary CTA per viewport.

| Property | Value |
|----------|-------|
| Style | Solid background, high contrast, large |
| Color | Brand primary (dark navy / gold accent) |
| Size | min-height 48px, full-width on mobile |
| Text | Action-oriented: "Inquire Now", "Get Valuation", "Schedule Viewing" |
| Position | Above the fold OR after key content block |

### Secondary CTA

Supporting action that offers an alternative conversion path.

| Property | Value |
|----------|-------|
| Style | Outlined or ghost button |
| Color | Brand secondary |
| Size | Standard button size |
| Text | "Compare Properties", "Save to Favorites", "Download Guide" |
| Position | Below primary CTA or in sidebar |

### Tertiary CTA

Low-commitment actions for early-funnel users.

| Property | Value |
|----------|-------|
| Style | Text link with arrow/icon |
| Color | Muted, underlined on hover |
| Text | "Learn more", "View all projects", "Read area guide" |
| Position | Inline within content |

---

## CTA by Page Type

### Homepage

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Hero CTA | Primary | "Find Your Property" | Hero section |
| Smart Finder | Secondary | "Try Smart Finder" | Below hero |
| Sell CTA | Secondary | "Sell Your Property" | Dedicated section |
| Contact | Tertiary | "Talk to an Expert" | Footer area |

### Project Page

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Inquiry Form | Primary | "Inquire About This Project" | After units list |
| LINE CTA | Secondary | "Chat on LINE" | Sidebar (desktop) / sticky (mobile) |
| Compare | Tertiary | "Add to Compare" | Unit cards |

### Property Detail Page

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Inquiry | Primary | "Ask About This Property" | Sidebar (desktop) / sticky (mobile) |
| Call | Secondary | "Call Now" | Next to inquiry button |
| Schedule | Secondary | "Schedule Viewing" | Below inquiry (rent only) |
| Similar | Tertiary | "View Similar Properties" | Bottom of page |

### Area Guide Page

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Browse Area | Primary | "Browse Properties in {Area}" | After featured projects |
| Inquiry | Secondary | "Talk to a {Area} Specialist" | End of content |

### Invest / Guides

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Calculator | Primary | "Calculate Your ROI" | Inline with content |
| Inquiry | Secondary | "Get Investment Advice" | End of article |
| Newsletter | Tertiary | "Get Weekly Insights" | Sidebar |

### Sell Landing

| CTA | Type | Text | Position |
|-----|------|------|----------|
| Valuation | Primary | "Get Free Valuation" | Hero section |
| List Property | Secondary | "List Your Property" | Below benefits |

---

## Dynamic CTA Rules

CTAs adapt based on user context:

| Condition | CTA Change |
|-----------|------------|
| User has viewed 3+ properties | Show "Compare Your Favorites" |
| User is on mobile | Replace sidebar form with sticky bottom CTA |
| User has returned within 7 days | Show "Welcome Back" + last viewed property |
| User on rent page | Change "Inquire" to "Schedule Viewing" |
| User from investment landing | Add "Calculate ROI" micro-CTA |
| Property status = sold/rented | Change to "View Similar Properties" |

---

## CTA Copy Guidelines

### Do

- Use action verbs: "Get", "Find", "Schedule", "Calculate", "Start"
- Be specific: "Inquire About This Condo" not "Submit"
- Create urgency when appropriate: "Only 3 Units Left"
- Match user intent: Buy pages say "Inquire", Rent pages say "Schedule"

### Do Not

- Use generic text: "Click Here", "Submit", "Learn More" (as primary CTA)
- Use all caps
- Use exclamation marks
- Use pressure language: "Don't miss out!!!"
- Stack multiple primary CTAs in the same viewport

---

## Form Fields by CTA Type

### Quick Inquiry (Primary)

| Field | Required | Type |
|-------|----------|------|
| Name | YES | text |
| Email | YES | email |
| Phone | NO (recommended) | tel |
| Message | NO | textarea |
| Property/Project ref | AUTO | hidden |
| Source page | AUTO | hidden |
| UTM params | AUTO | hidden |

### Detailed Inquiry

| Field | Required | Type |
|-------|----------|------|
| Name | YES | text |
| Email | YES | email |
| Phone | YES | tel |
| Intent | YES | select (buy/rent/sell/invest) |
| Budget Range | NO | select |
| Preferred Area | NO | select |
| Message | NO | textarea |

### Valuation Request

| Field | Required | Type |
|-------|----------|------|
| Name | YES | text |
| Email | YES | email |
| Phone | YES | tel |
| Property Type | YES | select |
| Area | YES | select |
| Size (sqm) | YES | number |
| Bedrooms | YES | number |
| Condition | NO | select |
| Images | NO | file upload |

---

## Mobile CTA Rules

1. Primary CTA uses **sticky bottom bar** (60px height, full width)
2. Sticky bar appears after user scrolls past the first CTA position
3. Phone number link uses `tel:` protocol
4. LINE CTA uses LINE deep link scheme
5. Form modals, not full-page redirects, for mobile inquiries
6. Touch target minimum: 48x48px

---

## Tracking

Every CTA click fires an analytics event:

```javascript
{
  event_type: "cta_click",
  cta_type: "primary|secondary|tertiary",
  cta_text: "Inquire About This Project",
  page: "/en/projects/the-riviera-jomtien/",
  position: "after_units_list",
  intent: "buy"
}
```

---

## CTA Checklist

- [ ] Every page has at least one primary CTA
- [ ] Mobile pages have sticky CTA
- [ ] Forms submit to `/api/v1/inquiries/` endpoint
- [ ] Hidden fields capture page source and UTM params
- [ ] Success state shows thank-you message (not redirect)
- [ ] Error state shows validation messages inline
- [ ] Analytics events fire on every CTA click
- [ ] No broken form submissions after template changes
