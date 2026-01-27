#!/usr/bin/env python3
"""
Budget Calculator Example Generator
สร้างตัวอย่างการใช้งาน Budget Calculator สำหรับโครงการ The Embassy Life
"""


from openpyxl import load_workbook


def create_example_budget():
    """Create an example budget for The Embassy Life project"""

    # Load the template
    wb = load_workbook("AMP_Budget_Calculator_Template.xlsx")

    # Fill Project Summary
    ws_summary = wb["📋 Project Summary"]
    ws_summary['B5'] = "The Embassy Life Pattaya"
    ws_summary['B6'] = "Nat (AMP Marketing Team)"
    ws_summary['B7'] = "Q1 2026 (Jan-Mar 2026)"
    ws_summary['B8'] = "01/01/2026"
    ws_summary['B9'] = "31/03/2026"
    ws_summary['B10'] = "฿180,000"

    ws_summary['B15'] = 90000  # Ad Spend
    ws_summary['C15'] = "50%"
    ws_summary['B16'] = 45000  # Production
    ws_summary['C16'] = "25%"
    ws_summary['B17'] = 30000  # Tools
    ws_summary['C17'] = "17%"
    ws_summary['B18'] = 15000  # Other
    ws_summary['C18'] = "8%"
    ws_summary['B19'] = 180000  # Total
    ws_summary['C19'] = "100%"

    # Fill Monthly Budget (averaging Q1 budget = 60k/month)
    ws_monthly = wb["💵 Monthly Budget"]

    # Google Ads
    ws_monthly['B6'] = 15000
    ws_monthly['C6'] = "25%"
    ws_monthly['D6'] = 1500
    ws_monthly['E6'] = 400
    ws_monthly['F6'] = 37

    ws_monthly['B7'] = 6000
    ws_monthly['C7'] = "10%"
    ws_monthly['D7'] = 600
    ws_monthly['E7'] = 450
    ws_monthly['F7'] = 13

    ws_monthly['B8'] = 4000
    ws_monthly['C8'] = "7%"
    ws_monthly['D8'] = 400
    ws_monthly['E8'] = 500
    ws_monthly['F8'] = 8

    # Facebook/Instagram
    ws_monthly['B10'] = 18000
    ws_monthly['C10'] = "30%"
    ws_monthly['D10'] = 2000
    ws_monthly['E10'] = 300
    ws_monthly['F10'] = 60

    ws_monthly['B11'] = 8000
    ws_monthly['C11'] = "13%"
    ws_monthly['D11'] = 900
    ws_monthly['E11'] = 350
    ws_monthly['F11'] = 23

    ws_monthly['B12'] = 3000
    ws_monthly['C12'] = "5%"
    ws_monthly['D12'] = 800
    ws_monthly['E12'] = 600
    ws_monthly['F12'] = 5

    # LINE Ads
    ws_monthly['B14'] = 4000
    ws_monthly['C14'] = "7%"
    ws_monthly['D14'] = 400
    ws_monthly['E14'] = 350
    ws_monthly['F14'] = 11

    ws_monthly['B15'] = 2000
    ws_monthly['C15'] = "3%"
    ws_monthly['D15'] = 200
    ws_monthly['E15'] = 400
    ws_monthly['F15'] = 5

    # Total row (adjust based on actual row)
    # Note: You may need to adjust row numbers based on template structure

    # Fill Production & Tools
    ws_prod = wb["🎬 Production & Tools"]
    ws_prod['B5'] = 20000
    ws_prod['B6'] = 15000
    ws_prod['B7'] = 8000
    ws_prod['B8'] = 5000
    ws_prod['B9'] = 8000
    ws_prod['B12'] = 350
    ws_prod['B13'] = 1500
    ws_prod['B14'] = 2000
    ws_prod['B15'] = 0
    ws_prod['B18'] = 10000
    ws_prod['B19'] = 5000

    # Fill Weekly Tracking (Week 1 example)
    ws_weekly = wb["📅 Weekly Tracking"]
    ws_weekly['B4'] = 14250  # Week 1
    ws_weekly['C4'] = 1420
    ws_weekly['D4'] = 1.8
    ws_weekly['E4'] = 38
    ws_weekly['F4'] = 375
    ws_weekly['G4'] = "23.75%"
    ws_weekly['H4'] = "On track"

    # Fill ROI Calculator
    ws_roi = wb["📊 ROI Calculator"]
    ws_roi['B5'] = 180000  # Total Ad Spend
    ws_roi['B6'] = 45000   # Production
    ws_roi['B7'] = 30000   # Management
    ws_roi['B8'] = 255000  # Total Investment

    ws_roi['B12'] = 450     # Total Leads
    ws_roi['B13'] = 270     # Qualified (60%)
    ws_roi['B14'] = 81      # Appointments (30%)
    ws_roi['B15'] = 12      # Sales (15%)
    ws_roi['B16'] = 90000   # Avg Commission (3% of 3M)
    ws_roi['B17'] = 1080000 # Total Revenue (12 x 90k)

    ws_roi['B21'] = 825000  # Net Profit
    ws_roi['B22'] = "323%"  # ROI %
    ws_roi['B23'] = "4.2:1" # ROI Ratio
    ws_roi['B24'] = 3       # Break-even Sales

    # Save example
    filename = "EXAMPLE_Budget_The_Embassy_Life_Q1_2026.xlsx"
    wb.save(filename)
    print(f"✅ Created example: {filename}")
    return filename


if __name__ == "__main__":
    print("🚀 Creating Budget Calculator Example...")
    print("=" * 60)
    print("📊 Project: The Embassy Life Pattaya")
    print("💰 Budget: ฿180,000 (Q1 2026)")
    print("=" * 60)
    filename = create_example_budget()
    print("=" * 60)
    print(f"✅ Success! Example created: {filename}")
    print("\n📝 This example shows:")
    print("  - Luxury condo budget allocation")
    print("  - Focus on Google Search & Facebook Leads")
    print("  - Target CPL: ฿400")
    print("  - Expected: 450 leads, 12 sales")
    print("  - Projected ROI: 323% (4.2:1)")
    print("\n💡 Use this as a reference for your own projects!")
