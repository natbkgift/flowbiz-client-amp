# 03_Rental

> 📁 Long-term and short-term rental properties

## Overview

This folder manages all rental property listings including both long-term leases and short-term vacation rentals.

## Main Files

**Rental_Master_List.xlsx** (Create this file)
- Central database of all rental properties
- Include: Property ID, Location, Type, Monthly/Daily Rate, Availability, Owner Contact
- Mark availability clearly

## Structure

**Long_Term/** (12+ months leases)
- Create folder per property: [Property_ID]/
  - Photos/ (current condition)
  - Contracts/ (lease agreements)
  - Tenant_Info/ (tenant documents, ID copies)

**Short_Term/** (Daily/weekly/monthly under 12 months)
- Same structure as Long_Term
- Include booking calendar if applicable

**_Archive/**
- Expired contracts
- Properties no longer available for rent

## Property ID Format

**Long-term:** `LT-[YYYY]-[Number]` (e.g., LT-2026-001)
**Short-term:** `ST-[YYYY]-[Number]` (e.g., ST-2026-001)

## Workflow

### Long-Term Rental
1. Add to Rental_Master_List.xlsx
2. Create property folder
3. Upload photos and details
4. When tenant found → Upload contract and tenant info
5. Update availability status

### Short-Term Rental
1. Add to Rental_Master_List.xlsx
2. Create property folder
3. Upload photos
4. Maintain booking calendar
5. Update availability regularly

## Tips

- Keep tenant info confidential
- Update availability immediately
- Store signed contracts securely
- Regular property inspections
- Maintain good owner relationships
