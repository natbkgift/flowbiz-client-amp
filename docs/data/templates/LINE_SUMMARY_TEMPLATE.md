# 💬 LINE Group Summary System

> Workflow และ Template สำหรับสรุปบทสนทนา LINE Groups ประจำวัน

## Overview

**LINE Group Summary System** คือระบบสำหรับทำ Daily Summary จาก LINE Groups เพื่อ:
- จับ Hot Leads ที่ซ่อนอยู่ในกลุ่ม
- ติดตาม Action Items และ Tasks
- วิเคราะห์ Customer Sentiment
- สร้าง Weekly/Monthly Reports

### Why This Matters

LINE Groups มักมีข้อมูลสำคัญที่หลุดลอดไป:
- ❌ Leads ไม่ได้รับการติดตาม
- ❌ Customer questions ไม่ได้รับคำตอบ
- ❌ Action items ถูกลืม
- ❌ Hot opportunities หลุดมือไป

**Solution:** Daily LINE Summary Workflow

---

## 📋 Daily Workflow

### Timeline: 18:00 - 19:00 ทุกวัน

```
18:00 → Export LINE chats
18:10 → Review และ categorize
18:30 → Identify hot leads
18:45 → Create action items
18:50 → Update tracking sheet
19:00 → Share summary to team
```

---

## 📊 Sheet Structure

### Sheet 1: DAILY_SUMMARY

**Template Structure:**

| Column | Field Name | Type | Description | Example |
|--------|-----------|------|-------------|---------|
| A | `summary_date` | Date | วันที่สรุป | 2026-01-15 |
| B | `group_name` | Dropdown | ชื่อกลุ่ม LINE | AMP Buyers Group |
| C | `total_messages` | Number | จำนวนข้อความทั้งหมด | 127 |
| D | `active_members` | Number | สมาชิกที่โพสต์วันนี้ | 23 |
| E | `hot_leads_count` | Number | จำนวน Hot Leads | 3 |
| F | `hot_leads_names` | Text | ชื่อ Hot Leads | John, Anna, Peter |
| G | `questions_count` | Number | คำถามที่ยังไม่ได้ตอบ | 2 |
| H | `action_items_count` | Number | Tasks ที่ต้องทำ | 5 |
| I | `key_topics` | Text | หัวข้อหลักที่คุยกัน | New projects, Price inquiry |
| J | `sentiment` | Dropdown | Positive/Neutral/Negative | Positive |
| K | `summary_by` | Dropdown | ผู้สรุป | Nat |
| L | `notes` | Text | บันทึกเพิ่มเติม | Very active today |
| M | `summary_link` | URL | Link to detailed summary | [Google Doc] |

### Sheet 2: HOT_LEADS_DETAIL

**Purpose:** Track hot leads identified from LINE

| Column | Field Name | Type | Description |
|--------|-----------|------|-------------|
| A | `date_identified` | Date | วันที่พบ |
| B | `lead_name` | Text | ชื่อ/Nickname |
| C | `line_id` | Text | LINE ID (if available) |
| D | `group_name` | Dropdown | มาจากกลุ่มไหน |
| E | `interest_signals` | Text | สัญญาณความสนใจ |
| F | `messages_summary` | Text | สรุปข้อความ |
| G | `property_interest` | Text | Property ที่สนใจ |
| H | `urgency_level` | Dropdown | High/Medium/Low |
| I | `action_taken` | Dropdown | DM Sent/Called/Added to CRM |
| J | `assigned_to` | Dropdown | มอบหมายให้ sales |
| K | `followup_date` | Date | นัดติดตาม |
| L | `status` | Dropdown | New/Contacted/Converted/Lost |
| M | `conversion_result` | Text | ผลลัพธ์ |

### Sheet 3: ACTION_ITEMS

**Purpose:** Track tasks from LINE conversations

| Column | Field Name | Type | Description |
|--------|-----------|------|-------------|
| A | `date_created` | Date | วันที่สร้าง task |
| B | `group_name` | Dropdown | มาจากกลุ่มไหน |
| C | `action_type` | Dropdown | Answer Question/Send Info/Follow-up |
| D | `description` | Text | รายละเอียด task |
| E | `priority` | Dropdown | High/Medium/Low |
| F | `assigned_to` | Dropdown | มอบหมายให้ |
| G | `due_date` | Date | ต้องทำภายใน |
| H | `status` | Dropdown | Pending/In Progress/Done |
| I | `completed_date` | Date | วันที่เสร็จ |
| J | `notes` | Text | บันทึก |

### Sheet 4: WEEKLY_SUMMARY

**Purpose:** Aggregate weekly stats

| Column | Field Name | Formula | Description |
|--------|-----------|---------|-------------|
| A | `week_start` | - | วันเริ่มสัปดาห์ |
| B | `week_end` | - | วันสิ้นสุดสัปดาห์ |
| C | `total_messages` | SUM | ข้อความทั้งหมด |
| D | `avg_messages_day` | AVERAGE | ค่าเฉลี่ยต่อวัน |
| E | `hot_leads_found` | SUM | Hot leads ที่เจอ |
| F | `leads_converted` | COUNT | ที่ convert แล้ว |
| G | `conversion_rate` | % | % conversion |
| H | `action_items_created` | COUNT | Tasks สร้าง |
| I | `action_items_completed` | COUNT | Tasks เสร็จ |
| J | `completion_rate` | % | % completion |
| K | `key_insights` | Text | Insights สำคัญ |

---

## 🔧 Daily Summary Process

### Step 1: Export LINE Chats (18:00)

**How to Export:**

**Option A: Manual Export (LINE Desktop)**
```
1. เปิด LINE Desktop
2. เลือกกลุ่มที่ต้องการ export
3. คลิกที่ Menu (☰) → Settings → Export chat history
4. เลือกรูปแบบ: Text file
5. บันทึกเป็น: YYYY-MM-DD_GROUP_NAME_Export.txt
6. Save to: 03_LINE_CONVERSATIONS/2026/MM_MONTH/CHAT_EXPORTS/
```

**Option B: Screenshot Important Parts**
```
1. เลื่อนดูข้อความทั้งหมดวันนี้
2. Screenshot sections สำคัญ
3. บันทึกเป็น: YYYY-MM-DD_GROUP_NAME_01.jpg
4. รวม screenshots ใน folder เดียวกัน
```

**LINE Groups to Monitor:**

| Group Name | Purpose | Priority | Export Time |
|------------|---------|----------|-------------|
| AMP Buyers Group | Potential buyers community | High | Daily 18:00 |
| AMP Investors Club | Investment focused | High | Daily 18:00 |
| Pattaya Expats | General expat community | Medium | Daily 18:00 |
| AMP Owners Group | Current clients | Medium | 2x/week |
| AMP VIP Clients | High-value clients | High | Daily 18:00 |

### Step 2: Review & Categorize (18:10)

**Read Through Messages and Tag:**

**🔥 Hot Lead Indicators:**
- "I'm looking to buy..."
- "What's the price of..."
- "Can I view this property?"
- "I'm interested in..."
- "My budget is..."
- "I need to move by..."
- Shares budget/timeline info
- Asks specific property questions
- Mentions urgency

**❓ Questions to Answer:**
- Questions without replies
- Incomplete information
- Pricing inquiries
- Area/location questions
- Legal/process questions

**✅ Action Items:**
- Someone asks for info → Send info
- Viewing request → Schedule viewing
- Price question → Send price list
- Document request → Prepare documents

**💡 Key Topics:**
- New project discussions
- Market conditions
- Area recommendations
- Price comparisons
- Success stories

### Step 3: Identify Hot Leads (18:30)

**For Each Hot Lead Found:**

1. **Create Entry in HOT_LEADS_DETAIL:**
```
date_identified:     2026-01-15
lead_name:          John (johnline123)
line_id:            johnline123
group_name:         AMP Buyers Group
interest_signals:   "Looking for 2BR condo in Jomtien, budget 4-5M"
messages_summary:   Asked about The Base, interested in sea view, 
                    moving in March, first time buyer
property_interest:  Condo, 2BR, Jomtien, Sea View
urgency_level:      High (Moving in March = 2 months)
action_taken:       DM Sent
assigned_to:        Nat
followup_date:      2026-01-16
status:             New
```

2. **Send Private DM (Within 1 hour):**
```
สวัสดีครับคุณ [LEAD_NAME] 

เห็นว่าสนใจ[PROPERTY_INTEREST]นะครับ 
ผมชื่อ [SALES_NAME] จาก AMP Property 

ผมมี properties ที่ตรงกับที่คุณหาอยู่ครับ
สะดวกให้โทรคุยรายละเอียดไหมครับ?

LINE: [LINE_ID]
Phone: [PHONE]
```

3. **Add to Lead Tracking Sheet:**
```
- Create new lead in LEAD_TRACKING
- Reference: From LINE Group - AMP Buyers
- All details from HOT_LEADS_DETAIL
```

### Step 4: Create Action Items (18:45)

**For Each Action Needed:**

```
date_created:    2026-01-15
group_name:      AMP Buyers Group
action_type:     Answer Question
description:     Anna asked about foreign quota at The Base
priority:        Medium
assigned_to:     Nat
due_date:        2026-01-16
status:          Pending
```

**Priority Guidelines:**
- **High:** Hot lead follow-up, urgent questions
- **Medium:** General inquiries, info requests
- **Low:** General discussion follow-ups

### Step 5: Update Tracking Sheet (18:50)

**Fill DAILY_SUMMARY:**

```
summary_date:        2026-01-15
group_name:          AMP Buyers Group
total_messages:      127
active_members:      23
hot_leads_count:     3
hot_leads_names:     John, Anna, Peter
questions_count:     2
action_items_count:  5
key_topics:          The Base project, Jomtien prices, Foreign ownership
sentiment:           Positive
summary_by:          Nat
notes:               Very active day, several serious buyers
```

### Step 6: Share to Team (19:00)

**Create Daily Summary Message:**

```
📊 LINE Summary: 2026-01-15

🔥 HOT LEADS (3):
1. John - 2BR Condo Jomtien, 4-5M (Assigned: Nat)
2. Anna - Studio Pattaya City, 3M (Assigned: Som)
3. Peter - Villa Na Jomtien, 10-15M (Assigned: John)

❓ QUESTIONS TO ANSWER (2):
1. Foreign quota availability at The Base
2. Financing options for expats

✅ ACTION ITEMS (5):
1. [High] Follow up John - due today 19:00 (Nat)
2. [High] Send Anna price list - due tomorrow (Som)
3. [Medium] Prepare documents for Peter - due tomorrow (John)
4. [Low] Share market report to group - due this week (Marketing)
5. [Low] Update FAQ about financing - due this week (Admin)

💡 KEY INSIGHTS:
- High interest in Jomtien area
- Many questions about foreign ownership
- Budget range mostly 3-5M

🔗 Full Summary: [Link to Google Doc]

---
Summary by: Nat | Time: 19:00
```

**Share to:**
- Slack: #amp-daily-summary
- LINE: AMP Team Group
- Email: team@amp-property.com (for management)

---

## 📱 Tools & Templates

### Google Doc Template: Daily Detail Summary

```markdown
# LINE Summary: [Group Name] - [Date]

## 📈 Stats
- Total Messages: [X]
- Active Members: [X]
- Hot Leads Found: [X]
- Questions: [X]
- Action Items: [X]

## 🔥 Hot Leads Detail

### 1. [Name/Nickname]
**Interest:** [What they want]
**Budget:** [Budget range]
**Urgency:** [Timeline]
**Messages:**
> [Quote relevant messages]

**Action:** [What we did]
**Assigned to:** [Sales person]

### 2. [Next lead]...

## 💬 Key Conversations

### Topic 1: [Topic Name]
**Participants:** [Names]
**Summary:** [What was discussed]
**Takeaway:** [Key points]

### Topic 2: [Next topic]...

## ❓ Questions & Answers

### Q1: [Question]
**Asked by:** [Name]
**Answer:** [Our answer if provided]
**Status:** Answered / Pending
**Action:** [Follow-up needed]

## ✅ Action Items

1. **[Priority] [Task]**
   - Assigned: [Name]
   - Due: [Date]
   - Status: [Status]

## 💡 Insights & Observations

- [Key insight 1]
- [Key insight 2]
- [Trend noticed]

## 🎯 Follow-up Plan

Tomorrow:
- [ ] [Action 1]
- [ ] [Action 2]

This Week:
- [ ] [Action 1]
- [ ] [Action 2]

---
Summarized by: [Name]
Date: [Date] [Time]
```

### Slack Summary Template

```
📊 *LINE SUMMARY* 📊
Group: [Group Name]
Date: [Date]

🔥 *HOT LEADS:* [X]
[Name 1] - [Interest] → @[assigned-sales]
[Name 2] - [Interest] → @[assigned-sales]

❓ *QUESTIONS:* [X]
✅ *ACTIONS:* [X]

💡 *KEY INSIGHT:*
[Main takeaway from today]

🔗 Details: [Link]
```

---

## 📊 Weekly Summary Process

### Every Friday 17:00

**Generate WEEKLY_SUMMARY:**

1. **Calculate Stats:**
```
Week: Jan 13-19, 2026
Total Messages: 634
Avg Messages/Day: 91
Hot Leads Found: 12
Leads Converted: 3
Conversion Rate: 25%
Action Items Created: 28
Action Items Completed: 24
Completion Rate: 86%
```

2. **Analyze Trends:**
```
Top Topics:
1. New projects (mentioned 45 times)
2. Jomtien area (mentioned 38 times)
3. Prices (mentioned 52 times)

Most Active Days:
1. Wednesday (142 messages)
2. Tuesday (128 messages)
3. Monday (115 messages)

Sentiment: 80% Positive, 15% Neutral, 5% Negative
```

3. **Key Insights:**
```
- Increased interest in Jomtien vs Pattaya City
- More questions about foreign ownership
- Budget range shifting up (avg 5M vs 4M last week)
- Response time improved: 3min avg (was 8min)
```

4. **Recommendations:**
```
- Focus marketing on Jomtien properties
- Create FAQ about foreign ownership
- Prepare more mid-range (4-6M) options
- Continue quick response strategy
```

5. **Share Weekly Report:**
- Email to Management
- Present in Monday team meeting
- Post summary in Slack

---

## 📈 Monthly Summary

### First Monday of Each Month

**MONTHLY_REPORT Contents:**

```markdown
# LINE Summary Monthly Report: [Month Year]

## Executive Summary
- Total Groups Monitored: [X]
- Total Messages: [X]
- Hot Leads Identified: [X]
- Leads Converted: [X]
- Conversion Rate: [X]%
- Revenue Generated: [X] THB

## Performance by Group

| Group | Messages | Hot Leads | Converted | Conv % |
|-------|----------|-----------|-----------|--------|
| Buyers | 2,450 | 42 | 8 | 19% |
| Investors | 1,823 | 28 | 6 | 21% |
| Expats | 3,156 | 15 | 2 | 13% |

## Trends Analysis

### Topics
[Chart: Topic frequency over time]

### Lead Quality
[Chart: Hot vs Warm vs Cold leads]

### Response Time
[Chart: Avg response time by week]

## Success Stories

### Case 1: [Lead Name]
- Found: [Date]
- Group: [Group Name]
- Initial Interest: [What they wanted]
- Journey: [How we helped]
- Result: Closed ฿X deal in Y days

## Challenges & Solutions

### Challenge 1: [Issue]
- Impact: [What happened]
- Solution: [What we did]
- Result: [Outcome]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Next Month Focus

- [Goal 1]
- [Goal 2]
- [Goal 3]
```

---

## 🎯 Best Practices

### Do's ✅

- ✅ Export chats EVERY day without fail
- ✅ Read ALL messages, don't skim
- ✅ Respond to hot leads within 1 hour
- ✅ Document everything in sheets
- ✅ Follow up on action items
- ✅ Share insights with team
- ✅ Update lead status regularly

### Don'ts ❌

- ❌ Skip days (you'll miss hot leads)
- ❌ Only read @mentions
- ❌ Delay hot lead follow-ups
- ❌ Forget to assign action items
- ❌ Keep insights to yourself
- ❌ Let questions go unanswered
- ❌ Ignore sentiment changes

### Tips for Efficiency

**1. Use Keywords Search:**
```
- Search: "buy", "looking", "budget", "interested"
- Quickly find potential leads
- Don't miss buried opportunities
```

**2. Create Templates:**
```
- DM templates for common scenarios
- Copy-paste for speed
- Personalize key details
```

**3. Set Daily Reminder:**
```
- Calendar: "LINE Summary" at 18:00
- Never forget
- Build the habit
```

**4. Batch Similar Tasks:**
```
- Export all groups at once
- Review all hot leads together
- Send all DMs in one session
```

---

## 🚨 Alert Triggers

### Immediate Action Required

**Hot Lead Alert:**
```
Trigger: Someone mentions budget > 5M
Action: DM within 15 minutes
Notify: Assigned sales + manager
```

**Urgent Question:**
```
Trigger: "urgent", "ASAP", "today"
Action: Answer within 30 minutes
Escalate if can't answer
```

**Negative Sentiment:**
```
Trigger: Complaints, negative feedback
Action: Address immediately
Loop in customer service
Document for improvement
```

---

## 📞 Support

### Questions?
- Slack: #amp-line-support
- Training: See LINE Management SOP
- Technical Issues: @admin

### Feedback
- What's working well?
- What can improve?
- Feature requests?
→ Share in #amp-feedback

---

## 📚 Appendix

### LINE Group Etiquette

**Do:**
- Be helpful and responsive
- Share valuable content
- Welcome new members
- Thank people for participation

**Don't:**
- Spam promotional messages
- Ignore questions
- Be pushy sales
- Share confidential info

### Common LINE Abbreviations

```
5555 = Laughing (Thai: ฮ่าๆๆๆ)
krub/ka = Polite particles (Thai)
naka = na ka (Thai feminine polite)
pls = please
thx/tx = thanks
asap = as soon as possible
```

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Operations Team
