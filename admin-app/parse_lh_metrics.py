import json
import sys

try:
    filename = sys.argv[1] if len(sys.argv) > 1 else 'lh-report-after.json'
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print("--- NEW METRICS ---")
    
    lcp = data['audits'].get('largest-contentful-paint')
    if lcp:
        print(f"LCP: {lcp.get('displayValue')} Numeric: {lcp.get('numericValue')}")
        
    tbt = data['audits'].get('total-blocking-time')
    if tbt:
        print(f"TBT: {tbt.get('displayValue')} Numeric: {tbt.get('numericValue')}")
        
    cls = data['audits'].get('cumulative-layout-shift')
    if cls:
        print(f"CLS: {cls.get('displayValue')} Numeric: {cls.get('numericValue')}")

    score = data['categories']['performance']['score']
    if score is not None:
        print(f"Performance Score: {int(score * 100)}")

    print("\n--- LCP ELEMENT ---")
    lcp_elem = data['audits'].get('largest-contentful-paint-element')
    if lcp_elem and 'details' in lcp_elem and lcp_elem['details'] and 'items' in lcp_elem['details'] and len(lcp_elem['details']['items']) > 0:
        print(lcp_elem['details']['items'][0]['node']['snippet'])
    else:
        print("No LCP Element Details")
        
except Exception as e:
    print(f"Error parsing JSON: {e}")
