"""Deeper audit: DOM nodes, opportunities, render-blocking, image info."""
import json
import pathlib

root = pathlib.Path(__file__).parent.parent
fname = "amppattaya-home-prod-lh-phase5.json"
d = json.loads((root / fname).read_text(encoding="utf-8-sig"))
audits = d["audits"]

# DOM size
dom = audits.get("dom-size", {})
items = dom.get("details", {}).get("items", [])
print("=== DOM Size ===")
for item in items[:5]:
    print(f"  {item}")

print()
print("=== Opportunities (score < 0.9) ===")
for k, v in sorted(audits.items()):
    score = v.get("score")
    if score is not None and score < 0.9:
        details = v.get("details", {})
        savings_ms = details.get("overallSavingsMs", 0) or 0
        savings_kb = details.get("overallSavingsBytes", 0) or 0
        display = v.get("displayValue", "")
        kb = round(savings_kb / 1024)
        print(f"  [{round(score*100):3d}] {k}: {display}  (ms={savings_ms}, kb={kb})")

print()
print("=== Render-blocking resources ===")
rb = audits.get("render-blocking-resources", {})
rb_items = rb.get("details", {}).get("items", [])
for item in rb_items:
    print(f"  url={item.get('url', '')[:80]}  wastedMs={item.get('wastedMs')}")

print()
print("=== LCP element ===")
lcp_el = audits.get("largest-contentful-paint-element", {})
for item in lcp_el.get("details", {}).get("items", []):
    for sub in item.get("items", [item]):
        print(f"  {sub}")

print()
print("=== Unused JS ===")
uj = audits.get("unused-javascript", {})
for item in (uj.get("details", {}).get("items", []) or [])[:8]:
    url = item.get("url", "")[:70]
    w = item.get("wastedBytes", 0) or 0
    print(f"  {url}  wasted={round(w/1024)}KB")

print()
print("=== Unused CSS ===")
uc = audits.get("unused-css-rules", {})
for item in (uc.get("details", {}).get("items", []) or [])[:5]:
    url = item.get("url", "")[:70]
    w = item.get("wastedBytes", 0) or 0
    print(f"  {url}  wasted={round(w/1024)}KB")
