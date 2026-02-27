# Integrations Setup Guide

This directory contains documentation for AMP's external integrations.

## Lead Integration System (Make.com)

The core of AMP's automation runs on [Make.com](https://www.make.com).
Refer to [MAKE_SCENARIOS.md](MAKE_SCENARIOS.md) for detailed scenario blueprints.

### Setup Checklist

Use this checklist to track your implementation of the Make.com scenarios.

#### 1. Foundation
- [ ] Create Make.com account
- [ ] Connect WhatsApp Business API (or device)
- [ ] Connect Facebook Pages
- [ ] Connect Google Sheets (authorize access to `data/` folders)

#### 2. High Priority Scenarios
- [ ] **Scenario 1: WhatsApp QR Capture**
    - [ ] Webhook created
    - [ ] Text parser configured (`PROP-\d+`)
    - [ ] Google Sheets lookup connected
    - [ ] Auto-reply message active
- [ ] **Scenario 2: Facebook Messenger Bot**
    - [ ] Watch Messages trigger active
    - [ ] Intent router configured (Buy/Rent/Support)
    - [ ] Google Sheets logging active
- [ ] **Scenario 3: Facebook Lead Ads Sync**
    - [ ] Lead Ads form connected
    - [ ] Instant notification to Sales Team (Line/Telegram)
    - [ ] Auto-responder (SMS/WhatsApp) active

#### 3. Medium Priority Scenarios
- [ ] **Scenario 4: Website Form Processor**
    - [ ] Webhook endpoint secure
    - [ ] Spam filter active
- [ ] **Scenario 7: Agent Assignment**
    - [ ] Round-robin logic implemented
    - [ ] Notification set up

### Debugging
- If scenarios fail, check the `error_log` sheet in your Lead Tracking workbook.
- Ensure Google Drive permissions allow Make.com to read/write to the `data/` directory.
