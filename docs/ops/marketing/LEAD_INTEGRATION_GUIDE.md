# Lead Integration Guide - AMP

> 🔗 Make.com automation guide for multi-channel lead capture

## Overview

Complete guide for integrating lead sources into Google Sheets using Make.com (formerly Integromat), targeting **foreign customers** through multiple digital channels.

### Integration Channels

1. **WhatsApp Business** - QR code and direct messages
2. **Facebook Messenger** - Page messages and automated responses
3. **Facebook Lead Ads** - Form submissions
4. **Website Forms** - Contact and inquiry forms

---

## Make.com Account Setup

### Prerequisites

**Required Accounts:**
- ✅ Make.com account (free or paid plan)
- ✅ Google Workspace account
- ✅ WhatsApp Business API or WhatsApp Cloud API
- ✅ Facebook Business account with Page
- ✅ Website with webhook capability

**Recommended Plan:**
- Make.com Core Plan (10,000 operations/month)
- Cost: ~$9/month
- Sufficient for 300-500 leads/month

---

## Integration 1: WhatsApp QR Lead Capture

### Overview

```
Flow:
WhatsApp Message Received
    ↓
Parse Property_ID from message
    ↓
Look up property details (Google Sheets)
    ↓
Add lead to Lead_Tracking sheet
    ↓
Send auto-reply with property info
    ↓
Notify assigned agent
    ↓
Update property inquiry count
```

### Setup Steps

#### Step 1: Connect WhatsApp to Make.com

**Option A: WhatsApp Cloud API (Recommended)**

1. Go to Meta for Developers (developers.facebook.com)
2. Create new app > Select "Business"
3. Add WhatsApp product
4. Get Phone Number ID and Access Token
5. In Make.com:
   - Add WhatsApp module
   - Choose "Watch Messages"
   - Enter credentials

**Option B: Third-party WhatsApp API**
- Use services like Twilio, 360Dialog, or WATI
- Follow provider's integration guide
- Connect to Make.com via API

#### Step 2: Create Scenario

**Trigger: Watch for New WhatsApp Messages**

```javascript
Module: WhatsApp > Watch Messages
Settings:
- Webhook URL: [Make.com provides]
- Filter: Message contains "Property" or "PROP-"
- Limit: 1 message per execution
```

**Module 1: Text Parser - Extract Property ID**

```javascript
Module: Text Parser > Match Pattern
Pattern: PROP-\d{4}-\d{3}
Text: {{message.body}}
Output: Property_ID
```

**Module 2: Google Sheets - Lookup Property**

```javascript
Module: Google Sheets > Search Rows
Spreadsheet: Property_Master_List
Sheet: 01_All_Properties
Search column: Property_ID
Search value: {{1.Property_ID}}
Output: Property details
```

**Module 3: Google Sheets - Add Lead**

```javascript
Module: Google Sheets > Add a Row
Spreadsheet: Lead_Tracking
Sheet: 01_Active_Leads
Values:
- Lead_ID: =CONCATENATE("LEAD-", YEAR(TODAY()), "-", TEXT(COUNTA($A:$A),"000"))
- Status: "New"
- Priority: "Hot"
- Source: "QR_Print"
- Property_Interested: {{1.Property_ID}}
- Date_Created: {{formatDate(now, "YYYY-MM-DD")}}
- Phone: {{message.from}}
- WhatsApp_Thread_ID: {{message.from}}
- Preferred_Contact: "WhatsApp"
- Language: "English"
- Assigned_Agent: {{2.Assigned_Agent}} // From property lookup
- Notes: "Lead from QR code scan"
```

**Module 4: WhatsApp - Send Auto-Reply**

```javascript
Module: WhatsApp > Send a Message
To: {{message.from}}
Message:
"""
Hi! 👋 Thank you for contacting AMP Property!

You're interested in:
📍 {{2.Project_Name}}, {{2.Location_Area}}
🏠 {{2.Type}} | {{2.Bedrooms}} BR | {{2.Size_SQM}} SQM
💰 {{2.Price_Sale}} THB

📸 More photos: {{2.Photos_Link}}
🌐 Details: {{2.Listing_URL}}

Our agent {{2.Assigned_Agent}} will contact you shortly!

May I know your name to assist you better?

Best regards,
AMP Property Team
☎️ +66XXXXXXXXX
🌐 www.amp-property.com
"""
```

**Module 5: Telegram/Email - Notify Agent**

```javascript
Module: Telegram > Send a Message
OR
Email > Send an Email

To: Agent's Telegram/Email
Message:
"""
🔔 NEW LEAD from WhatsApp QR!

Property: {{2.Property_ID}} - {{2.Project_Name}}
Lead Phone: {{message.from}}
Source: QR Code Print
Time: {{formatDate(now, "HH:mm")}}

📋 Lead Sheet: [Link to Lead_Tracking.xlsx]
📱 Open WhatsApp: https://wa.me/{{message.from}}

Action Required: Contact within 5 minutes!
"""
```

**Module 6: Google Sheets - Update Property Stats**

```javascript
Module: Google Sheets > Update a Row
Spreadsheet: Property_Master_List
Sheet: 01_All_Properties
Row: {{2.row_number}}
Update column: Views_Count
New value: {{2.Views_Count + 1}}
```

### Testing

1. Send test WhatsApp message: "Hello, I'm interested in Property PROP-2026-001"
2. Check Make.com execution log
3. Verify lead added to Lead_Tracking sheet
4. Verify auto-reply sent
5. Verify agent notified

---

## Integration 2: Facebook Messenger Lead Capture

### Overview

```
Flow:
Facebook Messenger Message Received
    ↓
Extract user info and message content
    ↓
Detect intent (buy/rent/inquiry)
    ↓
Add lead to Lead_Tracking sheet
    ↓
Send automated response
    ↓
Notify agent
```

### Setup Steps

#### Step 1: Connect Facebook Page

1. In Make.com, add Facebook Pages module
2. Authorize with Facebook Business account
3. Select your AMP property page
4. Grant required permissions:
   - pages_messaging
   - pages_manage_metadata
   - pages_read_engagement

#### Step 2: Create Scenario

**Trigger: Watch for New Messages**

```javascript
Module: Facebook Pages > Watch Messages
Page: [Your AMP Page]
Limit: 10 messages per execution
```

**Router: Classify Message Intent**

```javascript
// Route 1: Contains property inquiry keywords
Filter: message contains "condo" OR "price" OR "available" OR "buy" OR "rent"
Label: "Property Inquiry"

// Route 2: General inquiry
Filter: else
Label: "General Inquiry"
```

**Module 1 (Route 1): Add Lead - Property Inquiry**

```javascript
Module: Google Sheets > Add a Row
Spreadsheet: Lead_Tracking
Sheet: 01_Active_Leads
Values:
- Lead_ID: Auto-generated
- Status: "New"
- Priority: "Warm"
- Source: "Facebook_Messenger"
- Date_Created: {{formatDate(now, "YYYY-MM-DD")}}
- First_Name: {{sender.first_name}}
- Last_Name: {{sender.last_name}}
- Preferred_Contact: "Facebook"
- Language: "English"
- Notes: {{message.text}}
- FB_User_ID: {{sender.id}}
```

**Module 2: Send Automated Response**

```javascript
Module: Facebook Messenger > Send a Message
Recipient: {{sender.id}}
Message:
"""
Hi {{sender.first_name}}! 👋

Thank you for contacting AMP Property!

I'd love to help you find your perfect property in Pattaya! 🏖️

To better assist you, could you please share:

1️⃣ Looking to Buy or Rent?
2️⃣ Preferred area? (Jomtien, Pattaya, Pratumnak...)
3️⃣ Budget range?
4️⃣ Number of bedrooms?
5️⃣ When do you need it?

Or feel free to browse our available properties:
🌐 www.amp-property.com

For faster response:
📱 WhatsApp: +66XXXXXXXXX

Our team will get back to you shortly! 😊

Best regards,
AMP Property
"""
```

**Module 3: Notify Agent**

```javascript
Module: Telegram/Email > Send Notification
Message:
"""
🔔 NEW LEAD from Facebook Messenger!

Name: {{sender.first_name}} {{sender.last_name}}
Message: {{message.text}}
Time: {{formatDate(now, "YYYY-MM-DD HH:mm")}}
Profile: https://facebook.com/{{sender.id}}

📋 Lead Sheet: [Link]
💬 Respond: [FB Page Inbox Link]

Action: Reply within 15 minutes!
"""
```

### Advanced: AI Intent Detection

For better classification, integrate OpenAI:

```javascript
Module: OpenAI > Create a Completion
Model: gpt-3.5-turbo
Prompt:
"""
Classify this Facebook message into one of these categories:
1. Looking to Buy
2. Looking to Rent
3. Asking for Price
4. General Question
5. Spam

Also extract:
- Preferred location (if mentioned)
- Budget (if mentioned)
- Bedrooms (if mentioned)
- Timeline (if mentioned)

Message: "{{message.text}}"

Respond in JSON format.
"""

Use output to pre-fill lead fields
```

---

## Integration 3: Facebook Lead Ads

### Overview

```
Flow:
User submits Facebook Lead Form
    ↓
Retrieve form data
    ↓
Add lead to Lead_Tracking sheet
    ↓
Send confirmation via WhatsApp/SMS
    ↓
Send email with property info
    ↓
Notify sales team
```

### Setup Steps

#### Step 1: Create Lead Ad Form

**In Facebook Ads Manager:**

1. Campaign objective: "Lead generation"
2. Create Lead Form with these fields:
   - Full Name (required)
   - Email (required)
   - Phone (required)
   - Message: "What type of property are you looking for?"
   - Budget range (dropdown)
   - Timeline (dropdown)

3. Privacy Policy URL: Your website privacy page

4. Thank You Screen:
   ```
   Thank you for your interest!
   
   We'll contact you within 1 hour.
   
   Meanwhile, check out our properties:
   www.amp-property.com
   
   Or WhatsApp us: +66XXXXXXXXX
   ```

#### Step 2: Connect to Make.com

**Trigger: Watch Lead Ads**

```javascript
Module: Facebook Lead Ads > Watch Leads
Ad Account: [Your Ad Account]
Form: [Select your lead form]
Limit: 10 per execution
```

**Module 1: Add to Lead Tracking**

```javascript
Module: Google Sheets > Add a Row
Spreadsheet: Lead_Tracking
Sheet: 01_Active_Leads
Values:
- Lead_ID: Auto-generated
- Status: "New"
- Priority: "Hot" // From paid ad = hot lead
- Source: "Facebook_Lead_Form"
- Source_Campaign: {{ad.campaign_name}}
- Date_Created: {{formatDate(now, "YYYY-MM-DD")}}
- First_Name: {{lead.first_name}}
- Last_Name: {{lead.last_name}}
- Email: {{lead.email}}
- Phone: {{lead.phone}}
- Budget_Max: {{lead.budget}}
- Move_Timeline: {{lead.timeline}}
- Preferred_Contact: "Phone"
- Language: "English"
- Notes: {{lead.message}}
- Next_Follow_Up: {{addDays(now, 0, "YYYY-MM-DD HH:mm")}} // Today, ASAP
```

**Module 2: Send WhatsApp Confirmation**

```javascript
Module: WhatsApp > Send a Template Message
To: {{lead.phone}}
Template: "lead_confirmation" // Pre-approved template
Parameters:
- name: {{lead.first_name}}
- property_type: {{lead.message}}
```

**Module 3: Send Email**

```javascript
Module: Email > Send an Email
To: {{lead.email}}
From: info@amp-property.com
Subject: "Thank You for Your Interest - AMP Property"
Body:
"""
Hi {{lead.first_name}},

Thank you for your interest in properties in Pattaya! 🏖️

We received your inquiry about {{lead.message}}.

Our experienced English-speaking team will contact you within 1 hour to discuss your requirements and show you the best available options within your budget.

In the meantime, you can:
📱 WhatsApp us: +66XXXXXXXXX
🌐 Browse properties: www.amp-property.com
📧 Email us: info@amp-property.com

We have many beautiful properties available for foreigners with:
✅ Foreign ownership options
✅ Sea views
✅ Modern facilities
✅ Great locations
✅ Transparent pricing

Looking forward to helping you find your perfect property!

Best regards,
[Agent Name]
AMP Property
+66XXXXXXXXX
www.amp-property.com
"""

Attachments:
- AMP Company Brochure (PDF)
- Featured Properties List (PDF)
```

**Module 4: Notify Sales Team**

```javascript
Module: Telegram > Send to Group
OR
Slack > Post Message
OR
Email > Send to Team

Message:
"""
🔥 HOT LEAD from Facebook Ad!

👤 Name: {{lead.first_name}} {{lead.last_name}}
📧 Email: {{lead.email}}
📱 Phone: {{lead.phone}}
💰 Budget: {{lead.budget}}
📅 Timeline: {{lead.timeline}}
💬 Looking for: {{lead.message}}

📊 Campaign: {{ad.campaign_name}}
💵 Ad Spend: {{ad.cost}} THB

📋 Lead Sheet Row: [Link]

⚡ ACTION REQUIRED: Call within 1 hour!

Assigned to: [Auto-assign based on rotation/availability]
"""
```

**Module 5: Update Campaign Stats** (Optional)

```javascript
Module: Google Sheets > Add a Row
Spreadsheet: Marketing_Stats
Sheet: Lead_Ads_Performance
Values:
- Date: {{formatDate(now, "YYYY-MM-DD")}}
- Campaign: {{ad.campaign_name}}
- Ad_Set: {{ad.adset_name}}
- Lead_ID: [Generated]
- Cost: {{ad.cost}}
- Phone: {{lead.phone}}
- Status: "New"
```

### Testing

1. Submit test lead form
2. Check Make.com execution
3. Verify lead in sheet
4. Check WhatsApp/Email sent
5. Verify team notified

---

## Integration 4: Website Form

### Overview

```
Flow:
Contact form submitted on website
    ↓
Webhook triggers Make.com
    ↓
Add lead to tracking sheet
    ↓
Send auto-reply email
    ↓
Send confirmation SMS/WhatsApp
    ↓
Notify agent
```

### Setup Steps

#### Step 1: Website Webhook Setup

**If using WordPress:**

Install plugin like "WPForms" or "Contact Form 7 + Webhooks"

**If custom website:**

Add webhook call after form submission:

```javascript
// JavaScript example
fetch('https://hook.make.com/YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
    property_id: formData.property_id, // If inquiry about specific property
    page_url: window.location.href,
    timestamp: new Date().toISOString()
  })
});
```

#### Step 2: Make.com Scenario

**Trigger: Webhook**

```javascript
Module: Webhooks > Custom Webhook
URL: [Make.com provides]
Method: POST
Data structure: [Auto-detected from first submission]
```

**Module 1: Add Lead**

```javascript
Module: Google Sheets > Add a Row
Spreadsheet: Lead_Tracking
Sheet: 01_Active_Leads
Values:
- Lead_ID: Auto-generated
- Status: "New"
- Priority: "Warm"
- Source: "Website_Form"
- Source_URL: {{webhook.page_url}}
- Property_Interested: {{webhook.property_id}}
- Date_Created: {{formatDate(now, "YYYY-MM-DD")}}
- Full_Name: {{webhook.name}}
- Email: {{webhook.email}}
- Phone: {{webhook.phone}}
- Preferred_Contact: "Email"
- Language: "English"
- Notes: {{webhook.message}}
- Next_Follow_Up: {{addHours(now, 1, "YYYY-MM-DD HH:mm")}}
```

**Module 2: Lookup Property (if property_id provided)**

```javascript
Module: Google Sheets > Search Rows (conditional)
Condition: {{webhook.property_id}} is not empty
Spreadsheet: Property_Master_List
Sheet: 01_All_Properties
Search value: {{webhook.property_id}}
```

**Module 3: Send Auto-Reply Email**

```javascript
Module: Email > Send an Email
To: {{webhook.email}}
Subject: "Thank You - We'll Contact You Shortly | AMP Property"
Body:
"""
Dear {{webhook.name}},

Thank you for contacting AMP Property! 🏡

We have received your inquiry{{if webhook.property_id}} about Property {{webhook.property_id}} - {{2.Project_Name}}{{end}}.

Your message:
"{{webhook.message}}"

Our team will respond to you within 2 hours (or the next business day if it's after hours).

Quick Links:
🌐 View all properties: www.amp-property.com
📱 Urgent? WhatsApp us: +66XXXXXXXXX
📧 Email: info@amp-property.com
☎️ Call: +66XXXXXXXXX

Office Hours:
Monday-Sunday: 9:00 AM - 7:00 PM (Thailand Time)

{{if webhook.property_id}}
Property Details:
📍 {{2.Project_Name}}, {{2.Location_Area}}
💰 {{2.Price_Sale}} THB
🛏️ {{2.Bedrooms}} Bedrooms | {{2.Bathrooms}} Bathrooms
📐 {{2.Size_SQM}} SQM
🌐 More info: {{2.Listing_URL}}
{{end}}

Looking forward to helping you!

Best regards,
AMP Property Team
🏢 Asset Management Property (AMP)
🌐 www.amp-property.com
"""
```

**Module 4: Send WhatsApp/SMS**

```javascript
Module: WhatsApp > Send a Message
OR
SMS > Send SMS (via Twilio)

To: {{webhook.phone}}
Message:
"""
Hi {{webhook.name}}! 

Thank you for contacting AMP Property via our website.

We'll call/email you within 2 hours.

For urgent inquiries, WhatsApp us:
+66XXXXXXXXX

Best regards,
AMP Team
www.amp-property.com
"""
```

**Module 5: Notify Agent**

```javascript
Module: Email > Send an Email
To: {{if webhook.property_id}}{{2.Assigned_Agent_Email}}{{else}}info@amp-property.com{{end}}
Subject: "🌐 New Website Lead - {{webhook.name}}"
Body:
"""
NEW LEAD from Website!

👤 Name: {{webhook.name}}
📧 Email: {{webhook.email}}
📱 Phone: {{webhook.phone}}
🌐 From page: {{webhook.page_url}}
⏰ Time: {{formatDate(now, "YYYY-MM-DD HH:mm")}}

Message:
{{webhook.message}}

{{if webhook.property_id}}
Property of Interest:
{{webhook.property_id}} - {{2.Project_Name}}
{{2.Location_Area}}
{{2.Price_Sale}} THB
{{end}}

📋 Lead Details: [Link to Lead_Tracking.xlsx]
📱 Call/WhatsApp: {{webhook.phone}}

⏰ Follow up within 2 hours!
"""
```

---

## Error Handling & Logging

### Error Notifications

**In each scenario, add Error Handler:**

```javascript
Module: Tools > Error Handler
Actions:
1. Log error to Google Sheets (Error_Log sheet)
2. Send alert to admin:
   - Email/Telegram with error details
   - Scenario name
   - Module failed
   - Error message
   - Input data
```

**Error Log Sheet Format:**

| Timestamp | Scenario | Module | Error | Input_Data | Status |
|-----------|----------|--------|-------|------------|--------|
| 2026-01-28 10:30 | WhatsApp_QR | Parse_Property_ID | No match found | {...} | Unresolved |

### Data Validation

**Before adding lead, validate:**

```javascript
Module: Tools > Set Multiple Variables
Variables:
- is_valid_email: {{contains(webhook.email, "@")}}
- is_valid_phone: {{length(webhook.phone) >= 10}}
- is_complete: {{webhook.name != "" AND webhook.phone != ""}}

Filter: Continue only if is_complete = true
```

---

## AI Response Integration

### OpenAI Auto-Response (Advanced)

**Add AI module for intelligent responses:**

```javascript
Module: OpenAI > Create a Chat Completion
Model: gpt-3.5-turbo
System Prompt:
"""
You are a helpful property assistant at AMP Property in Pattaya.
Answer customer questions professionally in English.
Be friendly, helpful, and concise.
Always include contact information at the end.
"""

User Message: {{customer.message}}

Max Tokens: 200
Temperature: 0.7
```

**Use Cases:**
- Answer common questions automatically
- Provide property suggestions based on requirements
- Generate personalized responses
- Qualify leads automatically

---

## Testing & Deployment

### Testing Checklist

**Before going live:**

- [ ] Test each scenario with sample data
- [ ] Verify all Google Sheets connections
- [ ] Check all notification channels work
- [ ] Validate data format in sheets
- [ ] Test error handling
- [ ] Verify agent notifications arrive
- [ ] Test auto-replies (WhatsApp, Email, SMS)
- [ ] Check webhook reliability
- [ ] Test with different data variations
- [ ] Verify Lead_ID generation works

### Monitoring

**Daily:**
- Check Make.com execution log
- Review failed executions
- Verify all leads captured
- Check response times

**Weekly:**
- Review integration performance
- Optimize slow scenarios
- Check for duplicate leads
- Update templates if needed

**Monthly:**
- Review automation costs
- Analyze conversion rates by source
- Update AI prompts if using
- Optimize workflows

---

## Performance Metrics

### Track These KPIs

| Channel | Metric | Target |
|---------|--------|--------|
| WhatsApp QR | Capture rate | 100% |
| WhatsApp QR | Auto-reply time | < 10 sec |
| FB Messenger | Capture rate | 100% |
| FB Messenger | Response time | < 1 min |
| Lead Ads | Capture rate | 100% |
| Lead Ads | Follow-up time | < 1 hour |
| Website Form | Capture rate | 100% |
| Website Form | Confirmation sent | < 30 sec |

---

## Cost Analysis

### Make.com Operations Usage

**Estimated operations per lead:**

- WhatsApp QR: 6 operations/lead
- FB Messenger: 5 operations/lead
- Lead Ads: 7 operations/lead
- Website Form: 6 operations/lead

**Example monthly volume:**

```
100 WhatsApp leads   = 600 operations
80 FB Messenger      = 400 operations
50 Lead Ads          = 350 operations
70 Website forms     = 420 operations
───────────────────────────────────
Total                = 1,770 operations/month
```

**Plan needed:** Free plan (1,000 ops) or Core plan (10,000 ops)

---

## Troubleshooting

### Common Issues

**Leads not capturing:**
- Check webhook URL is correct
- Verify API connections active
- Check Google Sheets permissions
- Review Make.com execution log

**Auto-replies not sending:**
- Check WhatsApp/Email credentials
- Verify phone number format
- Check message template approval (WhatsApp)
- Review rate limits

**Duplicate leads:**
- Add deduplication module
- Check for same phone/email in sheet before adding
- Set unique constraints

**Agent not notified:**
- Check notification channel credentials
- Verify email/Telegram/Slack settings
- Check spam folder
- Verify agent contact info

---

## Security & Privacy

### Data Protection

**Best Practices:**
- ✅ Use secure webhook URLs (HTTPS)
- ✅ Implement data validation
- ✅ Store credentials securely in Make.com
- ✅ Limit access to Google Sheets
- ✅ Comply with PDPA (Thailand Privacy Law)
- ✅ Add unsubscribe option in emails
- ✅ Don't store sensitive data in plain text

**PDPA Compliance:**
- Get consent before marketing communication
- Include privacy policy link in forms
- Allow customers to request data deletion
- Secure data storage

---

## Upgrade Paths

### Future Enhancements

**Phase 2:**
- [ ] Add LINE OA integration
- [ ] Integrate with CRM (HubSpot/Salesforce)
- [ ] Add Instagram DM automation
- [ ] Implement chatbot with AI

**Phase 3:**
- [ ] Predictive lead scoring with ML
- [ ] Automated property matching
- [ ] Multi-language support
- [ ] Voice message transcription

---

## Related Documents

- [Print QR Operations](PRINT_QR_OPERATIONS.md)
- [Facebook Posting SOP](FACEBOOK_POSTING_SOP.md)
- [WhatsApp Messages EN](content/WHATSAPP_MESSAGES_EN.md)
- [Lead Tracking Template](../../data/templates/LEAD_TRACKING_TEMPLATE.md)
- [Property Master List](../../data/templates/PROPERTY_MASTER_LIST.md)

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-28 | Initial guide creation | AI Agent |
