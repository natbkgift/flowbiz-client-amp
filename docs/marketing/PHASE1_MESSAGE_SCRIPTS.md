# Phase 1 Message Scripts (Call-by-Request Policy)

Last updated: 2026-03-06

## 1) Greeting Script

Use this for first reply:

```
Thanks for reaching out.
I can help you in chat first and map clear next steps.
If you prefer a call later, just type CALL and your preferred time.
To start, tell me which fits you best:
1) Buy/Rent/Invest
2) Owner wanting to sell or rent out
3) Developer partnership/project listing
```

## 1.1) Thai Greeting (TH)

```
ขอบคุณที่ทักเข้ามาครับ/ค่ะ
ผม/ทีมสามารถช่วยผ่านแชตก่อนได้เลย และสรุปขั้นตอนที่เหมาะกับคุณให้ชัดเจน
ถ้าต้องการคุยโทรศัพท์ภายหลัง พิมพ์คำว่า CALL พร้อมเวลาที่สะดวกได้เลย
เริ่มต้นช่วยเลือกแบบที่ตรงคุณที่สุด:
1) ซื้อ/เช่า/ลงทุน
2) เจ้าของทรัพย์ต้องการขายหรือปล่อยเช่า
3) ผู้พัฒนาโครงการต้องการพาร์ตเนอร์
```

## 1.2) English Greeting (EN)

```
Thanks for reaching out.
We can support you in chat first and map the clearest next step.
If you prefer a call later, type CALL with your preferred time.
To start, pick what fits you best:
1) Buy/Rent/Invest
2) Owner wanting to sell or rent out
3) Developer partnership/project onboarding
```

Language rule:
- If user starts in Thai, keep TH.
- If user starts in English, keep EN.
- If mixed/unclear, ask: "Would you like Thai or English?"

Purpose:
- Set text-first expectation.
- Keep call optional and user-initiated.

## 2) Qualification Flow

Question 1:
- "Which intent fits you best right now: buy, rent, invest, sell, or partner?"

Question 2:
- "What budget range should we target?"

Question 3:
- "What timeline do you have in mind?"

Question 4:
- "Any must-have constraints (location, unit type, legal, cashflow target)?"

## 2.1) Buyer/Renter/Investor Branch

Ask:
- "Are you looking for new project inventory, resale, or both?"
- "Preferred area in Pattaya?"
- "Budget and timeline?"

Reply template:

```
Thanks, that helps.
I can send a focused shortlist from new projects and managed owner inventory.
Do you want 3 quick options now or a full comparison set?
```

## 2.2) Owner Branch (Sell/Rent Management)

Ask:
- "Is this for sale, rent, or both?"
- "Property type and area?"
- "Expected price or rental range?"
- "Target timeline?"

Reply template:

```
Understood.
We can review your property fit, pricing position, and launch plan in chat first.
If aligned, we will propose next onboarding steps and required documents.
```

## 2.3) Developer Branch (Partnership/Project Onboarding)

Ask:
- "Project type (condo/villa/mixed)?"
- "Launch stage and expected inventory volume?"
- "Do you already have official pricing and sales kit ready?"

Reply template:

```
Great.
Please share your project brief, available inventory, and sales kit status.
Our team can map the go-to-market flow and lead handling model in chat first.
```

## 2.4) Undecided Branch (Not Sure Yet)

Ask:
- "Are you deciding between investment, living, or holiday use?"
- "Preferred budget range?"
- "Do you want options ready now, or planning for later?"

Reply template:

```
No problem.
Many clients start from this stage.
I will send a short decision map first, then 2-3 best-fit options so you can choose direction with less risk.
```

## 3) Offer Response Script

After qualification:

```
Great, thanks.
Based on your goal, I can send a focused shortlist and next-step plan in this chat.
Do you want the quick version (3 options) or full version (5-7 options with notes)?
```

## 4) Call Request Handling (Only if User Asks)

When the user explicitly asks for a call:

```
Perfect, happy to call.
Please share your preferred date/time and phone number.
I will confirm the slot and send a short agenda first.
```

CRM tagging rule:
- Set `call_requested=yes` only when user explicitly asks.
- If user does not ask for call, continue text-first flow.

## 5) Objection Handling Snippets

Price concern:

```
Understood.
Before price comparison, I suggest we align on must-haves and timeline.
That usually removes 30-50% of options fast.
```

Trust concern:

```
Good question.
We can start with a no-pressure chat and a clear options list.
No commitment required.
```

Time concern:

```
No problem.
Share your intent and budget in one message, and I will send a concise shortlist.
```

Owner concern (service quality):

```
Fair point.
We can start with a transparent process in chat: qualification, pricing approach, and reporting rhythm.
No commitment until the scope is clear.
```

Developer concern (lead quality):

```
Understood.
We focus on qualified conversations and clear tagging so your team sees lead quality, not only volume.
I can share the lead-handling framework in chat.
```

## 6) Follow-Up Cadence (If User Goes Silent)

24 hours:
- "Checking in. Want me to send the shortlist in compact format?"

72 hours:
- "I can tailor options by timeline if that helps. Reply with 0-3m, 3-6m, or 6m+."

7 days:
- "I will close this thread for now to avoid spam. Message anytime when ready."

Rule:
- Maximum 3 follow-ups.
- Stop follow-up immediately if user asks not to continue.

## 7) Mandatory CRM Tagging at Conversation Start

Required tags:
- `locale` (`th`, `en`)
- `lead_type` (`buyer`, `renter`, `investor`, `owner`, `developer`, `undecided`)
- `offer_family` (`new_project`, `resale`, `rental`, `owner_service`, `developer_partnership`, `discovery`)
- `intent` (`buy`, `rent`, `invest`, `sell`, `partner`, `general`)
- `call_requested` (`yes` only on explicit user request)

Quality rule:
- Do not mark `qualified` unless budget/timeline + intent are captured.
