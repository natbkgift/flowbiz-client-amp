# Phase 0 Leads Sheet Spec

เอกสารนี้คือแม่แบบ Google Sheet สำหรับติดตาม Lead, SLA, และ Funnel ตามกติกา Phase 0 แบบ deterministic

---

## Sheet 1: `Leads_Master`

### Column Structure (Exact Order)

| Col | Field Name | Type |
|---|---|---|
| A | Lead ID | Text |
| B | Date | Date |
| C | Time | Time |
| D | Timestamp (Auto) | Formula |
| E | Name | Text |
| F | Country | Text |
| G | Campaign | Dropdown (Buy / Invest / Rent / Brand) |
| H | Source | Dropdown (Google / Organic / Direct / Referral) |
| I | Budget | Number |
| J | Timeline (Months) | Number |
| K | Purpose | Dropdown (Live / Invest / Rent) |
| L | Qualified? | Formula |
| M | First Response Time | DateTime |
| N | SLA (Minutes) | Formula |
| O | SLA Status | Formula |
| P | Viewing Scheduled? | Dropdown (Yes / No) |
| Q | Closed? | Dropdown (Yes / No) |
| R | Revenue (THB) | Number |
| S | Notes | Text |

### Formulas

#### `D2` (Timestamp Combine Date + Time)

```excel
=IF(AND(B2<>"",C2<>""),B2+C2,"")
```

#### `L2` (Qualified Auto-Logic)

```excel
=IF(G2="Buy",
   IF(AND(I2>=2000000,J2<=6,K2<>"Rent"),"Yes","No"),
IF(G2="Invest",
   IF(AND(I2>=3000000,J2<=6),"Yes","No"),
IF(G2="Rent",
   IF(AND(I2>=15000,J2>=3),"Yes","No"),
"No")))
```

#### `N2` (SLA Minutes Calculation)

```excel
=IF(AND(D2<>"",M2<>""),(M2-D2)*1440,"")
```

#### `O2` (SLA Status)

```excel
=IF(N2="","",
IF(N2<=15,"OK",
IF(N2<=30,"Late","Breach")))
```

---

## Sheet 2: `Dashboard`

วาง Metrics ตามนี้ (ตัวอย่างวางที่คอลัมน์ A:B)

| Cell | Metric | Formula |
|---|---|---|
| B2 | Total Leads | `=COUNTA(Leads_Master!A:A)-1` |
| B3 | Qualified Leads | `=COUNTIF(Leads_Master!L:L,"Yes")` |
| B4 | Qualification Rate | `=IF(B2=0,"",B3/B2)` |
| B5 | Viewings | `=COUNTIF(Leads_Master!P:P,"Yes")` |
| B6 | Viewing Rate (from Qualified) | `=IF(B3=0,"",B5/B3)` |
| B7 | Closed Deals | `=COUNTIF(Leads_Master!Q:Q,"Yes")` |
| B8 | Close Rate (from Viewing) | `=IF(B5=0,"",B7/B5)` |
| B9 | Total Revenue | `=SUM(Leads_Master!R:R)` |
| B10 | SLA Breach Count | `=COUNTIF(Leads_Master!O:O,"Breach")` |
| B11 | SLA Compliance % | `=IF(B2=0,"",1-(B10/B2))` |

---

## Sheet 3: `Campaign_Performance`

### Leads by Campaign

```excel
=QUERY(Leads_Master!A:R,
"select G, count(A) 
where G is not null 
group by G 
label count(A) 'Leads'")
```

### Revenue by Campaign

```excel
=QUERY(Leads_Master!A:R,
"select G, sum(R) 
where Q='Yes' 
group by G 
label sum(R) 'Revenue'")
```

---

## Sheet 4: `Campaign_Cost`

ชีตนี้ถูกสร้างอัตโนมัติโดย `setupPhase0LeadTrackingSheets()`

| Col | Field | Type |
|---|---|---|
| A | Campaign | Text (Buy / Invest / Rent / Brand) |
| B | Spend THB | Number (manual input) |
| C | Leads | Formula |
| D | Qualified Leads | Formula |
| E | Revenue | Formula |
| F | Cost per Lead | Formula |
| G | Cost per Qualified | Formula |
| H | ROAS | Formula |

สูตรที่ใช้ในแต่ละแถว:

- Leads = `=COUNTIF(Leads_Master!G:G,A2)`
- Qualified Leads = `=COUNTIFS(Leads_Master!G:G,A2,Leads_Master!L:L,"Yes")`
- Revenue = `=SUMIFS(Leads_Master!R:R,Leads_Master!G:G,A2,Leads_Master!Q:Q,"Yes")`
- Cost per Lead = `=IF(C2=0,"",B2/C2)`
- Cost per Qualified = `=IF(D2=0,"",B2/D2)`
- ROAS = `=IF(B2=0,"",E2/B2)`

---

## Daily Operation Rule

ทุกเช้า:

1. Sort by `SLA Status`
2. ตรวจรายการ `Breach`
3. Follow up leads ที่ยังไม่มีสถานะ
4. อัปเดต `Viewing` / `Close`

ทุกวันศุกร์:

- Review Qualification Rate
- Review Viewing Rate
- Review SLA %
- Review Revenue
