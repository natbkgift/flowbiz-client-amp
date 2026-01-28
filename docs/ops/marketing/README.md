# Marketing Operations - AMP

> 📢 Complete marketing operations system for international property marketing

## Overview

Marketing Operations (Marketing Ops) system for AMP Property, designed to attract and convert **foreign buyers and renters** through multiple digital and physical channels.

### Target Audience

**Primary:** International buyers/renters
- **Demographics:** 30-65 years old
- **Nationalities:** European, American, Russian, Chinese, Australian
- **Language:** English (primary communication)
- **Intent:** Buy, rent, or invest in Pattaya property

---

## Marketing Channels

### 1. Print + QR Code 🖨️

**18-slot storefront display with QR codes**

- Printed property sheets at office
- QR codes link to WhatsApp with Property_ID
- Track inquiries from each slot
- Rotate based on performance
- Target: Walk-by traffic and local inquiries

📖 **Guide:** [PRINT_QR_OPERATIONS.md](PRINT_QR_OPERATIONS.md)

---

### 2. Facebook Organic 📱

**Four sub-channels:**

**A. Facebook Page**
- Business page posts
- 7 posts per week
- Mix: listings, education, success stories
- English content only

**B. Personal Profile**
- Agent personal posts
- More casual, authentic
- Share page posts

**C. Facebook Marketplace**
- Property listings
- 2-3 posts per week
- Direct buyer inquiries

**D. Facebook Groups**
- Expat and property groups
- 5-7 posts per week
- Community engagement

📖 **Guide:** [FACEBOOK_POSTING_SOP.md](FACEBOOK_POSTING_SOP.md)

---

### 3. Facebook Ads 💰

**Paid advertising for:**
- New project launches
- High-value properties
- Lead generation campaigns
- Remarketing to website visitors

Target: International audience globally

📖 **Guide:** `docs/ops/ads/FACEBOOK_ADS_CHECKLIST.md`

---

### 4. Website + Google Ads 🌐

**Website:**
- Property listings online
- SEO-optimized pages
- Contact forms
- English interface

**Google Ads:**
- Search campaigns (keywords)
- Display remarketing
- Location-based targeting
- Foreign buyer focus

📖 **Guide:** [GOOGLE_ADS_PROPERTY.md](../ads/GOOGLE_ADS_PROPERTY.md)

---

## Marketing Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              MARKETING OPERATIONS FLOW                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PROPERTY SOURCES                                       │
│  ├── LINE Groups                                        │
│  ├── Owner Direct                                       │
│  └── Developers                                         │
│       ↓                                                 │
│  PROPERTY MASTER LIST                                   │
│  (Central inventory)                                    │
│       ↓                                                 │
│  MARKETING CHANNELS                                     │
│  ├── Print QR (18 slots)                               │
│  ├── Facebook (Page, Groups, Marketplace)              │
│  ├── Google Ads (Search, Display)                      │
│  └── Website (Listings, SEO)                           │
│       ↓                                                 │
│  LEAD CAPTURE                                           │
│  ├── WhatsApp (QR codes)                               │
│  ├── Facebook Messenger                                │
│  ├── Facebook Lead Forms                               │
│  ├── Website Forms                                     │
│  └── Phone/Email                                        │
│       ↓                                                 │
│  LEAD TRACKING                                          │
│  (CRM system)                                           │
│       ↓                                                 │
│  AGENT ASSIGNMENT                                       │
│  (Follow-up & conversion)                               │
│       ↓                                                 │
│  CONVERSION                                             │
│  (Sale/Rental)                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Content Library

### English Templates

All content targeting international audience is in English:

**Property Descriptions:**
- 9 pre-written templates
- For different property types
- SEO-optimized
- Ready to customize

📖 [PROPERTY_DESCRIPTIONS_EN.md](content/PROPERTY_DESCRIPTIONS_EN.md)

**Facebook Posts:**
- 20+ post templates
- For listings, education, engagement
- With emojis and hashtags
- Proven formats

📖 [FACEBOOK_POST_TEMPLATES_EN.md](content/FACEBOOK_POST_TEMPLATES_EN.md)

**WhatsApp Messages:**
- 22 message templates
- From first contact to closing
- Professional and friendly
- Quick responses

📖 [WHATSAPP_MESSAGES_EN.md](content/WHATSAPP_MESSAGES_EN.md)

---

## Lead Integration System

### Automation with Make.com

**10 automated scenarios:**

1. **WhatsApp QR Lead Capture** - Instant response to QR scans
2. **Facebook Messenger Bot** - Auto-reply on FB
3. **Facebook Lead Ads Sync** - Capture lead forms
4. **Website Form Integration** - Website inquiries
5. **Email Auto-Responder** - Thank you emails
6. **Lead Scoring** - Auto-calculate priorities
7. **Agent Assignment** - Distribute leads
8. **Viewing Reminders** - Appointment reminders
9. **Follow-up Automation** - Schedule tasks
10. **Performance Dashboard** - Update KPIs

📖 **Guides:**
- [LEAD_INTEGRATION_GUIDE.md](LEAD_INTEGRATION_GUIDE.md) - Setup guide
- [../../integrations/MAKE_SCENARIOS.md](../../integrations/MAKE_SCENARIOS.md) - Technical docs

---

## Marketing Tech Stack

### Tools Used

```
Content Creation:
├── Canva Pro          - Graphics & social media posts
├── Photoshop          - Photo editing
└── Grammarly          - Proofreading

Lead Capture:
├── WhatsApp Business  - QR code responses
├── Facebook Pages     - Page management
├── Google Forms       - Website forms (temp)
└── Custom Forms       - Website integration

Automation:
├── Make.com           - Workflow automation
├── Google Sheets      - Data storage
└── Zapier (optional)  - Backup automation

Analytics:
├── Google Analytics   - Website traffic
├── Facebook Insights  - Social performance
├── Google Ads         - Campaign metrics
└── Custom Dashboard   - Overall KPIs
```

---

## Marketing Workflow

### Weekly Schedule

**Monday:**
- Post new project listing (Facebook)
- Update Print Queue if needed
- Review weekend performance

**Tuesday:**
- Post resale property (Facebook)
- Check Google Ads performance
- Respond to weekend inquiries

**Wednesday:**
- Post rental property (Facebook)
- Update website listings
- Print rotation check

**Thursday:**
- Educational content (Facebook)
- Review lead quality
- Agent performance check

**Friday:**
- Featured property post (Facebook)
- Weekly performance report
- Plan next week content

**Saturday:**
- Customer success story (Facebook)
- Monitor weekend inquiries
- Social media engagement

**Sunday:**
- Area guide/lifestyle content (Facebook)
- Content planning for next week
- Personal time / light monitoring

---

## Performance Metrics

### Key Performance Indicators (KPIs)

**Lead Generation:**
```
Total Leads per Month: Target 150-200
├── QR Print: 30-40 leads (15-20%)
├── Facebook Organic: 40-50 leads (25-30%)
├── Facebook Ads: 30-40 leads (15-20%)
└── Google Ads + Website: 50-70 leads (35-40%)

Cost per Lead:
├── QR Print: ~100 THB
├── Facebook Organic: ~0 THB (time only)
├── Facebook Ads: ~300-500 THB
└── Google Ads: ~400-800 THB
```

**Conversion Metrics:**
```
Lead → Viewing: 30-40%
Viewing → Offer: 20-30%
Offer → Close: 40-60%

Overall: Lead → Close: 2-5%
```

**Channel Performance:**
```
Facebook Organic:
- Reach per post: 1,000-3,000
- Engagement rate: 2-4%
- Click rate: 1-3%

Google Ads:
- CTR: 2-4%
- CPC: 15-30 THB
- Conversion rate: 3-8%

QR Print:
- Scans per week: 5-10 per slot
- Inquiry rate: 50-70%
- Avg performance: 60-80 score
```

---

## Budget Allocation

### Monthly Marketing Budget Example

```
Total Budget: 40,000 THB/month

Breakdown:
├── Google Ads: 20,000 THB (50%)
│   └── Property search campaigns
│
├── Facebook Ads: 10,000 THB (25%)
│   └── Lead generation & remarketing
│
├── Content Creation: 5,000 THB (12.5%)
│   ├── Canva Pro subscription
│   ├── Stock photos
│   └── Graphic design work
│
├── Print Materials: 3,000 THB (7.5%)
│   ├── Printing (18 sheets)
│   ├── Lamination
│   └── QR code generation
│
└── Tools & Software: 2,000 THB (5%)
    ├── Make.com subscription
    ├── Analytics tools
    └── Domain & hosting
```

### ROI Calculation

```
Monthly Investment: 40,000 THB

Expected Results:
- Leads generated: 150
- Cost per lead: 267 THB
- Conversions (2%): 3 sales
- Avg property value: 3M THB
- Commission (3%): 90,000 THB
- Total commission: 270,000 THB

ROI: (270,000 - 40,000) / 40,000 = 575%
Return: 6.75x investment
```

---

## Quick Start Guide

### For New Marketing Team Members

**Day 1: Setup & Access**
1. Get access to:
   - Google Sheets (Property & Lead databases)
   - Facebook Page
   - Canva account
   - Make.com account
   - WhatsApp Business
2. Read this README
3. Review content templates

**Day 2: Learn Systems**
1. Read [Print QR Operations](PRINT_QR_OPERATIONS.md)
2. Read [Facebook Posting SOP](FACEBOOK_POSTING_SOP.md)
3. Review [Lead Integration Guide](LEAD_INTEGRATION_GUIDE.md)

**Day 3: Content Creation**
1. Practice creating Facebook posts
2. Design a print sheet in Canva
3. Write property descriptions

**Day 4: Hands-On Practice**
1. Post to Facebook (with supervision)
2. Update Print Queue
3. Respond to sample inquiries

**Day 5: Go Live**
1. Independent social media posting
2. Monitor and respond to leads
3. Daily reporting

---

## Troubleshooting

### Common Issues

**Low Lead Volume:**
- Check all channels active?
- Review ad spend and bids
- Refresh content (new photos)
- Check QR codes working
- Review competitor activity

**Poor Lead Quality:**
- Tighten targeting (ads)
- Improve qualifying questions
- Better property descriptions
- Check landing pages
- Update pricing if needed

**Low Engagement:**
- Post at better times
- Use more engaging content
- Improve photo quality
- Ask questions in posts
- More video content

**High Cost per Lead:**
- Optimize ad targeting
- Improve ad copy
- Better landing pages
- Add negative keywords
- Pause poor performers

---

## Best Practices

### Content

✅ **Always:**
- Use professional photos
- Write in clear English
- Include Property_ID
- Add call-to-action
- Proofread before posting
- Use proper hashtags
- Track all links (UTM)

❌ **Never:**
- Post Thai-only content for foreign audience
- Use low-quality photos
- Make false promises
- Ignore inquiries
- Post without property owner permission
- Share customer info publicly

### Lead Management

✅ **Always:**
- Respond within 5 minutes (QR)
- Follow up within 1 hour
- Update Lead_Tracking sheet
- Be professional and friendly
- Qualify leads properly
- Track all interactions

❌ **Never:**
- Ignore leads
- Be pushy or aggressive
- Share leads between competing agents
- Forget to follow up
- Skip lead qualification

---

## Related Documents

### Core Guides
- [Print QR Operations](PRINT_QR_OPERATIONS.md)
- [Facebook Posting SOP](FACEBOOK_POSTING_SOP.md)
- [Lead Integration Guide](LEAD_INTEGRATION_GUIDE.md)

### Content Templates
- [Property Descriptions EN](content/PROPERTY_DESCRIPTIONS_EN.md)
- [Facebook Post Templates EN](content/FACEBOOK_POST_TEMPLATES_EN.md)
- [WhatsApp Messages EN](content/WHATSAPP_MESSAGES_EN.md)

### Advertising
- [Google Ads Property Guide](../ads/GOOGLE_ADS_PROPERTY.md)
- [Google Ads Checklist](../ads/GOOGLE_ADS_CHECKLIST.md)
- [Facebook Ads Checklist](../ads/FACEBOOK_ADS_CHECKLIST.md)

### Data & Tracking
- [Property Master List](../../data/templates/PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](../../data/templates/LEAD_TRACKING_TEMPLATE.md)
- [Print Queue Template](../../data/templates/PRINT_QUEUE_TEMPLATE.md)

### Integration
- [Make Scenarios](../../integrations/MAKE_SCENARIOS.md)

---

## Support & Questions

### Getting Help

**For marketing questions:**
- Check this README first
- Review specific guide for your channel
- Ask marketing manager
- Weekly team meeting (Fridays 4 PM)

**For technical issues:**
- Make.com not working → Check [Make Scenarios](../../integrations/MAKE_SCENARIOS.md)
- Google Sheets issues → Check [Data README](../../data/README.md)
- Website problems → Contact web developer

**For content help:**
- Use provided templates
- Review past successful posts
- Ask for feedback before posting
- Learn from high-performing content

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-28 | Initial Marketing Ops system | AI Agent |

---

## Future Enhancements

### Phase 2 (Next 3 months)
- [ ] Add LINE Official Account integration
- [ ] Implement chatbot for website
- [ ] Create video marketing strategy
- [ ] Add Instagram marketing
- [ ] Develop email nurture sequences

### Phase 3 (6-12 months)
- [ ] AI-powered lead scoring
- [ ] Predictive analytics
- [ ] Multi-language support (Chinese, Russian)
- [ ] CRM system integration (HubSpot/Salesforce)
- [ ] Advanced marketing automation

---

**Welcome to AMP Marketing Operations!** 🚀

*Let's attract and convert international property buyers together!*
