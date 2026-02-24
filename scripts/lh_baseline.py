"""Print key Lighthouse metrics from all JSON reports in the project root."""
import json
import pathlib

root = pathlib.Path(__file__).parent.parent

files = [
    "amppattaya-home-lh.json",
    "amppattaya-home-prod-lh.json",
    "amppattaya-home-prod-lh-phase5.json",
    "amppattaya-projects-lh.json",
    "amppattaya-detail-lh.json",
]

for fname in files:
    p = root / fname
    if not p.exists():
        print(f"SKIP {fname} (not found)")
        continue
    try:
        d = json.loads(p.read_text(encoding="utf-8-sig"))
        cats = d.get("categories", {})
        audits = d.get("audits", {})
        cfg = d.get("configSettings", {})
        perf = cats.get("performance", {}).get("score", 0) or 0
        lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "?")
        cls_ = audits.get("cumulative-layout-shift", {}).get("displayValue", "?")
        tbt = audits.get("total-blocking-time", {}).get("displayValue", "?")
        tti = audits.get("interactive", {}).get("displayValue", "?")
        total_bytes = audits.get("total-byte-weight", {}).get("numericValue", 0) or 0
        dom = audits.get("dom-size", {}).get("numericValue", "?")
        print(f"=== {fname} ===")
        print(f"  formFactor    : {cfg.get('formFactor', '?')}")
        print(f"  performance   : {round(perf * 100)}")
        print(f"  LCP           : {lcp}")
        print(f"  CLS           : {cls_}")
        print(f"  TBT           : {tbt}")
        print(f"  TTI           : {tti}")
        print(f"  Total KB      : {round(total_bytes / 1024)}")
        print(f"  DOM nodes     : {dom}")
        print()
    except Exception as exc:
        print(f"ERROR {fname}: {exc}")
        raise
