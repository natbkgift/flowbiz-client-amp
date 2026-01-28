# 09_Finance

> 📁 Financial tracking, invoices, and commission management

## Overview

⚠️ **SENSITIVE: This folder contains financial information. Restricted access only.**

Track all financial activities including commissions, expenses, invoices, and receipts.

## Main Files

**Required Files** (Create these in Excel):

**Commission_Tracking.xlsx**
- Track all sales and rental commissions
- Columns: Date, Property ID, Client, Sale/Rental Amount, Commission %, Commission Amount, Payment Date, Status
- Update immediately after each transaction

**Expense_Report.xlsx**
- Track all business expenses
- Columns: Date, Category, Description, Amount, Receipt #, Payment Method, Status
- Monthly reconciliation

## Structure

### Invoices/
Organize by year: [YYYY]/

**File naming:**
`Invoice_[Number]_[Client]_[Date].pdf`

Examples:
- Invoice_2026-001_ABC_Company_2026-01-15.pdf
- Invoice_2026-002_John_Smith_2026-01-20.pdf

Keep both:
- Issued invoices (sent to clients)
- Received invoices (from vendors)

### Receipts/
Organize by year: [YYYY]/

**Organize by month:** [YYYY-MM]/

**File naming:**
`Receipt_[Vendor]_[Amount]_[Date].pdf`

Examples:
- Receipt_Marketing_Agency_15000_2026-01-10.pdf
- Receipt_Office_Supplies_2500_2026-01-15.pdf

## Workflow

### Commission Tracking

1. **Deal closes** → Add to Commission_Tracking.xlsx
2. **Calculate commission** (typically 3-5% for sales, varies for rentals)
3. **Issue invoice** to client/developer
4. **Track payment** → Update "Payment Date" and "Status"
5. **File invoice** in Invoices/[Year]/

### Expense Management

1. **Make purchase** → Keep receipt
2. **Scan/photo receipt** immediately
3. **Add to Expense_Report.xlsx**
4. **File receipt** in Receipts/[Year]/[Month]/
5. **Monthly review** for tax deductions

## Commission Rates

Typical rates (verify with contracts):

**Sales:**
- New projects: 3-5%
- Resale: 3%
- Land: 3-5%

**Rentals:**
- Long-term: 1 month rent (or 8-10%)
- Short-term: 10-15%

## Expense Categories

Track expenses by category:
- Marketing & Advertising
- Office Supplies
- Transportation
- Communication (Phone, Internet)
- Professional Services
- Property Inspection Costs
- Training & Development
- Client Entertainment
- Others

## Monthly Tasks

- [ ] Reconcile Commission_Tracking.xlsx
- [ ] Review Expense_Report.xlsx
- [ ] File all receipts properly
- [ ] Issue pending invoices
- [ ] Follow up on unpaid invoices
- [ ] Calculate tax obligations

## Annual Tasks

- [ ] Year-end financial summary (December)
- [ ] Prepare tax documents (January)
- [ ] Archive previous year files
- [ ] Review commission rates
- [ ] Update expense budget

## Security & Backup

⚠️ **CRITICAL:**
- Limit access to authorized personnel only
- Backup weekly (in addition to automatic Google Drive)
- Keep sensitive info confidential
- Password protect if required
- Regular access audit

## Tax Preparation

Documents needed for accountant:
- Commission_Tracking.xlsx (full year)
- Expense_Report.xlsx (full year)
- All invoices (issued and received)
- All receipts
- Bank statements (if applicable)

## Tips

- **Document everything** - If there's no receipt, it didn't happen (for taxes)
- **Track immediately** - Don't wait until month end
- **Separate personal and business** - Never mix expenses
- **Follow up on payments** - Don't be shy about collecting
- **Keep organized** - Good records = easier tax time
- **Review monthly** - Catch errors early

## Quick Reference

| Need | Location |
|------|----------|
| Track new commission | Commission_Tracking.xlsx |
| Log business expense | Expense_Report.xlsx |
| Find invoice | Invoices/[Year]/ |
| Find receipt | Receipts/[Year]/[Month]/ |

## Related Documents

- Commission Agreement Template
- Invoice Template
- Expense Policy
- Tax Guidelines
