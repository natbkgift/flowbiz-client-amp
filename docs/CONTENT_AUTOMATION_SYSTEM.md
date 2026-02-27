# Content Automation System - Technical Documentation

## Overview

The Content Automation System is a Node.js-based service that automates content creation and publishing for the Asset Management Property Facebook Page. The system receives property information from LINE groups, uses AI to classify and extract data, generates multilingual content, and automatically publishes to Facebook.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                            │
│  LINE Groups: Developer | Resale | Rent                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              LINE WEBHOOK RECEIVER                           │
│  • Signature validation (@line/bot-sdk)                     │
│  • Message classification by group ID                        │
│  • Extract text, images, contact info                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI ENGINE                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │    CLASSIFIER       │  │  CONTENT GENERATOR  │          │
│  │   (GPT-4o API)      │  │   (GPT-4o API)      │          │
│  │                     │  │                     │          │
│  │ • Extract property  │  │ • Multi-language    │          │
│  │   data (JSON)       │  │ • 7 categories      │          │
│  │ • Confidence score  │  │ • Smart hashtags    │          │
│  │ • Priority detect   │  │ • Auto-schedule     │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTENT DATABASE (MongoDB)                      │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │  Property Model  │    │ ContentPost Model│             │
│  │  • Source data   │    │ • Generated text │             │
│  │  • Classification│    │ • Hashtags       │             │
│  │  • Status        │    │ • Schedule time  │             │
│  └──────────────────┘    └──────────────────┘             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            AUTO PUBLISHER (Cron Scheduler)                   │
│  • Check every 15 minutes                                    │
│  • Publish approved posts                                    │
│  • Facebook Graph API v19.0                                  │
│  • Multi-photo support                                       │
│  • Rate limiting (5s delay)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           ANALYTICS TRACKER (Cron Scheduler)                 │
│  • Auto-update every 6 hours                                 │
│  • Facebook Insights API                                     │
│  • Weekly reports                                            │
│  • Performance metrics                                       │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Models

#### Property Model (`src/models/Property.js`)
Stores property information extracted from LINE messages.

**Key Fields:**
- `property_type`: condo, house, villa, townhouse, land, commercial
- `transaction_type`: sale, rent, investment
- `source_category`: new_project, resale, rent, unknown
- `content_status`: pending, drafted, approved, published, archived
- `confidence_score`: AI confidence (0-1)
- `price`: {amount, currency, period}
- `bedrooms`, `bathrooms`, `area_sqm`
- `amenities`, `highlights`
- `is_new_launch`: boolean

**Indexes:**
- `{source_category: 1, content_status: 1}`
- `{createdAt: -1}`
- `{price.amount: 1}`

#### ContentPost Model (`src/models/ContentPost.js`)
Stores generated content posts ready for publishing.

**Key Fields:**
- `category`: resale, rent, new_project, knowledge, legal, news, lifestyle, investment
- `language`: th, en, cn, ru
- `content_text`: Generated post text
- `hashtags`: Array of hashtags
- `status`: drafted, approved, scheduled, published, failed, archived
- `suggested_publish_time`: When to publish
- `fb_post_id`: Facebook post ID after publishing
- `analytics`: {reach, engagement, clicks, reactions, shares, comments, leads}

**Indexes:**
- `{status: 1, suggested_publish_time: 1}` - For scheduler
- `{category: 1, language: 1}` - For reports
- `{published_at: -1}` - For analytics

### 2. LINE Webhook Receiver (`src/line-webhook/receiver.js`)

**Features:**
- Signature validation using @line/bot-sdk
- Group ID classification (Developer/Resale/Rent)
- Message data extraction (text, images, contact)
- Async processing (immediate response to LINE)

**Environment Variables:**
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_GROUP_DEVELOPER_ID`
- `LINE_GROUP_RESALE_ID`
- `LINE_GROUP_RENT_ID`

**Endpoint:**
```
POST /webhook/line
```

### 3. AI Classifier (`src/ai-engine/classifier.js`)

**Features:**
- Uses OpenAI GPT-4o API
- Extracts structured data from Thai/English text
- Validates and normalizes data
- Triggers priority content generation

**Extraction Fields:**
- Property details (type, size, rooms)
- Pricing information
- Location and project name
- Amenities and highlights
- Developer information
- Confidence score

**Environment Variables:**
- `OPENAI_API_KEY`

### 4. Content Generator (`src/ai-engine/content-generator.js`)

**Features:**
- Multi-language support (TH, EN, CN, RU)
- 7 content categories with custom templates
- Smart hashtag generation
- Optimal publish time calculation
- Brand voice consistency

**Content Templates:**

| Category | Languages | Focus |
|----------|-----------|-------|
| Resale | TH, EN, CN | Property details, price, CTA |
| Rent | TH, EN | Convenience, lifestyle, facilities |
| New Project | TH, EN | Excitement, FOMO, promotions |
| Knowledge | TH, EN | Educational, market insights |
| Legal | TH, EN | Thai property law, procedures |
| News | TH | Market analysis, trends |
| Lifestyle | TH | Pattaya lifestyle, community |

**Publish Times by Language:**
- Thai: 18:00 (after work)
- English: 15:00 (European afternoon)
- Chinese: 11:00 (lunch time)
- Russian: 13:00 (afternoon)

### 5. Hashtag Strategy (`src/config/hashtags.js`)

**Hashtag Categories:**

1. **Brand Hashtags** (always included):
   - #AssetManagementProperty
   - #AMPPattaya
   - #อสังหาพัทยา
   - #PattayaRealEstate

2. **Location Hashtags** (6 areas):
   - Pattaya, Jomtien, Naklua, Pratumnak, Central, Huay Yai
   - Thai and English variants

3. **Category Hashtags**:
   - Sale, Rent, Investment, New Launch, Knowledge, Legal

4. **Trending Hashtags** (by language):
   - Thai: #อสังหา2026, #บ้านในฝัน
   - English: #RealEstate2026, #DreamHome
   - Chinese: #泰国房产, #芭提雅
   - Russian: #НедвижимостьТаиланда, #Паттайя

5. **Engagement Boosters**:
   - #HomeSweet, #DreamHome, #SeaView, #LuxuryLiving

**Rules:**
- Maximum 15 hashtags per post
- All hashtags are unique
- Automatically combined based on category, location, and language

### 6. Facebook Publisher (`src/publisher/facebook-publisher.js`)

**Features:**
- Facebook Graph API v19.0
- Multi-photo post support
- Cron scheduler (every 15 minutes)
- Rate limiting (5-second delay between posts)
- Auto-upload photos as unpublished first
- Status tracking (approved → published/failed)

**Environment Variables:**
- `FB_PAGE_ID`
- `FB_PAGE_ACCESS_TOKEN`

**Publishing Flow:**
1. Check for approved posts where `suggested_publish_time <= now`
2. Prepare post data (text + hashtags)
3. Upload photos if available
4. Publish to Facebook Page
5. Record `fb_post_id` and `published_at`
6. Update status to `published` or `failed`

### 7. Analytics Tracker (`src/analytics/performance-tracker.js`)

**Features:**
- Auto-update every 6 hours
- Facebook Insights API
- Weekly performance reports
- Metrics tracking

**Metrics Collected:**
- Reach (impressions)
- Engagement (engaged users)
- Clicks
- Reactions (all types)
- Shares
- Comments
- Leads generated (manual tracking)

**Report Format:**
```javascript
{
  period: { start, end },
  totals: {
    posts, reach, engagement, clicks,
    reactions, shares, comments, leads
  },
  engagementRate: "3.5%",
  byCategory: { ... },
  byLanguage: { ... },
  topPosts: [...]
}
```

### 8. Main Application (`src/index.js`)

**Features:**
- Express server setup
- MongoDB connection
- Route mounting
- Scheduler initialization
- Environment validation
- Error handling
- Graceful shutdown

**Endpoints:**
- `GET /health` - Health check
- `POST /webhook/line` - LINE webhook receiver

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- MongoDB 5.0+
- LINE Bot account
- Facebook Page with API token
- OpenAI API key

### Installation

1. **Clone repository:**
```bash
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name amp-mongo mongo:5

# Or use local MongoDB
mongod --dbpath /data/db
```

5. **Run the application:**
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### Environment Configuration

See `.env.example` for all required variables:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/amp-content-automation

# LINE Bot
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_GROUP_DEVELOPER_ID=group_id_1
LINE_GROUP_RESALE_ID=group_id_2
LINE_GROUP_RENT_ID=group_id_3

# OpenAI
OPENAI_API_KEY=sk-...

# Facebook
FB_PAGE_ID=123456789
FB_PAGE_ACCESS_TOKEN=EAAxxxxx
```

### LINE Webhook Setup

1. Go to LINE Developers Console
2. Create or select your bot
3. Set Webhook URL: `https://your-domain.com/webhook/line`
4. Enable "Use webhook"
5. Verify webhook with test event

### Facebook Page Token

1. Go to Facebook Developers
2. Create an app (Business type)
3. Add "Facebook Login" product
4. Get Page Access Token with permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
5. Use Graph API Explorer to test

## Content Calendar

### Weekly Strategy

| Day | Category | Target Audience | Languages |
|-----|----------|----------------|-----------|
| Monday | 🏠 Sale/Resale | Thai + Foreign Buyers | TH/EN |
| Tuesday | 🔑 Rent | Expats, Tourists | TH/EN/RU |
| Wednesday | 📚 Knowledge | Investors, First-time | TH/EN |
| Thursday | 🏗️ New Projects | Investors, Developers | TH/EN/CN |
| Friday | ⚖️ Legal & Investment | Foreign Investors | TH/EN/CN |
| Saturday | 📰 News & Events | General Audience | TH/EN |
| Sunday | 💡 Lifestyle & Tips | General Audience | TH/EN |

### Content Mix
- **80% Value Content:** Knowledge, News, Tips, Legal, Lifestyle
- **20% Sales Content:** Listings, Rentals, Promotions

### Monthly Targets
- **28-35 posts** per month
- **40%+ English content**
- **At least 1 post per day**

## KPIs & Metrics

### Target Metrics

| Metric | Target | Frequency |
|--------|--------|-----------|
| Reach Growth | +20% MoM | Monthly |
| Engagement Rate | > 3% | Per post |
| Follower Growth | +500/month | Monthly |
| Leads Generated | > 50/month | Monthly |
| Post Frequency | 28-35/month | Monthly |
| English Content | > 40% | Monthly |

### Tracking Methods

1. **Automated Analytics** (every 6 hours):
   - Facebook Insights API
   - Stored in `ContentPost.analytics`

2. **Weekly Reports**:
   ```javascript
   const report = await generateWeeklyReport(startDate, endDate);
   ```

3. **Manual Lead Tracking**:
   - Update `analytics.leads_generated` field
   - Count LINE adds and Facebook inquiries

## Workflow

### 1. Property Data Flow
```
LINE Message → Webhook → Classifier → Property DB
                                    ↓
                              [If Priority] → Content Generator
```

### 2. Content Creation Flow
```
Property Data → Content Generator → Multiple Languages → ContentPost DB
                                                        ↓
                                                    status: drafted
```

### 3. Publishing Flow
```
ContentPost (drafted) → Manual Approval → status: approved
                                        ↓
                                [Scheduler checks every 15min]
                                        ↓
                        [If publish_time passed] → Publish to FB
                                                  ↓
                                              status: published
                                              fb_post_id saved
```

### 4. Analytics Flow
```
Published Post → [6 hours later] → Fetch Insights → Update analytics
                                                   ↓
                                              Weekly Report
```

## Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
- Hashtag configuration tests (14 tests)
- Database model tests (13 tests)
- Calculator core tests (30 tests)
- **Total: 57 tests**

### Manual Testing

1. **LINE Webhook:**
```bash
curl -X POST http://localhost:3000/webhook/line \
  -H "Content-Type: application/json" \
  -d '{"events": []}'
```

2. **Health Check:**
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**
   - Check if MongoDB is running
   - Verify MONGODB_URI in .env
   - Check network connectivity

2. **LINE Webhook Not Receiving:**
   - Verify webhook URL is publicly accessible
   - Check LINE_CHANNEL_SECRET matches
   - Enable webhook in LINE Console
   - Check server logs for errors

3. **Facebook Publishing Failed:**
   - Verify FB_PAGE_ACCESS_TOKEN is valid
   - Check token permissions (pages_manage_posts)
   - Verify FB_PAGE_ID is correct
   - Check rate limits

4. **OpenAI API Errors:**
   - Verify OPENAI_API_KEY is valid
   - Check API quota/credits
   - Review error logs for details

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm start
```

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review generated content quality
   - Check analytics reports
   - Approve pending posts

2. **Monthly:**
   - Review KPI performance
   - Adjust content strategy
   - Update hashtag trends
   - Renew Facebook tokens (if needed)

3. **Quarterly:**
   - Review and update content templates
   - Optimize AI prompts
   - Update dependencies

## Security Best Practices

1. **Never commit secrets** to Git
2. **Use environment variables** for all credentials
3. **Rotate API tokens** regularly (every 60 days)
4. **Monitor API usage** to detect anomalies
5. **Keep dependencies updated** for security patches
6. **Use HTTPS** for webhook endpoints
7. **Validate all input** from LINE webhooks

## Support & Resources

- **Repository:** https://github.com/natbkgift/flowbiz-client-amp
- **LINE Bot SDK:** https://github.com/line/line-bot-sdk-nodejs
- **Facebook Graph API:** https://developers.facebook.com/docs/graph-api
- **OpenAI API:** https://platform.openai.com/docs
- **MongoDB:** https://docs.mongodb.com/

## License

This project is maintained by the FlowBiz AI Core team for Asset Management Property (AMP).
