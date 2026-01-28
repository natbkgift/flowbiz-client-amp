# Make.com Automation Scenarios - AMP

> 🔗 Complete Make.com scenario documentation for AMP marketing automation

## Overview

This document details all Make.com automation scenarios for AMP Property, providing multi-channel lead capture and automated response systems for foreign customers.

---

## Scenario Index

| Scenario | Purpose | Priority | Complexity |
|----------|---------|----------|------------|
| 1. WhatsApp QR Lead Capture | Capture leads from print QR codes | HIGH | Medium |
| 2. Facebook Messenger Bot | Automate FB Messenger responses | HIGH | Medium |
| 3. Facebook Lead Ads Sync | Capture Facebook lead form submissions | HIGH | Low |
| 4. Website Form Integration | Capture website contact forms | HIGH | Low |
| 5. Email Auto-Responder | Send automated email responses | MEDIUM | Low |
| 6. Lead Scoring | Auto-calculate lead scores | MEDIUM | Medium |
| 7. Agent Assignment | Distribute leads to agents | MEDIUM | Medium |
| 8. Viewing Reminder | Send viewing reminders | LOW | Low |
| 9. Follow-up Automation | Schedule follow-up tasks | LOW | Medium |
| 10. Performance Dashboard | Update marketing KPIs | LOW | Medium |

---

## Scenario 1: WhatsApp QR Lead Capture

### Purpose
Automatically capture and process leads from QR code scans on printed materials.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                WHATSAPP QR LEAD CAPTURE                 │
└─────────────────────────────────────────────────────────┘

Customer scans QR code
       ↓
WhatsApp message sent
       ↓
[TRIGGER] Make.com receives message webhook
       ↓
[MODULE 1] Parse message text
       ↓
Extract Property_ID (PROP-XXXX-XXX)
       ↓
[MODULE 2] Lookup property in Google Sheets
       ↓
Get property details (price, location, agent, etc.)
       ↓
[MODULE 3] Add lead to Lead_Tracking sheet
       ↓
Generate Lead_ID, set Source = "QR_Print"
       ↓
[MODULE 4] Send auto-reply to customer
       ↓
"Thank you! Property: [Name], [Price]..."
       ↓
[MODULE 5] Notify assigned agent
       ↓
Telegram/Email: "New QR lead for PROP-XXX"
       ↓
[MODULE 6] Update property inquiry count
       ↓
Increment Views_Count in Property sheet
       ↓
[END] Process complete
```

### Modules Configuration

**TRIGGER: WhatsApp Webhook**
```javascript
Webhook URL: https://hook.make.com/[your-webhook-id]
Method: POST
Expected data:
{
  "from": "+66812345678",
  "message": {
    "text": "Hello, I'm interested in Property PROP-2026-045"
  },
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**MODULE 1: Text Parser**
```javascript
Pattern: PROP-\d{4}-\d{3}
Text: {{trigger.message.text}}
Output variable: Property_ID
```

**MODULE 2: Google Sheets - Search Rows**
```javascript
Spreadsheet ID: [Your Property_Master_List ID]
Sheet Name: 01_All_Properties
Search column: A (Property_ID)
Search value: {{1.Property_ID}}
Output: First matching row
```

**MODULE 3: Google Sheets - Add a Row**
```javascript
Spreadsheet ID: [Your Lead_Tracking ID]
Sheet Name: 01_Active_Leads
Values:
  A (Lead_ID): =CONCATENATE("LEAD-", YEAR(TODAY()), "-", TEXT(ROW()-1,"000"))
  B (Status): New
  C (Priority): Hot
  E (Source): QR_Print
  H (Date_Created): {{formatDate(now, "YYYY-MM-DD")}}
  R (Phone): {{trigger.from}}
  T (Preferred_Contact): WhatsApp
  U (Language): English
  BC (Property_Interested): {{1.Property_ID}}
  BD (WhatsApp_Thread_ID): {{trigger.from}}
  AK (Assigned_Agent): {{2.Assigned_Agent}}
  AZ (Notes): Lead from QR code scan
```

**MODULE 4: WhatsApp - Send Message**
```javascript
To: {{trigger.from}}
Message Template:
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

**MODULE 5: Telegram - Send Message (or Email)**
```javascript
Chat ID: [Agent's Telegram ID or group]
Message:
"""
🔔 NEW LEAD from WhatsApp QR!

Property: {{2.Property_ID}} - {{2.Project_Name}}
Location: {{2.Location_Area}}
Price: {{2.Price_Sale}} THB
Lead Phone: {{trigger.from}}
Source: QR Code Print
Time: {{formatDate(now, "YYYY-MM-DD HH:mm")}}

📋 Lead Sheet: [Link to row in Lead_Tracking.xlsx]
📱 Open WhatsApp: https://wa.me/{{trigger.from}}

⚡ ACTION: Contact within 5 minutes!
"""
```

**MODULE 6: Google Sheets - Update Row**
```javascript
Spreadsheet ID: [Property_Master_List ID]
Sheet Name: 01_All_Properties
Row Number: {{2.row_number}}
Column: AV (Views_Count)
New Value: {{add(2.Views_Count, 1)}}
```

### Error Handling

**Error Handler (attached to entire scenario):**
```javascript
On Error:
  1. Log to Error_Log sheet
  2. Send alert to admin
  3. Store failed data for manual processing

Error Log Entry:
  - Timestamp
  - Scenario: WhatsApp_QR_Capture
  - Error Message: {{error.message}}
  - Input Data: {{trigger.data}}
  - Failed Module: {{error.module}}
```

### Testing

**Test Cases:**
1. Valid Property_ID in message → Success
2. Invalid Property_ID → Error handling
3. Multiple Property_IDs in message → Take first
4. No Property_ID in message → Generic response
5. Property not found → Notify admin

---

## Scenario 2: Facebook Messenger Bot

### Purpose
Automatically respond to Facebook Messenger inquiries and capture leads.

### Flow Diagram

```
Customer sends FB message
       ↓
[TRIGGER] Facebook Pages - Watch Messages
       ↓
Get message content and sender info
       ↓
[ROUTER] Classify message intent
       ↓
├─ [ROUTE 1] Property Inquiry
│     ↓
│  [MODULE] Add to Lead_Tracking
│     ↓
│  [MODULE] Send property inquiry response
│     ↓
│  [MODULE] Notify agent
│
├─ [ROUTE 2] General Question
│     ↓
│  [MODULE] Send qualification questions
│     ↓
│  [MODULE] Add to Lead_Tracking (lower priority)
│
└─ [ROUTE 3] Spam/Unrelated
      ↓
   [MODULE] Polite response
      ↓
   [END] No lead created
```

### Modules Configuration

**TRIGGER: Facebook Pages - Watch Messages**
```javascript
Facebook Page: AMP Property Page
Limit: 10 messages per execution
Filter: New messages only
```

**ROUTER: Intent Classification**
```javascript
Route 1 (Property Inquiry):
  Condition: message contains any of:
    "condo", "property", "buy", "rent", "price", 
    "available", "for sale", "how much"
  
Route 2 (General):
  Condition: message length > 10 characters
  
Route 3 (Spam):
  Condition: else
```

**MODULE (Route 1): Add Property Inquiry Lead**
```javascript
Spreadsheet: Lead_Tracking
Values:
  Source: Facebook_Messenger
  Priority: Warm
  First_Name: {{sender.first_name}}
  Last_Name: {{sender.last_name}}
  Notes: {{message.text}}
  FB_User_ID: {{sender.id}}
  Preferred_Contact: Facebook
  Language: English
```

**MODULE (Route 1): Send Response**
```javascript
To: {{sender.id}}
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

Or browse our properties:
🌐 www.amp-property.com

For faster response:
📱 WhatsApp: +66XXXXXXXXX

Our team will get back to you shortly! 😊

Best regards,
AMP Property
"""
```

### Advanced: AI Integration (Optional)

**Add OpenAI Module for Intelligent Responses:**
```javascript
Module: OpenAI - Create Chat Completion
Model: gpt-3.5-turbo
System Prompt:
"""
You are a helpful property assistant for AMP Property in Pattaya, Thailand.
- Answer questions about properties professionally
- Be friendly and conversational
- Keep responses under 200 words
- Always include contact information
- Focus on foreign buyers/renters
- If you don't know, say so and offer to connect them with an agent
"""

User Message: {{message.text}}

Use AI response instead of templated message.
```

---

## Scenario 3: Facebook Lead Ads Sync

### Purpose
Instantly capture leads from Facebook Lead Ad forms.

### Flow Diagram

```
User submits Facebook Lead Form
       ↓
[TRIGGER] Facebook Lead Ads - Watch Leads
       ↓
Get form data (name, email, phone, message)
       ↓
[MODULE 1] Add to Lead_Tracking sheet
       ↓
[MODULE 2] Send WhatsApp confirmation
       ↓
[MODULE 3] Send email with property info
       ↓
[MODULE 4] Notify sales team
       ↓
[MODULE 5] Update campaign stats (optional)
       ↓
[END]
```

### Modules Configuration

**TRIGGER: Facebook Lead Ads - Watch Leads**
```javascript
Ad Account: [Your Ad Account ID]
Form: [Select your lead form]
Limit: 10 leads per execution
```

**MODULE 1: Add Lead**
```javascript
Spreadsheet: Lead_Tracking
Values:
  Lead_ID: Auto-generated
  Status: New
  Priority: Hot (paid ad = hot!)
  Source: Facebook_Lead_Form
  Source_Campaign: {{ad.campaign_name}}
  Date_Created: {{formatDate(now, "YYYY-MM-DD")}}
  First_Name: {{lead.first_name}}
  Last_Name: {{lead.last_name}}
  Email: {{lead.email}}
  Phone: {{lead.phone}}
  Budget_Max: {{lead.custom_question.budget}}
  Move_Timeline: {{lead.custom_question.timeline}}
  Notes: {{lead.custom_question.message}}
  Preferred_Contact: Phone
  Language: English
  Next_Follow_Up: {{formatDate(now, "YYYY-MM-DD HH:mm")}}
```

**MODULE 2: WhatsApp Message**
```javascript
To: {{lead.phone}}
Message:
"""
Hi {{lead.first_name}}! 👋

Thank you for your interest in Pattaya properties!

We received your inquiry. Our team will call you within 1 hour.

For urgent matters:
📱 WhatsApp: +66XXXXXXXXX
📧 Email: info@amp-property.com

Best regards,
AMP Property Team
🌐 www.amp-property.com
"""
```

**MODULE 3: Send Email**
```javascript
To: {{lead.email}}
From: info@amp-property.com
Subject: "Thank You - AMP Property"
Body: [Use template from WhatsApp Messages EN doc]
Attachments:
  - Company brochure PDF
  - Featured properties list PDF
```

**MODULE 4: Notify Team (Slack/Telegram/Email)**
```javascript
Message:
"""
🔥 HOT LEAD from Facebook Ad!

👤 {{lead.first_name}} {{lead.last_name}}
📧 {{lead.email}}
📱 {{lead.phone}}
💰 Budget: {{lead.custom_question.budget}}
📅 Timeline: {{lead.custom_question.timeline}}
💬 Message: {{lead.custom_question.message}}

📊 Campaign: {{ad.campaign_name}}
💵 Ad Cost: {{ad.cost}} THB

⏰ CALL WITHIN 1 HOUR!
📋 Lead Sheet: [Link]
```

---

## Scenario 4: Website Form Integration

### Purpose
Capture leads from website contact forms.

### Flow Diagram

```
User submits website form
       ↓
Form sends webhook to Make.com
       ↓
[TRIGGER] Webhook received
       ↓
[MODULE 1] Validate data
       ↓
[MODULE 2] Add to Lead_Tracking
       ↓
[ROUTER] Check if property inquiry
       ↓
├─ YES: Lookup property details
│     ↓
│  Send property-specific email
│
└─ NO: Send general response
       ↓
[MODULE] Send WhatsApp/SMS confirmation
       ↓
[MODULE] Notify agent
       ↓
[END]
```

### Website Webhook Code

**HTML Form:**
```html
<form id="contactForm">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone" required>
  <input type="hidden" name="property_id" id="propertyId">
  <textarea name="message" required></textarea>
  <button type="submit">Send Inquiry</button>
</form>
```

**JavaScript:**
```javascript
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: e.target.name.value,
    email: e.target.email.value,
    phone: e.target.phone.value,
    property_id: e.target.property_id.value,
    message: e.target.message.value,
    page_url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  await fetch('https://hook.make.com/YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  // Show success message
  alert('Thank you! We will contact you soon.');
});
```

### Modules Configuration

**TRIGGER: Webhook**
```javascript
Webhook URL: https://hook.make.com/[ID]
Method: POST
Data structure: JSON
```

**MODULE 1: Data Validation**
```javascript
Check:
  - Email contains "@"
  - Phone length >= 10
  - Name is not empty
  
If valid: Continue
If invalid: Send error notification to admin
```

**MODULE 2: Add Lead**
```javascript
[Similar to previous scenarios]
Source: Website_Form
Source_URL: {{webhook.page_url}}
Property_Interested: {{webhook.property_id}}
```

---

## Scenario 5-10: Additional Scenarios

### Scenario 5: Email Auto-Responder

**Purpose:** Send automated thank you emails

**Trigger:** New lead added to Lead_Tracking
**Action:** Send email template based on lead source

---

### Scenario 6: Lead Scoring

**Purpose:** Calculate lead scores automatically

**Trigger:** New lead or lead updated
**Action:** Calculate score based on criteria, update Priority field

---

### Scenario 7: Agent Assignment

**Purpose:** Distribute leads evenly to agents

**Trigger:** New lead
**Logic:** Round-robin or based on availability
**Action:** Assign agent, notify them

---

### Scenario 8: Viewing Reminder

**Purpose:** Send reminder before property viewing

**Trigger:** Scheduled (check daily)
**Filter:** Viewings tomorrow
**Action:** Send WhatsApp/SMS reminder

---

### Scenario 9: Follow-up Automation

**Purpose:** Create follow-up tasks automatically

**Trigger:** Lead created or status changed
**Action:** Schedule follow-up based on lead stage

---

### Scenario 10: Performance Dashboard

**Purpose:** Update marketing KPIs automatically

**Trigger:** Scheduled (daily at midnight)
**Action:** Calculate metrics, update dashboard sheet

---

## Operations Usage Estimate

### Per Lead Operations Count

| Scenario | Operations per Lead |
|----------|---------------------|
| WhatsApp QR | 6 ops |
| FB Messenger | 5 ops |
| FB Lead Ads | 7 ops |
| Website Form | 6 ops |
| Auto-responder | 2 ops |
| Lead scoring | 3 ops |
| Agent assignment | 2 ops |

### Monthly Estimate (300 leads)

```
100 WhatsApp leads  = 600 ops
80 FB Messenger     = 400 ops
50 FB Lead Ads      = 350 ops
70 Website forms    = 420 ops
300 Auto-replies    = 600 ops
300 Lead scores     = 900 ops
300 Assignments     = 600 ops
────────────────────────────
Total               = 3,870 operations/month
```

**Recommended Plan:** Core Plan (10,000 ops/month) = ~$9/month

---

## Best Practices

### Scenario Design

✅ **Do:**
- Keep scenarios simple and focused
- Use descriptive names
- Add comments in modules
- Test thoroughly before going live
- Handle errors gracefully
- Log important events
- Monitor execution history

❌ **Don't:**
- Create overly complex scenarios
- Hardcode values (use variables)
- Ignore error handling
- Skip testing
- Forget to set execution limits
- Leave scenarios running unused

### Performance

- Use filters early to reduce operations
- Batch process where possible
- Set appropriate execution limits
- Monitor operation usage
- Optimize slow scenarios

### Security

- Never expose webhook URLs publicly
- Validate all input data
- Don't store sensitive data in logs
- Use secure connections (HTTPS)
- Limit permissions to minimum needed

---

## Monitoring & Maintenance

### Daily Checks

- Review failed executions
- Check for errors
- Verify leads are being captured
- Ensure notifications working

### Weekly Tasks

- Review operation usage
- Optimize slow scenarios
- Update templates if needed
- Check data quality in sheets

### Monthly Review

- Analyze scenario performance
- Cost vs benefit analysis
- Update based on feedback
- Plan new automations

---

## Related Documents

- [Lead Integration Guide](../ops/marketing/LEAD_INTEGRATION_GUIDE.md) (Detailed setup)
- [Print QR Operations](../ops/marketing/PRINT_QR_OPERATIONS.md)
- [Facebook Posting SOP](../ops/marketing/FACEBOOK_POSTING_SOP.md)
- [WhatsApp Messages EN](../ops/marketing/content/WHATSAPP_MESSAGES_EN.md)

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-28 | Initial scenario documentation | AI Agent |
