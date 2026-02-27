# 04_Leads_CRM

> 📁 Lead tracking and customer relationship management

## Overview

This folder is the heart of your sales pipeline. All potential customers (leads) are tracked and managed here.

## Main Files

**Lead_Tracking.xlsx** (Create this file)
- Master database of all leads
- Columns: Lead ID, Name, Contact, Source, Property Interest, Status, Follow-up Date
- Update daily

**Follow_Up_Log.xlsx** (Create this file)
- Record all communications with leads
- Track what was discussed, next steps
- Never miss a follow-up

## Structure

**Lead_Details/**
- Create folder for each serious lead: [Lead_ID]/
  - Lead_Profile.docx (requirements, budget, timeline)
  - Communications/ (emails, chat logs)
  - Documents/ (ID copies, financial docs if applicable)

**Converted/**
- Move successful leads here after sale/rental
- Keep for future reference and repeat business

**_Archive/**
- Unqualified leads
- Leads that went cold (no response after multiple attempts)
- Review quarterly

## Lead ID Format

Use format: `LD-[YYYY]-[Number]`

Examples:
- LD-2026-001
- LD-2026-002

## Lead Status

Use these statuses in Lead_Tracking.xlsx:
- **New** - Just received
- **Contacted** - First contact made
- **Qualified** - Budget and timeline confirmed
- **Viewing** - Property viewing scheduled/completed
- **Negotiating** - Discussing terms
- **Converted** - Sale/rental completed ✅
- **Lost** - Didn't convert
- **Unqualified** - Not a good fit

## Workflow

1. New lead comes in → Add to Lead_Tracking.xlsx
2. Make first contact within 24 hours
3. Qualify the lead (budget, timeline, requirements)
4. If qualified → Create folder in Lead_Details/
5. Schedule property viewing
6. Follow up consistently (log in Follow_Up_Log.xlsx)
7. When converted → Move to Converted/ folder
8. If lost → Update reason, move to _Archive/

## Tips

- **Response time is critical** - Contact new leads within 1 hour if possible
- **Follow up consistently** - Set reminders
- **Keep detailed notes** - You'll have many leads
- **Be honest** - If property doesn't fit, say so
- **Build relationships** - Today's "no" may be tomorrow's "yes"

## Related Documents

- Lead Tracking Template
- Lead Handling SOP
