# Asset Management Property — Delivery Blueprint v1.0

> Scope includes Phase 0 (Marketing/Ops) run concurrently with product build. All budgets in THB.

## Phase Structure
- Phase 0: Foundation & Ops (run continuously from Day 1)
- Phase 1: Core Infrastructure (Week 1-4)
- Phase 2: AI Agents (Week 5-12)
- Phase 3: Integration & Testing (Week 13-16)
- Phase 4: Launch & Optimization (Week 17-20)

## Phase 0 — Foundation & Concurrent Ops
### Advertising: Google
- Account/GTM/GA4 setup (Day 1-3)
- Campaign types: Search, Display, YouTube, PMax; structure by intent (Buy/Rent/Invest)
- Keyword research (Day 4-7) using SEMrush/Ahrefs
- Ad copy: 15 headlines + 4 desc/ad group (Day 8-10)
- Tracking: UTM, conversions, call/WhatsApp (Day 10-14)
- Daily: bids, negatives, A/B; Weekly: CPL/ROAS report (Looker Studio)
- Budget/month: Min 30k | Rec 50k | Max 80k
- Checklist: Ads acct, GTM, GA4, conversions, ad extensions, remarketing audiences, automated rules

### Advertising: Facebook/IG
- Pixel + CAPI (Day 1-3); Audiences (custom/lookalike) (Day 4-7)
- Creatives (static/carousel/video) (Day 8-14)
- Launch Lead/Traffic/Conversion (Day 14)
- Daily optimization, creative rotation (ongoing)
- Budget/month: Min 20k | Rec 40k | Max 60k
- Checklist: BM ready, pixel verified, CAPI on, custom + LAL audiences, 10+ creatives, lead form with qualifiers, budget rules

### Social Media
- Facebook: 2 posts/day; Instagram: 1 post + 3 stories/day; TikTok: 1 video/day; LINE OA: 2-3 broadcasts/week; YouTube: 2 vids/week
- Content themes: listings, market tips, project reviews, lifestyle, weekly recap
- Tools: ChatGPT/Claude, Canva/CapCut, Later (scheduler)
- Checklist: 1-month calendar, brand guide, hashtag sets, response templates, analytics tracking, partner list

### Landing Pages
- Types: Project showcase, Lead capture, Property search, Investment guide, Rental guide
- SLA: 2-3 days/page (showcase), 3 days (lead), 1 week (search)
- Tools: WordPress/Webflow or Unbounce; ensure mobile, <3s load, UTM, TY page, Pixel + GA fires
- Checklist per page: headline, media, form (<=5 fields), social proof, CTA, speed, tracking, thank-you flow

### Property Database (Google Drive)
- Root: AMP Property Database/
  - 01_Projects/Condo|Villa|Presale/[Project]/(Project_Info.docx, Unit_Pricing.xlsx, Brochure.pdf, Photos/)
  - 02_Resale/Resale_Master_List.xlsx + Property_Details/
  - 03_Rental/Rental_Master_List.xlsx + Property_Details/
  - 04_Leads/(Lead_Tracking.xlsx, Follow_Up_Log.xlsx)
  - 05_Marketing/(Ad_Creatives/, Content_Calendar/, Reports/)
  - 06_LINE_Group_Summary/(Daily_Summary.xlsx, Archives/)
  - 07_Templates/(Property_Template.docx, Pricing_Template.xlsx, Presentation_Template.pptx)
- Master sheet columns: PropertyID, Type, Category, ProjectName, Location, Price, SizeSqm, Bedrooms, Status, Source, DateAdded, LastUpdated, PhotosLink, AssignedSales, Notes
- Checklist: folders created, master sheets with validation, access control, naming convention, weekly backup, data entry SOP

### LINE Group Data Collection (into Google Sheets)
- Daily rhythm: 9:00 scan groups & log; 14:00 follow-up owners; 17:00 summarize + flag high-potential
- Sheet columns: Date, Group, PropertyType, Location, Price, Contact, Status, Notes, AddedToMaster (Y/N)
- Tools: ChatGPT for summarization, Google Keep for quick notes, Translate as needed

### Phase 0 Budget (Monthly)
- Ads total: Min 65k | Rec 125k | Max 200k
- AI/Tools: ChatGPT 700, Claude 700, Jasper 1,500, Canva 350, SEMrush/Ahrefs 3,500, Descript 800, Later 500, Revealbot 2,500, Unbounce 3,000, Google Workspace 200, Zapier 700 → ~14,450
- Other: Content outsource 10k-20k, Photo/Video 5k-15k, Premium listings 10k-30k
- Total/month: Min ~104,450 | Rec ~204,450 | Max ~279,450

## Development Phases (1-4)
### Phase 1 — Core Infrastructure (Week 1-4)
- Week 1: Repo init, environments, CI/CD
- Week 2: DB schema, migrations
- Week 3: Auth + base APIs
- Week 4: Integrations (Google Drive, LINE), basic admin panel
- Checklist: repo ready, envs, DB design, auth, Drive integration, LINE integration, admin basic

### Phase 2 — AI Agents (Week 5-12)
- Week 5-6: Project & Listing Agent (data mgmt, auto-tag)
- Week 6-7: Lead Router (scoring, assignment rules)
- Week 7-8: AI Sale Chat (TH/EN chatbot, qualification)
- Week 8-9: Ads & Promotion Agent (ad copy, campaign analysis)
- Week 9-10: Branding & Content Agent (content gen, brand consistency)
- Week 10-11: Analytics Agent (dashboards, reports)
- Week 11-12: Ops/Document Agent (contracts, checklists)

### Phase 3 — Integration & Testing (Week 13-16)
- Week 13: System integration, API tests
- Week 14: UAT, bug fixes
- Week 15: Performance/load tests
- Week 16: Security audit, pen test, training materials

### Phase 4 — Launch & Optimization (Week 17-20)
- Week 17: Soft launch (internal/limited users)
- Week 18: Full launch
- Week 19: Monitor & hotfix
- Week 20: Optimize from real usage

## KPIs
### Phase 0 (Monthly)
- Leads 200+, CPL < 500, LP CVR > 5%, Social ER > 3%, New properties 50+, LINE summary 100+

### End-to-end Targets
- Lead response: Manual → <5m → <1m → <30s
- Lead qualification: 20% → 40% → 60% → 70%
- Close rate: baseline → +10% → +20% → +30%
- Team efficiency: baseline → +20% → +40% → +50%

## Daily/Weekly Templates
- Daily: check ads, respond leads <1h, post content, scan LINE, update DB, review bot replies, EOD summary
- Weekly: review CPL/ROAS, rebalance budget, create next-week content, team sync, LP tweaks, backup DB, refine prompts
- Monthly: full report, ROI by channel, competitor scan, strategy adjust, tool review, training refresh

## Quick Start (Week 1)
- Day 1: Setup Drive structure; create Google Ads acct; verify Facebook BM
- Day 2: Install GA4 + Pixel; build campaign structure; start content calendar
- Day 3: Launch test campaigns (low budget); first landing page live; property DB template ready
- Day 4: Start LINE monitoring; first social posts; review initial ad data
- Day 5: Optimize based on data; scale winners; document learnings

## AI Tools Map (reference)
- Content: ChatGPT, Claude, Jasper, Copy.ai; Visual: Canva, DALL-E, Midjourney, CapCut
- Analysis: GA4, SEMrush, Meta Suite, custom dashboards
- Automation: Zapier, Make, n8n, custom agents
- Comms/CRM: LINE Bot, FB Messenger, WhatsApp Business, FlowBiz CRM

## Notes
- Do not replace existing systems unless necessary.
- Do not run automation without central data.
- Do not let AI decide budget/pricing autonomously.
