from __future__ import annotations

import json
import re
from decimal import Decimal, InvalidOperation
from html import escape
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlencode, urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from apps.api.routes.home_composer_contract import normalize_home_config, resolve_home_runtime
from packages.core.database import get_db
from packages.core.media_path_policy import DEFAULT_LOCAL_MEDIA_FALLBACK
from packages.core.models import (
    Area,
    AreaStatistic,
    Article,
    CompanyInfo,
    Developer,
    HomeComposerConfig,
    MediaAsset,
    Project,
    Property,
    TeamMember,
    Testimonial,
    User,
)
from packages.core.seo_controls import apply_runtime_seo

router = APIRouter(tags=["home-runtime"])

_INTERNAL_MEDIA_HOSTS = {"localhost", "127.0.0.1", "flowbiz.com", "www.flowbiz.com"}
_ALLOWED_RUNTIME_PATHS = {"/", "/en", "/th"}
_PUBLIC_ROUTE_SUFFIXES = {
    "",
    "/invest",
    "/buy",
    "/rent",
    "/sell",
    "/sell/list-property",
    "/sell/valuation",
    "/investment",
    "/marketplace",
    "/projects",
    "/developers",
    "/smart-finder",
    "/compare",
    "/blog",
    "/guides",
    "/invest/guides",
    "/area-guide",
    "/areas",
    "/insights",
    "/about",
    "/how-we-work",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/investment/methodology",
    "/foreign-buyer-hub",
    "/market-intelligence",
}
_DEFAULT_MEDIA_FALLBACK = DEFAULT_LOCAL_MEDIA_FALLBACK
_MEDIA_ROOTS = [
    Path("storage/media"),
    Path("admin-app/public/media"),
]
_SITE_LAYOUT_CMS_SLUG = "site-layout"
_DEFAULT_CONTACT_EMAIL = ""
_DEFAULT_FACEBOOK_URL = "https://facebook.com/flowbiz"
_DEFAULT_FACEBOOK_LABEL = "facebook.com/flowbiz"


def _media_file_exists(value: str) -> bool:
    if not value.startswith("/media/"):
        return False
    relative = value.removeprefix("/media/")
    return any((root / relative).exists() for root in _MEDIA_ROOTS)


def _is_allowed_media_url(value: str | None, *, request: Request) -> bool:
    raw = str(value or "").strip()
    if not raw:
        return False
    if raw.startswith("data:"):
        return True
    if raw.startswith("/"):
        return not raw.startswith("//")
    try:
        parsed = urlparse(raw)
        if parsed.scheme not in {"http", "https"}:
            return False
        hostname = (parsed.hostname or "").lower()
        allowed = set(_INTERNAL_MEDIA_HOSTS)
        if request.url.hostname:
            allowed.add(request.url.hostname.lower())
        return hostname in allowed
    except ValueError:
        return False


def _safe_media_url(value: str | None, fallback: str, *, request: Request) -> str:
    raw = str(value or "").strip()
    if _is_allowed_media_url(raw, request=request):
        if raw.startswith("/media/") and not _media_file_exists(raw):
            return fallback
        return raw
    return fallback


_TODO_TEXT_PATTERN = re.compile(r"\s*TODO:\s*[^<\n]+", flags=re.IGNORECASE)
_IMG_TAG_PATTERN = re.compile(r"<img\b(?P<attrs>[^>]*?)>", flags=re.IGNORECASE)
_ALT_ATTR_PATTERN = re.compile(r"\balt\s*=\s*(['\"])(?P<value>.*?)\1", flags=re.IGNORECASE)
_WIDTH_ATTR_PATTERN = re.compile(r"\bwidth\s*=\s*(['\"]).*?\1", flags=re.IGNORECASE)
_HEIGHT_ATTR_PATTERN = re.compile(r"\bheight\s*=\s*(['\"]).*?\1", flags=re.IGNORECASE)
_PUBLIC_COPY_REPLACEMENTS = {
    "en": (
        (
            "More verified projects are being added in the system.",
            "A wider set of verified projects is available through the advisory desk.",
        ),
        (
            "Project facts are being prepared.",
            "A concise project brief is available through the advisory desk.",
        ),
        (
            "Comparable investment data is not published yet.",
            "Comparable investment context is available through the advisory desk.",
        ),
        (
            "Methodology details are not published yet.",
            "Methodology detail is available on request.",
        ),
        (
            "There is not enough published inventory yet to summarize this section.",
            "A curated market summary is shared directly through the advisory desk.",
        ),
        (
            "Trust and process details will appear after editorial review.",
            "Trust and process detail is shared directly with every shortlist.",
        ),
        (
            "Team profile content is not published yet.",
            "Team introductions are shared directly during consultation.",
        ),
        (
            "Process content is not published yet.",
            "Process detail is shared directly during consultation.",
        ),
        (
            "Fresh guides and practical notes are being reviewed for publication.",
            "Fresh guides and practical notes are shared directly through the advisory desk.",
        ),
        (
            "Verified review content is not published in this runtime yet.",
            "Selected review context is shared directly during consultation.",
        ),
        (
            "Local video thumbnails and posters are being prepared.",
            "Selected video context is shared directly during consultation.",
        ),
        ("Legal page content is not published yet.", "Legal details are available on request."),
        ("Pricing pending publication", "Price on request"),
        ("Area pending publication", "Pattaya area context"),
        ("Developer pending publication", "Developer context available on request"),
        ("Summary pending publication.", "A concise brief is available on request."),
        (
            "Map data is pending publication. Browse published area context for this project.",
            "Map context is shared directly with the project brief.",
        ),
        (
            "Investment snapshot is pending publication with verified source and update timestamp.",
            "Investment context is shared with verified sourcing during consultation.",
        ),
        (
            "Property details pending publication.",
            "Verified property details are available through the advisory desk.",
        ),
        ("Stats pending publication", "Additional stats on request"),
        ("View pending publication", "View details on request"),
        ("Location pending publication", "Location context on request"),
        (
            "No published areas are available yet.",
            "Area guidance is shared directly through the advisory desk.",
        ),
        (
            "Area summary pending publication.",
            "Area summary is shared directly through the advisory desk.",
        ),
        (
            "Map coordinates are pending publication.",
            "Map coordinates are shared directly during consultation.",
        ),
        (
            "Area fit context is pending publication.",
            "Area fit context is shared directly during consultation.",
        ),
        ("Property stats pending publication", "Additional property stats on request"),
        (
            "Transport context pending publication.",
            "Transport context is shared directly during consultation.",
        ),
        (
            "Lifestyle context pending publication.",
            "Lifestyle context is shared directly during consultation.",
        ),
        (
            "Beach proximity context pending publication.",
            "Beach proximity context is shared directly during consultation.",
        ),
        (
            "No active developers are published yet.",
            "Developer introductions are shared directly through the advisory desk.",
        ),
        ("Developer profile pending publication.", "Developer profile is available on request."),
        (
            "Published project count is pending data sync.",
            "Published project count is being refreshed from the latest verified records.",
        ),
        ("No published projects linked yet.", "Project shortlist is available on request."),
        (
            "No published projects are linked to this developer yet.",
            "Project shortlist for this developer is available on request.",
        ),
        (
            "Location focus is pending project linkage.",
            "Location focus is refined during the shortlist review.",
        ),
        (
            "Trust proof is not published yet.",
            "Trust proof is shared directly during consultation.",
        ),
        ("Description is pending publication.", "A verified description is available on request."),
        (
            "No approved local media is linked yet.",
            "Selected local media is shared directly during consultation.",
        ),
        ("No published features yet.", "Key features are shared directly in the project brief."),
        (
            "Related properties are pending publication.",
            "Related properties are curated directly through the advisory desk.",
        ),
        ("Update date pending publication", "Updated on request"),
        (
            "Source metadata is pending publication.",
            "Source metadata is shared directly with the advisory brief.",
        ),
        (
            "No contact details provided.",
            "Contact details are coordinated directly through the advisory desk.",
        ),
        ("Author pending publication.", "Editorial attribution is available on request."),
        ("Publish date pending.", "Publish date available on request."),
        ("Update date pending.", "Update date available on request."),
        ("Excerpt pending publication.", "A concise excerpt is available on request."),
        (
            "No published content yet.",
            "Fresh editorial content is shared directly through the advisory desk.",
        ),
        (
            "Article body pending publication.",
            "The full article body is shared directly through the advisory desk.",
        ),
        (
            "Related content is pending publication.",
            "Related reading is shared directly through the advisory desk.",
        ),
        ("Tags pending publication.", "Topic tags are available on request."),
        ("About content is not published yet.", "Company overview is available on request."),
        ("Team profiles are not published yet.", "Team introductions are available on request."),
        (
            "Approved testimonials are not published yet.",
            "Selected client context is shared directly during consultation.",
        ),
        (
            "Proof assets are pending publication.",
            "Trust assets are shared directly during consultation.",
        ),
        ("How-we-work detail is not published yet.", "Process detail is available on request."),
        ("Contact details are not published yet.", "Contact details are available on request."),
        ("Address pending publication.", "Office address available on request."),
        ("Phone pending publication.", "Direct phone line available on request."),
        ("Email pending publication.", "Direct email available on request."),
        ("Office hours pending publication.", "Office hours available on request."),
        ("Contact channels pending publication.", "Contact channels available on request."),
        ("Map pending publication.", "Map link available on request."),
        ("Published process details are pending.", "Process detail is available on request."),
        ("Process details pending publication.", "Process detail is available on request."),
        ("Privacy content is not published yet.", "Privacy details are available on request."),
        ("Terms content is not published yet.", "Terms details are available on request."),
        ("Cookies content is not published yet.", "Cookie details are available on request."),
        (
            "Investment methodology is not published yet.",
            "Investment methodology is available on request.",
        ),
    ),
    "th": (
        (
            "กำลังเพิ่มโครงการที่ตรวจสอบแล้วในระบบอย่างต่อเนื่อง",
            "ทีมที่ปรึกษาพร้อมเปิดโครงการที่ผ่านการคัดกรองเพิ่มเติมให้โดยตรง",
        ),
        ("กำลังจัดเตรียมข้อเท็จจริงของโครงการ", "ทีมพร้อมสรุปข้อมูลโครงการฉบับย่อให้โดยตรง"),
        ("ยังไม่มีข้อมูล comparison ที่พร้อมเผยแพร่", "ทีมพร้อมสรุปบริบทการลงทุนที่เกี่ยวข้องให้โดยตรง"),
        ("รายละเอียด methodology ยังไม่ถูกเผยแพร่", "ทีมพร้อมอธิบาย methodology ให้โดยตรง"),
        ("ยังไม่มีข้อมูล inventory ที่เผยแพร่พอสำหรับสรุป section นี้", "ทีมพร้อมสรุปภาพรวมตลาดที่เกี่ยวข้องให้โดยตรง"),
        (
            "รายละเอียด trust และ process จะถูกเผยแพร่เมื่อทีมตรวจสอบข้อมูลแล้ว",
            "รายละเอียด trust และ process พร้อมอธิบายโดยตรงในทุก shortlist",
        ),
        ("หน้าแนะนำทีมยังไม่ถูกเผยแพร่", "ทีมพร้อมแนะนำตัวและอธิบายบทบาทให้โดยตรง"),
        ("หน้า process ยังไม่ถูกเผยแพร่", "รายละเอียด process พร้อมอธิบายโดยตรงระหว่างการปรึกษา"),
        ("กำลังทบทวนบทความและบันทึกเชิงปฏิบัติสำหรับการเผยแพร่", "ทีมพร้อมแชร์ไกด์และมุมมองล่าสุดให้โดยตรง"),
        ("ยังไม่มีรีวิวที่เผยแพร่ใน runtime นี้", "ทีมพร้อมแชร์บริบทรีวิวที่คัดแล้วให้โดยตรง"),
        ("กำลังเตรียม thumb/poster แบบ local สำหรับวิดีโอ", "ทีมพร้อมแชร์วิดีโอและบริบทที่คัดแล้วให้โดยตรง"),
        ("หน้าเอกสารกฎหมายยังไม่ถูกเผยแพร่", "รายละเอียดกฎหมายพร้อมส่งให้โดยตรง"),
        ("รอเผยแพร่ราคา", "สอบถามราคาได้"),
        ("พื้นที่รอเผยแพร่", "ดูบริบททำเลกับทีมได้"),
        ("ผู้พัฒนารอเผยแพร่", "สอบถามข้อมูลผู้พัฒนาได้"),
        ("รอสรุปเนื้อหาเผยแพร่", "ทีมพร้อมสรุปให้โดยตรง"),
        ("ยังไม่มีข้อมูลแผนที่ที่เผยแพร่ ดูข้อมูลทำเลที่เผยแพร่ได้จากหน้าพื้นที่", "ทีมพร้อมแชร์บริบทแผนที่และทำเลให้โดยตรง"),
        (
            "ยังไม่มี investment snapshot ที่มีแหล่งที่มาและเวลาปรับปรุง",
            "ทีมพร้อมแชร์บริบทการลงทุนพร้อมแหล่งอ้างอิงให้โดยตรง",
        ),
        ("ยังไม่มีพิกัดที่เผยแพร่", "ทีมพร้อมแชร์พิกัดและบริบททำเลให้โดยตรง"),
        ("ยังไม่มีบริบทความเหมาะสมของทำเล", "ทีมพร้อมสรุปความเหมาะสมของทำเลให้โดยตรง"),
        ("ยังไม่มีผู้พัฒนาที่เผยแพร่", "ทีมพร้อมแนะนำผู้พัฒนาที่เกี่ยวข้องให้โดยตรง"),
        ("ยังไม่มีโปรไฟล์ผู้พัฒนาที่เผยแพร่", "โปรไฟล์ผู้พัฒนาพร้อมส่งให้โดยตรง"),
        ("จำนวนโครงการที่เผยแพร่กำลังรอซิงก์ข้อมูล", "จำนวนโครงการกำลังรีเฟรชจากข้อมูลที่ยืนยันล่าสุด"),
        ("ยังไม่มีโครงการที่เผยแพร่เชื่อมอยู่", "ทีมพร้อมจัด shortlist โครงการให้โดยตรง"),
        ("ยังไม่มีโครงการที่เผยแพร่เชื่อมกับผู้พัฒนารายนี้", "ทีมพร้อมจัด shortlist โครงการของผู้พัฒนารายนี้ให้โดยตรง"),
        ("ยังไม่มีบริบททำเลจากโครงการที่เชื่อมโยง", "ทีมพร้อมสรุปบริบททำเลให้ระหว่างการ shortlist"),
        ("ยังไม่มีหลักฐานความน่าเชื่อถือที่เผยแพร่", "ทีมพร้อมแชร์หลักฐานความน่าเชื่อถือให้โดยตรง"),
        ("ยังไม่มีรายละเอียดที่เผยแพร่", "ทีมพร้อมสรุปรายละเอียดที่ยืนยันแล้วให้โดยตรง"),
        ("ยังไม่มีภาพ local media ที่อนุมัติ", "ทีมพร้อมแชร์ local media ที่คัดแล้วให้โดยตรง"),
        ("ยังไม่มีข้อมูลจุดเด่นที่เผยแพร่", "ทีมพร้อมสรุปจุดเด่นและ amenities ให้โดยตรง"),
        ("ทรัพย์ที่เกี่ยวข้องรอเผยแพร่", "ทีมพร้อมคัดทรัพย์ใกล้เคียงให้โดยตรง"),
        ("ยังไม่มี source metadata ที่เผยแพร่", "ทีมพร้อมแชร์ source metadata ให้ใน brief"),
        ("ยังไม่มีช่องทางติดต่อ", "ทีมพร้อมประสานช่องทางติดต่อให้โดยตรง"),
        ("ยังไม่มีผู้เขียนที่เผยแพร่", "ข้อมูลผู้เขียนพร้อมแจ้งให้โดยตรง"),
        ("ยังไม่มีวันที่เผยแพร่", "พร้อมแจ้งวันที่ให้โดยตรง"),
        ("ยังไม่มีวันที่อัปเดต", "พร้อมแจ้งวันที่อัปเดตให้โดยตรง"),
        ("ยังไม่มีบทสรุป", "ทีมพร้อมสรุปฉบับย่อให้โดยตรง"),
        ("ยังไม่มีคอนเทนต์ที่เผยแพร่", "ทีมพร้อมแชร์คอนเทนต์บรรณาธิการล่าสุดให้โดยตรง"),
        ("ยังไม่มีเนื้อหาบทความ", "ทีมพร้อมแชร์เนื้อหาบทความฉบับเต็มให้โดยตรง"),
        ("ยังไม่มีคอนเทนต์ที่เกี่ยวข้อง", "ทีมพร้อมแนะนำบทความที่เกี่ยวข้องให้โดยตรง"),
        ("ยังไม่มีแท็ก", "ทีมพร้อมสรุปหัวข้อที่เกี่ยวข้องให้โดยตรง"),
        ("ยังไม่มีเนื้อหา About ที่เผยแพร่", "ข้อมูลบริษัทพร้อมอธิบายให้โดยตรง"),
        ("ยังไม่มีเนื้อหา Process ที่เผยแพร่", "รายละเอียด process พร้อมอธิบายให้โดยตรง"),
        ("ยังไม่มีโปรไฟล์ทีมที่เผยแพร่", "ทีมพร้อมแนะนำตัวให้โดยตรง"),
        ("ยังไม่มี proof assets ที่เผยแพร่", "ทีมพร้อมแชร์ trust assets ให้โดยตรง"),
        ("ยังไม่มีเนื้อหา how-we-work ที่เผยแพร่", "รายละเอียดวิธีการทำงานพร้อมอธิบายให้โดยตรง"),
        ("ยังไม่มีข้อมูลติดต่อที่เผยแพร่", "ข้อมูลติดต่อพร้อมส่งให้โดยตรง"),
        ("ยังไม่เผยแพร่ที่อยู่สำนักงาน", "พร้อมแจ้งที่อยู่สำนักงานโดยตรง"),
        ("ยังไม่เผยแพร่เบอร์โทร", "พร้อมแจ้งเบอร์โทรโดยตรง"),
        ("ยังไม่เผยแพร่อีเมล", "พร้อมแจ้งอีเมลโดยตรง"),
        ("ยังไม่เผยแพร่เวลาเปิดทำการ", "พร้อมแจ้งเวลาเปิดทำการโดยตรง"),
        ("ยังไม่เผยแพร่ช่องทางติดต่อ", "พร้อมแจ้งช่องทางติดต่อโดยตรง"),
        ("ยังไม่เผยแพร่แผนที่", "พร้อมแชร์ลิงก์แผนที่ให้โดยตรง"),
        ("ยังไม่มีข้อมูล process ที่เผยแพร่", "รายละเอียด process พร้อมอธิบายให้โดยตรง"),
        ("ยังไม่มีรายละเอียด process ที่เผยแพร่", "รายละเอียด process พร้อมอธิบายให้โดยตรง"),
        ("ยังไม่มีเนื้อหา Privacy ที่เผยแพร่", "รายละเอียด privacy พร้อมส่งให้โดยตรง"),
        ("ยังไม่มีเนื้อหา Terms ที่เผยแพร่", "รายละเอียด terms พร้อมส่งให้โดยตรง"),
        ("ยังไม่มีเนื้อหา Cookies ที่เผยแพร่", "รายละเอียด cookies พร้อมส่งให้โดยตรง"),
        ("ยังไม่มี methodology การลงทุนที่เผยแพร่", "ทีมพร้อมอธิบาย methodology การลงทุนให้โดยตรง"),
        ("เร็วๆ นี้", "พร้อมให้ทีมสรุปเพิ่มเติม"),
    ),
}


def _alt_fallback(locale: str) -> str:
    return "รูปภาพอสังหา" if locale == "th" else "Property image"


def _sanitize_public_html(html: str, *, locale: str) -> str:
    without_todo = _TODO_TEXT_PATTERN.sub("", html)
    without_todo = re.sub(r"[ \t]{2,}", " ", without_todo)
    for source, replacement in _PUBLIC_COPY_REPLACEMENTS.get(locale, ()):
        without_todo = without_todo.replace(source, replacement)

    fallback_alt = _alt_fallback(locale)

    def _normalize_img(match: re.Match[str]) -> str:
        attrs = str(match.group("attrs") or "")
        attrs_lower = attrs.lower()
        class_match = re.search(
            r"\bclass\s*=\s*(['\"])(?P<classes>.*?)\1",
            attrs,
            flags=re.IGNORECASE,
        )
        classes = str(class_match.group("classes") or "").lower() if class_match else ""
        is_hero = (
            "hero-media" in classes
            or 'data-gallery-hero="true"' in attrs_lower
            or "data-gallery-hero='true'" in attrs_lower
        )
        width = "1280" if is_hero else "640"
        height = "720" if is_hero else "360"

        alt_match = _ALT_ATTR_PATTERN.search(attrs)
        if alt_match:
            if not str(alt_match.group("value") or "").strip():
                attrs = _ALT_ATTR_PATTERN.sub(f'alt="{fallback_alt}"', attrs, count=1)
        else:
            attrs = f'{attrs} alt="{fallback_alt}"'

        if not _WIDTH_ATTR_PATTERN.search(attrs):
            attrs = f'{attrs} width="{width}"'
        if not _HEIGHT_ATTR_PATTERN.search(attrs):
            attrs = f'{attrs} height="{height}"'
        return f"<img{attrs}>"

    return _IMG_TAG_PATTERN.sub(_normalize_img, without_todo)


def _safe_copy(locale: str) -> dict[str, str]:
    if locale == "th":
        return {
            "h1": "อสังหาริมทรัพย์พัทยาคัดสรร พร้อมขั้นตอนถัดไปที่ชัดเจน",
            "sub": "สื่อจากระบบของเรา แนวทางเชิงปฏิบัติ และเส้นทางที่ชัดเจนสำหรับผู้ซื้อ นักลงทุน ผู้เช่า และผู้ขายในพัทยา",
            "cta_primary": "ขอคำปรึกษา",
            "cta_secondary": "ดูโครงการคัดสรร",
            "trust_strip": "สื่อจากระบบเราเท่านั้น • รองรับ EN/TH • ขั้นตอนถัดไปชัดเจน",
            "path_title": "เลือกเส้นทางที่เหมาะกับคุณ",
            "featured_title": "Featured Projects",
            "featured_sub": "การ์ดโครงการจะแสดงเมื่อมีสื่อและข้อมูลหลักที่เผยแพร่แล้วในระบบ",
            "featured_fallback": "กำลังเพิ่มโครงการที่ตรวจสอบแล้วในระบบอย่างต่อเนื่อง TODO: เผยแพร่พื้นที่และราคาเริ่มต้นของโครงการที่พร้อมใช้งาน",
            "featured_pending_area": "พื้นที่จะปรากฏเมื่อเผยแพร่แล้ว",
            "featured_pending_price": "รอเผยแพร่ราคา",
            "featured_pending_facts": "กำลังจัดเตรียมข้อเท็จจริงของโครงการ TODO: เผยแพร่ quick facts จากข้อมูลจริง",
            "investment_title": "Selected Investment Opportunities",
            "investment_disclaimer": "Figures are estimates, not guarantees.",
            "investment_fallback": "ยังไม่มีข้อมูล comparison ที่พร้อมเผยแพร่ TODO: เพิ่มการ์ดลงทุนที่มีราคาและข้อมูลเปรียบเทียบจริง",
            "investment_pending_stats": "สถิติเพิ่มเติมจะปรากฏเมื่อเผยแพร่แล้ว",
            "view_pick": "ขอรายละเอียดเพิ่มเติม",
            "view_all_picks": "ขอ shortlist การลงทุน",
            "methodology": "See methodology",
            "methodology_note": "รายละเอียด methodology ยังไม่ถูกเผยแพร่ TODO: เพิ่มหลักเกณฑ์คัดเลือกและ source notes ที่ตรวจสอบแล้ว",
            "why_title": "Why Pattaya",
            "why_intro": "บริบทตลาดเชิงลึกกำลังจัดทำจากข้อมูลที่ตรวจสอบแล้ว ด้านล่างคือความครอบคลุมของ inventory ที่เผยแพร่ในระบบตอนนี้",
            "why_source": "Source note: internal published inventory at runtime.",
            "why_empty": "ยังไม่มีข้อมูล inventory ที่เผยแพร่พอสำหรับสรุป section นี้ TODO: เพิ่ม area/project/property coverage ที่ตรวจสอบแล้ว",
            "why_areas": "Published areas",
            "why_projects": "Published projects",
            "why_properties": "Active listings",
            "trust_title": "Why Clients Trust Us",
            "trust_fallback": "รายละเอียด trust และ process จะถูกเผยแพร่เมื่อทีมตรวจสอบข้อมูลแล้ว TODO: เพิ่ม proof blocks ที่อ้างอิงข้อมูลจริง",
            "team_link": "Meet the team",
            "process_link": "How we work",
            "team_note": "หน้าแนะนำทีมยังไม่ถูกเผยแพร่ TODO: เพิ่มข้อมูลทีมที่ผ่านการตรวจสอบแล้ว",
            "process_note": "หน้า process ยังไม่ถูกเผยแพร่ TODO: เพิ่มขั้นตอนการทำงานที่ตรวจสอบแล้ว",
            "insights_title": "Market Insights",
            "insights_sub": "คำแนะนำชัดเจนสำหรับการซื้อ ลงทุน เช่า และขายในพัทยา",
            "insights_fallback": "กำลังทบทวนบทความและบันทึกเชิงปฏิบัติสำหรับการเผยแพร่ TODO: เพิ่มไกด์ล่าสุดเมื่อข้อมูลพร้อม",
            "reviews_title": "Client Reviews",
            "reviews_fallback": "ยังไม่มีรีวิวที่เผยแพร่ใน runtime นี้ TODO: เชื่อมต่อแหล่งรีวิวที่ตรวจสอบแล้วหรือเพิ่มสรุปด้วยมือ",
            "work_title": "See Our Work",
            "work_sub": "วอล์กทรูและสื่อวิดีโอจะแสดงเมื่อมี thumb/poster ในระบบของเรา",
            "video_fallback": "กำลังเตรียม thumb/poster แบบ local สำหรับวิดีโอ TODO: เผยแพร่ media asset ที่ mirror แล้ว",
            "consult_title": "Request a Private Consultation",
            "consult_sub": "แจ้งงบ เป้าหมาย และไทม์ไลน์ของคุณ แล้วเราจะตรวจสอบคำขอนี้และแนะนำขั้นตอนถัดไปที่เหมาะสม",
            "consult_trust": "เราใช้ข้อมูลเท่าที่จำเป็นในการตรวจสอบคำขอนี้",
            "submit_success": "ส่งคำขอแล้ว เราจะตรวจสอบรายละเอียดและติดต่อกลับพร้อมขั้นตอนถัดไป",
            "submit_error": "ยังไม่สามารถส่งคำขอได้ในตอนนี้ กรุณาลองใหม่อีกครั้ง",
            "start": "Start",
            "browse_insights": "ดูไกด์ล่าสุด",
            "see_client_stories": "ดูเรื่องราวลูกค้า",
            "watch_more": "ดูวิดีโอเพิ่มเติม",
            "area_guides": "ดูสิ่งที่เผยแพร่อยู่ตอนนี้",
            "footer_projects": "Projects",
            "footer_areas": "Areas",
            "footer_investment": "Investment",
            "footer_about": "About",
            "footer_contact": "Contact",
            "privacy": "Privacy Policy",
            "terms": "Terms",
            "cookies": "Cookies",
            "legal_note": "หน้าเอกสารกฎหมายยังไม่ถูกเผยแพร่ TODO: เพิ่มเนื้อหา privacy / terms / cookies ที่ผ่านการอนุมัติ",
            "name": "Name",
            "contact": "WhatsApp หรือ Email",
            "budget": "Budget range",
            "purpose": "Purpose",
            "timeline": "Timeline",
            "select_budget": "Select budget",
            "select_purpose": "Select purpose",
            "select_timeline": "Select timeline",
            "submitting": "กำลังส่งคำขอ...",
            "hero_alt": "ภาพรวมอสังหาริมทรัพย์พัทยา",
        }
    return {
        "h1": "Curated Pattaya Property with Clear Next Steps",
        "sub": "Media from our system, practical guidance, and clear paths for buyers, investors, renters, and sellers in Pattaya.",
        "cta_primary": "Request Consultation",
        "cta_secondary": "Browse Curated Projects",
        "trust_strip": "Media from our system • EN/TH support • Clear next steps",
        "path_title": "Choose your path",
        "featured_title": "Featured Projects",
        "featured_sub": "Project cards appear when verified media and core facts are published in the system.",
        "featured_fallback": "More verified projects are being added in the system. TODO: publish project area and starting price where available.",
        "featured_pending_area": "Area will appear when published",
        "featured_pending_price": "Pricing pending publication",
        "featured_pending_facts": "Project facts are being prepared. TODO: publish quick facts from verified fields.",
        "investment_title": "Selected Investment Opportunities",
        "investment_disclaimer": "Figures are estimates, not guarantees.",
        "investment_fallback": "Comparable investment data is not published yet. TODO: add investment cards with verified price and comparison fields.",
        "investment_pending_stats": "Additional comparison stats will appear when published.",
        "view_pick": "Request details",
        "view_all_picks": "Request investment shortlist",
        "methodology": "See methodology",
        "methodology_note": "Methodology details are not published yet. TODO: add selection criteria and verified source notes.",
        "why_title": "Why Pattaya",
        "why_intro": "Verified external market context is still being prepared. The coverage below reflects what is currently published in our system.",
        "why_source": "Source note: internal published inventory at runtime.",
        "why_empty": "There is not enough published inventory yet to summarize this section. TODO: publish verified area, project, and listing coverage.",
        "why_areas": "Published areas",
        "why_projects": "Published projects",
        "why_properties": "Active listings",
        "trust_title": "Why Clients Trust Us",
        "trust_fallback": "Trust and process details will appear after editorial review. TODO: publish verified trust/process blocks.",
        "team_link": "Meet the team",
        "process_link": "How we work",
        "team_note": "Team profile content is not published yet. TODO: add verified team details.",
        "process_note": "Process content is not published yet. TODO: add verified workflow details.",
        "insights_title": "Market Insights",
        "insights_sub": "Clear guidance for buying, investing, renting, and selling in Pattaya.",
        "insights_fallback": "Fresh guides and practical notes are being reviewed for publication. TODO: publish the latest market insights.",
        "reviews_title": "Client Reviews",
        "reviews_fallback": "Verified review content is not published in this runtime yet. TODO: connect approved review source or publish manual summaries.",
        "work_title": "See Our Work",
        "work_sub": "Walkthroughs and video proof appear when mirrored thumbnails and posters are available in our media system.",
        "video_fallback": "Local video thumbnails and posters are being prepared. TODO: publish mirrored assets from the media library.",
        "consult_title": "Request a Private Consultation",
        "consult_sub": "Tell us your budget, purpose, and timeline. We will review the request and suggest the clearest next step.",
        "consult_trust": "We ask only for the details needed to review this request.",
        "submit_success": "Request submitted. We will review your details and follow up with the next step.",
        "submit_error": "Unable to submit right now. Please try again.",
        "start": "Start",
        "browse_insights": "Browse latest guides",
        "see_client_stories": "See client stories",
        "watch_more": "Watch more",
        "area_guides": "Explore what is currently published",
        "footer_projects": "Projects",
        "footer_areas": "Areas",
        "footer_investment": "Investment",
        "footer_about": "About",
        "footer_contact": "Contact",
        "privacy": "Privacy Policy",
        "terms": "Terms",
        "cookies": "Cookies",
        "legal_note": "Legal page content is not published yet. TODO: publish privacy, terms, and cookie details.",
        "name": "Name",
        "contact": "WhatsApp or Email",
        "budget": "Budget range",
        "purpose": "Purpose",
        "timeline": "Timeline",
        "select_budget": "Select budget",
        "select_purpose": "Select purpose",
        "select_timeline": "Select timeline",
        "submitting": "Submitting...",
        "hero_alt": "Pattaya property overview",
    }


def _default_path_cards(locale: str) -> list[dict[str, str]]:
    if locale == "th":
        return [
            {
                "key": "invest",
                "title": "Invest",
                "fit": "สำหรับผู้ใช้ที่กำลังเทียบผลตอบแทน ดีมานด์ และทางออกการลงทุน",
                "outcome": "ดูรายการที่มีข้อมูลเปรียบเทียบพร้อมใช้งานในระบบ",
            },
            {
                "key": "buy",
                "title": "Buy",
                "fit": "สำหรับผู้ซื้อที่กำลังมองหาอสังหาที่เหมาะกับการถือครองในพัทยา",
                "outcome": "ดูโครงการคัดสรรและขั้นตอนถัดไปที่ชัดเจน",
            },
            {
                "key": "rent",
                "title": "Rent",
                "fit": "สำหรับผู้เช่าที่กำลังวางแผนย้ายอยู่ระยะยาวหรือแบบยืดหยุ่น",
                "outcome": "เริ่มจากการแจ้งความต้องการเพื่อรับคำแนะนำถัดไป",
            },
            {
                "key": "sell",
                "title": "Sell",
                "fit": "สำหรับเจ้าของที่ต้องการเริ่มต้นขายอย่างเป็นระบบ",
                "outcome": "ส่งรายละเอียดเบื้องต้นเพื่อรับขั้นตอนถัดไป",
            },
        ]
    return [
        {
            "key": "invest",
            "title": "Invest",
            "fit": "For people comparing yield, demand, and exit visibility",
            "outcome": "See which published picks currently have comparison data",
        },
        {
            "key": "buy",
            "title": "Buy",
            "fit": "For buyers looking for the right Pattaya property to own",
            "outcome": "Browse curated projects and the clearest next step",
        },
        {
            "key": "rent",
            "title": "Rent",
            "fit": "For renters planning a move, long stay, or flexible setup",
            "outcome": "Start with a request so we can guide the next step",
        },
        {
            "key": "sell",
            "title": "Sell",
            "fit": "For owners who want to start with clear input and next-step guidance",
            "outcome": "Share the basics and request the next step",
        },
    ]


def _section_href(locale: str, fragment: str) -> str:
    return f"/{locale}{fragment}"


def _locale_path(locale: str, suffix: str = "") -> str:
    return f"/{locale}{suffix}"


def _runtime_default_nav_items(locale: str) -> list[tuple[str, str]]:
    if locale == "th":
        return [
            (_locale_path(locale, "/invest"), "ลงทุน"),
            (_locale_path(locale, "/buy"), "ซื้อ"),
            (_locale_path(locale, "/projects"), "โครงการ"),
            (_locale_path(locale, "/area-guide"), "ทำเล"),
        ]
    return [
        (_locale_path(locale, "/invest"), "Invest"),
        (_locale_path(locale, "/buy"), "Buy"),
        (_locale_path(locale, "/projects"), "Projects"),
        (_locale_path(locale, "/area-guide"), "Area Guide"),
    ]


def _runtime_default_footer_primary_items(locale: str) -> list[tuple[str, str]]:
    if locale == "th":
        return [
            (_locale_path(locale, "/invest"), "ลงทุน"),
            (_locale_path(locale, "/buy"), "ซื้อ"),
            (_locale_path(locale, "/projects"), "โครงการ"),
        ]
    return [
        (_locale_path(locale, "/invest"), "Invest"),
        (_locale_path(locale, "/buy"), "Buy"),
        (_locale_path(locale, "/projects"), "Projects"),
    ]


def _runtime_default_footer_legal_items(locale: str) -> list[tuple[str, str]]:
    if locale == "th":
        return [
            (_locale_path(locale, "/privacy"), "นโยบายความเป็นส่วนตัว"),
            (_locale_path(locale, "/terms"), "ข้อกำหนดการใช้บริการ"),
        ]
    return [
        (_locale_path(locale, "/privacy"), "Privacy Policy"),
        (_locale_path(locale, "/terms"), "Terms"),
    ]


def _layout_cms_document(db: Session | None) -> dict[str, object]:
    if db is None:
        return {}
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == _SITE_LAYOUT_CMS_SLUG))
    text = str(row.content if row is not None else "").strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _layout_localized_text(value: object, locale: str) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        for key in [locale, "en", "th"]:
            text = str(value.get(key) or "").strip()
            if text:
                return text
    return ""


def _runtime_links_from_cms(
    locale: str,
    raw_links: object,
    *,
    fallback: list[tuple[str, str]],
    max_items: int = 8,
) -> list[tuple[str, str]]:
    if not isinstance(raw_links, list):
        return fallback
    fallback_by_href = {href: label for href, label in fallback}
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for raw_item in raw_links:
        if not isinstance(raw_item, dict):
            continue
        if raw_item.get("enabled") is False:
            continue
        href = _normalized_runtime_href(locale, str(raw_item.get("href") or "").strip())
        if not href or href in seen:
            continue
        label = _layout_localized_text(raw_item.get("label"), locale) or fallback_by_href.get(
            href, ""
        )
        if not label:
            continue
        seen.add(href)
        out.append((href, label))
        if len(out) >= max_items:
            break
    return out or fallback


def _runtime_single_link_from_cms(
    locale: str,
    raw: object,
    *,
    fallback: tuple[str, str],
) -> tuple[str, str]:
    if not isinstance(raw, dict):
        return fallback
    if raw.get("enabled") is False:
        return fallback
    href = _normalized_runtime_href(locale, str(raw.get("href") or "").strip())
    label = _layout_localized_text(raw.get("label"), locale)
    if not href or not label:
        return fallback
    return (href, label)


def _runtime_footer_contact(locale: str, db: Session | None) -> dict[str, str]:
    doc = _layout_cms_document(db)
    footer = doc.get("footer") if isinstance(doc.get("footer"), dict) else {}
    contact = (
        footer.get("contact")
        if isinstance(footer, dict) and isinstance(footer.get("contact"), dict)
        else {}
    )
    email = (
        str(contact.get("email") if isinstance(contact, dict) else "").strip()
        or _DEFAULT_CONTACT_EMAIL
    )
    raw_facebook = str(contact.get("facebook_url") if isinstance(contact, dict) else "").strip()
    parsed = urlparse(raw_facebook)
    if parsed.scheme in {"http", "https"} and str(parsed.hostname or "").lower() in {
        "facebook.com",
        "www.facebook.com",
    }:
        facebook_url = raw_facebook
    else:
        facebook_url = _DEFAULT_FACEBOOK_URL
    facebook_label = (
        _layout_localized_text(
            contact.get("facebook_label") if isinstance(contact, dict) else "",
            locale,
        )
        or _DEFAULT_FACEBOOK_LABEL
    )
    return {
        "email": email,
        "facebook_url": facebook_url,
        "facebook_label": facebook_label,
    }


def _runtime_nav_items(locale: str, db: Session | None) -> list[tuple[str, str]]:
    fallback = _runtime_default_nav_items(locale)
    doc = _layout_cms_document(db)
    header = doc.get("header") if isinstance(doc.get("header"), dict) else {}
    raw_links = header.get("primary_links") if isinstance(header, dict) else None
    return _runtime_links_from_cms(locale, raw_links, fallback=fallback)


def _runtime_contact_cta(locale: str, db: Session | None) -> tuple[str, str]:
    fallback = (_locale_path(locale, "/contact"), "Contact" if locale == "en" else "ติดต่อ")
    doc = _layout_cms_document(db)
    header = doc.get("header") if isinstance(doc.get("header"), dict) else {}
    raw_cta = header.get("contact_cta") if isinstance(header, dict) else None
    return _runtime_single_link_from_cms(locale, raw_cta, fallback=fallback)


def _runtime_footer_primary_items(locale: str, db: Session | None) -> list[tuple[str, str]]:
    fallback = _runtime_default_footer_primary_items(locale)
    doc = _layout_cms_document(db)
    footer = doc.get("footer") if isinstance(doc.get("footer"), dict) else {}
    raw_links = footer.get("quick_links") if isinstance(footer, dict) else None
    return _runtime_links_from_cms(locale, raw_links, fallback=fallback)


def _runtime_footer_legal_items(locale: str, db: Session | None) -> list[tuple[str, str]]:
    fallback = _runtime_default_footer_legal_items(locale)
    doc = _layout_cms_document(db)
    footer = doc.get("footer") if isinstance(doc.get("footer"), dict) else {}
    raw_links = footer.get("legal_links") if isinstance(footer, dict) else None
    return _runtime_links_from_cms(locale, raw_links, fallback=fallback)


def _is_smart_finder_label(value: str | None) -> bool:
    normalized = " ".join(str(value or "").lower().replace("-", " ").split())
    return "smart finder" in normalized


def _resolve_cta_text(value: str | None, fallback: str, *, source: str) -> str:
    return _published_text(value, fallback) if source == "published" else fallback


def _normalized_runtime_href(locale: str, requested: str | None) -> str | None:
    raw = str(requested or "").strip()
    if not raw:
        return None
    if raw.startswith("#"):
        return _section_href(locale, raw)
    path, hash_mark, fragment = raw.partition("#")
    normalized = path.rstrip("/") or "/"
    if normalized in _ALLOWED_RUNTIME_PATHS:
        base = normalized if normalized != "/" else _locale_path(locale)
    elif normalized in _PUBLIC_ROUTE_SUFFIXES:
        base = _locale_path(locale, normalized)
    elif normalized.startswith("/en") or normalized.startswith("/th"):
        prefix = "/en" if normalized.startswith("/en") else "/th"
        suffix = normalized[len(prefix) :]
        if suffix in _PUBLIC_ROUTE_SUFFIXES:
            base = _locale_path(locale, suffix)
        else:
            return None
    else:
        return None
    return f"{base}#{fragment}" if hash_mark and fragment else base


def _safe_forward_href(locale: str, requested: str | None, fallback_target: str) -> str:
    normalized = _normalized_runtime_href(locale, requested)
    if normalized:
        return normalized
    fallback = _normalized_runtime_href(locale, fallback_target)
    return fallback or _section_href(locale, "#consult-title")


def _resolve_secondary_cta_href(locale: str, requested: str | None, label: str) -> str:
    if _is_smart_finder_label(label):
        normalized = _normalized_runtime_href(locale, requested)
        smart_finder_href = _locale_path(locale, "/smart-finder")
        if normalized == smart_finder_href:
            return normalized
        return smart_finder_href
    return _safe_forward_href(locale, requested, "/projects")


def _load_home_context(db: Session, locale: str) -> tuple[str, dict]:
    row = db.scalar(
        select(HomeComposerConfig)
        .where(
            HomeComposerConfig.page_key == "home",
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "published",
        )
        .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
        .limit(1)
    )
    if row is None and locale != "en":
        row = db.scalar(
            select(HomeComposerConfig)
            .where(
                HomeComposerConfig.page_key == "home",
                HomeComposerConfig.locale == "en",
                HomeComposerConfig.status == "published",
            )
            .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
            .limit(1)
        )
    source = "published" if row is not None else "safe_default"
    normalized = normalize_home_config(row.config if row is not None else {})
    return source, resolve_home_runtime(db=db, config=normalized, locale=locale)


def _published_text(value: str | None, fallback: str) -> str:
    text = str(value or "").strip()
    return text or fallback


def _project_by_id(db: Session, item_id: str | None) -> Project | None:
    if not item_id:
        return None
    try:
        return db.get(Project, item_id)
    except Exception:
        return None


def _property_by_id(db: Session, item_id: str | None) -> Property | None:
    if not item_id:
        return None
    try:
        return db.get(Property, item_id)
    except Exception:
        return None


def _area_name(db: Session, area_id: object) -> str | None:
    if not area_id:
        return None
    try:
        row = db.get(Area, area_id)
    except Exception:
        return None
    text = str(getattr(row, "name", "") or "").strip() if row is not None else ""
    return text or None


def _format_money(amount: object, *, fallback: str) -> str:
    if isinstance(amount, (int, float, Decimal)):
        return f"THB {float(amount):,.0f}"
    return fallback


def _project_facts(project: Project | None) -> list[str]:
    if project is None:
        return []
    facts: list[str] = []
    if isinstance(project.highlights, list):
        for item in project.highlights:
            text = str(item or "").strip()
            if text:
                facts.append(text)
            if len(facts) == 3:
                return facts
    if project.property_type:
        facts.append(f"Type: {project.property_type}")
    if project.delivery_date is not None:
        facts.append(f"Delivery: {project.delivery_date.isoformat()}")
    if project.unit_count:
        facts.append(f"Units: {project.unit_count}")
    elif project.floors:
        facts.append(f"Floors: {project.floors}")
    return facts[:3]


def _property_stats(prop: Property | None) -> list[str]:
    if prop is None:
        return []
    stats: list[str] = []
    if prop.bedrooms is not None:
        stats.append(f"{prop.bedrooms} bed")
    if prop.bathrooms is not None:
        stats.append(f"{prop.bathrooms} bath")
    if prop.size_sqm is not None:
        stats.append(f"{float(prop.size_sqm):,.0f} sqm")
    elif prop.size is not None:
        stats.append(f"{float(prop.size):,.0f} sqm")
    if prop.floor is not None:
        stats.append(f"Floor {prop.floor}")
    return stats[:4]


def _property_tags(prop: Property | None) -> list[str]:
    if prop is None:
        return []
    tags: list[str] = []
    for value in [prop.type, prop.property_type]:
        text = str(value or "").strip()
        if text and text not in tags:
            tags.append(text)
    return tags[:2]


def _count_cards(db: Session) -> list[tuple[str, int]]:
    areas = int(
        db.scalar(select(func.count()).select_from(Area).where(Area.status == "published")) or 0
    )
    projects = int(
        db.scalar(
            select(func.count())
            .select_from(Project)
            .where(Project.deleted_at.is_(None), Project.status == "published")
        )
        or 0
    )
    properties = int(
        db.scalar(select(func.count()).select_from(Property).where(Property.status == "active"))
        or 0
    )
    return [("areas", areas), ("projects", projects), ("properties", properties)]


def _build_featured_html(
    db: Session,
    request: Request,
    locale: str,
    copy: dict[str, str],
    resolved: dict,
    *,
    cta_label: str,
    cta_href: str,
) -> str:
    cards: list[str] = []
    for item in (resolved.get("featured_projects") or [])[:8]:
        project = _project_by_id(db, str(item.get("id") or ""))
        project_id = escape(str(item.get("id") or "project"))
        project_slug = escape(str(item.get("slug") or ""))
        media = _safe_media_url(
            item.get("cover_image_url") or item.get("hero_image_url"),
            _DEFAULT_MEDIA_FALLBACK,
            request=request,
        )
        name = escape(str(item.get("name") or "Project"))
        area_name = (
            _area_name(db, getattr(project, "area_id", None)) or copy["featured_pending_area"]
        )
        price_text = _format_money(
            getattr(project, "starting_price", None), fallback=copy["featured_pending_price"]
        )
        facts = _project_facts(project)
        facts_html = (
            f'<ul class="facts">{"".join(f"<li>{escape(fact)}</li>" for fact in facts)}</ul>'
            if facts
            else f'<div class="state-empty state-inline">{escape(copy["featured_pending_facts"])}</div>'
        )
        cards.append(
            f"""
            <article class=\"card\" data-card-id=\"{project_id}\" data-card-slug=\"{project_slug}\">
              <img class=\"cover-media\" src=\"{escape(media)}\" alt=\"{name}\" loading=\"lazy\" width=\"640\" height=\"360\" />
              <h3>{name}</h3>
              <p class=\"muted\">{escape(area_name)} • {escape(price_text)}</p>
              {facts_html}
              <a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_browse_projects_click\" data-cta-id=\"featured_project_cta\" data-card-id=\"{project_id}\" data-card-slug=\"{project_slug}\" data-placement=\"featured_card\" href=\"{cta_href}\">{escape(cta_label)}</a>
            </article>
            """
        )
    if cards:
        return "".join(cards)
    return f'<div class="state-empty">{escape(copy["featured_fallback"])}</div>'


def _build_investment_html(
    db: Session, request: Request, locale: str, copy: dict[str, str], resolved: dict
) -> str:
    cards: list[str] = []
    for item in (resolved.get("investment_picks") or [])[:6]:
        prop = _property_by_id(db, str(item.get("id") or ""))
        item_id = escape(str(item.get("id") or "pick"))
        item_slug = escape(str(getattr(prop, "slug", "") or item.get("slug") or ""))
        title = escape(str(item.get("title") or "Investment pick"))
        media = _safe_media_url(
            item.get("cover_image_url"), _DEFAULT_MEDIA_FALLBACK, request=request
        )
        price_text = _format_money(item.get("price"), fallback=copy["featured_pending_price"])
        stats = _property_stats(prop)
        tags = _property_tags(prop)
        stats_html = (
            f'<ul class="facts">{"".join(f"<li>{escape(stat)}</li>" for stat in stats)}</ul>'
            if stats
            else f'<div class="state-empty state-inline">{escape(copy["investment_pending_stats"])}</div>'
        )
        tags_html = "".join(f'<span class="tag">{escape(tag)}</span>' for tag in tags)
        cards.append(
            f"""
            <article class=\"card\" data-item-id=\"{item_id}\" data-card-id=\"{item_id}\" data-card-slug=\"{item_slug}\">
              <img class=\"cover-media\" src=\"{escape(media)}\" alt=\"{title}\" loading=\"lazy\" width=\"640\" height=\"360\" />
              <p class=\"price\">{escape(price_text)}</p>
              <h3>{title}</h3>
              {stats_html}
              <div class=\"tag-row\">{tags_html}</div>
              <a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_investment_pick_click\" data-cta-id=\"investment_pick_cta\" data-item-id=\"{item_id}\" data-card-id=\"{item_id}\" data-card-slug=\"{item_slug}\" data-placement=\"investment_card\" href=\"{_section_href(locale, "#consult-title")}\">{escape(copy["view_pick"])}</a>
            </article>
            """
        )
    if cards:
        return "".join(cards)
    return f'<div class="state-empty">{escape(copy["investment_fallback"])}</div>'


def _build_why_html(db: Session, copy: dict[str, str]) -> str:
    counts = _count_cards(db)
    if not any(value for _, value in counts):
        return f'<div class="state-empty">{escape(copy["why_empty"])}</div>'
    labels = {
        "areas": copy["why_areas"],
        "projects": copy["why_projects"],
        "properties": copy["why_properties"],
    }
    cards = "".join(
        f'<article class="metric"><h3>{escape(labels[key])}</h3><p>{value}</p></article>'
        for key, value in counts
    )
    return f'<div class="metrics">{cards}</div><p class="muted">{escape(copy["why_source"])}</p>'


def _build_trust_html(copy: dict[str, str], resolved: dict) -> str:
    blocks = resolved.get("trust_blocks") or []
    rendered = [
        f'<article class="card"><h3>{escape(str(block.get("title") or "Trust block"))}</h3><p>{escape(str(block.get("body") or ""))}</p></article>'
        for block in blocks
        if str(block.get("title") or "").strip() or str(block.get("body") or "").strip()
    ]
    if rendered:
        return "".join(rendered)
    return (
        f'<div class="state-empty" id="trust-publication-note">{escape(copy["trust_fallback"])}</div>'
        f'<div class="state-empty" id="team-note">{escape(copy["team_note"])}</div>'
        f'<div class="state-empty" id="process-note">{escape(copy["process_note"])}</div>'
    )


def _build_video_html(request: Request, copy: dict[str, str], resolved: dict) -> str:
    cards: list[str] = []
    for item in (resolved.get("video_items") or [])[:4]:
        thumb = _safe_media_url(
            item.get("thumbnail_path"), _DEFAULT_MEDIA_FALLBACK, request=request
        )
        poster = _safe_media_url(item.get("poster_path"), _DEFAULT_MEDIA_FALLBACK, request=request)
        label = escape(str(item.get("key") or "Video"))
        cards.append(
            f"""
            <article class=\"card\">
              <img class=\"cover-media\" src=\"{escape(thumb)}\" alt=\"{label}\" loading=\"lazy\" width=\"640\" height=\"360\" />
              <video class=\"video-proof\" controls preload=\"none\" poster=\"{escape(poster)}\" aria-label=\"{label}\">
                <source src=\"/media/library/videos/demo-safe.mp4\" type=\"video/mp4\" />
              </video>
            </article>
            """
        )
    if cards:
        return "".join(cards)
    return f'<div class="state-empty">{escape(copy["video_fallback"])}</div>'


def _build_insights_preview_html(db: Session, locale: str, copy: dict[str, str]) -> str:
    rows = db.scalars(
        select(Article)
        .where(
            Article.deleted_at.is_(None),
            Article.status == "published",
            Article.category.in_(["guide", "blog"]),
        )
        .order_by(desc(Article.published_at), desc(Article.created_at))
        .limit(3)
    ).all()
    if not rows:
        return (
            f'<div id="insights-note" class="state-empty">{escape(copy["insights_fallback"])}</div>'
        )
    cards = []
    for row in rows:
        title = _localized_dict_text(row.title, locale) or row.slug
        excerpt = _localized_dict_text(row.excerpt, locale) or copy["insights_fallback"]
        cards.append(
            f'<article class="card"><h3>{escape(title)}</h3><p class="muted">{escape(row.category)}</p><p>{escape(excerpt)}</p></article>'
        )
    return f'<div class="grid-3">{"".join(cards)}</div>'


def _build_reviews_html(db: Session, locale: str, copy: dict[str, str], resolved: dict) -> str:
    review_ids = [
        str(item)
        for item in ((resolved.get("reviews") or {}).get("source_ids") or [])
        if str(item).strip()
    ]
    rows = db.scalars(
        select(Testimonial)
        .where(Testimonial.deleted_at.is_(None), Testimonial.status == "published")
        .order_by(Testimonial.display_order.asc(), desc(Testimonial.updated_at))
        .limit(6)
    ).all()
    if review_ids:
        allowed = set(review_ids)
        rows = [row for row in rows if str(row.id) in allowed]
    if not rows:
        return (
            f'<div id="reviews-note" class="state-empty">{escape(copy["reviews_fallback"])}</div>'
        )
    cards = []
    for row in rows[:3]:
        title = row.attribution_name or ("Client review" if locale == "en" else "รีวิวลูกค้า")
        context = row.context or row.persona or row.intent
        cards.append(
            f'<article class="card"><h3>{escape(title)}</h3><p><strong>{escape(row.quote)}</strong></p><p class="muted">{escape(str(context or "").strip())}</p></article>'
        )
    return f'<div class="grid-3">{"".join(cards)}</div>'


def _render(locale: str, request: Request, db: Session, source: str, resolved: dict) -> str:
    copy = _safe_copy(locale)
    hero = resolved.get("hero") or {}
    secondary_cta = resolved.get("hero_secondary_cta") or {}
    primary_cta = hero.get("cta") if isinstance(hero.get("cta"), dict) else {}
    consultation = resolved.get("consultation") or {}
    trust_items = [
        str(item.get("text") or "").strip()
        for item in (resolved.get("trust_micro_strip") or [])
        if str(item.get("text") or "").strip()
    ]
    hero_title = (
        _published_text(hero.get("headline"), copy["h1"]) if source == "published" else copy["h1"]
    )
    hero_sub = (
        _published_text(hero.get("subheadline"), copy["sub"])
        if source == "published"
        else copy["sub"]
    )
    hero_trust_strip = (
        " • ".join(trust_items[:4])
        if source == "published" and trust_items
        else copy["trust_strip"]
    )
    consult_copy = (
        _published_text(consultation.get("promise_copy"), copy["consult_sub"])
        if source == "published"
        else copy["consult_sub"]
    )
    consult_trust = (
        _published_text(consultation.get("trust_note"), copy["consult_trust"])
        if source == "published"
        else copy["consult_trust"]
    )
    hero_primary_label = _resolve_cta_text(
        primary_cta.get("text"), copy["cta_primary"], source=source
    )
    hero_secondary_label = _resolve_cta_text(
        secondary_cta.get("text"), copy["cta_secondary"], source=source
    )
    path_cards = resolved.get("path_selector", {}).get("cards") if source == "published" else None
    cards = (
        path_cards
        if isinstance(path_cards, list) and len(path_cards) == 4
        else _default_path_cards(locale)
    )
    fallback_targets = {
        "invest": "/investment/methodology",
        "buy": "/projects",
        "rent": "/contact",
        "sell": "/sell",
    }
    card_html = "".join(
        f"""
        <a class=\"intent-card\" href=\"{_safe_forward_href(locale, card.get("href") if isinstance(card, dict) else None, fallback_targets.get(str((card or {}).get("key") or ""), "#consult-title"))}\" data-event=\"home_intent_start_click\" data-cta-id=\"intent_{escape(str((card or {}).get("key") or "path"))}\" data-intent=\"{escape(str((card or {}).get("key") or "path"))}\" data-filter-values='["{escape(str((card or {}).get("key") or "path"))}"]' data-placement=\"intent_selector\">
          <h3>{escape(str((card or {}).get("title") or (card or {}).get("key") or "Path"))}</h3>
          <p><strong>Fit:</strong> {escape(str((card or {}).get("fit") or ""))}</p>
          <p><strong>Outcome:</strong> {escape(str((card or {}).get("outcome") or ""))}</p>
          <span class=\"start-pill\">{escape(copy["start"])}</span>
        </a>
        """
        for card in cards
    )
    consult_href = _safe_forward_href(
        locale, primary_cta.get("href") if isinstance(primary_cta, dict) else None, "/contact"
    )
    featured_href = _resolve_secondary_cta_href(
        locale,
        secondary_cta.get("href") if isinstance(secondary_cta, dict) else None,
        hero_secondary_label,
    )
    hero_media = _safe_media_url(hero.get("media_path"), _DEFAULT_MEDIA_FALLBACK, request=request)
    featured_html = _build_featured_html(
        db,
        request,
        locale,
        copy,
        resolved,
        cta_label=hero_secondary_label,
        cta_href=featured_href,
    )
    investment_html = _build_investment_html(db, request, locale, copy, resolved)
    why_html = _build_why_html(db, copy)
    trust_html = _build_trust_html(copy, resolved)
    insights_html = _build_insights_preview_html(db, locale, copy)
    reviews_html = _build_reviews_html(db, locale, copy, resolved)
    video_html = _build_video_html(request, copy, resolved)
    contact_cta_href, contact_cta_label = _runtime_contact_cta(locale, db)
    nav_links_html = "".join(
        f'<a class="btn btn-secondary-hero btn-sm" href="{escape(href)}">{escape(label)}</a>'
        for href, label in _runtime_nav_items(locale, db)
    )
    nav_html = f'{nav_links_html}<a class="btn btn-secondary-hero btn-sm" href="{escape(contact_cta_href)}">{escape(contact_cta_label)}</a>'
    footer_primary_html = "".join(
        f'<a href="{escape(href)}">{escape(label)}</a>'
        for href, label in _runtime_footer_primary_items(locale, db)
    )
    footer_legal_html = "".join(
        f'<a href="{escape(href)}">{escape(label)}</a>'
        for href, label in _runtime_footer_legal_items(locale, db)
    )
    footer_contact = _runtime_footer_contact(locale, db)
    footer_contact_parts: list[str] = []
    if footer_contact["email"]:
        footer_contact_parts.append(f'<p class="muted">{escape(footer_contact["email"])}</p>')
    footer_contact_parts.append(
        f'<a href="{escape(footer_contact["facebook_url"])}" target="_blank" rel="noopener noreferrer">{escape(footer_contact["facebook_label"])}</a>'
    )
    footer_contact_html = "".join(footer_contact_parts)
    main_nav_label = "Main navigation" if locale == "en" else "เมนูหลัก"
    footer_nav_label = "Footer navigation" if locale == "en" else "เมนูท้ายหน้า"
    html = f"""<!doctype html>
<html lang=\"{locale}\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>FlowBiz Home</title>
    <style>
      :root{{--c1:#0f6d5a;--c2:#064b3d;--txt:#1f2937;--muted:#5b6472;--bg:#f6f7f9;--surface:#fff;--border:#d1d5db;--error:#b00020;--pad:16px;--max:1280px}}
      *{{box-sizing:border-box}} body{{margin:0;font-family:Segoe UI,Tahoma,\"Noto Sans Thai\",sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}}
      a{{color:inherit;text-decoration:none}} :focus-visible{{outline:3px solid var(--c1);outline-offset:2px}}
      .skip-link{{position:absolute;top:-40px;left:8px;background:#fff;padding:8px 12px;border:1px solid var(--border);border-radius:8px}} .skip-link:focus-visible{{top:8px}}
      .site-header{{border-bottom:1px solid var(--border);background:#fff}} .site-header__inner{{display:flex;justify-content:flex-end;padding:14px var(--pad)}} .site-nav{{display:flex;gap:10px;flex-wrap:wrap}}
      .container{{max-width:var(--max);margin:0 auto;padding:0 var(--pad)}} .stack{{display:grid;gap:24px;padding:24px 0}}
      .hero{{display:grid;gap:16px}} .hero-media,.cover-media{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:#e5e7eb}}
      h1{{font-size:clamp(1.8rem,1.45rem + 1.4vw,2.8rem);line-height:1.15;margin:0}} h2{{margin:0;font-size:clamp(1.35rem,1.15rem + .9vw,2rem)}} h3{{margin:0;font-size:1.1rem;line-height:1.25}} p{{margin:0}}
      .cta-row{{display:flex;gap:12px;flex-wrap:wrap}} .btn{{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;border:1px solid transparent;padding:10px 16px;background:var(--c1);color:#fff;font-weight:600;cursor:pointer}}
      .btn-primary-hero{{min-height:52px;min-width:250px;font-size:1.05rem;font-weight:700;background:var(--c1)}} .btn-secondary-hero{{min-height:44px;min-width:190px;font-size:.93rem;font-weight:500;background:#fff;color:var(--c2);border-color:var(--c1)}}
      .btn-sm{{padding:8px 12px;font-size:.9rem}} .muted{{color:var(--muted)}} .trust-strip{{font-size:.95rem;color:var(--muted)}}
      .card{{display:grid;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px}}
      .grid-2,.grid-3,.grid-5{{display:grid;gap:16px;grid-template-columns:1fr}} .intent-card{{display:grid;gap:8px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px}}
      .intent-card:hover{{border-color:var(--c1)}} .start-pill{{font-weight:700;color:var(--c2)}} .facts{{margin:0;padding-left:20px;display:grid;gap:2px}} .price{{font-size:1.5rem;font-weight:800;color:var(--c2);margin:0}}
      .tag-row{{display:flex;gap:8px;flex-wrap:wrap}} .tag{{display:inline-flex;width:max-content;border-radius:999px;background:#edf6f3;color:var(--c2);padding:2px 8px;font-size:.85rem}}
      .metrics{{display:grid;gap:12px;grid-template-columns:1fr}} .metric{{background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px}}
      .state-empty,.state-loading,.state-error{{border:1px solid var(--border);border-radius:12px;background:#fff;padding:12px}} .state-inline{{font-size:.95rem}} .state-loading::after{{content:' ...'}} .state-error{{background:#fff3f5;border-color:#ef9aa8;color:var(--error)}}
      .video-proof{{width:100%;aspect-ratio:16/9;border-radius:12px;background:#000}} .field{{display:grid;gap:6px}} input,select{{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border)}}
      footer{{margin-top:28px;padding:24px 0;border-top:1px solid var(--border);background:#fff}} .footer-links{{display:flex;gap:12px;flex-wrap:wrap}}
      @media (min-width:768px){{.grid-2{{grid-template-columns:repeat(2,minmax(0,1fr))}} .metrics{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
      @media (min-width:1024px){{.grid-3{{grid-template-columns:repeat(3,minmax(0,1fr))}} .grid-5{{grid-template-columns:repeat(3,minmax(0,1fr))}} .metrics{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}
      @media (min-width:2560px){{.grid-5{{grid-template-columns:repeat(5,minmax(0,1fr))}}}}
    </style>
  </head>
  <body>
    <a class=\"skip-link\" href=\"#main\">Skip to main content</a>
    <header class=\"site-header\" role=\"banner\"><div class=\"container site-header__inner\"><nav class=\"site-nav\" aria-label=\"{escape(main_nav_label)}\">{nav_html}</nav></div></header>
    <main id=\"main\" class=\"container stack\">
      <section class=\"hero\" aria-labelledby=\"hero-title\">
        <img class=\"hero-media\" src=\"{escape(hero_media)}\" alt=\"{escape(copy["hero_alt"])}\" width=\"1280\" height=\"720\" loading=\"eager\" />
        <h1 id=\"hero-title\">{escape(hero_title)}</h1>
        <p>{escape(hero_sub)}</p>
        <div class=\"cta-row\"><a class=\"btn btn-primary-hero\" data-event=\"home_hero_primary_click\" data-cta-id=\"hero_primary\" data-placement=\"hero\" href=\"{consult_href}\">{escape(hero_primary_label)}</a><a class=\"btn btn-secondary-hero\" data-event=\"home_hero_secondary_click\" data-cta-id=\"hero_secondary\" data-placement=\"hero\" href=\"{featured_href}\">{escape(hero_secondary_label)}</a></div>
        <p class=\"trust-strip\">{escape(hero_trust_strip)}</p>
      </section>
      <section aria-labelledby=\"intent-title\"><h2 id=\"intent-title\">{escape(copy["path_title"])}</h2><div class=\"grid-2\">{card_html}</div></section>
      <section aria-labelledby=\"featured-title\"><h2 id=\"featured-title\">{escape(copy["featured_title"])}</h2><p class=\"muted\">{escape(copy["featured_sub"])}</p><div class=\"grid-3\">{featured_html}</div><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_browse_projects_click\" data-cta-id=\"featured_footer_cta\" data-placement=\"featured_footer\" href=\"{featured_href}\">{escape(hero_secondary_label)}</a></section>
      <section aria-labelledby=\"investment-title\"><div style=\"display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap\"><h2 id=\"investment-title\">{escape(copy["investment_title"])}</h2><a id=\"investment-methodology\" href=\"{_locale_path(locale, "/investment/methodology")}\">{escape(copy["methodology"])}</a></div><p class=\"muted\">{escape(copy["investment_disclaimer"])}</p><div class=\"grid-5\">{investment_html}</div><div id=\"methodology-note\" class=\"state-empty\">{escape(copy["methodology_note"])}</div><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_investment_pick_click\" data-cta-id=\"investment_all_picks_cta\" data-item-id=\"all_picks\" data-placement=\"investment_footer\" href=\"{_locale_path(locale, "/investment/methodology")}\">{escape(copy["view_all_picks"])}</a></section>
      <section aria-labelledby=\"why-pattaya-title\"><h2 id=\"why-pattaya-title\">{escape(copy["why_title"])}</h2><p>{escape(copy["why_intro"])}</p>{why_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/areas")}\">{escape(copy["area_guides"])}</a></section>
      <section aria-labelledby=\"trust-title\"><h2 id=\"trust-title\">{escape(copy["trust_title"])}</h2><div class=\"grid-2\">{trust_html}</div><div class=\"cta-row\"><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/about")}#team-section\">{escape(copy["team_link"])}</a><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/about")}#process-section\">{escape(copy["process_link"])}</a></div></section>
      <section aria-labelledby=\"insights-title\"><h2 id=\"insights-title\">{escape(copy["insights_title"])}</h2><p>{escape(copy["insights_sub"])}</p>{insights_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/insights")}\">{escape(copy["browse_insights"])}</a></section>
      <section aria-labelledby=\"reviews-title\"><h2 id=\"reviews-title\">{escape(copy["reviews_title"])}</h2>{reviews_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/about")}#client-reviews\">{escape(copy["see_client_stories"])}</a></section>
      <section aria-labelledby=\"video-title\"><h2 id=\"video-title\">{escape(copy["work_title"])}</h2><p>{escape(copy["work_sub"])}</p><div class=\"grid-2\">{video_html}</div><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, "/about")}#work-proof\">{escape(copy["watch_more"])}</a></section>
      <section aria-labelledby=\"consult-title\"><h2 id=\"consult-title\">{escape(copy["consult_title"])}</h2><p>{escape(consult_copy)}</p><form id=\"consultation-form\" class=\"card\" novalidate><label class=\"field\" for=\"name\"><span>{escape(copy["name"])}</span><input id=\"name\" name=\"name\" type=\"text\" required /></label><label class=\"field\" for=\"contact\"><span>{escape(copy["contact"])}</span><input id=\"contact\" name=\"contact\" type=\"text\" required /></label><label class=\"field\" for=\"budget\"><span>{escape(copy["budget"])}</span><select id=\"budget\" name=\"budget\" required><option value=\"\">{escape(copy["select_budget"])}</option><option value=\"lt_3m\">Below THB 3M</option><option value=\"3m_6m\">THB 3M - 6M</option><option value=\"6m_10m\">THB 6M - 10M</option><option value=\"gt_10m\">Above THB 10M</option></select></label><label class=\"field\" for=\"purpose\"><span>{escape(copy["purpose"])}</span><select id=\"purpose\" name=\"purpose\" required><option value=\"\">{escape(copy["select_purpose"])}</option><option value=\"invest\">Invest</option><option value=\"buy\">Buy</option><option value=\"rent\">Rent</option><option value=\"sell\">Sell</option></select></label><label class=\"field\" for=\"timeline\"><span>{escape(copy["timeline"])}</span><select id=\"timeline\" name=\"timeline\" required><option value=\"\">{escape(copy["select_timeline"])}</option><option value=\"0_3m\">0-3 months</option><option value=\"3_6m\">3-6 months</option><option value=\"6m_plus\">6+ months</option></select></label><div class=\"cta-row\"><button id=\"consult-submit\" class=\"btn\" type=\"submit\">{escape(hero_primary_label)}</button><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_whatsapp_click\" data-cta-id=\"whatsapp_cta\" data-placement=\"bottom_form\" href=\"https://wa.me/66000000000\">WhatsApp</a><a class=\"btn btn-secondary-hero btn-sm\" href=\"https://line.me/R/ti/p/@flowbiz\">LINE</a></div><p class=\"muted\">{escape(consult_trust)}</p><p id=\"form-status\" class=\"muted\" role=\"status\" aria-live=\"polite\"></p><div id=\"form-loading\" class=\"state-loading\" hidden>{escape(copy["submitting"])}</div><div id=\"form-error\" class=\"state-error\" hidden>{escape(copy["submit_error"])}</div></form></section>
    </main>
    <footer><div class=\"container\" style=\"display:grid;gap:12px\"><nav class=\"footer-links\" aria-label=\"{escape(footer_nav_label)}\">{footer_primary_html}</nav><nav class=\"footer-links\" aria-label=\"{escape(footer_nav_label)}\">{footer_legal_html}</nav><div class=\"footer-links\">{footer_contact_html}</div></div></footer>
    <script>
      (() => {{
        const locale = document.documentElement.lang || 'en';
        const path = location.pathname;
        const endpoint = '/api/v1/events';
        const scrollMarks = [25, 50, 75, 90];
        const fired = new Set();
        function compactPayload(raw) {{
          const out = {{}};
          for (const [key, value] of Object.entries(raw || {{}})) {{
            if (value === undefined || value === null) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            out[key] = value;
          }}
          return out;
        }}
        function parseFilterValues(raw) {{
          const value = String(raw || '').trim();
          if (!value) return undefined;
          try {{
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : [parsed];
          }} catch {{
            return value.split(',').map((part) => part.trim()).filter(Boolean);
          }}
        }}
        function elementPayload(node) {{
          const card = node.closest('[data-card-id], [data-item-id]');
          return compactPayload({{
            label: node.textContent?.trim() || '',
            placement: node.getAttribute('data-placement') || card?.getAttribute('data-placement') || undefined,
            cta_id: node.getAttribute('data-cta-id') || undefined,
            card_id: node.getAttribute('data-card-id') || card?.getAttribute('data-card-id') || node.getAttribute('data-item-id') || card?.getAttribute('data-item-id') || undefined,
            card_slug: node.getAttribute('data-card-slug') || card?.getAttribute('data-card-slug') || undefined,
            filter_values: parseFilterValues(node.getAttribute('data-filter-values') || card?.getAttribute('data-filter-values') || ''),
            intent: node.getAttribute('data-intent') || undefined,
            item_id: node.getAttribute('data-item-id') || card?.getAttribute('data-item-id') || undefined,
          }});
        }}
        function track(eventName, payload) {{
          const payloadBody = compactPayload(payload);
          const sourceBody = compactPayload({{
            app: 'flowbiz-public-runtime',
            env: 'runtime',
            page: path,
            locale,
            placement: payloadBody.placement,
          }});
          return fetch(endpoint, {{
            method: 'POST',
            headers: {{ 'content-type': 'application/json' }},
            body: JSON.stringify({{ event_name: eventName, source: sourceBody, payload: payloadBody }}),
            keepalive: true,
          }}).catch(() => null);
        }}
        document.querySelectorAll('[data-event]').forEach((node) => {{
          node.addEventListener('click', () => {{
            const eventName = node.getAttribute('data-event');
            if (!eventName) return;
            track(eventName, elementPayload(node));
          }});
        }});
        window.addEventListener('scroll', () => {{
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight <= 0) return;
          const depth = Math.round((window.scrollY / scrollHeight) * 100);
          for (const mark of scrollMarks) {{ if (depth >= mark && !fired.has(mark)) {{ fired.add(mark); track('home_scroll_depth', {{ depth: mark, placement: 'page_scroll' }}); }} }}
        }}, {{ passive: true }});
        const form = document.getElementById('consultation-form');
        const submitBtn = document.getElementById('consult-submit');
        const statusEl = document.getElementById('form-status');
        const loadingEl = document.getElementById('form-loading');
        const errorEl = document.getElementById('form-error');
        if (form instanceof HTMLFormElement) {{
          form.addEventListener('submit', async (event) => {{
            event.preventDefault(); errorEl.hidden = true; loadingEl.hidden = false; statusEl.textContent = {copy["submitting"]!r}; submitBtn.disabled = true;
            const data = Object.fromEntries(new FormData(form).entries());
            const contact = String(data.contact || '').trim();
            const intent = String(data.purpose || 'general');
            const fieldsPresent = Object.entries(data).filter(([, value]) => String(value || '').trim().length > 0).map(([key]) => key);
            const isEmail = contact.includes('@');
            try {{
              await track('home_form_submit', {{ fields_present: fieldsPresent, intent, filter_values: intent ? [intent] : [], placement: 'consult_form', cta_id: 'consult_submit' }});
              await fetch('/v1/inquiries', {{ method: 'POST', headers: {{ 'content-type': 'application/json' }}, body: JSON.stringify({{ name: data.name, email: isEmail ? contact : null, phone: isEmail ? null : contact, message: 'Budget: ' + String(data.budget || '') + '; Purpose: ' + String(data.purpose || '') + '; Timeline: ' + String(data.timeline || ''), source_page: location.pathname, intent, budget_band: String(data.budget || ''), timeline: String(data.timeline || '') }}) }});
              statusEl.textContent = {copy["submit_success"]!r}; form.reset();
            }} catch {{ errorEl.hidden = false; statusEl.textContent = ''; }} finally {{ loadingEl.hidden = true; submitBtn.disabled = false; }}
          }});
        }}
      }})();
    </script>
  </body>
</html>
"""
    html = _sanitize_public_html(html, locale=locale)
    seo_html = apply_runtime_seo(
        db=db,
        request=request,
        locale=locale,
        html=html,
        default_title="FlowBiz Home",
        default_description=hero_sub,
        default_canonical=_absolute_url(request, request.url.path),
    )
    return _sanitize_public_html(seo_html, locale=locale)


def _render_page_shell(
    locale: str,
    *,
    title: str,
    intro: str,
    body: str,
    request: Request | None = None,
    db: Session | None = None,
    canonical_href: str | None = None,
    meta_description: str | None = None,
    is_article_detail: bool = False,
    head_extra: str = "",
) -> str:
    nav_items = _runtime_nav_items(locale, db)
    contact_cta_href, contact_cta_label = _runtime_contact_cta(locale, db)
    footer_primary_items = _runtime_footer_primary_items(locale, db)
    footer_legal_items = _runtime_footer_legal_items(locale, db)
    nav_links_html = "".join(
        f'<a class="btn" href="{escape(href)}">{escape(label)}</a>' for href, label in nav_items
    )
    nav_html = f'{nav_links_html}<a class="btn" href="{escape(contact_cta_href)}">{escape(contact_cta_label)}</a>'
    footer_primary_html = "".join(
        f'<a href="{escape(href)}">{escape(label)}</a>' for href, label in footer_primary_items
    )
    footer_legal_html = "".join(
        f'<a href="{escape(href)}">{escape(label)}</a>' for href, label in footer_legal_items
    )
    footer_contact = _runtime_footer_contact(locale, db)
    footer_contact_parts: list[str] = []
    if footer_contact["email"]:
        footer_contact_parts.append(f'<p class="muted">{escape(footer_contact["email"])}</p>')
    footer_contact_parts.append(
        f'<a href="{escape(footer_contact["facebook_url"])}" target="_blank" rel="noopener noreferrer">{escape(footer_contact["facebook_label"])}</a>'
    )
    footer_contact_html = "".join(footer_contact_parts)
    main_nav_label = "Main navigation" if locale == "en" else "เมนูหลัก"
    footer_nav_label = "Footer navigation" if locale == "en" else "เมนูท้ายหน้า"
    canonical_line = (
        f'<link rel="canonical" href="{escape(canonical_href)}" />'
        if str(canonical_href or "").strip()
        else ""
    )
    html = f"""<!doctype html>
<html lang="{locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(title)}</title>
    {canonical_line}
    {head_extra}
    <style>
      :root{{--c1:#0f6d5a;--txt:#1f2937;--muted:#5b6472;--bg:#f6f7f9;--surface:#fff;--border:#d1d5db;--pad:16px;--max:1080px}}
      *{{box-sizing:border-box}} body{{margin:0;font-family:Segoe UI,Tahoma,"Noto Sans Thai",sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}}
      a{{color:inherit}} :focus-visible{{outline:3px solid var(--c1);outline-offset:2px}}
      .container{{max-width:var(--max);margin:0 auto;padding:24px var(--pad)}} .stack{{display:grid;gap:16px}}
      .card{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;display:grid;gap:12px}}
      .grid{{display:grid;gap:16px;grid-template-columns:1fr}} .muted{{color:var(--muted)}} .btn{{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;border:1px solid var(--c1);padding:10px 16px;background:#fff;color:var(--c1);text-decoration:none}}
      .site-header{{border-bottom:1px solid var(--border);background:#fff}} .site-header__inner{{padding:14px var(--pad)}} .site-nav{{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}}
      footer{{margin-top:20px;padding:18px 0;border-top:1px solid var(--border);background:#fff}} .footer-links{{display:flex;gap:12px;flex-wrap:wrap}}
      .state-empty,.state-loading,.state-error,.state-success{{border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:#fff}}
      .state-loading{{background:#ecfeff;color:#0c4a6e}} .state-error{{background:#fef2f2;color:#991b1b;border-color:#fecaca}} .state-success{{background:#f0fdf4;color:#166534;border-color:#bbf7d0}}
      .media{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:#e5e7eb}}
      .skip-link{{position:absolute;left:-9999px;top:auto}}
      .skip-link:focus{{left:16px;top:16px;background:#fff;border:1px solid var(--border);padding:8px 12px;border-radius:8px;z-index:1000}}
      @media (min-width:768px){{.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
      @media (min-width:1024px){{.grid-3{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}
      @media (min-width:2560px){{.container{{max-width:1440px}}}}
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header" role="banner"><div class="container site-header__inner"><nav class="site-nav" aria-label="{escape(main_nav_label)}">{nav_html}</nav></div></header>
    <main id="main-content" class="container stack">
            <a class="btn" href="/{locale}">Back to Home</a>
      <section class="card">
        <h1>{escape(title)}</h1>
        <p>{escape(intro)}</p>
      </section>
      {body}
    </main>
    <footer><div class="container" style="display:grid;gap:12px"><nav class="footer-links" aria-label="{escape(footer_nav_label)}">{footer_primary_html}</nav><nav class="footer-links" aria-label="{escape(footer_nav_label)}">{footer_legal_html}</nav><div class="footer-links">{footer_contact_html}</div></div></footer>
  </body>
</html>
"""
    html = _sanitize_public_html(html, locale=locale)
    if request is None or db is None:
        return html
    effective_canonical = canonical_href or _absolute_url(request, request.url.path)
    effective_description = (
        str(meta_description).strip() if meta_description is not None else str(intro).strip()
    )
    seo_html = apply_runtime_seo(
        db=db,
        request=request,
        locale=locale,
        html=html,
        default_title=title,
        default_description=effective_description or None,
        default_canonical=effective_canonical,
        is_article_detail=is_article_detail,
    )
    return _sanitize_public_html(seo_html, locale=locale)


def _localized_dict_text(value: object, locale: str) -> str | None:
    if not isinstance(value, dict):
        return None
    for key in [locale, "en", "th"]:
        candidate = str(value.get(key) or "").strip()
        if candidate:
            return candidate
    return None


def _clean_text_list(value: object | None) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        text = str(item or "").strip()
        if not text or text in seen:
            continue
        seen.add(text)
        out.append(text)
    return out


def _project_gallery_paths(project: Project, *, request: Request) -> list[str]:
    candidates: list[str] = []
    for value in [project.hero_image_url, project.cover_image_url]:
        text = str(value or "").strip()
        if text:
            candidates.append(text)
    if isinstance(project.images, list):
        for value in project.images:
            text = str(value or "").strip()
            if text:
                candidates.append(text)
    out: list[str] = []
    seen: set[str] = set()
    for value in candidates:
        safe = _safe_media_url(value, _DEFAULT_MEDIA_FALLBACK, request=request)
        # Skip disallowed raw values instead of polluting the gallery with fallback duplicates.
        if safe == _DEFAULT_MEDIA_FALLBACK and not _is_allowed_media_url(value, request=request):
            continue
        if safe in seen:
            continue
        seen.add(safe)
        out.append(safe)
    if not out:
        out.append(_DEFAULT_MEDIA_FALLBACK)
    return out[:8]


def _project_faq_items(project: Project, locale: str) -> list[tuple[str, str]]:
    source_notes = project.source_notes if isinstance(project.source_notes, dict) else {}
    raw = source_notes.get("faq") or source_notes.get("faqs") or []
    if not isinstance(raw, list):
        return []
    out: list[tuple[str, str]] = []
    for item in raw:
        question = ""
        answer = ""
        if isinstance(item, dict):
            question = (
                _localized_dict_text(item.get("question"), locale)
                or _localized_dict_text(item.get("q"), locale)
                or str(item.get("question") or item.get("q") or item.get("title") or "").strip()
            )
            answer = (
                _localized_dict_text(item.get("answer"), locale)
                or _localized_dict_text(item.get("a"), locale)
                or str(item.get("answer") or item.get("a") or item.get("body") or "").strip()
            )
        elif isinstance(item, (list, tuple)) and len(item) >= 2:
            question = str(item[0] or "").strip()
            answer = str(item[1] or "").strip()
        if question and answer:
            out.append((question, answer))
        if len(out) == 6:
            break
    return out


def _property_ref_for_route(prop: Property) -> str:
    slug = str(prop.slug or "").strip()
    return slug or str(prop.id)


def _property_media_path(prop: Property, *, request: Request) -> str:
    candidates: list[str] = []
    for value in [prop.cover_image_url, prop.cover_image]:
        text = str(value or "").strip()
        if text:
            candidates.append(text)
    if isinstance(prop.local_images, list):
        for value in prop.local_images:
            text = str(value or "").strip()
            if text:
                candidates.append(text)
    if isinstance(prop.images, list):
        for value in prop.images:
            text = str(value or "").strip()
            if text:
                candidates.append(text)
    for value in candidates:
        safe = _safe_media_url(value, _DEFAULT_MEDIA_FALLBACK, request=request)
        if safe == _DEFAULT_MEDIA_FALLBACK and not _is_allowed_media_url(value, request=request):
            continue
        return safe
    return _DEFAULT_MEDIA_FALLBACK


def _property_title_for_locale(prop: Property, locale: str) -> str:
    return (
        _localized_dict_text(getattr(prop, "title_i18n", None), locale)
        or str(prop.title or "").strip()
        or ("Property" if locale == "en" else "อสังหา")
    )


def _property_description_for_locale(prop: Property, locale: str) -> str:
    return (
        _localized_dict_text(getattr(prop, "description_i18n", None), locale)
        or str(prop.description or "").strip()
    )


def _absolute_url(request: Request, path: str) -> str:
    raw = str(path or "").strip()
    if not raw:
        return str(request.base_url).rstrip("/")
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    base = str(request.base_url).rstrip("/")
    if raw.startswith("/"):
        return f"{base}{raw}"
    return f"{base}/{raw}"


def _render_projects_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    rows = db.scalars(
        select(Project)
        .where(Project.deleted_at.is_(None), Project.status == "published")
        .order_by(desc(Project.updated_at))
        .limit(12)
    ).all()
    cards = []
    for row in rows:
        media = _safe_media_url(
            row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request
        )
        area_name = _area_name(db, row.area_id) or (
            "Area pending publication" if locale == "en" else "พื้นที่รอเผยแพร่"
        )
        price_text = _format_money(
            row.starting_price,
            fallback="Pricing pending publication" if locale == "en" else "รอเผยแพร่ราคา",
        )
        summary = _localized_dict_text(row.summary, locale) or (
            "Summary pending publication." if locale == "en" else "รอสรุปเนื้อหาเผยแพร่"
        )
        updated_text = row.updated_at.strftime("%Y-%m-%d") if row.updated_at else "-"
        type_text = str(row.property_type or "").strip() or (
            "property" if locale == "en" else "อสังหา"
        )
        cards.append(
            f'<article class="card"><img class="media" src="{escape(media)}" alt="{escape(row.name)}" width="640" height="360" /><h2>{escape(row.name)}</h2><p class="muted">{escape(area_name)} • {escape(price_text)}</p><p class="muted">{escape(type_text)} • Updated {escape(updated_text)}</p><p>{escape(summary)}</p><div class="grid"><a class="btn" href="/{locale}/projects/{escape(row.slug)}">{"View project details" if locale == "en" else "ดูรายละเอียดโครงการ"}</a><a class="btn" href="/{locale}/contact?intent=consultation&project={escape(row.slug)}">{"Request details" if locale == "en" else "ขอรายละเอียด"}</a></div></article>'
        )
    fallback = (
        "Published projects are not available yet. Publish project records to populate this page."
        if locale == "en"
        else "ยังไม่มีโครงการที่เผยแพร่ โปรดเผยแพร่ข้อมูลโครงการเพื่อให้หน้านี้แสดงผล"
    )
    body_content = "".join(cards) if cards else f'<div class="card">{escape(fallback)}</div>'
    body = f'<section class="grid">{body_content}</section>'
    title = "Projects" if locale == "en" else "Projects"
    intro = (
        "Published projects from the current system with verified local media and direct consultation paths."
        if locale == "en"
        else "โครงการที่เผยแพร่จากระบบปัจจุบัน พร้อมสื่อภายในระบบและเส้นทางติดต่อที่ชัดเจน"
    )
    return HTMLResponse(
        _render_page_shell(locale, title=title, intro=intro, body=body, request=request, db=db)
    )


def _render_project_detail_page(
    locale: str, request: Request, db: Session, slug: str
) -> HTMLResponse:
    row = db.scalar(
        select(Project).where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    copy = {
        "summary_title": "Project Summary",
        "gallery": "Gallery",
        "area": "Area",
        "developer": "Developer",
        "status": "Status",
        "starting_price": "Starting price",
        "facts": "Key Facts",
        "highlights": "Highlights",
        "amenities": "Amenities",
        "location": "Location Context",
        "location_fallback": "Map data is pending publication. Browse published area context for this project.",
        "investment": "Investment Snapshot",
        "investment_fallback": "Investment snapshot is pending publication with verified source and update timestamp.",
        "source": "Source",
        "updated": "Updated",
        "availability": "Unit Availability Preview",
        "buy_units": "Buy units",
        "rent_units": "Rent units",
        "availability_fallback": "No active units are linked to this project yet.",
        "related_projects": "Related Projects",
        "related_properties": "Related Properties",
        "related_projects_fallback": "Related projects will appear when matching published inventory is available.",
        "related_properties_fallback": "Related properties will appear when active matching units are available.",
        "request_consultation": "Request Consultation",
        "book_viewing": "Book Viewing",
        "faq": "FAQ",
        "gallery_note": "Gallery is currently limited to available local media.",
        "empty_list": "Pending publication",
        "view_property": "View property",
        "view_project": "View project",
        "map_link": "Open map context",
    }
    if locale == "th":
        copy.update(
            {
                "summary_title": "สรุปโครงการ",
                "gallery": "แกลเลอรี",
                "area": "ทำเล",
                "developer": "ผู้พัฒนา",
                "status": "สถานะ",
                "starting_price": "ราคาเริ่มต้น",
                "facts": "ข้อมูลสำคัญ",
                "highlights": "จุดเด่น",
                "amenities": "สิ่งอำนวยความสะดวก",
                "location": "บริบททำเล",
                "location_fallback": "ยังไม่มีข้อมูลแผนที่ที่เผยแพร่ ดูข้อมูลทำเลที่เผยแพร่ได้จากหน้าพื้นที่",
                "investment": "ภาพรวมการลงทุน",
                "investment_fallback": "ยังไม่มี investment snapshot ที่มีแหล่งที่มาและเวลาปรับปรุง",
                "source": "แหล่งข้อมูล",
                "updated": "อัปเดตล่าสุด",
                "availability": "ยูนิตที่พร้อมแสดงตัวอย่าง",
                "buy_units": "ยูนิตสำหรับซื้อ",
                "rent_units": "ยูนิตสำหรับเช่า",
                "availability_fallback": "ยังไม่มียูนิต active ที่เชื่อมกับโครงการนี้",
                "related_projects": "โครงการที่เกี่ยวข้อง",
                "related_properties": "ทรัพย์ที่เกี่ยวข้อง",
                "related_projects_fallback": "จะแสดงโครงการที่เกี่ยวข้องเมื่อมีข้อมูลที่เผยแพร่",
                "related_properties_fallback": "จะแสดงทรัพย์ที่เกี่ยวข้องเมื่อมียูนิตที่เผยแพร่",
                "request_consultation": "ขอคำปรึกษา",
                "book_viewing": "จองนัดเข้าชม",
                "faq": "คำถามที่พบบ่อย",
                "gallery_note": "แกลเลอรีจะแสดงตาม local media ที่พร้อมใช้งาน",
                "empty_list": "รอการเผยแพร่",
                "view_property": "ดูรายละเอียดทรัพย์",
                "view_project": "ดูรายละเอียดโครงการ",
                "map_link": "เปิดบริบทแผนที่",
            }
        )

    area_row = db.get(Area, row.area_id) if row.area_id else None
    if area_row is not None and area_row.deleted_at is not None:
        area_row = None
    developer_row = db.get(Developer, row.developer_id) if row.developer_id else None
    if developer_row is not None and (
        developer_row.deleted_at is not None or developer_row.status != "active"
    ):
        developer_row = None

    area_name = str(getattr(area_row, "name", "") or "").strip() or (
        "Area pending publication" if locale == "en" else "พื้นที่รอเผยแพร่"
    )
    area_href = (
        f"/{locale}/areas/{area_row.slug}"
        if area_row is not None and area_row.status == "published"
        else f"/{locale}/areas"
    )
    developer_name = str(getattr(developer_row, "name", "") or "").strip() or (
        "Developer pending publication" if locale == "en" else "ผู้พัฒนารอเผยแพร่"
    )
    developer_href = (
        f"/{locale}/developers/{developer_row.slug}"
        if developer_row is not None
        else f"/{locale}/developers"
    )

    summary_text = _localized_dict_text(row.summary, locale) or (
        "Summary pending publication." if locale == "en" else "รอสรุปเนื้อหาเผยแพร่"
    )
    description_text = _localized_dict_text(row.description, locale) or ""
    status_text = str(row.status or "").strip() or "-"
    price_text = _format_money(
        row.starting_price,
        fallback="Pricing pending publication" if locale == "en" else "รอเผยแพร่ราคา",
    )

    gallery = _project_gallery_paths(row, request=request)
    hero_media = gallery[0]
    gallery_extra = "".join(
        f'<img class="media" src="{escape(path)}" alt="{escape(row.name)} gallery {idx}" loading="lazy" width="640" height="360" />'
        for idx, path in enumerate(gallery[1:], start=2)
    )
    gallery_note_html = (
        f'<p class="muted" data-gallery-note="true">{escape(copy["gallery_note"])}</p>'
        if len(gallery) <= 2
        else ""
    )

    facts = _clean_text_list(row.quick_facts) or _project_facts(row)
    highlights = _clean_text_list(row.highlights)
    amenities = _clean_text_list(row.amenities)
    facts_html = (
        "".join(f"<li>{escape(item)}</li>" for item in facts)
        or f"<li>{escape(copy['empty_list'])}</li>"
    )
    highlights_html = (
        "".join(f"<li>{escape(item)}</li>" for item in highlights)
        or f"<li>{escape(copy['empty_list'])}</li>"
    )
    amenities_html = (
        "".join(f"<li>{escape(item)}</li>" for item in amenities)
        or f"<li>{escape(copy['empty_list'])}</li>"
    )

    location = row.location if isinstance(row.location, dict) else {}
    lat_raw = location.get("lat") or location.get("latitude")
    lng_raw = location.get("lng") or location.get("longitude")
    try:
        lat = float(lat_raw) if lat_raw is not None else None
    except (TypeError, ValueError):
        lat = None
    try:
        lng = float(lng_raw) if lng_raw is not None else None
    except (TypeError, ValueError):
        lng = None
    location_context = (
        _localized_dict_text(location.get("context"), locale)
        or str(location.get("context") or location.get("label") or "").strip()
    )
    if lat is not None and lng is not None:
        map_href = f"https://maps.google.com/?q={lat:.6f},{lng:.6f}"
        location_body = (
            f"<p>{escape(location_context or area_name)}</p>"
            f'<p class="muted">{escape(f"Lat {lat:.6f}, Lng {lng:.6f}")}</p>'
            f'<a class="btn" href="{escape(map_href)}" rel="noopener" target="_blank">{escape(copy["map_link"])}</a>'
        )
    else:
        location_body = f'<p>{escape(copy["location_fallback"])}</p><a class="btn" href="{area_href}">{escape(area_name)}</a>'

    source_notes = row.source_notes if isinstance(row.source_notes, dict) else {}
    snapshot = row.investment_snapshot if isinstance(row.investment_snapshot, dict) else {}
    investment_source = str(
        snapshot.get("source")
        or source_notes.get("investment_source")
        or source_notes.get("source")
        or ""
    ).strip()
    investment_updated = str(snapshot.get("updated_at") or "").strip() or (
        row.claims_updated_at.date().isoformat() if row.claims_updated_at else ""
    )
    investment_rows = []
    for key, value in snapshot.items():
        if key in {"source", "updated_at"}:
            continue
        text = ""
        if isinstance(value, (int, float, Decimal)):
            text = f"{float(value):,.2f}".rstrip("0").rstrip(".")
        elif isinstance(value, (dict, list)):
            text = json.dumps(value, ensure_ascii=False)
        else:
            text = str(value or "").strip()
        if text:
            investment_rows.append((key.replace("_", " ").strip().title(), text))
    if investment_source and investment_updated:
        metrics_html = "".join(
            f"<li><strong>{escape(label)}:</strong> {escape(value)}</li>"
            for label, value in investment_rows
        )
        if not metrics_html:
            metrics_html = f"<li>{escape(copy['empty_list'])}</li>"
        investment_body = (
            f'<p class="muted">{escape(copy["source"])}: {escape(investment_source)}</p>'
            f'<p class="muted">{escape(copy["updated"])}: {escape(investment_updated)}</p>'
            f"<ul>{metrics_html}</ul>"
        )
    else:
        investment_body = f"<p>{escape(copy['investment_fallback'])}</p>"

    unit_rows = db.scalars(
        select(Property)
        .where(Property.status == "active", Property.project_id == row.id)
        .order_by(desc(Property.updated_at))
        .limit(12)
    ).all()
    buy_units = [item for item in unit_rows if str(item.type or "").lower() != "rent"]
    rent_units = [item for item in unit_rows if str(item.type or "").lower() == "rent"]

    def _unit_card(prop: Property) -> str:
        title = _property_title_for_locale(prop, locale)
        price = _format_money(prop.price, fallback="-")
        stats = " • ".join(_property_stats(prop)) or "-"
        href = f"/{locale}/property/{escape(_property_ref_for_route(prop))}"
        media = _property_media_path(prop, request=request)
        return (
            f'<article class="card">'
            f'<img class="media" src="{escape(media)}" alt="{escape(title)}" width="640" height="360" loading="lazy" />'
            f"<h3>{escape(title)}</h3>"
            f'<p class="muted">{escape(price)}</p>'
            f'<p class="muted">{escape(stats)}</p>'
            f'<a class="btn" href="{href}">{escape(copy["view_property"])}</a>'
            f"</article>"
        )

    buy_html = (
        "".join(_unit_card(item) for item in buy_units[:3])
        or f'<div class="card">{escape(copy["availability_fallback"])}</div>'
    )
    rent_html = (
        "".join(_unit_card(item) for item in rent_units[:3])
        or f'<div class="card">{escape(copy["availability_fallback"])}</div>'
    )

    related_filters = []
    if row.area_id is not None:
        related_filters.append(Project.area_id == row.area_id)
    if row.developer_id is not None:
        related_filters.append(Project.developer_id == row.developer_id)
    related_projects_query = select(Project).where(
        Project.deleted_at.is_(None),
        Project.status == "published",
        Project.id != row.id,
    )
    if related_filters:
        related_projects_query = related_projects_query.where(or_(*related_filters))
    related_projects = db.scalars(
        related_projects_query.order_by(desc(Project.updated_at)).limit(4)
    ).all()
    related_projects_html = (
        "".join(
            (
                f'<article class="card">'
                f'<img class="media" src="{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}" alt="{escape(item.name)}" width="640" height="360" loading="lazy" />'
                f"<h3>{escape(item.name)}</h3>"
                f'<p class="muted">{escape(_format_money(item.starting_price, fallback="-"))}</p>'
                f'<a class="btn" href="/{locale}/projects/{escape(item.slug)}">{escape(copy["view_project"])}</a>'
                f"</article>"
            )
            for item in related_projects
        )
        or f'<div class="card">{escape(copy["related_projects_fallback"])}</div>'
    )

    related_properties: list[Property] = []
    seen_property_ids = {str(item.id) for item in unit_rows}
    if row.area_id is not None or row.developer_id is not None:
        candidates = db.scalars(
            select(Property)
            .where(Property.status == "active")
            .order_by(desc(Property.updated_at))
            .limit(60)
        ).all()
        for item in candidates:
            if str(item.id) in seen_property_ids:
                continue
            matches_area = row.area_id is not None and item.area_id == row.area_id
            matches_developer = (
                row.developer_id is not None and item.developer_id == row.developer_id
            )
            if not (matches_area or matches_developer):
                continue
            related_properties.append(item)
            seen_property_ids.add(str(item.id))
            if len(related_properties) == 4:
                break
    related_properties_html = (
        "".join(_unit_card(item) for item in related_properties)
        or f'<div class="card">{escape(copy["related_properties_fallback"])}</div>'
    )

    faq_items = _project_faq_items(row, locale)
    faq_html = ""
    if faq_items:
        faq_rows = "".join(
            f'<details class="card"><summary><strong>{escape(question)}</strong></summary><p>{escape(answer)}</p></details>'
            for question, answer in faq_items
        )
        faq_html = f'<section id="project-faq" class="stack"><h2>{escape(copy["faq"])}</h2>{faq_rows}</section>'

    project_url = f"/{locale}/projects/{row.slug}"
    schema_hooks: list[tuple[str, dict]] = []
    project_schema: dict[str, object] = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": row.name,
        "url": _absolute_url(request, project_url),
    }
    if summary_text:
        project_schema["description"] = summary_text
    project_schema["image"] = [_absolute_url(request, image) for image in gallery[:5]]
    if row.starting_price is not None:
        project_schema["offers"] = {
            "@type": "Offer",
            "priceCurrency": "THB",
            "price": float(row.starting_price),
        }
    schema_hooks.append(("project-detail", project_schema))
    if faq_items:
        schema_hooks.append(
            (
                "project-faq",
                {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": question,
                            "acceptedAnswer": {"@type": "Answer", "text": answer},
                        }
                        for question, answer in faq_items
                    ],
                },
            )
        )
    schema_html = "".join(
        f'<script type="application/ld+json" data-schema-hook="{escape(name)}">{json.dumps(payload, ensure_ascii=False)}</script>'
        for name, payload in schema_hooks
    )

    detail_intro = description_text or summary_text
    body = (
        f'<section id="project-hero" class="card"><img class="media" src="{escape(hero_media)}" alt="{escape(row.name)}" width="1280" height="720" loading="eager" /><h2>{escape(row.name)}</h2><p>{escape(summary_text)}</p>'
        f'<div class="grid"><a class="btn" href="/{locale}/contact?intent=consultation&project={escape(row.slug)}">{escape(copy["request_consultation"])}</a><a class="btn" href="/{locale}/contact?intent=viewing&project={escape(row.slug)}">{escape(copy["book_viewing"])}</a></div></section>'
        f'<section id="project-gallery" class="stack"><h2>{escape(copy["gallery"])}</h2>{gallery_note_html}<section class="grid"><article class="card"><img class="media" src="{escape(hero_media)}" alt="{escape(row.name)}" width="1280" height="720" loading="lazy" /></article>{gallery_extra}</section></section>'
        f'<section id="project-summary" class="card"><h2>{escape(copy["summary_title"])}</h2><p><strong>{escape(copy["area"])}:</strong> <a href="{area_href}">{escape(area_name)}</a></p><p><strong>{escape(copy["developer"])}:</strong> <a href="{developer_href}">{escape(developer_name)}</a></p><p><strong>{escape(copy["status"])}:</strong> {escape(status_text)}</p><p><strong>{escape(copy["starting_price"])}:</strong> {escape(price_text)}</p>{f"<p>{escape(description_text)}</p>" if description_text else ""}</section>'
        f'<section id="project-facts" class="grid"><article class="card"><h2>{escape(copy["facts"])}</h2><ul>{facts_html}</ul></article><article class="card"><h2>{escape(copy["highlights"])}</h2><ul>{highlights_html}</ul></article><article class="card"><h2>{escape(copy["amenities"])}</h2><ul>{amenities_html}</ul></article></section>'
        f'<section id="project-location" class="card"><h2>{escape(copy["location"])}</h2>{location_body}</section>'
        f'<section id="project-investment" class="card"><h2>{escape(copy["investment"])}</h2>{investment_body}</section>'
        f'<section id="project-availability" class="stack"><h2>{escape(copy["availability"])}</h2><article class="card"><h3>{escape(copy["buy_units"])}</h3><section class="grid">{buy_html}</section></article><article class="card"><h3>{escape(copy["rent_units"])}</h3><section class="grid">{rent_html}</section></article></section>'
        f'<section id="project-related" class="stack"><article><h2>{escape(copy["related_projects"])}</h2><section class="grid">{related_projects_html}</section></article><article><h2>{escape(copy["related_properties"])}</h2><section class="grid">{related_properties_html}</section></article></section>'
        f"{faq_html}{schema_html}"
    )
    title = row.name
    intro = detail_intro
    return HTMLResponse(
        _render_page_shell(locale, title=title, intro=intro, body=body, request=request, db=db)
    )


def _render_smart_finder_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy, body = _smart_finder_runtime(locale=locale, request=request, db=db)
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["title"],
            intro=copy["intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _render_compare_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy, body, compare_count = _compare_runtime(locale=locale, request=request, db=db)
    html = _render_page_shell(
        locale,
        title=copy["title"],
        intro=copy["intro"],
        body=body,
        request=request,
        db=db,
    )
    html = html.replace("<body>", f'<body data-compare-count="{compare_count}">', 1)
    return HTMLResponse(html)


def _finder_budget_band_from_price(value: float | None) -> str | None:
    if value is None:
        return None
    if value < 3_000_000:
        return "lt_3m"
    if value < 6_000_000:
        return "3m_6m"
    if value < 10_000_000:
        return "6m_10m"
    return "gt_10m"


def _finder_preference_tags(prop: Property) -> list[str]:
    values: list[str] = []
    features = prop.features if isinstance(prop.features, dict) else {}
    for key in ["tags", "amenities", "highlights", "lifestyle"]:
        raw = features.get(key)
        if isinstance(raw, list):
            values.extend(str(item or "").strip().lower() for item in raw)
    for value in [prop.property_type, prop.furnishing, prop.view]:
        text = str(value or "").strip().lower()
        if text:
            values.append(text)
    haystack = " ".join(values)
    tags: set[str] = set()
    if "sea" in haystack and "view" in haystack:
        tags.add("sea_view")
    if "beach" in haystack:
        tags.add("near_beach")
    if "pet" in haystack:
        tags.add("pet_friendly")
    if "park" in haystack:
        tags.add("parking")
    if "furnished" in haystack or str(prop.furnishing or "").strip().lower() == "fully_furnished":
        tags.add("furnished")
    floor = prop.floor if prop.floor is not None else prop.floor_number
    if floor is not None and floor >= 20:
        tags.add("high_floor")
    return sorted(tags)


def _build_smart_finder_candidates(locale: str, request: Request, db: Session) -> list[dict]:
    rows = db.scalars(
        select(Property)
        .where(Property.deleted_at.is_(None), Property.status == "active")
        .order_by(desc(Property.updated_at), desc(Property.created_at))
        .limit(120)
    ).all()
    if not rows:
        return []

    area_ids = [row.area_id for row in rows if row.area_id is not None]
    project_ids = [row.project_id for row in rows if row.project_id is not None]
    area_lookup: dict[str, str] = {}
    project_lookup: dict[str, str] = {}

    if area_ids:
        area_rows = db.scalars(
            select(Area).where(Area.id.in_(area_ids), Area.deleted_at.is_(None))
        ).all()
        area_lookup = {
            str(row.id): str(row.name or "").strip()
            for row in area_rows
            if str(row.name or "").strip()
        }

    if project_ids:
        project_rows = db.scalars(
            select(Project).where(Project.id.in_(project_ids), Project.deleted_at.is_(None))
        ).all()
        project_lookup = {
            str(row.id): str(row.name or "").strip()
            for row in project_rows
            if str(row.name or "").strip()
        }

    out: list[dict] = []
    for row in rows:
        price_value: float | None = None
        try:
            price_value = float(row.price) if row.price is not None else None
        except (TypeError, ValueError, InvalidOperation):
            price_value = None
        out.append(
            {
                "id": str(row.id),
                "slug": str(row.slug or row.id),
                "href": f"/{locale}/property/{_property_ref_for_route(row)}",
                "title": _property_title_for_locale(row, locale),
                "description": _property_description_for_locale(row, locale)
                or (
                    "Property details pending publication."
                    if locale == "en"
                    else "รายละเอียดทรัพย์รอเผยแพร่"
                ),
                "media": _property_media_path(row, request=request),
                "price_text": _format_money(row.price, fallback="-"),
                "price_value": price_value,
                "budget_band": _finder_budget_band_from_price(price_value),
                "intent_tags": (
                    ["rent"] if str(row.type or "").strip() == "rent" else ["buy", "invest"]
                ),
                "preference_tags": _finder_preference_tags(row),
                "stats": " • ".join(_property_stats(row)) or "-",
                "area": area_lookup.get(str(row.area_id), str(row.city or "").strip() or "-"),
                "project": project_lookup.get(str(row.project_id), "-"),
            }
        )
    return out


def _smart_finder_runtime(
    *, locale: str, request: Request, db: Session
) -> tuple[dict[str, str], str]:
    selected_intent = str(request.query_params.get("intent") or "").strip().lower()
    if selected_intent not in {"buy", "rent", "invest", "sell"}:
        selected_intent = ""
    selected_matching_mode = (
        str(request.query_params.get("matching_mode") or "").strip().lower() or "weighted"
    )
    if selected_matching_mode not in {"weighted", "strict"}:
        selected_matching_mode = "weighted"

    copy = {
        "title": "Smart Finder",
        "intro": "A guided public route that narrows the next step before consultation.",
        "lead": "Choose the path that matches your goal, then continue to consultation or published inventory.",
        "step_budget": "Step 1: Budget",
        "step_purpose": "Step 2: Purpose",
        "step_timeline": "Step 3: Timeline",
        "step_preferences": "Step 4: Preferences",
        "budget": "Budget range",
        "purpose": "Purpose",
        "timeline": "Timeline",
        "preferences": "Preferences",
        "matching_mode": "Matching mode",
        "matching_weighted": "Weighted shortlist",
        "matching_strict": "Strict match",
        "select_budget": "Select budget",
        "select_timeline": "Select timeline",
        "budget_lt_3m": "Below THB 3M",
        "budget_3m_6m": "THB 3M - 6M",
        "budget_6m_10m": "THB 6M - 10M",
        "budget_gt_10m": "Above THB 10M",
        "purpose_buy": "Buy",
        "purpose_buy_note": "Focus on ownership fit, budget, and legal next steps.",
        "purpose_rent": "Rent",
        "purpose_rent_note": "Filter for move-in timing, budget band, and lifestyle needs.",
        "purpose_invest": "Invest",
        "purpose_invest_note": "Shortlist yield-focused opportunities and next-step review.",
        "purpose_sell": "Sell",
        "purpose_sell_note": "Prepare pricing context, asset facts, and launch readiness.",
        "timeline_0_3m": "0-3 months",
        "timeline_3_6m": "3-6 months",
        "timeline_6m_plus": "6+ months",
        "pref_sea_view": "Sea view",
        "pref_near_beach": "Near beach",
        "pref_high_floor": "High floor",
        "pref_furnished": "Furnished",
        "pref_pet_friendly": "Pet friendly",
        "pref_parking": "Parking",
        "back": "Back",
        "next": "Next step",
        "show_results": "Show shortlist",
        "required_error": "Please complete this step before continuing.",
        "loading": "Matching listings to your inputs...",
        "runtime_error": "Unable to process Smart Finder right now. Please retry.",
        "summary_title": "Result summary",
        "summary_intro": "Your guided inputs are mapped below. Continue with shortlist or consultation.",
        "score_label": "Match score",
        "results_title": "Shortlisted matches",
        "results_empty": "No matches for the current criteria. Adjust filters or request consultation.",
        "empty_hint": "No exact matches yet. We can still prepare an assisted shortlist from current inventory.",
        "adjust": "Adjust filters",
        "shortlist_cta": "Request consultation with this shortlist",
        "compare_cta": "Compare shortlisted units",
        "view_details": "View details",
        "browse_projects": "Browse published projects",
        "sell_cta": "Go to Sell flow",
    }
    if locale == "th":
        copy.update(
            {
                "intro": "เส้นทาง public แบบ guided เพื่อคัด step ถัดไปก่อนเข้าสู่ consultation",
                "lead": "เลือกเส้นทางที่ตรงกับเป้าหมายของคุณ แล้วไปต่อที่ consultation หรือ inventory ที่เผยแพร่",
                "step_budget": "ขั้นตอน 1: งบประมาณ",
                "step_purpose": "ขั้นตอน 2: วัตถุประสงค์",
                "step_timeline": "ขั้นตอน 3: ไทม์ไลน์",
                "step_preferences": "ขั้นตอน 4: ความต้องการ",
                "budget": "ช่วงงบประมาณ",
                "purpose": "วัตถุประสงค์",
                "timeline": "ไทม์ไลน์",
                "preferences": "ความต้องการ",
                "matching_mode": "โหมดการคัดเลือก",
                "matching_weighted": "ถ่วงน้ำหนัก",
                "matching_strict": "ตรงเงื่อนไขแบบ strict",
                "select_budget": "เลือกงบประมาณ",
                "select_timeline": "เลือกไทม์ไลน์",
                "budget_lt_3m": "ต่ำกว่า 3 ล้านบาท",
                "budget_3m_6m": "3 - 6 ล้านบาท",
                "budget_6m_10m": "6 - 10 ล้านบาท",
                "budget_gt_10m": "มากกว่า 10 ล้านบาท",
                "purpose_buy": "ซื้อ",
                "purpose_buy_note": "โฟกัสความเหมาะสมในการถือครอง งบ และขั้นตอนกฎหมาย",
                "purpose_rent": "เช่า",
                "purpose_rent_note": "คัดตามช่วงย้ายเข้า งบ และไลฟ์สไตล์การอยู่อาศัย",
                "purpose_invest": "ลงทุน",
                "purpose_invest_note": "คัด shortlist การลงทุนพร้อมบริบทความเสี่ยง",
                "purpose_sell": "ขาย",
                "purpose_sell_note": "เตรียมบริบทด้านราคาและความพร้อมก่อนปล่อยขาย",
                "timeline_0_3m": "0-3 เดือน",
                "timeline_3_6m": "3-6 เดือน",
                "timeline_6m_plus": "6 เดือนขึ้นไป",
                "pref_sea_view": "วิวทะเล",
                "pref_near_beach": "ใกล้หาด",
                "pref_high_floor": "ชั้นสูง",
                "pref_furnished": "พร้อมเฟอร์นิเจอร์",
                "pref_pet_friendly": "เลี้ยงสัตว์ได้",
                "pref_parking": "ที่จอดรถ",
                "back": "ย้อนกลับ",
                "next": "ขั้นตอนถัดไป",
                "show_results": "ดู shortlist",
                "required_error": "กรุณากรอกข้อมูลขั้นตอนนี้ก่อนดำเนินการต่อ",
                "loading": "กำลังจับคู่รายการตามเงื่อนไขของคุณ...",
                "runtime_error": "ยังไม่สามารถประมวลผล Smart Finder ได้ กรุณาลองใหม่",
                "summary_title": "สรุปผลการคัดกรอง",
                "summary_intro": "สรุปเงื่อนไขที่เลือกไว้ และไปต่อที่ shortlist หรือ consultation ได้ทันที",
                "score_label": "คะแนนความตรงเงื่อนไข",
                "results_title": "รายการที่คัดได้",
                "results_empty": "ยังไม่พบรายการที่ตรงเงื่อนไข กรุณาปรับตัวกรองหรือขอคำปรึกษา",
                "empty_hint": "แม้ยังไม่ตรงทั้งหมด ทีมงานยังช่วยจัด shortlist จาก inventory ล่าสุดให้ได้",
                "adjust": "ปรับตัวกรอง",
                "shortlist_cta": "ขอคำปรึกษาพร้อม shortlist นี้",
                "compare_cta": "เปรียบเทียบยูนิตที่คัดได้",
                "view_details": "ดูรายละเอียด",
                "browse_projects": "ดูโครงการที่เผยแพร่",
                "sell_cta": "ไปที่ขั้นตอนการขาย",
            }
        )

    candidates = _build_smart_finder_candidates(locale, request, db)
    candidates_json = json.dumps(candidates, ensure_ascii=False).replace("</", "<\\/")

    styles = (
        "<style>"
        ".finder-stepper{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:1fr}"
        ".finder-step{padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff}"
        ".finder-step[aria-current='step']{border-color:#0f6d5a;box-shadow:0 0 0 1px rgba(15,109,90,.2)}"
        ".finder-form{display:grid;gap:12px}.finder-fieldset{display:grid;gap:8px;border:1px solid #d1d5db;border-radius:12px;padding:12px}"
        ".finder-fieldset legend{font-weight:700;padding:0 6px}.finder-options{display:grid;gap:10px}"
        ".finder-options label{display:grid;gap:4px;padding:10px;border:1px solid #d1d5db;border-radius:10px}"
        ".finder-actions{display:flex;gap:10px;flex-wrap:wrap}.finder-results-grid{display:grid;gap:12px;grid-template-columns:1fr}"
        "@media (min-width:768px){.finder-stepper{grid-template-columns:repeat(2,minmax(0,1fr))}.finder-results-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.finder-stepper{grid-template-columns:repeat(4,minmax(0,1fr))}.finder-results-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.finder-results-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.finder-results-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )

    body = (
        f"{styles}"
        f'<section class="card"><h2>{escape(copy["title"])}</h2><p>{escape(copy["lead"])}</p></section>'
        '<section class="card">'
        '<ol id="finder-stepper" class="finder-stepper" aria-label="Smart Finder Steps">'
        f'<li class="finder-step" data-step-index="0" data-step-key="budget" aria-current="step">{escape(copy["step_budget"])}</li>'
        f'<li class="finder-step" data-step-index="1" data-step-key="purpose" aria-current="false">{escape(copy["step_purpose"])}</li>'
        f'<li class="finder-step" data-step-index="2" data-step-key="timeline" aria-current="false">{escape(copy["step_timeline"])}</li>'
        f'<li class="finder-step" data-step-index="3" data-step-key="preferences" aria-current="false">{escape(copy["step_preferences"])}</li>'
        "</ol>"
        '<form id="finder-form" class="finder-form" novalidate>'
        f'<fieldset class="finder-fieldset" data-finder-step="0"><legend>{escape(copy["budget"])}</legend><label for="finder-budget">{escape(copy["budget"])}</label><select id="finder-budget" name="budget" required><option value="">{escape(copy["select_budget"])}</option><option value="lt_3m">{escape(copy["budget_lt_3m"])}</option><option value="3m_6m">{escape(copy["budget_3m_6m"])}</option><option value="6m_10m">{escape(copy["budget_6m_10m"])}</option><option value="gt_10m">{escape(copy["budget_gt_10m"])}</option></select></fieldset>'
        f'<fieldset class="finder-fieldset" data-finder-step="1" hidden><legend>{escape(copy["purpose"])}</legend><div class="finder-options"><label for="finder-purpose-buy"><input id="finder-purpose-buy" type="radio" name="purpose" value="buy" required /><span><strong>{escape(copy["purpose_buy"])}</strong></span><span>{escape(copy["purpose_buy_note"])}</span></label><label for="finder-purpose-rent"><input id="finder-purpose-rent" type="radio" name="purpose" value="rent" required /><span><strong>{escape(copy["purpose_rent"])}</strong></span><span>{escape(copy["purpose_rent_note"])}</span></label><label for="finder-purpose-invest"><input id="finder-purpose-invest" type="radio" name="purpose" value="invest" required /><span><strong>{escape(copy["purpose_invest"])}</strong></span><span>{escape(copy["purpose_invest_note"])}</span></label><label for="finder-purpose-sell"><input id="finder-purpose-sell" type="radio" name="purpose" value="sell" required /><span><strong>{escape(copy["purpose_sell"])}</strong></span><span>{escape(copy["purpose_sell_note"])}</span></label></div></fieldset>'
        f'<fieldset class="finder-fieldset" data-finder-step="2" hidden><legend>{escape(copy["timeline"])}</legend><label for="finder-timeline">{escape(copy["timeline"])}</label><select id="finder-timeline" name="timeline" required><option value="">{escape(copy["select_timeline"])}</option><option value="0_3m">{escape(copy["timeline_0_3m"])}</option><option value="3_6m">{escape(copy["timeline_3_6m"])}</option><option value="6m_plus">{escape(copy["timeline_6m_plus"])}</option></select></fieldset>'
        f'<fieldset class="finder-fieldset" data-finder-step="3" hidden><legend>{escape(copy["preferences"])}</legend><div class="finder-options"><label for="finder-pref-sea-view"><input id="finder-pref-sea-view" type="checkbox" name="preferences" value="sea_view" /><span>{escape(copy["pref_sea_view"])}</span></label><label for="finder-pref-near-beach"><input id="finder-pref-near-beach" type="checkbox" name="preferences" value="near_beach" /><span>{escape(copy["pref_near_beach"])}</span></label><label for="finder-pref-high-floor"><input id="finder-pref-high-floor" type="checkbox" name="preferences" value="high_floor" /><span>{escape(copy["pref_high_floor"])}</span></label><label for="finder-pref-furnished"><input id="finder-pref-furnished" type="checkbox" name="preferences" value="furnished" /><span>{escape(copy["pref_furnished"])}</span></label><label for="finder-pref-pet-friendly"><input id="finder-pref-pet-friendly" type="checkbox" name="preferences" value="pet_friendly" /><span>{escape(copy["pref_pet_friendly"])}</span></label><label for="finder-pref-parking"><input id="finder-pref-parking" type="checkbox" name="preferences" value="parking" /><span>{escape(copy["pref_parking"])}</span></label></div><label for="finder-matching-mode">{escape(copy["matching_mode"])}</label><select id="finder-matching-mode" name="matching_mode"><option value="weighted"{" selected" if selected_matching_mode == "weighted" else ""}>{escape(copy["matching_weighted"])}</option><option value="strict"{" selected" if selected_matching_mode == "strict" else ""}>{escape(copy["matching_strict"])}</option></select></fieldset>'
        f'<div class="finder-actions"><button id="finder-back" class="btn btn-secondary-hero" type="button">{escape(copy["back"])}</button><button id="finder-next" class="btn btn-secondary-hero" type="button">{escape(copy["next"])}</button><button id="finder-submit" class="btn" type="submit" hidden>{escape(copy["show_results"])}</button></div>'
        '<p id="finder-status" class="muted" role="status" aria-live="polite"></p>'
        "</form>"
        f'<div id="finder-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="finder-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        "</section>"
        f'<section id="finder-summary" class="card" hidden><h2>{escape(copy["summary_title"])}</h2><p>{escape(copy["summary_intro"])}</p><ul id="finder-summary-list"></ul><div class="finder-actions"><a id="finder-shortlist-cta" class="btn" data-event="finder_consultation_cta_click" data-placement="finder_summary" data-cta-id="finder_shortlist_consultation" href="/{locale}/contact?intent=consultation&source=smart-finder">{escape(copy["shortlist_cta"])}</a><a id="finder-compare-cta" class="btn btn-secondary-hero" data-event="finder_compare_cta_click" data-placement="finder_summary" data-cta-id="finder_compare_shortlist" href="/{locale}/compare">{escape(copy["compare_cta"])}</a></div></section>'
        f'<section id="finder-empty" class="card" hidden><h2>{escape(copy["results_empty"])}</h2><p>{escape(copy["empty_hint"])}</p><div class="finder-actions"><button id="finder-adjust-btn" class="btn btn-secondary-hero" type="button" data-event="finder_adjust_filters_click" data-placement="finder_empty" data-cta-id="finder_adjust">{escape(copy["adjust"])}</button><a class="btn" data-event="finder_consultation_cta_click" data-placement="finder_empty" data-cta-id="finder_empty_consultation" href="/{locale}/contact?intent=consultation&source=smart-finder">{escape(copy["shortlist_cta"])}</a><a id="finder-sell-cta" class="btn btn-secondary-hero" data-event="finder_sell_cta_click" data-placement="finder_empty" data-cta-id="finder_sell_flow" href="/{locale}/sell?intent=sell">{escape(copy["sell_cta"])}</a></div></section>'
        f'<section id="finder-results" class="card" hidden><h2>{escape(copy["results_title"])}</h2><div id="finder-results-grid" class="finder-results-grid"></div><div class="finder-actions"><a class="btn btn-secondary-hero" href="/{locale}/projects">{escape(copy["browse_projects"])}</a></div></section>'
        f'<script id="finder-candidates-data" type="application/json">{candidates_json}</script>'
    )

    body += _smart_finder_script(
        locale=locale,
        selected_intent=selected_intent,
        selected_matching_mode=selected_matching_mode,
        copy=copy,
    )
    return copy, body


def _smart_finder_script(
    *,
    locale: str,
    selected_intent: str,
    selected_matching_mode: str,
    copy: dict[str, str],
) -> str:
    return f"""
<script>
(() => {{
  const locale = document.documentElement.lang || 'en';
  const endpoint = '/api/v1/events';
  const path = location.pathname;
  const selectedIntent = {selected_intent!r};
  const selectedMatchingMode = {selected_matching_mode!r};
  const candidates = JSON.parse(document.getElementById('finder-candidates-data')?.textContent || '[]');
  const form = document.getElementById('finder-form');
  const summaryEl = document.getElementById('finder-summary');
  const summaryList = document.getElementById('finder-summary-list');
  const emptyEl = document.getElementById('finder-empty');
  const resultsEl = document.getElementById('finder-results');
  const resultsGrid = document.getElementById('finder-results-grid');
  const statusEl = document.getElementById('finder-status');
  const loadingEl = document.getElementById('finder-loading');
  const errorEl = document.getElementById('finder-error');
  const shortlistCta = document.getElementById('finder-shortlist-cta');
  const compareCta = document.getElementById('finder-compare-cta');
  const sellCta = document.getElementById('finder-sell-cta');
  const backBtn = document.getElementById('finder-back');
  const nextBtn = document.getElementById('finder-next');
  const submitBtn = document.getElementById('finder-submit');
  const steps = Array.from(document.querySelectorAll('[data-finder-step]'));
  const stepItems = Array.from(document.querySelectorAll('[data-step-index]'));
  let step = 0;
  const scoring = {{
    weights: {{ budget: 40, purpose: 35, timeline: 10, preferences: 15 }},
    minScore: 40,
  }};
  function compact(raw){{const out={{}};for(const [k,v] of Object.entries(raw||{{}})){{if(v===undefined||v===null)continue;if(Array.isArray(v)&&v.length===0)continue;out[k]=v;}}return out;}}
  function track(eventName,payload){{const payloadBody=compact(payload);const sourceBody=compact({{app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement}});return fetch(endpoint,{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{event_name:eventName,source:sourceBody,payload:payloadBody}}),keepalive:true}}).catch(()=>null);}}
  function stepName(idx){{const node=stepItems[idx];return node?.getAttribute('data-step-key')||String(idx+1);}}
  function setStep(nextStep, shouldTrack) {{
    step = Math.max(0, Math.min(nextStep, steps.length - 1));
    steps.forEach((node, idx) => {{ node.hidden = idx !== step; }});
    stepItems.forEach((node, idx) => {{ node.setAttribute('aria-current', idx === step ? 'step' : 'false'); }});
    if (backBtn instanceof HTMLButtonElement) backBtn.disabled = step === 0;
    if (nextBtn instanceof HTMLButtonElement) nextBtn.hidden = step >= steps.length - 1;
    if (submitBtn instanceof HTMLButtonElement) submitBtn.hidden = step < steps.length - 1;
    const firstInput = steps[step]?.querySelector('input,select,textarea');
    if (firstInput instanceof HTMLElement) firstInput.focus();
    if (shouldTrack) track('finder_step_progress', {{ placement: 'smart_finder_steps', step: step + 1, step_name: stepName(step), intent: readData().purpose || undefined }});
  }}
  function readData() {{
    if (!(form instanceof HTMLFormElement)) return {{budget:'',purpose:'',timeline:'',preferences:[],matching_mode:'weighted'}};
    const data = new FormData(form);
    return {{
      budget: String(data.get('budget') || '').trim(),
      purpose: String(data.get('purpose') || '').trim(),
      timeline: String(data.get('timeline') || '').trim(),
      preferences: data.getAll('preferences').map((item) => String(item || '').trim()).filter(Boolean),
      matching_mode: String(data.get('matching_mode') || 'weighted').trim() || 'weighted',
    }};
  }}
  function validateStep() {{
    const data = readData();
    let target = null;
    if (step === 0 && !data.budget) target = form?.querySelector('[name="budget"]');
    if (step === 1 && !data.purpose) target = form?.querySelector('[name="purpose"]');
    if (step === 2 && !data.timeline) target = form?.querySelector('[name="timeline"]');
    if (target instanceof HTMLElement) {{
      target.focus();
      target.setAttribute('aria-invalid', 'true');
      if (statusEl instanceof HTMLElement) statusEl.textContent = {copy["required_error"]!r};
      track('finder_step_progress', {{ placement: 'smart_finder_steps', step: step + 1, step_name: stepName(step), status: 'validation_error' }});
      return false;
    }}
    if (statusEl instanceof HTMLElement) statusEl.textContent = '';
    return true;
  }}
  function budgetMatch(item, selected) {{ if (!selected) return true; if (!item?.budget_band) return true; return item.budget_band === selected; }}
  function intentMatch(item, selected) {{ if (!selected) return true; if (selected === 'sell') return false; const tags = Array.isArray(item?.intent_tags) ? item.intent_tags : []; return tags.includes(selected); }}
  function timelineMatch(item, selected) {{
    if (!selected) return true;
    const type = String(item?.type || '').toLowerCase();
    if (selected === '0_3m') return type === 'rent' || type === 'resale';
    if (selected === '3_6m') return type === 'new' || type === 'resale' || type === 'rent';
    return type === 'new' || type === 'resale';
  }}
  function preferenceStats(item, selected) {{
    if (!Array.isArray(selected) || selected.length === 0) return {{ matchedCount: 0, ratio: 1, strictMatch: true }};
    const tags = Array.isArray(item?.preference_tags) ? item.preference_tags : [];
    const matchedCount = selected.filter((tag) => tags.includes(tag)).length;
    return {{
      matchedCount,
      ratio: selected.length > 0 ? matchedCount / selected.length : 1,
      strictMatch: matchedCount === selected.length,
    }};
  }}
  function scoreItem(item, data) {{
    const budgetMatched = budgetMatch(item, data.budget);
    const purposeMatched = intentMatch(item, data.purpose);
    const timelineMatched = timelineMatch(item, data.timeline);
    const pref = preferenceStats(item, data.preferences);
    let score = 0;
    if (budgetMatched) score += scoring.weights.budget;
    if (purposeMatched) score += scoring.weights.purpose;
    if (timelineMatched) score += scoring.weights.timeline;
    score += Math.round(scoring.weights.preferences * pref.ratio);
    return {{
      score,
      budgetMatched,
      purposeMatched,
      timelineMatched,
      preferencesStrictMatched: pref.strictMatch,
      item,
    }};
  }}
  function selectMatches(data) {{
    const ranked = candidates.map((item) => scoreItem(item, data));
    const strictMode = data.matching_mode === 'strict';
    const filtered = ranked.filter((entry) => {{
      if (data.purpose === 'sell') return false;
      if (!entry.purposeMatched) return false;
      if (strictMode) return entry.budgetMatched && entry.timelineMatched && entry.preferencesStrictMatched;
      return entry.score >= scoring.minScore;
    }});
    filtered.sort((a,b) => b.score - a.score || Number(a.item?.price_value || 0) - Number(b.item?.price_value || 0));
    return filtered.slice(0, 8);
  }}
  function renderSummary(data, count, topScore) {{
    if (!(summaryList instanceof HTMLElement)) return;
    const purposeLabel = {{ buy: {copy["purpose_buy"]!r}, rent: {copy["purpose_rent"]!r}, invest: {copy["purpose_invest"]!r}, sell: {copy["purpose_sell"]!r} }}[data.purpose] || '-';
    const budgetLabel = {{ lt_3m: {copy["budget_lt_3m"]!r}, '3m_6m': {copy["budget_3m_6m"]!r}, '6m_10m': {copy["budget_6m_10m"]!r}, gt_10m: {copy["budget_gt_10m"]!r} }}[data.budget] || '-';
    const timelineLabel = {{ '0_3m': {copy["timeline_0_3m"]!r}, '3_6m': {copy["timeline_3_6m"]!r}, '6m_plus': {copy["timeline_6m_plus"]!r} }}[data.timeline] || '-';
    const modeLabel = data.matching_mode === 'strict' ? {copy["matching_strict"]!r} : {copy["matching_weighted"]!r};
    summaryList.innerHTML = '<li><strong>' + {copy["budget"]!r} + ':</strong> ' + budgetLabel + '</li>'
      + '<li><strong>' + {copy["purpose"]!r} + ':</strong> ' + purposeLabel + '</li>'
      + '<li><strong>' + {copy["timeline"]!r} + ':</strong> ' + timelineLabel + '</li>'
      + '<li><strong>' + {copy["preferences"]!r} + ':</strong> ' + ((data.preferences || []).join(', ') || '-') + '</li>'
      + '<li><strong>' + {copy["matching_mode"]!r} + ':</strong> ' + modeLabel + '</li>'
      + '<li><strong>' + {copy["score_label"]!r} + ':</strong> ' + String(topScore) + '</li>'
      + '<li><strong>' + {copy["results_title"]!r} + ':</strong> ' + String(count) + '</li>';
  }}
  function renderResults(matches) {{
    if (!(resultsGrid instanceof HTMLElement)) return;
    resultsGrid.innerHTML = matches.map((entry) => {{
      const item = entry.item || {{}};
      return '<article class="card" data-card-id="' + String(item.id || '') + '" data-card-slug="' + String(item.slug || '') + '"><img class="media" src="' + String(item.media || '/media/placeholders/image-fallback.webp') + '" alt="' + String(item.title || 'Property') + '" width="640" height="360" loading="lazy" /><h3>' + String(item.title || 'Property') + '</h3><p class="muted"><strong>' + {copy["score_label"]!r} + ':</strong> ' + String(entry.score || 0) + '</p><p class="muted">' + String(item.price_text || '-') + ' • ' + String(item.stats || '-') + '</p><p class="muted">' + String(item.area || '-') + ' • ' + String(item.project || '-') + '</p><p>' + String(item.description || '') + '</p><a class="btn btn-secondary-hero btn-sm" data-event="finder_result_card_click" data-placement="finder_results" data-cta-id="finder_result_card" data-card-id="' + String(item.id || '') + '" data-card-slug="' + String(item.slug || '') + '" href="' + String(item.href || '#') + '">' + {copy["view_details"]!r} + '</a></article>';
    }}).join('');
  }}
  function runFinder() {{
    if (loadingEl instanceof HTMLElement) loadingEl.hidden = false;
    if (errorEl instanceof HTMLElement) errorEl.hidden = true;
    const data = readData();
    requestAnimationFrame(() => {{
      try {{
        const matches = selectMatches(data);
        const topScore = matches.length ? matches[0].score : 0;
        renderSummary(data, matches.length, topScore);
        if (summaryEl instanceof HTMLElement) summaryEl.hidden = false;
        const query = new URLSearchParams();
        query.set('intent', 'consultation');
        query.set('source', 'smart-finder');
        if (data.purpose) query.set('purpose', data.purpose);
        if (data.budget) query.set('budget', data.budget);
        if (data.timeline) query.set('timeline', data.timeline);
        if (data.preferences.length) query.set('preferences', data.preferences.join(','));
        query.set('matching_mode', data.matching_mode);
        query.set('shortlist_count', String(matches.length));
        if (shortlistCta instanceof HTMLAnchorElement) shortlistCta.href = '/' + locale + '/contact?' + query.toString();
        const compareIds = matches.slice(0, 4).map((entry) => String(entry.item?.slug || '')).filter(Boolean).join(',');
        if (compareCta instanceof HTMLAnchorElement) compareCta.href = '/' + locale + '/compare' + (compareIds ? ('?ids=' + encodeURIComponent(compareIds)) : '');
        if (sellCta instanceof HTMLAnchorElement) sellCta.href = '/' + locale + '/sell?intent=sell&timeline=' + encodeURIComponent(data.timeline || '');
        if (data.purpose === 'sell' || matches.length === 0) {{
          if (resultsEl instanceof HTMLElement) resultsEl.hidden = true;
          if (emptyEl instanceof HTMLElement) emptyEl.hidden = false;
          renderResults([]);
          track('finder_no_matches', {{ placement: 'smart_finder_results', intent: data.purpose || undefined, matching_mode: data.matching_mode, filter_values: ['budget:' + data.budget, 'timeline:' + data.timeline] }});
        }} else {{
          renderResults(matches);
          if (resultsEl instanceof HTMLElement) resultsEl.hidden = false;
          if (emptyEl instanceof HTMLElement) emptyEl.hidden = true;
          track('finder_shortlist_generated', {{ placement: 'smart_finder_results', intent: data.purpose || undefined, matching_mode: data.matching_mode, shortlist_count: matches.length, top_score: topScore }});
        }}
      }} catch {{
        if (errorEl instanceof HTMLElement) errorEl.hidden = false;
      }} finally {{
        if (loadingEl instanceof HTMLElement) loadingEl.hidden = true;
      }}
    }});
  }}
  document.querySelectorAll('[data-event]').forEach((node)=>{{node.addEventListener('click',()=>{{const eventName=node.getAttribute('data-event');if(!eventName)return;const current=readData();track(eventName,compact({{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,card_id:node.getAttribute('data-card-id')||undefined,card_slug:node.getAttribute('data-card-slug')||undefined,intent:current.purpose||undefined,matching_mode:current.matching_mode||undefined}}));}});}});
  form?.querySelectorAll('input,select').forEach((node)=>{{node.addEventListener('change',()=>{{node.setAttribute('aria-invalid','false');}});}});
  backBtn?.addEventListener('click',()=>{{ if(step<=0)return; setStep(step-1,true); }});
  nextBtn?.addEventListener('click',()=>{{ if(!validateStep()) return; setStep(step+1,true); }});
  form?.addEventListener('submit',(event)=>{{ event.preventDefault(); if(!validateStep()) return; runFinder(); }});
  document.getElementById('finder-adjust-btn')?.addEventListener('click',()=>{{ setStep(0,true); }});
  if (selectedIntent && form instanceof HTMLFormElement) {{
    const input = form.querySelector('input[name="purpose"][value="' + selectedIntent + '"]');
    if (input instanceof HTMLInputElement) input.checked = true;
  }}
  if (form instanceof HTMLFormElement) {{
    const mode = form.querySelector('[name="matching_mode"]');
    if (mode instanceof HTMLSelectElement) mode.value = selectedMatchingMode || 'weighted';
  }}
  window.addEventListener('error',()=>{{if(errorEl instanceof HTMLElement)errorEl.hidden=false;}});
  setStep(0,false);
  track('finder_step_progress', {{ placement: 'smart_finder_steps', step: 1, step_name: stepName(0), intent: selectedIntent || undefined }});
}})();
</script>
"""


def _compare_requested_tokens(request: Request) -> list[str]:
    tokens: list[str] = []
    for raw in request.query_params.getlist("ids"):
        tokens.extend(str(raw or "").split(","))
    for key in ["id", "property", "slug"]:
        for raw in request.query_params.getlist(key):
            tokens.extend(str(raw or "").split(","))
    out: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        value = str(token or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out[:8]


def _property_source_media_paths(prop: Property) -> list[str]:
    paths: list[str] = []
    for value in [prop.cover_image_url, prop.cover_image]:
        text = str(value or "").strip()
        if text.startswith("/media/"):
            paths.append(text)
    for payload in [prop.local_images, prop.images]:
        if not isinstance(payload, list):
            continue
        for value in payload:
            text = str(value or "").strip()
            if text.startswith("/media/"):
                paths.append(text)
    out: list[str] = []
    seen: set[str] = set()
    for path in paths:
        if path in seen:
            continue
        seen.add(path)
        out.append(path)
    return out


def _domain_from_url(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        parsed = urlparse(raw)
        return str(parsed.hostname or "").strip().lower()
    except ValueError:
        return ""


def _resolved_source_meta_for_compare(
    prop: Property, media_lookup: dict[str, MediaAsset | None]
) -> tuple[str, str]:
    source_meta = prop.source_meta if isinstance(prop.source_meta, dict) else {}
    source_domain = str(source_meta.get("source_domain") or "").strip().lower()
    source_url = str(source_meta.get("source_url") or "").strip()
    source_raw = str(source_meta.get("source") or "").strip()
    rights_status = str(source_meta.get("rights_status") or "").strip().lower()

    if not source_domain:
        source_domain = _domain_from_url(source_url)
    if not source_domain:
        source_domain = _domain_from_url(source_raw)

    if not source_domain or not rights_status:
        for path in _property_source_media_paths(prop):
            asset = media_lookup.get(path)
            if asset is None:
                continue
            if not source_domain:
                source_domain = str(asset.source_domain or "").strip().lower()
            if not rights_status:
                rights_status = str(asset.rights_status or "").strip().lower()
            if source_domain and rights_status:
                break

    if not source_domain:
        source_domain = "flowbiz.com" if _property_source_media_paths(prop) else "unknown"
    if not rights_status:
        rights_status = "pending_review"

    return source_domain, rights_status


def _compare_runtime(
    *, locale: str, request: Request, db: Session
) -> tuple[dict[str, str], str, int]:
    copy = {
        "title": "Compare Listings",
        "intro": "Side-by-side comparison for active listings with safe fallback values.",
        "lead": "Compare ownership-ready listings with clear pricing and key unit facts.",
        "empty": "No listings were selected for comparison. Add units from Smart Finder or listing pages.",
        "empty_hint": "Select at least 2 active listings to see side-by-side differences.",
        "cta_smart_finder": "Open Smart Finder",
        "cta_consult": "Request Consultation",
        "cta_adjust": "Adjust Compare Set",
        "mobile_rows": "Collapsed rows (mobile)",
        "desktop_table": "Comparison table (desktop)",
        "loading": "Preparing comparison...",
        "runtime_error": "Unable to render comparison right now. Please retry.",
        "field_price": "Price",
        "field_bedrooms": "Bedrooms",
        "field_bathrooms": "Bathrooms",
        "field_size": "Size (sqm)",
        "field_type": "Listing type",
        "field_property_type": "Property type",
        "field_floor": "Floor",
        "field_area": "Area",
        "field_project": "Project",
        "field_updated": "Updated",
        "field_source": "Source",
        "field_rights": "Rights status",
        "na": "-",
        "rights_pending": "pending_review",
        "stats_pending": "Stats pending publication",
        "view_details": "View details",
    }
    if locale == "th":
        copy.update(
            {
                "title": "เปรียบเทียบรายการ",
                "intro": "หน้าเปรียบเทียบแบบ side-by-side สำหรับรายการ active พร้อม fallback ที่ปลอดภัย",
                "lead": "เปรียบเทียบรายการพร้อมถือครองด้วยราคาและข้อมูลยูนิตที่อ่านง่าย",
                "empty": "ยังไม่มีรายการที่เลือกมาเปรียบเทียบ เพิ่มยูนิตจาก Smart Finder หรือหน้ารายการก่อน",
                "empty_hint": "เลือกรายการ active อย่างน้อย 2 รายการเพื่อแสดงผลเปรียบเทียบ",
                "cta_smart_finder": "เปิด Smart Finder",
                "cta_consult": "ขอคำปรึกษา",
                "cta_adjust": "ปรับชุดเปรียบเทียบ",
                "mobile_rows": "แถวแบบยุบได้ (มือถือ)",
                "desktop_table": "ตารางเปรียบเทียบ (เดสก์ท็อป)",
                "loading": "กำลังเตรียมข้อมูลเปรียบเทียบ...",
                "runtime_error": "ยังไม่สามารถแสดงหน้าเปรียบเทียบได้ กรุณาลองใหม่",
                "field_price": "ราคา",
                "field_bedrooms": "ห้องนอน",
                "field_bathrooms": "ห้องน้ำ",
                "field_size": "ขนาด (ตร.ม.)",
                "field_type": "ประเภทรายการ",
                "field_property_type": "ประเภททรัพย์",
                "field_floor": "ชั้น",
                "field_area": "ทำเล",
                "field_project": "โครงการ",
                "field_updated": "อัปเดต",
                "field_source": "แหล่งข้อมูล",
                "field_rights": "สถานะสิทธิ์",
                "rights_pending": "pending_review",
                "stats_pending": "รอเผยแพร่ข้อมูลสถิติ",
                "view_details": "ดูรายละเอียด",
            }
        )

    tokens = _compare_requested_tokens(request)
    rows = db.scalars(
        select(Property)
        .where(Property.deleted_at.is_(None), Property.status == "active")
        .order_by(desc(Property.updated_at), desc(Property.created_at))
        .limit(80)
    ).all()
    by_slug = {str(row.slug or ""): row for row in rows if str(row.slug or "").strip()}
    by_id = {str(row.id): row for row in rows}
    selected_rows: list[Property] = []
    if tokens:
        for token in tokens:
            row = by_slug.get(token) or by_id.get(token)
            if row is None or row in selected_rows:
                continue
            selected_rows.append(row)
    else:
        selected_rows = rows[:4]
    selected_rows = selected_rows[:6]

    area_ids = [row.area_id for row in selected_rows if row.area_id is not None]
    project_ids = [row.project_id for row in selected_rows if row.project_id is not None]
    area_lookup: dict[str, str] = {}
    project_lookup: dict[str, str] = {}
    if area_ids:
        area_rows = db.scalars(
            select(Area).where(Area.id.in_(area_ids), Area.deleted_at.is_(None))
        ).all()
        area_lookup = {
            str(row.id): str(row.name or "").strip()
            for row in area_rows
            if str(row.name or "").strip()
        }
    if project_ids:
        project_rows = db.scalars(
            select(Project).where(Project.id.in_(project_ids), Project.deleted_at.is_(None))
        ).all()
        project_lookup = {
            str(row.id): str(row.name or "").strip()
            for row in project_rows
            if str(row.name or "").strip()
        }

    media_paths = {
        path
        for prop in selected_rows
        for path in _property_source_media_paths(prop)
        if path.startswith("/media/")
    }
    media_lookup: dict[str, MediaAsset | None] = {}
    if media_paths:
        media_rows = db.scalars(
            select(MediaAsset).where(MediaAsset.storage_path.in_(list(media_paths)))
        ).all()
        media_lookup = {str(row.storage_path): row for row in media_rows}

    items: list[dict[str, str]] = []
    for row in selected_rows:
        source_domain, rights_status = _resolved_source_meta_for_compare(row, media_lookup)
        size_text = (
            f"{float(row.size_sqm):,.0f}"
            if row.size_sqm is not None
            else f"{float(row.size):,.0f}"
            if row.size is not None
            else copy["na"]
        )
        floor_text = (
            str(row.floor)
            if row.floor is not None
            else str(row.floor_number)
            if row.floor_number is not None
            else copy["na"]
        )
        items.append(
            {
                "id": str(row.id),
                "slug": str(row.slug or row.id),
                "title": _property_title_for_locale(row, locale),
                "media": _property_media_path(row, request=request),
                "href": f"/{locale}/property/{_property_ref_for_route(row)}",
                "price": _format_money(row.price, fallback=copy["na"]),
                "bedrooms": str(row.bedrooms) if row.bedrooms is not None else copy["na"],
                "bathrooms": str(row.bathrooms) if row.bathrooms is not None else copy["na"],
                "size": size_text,
                "type": str(row.type or "").strip() or copy["na"],
                "property_type": str(row.property_type or "").strip() or copy["na"],
                "floor": floor_text,
                "area": area_lookup.get(str(row.area_id), copy["na"]),
                "project": project_lookup.get(str(row.project_id), copy["na"]),
                "updated": _format_locale_date(row.updated_at, locale, fallback=copy["na"]),
                "source": source_domain or copy["na"],
                "rights": rights_status or copy["rights_pending"],
                "stats": " • ".join(_property_stats(row)) or copy["stats_pending"],
            }
        )

    body = _compare_body(locale=locale, copy=copy, items=items)
    return copy, body, len(items)


def _compare_body(*, locale: str, copy: dict[str, str], items: list[dict[str, str]]) -> str:
    has_rows = bool(items)
    fields = [
        ("field_price", "price"),
        ("field_bedrooms", "bedrooms"),
        ("field_bathrooms", "bathrooms"),
        ("field_size", "size"),
        ("field_type", "type"),
        ("field_property_type", "property_type"),
        ("field_floor", "floor"),
        ("field_area", "area"),
        ("field_project", "project"),
        ("field_updated", "updated"),
        ("field_source", "source"),
        ("field_rights", "rights"),
    ]
    table_header = "".join(
        f'<th scope="col"><span>{escape(item["title"])}</span><a class="btn btn-secondary-hero btn-sm" data-event="compare_usage" data-placement="compare_header" data-cta-id="compare_header_view_details" data-card-id="{escape(item["id"])}" data-card-slug="{escape(item["slug"])}" href="{escape(item["href"])}">{escape(copy["view_details"])}</a></th>'
        for item in items
    )
    table_rows = "".join(
        "<tr>"
        f'<th scope="row">{escape(copy[label_key])}</th>'
        + "".join(f"<td>{escape(item[value_key])}</td>" for item in items)
        + "</tr>"
        for label_key, value_key in fields
    )
    mobile_rows = "".join(
        '<details class="card compare-row-collapse" data-event="compare_usage" data-placement="compare_mobile_rows" data-cta-id="compare_toggle_row">'
        f"<summary>{escape(copy[label_key])}</summary><ul>"
        + "".join(
            f"<li><strong>{escape(item['title'])}</strong>: {escape(item[value_key])}</li>"
            for item in items
        )
        + "</ul></details>"
        for label_key, value_key in fields
    )
    compare_cards = "".join(
        f'<article class="card compare-item" data-card-id="{escape(item["id"])}" data-card-slug="{escape(item["slug"])}"><img class="media" src="{escape(item["media"])}" alt="{escape(item["title"])}" width="640" height="360" loading="lazy" /><h2>{escape(item["title"])}</h2><p class="muted">{escape(item["price"])} • {escape(item["stats"])}</p><div class="cta-row"><a class="btn btn-secondary-hero btn-sm" data-event="compare_usage" data-placement="compare_cards" data-cta-id="compare_card_view_details" data-card-id="{escape(item["id"])}" data-card-slug="{escape(item["slug"])}" href="{escape(item["href"])}">{escape(copy["view_details"])}</a></div></article>'
        for item in items
    )

    compare_styles = (
        "<style>"
        ".compare-cards{display:grid;gap:12px;grid-template-columns:1fr}.compare-table-wrap{overflow-x:auto}"
        ".compare-table{width:100%;border-collapse:collapse;min-width:700px}.compare-table th,.compare-table td{border:1px solid #d1d5db;padding:10px;text-align:left;vertical-align:top;background:#fff}"
        ".compare-table thead th{position:sticky;top:0;z-index:3;background:#f9fafb}.compare-table tbody th{position:sticky;left:0;z-index:2;background:#f9fafb;min-width:170px}"
        ".compare-mobile{display:grid;gap:12px}.compare-row-collapse summary{cursor:pointer;font-weight:700}.compare-row-collapse ul{margin:8px 0 0;padding-left:18px;display:grid;gap:6px}"
        "@media (max-width:767px){.compare-desktop{display:none}}"
        "@media (min-width:768px){.compare-mobile{display:none}.compare-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.compare-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.compare-cards{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.compare-cards{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )

    compare_script = """
<script>
(() => {
  const locale = document.documentElement.lang || 'en';
  const endpoint = '/api/v1/events';
  const path = location.pathname;
  const compareCount = Number(document.body.getAttribute('data-compare-count') || '0');
  const runtimeErrorEl = document.getElementById('compare-error');
  function compact(raw){const out={};for(const [k,v] of Object.entries(raw||{})){if(v===undefined||v===null)continue;if(Array.isArray(v)&&v.length===0)continue;out[k]=v;}return out;}
  function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}
  track('compare_usage',{placement:'compare_page',compare_count:compareCount});
  document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,compact({label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,card_id:node.getAttribute('data-card-id')||undefined,card_slug:node.getAttribute('data-card-slug')||undefined,compare_count:compareCount}));});});
  window.addEventListener('error',()=>{if(runtimeErrorEl instanceof HTMLElement)runtimeErrorEl.hidden=false;});
})();
</script>
"""

    consult_href = f"/{locale}/contact?intent=consultation&source=compare"
    compare_ids = ",".join(item["slug"] for item in items if item["slug"])
    adjust_href = (
        f"/{locale}/compare?ids={escape(compare_ids)}" if compare_ids else f"/{locale}/compare"
    )
    content = (
        f'<section class="card"><h2>{escape(copy["lead"])}</h2><div class="cta-row"><a class="btn" data-event="compare_consultation_cta_click" data-placement="compare_hero" data-cta-id="compare_consultation_hero" href="{consult_href}">{escape(copy["cta_consult"])}</a><a class="btn btn-secondary-hero" data-event="compare_usage" data-placement="compare_hero" data-cta-id="compare_open_smart_finder" href="/{locale}/smart-finder">{escape(copy["cta_smart_finder"])}</a></div></section>'
        f'<div id="compare-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="compare-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
    )
    if not has_rows:
        content += f'<section id="compare-empty" class="card"><h2>{escape(copy["empty"])}</h2><p>{escape(copy["empty_hint"])}</p><div class="cta-row"><a class="btn" data-event="compare_consultation_cta_click" data-placement="compare_empty" data-cta-id="compare_consultation_empty" href="{consult_href}">{escape(copy["cta_consult"])}</a><a class="btn btn-secondary-hero" data-event="compare_usage" data-placement="compare_empty" data-cta-id="compare_empty_smart_finder" href="/{locale}/smart-finder">{escape(copy["cta_smart_finder"])}</a></div></section>'
    else:
        content += (
            f'<section class="compare-cards">{compare_cards}</section>'
            f'<section class="card compare-desktop"><h2>{escape(copy["desktop_table"])}</h2><div class="compare-table-wrap"><table class="compare-table" id="compare-table"><thead><tr><th scope="col">Field</th>{table_header}</tr></thead><tbody>{table_rows}</tbody></table></div></section>'
            f'<section class="compare-mobile"><h2>{escape(copy["mobile_rows"])}</h2>{mobile_rows}</section>'
            f'<section class="card"><div class="cta-row"><a class="btn" data-event="compare_consultation_cta_click" data-placement="compare_footer" data-cta-id="compare_consultation_footer" href="{consult_href}">{escape(copy["cta_consult"])}</a><a class="btn btn-secondary-hero" data-event="compare_usage" data-placement="compare_footer" data-cta-id="compare_adjust_set" href="{adjust_href}">{escape(copy["cta_adjust"])}</a></div></section>'
        )
    return f"{compare_styles}{content}{compare_script}"


def _area_copy(locale: str) -> dict[str, str]:
    copy = {
        "page_title": "Area Guide",
        "page_intro": "Published area content, conversion CTAs, and internal links mapped to listings and projects.",
        "breadcrumb_home": "Home",
        "breadcrumb_hub": "Area Guide",
        "listing_title": "Explore Pattaya Areas",
        "listing_intro": "Use this hub to compare neighborhoods, view verified context, and continue to listings or consultation.",
        "listing_empty": "No published areas are available yet. TODO: publish area cards with approved media and summary.",
        "listing_summary_pending": "Area summary pending publication. TODO: publish approved area summary.",
        "listing_metrics_pending": "Metrics pending verified source note and update timestamp.",
        "listing_source_guard": "Source note is required before publishing hard metric claims.",
        "listing_metric_projects": "Published projects",
        "listing_metric_price": "Avg price / sqm",
        "listing_metric_roi": "Avg ROI",
        "listing_metric_updated": "Updated",
        "listing_view_area": "View area guide",
        "listing_browse_projects": "Browse projects in this area",
        "listing_consult": "Consult about this area",
        "loading": "Loading area content...",
        "runtime_error": "A runtime error occurred. Please refresh and retry.",
        "overview_title": "Overview",
        "overview_map": "Map context",
        "overview_map_pending": "Map coordinates are pending publication. TODO: attach verified coordinates in admin.",
        "overview_open_map": "Open map context",
        "why_title": "Why live or invest here",
        "why_fallback": "Area fit context is pending publication. TODO: add approved why-live/invest narrative.",
        "stats_title": "Area stats",
        "stats_pending": "Statistics are pending verified source note and update timestamp.",
        "stats_todo": "Publish source note and updated timestamp before showing hard metric claims.",
        "stats_source": "Source",
        "stats_updated": "Updated",
        "stats_as_of": "As of",
        "stats_cadence": "Update cadence",
        "stats_avg_price": "Avg price / sqm",
        "stats_avg_rent": "Avg monthly rent",
        "stats_avg_roi": "Avg ROI",
        "stats_total_projects": "Total projects",
        "stats_total_units": "Total units",
        "projects_title": "Featured projects in this area",
        "projects_empty": "No published projects are linked to this area yet.",
        "projects_cta": "View project details",
        "properties_title": "Featured properties in this area",
        "properties_empty": "No active properties are linked to this area yet.",
        "properties_cta": "View property details",
        "properties_stats_pending": "Property stats pending publication",
        "proximity_title": "Transport, lifestyle, and beach proximity",
        "proximity_transport": "Transport",
        "proximity_lifestyle": "Lifestyle",
        "proximity_beach": "Beach proximity",
        "proximity_transport_pending": "Transport context pending publication. TODO: add verified transit anchors.",
        "proximity_lifestyle_pending": "Lifestyle context pending publication. TODO: add approved neighborhood highlights.",
        "proximity_beach_pending": "Beach proximity context pending publication. TODO: add verified travel-time context.",
        "cta_title": "Next step",
        "cta_intro": "Need a shortlist for this area? Continue to consultation or browse live listings.",
        "cta_consult": "Consult about this area",
        "cta_browse_listings": "Browse listings",
        "cta_back_hub": "Back to Area Guide",
    }
    if locale == "th":
        copy.update(
            {
                "page_title": "คู่มือทำเล",
                "page_intro": "คอนเทนต์ทำเลที่เผยแพร่ พร้อม CTA และลิงก์ภายในไปยังรายการประกาศและโครงการ",
                "breadcrumb_home": "หน้าแรก",
                "breadcrumb_hub": "คู่มือทำเล",
                "listing_title": "สำรวจทำเลพัทยา",
                "listing_intro": "ใช้หน้านี้เพื่อเทียบย่าน ดูบริบทที่ยืนยันแล้ว และไปต่อสู่ listings หรือ consultation",
                "listing_empty": "ยังไม่มีทำเลที่เผยแพร่ TODO: เผยแพร่การ์ดทำเลพร้อมสื่อที่อนุมัติและสรุปเนื้อหา",
                "listing_summary_pending": "ยังไม่มีสรุปทำเลที่เผยแพร่ TODO: เพิ่มสรุปทำเลที่อนุมัติแล้ว",
                "listing_metrics_pending": "สถิติกำลังรอ source note และวันอัปเดตที่ยืนยันแล้ว",
                "listing_source_guard": "ต้องมี source note ก่อนแสดงตัวเลขแบบยืนยัน",
                "listing_metric_projects": "โครงการที่เผยแพร่",
                "listing_metric_price": "ราคาเฉลี่ย / ตร.ม.",
                "listing_metric_roi": "ROI เฉลี่ย",
                "listing_metric_updated": "อัปเดต",
                "listing_view_area": "ดูคู่มือทำเล",
                "listing_browse_projects": "ดูโครงการในทำเลนี้",
                "listing_consult": "ปรึกษาเรื่องทำเลนี้",
                "loading": "กำลังโหลดเนื้อหาทำเล...",
                "runtime_error": "เกิดข้อผิดพลาดระหว่างแสดงผล กรุณารีเฟรชแล้วลองใหม่",
                "overview_title": "ภาพรวม",
                "overview_map": "บริบทแผนที่",
                "overview_map_pending": "ยังไม่มีพิกัดที่เผยแพร่ TODO: เพิ่มพิกัดที่ยืนยันแล้วใน admin",
                "overview_open_map": "เปิดบริบทแผนที่",
                "why_title": "ทำไมควรอยู่อาศัยหรือลงทุนที่นี่",
                "why_fallback": "ยังไม่มีบริบทความเหมาะสมของทำเล TODO: เพิ่มเนื้อหา why-live/invest ที่อนุมัติแล้ว",
                "stats_title": "สถิติทำเล",
                "stats_pending": "สถิติกำลังรอ source note และวันอัปเดตที่ยืนยันแล้ว",
                "stats_todo": "ต้องเผยแพร่ source note และ updated timestamp ก่อนแสดงตัวเลขแบบยืนยัน",
                "stats_source": "แหล่งข้อมูล",
                "stats_updated": "อัปเดต",
                "stats_as_of": "ข้อมูล ณ",
                "stats_cadence": "รอบการอัปเดต",
                "stats_avg_price": "ราคาเฉลี่ย / ตร.ม.",
                "stats_avg_rent": "ค่าเช่าเฉลี่ยต่อเดือน",
                "stats_avg_roi": "ROI เฉลี่ย",
                "stats_total_projects": "จำนวนโครงการ",
                "stats_total_units": "จำนวนยูนิต",
                "projects_title": "โครงการเด่นในทำเลนี้",
                "projects_empty": "ยังไม่มีโครงการที่เผยแพร่ในทำเลนี้",
                "projects_cta": "ดูรายละเอียดโครงการ",
                "properties_title": "ประกาศเด่นในทำเลนี้",
                "properties_empty": "ยังไม่มีประกาศ active ในทำเลนี้",
                "properties_cta": "ดูรายละเอียดประกาศ",
                "properties_stats_pending": "รอเผยแพร่ข้อมูลยูนิต",
                "proximity_title": "บริบทการเดินทาง ไลฟ์สไตล์ และระยะหาด",
                "proximity_transport": "การเดินทาง",
                "proximity_lifestyle": "ไลฟ์สไตล์",
                "proximity_beach": "ระยะใกล้หาด",
                "proximity_transport_pending": "ยังไม่มีบริบทการเดินทาง TODO: เพิ่มจุดเชื่อมต่อคมนาคมที่ยืนยันแล้ว",
                "proximity_lifestyle_pending": "ยังไม่มีบริบทไลฟ์สไตล์ TODO: เพิ่มจุดเด่นย่านที่อนุมัติแล้ว",
                "proximity_beach_pending": "ยังไม่มีบริบทระยะหาด TODO: เพิ่มข้อมูลเวลาเดินทางที่ยืนยันแล้ว",
                "cta_title": "ขั้นตอนถัดไป",
                "cta_intro": "ต้องการ shortlist สำหรับทำเลนี้ไหม ไปต่อที่ consultation หรือ listings ที่เผยแพร่",
                "cta_consult": "ปรึกษาเรื่องทำเลนี้",
                "cta_browse_listings": "ดูรายการประกาศ",
                "cta_back_hub": "กลับหน้าคู่มือทำเล",
            }
        )
    return copy


def _area_page_styles() -> str:
    return (
        "<style>"
        ".crumbs{list-style:none;margin:0;padding:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center}"
        ".crumbs li{display:inline-flex;align-items:center;gap:8px}.crumbs li+li::before{content:'/';color:#6b7280}"
        ".area-grid{display:grid;gap:16px;grid-template-columns:1fr}.area-grid-3{display:grid;gap:16px;grid-template-columns:1fr}"
        ".facts{margin:0;padding-left:18px;display:grid;gap:6px}.area-meta{display:grid;gap:8px}.cta-row{display:flex;gap:10px;flex-wrap:wrap}"
        ".area-overview{display:grid;gap:16px}.area-proximity{display:grid;gap:16px;grid-template-columns:1fr}"
        "@media (min-width:768px){.area-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.area-overview{grid-template-columns:repeat(2,minmax(0,1fr))}.area-proximity{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.area-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}.area-proximity{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.area-grid-3{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.area-grid-3{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )


def _area_tracking_script(*, loading_id: str, error_id: str) -> str:
    return f"""
<script>
(() => {{
  const locale = document.documentElement.lang || 'en';
  const path = location.pathname;
  const endpoint = '/api/v1/events';
  const loadingEl = document.getElementById('{loading_id}');
  const runtimeErrorEl = document.getElementById('{error_id}');
  function compact(raw){{const out={{}};for(const [k,v] of Object.entries(raw||{{}})){{if(v===undefined||v===null)continue;if(Array.isArray(v)&&v.length===0)continue;out[k]=v;}}return out;}}
  function track(eventName,payload){{const payloadBody=compact(payload);const sourceBody=compact({{app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement}});return fetch(endpoint,{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{event_name:eventName,source:sourceBody,payload:payloadBody}}),keepalive:true}}).catch(()=>null);}}
  document.querySelectorAll('[data-event]').forEach((node)=>{{node.addEventListener('click',()=>{{const eventName=node.getAttribute('data-event');if(!eventName)return;const loadingTarget=node.getAttribute('data-loading-target');if(loadingTarget&&loadingEl instanceof HTMLElement&&loadingEl.id===loadingTarget)loadingEl.hidden=false;track(eventName,compact({{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,area_slug:node.getAttribute('data-area-slug')||undefined,card_slug:node.getAttribute('data-card-slug')||undefined}}));}});}});
  window.addEventListener('error',()=>{{if(runtimeErrorEl instanceof HTMLElement)runtimeErrorEl.hidden=false;}});
}})();
</script>
"""


def _area_text_value(value: object, locale: str) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        localized = _localized_dict_text(value, locale)
        if localized:
            return localized
        for key in ["text", "body", "summary", "description", "value", "label", "title"]:
            if key in value:
                candidate = _area_text_value(value.get(key), locale)
                if candidate:
                    return candidate
        for nested in value.values():
            candidate = _area_text_value(nested, locale)
            if candidate:
                return candidate
        return ""
    if isinstance(value, list):
        parts = [_area_text_value(item, locale) for item in value]
        return " ".join(part for part in parts if part).strip()
    return " ".join(str(value).split())


def _area_content_text(content: object, locale: str, keys: list[str]) -> str:
    if not isinstance(content, dict):
        return ""
    containers: list[dict] = [content]
    locale_payload = content.get(locale)
    if isinstance(locale_payload, dict):
        containers.insert(0, locale_payload)
    for fallback_locale in ["en", "th"]:
        payload = content.get(fallback_locale)
        if isinstance(payload, dict):
            containers.append(payload)
    for key in keys:
        for container in containers:
            if key in container:
                text = _area_text_value(container.get(key), locale)
                if text:
                    return text
    return ""


def _area_metrics_cadence(content: object, locale: str) -> str:
    return _area_content_text(
        content, locale, ["metrics_update_cadence", "update_cadence", "cadence"]
    )


def _has_verified_area_metrics(source_note: str, cadence: str, stat: AreaStatistic | None) -> bool:
    if stat is None:
        return False
    return bool(source_note and cadence and (stat.updated_at or stat.as_of_date))


def _area_stats_lookup(db: Session, area_ids: list[UUID]) -> dict[str, AreaStatistic]:
    if not area_ids:
        return {}
    stat_rows = db.scalars(select(AreaStatistic).where(AreaStatistic.area_id.in_(area_ids))).all()
    return {str(item.area_id): item for item in stat_rows}


def _render_area_card(
    *,
    locale: str,
    request: Request,
    row: Area,
    copy: dict[str, str],
    stat: AreaStatistic | None,
    project_count: int,
) -> str:
    media = _safe_media_url(
        row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request
    )
    summary = _localized_dict_text(row.summary, locale) or copy["listing_summary_pending"]
    source_note = " ".join(str(row.source_note or "").split())
    cadence_text = _area_metrics_cadence(row.content, locale)
    metrics_verified = _has_verified_area_metrics(source_note, cadence_text, stat)

    metric_rows: list[str] = []
    if metrics_verified and stat is not None:
        total_projects = stat.total_projects if stat.total_projects is not None else project_count
        if total_projects:
            metric_rows.append(
                f"<li><strong>{escape(copy['listing_metric_projects'])}:</strong> {int(total_projects):,}</li>"
            )
        if stat.avg_price_sqm is not None:
            metric_rows.append(
                f"<li><strong>{escape(copy['listing_metric_price'])}:</strong> {escape(_format_money(stat.avg_price_sqm, fallback='-'))}</li>"
            )
        if stat.avg_roi_percent is not None:
            metric_rows.append(
                f"<li><strong>{escape(copy['listing_metric_roi'])}:</strong> {float(stat.avg_roi_percent):.1f}%</li>"
            )
        if stat.updated_at is not None:
            metric_rows.append(
                f"<li><strong>{escape(copy['listing_metric_updated'])}:</strong> {escape(stat.updated_at.strftime('%Y-%m-%d'))}</li>"
            )
    if not metric_rows:
        metric_rows = [f"<li>{escape(copy['listing_metrics_pending'])}</li>"]

    detail_href = f"/{locale}/areas/{row.slug}"
    browse_href = f"/{locale}/projects?{urlencode({'area': row.slug})}"
    consult_href = f"/{locale}/contact?{urlencode({'intent': 'consultation', 'area': row.slug})}"
    source_html = (
        f'<p class="muted"><strong>{escape(copy["stats_source"])}:</strong> {escape(source_note)}</p>'
        if source_note
        else f'<p class="muted">{escape(copy["listing_source_guard"])}</p>'
    )
    return (
        f'<article class="card"><img class="media" src="{escape(media)}" alt="{escape(row.name)}" width="640" height="360" loading="lazy" />'
        f'<h2>{escape(row.name)}</h2><p>{escape(summary)}</p><ul class="facts">{"".join(metric_rows)}</ul>{source_html}'
        f'<div class="cta-row"><a class="btn" data-event="area_card_click" data-placement="area_guide_grid" data-cta-id="area_card_primary" data-card-slug="{escape(row.slug)}" data-area-slug="{escape(row.slug)}" data-loading-target="area-guide-loading" href="{detail_href}">{escape(copy["listing_view_area"])}</a>'
        f'<a class="btn btn-secondary-hero" data-event="area_cta_click" data-placement="area_guide_grid" data-cta-id="area_card_browse_projects" data-area-slug="{escape(row.slug)}" data-loading-target="area-guide-loading" href="{browse_href}">{escape(copy["listing_browse_projects"])}</a>'
        f'<a class="btn btn-secondary-hero" data-event="area_cta_click" data-placement="area_guide_grid" data-cta-id="area_card_consult" data-area-slug="{escape(row.slug)}" data-loading-target="area-guide-loading" href="{consult_href}">{escape(copy["listing_consult"])}</a></div></article>'
    )


def _render_area_detail_body(
    *,
    locale: str,
    request: Request,
    row: Area,
    copy: dict[str, str],
    summary: str,
    stat: AreaStatistic | None,
    projects: list[Project],
    properties: list[Property],
) -> str:
    media = _safe_media_url(
        row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request
    )
    source_note = " ".join(str(row.source_note or "").split())
    cadence_text = _area_metrics_cadence(row.content, locale)
    metrics_verified = _has_verified_area_metrics(source_note, cadence_text, stat)

    why_text = (
        _area_content_text(
            row.content,
            locale,
            [
                "why_live_invest",
                "why_live_here",
                "why_invest_here",
                "why",
                "investment_thesis",
                "live_invest",
            ],
        )
        or copy["why_fallback"]
    )
    transport_text = (
        _area_content_text(row.content, locale, ["transport", "transport_proximity"])
        or copy["proximity_transport_pending"]
    )
    lifestyle_text = (
        _area_content_text(row.content, locale, ["lifestyle", "lifestyle_proximity"])
        or copy["proximity_lifestyle_pending"]
    )
    beach_text = (
        _area_content_text(row.content, locale, ["beach", "beach_proximity"])
        or copy["proximity_beach_pending"]
    )

    project_cards = (
        "".join(
            f'<article class="card"><img class="media" src="{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}" alt="{escape(item.name)}" width="640" height="360" loading="lazy" /><h3>{escape(item.name)}</h3><p class="muted">{escape(_format_money(item.starting_price, fallback="-"))}</p><a class="btn" data-event="area_cta_click" data-placement="area_detail_projects" data-cta-id="area_project_card" data-area-slug="{escape(row.slug)}" data-loading-target="area-detail-loading" href="/{locale}/projects/{escape(item.slug)}">{escape(copy["projects_cta"])}</a></article>'
            for item in projects
        )
        or f'<div class="card">{escape(copy["projects_empty"])}</div>'
    )

    property_cards = (
        "".join(
            f'<article class="card"><img class="media" src="{escape(_safe_media_url(item.cover_image_url or item.cover_image, _DEFAULT_MEDIA_FALLBACK, request=request))}" alt="{escape(_property_title_for_locale(item, locale))}" width="640" height="360" loading="lazy" /><h3>{escape(_property_title_for_locale(item, locale))}</h3><p class="muted">{escape(_format_money(item.price, fallback="-"))} • {escape(" • ".join(_localized_property_stats(item, locale)) or copy["properties_stats_pending"])}</p><a class="btn" data-event="area_cta_click" data-placement="area_detail_properties" data-cta-id="area_property_card" data-area-slug="{escape(row.slug)}" data-loading-target="area-detail-loading" href="/{locale}/property/{escape(item.slug or str(item.id))}">{escape(copy["properties_cta"])}</a></article>'
            for item in properties
        )
        or f'<div class="card">{escape(copy["properties_empty"])}</div>'
    )

    stats_rows: list[str] = []
    stats_meta: list[str] = []
    if metrics_verified and stat is not None:
        if stat.avg_price_sqm is not None:
            stats_rows.append(
                f"<li><strong>{escape(copy['stats_avg_price'])}:</strong> {escape(_format_money(stat.avg_price_sqm, fallback='-'))}</li>"
            )
        if stat.avg_rent_monthly is not None:
            stats_rows.append(
                f"<li><strong>{escape(copy['stats_avg_rent'])}:</strong> {escape(_format_money(stat.avg_rent_monthly, fallback='-'))}</li>"
            )
        if stat.avg_roi_percent is not None:
            stats_rows.append(
                f"<li><strong>{escape(copy['stats_avg_roi'])}:</strong> {float(stat.avg_roi_percent):.1f}%</li>"
            )
        if stat.total_projects is not None:
            stats_rows.append(
                f"<li><strong>{escape(copy['stats_total_projects'])}:</strong> {int(stat.total_projects):,}</li>"
            )
        if stat.total_units is not None:
            stats_rows.append(
                f"<li><strong>{escape(copy['stats_total_units'])}:</strong> {int(stat.total_units):,}</li>"
            )
        if source_note:
            stats_meta.append(
                f'<p class="muted"><strong>{escape(copy["stats_source"])}:</strong> {escape(source_note)}</p>'
            )
        if stat.updated_at is not None:
            stats_meta.append(
                f'<p class="muted"><strong>{escape(copy["stats_updated"])}:</strong> {escape(stat.updated_at.strftime("%Y-%m-%d"))}</p>'
            )
        if stat.as_of_date is not None:
            stats_meta.append(
                f'<p class="muted"><strong>{escape(copy["stats_as_of"])}:</strong> {escape(stat.as_of_date.isoformat())}</p>'
            )
        stats_meta.append(
            f'<p class="muted"><strong>{escape(copy["stats_cadence"])}:</strong> {escape(cadence_text)}</p>'
        )
    if not stats_rows:
        stats_rows = [f"<li>{escape(copy['stats_pending'])}</li>"]
    if not stats_meta:
        stats_meta = [f'<p class="muted">{escape(copy["stats_todo"])}</p>']

    lat, lng = _extract_lat_lng(row.map_center if isinstance(row.map_center, dict) else {})
    if lat is not None and lng is not None:
        map_html = (
            f'<p class="muted">{escape(f"Lat {lat:.6f}, Lng {lng:.6f}")}</p>'
            f'<a class="btn" data-event="area_cta_click" data-placement="area_detail_overview" data-cta-id="area_open_map" data-area-slug="{escape(row.slug)}" href="https://maps.google.com/?q={lat:.6f},{lng:.6f}" target="_blank" rel="noopener">{escape(copy["overview_open_map"])}</a>'
        )
    else:
        map_html = f'<p class="muted">{escape(copy["overview_map_pending"])}</p>'

    consult_href = f"/{locale}/contact?{urlencode({'intent': 'consultation', 'area': row.slug})}"
    browse_href = f"/{locale}/buy?{urlencode({'area': row.slug})}"
    breadcrumb = (
        f'<nav id="area-breadcrumb" class="card" aria-label="Breadcrumb"><ol class="crumbs">'
        f'<li><a href="/{locale}">{escape(copy["breadcrumb_home"])}</a></li>'
        f'<li><a href="/{locale}/area-guide">{escape(copy["breadcrumb_hub"])}</a></li>'
        f'<li aria-current="page">{escape(row.name)}</li></ol></nav>'
    )
    return (
        f"{_area_page_styles()}"
        f"{breadcrumb}"
        f'<div id="area-detail-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="area-detail-runtime-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f'<section id="area-overview" class="card area-overview"><article class="area-meta"><h2>{escape(copy["overview_title"])}</h2><img class="media" src="{escape(media)}" alt="{escape(row.name)}" width="1280" height="720" loading="lazy" /><p>{escape(summary)}</p></article><article class="area-meta"><h3>{escape(copy["overview_map"])}</h3>{map_html}</article></section>'
        f'<section id="area-why-live-invest" class="card"><h2>{escape(copy["why_title"])}</h2><p>{escape(why_text)}</p></section>'
        f'<section id="area-stats" class="card"><h2>{escape(copy["stats_title"])}</h2><ul class="facts">{"".join(stats_rows)}</ul>{"".join(stats_meta)}</section>'
        f'<section id="area-featured-projects" class="stack"><h2>{escape(copy["projects_title"])}</h2><div class="area-grid area-grid-3">{project_cards}</div></section>'
        f'<section id="area-featured-properties" class="stack"><h2>{escape(copy["properties_title"])}</h2><div class="area-grid area-grid-3">{property_cards}</div></section>'
        f'<section id="area-proximity" class="stack"><h2>{escape(copy["proximity_title"])}</h2><div class="area-proximity"><article class="card"><h3>{escape(copy["proximity_transport"])}</h3><p>{escape(transport_text)}</p></article><article class="card"><h3>{escape(copy["proximity_lifestyle"])}</h3><p>{escape(lifestyle_text)}</p></article><article class="card"><h3>{escape(copy["proximity_beach"])}</h3><p>{escape(beach_text)}</p></article></div></section>'
        f'<section id="area-cta" class="card"><h2>{escape(copy["cta_title"])}</h2><p>{escape(copy["cta_intro"])}</p><div class="cta-row"><a class="btn" data-event="area_cta_click" data-placement="area_detail_footer" data-cta-id="area_consult" data-area-slug="{escape(row.slug)}" data-loading-target="area-detail-loading" href="{consult_href}">{escape(copy["cta_consult"])}</a><a class="btn btn-secondary-hero" data-event="area_cta_click" data-placement="area_detail_footer" data-cta-id="area_browse_listings" data-area-slug="{escape(row.slug)}" data-loading-target="area-detail-loading" href="{browse_href}">{escape(copy["cta_browse_listings"])}</a><a class="btn btn-secondary-hero" data-event="area_cta_click" data-placement="area_detail_footer" data-cta-id="area_back_hub" data-area-slug="{escape(row.slug)}" data-loading-target="area-detail-loading" href="/{locale}/area-guide">{escape(copy["cta_back_hub"])}</a></div></section>'
        f"{_area_tracking_script(loading_id='area-detail-loading', error_id='area-detail-runtime-error')}"
    )


def _render_areas_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _area_copy(locale)
    rows = db.scalars(
        select(Area)
        .where(Area.deleted_at.is_(None), Area.status == "published")
        .order_by(Area.name.asc())
        .limit(24)
    ).all()
    project_counts = {
        str(area_id): int(total)
        for area_id, total in db.execute(
            select(Project.area_id, func.count(Project.id))
            .where(
                Project.deleted_at.is_(None),
                Project.status == "published",
                Project.area_id.is_not(None),
            )
            .group_by(Project.area_id)
        ).all()
    }
    stats_by_area = _area_stats_lookup(db, [row.id for row in rows])
    cards: list[str] = []
    for row in rows:
        cards.append(
            _render_area_card(
                locale=locale,
                request=request,
                row=row,
                copy=copy,
                stat=stats_by_area.get(str(row.id)),
                project_count=project_counts.get(str(row.id), 0),
            )
        )
    cards_html = (
        "".join(cards) if cards else f'<div class="card">{escape(copy["listing_empty"])}</div>'
    )
    breadcrumb = (
        f'<nav id="area-breadcrumb" class="card" aria-label="Breadcrumb"><ol class="crumbs">'
        f'<li><a href="/{locale}">{escape(copy["breadcrumb_home"])}</a></li>'
        f'<li aria-current="page">{escape(copy["breadcrumb_hub"])}</li></ol></nav>'
    )
    body = (
        f"{_area_page_styles()}"
        f"{breadcrumb}"
        f'<section id="area-guide-overview" class="card"><h2>{escape(copy["listing_title"])}</h2><p>{escape(copy["listing_intro"])}</p></section>'
        f'<div id="area-guide-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="area-guide-runtime-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f'<section id="area-guide-listing" class="area-grid area-grid-3">{cards_html}</section>'
        f"{_area_tracking_script(loading_id='area-guide-loading', error_id='area-guide-runtime-error')}"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["page_title"],
            intro=copy["page_intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _render_area_detail_page(locale: str, request: Request, db: Session, slug: str) -> HTMLResponse:
    copy = _area_copy(locale)
    row = db.scalar(
        select(Area).where(
            Area.deleted_at.is_(None),
            Area.status == "published",
            Area.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    summary = _localized_dict_text(row.summary, locale) or copy["listing_summary_pending"]
    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == row.id))
    projects = db.scalars(
        select(Project)
        .where(
            Project.deleted_at.is_(None), Project.status == "published", Project.area_id == row.id
        )
        .order_by(desc(Project.updated_at))
        .limit(8)
    ).all()
    properties = db.scalars(
        select(Property)
        .where(Property.status == "active", Property.area_id == row.id)
        .order_by(desc(Property.updated_at), desc(Property.created_at))
        .limit(8)
    ).all()
    body = _render_area_detail_body(
        locale=locale,
        request=request,
        row=row,
        copy=copy,
        summary=summary,
        stat=stat,
        projects=projects,
        properties=properties,
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=row.name,
            intro=summary,
            body=body,
            request=request,
            db=db,
        )
    )


def _developer_copy(locale: str) -> dict[str, str]:
    copy = {
        "page_title": "Developers",
        "page_intro": "Published developer profiles with project links, location focus, and consultation paths.",
        "breadcrumb_home": "Home",
        "breadcrumb_hub": "Developers",
        "listing_title": "Developer Directory",
        "listing_intro": "Review published developer profiles and continue to project details or consultation.",
        "listing_empty": "No active developers are published yet. TODO: publish approved developer cards with profile and local media.",
        "listing_profile_pending": "Developer profile pending publication. TODO: add approved profile/about content.",
        "listing_project_count_pending": "Published project count is pending data sync. TODO: verify project linkage.",
        "listing_project_count_zero": "No published projects linked yet. TODO: link approved published projects to this developer.",
        "listing_project_count_one": "1 published project linked.",
        "listing_project_count_many": "{count} published projects linked.",
        "listing_view_detail": "View developer",
        "listing_browse_projects": "Browse projects",
        "loading": "Loading developer content...",
        "runtime_error": "A runtime error occurred. Please refresh and retry.",
        "overview_title": "Developer profile",
        "projects_title": "Published projects by this developer",
        "projects_empty": "No published projects are linked to this developer yet. TODO: publish or link approved projects.",
        "project_card_cta": "View project details",
        "location_focus_title": "Location focus",
        "location_focus_empty": "Location focus is pending project linkage. TODO: link published projects to approved areas.",
        "location_focus_projects": "{count} published projects",
        "trust_title": "Trust proof",
        "trust_empty": "Trust proof is not published yet. TODO: add approved licenses, awards, or verification records.",
        "cta_title": "Next step",
        "cta_intro": "Need a shortlist from this developer? Continue to consultation or browse published projects.",
        "cta_consult": "Consult about this developer",
        "cta_browse_projects": "Browse developer projects",
        "cta_visit_website": "Visit official website",
    }
    if locale == "th":
        copy.update(
            {
                "page_title": "ผู้พัฒนาโครงการ",
                "page_intro": "โปรไฟล์ผู้พัฒนาที่เผยแพร่ พร้อมลิงก์โครงการ บริบททำเล และเส้นทางปรึกษา",
                "breadcrumb_home": "หน้าแรก",
                "breadcrumb_hub": "ผู้พัฒนาโครงการ",
                "listing_title": "รายชื่อผู้พัฒนา",
                "listing_intro": "ดูโปรไฟล์ผู้พัฒนาที่เผยแพร่ แล้วไปต่อที่รายละเอียดโครงการหรือการปรึกษา",
                "listing_empty": "ยังไม่มีผู้พัฒนาที่เผยแพร่ TODO: เผยแพร่การ์ดผู้พัฒนาพร้อมโปรไฟล์และ local media ที่อนุมัติแล้ว",
                "listing_profile_pending": "ยังไม่มีโปรไฟล์ผู้พัฒนาที่เผยแพร่ TODO: เพิ่มเนื้อหา profile/about ที่อนุมัติแล้ว",
                "listing_project_count_pending": "จำนวนโครงการที่เผยแพร่กำลังรอซิงก์ข้อมูล TODO: ตรวจสอบการเชื่อมโยงโครงการ",
                "listing_project_count_zero": "ยังไม่มีโครงการที่เผยแพร่เชื่อมอยู่ TODO: เชื่อมโครงการที่อนุมัติแล้วกับผู้พัฒนารายนี้",
                "listing_project_count_one": "เชื่อมกับโครงการที่เผยแพร่ 1 โครงการ",
                "listing_project_count_many": "เชื่อมกับโครงการที่เผยแพร่ {count} โครงการ",
                "listing_view_detail": "ดูรายละเอียดผู้พัฒนา",
                "listing_browse_projects": "ดูโครงการ",
                "loading": "กำลังโหลดข้อมูลผู้พัฒนา...",
                "runtime_error": "เกิดข้อผิดพลาดระหว่างแสดงผล กรุณารีเฟรชแล้วลองใหม่",
                "overview_title": "โปรไฟล์ผู้พัฒนา",
                "projects_title": "โครงการที่เผยแพร่ของผู้พัฒนานี้",
                "projects_empty": "ยังไม่มีโครงการที่เผยแพร่เชื่อมกับผู้พัฒนารายนี้ TODO: เผยแพร่หรือเชื่อมโครงการที่อนุมัติแล้ว",
                "project_card_cta": "ดูรายละเอียดโครงการ",
                "location_focus_title": "ทำเลที่ผู้พัฒนานี้โฟกัส",
                "location_focus_empty": "ยังไม่มีบริบททำเลจากโครงการที่เชื่อมโยง TODO: เชื่อมโครงการที่เผยแพร่กับพื้นที่ที่อนุมัติแล้ว",
                "location_focus_projects": "{count} โครงการที่เผยแพร่",
                "trust_title": "หลักฐานความน่าเชื่อถือ",
                "trust_empty": "ยังไม่มีหลักฐานความน่าเชื่อถือที่เผยแพร่ TODO: เพิ่มใบอนุญาต รางวัล หรือข้อมูลยืนยันที่อนุมัติแล้ว",
                "cta_title": "ขั้นตอนถัดไป",
                "cta_intro": "ต้องการ shortlist จากผู้พัฒนานี้หรือไม่ ไปต่อที่ consultation หรือดูโครงการที่เผยแพร่",
                "cta_consult": "ปรึกษาเรื่องผู้พัฒนานี้",
                "cta_browse_projects": "ดูโครงการของผู้พัฒนา",
                "cta_visit_website": "เว็บไซต์ทางการ",
            }
        )
    return copy


def _developer_page_styles() -> str:
    return (
        "<style>"
        ".crumbs{list-style:none;margin:0;padding:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center}"
        ".crumbs li{display:inline-flex;align-items:center;gap:8px}.crumbs li+li::before{content:'/';color:#6b7280}"
        ".developer-grid{display:grid;gap:16px;grid-template-columns:1fr}.cta-row{display:flex;gap:10px;flex-wrap:wrap}"
        ".facts{margin:0;padding-left:18px;display:grid;gap:6px}"
        "@media (min-width:768px){.developer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.developer-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.developer-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.developer-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )


def _developer_tracking_script(*, loading_id: str, error_id: str) -> str:
    return f"""
<script>
(() => {{
  const locale = document.documentElement.lang || 'en';
  const path = location.pathname;
  const endpoint = '/api/v1/events';
  const loadingEl = document.getElementById('{loading_id}');
  const runtimeErrorEl = document.getElementById('{error_id}');
  function compact(raw){{const out={{}};for(const [k,v] of Object.entries(raw||{{}})){{if(v===undefined||v===null)continue;if(Array.isArray(v)&&v.length===0)continue;out[k]=v;}}return out;}}
  function track(eventName,payload){{const payloadBody=compact(payload);const sourceBody=compact({{app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement}});return fetch(endpoint,{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{event_name:eventName,source:sourceBody,payload:payloadBody}}),keepalive:true}}).catch(()=>null);}}
  document.querySelectorAll('[data-event]').forEach((node)=>{{node.addEventListener('click',()=>{{const eventName=node.getAttribute('data-event');if(!eventName)return;const loadingTarget=node.getAttribute('data-loading-target');if(loadingTarget&&loadingEl instanceof HTMLElement&&loadingEl.id===loadingTarget)loadingEl.hidden=false;track(eventName,compact({{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,developer_slug:node.getAttribute('data-developer-slug')||undefined,area_slug:node.getAttribute('data-area-slug')||undefined,card_slug:node.getAttribute('data-card-slug')||undefined}}));}});}});
  window.addEventListener('error',()=>{{if(runtimeErrorEl instanceof HTMLElement)runtimeErrorEl.hidden=false;}});
  window.addEventListener('unhandledrejection',()=>{{if(runtimeErrorEl instanceof HTMLElement)runtimeErrorEl.hidden=false;}});
}})();
</script>
"""


def _developer_project_count_text(*, copy: dict[str, str], project_count: int | None) -> str:
    if project_count is None:
        return copy["listing_project_count_pending"]
    if project_count <= 0:
        return copy["listing_project_count_zero"]
    if project_count == 1:
        return copy["listing_project_count_one"]
    return copy["listing_project_count_many"].format(count=f"{project_count:,}")


def _developer_trust_proof_items(value: object, *, locale: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def push(raw: object, *, prefix: str = "") -> None:
        text = " ".join(str(raw or "").split())
        if not text:
            return
        line = f"{prefix}: {text}" if prefix else text
        key = line.lower()
        if key in seen:
            return
        seen.add(key)
        out.append(line)

    def walk(node: object, *, prefix: str = "", depth: int = 0) -> None:
        if node is None or depth > 4:
            return
        if isinstance(node, dict):
            localized = _localized_dict_text(node, locale)
            if localized and set(node.keys()).issubset({"en", "th"}):
                push(localized, prefix=prefix)
                return
            for key, item in node.items():
                label = " ".join(str(key or "").replace("_", " ").split())
                next_prefix = f"{prefix} / {label}" if prefix and label else (label or prefix)
                walk(item, prefix=next_prefix, depth=depth + 1)
            return
        if isinstance(node, list):
            for item in node:
                walk(item, prefix=prefix, depth=depth + 1)
            return
        push(node, prefix=prefix)

    walk(value)
    return out[:10]


def _developer_location_focus(db: Session, developer_id: UUID) -> list[dict[str, object]]:
    rows = db.execute(
        select(Area.slug, Area.name, func.count(Project.id))
        .select_from(Project)
        .join(Area, Area.id == Project.area_id)
        .where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.developer_id == developer_id,
            Area.deleted_at.is_(None),
            Area.status == "published",
        )
        .group_by(Area.id, Area.slug, Area.name)
        .order_by(desc(func.count(Project.id)), Area.name.asc())
        .limit(8)
    ).all()
    return [
        {"slug": slug, "name": name, "project_count": int(total)}
        for slug, name, total in rows
        if slug and name
    ]


def _render_developers_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _developer_copy(locale)
    rows = db.scalars(
        select(Developer)
        .where(Developer.deleted_at.is_(None), Developer.status == "active")
        .order_by(Developer.name.asc())
        .limit(24)
    ).all()
    project_counts = {
        str(developer_id): int(total)
        for developer_id, total in db.execute(
            select(Project.developer_id, func.count(Project.id))
            .where(
                Project.deleted_at.is_(None),
                Project.status == "published",
                Project.developer_id.is_not(None),
            )
            .group_by(Project.developer_id)
        ).all()
    }
    cards: list[str] = []
    for row in rows:
        media = _safe_media_url(
            row.cover_image_url or row.logo_url, _DEFAULT_MEDIA_FALLBACK, request=request
        )
        profile = (
            _localized_dict_text(row.profile or row.summary, locale)
            or copy["listing_profile_pending"]
        )
        project_count = project_counts.get(str(row.id))
        project_count_text = _developer_project_count_text(copy=copy, project_count=project_count)
        detail_href = f"/{locale}/developers/{row.slug}"
        browse_href = f"/{locale}/projects?{urlencode({'developer': row.slug})}"
        cards.append(
            f'<article class="card">'
            f'<img class="media" src="{escape(media)}" alt="{escape(row.name)}" width="640" height="360" loading="lazy" />'
            f"<h2>{escape(row.name)}</h2><p>{escape(profile)}</p>"
            f'<p class="muted" data-developer-project-count="{escape(row.slug)}">{escape(project_count_text)}</p>'
            f'<div class="cta-row">'
            f'<a class="btn" data-event="developer_card_click" data-placement="developer_listing_grid" data-cta-id="developer_card_primary" data-card-slug="{escape(row.slug)}" data-developer-slug="{escape(row.slug)}" data-loading-target="developer-list-loading" href="{detail_href}">{escape(copy["listing_view_detail"])}</a>'
            f'<a class="btn btn-secondary-hero" data-event="developer_cta_click" data-placement="developer_listing_grid" data-cta-id="developer_card_browse_projects" data-developer-slug="{escape(row.slug)}" data-loading-target="developer-list-loading" href="{browse_href}">{escape(copy["listing_browse_projects"])}</a>'
            f"</div></article>"
        )
    cards_html = (
        "".join(cards)
        if cards
        else f'<div class="card state-empty">{escape(copy["listing_empty"])}</div>'
    )
    breadcrumb = (
        f'<nav id="developer-breadcrumb" class="card" aria-label="Breadcrumb"><ol class="crumbs">'
        f'<li><a href="/{locale}">{escape(copy["breadcrumb_home"])}</a></li>'
        f'<li aria-current="page">{escape(copy["breadcrumb_hub"])}</li></ol></nav>'
    )
    body = (
        f"{_developer_page_styles()}"
        f"{breadcrumb}"
        f'<section id="developer-list-overview" class="card"><h2>{escape(copy["listing_title"])}</h2><p>{escape(copy["listing_intro"])}</p></section>'
        f'<div id="developer-list-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="developer-list-runtime-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f'<section id="developer-listing" class="developer-grid">{cards_html}</section>'
        f"{_developer_tracking_script(loading_id='developer-list-loading', error_id='developer-list-runtime-error')}"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["page_title"],
            intro=copy["page_intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _render_developer_detail_page(
    locale: str, request: Request, db: Session, slug: str
) -> HTMLResponse:
    copy = _developer_copy(locale)
    row = db.scalar(
        select(Developer).where(
            Developer.deleted_at.is_(None),
            Developer.status == "active",
            Developer.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")

    media = _safe_media_url(
        row.cover_image_url or row.logo_url, _DEFAULT_MEDIA_FALLBACK, request=request
    )
    profile = (
        _localized_dict_text(row.profile or row.summary, locale) or copy["listing_profile_pending"]
    )
    projects = db.scalars(
        select(Project)
        .where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.developer_id == row.id,
        )
        .order_by(desc(Project.updated_at))
        .limit(8)
    ).all()
    project_cards = (
        "".join(
            f'<article class="card"><img class="media" src="{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}" alt="{escape(item.name)}" width="640" height="360" loading="lazy" /><h3>{escape(item.name)}</h3><p class="muted">{escape(_format_money(item.starting_price, fallback="-"))}</p><a class="btn" data-event="developer_cta_click" data-placement="developer_detail_projects" data-cta-id="developer_project_card" data-developer-slug="{escape(row.slug)}" data-card-slug="{escape(item.slug)}" data-loading-target="developer-detail-loading" href="/{locale}/projects/{escape(item.slug)}">{escape(copy["project_card_cta"])}</a></article>'
            for item in projects
        )
        or f'<div class="card state-empty">{escape(copy["projects_empty"])}</div>'
    )

    location_focus = _developer_location_focus(db, row.id)
    location_rows_items: list[str] = []
    for item in location_focus:
        area_slug = str(item["slug"])
        area_name = str(item["name"])
        area_project_count = int(item["project_count"])
        project_count_text = copy["location_focus_projects"].format(count=f"{area_project_count:,}")
        location_rows_items.append(
            f'<li><a href="/{locale}/areas/{escape(area_slug)}">{escape(area_name)}</a> <span class="muted">({escape(project_count_text)})</span></li>'
        )
    location_rows = (
        "".join(location_rows_items) or f"<li>{escape(copy['location_focus_empty'])}</li>"
    )

    trust_items = _developer_trust_proof_items(row.trust_proof, locale=locale)
    trust_rows = (
        "".join(f"<li>{escape(item)}</li>" for item in trust_items)
        or f"<li>{escape(copy['trust_empty'])}</li>"
    )

    website_text = str(row.website or "").strip()
    website_html = (
        f'<a class="btn btn-secondary-hero" href="{escape(website_text)}" target="_blank" rel="noopener">{escape(copy["cta_visit_website"])}</a>'
        if website_text
        else ""
    )
    consult_href = (
        f"/{locale}/contact?{urlencode({'intent': 'consultation', 'developer': row.slug})}"
    )
    browse_projects_href = f"/{locale}/projects?{urlencode({'developer': row.slug})}"
    breadcrumb = (
        f'<nav id="developer-breadcrumb" class="card" aria-label="Breadcrumb"><ol class="crumbs">'
        f'<li><a href="/{locale}">{escape(copy["breadcrumb_home"])}</a></li>'
        f'<li><a href="/{locale}/developers">{escape(copy["breadcrumb_hub"])}</a></li>'
        f'<li aria-current="page">{escape(row.name)}</li></ol></nav>'
    )

    body = (
        f"{_developer_page_styles()}"
        f"{breadcrumb}"
        f'<div id="developer-detail-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="developer-detail-runtime-error" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f'<section id="developer-overview" class="card"><h2>{escape(copy["overview_title"])}</h2><img class="media" src="{escape(media)}" alt="{escape(row.name)}" width="1280" height="720" loading="lazy" /><h3>{escape(row.name)}</h3><p>{escape(profile)}</p></section>'
        f'<section id="developer-location-focus" class="card"><h2>{escape(copy["location_focus_title"])}</h2><ul class="facts">{location_rows}</ul></section>'
        f'<section id="developer-trust-proof" class="card"><h2>{escape(copy["trust_title"])}</h2><ul class="facts">{trust_rows}</ul></section>'
        f'<section id="developer-projects" class="stack"><h2>{escape(copy["projects_title"])}</h2><section class="developer-grid">{project_cards}</section></section>'
        f'<section id="developer-cta" class="card"><h2>{escape(copy["cta_title"])}</h2><p>{escape(copy["cta_intro"])}</p><div class="cta-row"><a class="btn" data-event="developer_cta_click" data-placement="developer_detail_footer" data-cta-id="developer_consult" data-developer-slug="{escape(row.slug)}" data-loading-target="developer-detail-loading" href="{consult_href}">{escape(copy["cta_consult"])}</a><a class="btn btn-secondary-hero" data-event="developer_cta_click" data-placement="developer_detail_footer" data-cta-id="developer_browse_projects" data-developer-slug="{escape(row.slug)}" data-loading-target="developer-detail-loading" href="{browse_projects_href}">{escape(copy["cta_browse_projects"])}</a>{website_html}</div></section>'
        f"{_developer_tracking_script(loading_id='developer-detail-loading', error_id='developer-detail-runtime-error')}"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=row.name,
            intro=profile,
            body=body,
            request=request,
            db=db,
        )
    )


def _property_or_404(db: Session, property_ref: str) -> Property:
    ref = str(property_ref or "").strip()
    if not ref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    row = None
    try:
        row = db.get(Property, UUID(ref))
    except ValueError:
        row = db.scalar(select(Property).where(Property.slug == ref))
    if row is None or row.status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return row


def _local_runtime_media_path(value: str | None, *, request: Request) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.startswith("/media/"):
        return raw if _media_file_exists(raw) else None
    if raw.startswith("http://") or raw.startswith("https://"):
        if not _is_allowed_media_url(raw, request=request):
            return None
        try:
            parsed = urlparse(raw)
        except ValueError:
            return None
        path = str(parsed.path or "").strip()
        if path.startswith("/media/") and _media_file_exists(path):
            return path
    return None


def _property_gallery_paths(prop: Property, *, request: Request) -> list[str]:
    candidates: list[str] = []
    for value in [prop.cover_image_url, prop.cover_image]:
        text = str(value or "").strip()
        if text:
            candidates.append(text)
    if isinstance(prop.local_images, list):
        for value in prop.local_images:
            text = str(value or "").strip()
            if text:
                candidates.append(text)
    if isinstance(prop.images, list):
        for value in prop.images:
            text = str(value or "").strip()
            if text:
                candidates.append(text)
    out: list[str] = []
    seen: set[str] = set()
    for value in candidates:
        local_path = _local_runtime_media_path(value, request=request)
        if not local_path or local_path in seen:
            continue
        seen.add(local_path)
        out.append(local_path)
    if not out:
        out.append(_DEFAULT_MEDIA_FALLBACK)
    return out[:8]


def _extract_lat_lng(value: object) -> tuple[float | None, float | None]:
    if not isinstance(value, dict):
        return None, None
    lat_raw = value.get("lat") or value.get("latitude")
    lng_raw = value.get("lng") or value.get("longitude")
    try:
        lat = float(lat_raw) if lat_raw is not None else None
    except (TypeError, ValueError):
        lat = None
    try:
        lng = float(lng_raw) if lng_raw is not None else None
    except (TypeError, ValueError):
        lng = None
    return lat, lng


def _property_feature_items(prop: Property) -> list[str]:
    payload = prop.features if isinstance(prop.features, dict) else {}
    out: list[str] = []
    seen: set[str] = set()

    def push(raw: object) -> None:
        text = " ".join(str(raw or "").strip().split())
        if not text:
            return
        key = text.lower()
        if key in seen:
            return
        seen.add(key)
        out.append(text)

    def collect(value: object) -> None:
        if value is None:
            return
        if isinstance(value, str):
            for part in value.split(","):
                push(part)
            return
        if isinstance(value, (int, float, Decimal)):
            push(value)
            return
        if isinstance(value, list):
            for item in value:
                collect(item)
            return
        if isinstance(value, dict):
            for key in ["label", "name", "title", "value"]:
                if key in value:
                    collect(value.get(key))
            if any(key in value for key in ["label", "name", "title", "value"]):
                return
            for key, nested in value.items():
                if isinstance(nested, bool):
                    if nested:
                        push(str(key).replace("_", " "))
                else:
                    collect(nested)

    for key in ["amenities", "features", "tags", "highlights", "list", "items"]:
        collect(payload.get(key))
    return out[:12]


def _property_detail_copy(locale: str) -> dict[str, str]:
    copy = {
        "status": "Status",
        "status_pending": "Active",
        "description": "Description",
        "description_pending": "Description is pending publication. TODO: publish verified EN/TH copy.",
        "gallery": "Gallery",
        "gallery_note": "Gallery currently shows local media available in this runtime.",
        "gallery_empty": "No approved local media is linked yet. TODO: upload approved local images.",
        "price": "Price",
        "key_stats": "Key Stats",
        "view": "View",
        "view_pending": "View pending publication",
        "bedrooms": "Bedrooms",
        "bathrooms": "Bathrooms",
        "size": "Size",
        "location": "Location",
        "location_fallback": "Map coordinates are pending publication. TODO: attach verified map coordinates.",
        "open_map": "Open map",
        "features": "Features and Amenities",
        "features_fallback": "No published features yet. TODO: add verified amenities/features list.",
        "links": "Project Context",
        "area": "Area",
        "developer": "Developer",
        "project": "Project",
        "book_viewing": "Book Viewing",
        "send_inquiry": "Inquiry",
        "inquiry_section": "Inquiry or Book Viewing",
        "inquiry_intro": "Share your details and we will follow up with the next step.",
        "name": "Name",
        "contact": "WhatsApp or Email",
        "intent": "Intent",
        "intent_inquiry": "Inquiry",
        "intent_viewing": "Book viewing",
        "budget": "Budget range",
        "timeline": "Timeline",
        "message": "Message",
        "viewing_at": "Viewing date and time",
        "viewing_duration": "Viewing duration",
        "guests": "Guests",
        "select_budget": "Select budget",
        "select_timeline": "Select timeline",
        "select_duration": "Select duration",
        "message_placeholder": "Tell us what you need",
        "submit": "Submit",
        "submitting": "Submitting...",
        "submit_success": "Request submitted. We will contact you with the next step.",
        "submit_error": "Unable to submit right now. Please try again.",
        "related": "Related Properties",
        "related_fallback": "Related properties are pending publication. TODO: link matching active inventory.",
        "share": "Share",
        "share_x": "Share on X",
        "share_facebook": "Share on Facebook",
        "share_line": "Share on LINE",
        "copy_link": "Copy link",
        "copy_success": "Link copied.",
        "copy_error": "Unable to copy link.",
        "freshness": "Source Freshness",
        "updated": "Updated",
        "updated_pending": "Update date pending publication",
        "source": "Source",
        "source_url": "Source URL",
        "source_domain": "Source Domain",
        "source_type": "Source Type",
        "rights": "Rights",
        "rights_note": "Rights Note",
        "license_evidence": "License Evidence",
        "source_checked": "Last Checked",
        "source_pending": "Source metadata is pending publication. TODO: attach source and rights metadata in admin.",
        "stats_pending": "Stats pending publication",
        "contact_fallback": "No contact details provided. TODO: publish contact details for this inquiry.",
    }
    if locale == "th":
        copy.update(
            {
                "status": "สถานะ",
                "status_pending": "พร้อมใช้งาน",
                "description": "รายละเอียด",
                "description_pending": "ยังไม่มีรายละเอียดที่เผยแพร่ TODO: เพิ่มคำอธิบาย EN/TH ที่ตรวจสอบแล้ว",
                "gallery": "แกลเลอรี",
                "gallery_note": "แกลเลอรีนี้ใช้เฉพาะ local media ที่มีในระบบตอนนี้",
                "gallery_empty": "ยังไม่มีภาพ local media ที่อนุมัติ TODO: อัปโหลดรูปที่อนุมัติแล้ว",
                "price": "ราคา",
                "key_stats": "สถิติสำคัญ",
                "view": "วิว",
                "view_pending": "รอเผยแพร่ข้อมูลวิว",
                "bedrooms": "ห้องนอน",
                "bathrooms": "ห้องน้ำ",
                "size": "ขนาด",
                "location": "ทำเล",
                "location_fallback": "ยังไม่มีพิกัดแผนที่ที่เผยแพร่ TODO: เพิ่มพิกัดที่ตรวจสอบแล้ว",
                "open_map": "เปิดแผนที่",
                "features": "จุดเด่นและสิ่งอำนวยความสะดวก",
                "features_fallback": "ยังไม่มีข้อมูลจุดเด่นที่เผยแพร่ TODO: เพิ่มรายการ amenities/features ที่ตรวจสอบแล้ว",
                "links": "บริบทโครงการ",
                "area": "ทำเล",
                "developer": "ผู้พัฒนา",
                "project": "โครงการ",
                "book_viewing": "จองนัดเข้าชม",
                "send_inquiry": "สอบถาม",
                "inquiry_section": "สอบถามหรือจองนัดเข้าชม",
                "inquiry_intro": "ส่งรายละเอียดของคุณ แล้วเราจะติดต่อกลับพร้อมขั้นตอนถัดไป",
                "name": "ชื่อ",
                "contact": "WhatsApp หรือ Email",
                "intent": "ความต้องการ",
                "intent_inquiry": "สอบถาม",
                "intent_viewing": "จองนัดเข้าชม",
                "budget": "ช่วงงบประมาณ",
                "timeline": "ไทม์ไลน์",
                "message": "ข้อความ",
                "viewing_at": "วันและเวลานัดเข้าชม",
                "viewing_duration": "ระยะเวลานัดเข้าชม",
                "guests": "จำนวนผู้เข้าชม",
                "select_budget": "เลือกงบประมาณ",
                "select_timeline": "เลือกไทม์ไลน์",
                "select_duration": "เลือกระยะเวลา",
                "message_placeholder": "แจ้งรายละเอียดที่ต้องการ",
                "submit": "ส่งข้อมูล",
                "submitting": "กำลังส่ง...",
                "submit_success": "ส่งคำขอแล้ว เราจะติดต่อกลับพร้อมขั้นตอนถัดไป",
                "submit_error": "ยังไม่สามารถส่งได้ กรุณาลองใหม่อีกครั้ง",
                "related": "ทรัพย์ที่เกี่ยวข้อง",
                "related_fallback": "ทรัพย์ที่เกี่ยวข้องรอเผยแพร่ TODO: เชื่อมรายการ active ที่เกี่ยวข้อง",
                "share": "แชร์",
                "share_x": "แชร์ไป X",
                "share_facebook": "แชร์ไป Facebook",
                "share_line": "แชร์ไป LINE",
                "copy_link": "คัดลอกลิงก์",
                "copy_success": "คัดลอกลิงก์แล้ว",
                "copy_error": "ไม่สามารถคัดลอกลิงก์ได้",
                "freshness": "ความใหม่ของข้อมูล",
                "updated": "อัปเดต",
                "updated_pending": "รอเผยแพร่วันที่อัปเดต",
                "source": "แหล่งข้อมูล",
                "source_url": "ลิงก์แหล่งข้อมูล",
                "source_domain": "โดเมนแหล่งข้อมูล",
                "source_type": "ประเภทแหล่งข้อมูล",
                "rights": "สิทธิการใช้งาน",
                "rights_note": "หมายเหตุสิทธิ์",
                "license_evidence": "หลักฐานสิทธิ์",
                "source_checked": "ตรวจสอบล่าสุด",
                "source_pending": "ยังไม่มี source metadata ที่เผยแพร่ TODO: บันทึก source และ rights ใน admin",
                "stats_pending": "รอเผยแพร่สถิติ",
                "contact_fallback": "ยังไม่มีช่องทางติดต่อ TODO: เพิ่มช่องทางติดต่อที่ตรวจสอบแล้ว",
            }
        )
    return copy


def _property_detail_script(copy: dict[str, str], property_ref: str, property_id: str) -> str:
    return f"""
<script>
(() => {{
  const gallery = document.getElementById('property-gallery');
  if (gallery) {{
    const hero = gallery.querySelector('[data-gallery-hero]');
    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    let activeIndex = Math.max(0, thumbs.findIndex((node) => node.getAttribute('aria-current') === 'true'));
    const setActive = (next, focus) => {{
      if (!thumbs.length || !hero) return;
      activeIndex = (next + thumbs.length) % thumbs.length;
      thumbs.forEach((node, index) => {{
        const selected = index === activeIndex;
        node.classList.toggle('is-active', selected);
        node.setAttribute('aria-current', selected ? 'true' : 'false');
        if (selected) {{
          const src = node.getAttribute('data-src') || '';
          const alt = node.getAttribute('data-alt') || '';
          if (src) hero.setAttribute('src', src);
          if (alt) hero.setAttribute('alt', alt);
          if (focus) node.focus();
        }}
      }});
    }};
    thumbs.forEach((node, index) => {{
      node.addEventListener('click', () => setActive(index, false));
      node.addEventListener('keydown', (event) => {{
        if (event.key === 'Enter' || event.key === ' ') {{
          event.preventDefault();
          setActive(index, false);
        }}
      }});
    }});
    gallery.addEventListener('keydown', (event) => {{
      if (!thumbs.length) return;
      if (event.key === 'ArrowRight') {{
        event.preventDefault();
        setActive(activeIndex + 1, true);
      }} else if (event.key === 'ArrowLeft') {{
        event.preventDefault();
        setActive(activeIndex - 1, true);
      }} else if (event.key === 'Home') {{
        event.preventDefault();
        setActive(0, true);
      }} else if (event.key === 'End') {{
        event.preventDefault();
        setActive(thumbs.length - 1, true);
      }}
    }});
  }}

  const inquiryForm = document.getElementById('property-inquiry-form');
  const intentInput = document.getElementById('property-intent');
  const viewingAtInput = document.getElementById('property-viewing-at');
  const syncViewingRequirement = () => {{
    if (!(intentInput instanceof HTMLSelectElement) || !(viewingAtInput instanceof HTMLInputElement)) return;
    const needsViewing = intentInput.value === 'viewing';
    viewingAtInput.required = needsViewing;
    if (needsViewing) {{
      if (!viewingAtInput.value) {{
        const start = new Date();
        start.setHours(start.getHours() + 24, 9, 0, 0);
        viewingAtInput.value = start.toISOString().slice(0, 16);
      }}
    }}
  }};
  document.querySelectorAll('[data-property-intent]').forEach((node) => {{
    node.addEventListener('click', () => {{
      const intent = node.getAttribute('data-property-intent') || '';
      if (intentInput && intent) {{
        intentInput.value = intent;
        syncViewingRequirement();
      }}
    }});
  }});
  if (intentInput instanceof HTMLSelectElement) {{
    intentInput.addEventListener('change', syncViewingRequirement);
    syncViewingRequirement();
  }}
  if (inquiryForm) {{
    const submitBtn = document.getElementById('property-inquiry-submit');
    const statusEl = document.getElementById('property-form-status');
    const loadingEl = document.getElementById('property-form-loading');
    const errorEl = document.getElementById('property-form-error');
    const successEl = document.getElementById('property-form-success');
    inquiryForm.addEventListener('submit', async (event) => {{
      event.preventDefault();
      if (!submitBtn || !statusEl || !loadingEl || !errorEl || !successEl) return;
      errorEl.hidden = true;
      successEl.hidden = true;
      loadingEl.hidden = false;
      submitBtn.disabled = true;
      statusEl.textContent = '';

      const data = Object.fromEntries(new FormData(inquiryForm).entries());
      const contact = String(data.contact || '').trim();
      const intent = String(data.intent || 'inquiry').trim() || 'inquiry';
      const isEmail = contact.includes('@');
      const userMessage = String(data.message || '').trim();
      const propertyRef = {property_ref!r};
      const propertyId = {property_id!r};
      const mergedMessage = ['Property: ' + propertyRef, userMessage ? 'Message: ' + userMessage : ''].filter(Boolean).join(' | ');

      try {{
        const response = await fetch('/v1/inquiries', {{
          method: 'POST',
          headers: {{ 'content-type': 'application/json' }},
          body: JSON.stringify({{
            name: String(data.name || ''),
            email: isEmail ? contact : null,
            phone: isEmail ? null : contact,
            message: mergedMessage,
            source_page: location.pathname,
            intent,
            budget_band: String(data.budget || ''),
            timeline: String(data.timeline || ''),
            property_id: propertyId,
          }}),
        }});
        if (!response.ok) throw new Error('submit_failed');
        const inquiryBody = await response.json();
        if (intent === 'viewing') {{
          const viewingAtRaw = String(data.viewing_at || '').trim();
          if (!viewingAtRaw) throw new Error('viewing_time_required');
          const viewingAt = new Date(viewingAtRaw);
          if (Number.isNaN(viewingAt.getTime())) throw new Error('viewing_time_invalid');
          const durationRaw = Number.parseInt(String(data.viewing_duration || '60'), 10);
          const durationMinutes = Number.isFinite(durationRaw) ? durationRaw : 60;
          const guestsRaw = Number.parseInt(String(data.guests || '').trim(), 10);
          const bookingResponse = await fetch('/v1/bookings', {{
            method: 'POST',
            headers: {{ 'content-type': 'application/json' }},
            body: JSON.stringify({{
              property_id: propertyId,
              inquiry_id: inquiryBody.id,
              start_at: viewingAt.toISOString(),
              duration_minutes: durationMinutes,
              guests: Number.isFinite(guestsRaw) ? guestsRaw : null,
              notes: userMessage || null,
              idempotency_key: propertyId + ':' + viewingAt.toISOString() + ':' + String(data.contact || '').trim().toLowerCase(),
            }}),
          }});
          if (!bookingResponse.ok) throw new Error('booking_failed');
        }}
        successEl.hidden = false;
        statusEl.textContent = {copy["submit_success"]!r};
        inquiryForm.reset();
        if (intentInput) intentInput.value = 'inquiry';
      }} catch {{
        errorEl.hidden = false;
        statusEl.textContent = {copy["submit_error"]!r};
      }} finally {{
        loadingEl.hidden = true;
        submitBtn.disabled = false;
      }}
    }});
  }}

  const copyBtn = document.getElementById('property-copy-link');
  const copyStatus = document.getElementById('property-copy-status');
  if (copyBtn && copyStatus) {{
    copyBtn.addEventListener('click', async () => {{
      const link = copyBtn.getAttribute('data-link') || '';
      if (!link) return;
      try {{
        if (navigator.clipboard && navigator.clipboard.writeText) {{
          await navigator.clipboard.writeText(link);
        }} else {{
          const temp = document.createElement('input');
          temp.value = link;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }}
        copyStatus.textContent = {copy["copy_success"]!r};
      }} catch {{
        copyStatus.textContent = {copy["copy_error"]!r};
      }}
    }});
  }}
}})();
</script>
"""


def _render_property_detail_page(
    locale: str, request: Request, db: Session, property_ref: str
) -> HTMLResponse:
    row = _property_or_404(db, property_ref)
    copy = _property_detail_copy(locale)
    title = _property_title_for_locale(row, locale)
    description = _property_description_for_locale(row, locale)
    property_ref_safe = _property_ref_for_route(row)

    gallery = _property_gallery_paths(row, request=request)
    hero_media = gallery[0]
    thumb_buttons = "".join(
        (
            f'<button class="property-thumb{" is-active" if idx == 0 else ""}" type="button" data-gallery-thumb="{idx}" '
            f'data-src="{escape(path)}" data-alt="{escape(title)} image {idx + 1}" '
            f'aria-current="{"true" if idx == 0 else "false"}" role="option" '
            f'aria-label="{escape(title)} image {idx + 1}">'
            f'<img src="{escape(path)}" alt="{escape(title)} thumbnail {idx + 1}" loading="lazy" width="160" height="90" />'
            "</button>"
        )
        for idx, path in enumerate(gallery)
    )
    gallery_note_html = (
        f'<p class="muted" data-gallery-note="true">{escape(copy["gallery_note"])}</p>'
    )
    if len(gallery) == 1 and gallery[0] == _DEFAULT_MEDIA_FALLBACK:
        gallery_note_html = (
            f'<p class="muted" data-gallery-empty="true">{escape(copy["gallery_empty"])}</p>'
        )

    area_row = db.get(Area, row.area_id) if row.area_id else None
    if area_row is not None and area_row.deleted_at is not None:
        area_row = None
    developer_row = db.get(Developer, row.developer_id) if row.developer_id else None
    if developer_row is not None and (
        developer_row.deleted_at is not None or developer_row.status != "active"
    ):
        developer_row = None
    project_row = db.get(Project, row.project_id) if row.project_id else None
    if project_row is not None and (
        project_row.deleted_at is not None or project_row.status != "published"
    ):
        project_row = None

    area_href = (
        f"/{locale}/areas/{area_row.slug}"
        if area_row is not None and area_row.status == "published"
        else f"/{locale}/areas"
    )
    developer_href = (
        f"/{locale}/developers/{developer_row.slug}"
        if developer_row is not None
        else f"/{locale}/developers"
    )
    project_href = (
        f"/{locale}/projects/{project_row.slug}"
        if project_row is not None
        else f"/{locale}/projects"
    )

    price_text = _format_money(row.price, fallback="-")
    status_text = (
        " ".join(str(row.status or "").replace("_", " ").split()) or copy["status_pending"]
    )
    view_text = " ".join(str(row.view or "").replace("_", " ").split()) or copy["view_pending"]
    size_value = row.size_sqm if row.size_sqm is not None else row.size
    key_stats = [
        (copy["bedrooms"], str(row.bedrooms) if row.bedrooms is not None else "-"),
        (copy["bathrooms"], str(row.bathrooms) if row.bathrooms is not None else "-"),
        (copy["size"], f"{float(size_value):,.0f} sqm" if size_value is not None else "-"),
        (copy["view"], view_text),
    ]
    stats_html = (
        "".join(
            f"<li><strong>{escape(label)}:</strong> {escape(value)}</li>"
            for label, value in key_stats
        )
        or f"<li>{escape(copy['stats_pending'])}</li>"
    )

    source_meta = row.source_meta if isinstance(row.source_meta, dict) else {}
    source_location = (
        source_meta.get("location") if isinstance(source_meta.get("location"), dict) else {}
    )
    lat, lng = _extract_lat_lng(source_location)
    if lat is None or lng is None:
        lat, lng = _extract_lat_lng(source_meta)
    if (lat is None or lng is None) and project_row is not None:
        project_lat, project_lng = _extract_lat_lng(project_row.location)
        if lat is None:
            lat = project_lat
        if lng is None:
            lng = project_lng

    location_context = (
        _localized_dict_text(source_location.get("context"), locale)
        or str(source_location.get("context") or source_location.get("label") or "").strip()
        or _localized_dict_text(source_meta.get("context"), locale)
        or str(source_meta.get("context") or source_meta.get("location_text") or "").strip()
    )
    if not location_context and project_row is not None and isinstance(project_row.location, dict):
        project_location = project_row.location
        location_context = (
            _localized_dict_text(project_location.get("context"), locale)
            or str(project_location.get("context") or project_location.get("label") or "").strip()
        )
    if not location_context:
        location_context = (
            " • ".join(
                part
                for part in [str(row.address or "").strip(), str(row.city or "").strip()]
                if part
            )
            or str(getattr(area_row, "name", "") or "").strip()
        )

    if lat is not None and lng is not None:
        map_href = f"https://maps.google.com/?q={lat:.6f},{lng:.6f}"
        location_body = (
            f"<p>{escape(location_context)}</p>"
            f'<p class="muted">Lat {lat:.6f}, Lng {lng:.6f}</p>'
            f'<a class="btn" href="{escape(map_href)}" target="_blank" rel="noopener">{escape(copy["open_map"])}</a>'
        )
    else:
        area_name = str(getattr(area_row, "name", "") or "-")
        location_body = f'<p>{escape(copy["location_fallback"])}</p><a class="btn" href="{area_href}">{escape(area_name)}</a>'

    features = _property_feature_items(row)
    features_html = (
        "".join(f"<li>{escape(item)}</li>" for item in features)
        or f"<li>{escape(copy['features_fallback'])}</li>"
    )

    related_rows: list[Property] = []
    seen_related_ids: set[str] = {str(row.id)}
    if row.project_id is not None:
        same_project = db.scalars(
            select(Property)
            .where(
                Property.status == "active",
                Property.project_id == row.project_id,
                Property.id != row.id,
            )
            .order_by(desc(Property.updated_at))
            .limit(8)
        ).all()
        for item in same_project:
            item_key = str(item.id)
            if item_key in seen_related_ids:
                continue
            seen_related_ids.add(item_key)
            related_rows.append(item)
            if len(related_rows) == 4:
                break
    if len(related_rows) < 4 and (row.area_id is not None or row.developer_id is not None):
        secondary_pool = db.scalars(
            select(Property)
            .where(Property.status == "active", Property.id != row.id)
            .order_by(desc(Property.updated_at))
            .limit(80)
        ).all()
        for item in secondary_pool:
            item_key = str(item.id)
            if item_key in seen_related_ids:
                continue
            matches_area = row.area_id is not None and item.area_id == row.area_id
            matches_developer = (
                row.developer_id is not None and item.developer_id == row.developer_id
            )
            if not (matches_area or matches_developer):
                continue
            seen_related_ids.add(item_key)
            related_rows.append(item)
            if len(related_rows) == 4:
                break

    related_html = (
        "".join(
            (
                f'<article class="card">'
                f'<img class="media" src="{escape(_property_gallery_paths(item, request=request)[0])}" alt="{escape(_property_title_for_locale(item, locale))}" width="640" height="360" loading="lazy" />'
                f"<h3>{escape(_property_title_for_locale(item, locale))}</h3>"
                f'<p class="muted">{escape(_format_money(item.price, fallback="-"))} • {escape(" • ".join(_localized_property_stats(item, locale)) or copy["stats_pending"])}</p>'
                f'<a class="btn" href="/{locale}/property/{escape(_property_ref_for_route(item))}">{escape(copy["book_viewing"])}</a>'
                "</article>"
            )
            for item in related_rows
        )
        or f'<div class="card" data-related-empty="true">{escape(copy["related_fallback"])}</div>'
    )

    updated_dt = row.last_synced_at or row.updated_at
    updated_text = (
        updated_dt.strftime("%Y-%m-%d") if updated_dt is not None else copy["updated_pending"]
    )
    source_name = " ".join(
        str(source_meta.get("source") or source_meta.get("source_name") or "").split()
    )
    source_url = " ".join(str(source_meta.get("source_url") or "").split())
    source_domain = " ".join(str(source_meta.get("source_domain") or "").split())
    source_type = " ".join(str(source_meta.get("source_type") or "").split())
    rights_status = " ".join(str(source_meta.get("rights_status") or "").split())
    rights_note = " ".join(str(source_meta.get("rights_note") or "").split())
    license_evidence_url = " ".join(str(source_meta.get("license_evidence_url") or "").split())
    source_checked = " ".join(
        str(source_meta.get("last_checked_at") or source_meta.get("checked_at") or "").split()
    )
    source_meta_body = ""
    if source_name:
        source_meta_body += (
            f"<p><strong>{escape(copy['source'])}:</strong> {escape(source_name)}</p>"
        )
    if source_url:
        source_meta_body += f'<p><strong>{escape(copy["source_url"])}:</strong> <a href="{escape(source_url)}" target="_blank" rel="noopener">{escape(source_url)}</a></p>'
    if source_domain:
        source_meta_body += (
            f"<p><strong>{escape(copy['source_domain'])}:</strong> {escape(source_domain)}</p>"
        )
    if source_type:
        source_meta_body += (
            f"<p><strong>{escape(copy['source_type'])}:</strong> {escape(source_type)}</p>"
        )
    if rights_status:
        source_meta_body += (
            f"<p><strong>{escape(copy['rights'])}:</strong> {escape(rights_status)}</p>"
        )
    if rights_note:
        source_meta_body += (
            f"<p><strong>{escape(copy['rights_note'])}:</strong> {escape(rights_note)}</p>"
        )
    if license_evidence_url:
        source_meta_body += f'<p><strong>{escape(copy["license_evidence"])}:</strong> <a href="{escape(license_evidence_url)}" target="_blank" rel="noopener">{escape(license_evidence_url)}</a></p>'
    if source_checked:
        source_meta_body += (
            f"<p><strong>{escape(copy['source_checked'])}:</strong> {escape(source_checked)}</p>"
        )
    if not source_meta_body:
        source_meta_body = f"<p>{escape(copy['source_pending'])}</p>"

    property_url = _absolute_url(request, f"/{locale}/property/{property_ref_safe}")
    share_facebook = "https://www.facebook.com/sharer/sharer.php?" + urlencode({"u": property_url})
    share_line = "https://social-plugins.line.me/lineit/share?" + urlencode({"url": property_url})
    share_x = "https://x.com/intent/tweet?" + urlencode({"url": property_url, "text": title})

    description_html = (
        f"<p>{escape(description)}</p>"
        if description
        else f"<p>{escape(copy['description_pending'])}</p>"
    )

    body = (
        "<style>"
        ".property-thumb-strip{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}"
        ".property-thumb{padding:0;border:2px solid #d1d5db;border-radius:10px;background:#fff;cursor:pointer}"
        ".property-thumb img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px}"
        '.property-thumb.is-active,.property-thumb[aria-current="true"]{border-color:#0f6d5a}'
        ".property-two-col{display:grid;gap:16px;grid-template-columns:1fr}"
        ".property-list{margin:0;padding-left:20px;display:grid;gap:8px}"
        ".property-related-grid{display:grid;gap:16px;grid-template-columns:1fr}"
        ".state-loading,.state-error,.state-success{padding:10px 12px;border-radius:10px}"
        ".state-loading{background:#ecfeff;color:#0c4a6e}"
        ".state-error{background:#fef2f2;color:#991b1b}"
        ".state-success{background:#ecfdf5;color:#065f46}"
        "@media (min-width:1024px){.property-two-col{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)}.property-related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1920px){.property-related-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "</style>"
        f'<section id="property-hero" class="card">'
        f"<h2>{escape(title)}</h2>"
        f'<p class="muted"><strong>{escape(copy["price"])}:</strong> {escape(price_text)} • <strong>{escape(copy["status"])}:</strong> {escape(status_text)}</p>'
        f'<div class="cta-row"><a class="btn" data-property-intent="inquiry" href="#property-inquiry-form">{escape(copy["send_inquiry"])}</a><a class="btn" data-property-intent="viewing" href="#property-inquiry-form">{escape(copy["book_viewing"])}</a></div>'
        f"{description_html}"
        "</section>"
        f'<section id="property-gallery" class="card" data-property-gallery="true" aria-label="{escape(copy["gallery"])}">'
        f"<h2>{escape(copy['gallery'])}</h2>{gallery_note_html}"
        f'<img class="media" data-gallery-hero="true" src="{escape(hero_media)}" alt="{escape(title)}" width="1280" height="720" loading="eager" />'
        f'<div class="property-thumb-strip" role="listbox" aria-label="{escape(copy["gallery"])}">{thumb_buttons}</div>'
        "</section>"
        f'<section id="property-summary" class="property-two-col">'
        f'<article class="card"><h2>{escape(copy["key_stats"])}</h2><ul class="property-list">{stats_html}</ul></article>'
        f'<article id="property-links" class="card"><h2>{escape(copy["links"])}</h2>'
        f'<p><strong>{escape(copy["area"])}:</strong> <a href="{area_href}">{escape(str(getattr(area_row, "name", "") or "-"))}</a></p>'
        f'<p><strong>{escape(copy["developer"])}:</strong> <a href="{developer_href}">{escape(str(getattr(developer_row, "name", "") or "-"))}</a></p>'
        f'<p><strong>{escape(copy["project"])}:</strong> <a href="{project_href}">{escape(str(getattr(project_row, "name", "") or "-"))}</a></p>'
        "</article></section>"
        f'<section id="property-location" class="card"><h2>{escape(copy["location"])}</h2>{location_body}</section>'
        f'<section id="property-features" class="card"><h2>{escape(copy["features"])}</h2><ul class="property-list">{features_html}</ul></section>'
        f'<section id="property-inquiry" class="stack"><h2>{escape(copy["inquiry_section"])}</h2><p>{escape(copy["inquiry_intro"])}</p>'
        f'<form id="property-inquiry-form" class="card" novalidate data-property-id="{escape(str(row.id))}">'
        f'<label class="field" for="property-name"><span>{escape(copy["name"])}</span><input id="property-name" name="name" type="text" required /></label>'
        f'<label class="field" for="property-contact"><span>{escape(copy["contact"])}</span><input id="property-contact" name="contact" type="text" required /></label>'
        f'<label class="field" for="property-intent"><span>{escape(copy["intent"])}</span><select id="property-intent" name="intent" required><option value="inquiry">{escape(copy["intent_inquiry"])}</option><option value="viewing">{escape(copy["intent_viewing"])}</option></select></label>'
        f'<label class="field" for="property-viewing-at"><span>{escape(copy["viewing_at"])}</span><input id="property-viewing-at" name="viewing_at" type="datetime-local" /></label>'
        f'<label class="field" for="property-viewing-duration"><span>{escape(copy["viewing_duration"])}</span><select id="property-viewing-duration" name="viewing_duration"><option value="60">60 min</option><option value="30">30 min</option><option value="90">90 min</option></select></label>'
        f'<label class="field" for="property-guests"><span>{escape(copy["guests"])}</span><input id="property-guests" name="guests" type="number" min="1" max="20" inputmode="numeric" /></label>'
        f'<label class="field" for="property-budget"><span>{escape(copy["budget"])}</span><select id="property-budget" name="budget"><option value="">{escape(copy["select_budget"])}</option><option value="lt_3m">Below THB 3M</option><option value="3m_6m">THB 3M - 6M</option><option value="6m_10m">THB 6M - 10M</option><option value="gt_10m">Above THB 10M</option></select></label>'
        f'<label class="field" for="property-timeline"><span>{escape(copy["timeline"])}</span><select id="property-timeline" name="timeline"><option value="">{escape(copy["select_timeline"])}</option><option value="0_3m">0-3 months</option><option value="3_6m">3-6 months</option><option value="6m_plus">6+ months</option></select></label>'
        f'<label class="field" for="property-message"><span>{escape(copy["message"])}</span><textarea id="property-message" name="message" rows="4" placeholder="{escape(copy["message_placeholder"])}"></textarea></label>'
        f'<div class="cta-row"><button id="property-inquiry-submit" class="btn" type="submit">{escape(copy["submit"])}</button><a class="btn" href="/{locale}/contact?intent=viewing&property={escape(property_ref_safe)}">{escape(copy["book_viewing"])}</a></div>'
        '<p id="property-form-status" class="muted" role="status" aria-live="polite"></p>'
        f'<div id="property-form-loading" class="state-loading" hidden>{escape(copy["submitting"])}</div>'
        f'<div id="property-form-error" class="state-error" hidden>{escape(copy["submit_error"])}</div>'
        f'<div id="property-form-success" class="state-success" hidden>{escape(copy["submit_success"])}</div>'
        "</form></section>"
        f'<section id="property-related" class="stack"><h2>{escape(copy["related"])}</h2><div class="property-related-grid">{related_html}</div></section>'
        f'<section id="property-share" class="card"><h2>{escape(copy["share"])}</h2>'
        f'<div class="cta-row"><a class="btn" target="_blank" rel="noopener" href="{escape(share_x)}">{escape(copy["share_x"])}</a>'
        f'<a class="btn" target="_blank" rel="noopener" href="{escape(share_facebook)}">{escape(copy["share_facebook"])}</a>'
        f'<a class="btn" target="_blank" rel="noopener" href="{escape(share_line)}">{escape(copy["share_line"])}</a>'
        f'<button id="property-copy-link" class="btn" type="button" data-link="{escape(property_url)}">{escape(copy["copy_link"])}</button></div>'
        '<p id="property-copy-status" class="muted" role="status" aria-live="polite"></p>'
        "</section>"
        f'<section id="property-freshness" class="card"><h2>{escape(copy["freshness"])}</h2><p><strong>{escape(copy["updated"])}:</strong> {escape(updated_text)}</p>{source_meta_body}</section>'
        f"{_property_detail_script(copy, property_ref_safe, str(row.id))}"
    )

    intro = description or title
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=title,
            intro=intro,
            body=body,
            request=request,
            db=db,
        )
    )


def _parse_positive_int(
    raw: str | None,
    *,
    default: int,
    minimum: int,
    maximum: int,
    field: str,
    errors: list[str],
) -> int:
    text = str(raw or "").strip()
    if not text:
        return default
    try:
        value = int(text)
    except ValueError:
        errors.append(f"Invalid {field} value.")
        return default
    if value < minimum or value > maximum:
        errors.append(f"{field.capitalize()} is out of range.")
        return default
    return value


def _parse_optional_int(
    raw: str | None,
    *,
    minimum: int,
    maximum: int,
    field: str,
    errors: list[str],
) -> int | None:
    text = str(raw or "").strip()
    if not text:
        return None
    try:
        value = int(text)
    except ValueError:
        errors.append(f"Invalid {field} value.")
        return None
    if value < minimum or value > maximum:
        errors.append(f"{field.capitalize()} is out of range.")
        return None
    return value


def _parse_optional_decimal(
    raw: str | None,
    *,
    minimum: Decimal,
    maximum: Decimal,
    field: str,
    errors: list[str],
) -> Decimal | None:
    text = str(raw or "").strip()
    if not text:
        return None
    try:
        value = Decimal(text)
    except InvalidOperation:
        errors.append(f"Invalid {field} value.")
        return None
    if value < minimum or value > maximum:
        errors.append(f"{field.capitalize()} is out of range.")
        return None
    return value


def _resolve_area_filter(db: Session, raw: str | None) -> Area | None:
    token = str(raw or "").strip()
    if not token:
        return None
    row = db.scalar(select(Area).where(Area.deleted_at.is_(None), Area.slug == token))
    if row is not None:
        return row
    try:
        area_id = UUID(token)
    except ValueError:
        return None
    row = db.get(Area, area_id)
    if row is None or row.deleted_at is not None:
        return None
    return row


def _resolve_project_filter(db: Session, raw: str | None) -> Project | None:
    token = str(raw or "").strip()
    if not token:
        return None
    row = db.scalar(
        select(Project).where(
            Project.deleted_at.is_(None), Project.status == "published", Project.slug == token
        )
    )
    if row is not None:
        return row
    try:
        project_id = UUID(token)
    except ValueError:
        return None
    row = db.get(Project, project_id)
    if row is None or row.deleted_at is not None or row.status != "published":
        return None
    return row


def _humanize_token(value: str) -> str:
    token = " ".join(str(value or "").strip().replace("-", " ").replace("_", " ").split())
    return token.title()


def _localized_property_stats(prop: Property, locale: str) -> list[str]:
    stats: list[str] = []
    if prop.bedrooms is not None:
        stats.append(f"{prop.bedrooms} beds" if locale == "en" else f"{prop.bedrooms} ห้องนอน")
    if prop.bathrooms is not None:
        stats.append(f"{prop.bathrooms} baths" if locale == "en" else f"{prop.bathrooms} ห้องน้ำ")
    size_value = prop.size_sqm if prop.size_sqm is not None else prop.size
    if size_value is not None:
        stats.append(
            f"{float(size_value):,.0f} sqm" if locale == "en" else f"{float(size_value):,.0f} ตร.ม."
        )
    return stats


def _listing_property_tags(prop: Property) -> list[str]:
    tags: list[str] = []
    for raw in [prop.type, prop.property_type, prop.furnishing]:
        text = str(raw or "").strip().lower()
        if text and text not in tags:
            tags.append(text)
    if isinstance(prop.features, dict) and isinstance(prop.features.get("tags"), list):
        for item in prop.features.get("tags") or []:
            text = str(item or "").strip().lower()
            if text and text not in tags:
                tags.append(text)
    return [_humanize_token(tag) for tag in tags[:5]]


def _listing_querystring(params: dict[str, object]) -> str:
    query = urlencode(
        {key: str(value) for key, value in params.items() if str(value or "").strip()}
    )
    return f"?{query}" if query else ""


def _project_investment_snapshot_ready(project: Project | None) -> bool:
    if project is None or project.deleted_at is not None or project.status != "published":
        return False
    snapshot = project.investment_snapshot if isinstance(project.investment_snapshot, dict) else {}
    source = str(snapshot.get("source") or "").strip()
    updated = str(snapshot.get("updated_at") or "").strip()
    return bool(source and updated)


def _listing_copy(locale: str, intent: str) -> dict[str, str]:
    common_en = {
        "copy_pack_id": "a5-listing-v1-2026-02-28",
        "filters_title": "Filter listings",
        "price_min": "Min price (THB)",
        "price_max": "Max price (THB)",
        "beds": "Bedrooms (min)",
        "baths": "Bathrooms (min)",
        "area": "Area",
        "project": "Project",
        "property_type": "Property type",
        "all_areas": "All areas",
        "all_projects": "All projects",
        "all_property_types": "All property types",
        "sort": "Sort",
        "sort_newest": "Newest",
        "sort_price_asc": "Price: Low to high",
        "sort_price_desc": "Price: High to low",
        "apply_filters": "Apply filters",
        "reset_filters": "Reset",
        "consult_cta": "Request Consultation",
        "smart_finder_cta": "Open Smart Finder",
        "view_details": "View details",
        "location_pending": "Location pending publication",
        "stats_pending": "Stats pending publication",
        "tags_pending": "Tags will appear from published data.",
        "loading": "Loading listings",
        "loading_hint": "Applying filters...",
        "runtime_error": "Unable to process this interaction right now. Please reload and try again.",
        "query_error": "Some query parameters were invalid. Default values were used where possible.",
        "empty": "No listings match the current filters. Adjust filters or request consultation.",
        "results": "results",
        "showing": "Showing",
        "pagination_prev": "Previous",
        "pagination_next": "Next",
        "linked_area": "Area",
        "linked_project": "Project",
        "rule_note": "Inventory rules: active listings only, local media only, and verified listing fields only.",
    }
    intents_en = {
        "buy": {
            "page_title": "Buy Property in Pattaya",
            "page_intro": "Browse active sale listings with local media, practical filters, and direct next-step support.",
            "hero_title": "Buy Listings",
            "hero_sub": "Compare ownership-ready listings with clear pricing and key unit facts.",
            "smart_intent": "buy",
            "rule_note": "Buy rules: active sale listings (new/resale), local media covers, no fabricated claims.",
        },
        "rent": {
            "page_title": "Rent Property in Pattaya",
            "page_intro": "Browse active rental listings with local media and move-in focused filters.",
            "hero_title": "Rent Listings",
            "hero_sub": "Filter by budget, room count, and area to shortlist your next rental.",
            "smart_intent": "rent",
            "rule_note": "Rent rules: active rental listings only, local media covers, no fabricated claims.",
        },
        "investment": {
            "page_title": "Investment Property in Pattaya",
            "page_intro": "Browse investment-ready sale listings that pass data quality and source-timestamp checks.",
            "hero_title": "Investment Listings",
            "hero_sub": "View sale listings tied to projects with published investment snapshot source and update date.",
            "smart_intent": "invest",
            "rule_note": "Investment rules: active sale listings + local cover media + project investment_snapshot.source and updated_at.",
        },
        "marketplace": {
            "page_title": "Property Marketplace in Pattaya",
            "page_intro": "Browse active buy and rent inventory in one page with unified filters and consultation paths.",
            "hero_title": "Marketplace Listings",
            "hero_sub": "Browse all active listings with local media and transparent listing facts.",
            "smart_intent": "buy",
            "rule_note": "Marketplace rules: active listings across buy/rent that pass local media and listing quality gates.",
        },
    }
    common_th = {
        "copy_pack_id": "a5-listing-v1-2026-02-28",
        "filters_title": "กรองรายการอสังหา",
        "price_min": "ราคาต่ำสุด (THB)",
        "price_max": "ราคาสูงสุด (THB)",
        "beds": "ห้องนอน (ขั้นต่ำ)",
        "baths": "ห้องน้ำ (ขั้นต่ำ)",
        "area": "ทำเล",
        "project": "โครงการ",
        "property_type": "ประเภททรัพย์",
        "all_areas": "ทุกทำเล",
        "all_projects": "ทุกโครงการ",
        "all_property_types": "ทุกประเภททรัพย์",
        "sort": "เรียงลำดับ",
        "sort_newest": "ล่าสุด",
        "sort_price_asc": "ราคา: ต่ำไปสูง",
        "sort_price_desc": "ราคา: สูงไปต่ำ",
        "apply_filters": "ใช้ตัวกรอง",
        "reset_filters": "รีเซ็ต",
        "consult_cta": "ขอคำปรึกษา",
        "smart_finder_cta": "เปิด Smart Finder",
        "view_details": "ดูรายละเอียด",
        "location_pending": "รอเผยแพร่ข้อมูลทำเล",
        "stats_pending": "รอเผยแพร่ข้อมูลยูนิต",
        "tags_pending": "แท็กจะแสดงจากข้อมูลที่เผยแพร่แล้ว",
        "loading": "กำลังโหลดรายการ",
        "loading_hint": "กำลังใช้ตัวกรอง...",
        "runtime_error": "ยังไม่สามารถประมวลผลได้ในขณะนี้ กรุณารีเฟรชแล้วลองใหม่",
        "query_error": "พารามิเตอร์บางรายการไม่ถูกต้อง ระบบใช้ค่าเริ่มต้นแทน",
        "empty": "ไม่พบรายการที่ตรงกับตัวกรองนี้ ลองปรับตัวกรองหรือขอคำปรึกษา",
        "results": "รายการ",
        "showing": "กำลังแสดง",
        "pagination_prev": "ก่อนหน้า",
        "pagination_next": "ถัดไป",
        "linked_area": "ทำเล",
        "linked_project": "โครงการ",
        "rule_note": "กติกา inventory: แสดงเฉพาะรายการ active, ใช้ local media เท่านั้น และใช้ข้อมูลที่ยืนยันได้เท่านั้น",
    }
    intents_th = {
        "buy": {
            "page_title": "ซื้ออสังหาในพัทยา",
            "page_intro": "ดูรายการขาย active พร้อม local media ตัวกรองที่ใช้งานจริง และเส้นทางปรึกษาที่ชัดเจน",
            "hero_title": "รายการสำหรับซื้อ",
            "hero_sub": "เปรียบเทียบรายการที่พร้อมถือครองด้วยราคาและข้อมูลยูนิตที่ชัดเจน",
            "smart_intent": "buy",
            "rule_note": "กติกา Buy: แสดงเฉพาะรายการขาย active (new/resale) ที่มี local cover และไม่ใส่ข้อมูลที่สร้างขึ้น",
        },
        "rent": {
            "page_title": "เช่าอสังหาในพัทยา",
            "page_intro": "ดูรายการเช่า active พร้อม local media และตัวกรองเพื่อวางแผนย้ายเข้า",
            "hero_title": "รายการสำหรับเช่า",
            "hero_sub": "กรองตามงบ จำนวนห้อง และทำเลเพื่อ shortlist สำหรับการเช่า",
            "smart_intent": "rent",
            "rule_note": "กติกา Rent: แสดงเฉพาะรายการเช่า active ที่มี local cover และไม่ใส่ข้อมูลที่สร้างขึ้น",
        },
        "investment": {
            "page_title": "อสังหาเพื่อการลงทุนในพัทยา",
            "page_intro": "ดูรายการขายเพื่อการลงทุนที่ผ่าน quality gate และมี source/timestamp สำหรับข้อมูลลงทุน",
            "hero_title": "รายการเพื่อการลงทุน",
            "hero_sub": "แสดงเฉพาะรายการขายที่เชื่อมกับโครงการซึ่งมี investment snapshot พร้อมแหล่งที่มาและวันที่อัปเดต",
            "smart_intent": "invest",
            "rule_note": "กติกา Investment: รายการขาย active + local cover + โครงการต้องมี investment_snapshot.source และ updated_at",
        },
        "marketplace": {
            "page_title": "มาร์เก็ตเพลสอสังหาในพัทยา",
            "page_intro": "รวมรายการซื้อและเช่า active ในหน้าเดียว ด้วยตัวกรองเดียวกันและเส้นทางปรึกษาที่ชัดเจน",
            "hero_title": "รายการใน Marketplace",
            "hero_sub": "ดูรายการ active ทั้งหมดด้วย local media และข้อมูลทรัพย์ที่โปร่งใส",
            "smart_intent": "buy",
            "rule_note": "กติกา Marketplace: รวมรายการ active buy/rent ที่ผ่าน local media และ quality gate ของ listing",
        },
    }
    common = common_th if locale == "th" else common_en
    intents = intents_th if locale == "th" else intents_en
    defaults = intents.get("marketplace") or {}
    selected = intents.get(intent) or defaults
    return {**common, **selected}


def _render_property_listing_page(
    locale: str, request: Request, db: Session, intent: str
) -> HTMLResponse:
    if intent not in {"buy", "rent", "investment", "marketplace"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    copy = _listing_copy(locale, intent)
    errors: list[str] = []
    query = request.query_params
    listing_path = f"/{locale}/{intent}"

    page = _parse_positive_int(
        query.get("page"), default=1, minimum=1, maximum=999, field="page", errors=errors
    )
    limit = _parse_positive_int(
        query.get("limit"), default=12, minimum=1, maximum=48, field="limit", errors=errors
    )
    price_min = _parse_optional_decimal(
        query.get("price_min"),
        minimum=Decimal("0"),
        maximum=Decimal("999999999999"),
        field="price_min",
        errors=errors,
    )
    price_max = _parse_optional_decimal(
        query.get("price_max"),
        minimum=Decimal("0"),
        maximum=Decimal("999999999999"),
        field="price_max",
        errors=errors,
    )
    beds = _parse_optional_int(
        query.get("beds"), minimum=0, maximum=20, field="beds", errors=errors
    )
    baths = _parse_optional_int(
        query.get("baths"), minimum=0, maximum=20, field="baths", errors=errors
    )

    area_raw = str(query.get("area") or "").strip()
    area_row = _resolve_area_filter(db, area_raw)
    if area_raw and area_row is None:
        errors.append("Invalid area filter value.")

    project_raw = str(query.get("project") or "").strip()
    project_row = _resolve_project_filter(db, project_raw)
    if project_raw and project_row is None:
        errors.append("Invalid project filter value.")

    property_type = " ".join(str(query.get("property_type") or "").strip().lower().split())
    if property_type and not property_type.replace("-", "").replace("_", "").isalnum():
        errors.append("Invalid property_type value.")
        property_type = ""

    sort = str(query.get("sort") or "newest").strip().lower()
    if sort not in {"newest", "price_asc", "price_desc"}:
        errors.append("Invalid sort value.")
        sort = "newest"

    if price_min is not None and price_max is not None and price_min > price_max:
        errors.append("price_min is higher than price_max. Values were swapped.")
        price_min, price_max = price_max, price_min

    intent_filters = [Property.status == "active"]
    if intent in {"buy", "investment"}:
        intent_filters.append(Property.type.in_(["new", "resale"]))
    elif intent == "rent":
        intent_filters.append(Property.type == "rent")

    quality_gate_filters = [
        Property.price > 0,
        or_(Property.cover_image_url.like("/media/%"), Property.cover_image.like("/media/%")),
        or_(
            Property.area_id.is_not(None),
            Property.project_id.is_not(None),
            Property.city.is_not(None),
            Property.address.is_not(None),
        ),
    ]
    if intent in {"investment", "marketplace"}:
        intent_filters.extend(quality_gate_filters)

    eligible_investment_project_ids: list[UUID] = []
    if intent == "investment":
        eligible_investment_project_ids = [
            item.id
            for item in db.scalars(
                select(Project).where(Project.deleted_at.is_(None), Project.status == "published")
            ).all()
            if _project_investment_snapshot_ready(item)
        ]
        if eligible_investment_project_ids:
            intent_filters.append(Property.project_id.in_(eligible_investment_project_ids))
        else:
            intent_filters.append(Property.id.is_(None))

    area_option_ids = [
        item
        for item in db.scalars(
            select(Property.area_id)
            .where(*intent_filters, Property.area_id.is_not(None))
            .distinct()
        ).all()
        if item is not None
    ]
    area_options = (
        db.scalars(
            select(Area)
            .where(Area.deleted_at.is_(None), Area.id.in_(area_option_ids))
            .order_by(Area.name.asc())
        ).all()
        if area_option_ids
        else []
    )

    project_option_ids = [
        item
        for item in db.scalars(
            select(Property.project_id)
            .where(*intent_filters, Property.project_id.is_not(None))
            .distinct()
        ).all()
        if item is not None
    ]
    project_options = (
        db.scalars(
            select(Project)
            .where(
                Project.deleted_at.is_(None),
                Project.status == "published",
                Project.id.in_(project_option_ids),
            )
            .order_by(Project.name.asc())
        ).all()
        if project_option_ids
        else []
    )

    property_type_options = sorted(
        {
            str(value or "").strip().lower()
            for value in db.scalars(
                select(Property.property_type).where(*intent_filters).distinct()
            ).all()
            if str(value or "").strip()
        }
    )

    filters = list(intent_filters)
    if price_min is not None:
        filters.append(Property.price >= price_min)
    if price_max is not None:
        filters.append(Property.price <= price_max)
    if beds is not None:
        filters.append(Property.bedrooms >= beds)
    if baths is not None:
        filters.append(Property.bathrooms >= baths)
    if area_row is not None:
        filters.append(Property.area_id == area_row.id)
    if project_row is not None:
        filters.append(Property.project_id == project_row.id)
    if property_type:
        filters.append(func.lower(Property.property_type) == property_type)

    query_rows = select(Property).where(*filters)
    total = int(db.scalar(select(func.count()).select_from(query_rows.subquery())) or 0)

    if sort == "price_asc":
        order_by = [asc(Property.price), desc(Property.updated_at), desc(Property.id)]
    elif sort == "price_desc":
        order_by = [desc(Property.price), desc(Property.updated_at), desc(Property.id)]
    else:
        order_by = [desc(Property.updated_at), desc(Property.created_at), desc(Property.id)]

    rows = db.scalars(query_rows.order_by(*order_by).offset((page - 1) * limit).limit(limit)).all()

    row_area_ids = [item.area_id for item in rows if item.area_id is not None]
    area_lookup = (
        {
            item.id: item
            for item in db.scalars(
                select(Area).where(Area.deleted_at.is_(None), Area.id.in_(row_area_ids))
            ).all()
        }
        if row_area_ids
        else {}
    )
    row_project_ids = [item.project_id for item in rows if item.project_id is not None]
    project_lookup = (
        {
            item.id: item
            for item in db.scalars(
                select(Project).where(
                    Project.deleted_at.is_(None),
                    Project.status == "published",
                    Project.id.in_(row_project_ids),
                )
            ).all()
        }
        if row_project_ids
        else {}
    )

    selected_area = area_row.slug if area_row is not None else area_raw
    selected_project = project_row.slug if project_row is not None else project_raw

    area_options_html = [f'<option value="">{escape(copy["all_areas"])}</option>']
    known_area_values: set[str] = set()
    for item in area_options:
        value = str(item.slug or "").strip() or str(item.id)
        known_area_values.add(value)
        selected = " selected" if value == selected_area else ""
        area_options_html.append(
            f'<option value="{escape(value)}"{selected}>{escape(item.name)}</option>'
        )
    if selected_area and selected_area not in known_area_values:
        area_options_html.append(
            f'<option value="{escape(selected_area)}" selected>{escape(selected_area)}</option>'
        )

    project_options_html = [f'<option value="">{escape(copy["all_projects"])}</option>']
    known_project_values: set[str] = set()
    for item in project_options:
        value = str(item.slug or "").strip() or str(item.id)
        known_project_values.add(value)
        selected = " selected" if value == selected_project else ""
        project_options_html.append(
            f'<option value="{escape(value)}"{selected}>{escape(item.name)}</option>'
        )
    if selected_project and selected_project not in known_project_values:
        project_options_html.append(
            f'<option value="{escape(selected_project)}" selected>{escape(selected_project)}</option>'
        )

    property_type_options_html = [f'<option value="">{escape(copy["all_property_types"])}</option>']
    known_property_types: set[str] = set()
    for item in property_type_options:
        known_property_types.add(item)
        selected = " selected" if item == property_type else ""
        property_type_options_html.append(
            f'<option value="{escape(item)}"{selected}>{escape(_humanize_token(item))}</option>'
        )
    if property_type and property_type not in known_property_types:
        property_type_options_html.append(
            f'<option value="{escape(property_type)}" selected>{escape(_humanize_token(property_type))}</option>'
        )

    cards_html = ""
    for row in rows:
        prop_ref = _property_ref_for_route(row)
        title = _property_title_for_locale(row, locale)
        media = _property_media_path(row, request=request)
        price_text = _format_money(row.price, fallback="-")
        stats_text = " • ".join(_localized_property_stats(row, locale)) or copy["stats_pending"]
        row_area = area_lookup.get(row.area_id) if row.area_id is not None else None
        row_project = project_lookup.get(row.project_id) if row.project_id is not None else None
        area_name = str(getattr(row_area, "name", "") or "").strip()
        project_name = str(getattr(row_project, "name", "") or "").strip()
        city_name = str(row.city or "").strip()
        location_parts = [part for part in [city_name, area_name, project_name] if part]
        location_text = " • ".join(dict.fromkeys(location_parts)) or copy["location_pending"]
        area_href = (
            f"/{locale}/areas/{row_area.slug}"
            if row_area is not None and row_area.status == "published"
            else f"/{locale}/areas"
        )
        project_href = (
            f"/{locale}/projects/{row_project.slug}"
            if row_project is not None and row_project.status == "published"
            else f"/{locale}/projects"
        )
        tag_html = "".join(
            f'<span class="tag">{escape(tag)}</span>' for tag in _listing_property_tags(row)
        )
        tags_block = (
            f'<div class="tag-row">{tag_html}</div>'
            if tag_html
            else f'<p class="muted" data-tags-empty="true">{escape(copy["tags_pending"])}</p>'
        )
        cards_html += (
            f'<article class="card listing-card" data-card-id="{escape(str(row.id))}" data-card-slug="{escape(str(row.slug or row.id))}">'
            f'<a class="listing-link" data-event="listing_card_click" data-cta-id="listing_card" data-card-id="{escape(str(row.id))}" data-card-slug="{escape(str(row.slug or row.id))}" data-placement="listing_grid" href="/{locale}/property/{escape(prop_ref)}">'
            f'<img class="media" src="{escape(media)}" alt="{escape(title)}" width="640" height="360" loading="lazy" />'
            f'<p class="price">{escape(price_text)}</p><h3>{escape(title)}</h3></a>'
            f'<p class="muted">{escape(location_text)}</p><p class="muted">{escape(stats_text)}</p>{tags_block}'
            f'<p class="muted listing-links"><strong>{escape(copy["linked_area"])}:</strong> <a href="{area_href}">{escape(area_name or copy["all_areas"])}</a> • <strong>{escape(copy["linked_project"])}:</strong> <a href="{project_href}">{escape(project_name or copy["all_projects"])}</a></p>'
            f'<a class="btn btn-secondary-hero btn-sm" data-event="listing_card_click" data-cta-id="listing_view_details" data-card-id="{escape(str(row.id))}" data-card-slug="{escape(str(row.slug or row.id))}" data-placement="listing_card_footer" href="/{locale}/property/{escape(prop_ref)}">{escape(copy["view_details"])}</a>'
            f"</article>"
        )

    if not cards_html:
        cards_html = f'<div id="listing-empty" class="state-empty">{escape(copy["empty"])}</div>'

    base_params = {
        "limit": limit,
        "sort": sort,
        "price_min": str(price_min) if price_min is not None else "",
        "price_max": str(price_max) if price_max is not None else "",
        "beds": beds if beds is not None else "",
        "baths": baths if baths is not None else "",
        "area": selected_area,
        "project": selected_project,
        "property_type": property_type,
    }
    has_prev = page > 1
    has_next = page * limit < total
    prev_href = f"{listing_path}{_listing_querystring({**base_params, 'page': page - 1})}"
    next_href = f"{listing_path}{_listing_querystring({**base_params, 'page': page + 1})}"
    showing_start = ((page - 1) * limit) + 1 if total else 0
    showing_end = min(page * limit, total) if total else 0
    prev_link = (
        f'<a id="pagination-prev" rel="prev" class="btn btn-secondary-hero btn-sm" href="{prev_href}">{escape(copy["pagination_prev"])}</a>'
        if has_prev
        else ""
    )
    next_link = (
        f'<a id="pagination-next" rel="next" class="btn btn-secondary-hero btn-sm" href="{next_href}">{escape(copy["pagination_next"])}</a>'
        if has_next
        else ""
    )

    pagination_html = (
        '<nav class="card pagination" aria-label="Pagination">'
        f'<p class="muted">{escape(copy["showing"])} {showing_start}-{showing_end} / {total} {escape(copy["results"])}</p>'
        '<div class="cta-row">'
        f"{prev_link}{next_link}"
        "</div></nav>"
    )

    hero_media = _property_media_path(rows[0], request=request) if rows else _DEFAULT_MEDIA_FALLBACK
    filter_values = {
        "price_min": str(price_min) if price_min is not None else "",
        "price_max": str(price_max) if price_max is not None else "",
        "beds": str(beds) if beds is not None else "",
        "baths": str(baths) if baths is not None else "",
        "area": selected_area,
        "project": selected_project,
        "property_type": property_type,
    }
    error_rows = "".join(f"<li>{escape(message)}</li>" for message in errors)
    query_error_html = (
        f'<div id="listing-error" class="state-error"><p>{escape(copy["query_error"])}</p><ul>{error_rows}</ul></div>'
        if errors
        else '<div id="listing-error" class="state-error" hidden></div>'
    )

    listing_styles = (
        "<style>"
        ".listing-hero{display:grid;gap:12px}.listing-filters{display:grid;gap:12px}.filter-grid{display:grid;gap:12px;grid-template-columns:1fr}"
        ".filter-control{display:grid;gap:6px}.filter-control input,.filter-control select{width:100%;min-height:42px;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff}"
        ".listing-grid{display:grid;gap:16px;grid-template-columns:1fr}.listing-skeleton-grid{display:grid;gap:16px;grid-template-columns:1fr}.listing-link{display:grid;gap:10px;text-decoration:none}.listing-links a{text-decoration:underline}"
        ".skeleton-card{display:grid;gap:8px}.skeleton-media{width:100%;aspect-ratio:16/9;border-radius:10px;background:linear-gradient(90deg,#e5e7eb,#f3f4f6,#e5e7eb)}.skeleton-line{height:12px;border-radius:999px;background:#e5e7eb}.skeleton-line.w40{width:40%}.skeleton-line.w60{width:60%}.skeleton-line.w80{width:80%}"
        "@media (min-width:768px){.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))} .listing-grid,.listing-skeleton-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.filter-grid{grid-template-columns:repeat(4,minmax(0,1fr))} .listing-grid,.listing-skeleton-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.listing-grid,.listing-skeleton-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.listing-grid,.listing-skeleton-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )

    tracking_script = """
<script>
(() => {
  const locale = document.documentElement.lang || 'en';
  const path = location.pathname;
  const endpoint = '/api/v1/events';
  function compact(raw){const out={};for(const [k,v] of Object.entries(raw||{})){if(v===undefined||v===null)continue;if(Array.isArray(v)&&v.length===0)continue;out[k]=v;}return out;}
  function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}
  document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,compact({label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,card_id:node.getAttribute('data-card-id')||undefined,card_slug:node.getAttribute('data-card-slug')||undefined,intent:node.getAttribute('data-intent')||undefined}));});});
  const form = document.getElementById('listing-filters');
  const loadingEl = document.getElementById('listing-loading');
  const skeletonEl = document.getElementById('listing-skeleton');
  const runtimeErrorEl = document.getElementById('listing-error-runtime');
  if(form instanceof HTMLFormElement){
    const filters=()=>{const out={};const data=new FormData(form);for(const [k,v] of data.entries()){const t=String(v||'').trim();if(!t||k==='page'||k==='limit')continue;out[k]=t;}return out;};
    form.querySelectorAll('[data-track-filter]').forEach((node)=>{node.addEventListener('change',()=>{const active=filters();track('listing_filter_change',{placement:'filter_bar',filter_name:node.getAttribute('name')||undefined,filter_value:String(node.value||'').trim()||undefined,filter_values:Object.entries(active).map(([k,v])=>`${k}:${v}`),intent:form.getAttribute('data-intent')||undefined});});});
    const sortSelect = document.getElementById('sort');
    if(sortSelect instanceof HTMLSelectElement){sortSelect.addEventListener('change',()=>{const active=filters();track('listing_sort_change',{placement:'sort_control',sort:sortSelect.value||undefined,filter_values:Object.entries(active).map(([k,v])=>`${k}:${v}`),intent:form.getAttribute('data-intent')||undefined});const pageInput=document.getElementById('form-page');if(pageInput instanceof HTMLInputElement){pageInput.value='1';}form.requestSubmit();});}
    form.addEventListener('submit',()=>{if(loadingEl instanceof HTMLElement)loadingEl.hidden=false;if(skeletonEl instanceof HTMLElement)skeletonEl.hidden=false;});
  }
  window.addEventListener('error',()=>{if(runtimeErrorEl instanceof HTMLElement)runtimeErrorEl.hidden=false;});
})();
</script>
"""

    body = (
        f"{listing_styles}"
        f'<section id="listing-hero" class="card listing-hero" aria-labelledby="listing-hero-title" data-copy-pack-id="{escape(copy["copy_pack_id"])}" data-intent="{escape(intent)}">'
        f'<img class="media" src="{escape(hero_media)}" alt="{escape(copy["hero_title"])}" width="1280" height="720" loading="eager" />'
        f'<h2 id="listing-hero-title">{escape(copy["hero_title"])}</h2><p>{escape(copy["hero_sub"])}</p>'
        f'<p id="listing-rule-note" class="muted">{escape(copy["rule_note"])}</p>'
        f'<div class="cta-row"><a class="btn" data-event="listing_cta_click" data-cta-id="listing_consultation" data-placement="listing_hero" data-intent="{escape(intent)}" href="/{locale}/contact?intent=consultation&source={escape(intent)}">{escape(copy["consult_cta"])}</a>'
        f'<a class="btn btn-secondary-hero" data-event="listing_cta_click" data-cta-id="listing_smart_finder" data-placement="listing_hero" data-intent="{escape(intent)}" href="/{locale}/smart-finder?intent={escape(copy["smart_intent"])}">{escape(copy["smart_finder_cta"])}</a></div>'
        f"</section>"
        f'<section id="listing-filters-section" class="card stack" aria-labelledby="listing-filters-title"><h2 id="listing-filters-title">{escape(copy["filters_title"])}</h2>{query_error_html}'
        f'<form id="listing-filters" class="listing-filters" method="get" action="{listing_path}" data-intent="{escape(intent)}">'
        f'<input id="form-page" type="hidden" name="page" value="1" /><input type="hidden" name="limit" value="{limit}" />'
        f'<div class="filter-grid">'
        f'<label class="filter-control" for="price_min"><span>{escape(copy["price_min"])}</span><input data-track-filter id="price_min" name="price_min" type="number" min="0" inputmode="numeric" value="{escape(filter_values["price_min"])}" /></label>'
        f'<label class="filter-control" for="price_max"><span>{escape(copy["price_max"])}</span><input data-track-filter id="price_max" name="price_max" type="number" min="0" inputmode="numeric" value="{escape(filter_values["price_max"])}" /></label>'
        f'<label class="filter-control" for="beds"><span>{escape(copy["beds"])}</span><input data-track-filter id="beds" name="beds" type="number" min="0" inputmode="numeric" value="{escape(filter_values["beds"])}" /></label>'
        f'<label class="filter-control" for="baths"><span>{escape(copy["baths"])}</span><input data-track-filter id="baths" name="baths" type="number" min="0" inputmode="numeric" value="{escape(filter_values["baths"])}" /></label>'
        f'<label class="filter-control" for="area"><span>{escape(copy["area"])}</span><select data-track-filter id="area" name="area">{"".join(area_options_html)}</select></label>'
        f'<label class="filter-control" for="project"><span>{escape(copy["project"])}</span><select data-track-filter id="project" name="project">{"".join(project_options_html)}</select></label>'
        f'<label class="filter-control" for="property_type"><span>{escape(copy["property_type"])}</span><select data-track-filter id="property_type" name="property_type">{"".join(property_type_options_html)}</select></label>'
        f'<label class="filter-control" for="sort"><span>{escape(copy["sort"])}</span><select id="sort" name="sort"><option value="newest"{" selected" if sort == "newest" else ""}>{escape(copy["sort_newest"])}</option><option value="price_asc"{" selected" if sort == "price_asc" else ""}>{escape(copy["sort_price_asc"])}</option><option value="price_desc"{" selected" if sort == "price_desc" else ""}>{escape(copy["sort_price_desc"])}</option></select></label>'
        f'</div><div class="cta-row"><button class="btn" type="submit" data-event="listing_cta_click" data-cta-id="listing_apply_filters" data-placement="filter_bar" data-intent="{escape(intent)}">{escape(copy["apply_filters"])}</button><a class="btn btn-secondary-hero" data-event="listing_cta_click" data-cta-id="listing_reset_filters" data-placement="filter_bar" data-intent="{escape(intent)}" href="{listing_path}">{escape(copy["reset_filters"])}</a></div></form></section>'
        f'<div id="listing-loading" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="listing-error-runtime" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f'<section id="listing-skeleton" class="listing-skeleton-grid" aria-hidden="true" hidden><article class="card skeleton-card"><div class="skeleton-media"></div><div class="skeleton-line w40"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></article><article class="card skeleton-card"><div class="skeleton-media"></div><div class="skeleton-line w40"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></article><article class="card skeleton-card"><div class="skeleton-media"></div><div class="skeleton-line w40"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></article></section>'
        f'<section id="listing-results" class="listing-grid">{cards_html}</section>{pagination_html}'
        f'<section class="card"><p class="muted">{escape(copy["loading_hint"])}</p><div class="cta-row"><a class="btn" data-event="listing_cta_click" data-cta-id="listing_footer_consultation" data-placement="listing_footer" data-intent="{escape(intent)}" href="/{locale}/contact?intent=consultation&source={escape(intent)}">{escape(copy["consult_cta"])}</a><a class="btn btn-secondary-hero" data-event="listing_cta_click" data-cta-id="listing_footer_smart_finder" data-placement="listing_footer" data-intent="{escape(intent)}" href="/{locale}/smart-finder?intent={escape(copy["smart_intent"])}">{escape(copy["smart_finder_cta"])}</a></div></section>'
        f"{tracking_script}"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["page_title"],
            intro=copy["page_intro"],
            body=body,
            request=request,
            db=db,
        )
    )


_EN_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]
_TH_MONTHS = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
]
_CONTENT_INVEST_KEYWORDS = (
    "invest",
    "investment",
    "yield",
    "roi",
    "cashflow",
    "capital gain",
    "ลงทุน",
    "ผลตอบแทน",
    "กระแสเงินสด",
)
_CONTENT_INVEST_TAG_MARKERS = {
    "invest",
    "investment",
    "investment-guide",
    "investment-guides",
    "yield",
    "yield-basics",
    "roi",
    "cashflow",
    "capital-gain",
    "การลงทุน",
    "ผลตอบแทน",
    "กระแสเงินสด",
}


def _format_locale_date(value: datetime | None, locale: str, *, fallback: str = "-") -> str:
    if value is None:
        return fallback
    dt = value.astimezone(UTC) if value.tzinfo is not None else value
    month_idx = max(1, min(12, dt.month)) - 1
    if locale == "th":
        return f"{dt.day} {_TH_MONTHS[month_idx]} {dt.year}"
    return f"{_EN_MONTHS[month_idx]} {dt.day}, {dt.year}"


def _localized_text_value(value: object, locale: str) -> str | None:
    if isinstance(value, dict):
        return _localized_dict_text(value, locale)
    text = str(value or "").strip()
    return text or None


def _article_body_metadata(article: Article) -> dict[str, object]:
    if not isinstance(article.body_md, dict):
        return {}
    return article.body_md


def _article_author_profile(
    article: Article, locale: str
) -> tuple[str | None, str | None, str | None]:
    body_meta = _article_body_metadata(article)
    profile = body_meta.get("author_profile")
    if not isinstance(profile, dict):
        return None, None, None
    name = _localized_text_value(profile.get("name"), locale)
    role = _localized_text_value(profile.get("role"), locale)
    bio = _localized_text_value(profile.get("bio"), locale)
    return name, role, bio


def _article_tags_for_locale(article: Article, locale: str) -> list[str]:
    def _coerce_tags(payload: object) -> list[str]:
        if isinstance(payload, dict):
            nested: list[str] = []
            for locale_key in [locale, "en", "th"]:
                nested.extend(_coerce_tags(payload.get(locale_key)))
            return nested
        if isinstance(payload, list):
            return [str(item).strip() for item in payload if str(item).strip()]
        if isinstance(payload, str):
            return [part.strip() for part in payload.split(",") if part.strip()]
        return []

    out: list[str] = []
    seen: set[str] = set()
    containers: list[dict] = []
    for raw in [article.title, article.excerpt, article.body_md]:
        if isinstance(raw, dict):
            containers.append(raw)
            localized = raw.get(locale)
            if isinstance(localized, dict):
                containers.insert(0, localized)
            for fallback_locale in ["en", "th"]:
                nested = raw.get(fallback_locale)
                if isinstance(nested, dict):
                    containers.append(nested)
    for container in containers:
        for key in ["tags", "topics", "keywords"]:
            for tag in _coerce_tags(container.get(key)):
                normalized = tag.casefold()
                if normalized in seen:
                    continue
                seen.add(normalized)
                out.append(tag)
                if len(out) == 8:
                    return out
    return out


def _article_author_label(article: Article, db: Session, locale: str) -> tuple[str, bool]:
    author_name, _, _ = _article_author_profile(article, locale)
    if author_name:
        return author_name, False
    if article.author_user_id is None:
        return (
            (
                "Author pending publication. TODO: assign article author in CMS."
                if locale == "en"
                else "ยังไม่มีผู้เขียนที่เผยแพร่ TODO: ระบุผู้เขียนใน CMS"
            ),
            True,
        )
    user = db.get(User, article.author_user_id)
    if user is None or not str(user.email or "").strip():
        return (
            (
                "Author pending publication. TODO: assign article author in CMS."
                if locale == "en"
                else "ยังไม่มีผู้เขียนที่เผยแพร่ TODO: ระบุผู้เขียนใน CMS"
            ),
            True,
        )
    return str(user.email).strip(), False


def _normalize_taxonomy_token(value: str) -> str:
    lowered = str(value or "").strip().casefold()
    if not lowered:
        return ""
    normalized = re.sub(r"[\s_]+", "-", lowered)
    normalized = re.sub(r"[^\w-]", "", normalized, flags=re.UNICODE)
    return normalized.strip("-")


def _is_invest_taxonomy_tag(value: str) -> bool:
    token = _normalize_taxonomy_token(value)
    if not token:
        return False
    return token in _CONTENT_INVEST_TAG_MARKERS_NORMALIZED


_CONTENT_INVEST_TAG_MARKERS_NORMALIZED = {
    _normalize_taxonomy_token(marker) for marker in _CONTENT_INVEST_TAG_MARKERS
}


def _slugify_heading(value: str, *, used: set[str]) -> str:
    base = re.sub(r"[^\w\s-]", "", str(value or "").strip(), flags=re.UNICODE)
    base = re.sub(r"\s+", "-", base, flags=re.UNICODE).strip("-").lower()
    if not base:
        base = "section"
    candidate = base
    suffix = 2
    while candidate in used:
        candidate = f"{base}-{suffix}"
        suffix += 1
    used.add(candidate)
    return candidate


def _render_inline_markdown(text: str) -> str:
    out: list[str] = []
    cursor = 0
    for match in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", text):
        out.append(escape(text[cursor : match.start()]))
        label = str(match.group(1) or "").strip()
        href = str(match.group(2) or "").strip()
        if href.startswith("/") or href.startswith("http://") or href.startswith("https://"):
            out.append(f'<a href="{escape(href)}">{escape(label)}</a>')
        else:
            out.append(escape(match.group(0)))
        cursor = match.end()
    out.append(escape(text[cursor:]))
    return "".join(out)


def _is_markdown_table_separator(line: str) -> bool:
    return bool(re.fullmatch(r"\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*", line))


def _split_markdown_table_cells(line: str) -> list[str]:
    raw = line.strip().strip("|")
    return [cell.strip() for cell in raw.split("|")]


def _render_article_markdown(markdown_text: str) -> tuple[str, list[tuple[str, str]]]:
    lines = str(markdown_text or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    blocks: list[str] = []
    toc_items: list[tuple[str, str]] = []
    used_ids: set[str] = set()
    idx = 0
    while idx < len(lines):
        line = lines[idx].rstrip()
        stripped = line.strip()
        if not stripped:
            idx += 1
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading_match:
            heading_text = heading_match.group(2).strip()
            heading_id = _slugify_heading(heading_text, used=used_ids)
            level = max(2, min(4, len(heading_match.group(1))))
            if level in {2, 3}:
                toc_items.append((heading_text, heading_id))
            blocks.append(
                f'<h{level} id="{escape(heading_id)}">{_render_inline_markdown(heading_text)}</h{level}>'
            )
            idx += 1
            continue

        if (
            stripped.startswith("|")
            and idx + 1 < len(lines)
            and _is_markdown_table_separator(lines[idx + 1])
        ):
            header_cells = _split_markdown_table_cells(stripped)
            idx += 2
            data_rows: list[list[str]] = []
            while idx < len(lines):
                current = lines[idx].strip()
                if not current.startswith("|"):
                    break
                data_rows.append(_split_markdown_table_cells(current))
                idx += 1
            thead = "".join(f"<th>{_render_inline_markdown(cell)}</th>" for cell in header_cells)
            tbody_rows = []
            for row_cells in data_rows:
                cells = "".join(f"<td>{_render_inline_markdown(cell)}</td>" for cell in row_cells)
                tbody_rows.append(f"<tr>{cells}</tr>")
            blocks.append(
                '<div class="table-wrap"><table class="article-table">'
                f"<thead><tr>{thead}</tr></thead><tbody>{''.join(tbody_rows)}</tbody></table></div>"
            )
            continue

        if re.match(r"^[-*]\s+.+", stripped):
            items: list[str] = []
            while idx < len(lines):
                candidate = lines[idx].strip()
                match = re.match(r"^[-*]\s+(.+)$", candidate)
                if not match:
                    break
                items.append(f"<li>{_render_inline_markdown(match.group(1).strip())}</li>")
                idx += 1
            blocks.append(f"<ul>{''.join(items)}</ul>")
            continue

        if re.match(r"^\d+\.\s+.+", stripped):
            items = []
            while idx < len(lines):
                candidate = lines[idx].strip()
                match = re.match(r"^\d+\.\s+(.+)$", candidate)
                if not match:
                    break
                items.append(f"<li>{_render_inline_markdown(match.group(1).strip())}</li>")
                idx += 1
            blocks.append(f"<ol>{''.join(items)}</ol>")
            continue

        paragraph_lines = [stripped]
        idx += 1
        while idx < len(lines):
            candidate = lines[idx].strip()
            if not candidate:
                break
            if re.match(r"^(#{1,6})\s+.+$", candidate):
                break
            if re.match(r"^[-*]\s+.+", candidate) or re.match(r"^\d+\.\s+.+", candidate):
                break
            if (
                candidate.startswith("|")
                and idx + 1 < len(lines)
                and _is_markdown_table_separator(lines[idx + 1])
            ):
                break
            paragraph_lines.append(candidate)
            idx += 1
        blocks.append(f"<p>{_render_inline_markdown(' '.join(paragraph_lines))}</p>")
    return "".join(blocks), toc_items


def _article_matches_invest_topic(article: Article, locale: str) -> bool:
    tags = _article_tags_for_locale(article, locale)
    if tags:
        if any(_is_invest_taxonomy_tag(tag) for tag in tags):
            return True
        # If taxonomy exists and does not map to invest markers, keep it out of invest listing.
        return False
    tags_corpus = " ".join(tags).casefold()
    title_text = str(_localized_dict_text(article.title, locale) or "").casefold()
    excerpt_text = str(_localized_dict_text(article.excerpt, locale) or "").casefold()
    slug = str(article.slug or "").casefold()
    corpus = " ".join([slug, title_text, excerpt_text, tags_corpus])
    return any(keyword in corpus for keyword in _CONTENT_INVEST_KEYWORDS)


def _content_tracking_script(*, loading_id: str, error_id: str) -> str:
    return f"""
<script>
(() => {{
  const locale = document.documentElement.lang || 'en';
  const path = location.pathname;
  const endpoint = '/api/v1/events';
  const loadingEl = document.getElementById('{loading_id}');
  const errorEl = document.getElementById('{error_id}');
  const scrollMarks = [25, 50, 75, 90];
  const firedMarks = new Set();

  function compact(raw) {{
    const out = {{}};
    for (const [k, v] of Object.entries(raw || {{}})) {{
      if (v === undefined || v === null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      out[k] = v;
    }}
    return out;
  }}

  function track(eventName, payload) {{
    const payloadBody = compact(payload);
    const sourceBody = compact({{
      app: 'flowbiz-public-runtime',
      env: 'runtime',
      page: path,
      locale,
      placement: payloadBody.placement,
    }});
    return fetch(endpoint, {{
      method: 'POST',
      headers: {{ 'content-type': 'application/json' }},
      body: JSON.stringify({{ event_name: eventName, source: sourceBody, payload: payloadBody }}),
      keepalive: true,
    }}).catch(() => null);
  }}

  document.querySelectorAll('[data-event]').forEach((node) => {{
    node.addEventListener('click', () => {{
      const eventName = node.getAttribute('data-event');
      if (!eventName) return;
      const loadingTarget = node.getAttribute('data-loading-target');
      if (loadingTarget && loadingEl instanceof HTMLElement && loadingTarget === loadingEl.id) {{
        loadingEl.hidden = false;
      }}
      track(eventName, compact({{
        label: node.textContent?.trim() || '',
        placement: node.getAttribute('data-placement') || undefined,
        cta_id: node.getAttribute('data-cta-id') || undefined,
        card_slug: node.getAttribute('data-card-slug') || undefined,
        article_slug: node.getAttribute('data-article-slug') || undefined,
      }}));
    }});
  }});

  window.addEventListener('scroll', () => {{
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const depth = Math.round((window.scrollY / scrollHeight) * 100);
    for (const mark of scrollMarks) {{
      if (depth >= mark && !firedMarks.has(mark)) {{
        firedMarks.add(mark);
        track('content_scroll_depth', {{ placement: 'content_page', depth: mark }});
      }}
    }}
  }}, {{ passive: true }});

  window.addEventListener('error', () => {{
    if (errorEl instanceof HTMLElement) errorEl.hidden = false;
  }});
}})();
</script>
"""


def _content_listing_copy(locale: str, mode: str) -> dict[str, str]:
    if locale == "th":
        copy: dict[str, str] = {
            "blog_title": "Blog",
            "guides_title": "Guides",
            "invest_title": "Investment Guides",
            "blog_intro": "บทความจากทีมงาน พร้อมบริบทและขั้นตอนถัดไปที่ชัดเจน",
            "guides_intro": "คู่มือปฏิบัติสำหรับการซื้อ ลงทุน เช่า และขายในพัทยา",
            "invest_intro": "คู่มือโฟกัสการลงทุนโดยใช้ข้อมูลที่เผยแพร่ในระบบเท่านั้น",
            "insights_title": "Market Insights",
            "insights_intro": "ไกด์และบทความที่เผยแพร่แล้ว พร้อมเส้นทางไปสู่การปรึกษา",
            "category_title": "เลือกหัวข้อคอนเทนต์",
            "date_label": "เผยแพร่",
            "updated_label": "อัปเดต",
            "date_pending": "ยังไม่มีวันที่เผยแพร่ TODO: เพิ่มวันที่เผยแพร่",
            "updated_pending": "ยังไม่มีวันที่อัปเดต TODO: เพิ่มวันที่อัปเดต",
            "excerpt_pending": "ยังไม่มีบทสรุป TODO: เพิ่ม excerpt ที่อนุมัติแล้ว",
            "empty": "ยังไม่มีคอนเทนต์ที่เผยแพร่ TODO: เผยแพร่บทความที่อนุมัติแล้ว",
            "loading": "กำลังโหลดคอนเทนต์...",
            "runtime_error": "เกิดข้อผิดพลาดในการแสดงผล กรุณาลองใหม่",
            "consult_cta": "ขอคำปรึกษา",
            "read_article": "อ่านบทความ",
            "back_insights": "กลับหน้า Insights",
            "category_blog_desc": "บทความมุมมองตลาดและกระบวนการทำงาน",
            "category_guides_desc": "คู่มือใช้งานจริงสำหรับผู้ซื้อและผู้ขาย",
            "category_invest_desc": "หัวข้อที่เกี่ยวข้องกับผลตอบแทนและการลงทุน",
            "topic_note": "แท็กจะแสดงเมื่อข้อมูลหัวข้อถูกเผยแพร่",
        }
    else:
        copy = {
            "blog_title": "Blog",
            "guides_title": "Guides",
            "invest_title": "Investment Guides",
            "blog_intro": "Editorial market notes with clear conversion paths and no fabricated claims.",
            "guides_intro": "Practical guides for buying, investing, renting, and selling in Pattaya.",
            "invest_intro": "Investment-focused guides from published system data only.",
            "insights_title": "Market Insights",
            "insights_intro": "Published guides and blog posts with consultable next steps.",
            "category_title": "Browse Content Topics",
            "date_label": "Published",
            "updated_label": "Updated",
            "date_pending": "Publish date pending. TODO: add approved publish date.",
            "updated_pending": "Update date pending. TODO: add approved update date.",
            "excerpt_pending": "Excerpt pending publication. TODO: add approved summary.",
            "empty": "No published content yet. TODO: publish approved guides or blog posts.",
            "loading": "Loading content...",
            "runtime_error": "Unable to render this content page right now. Please retry.",
            "consult_cta": "Request Consultation",
            "read_article": "Read article",
            "back_insights": "Back to Insights",
            "category_blog_desc": "Editorial market context and workflow notes.",
            "category_guides_desc": "Actionable playbooks for buyers and sellers.",
            "category_invest_desc": "Topics focused on yield and investment decisions.",
            "topic_note": "Tags appear when topic metadata is published.",
        }
    if mode == "blog":
        copy["page_title"] = copy["blog_title"]
        copy["page_intro"] = copy["blog_intro"]
        copy["listing_suffix"] = "/blog"
    elif mode == "guides":
        copy["page_title"] = copy["guides_title"]
        copy["page_intro"] = copy["guides_intro"]
        copy["listing_suffix"] = "/guides"
    elif mode == "invest-guides":
        copy["page_title"] = copy["invest_title"]
        copy["page_intro"] = copy["invest_intro"]
        copy["listing_suffix"] = "/invest/guides"
    else:
        copy["page_title"] = copy["insights_title"]
        copy["page_intro"] = copy["insights_intro"]
        copy["listing_suffix"] = "/insights"
    return copy


def _render_insights_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    return _render_content_listing_page(locale, request, db, mode="insights")


def _render_content_listing_page(
    locale: str, request: Request, db: Session, mode: str
) -> HTMLResponse:
    copy = _content_listing_copy(locale, mode)
    categories = (
        ["guide", "blog"] if mode == "insights" else (["blog"] if mode == "blog" else ["guide"])
    )
    rows = db.scalars(
        select(Article)
        .where(
            Article.deleted_at.is_(None),
            Article.status == "published",
            Article.category.in_(categories),
        )
        .order_by(desc(Article.published_at), desc(Article.updated_at), desc(Article.created_at))
        .limit(60)
    ).all()
    if mode == "invest-guides":
        rows = [row for row in rows if _article_matches_invest_topic(row, locale)]
    rows = rows[:24]

    blog_count = int(
        db.scalar(
            select(func.count())
            .select_from(Article)
            .where(
                Article.deleted_at.is_(None),
                Article.status == "published",
                Article.category == "blog",
            )
        )
        or 0
    )
    guide_rows = db.scalars(
        select(Article).where(
            Article.deleted_at.is_(None), Article.status == "published", Article.category == "guide"
        )
    ).all()
    guides_count = len(guide_rows)
    invest_count = len([row for row in guide_rows if _article_matches_invest_topic(row, locale)])

    category_cards = (
        f'<article class="card category-card"><h3>{escape(copy["blog_title"])}</h3><p>{escape(copy["category_blog_desc"])}</p><p class="muted">{blog_count}</p><a class="btn" href="/{locale}/blog">{escape(copy["blog_title"])}</a></article>'
        f'<article class="card category-card"><h3>{escape(copy["guides_title"])}</h3><p>{escape(copy["category_guides_desc"])}</p><p class="muted">{guides_count}</p><a class="btn" href="/{locale}/guides">{escape(copy["guides_title"])}</a></article>'
        f'<article class="card category-card"><h3>{escape(copy["invest_title"])}</h3><p>{escape(copy["category_invest_desc"])}</p><p class="muted">{invest_count}</p><a class="btn" href="/{locale}/invest/guides">{escape(copy["invest_title"])}</a></article>'
    )

    cards: list[str] = []
    for row in rows:
        title = _localized_dict_text(row.title, locale) or row.slug
        excerpt = _localized_dict_text(row.excerpt, locale) or copy["excerpt_pending"]
        tags = _article_tags_for_locale(row, locale)
        tag_badges = "".join(f'<span class="tag">{escape(tag)}</span>' for tag in tags)
        tags_html = (
            f'<div class="tag-row">{tag_badges}</div>'
            if tags
            else f'<p class="muted">{escape(copy["topic_note"])}</p>'
        )
        media = _safe_media_url(row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
        published_text = _format_locale_date(
            row.published_at, locale, fallback=copy["date_pending"]
        )
        updated_text = _format_locale_date(row.updated_at, locale, fallback=copy["updated_pending"])
        category_slug = "blog" if row.category == "blog" else "guides"
        detail_href = f"/{locale}/{category_slug}/{row.slug}"
        cards.append(
            f'<article class="card content-card" data-card-slug="{escape(row.slug)}">'
            f'<a class="content-link" data-event="article_click" data-placement="listing_card" data-card-slug="{escape(row.slug)}" href="{detail_href}">'
            f'<img class="media" src="{escape(media)}" alt="{escape(title)}" width="640" height="360" loading="lazy" />'
            f"<h2>{escape(title)}</h2></a>"
            f"<p>{escape(excerpt)}</p>"
            f'<p class="muted">{escape(copy["date_label"])}: {escape(published_text)} • {escape(copy["updated_label"])}: {escape(updated_text)}</p>'
            f"{tags_html}"
            f'<div class="cta-row">'
            f'<a class="btn" data-event="article_click" data-placement="listing_card" data-card-slug="{escape(row.slug)}" href="{detail_href}">{escape(copy["read_article"])}</a>'
            f'<a class="btn btn-secondary-hero" data-event="content_cta_click" data-cta-id="content_consult_card" data-placement="listing_card" data-article-slug="{escape(row.slug)}" href="/{locale}/contact?intent=consultation&article={escape(row.slug)}">{escape(copy["consult_cta"])}</a>'
            f"</div>"
            f"</article>"
        )
    cards_html = "".join(cards)
    is_empty = not cards
    empty_html = f'<div id="content-empty" class="state-empty"{" hidden" if not is_empty else ""}>{escape(copy["empty"])}</div>'
    loading_id = "content-loading"
    error_id = "content-error"
    tracking_script = _content_tracking_script(loading_id=loading_id, error_id=error_id)
    listing_styles = (
        "<style>"
        ".content-category-grid{display:grid;gap:16px;grid-template-columns:1fr}.content-grid{display:grid;gap:16px;grid-template-columns:1fr}"
        ".content-card{display:grid;gap:10px}.content-link{display:grid;gap:10px;text-decoration:none}.tag-row{display:flex;gap:8px;flex-wrap:wrap}"
        ".tag{display:inline-flex;padding:2px 8px;border-radius:999px;background:#edf6f3;color:#0f6d5a;font-size:.85rem}"
        ".cta-row{display:flex;gap:10px;flex-wrap:wrap}.article-shell{display:grid;gap:16px}"
        "@media (min-width:768px){.content-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.content-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.content-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.content-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "@media (min-width:2560px){.content-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}"
        "</style>"
    )
    body = (
        f"{listing_styles}"
        f'<section class="card article-shell" aria-labelledby="content-intro-title">'
        f'<h2 id="content-intro-title">{escape(copy["page_title"])}</h2><p>{escape(copy["page_intro"])}</p>'
        f'<div class="cta-row"><a class="btn" data-event="content_cta_click" data-cta-id="content_consult_header" data-placement="listing_header" href="/{locale}/contact?intent=consultation">{escape(copy["consult_cta"])}</a>'
        f'<a class="btn btn-secondary-hero" href="/{locale}/insights">{escape(copy["back_insights"])}</a></div></section>'
        f'<section class="card" aria-labelledby="content-category-title"><h2 id="content-category-title">{escape(copy["category_title"])}</h2><div class="content-category-grid">{category_cards}</div></section>'
        f'<div id="{loading_id}" class="state-loading" role="status" aria-live="polite" hidden>{escape(copy["loading"])}</div>'
        f'<div id="{error_id}" class="state-error" hidden>{escape(copy["runtime_error"])}</div>'
        f"{empty_html}"
        f'<section class="content-grid" aria-live="polite">{cards_html}</section>'
        f"{tracking_script}"
    )
    canonical = _absolute_url(request, f"/{locale}{copy['listing_suffix']}")
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["page_title"],
            intro=copy["page_intro"],
            body=body,
            request=request,
            db=db,
            canonical_href=canonical,
        )
    )


def _render_content_detail_page(
    locale: str, request: Request, db: Session, slug: str, category: str
) -> HTMLResponse:
    row = db.scalar(
        select(Article).where(
            Article.deleted_at.is_(None),
            Article.status == "published",
            Article.slug == slug,
            Article.category == category,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    title = _localized_dict_text(row.title, locale) or row.slug
    excerpt = _localized_dict_text(row.excerpt, locale) or (
        "Excerpt pending publication. TODO: add approved summary."
        if locale == "en"
        else "ยังไม่มีบทสรุป TODO: เพิ่ม excerpt ที่อนุมัติแล้ว"
    )
    body_md = _localized_dict_text(row.body_md, locale) or ""
    rendered_body, toc_items = _render_article_markdown(body_md)
    if not rendered_body:
        rendered_body = (
            "<p>Article body pending publication. TODO: add approved body content.</p>"
            if locale == "en"
            else "<p>ยังไม่มีเนื้อหาบทความ TODO: เพิ่มเนื้อหาที่อนุมัติแล้ว</p>"
        )
    show_toc = len(toc_items) >= 3
    tags = _article_tags_for_locale(row, locale)
    _, author_role, author_bio = _article_author_profile(row, locale)
    author_label, author_pending = _article_author_label(row, db, locale)
    hero_media = _safe_media_url(row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
    published_text = _format_locale_date(
        row.published_at,
        locale,
        fallback=(
            "Publish date pending. TODO: add approved publish date."
            if locale == "en"
            else "ยังไม่มีวันที่เผยแพร่ TODO: เพิ่มวันที่เผยแพร่"
        ),
    )
    updated_text = _format_locale_date(
        row.updated_at,
        locale,
        fallback=(
            "Update date pending. TODO: add approved update date."
            if locale == "en"
            else "ยังไม่มีวันที่อัปเดต TODO: เพิ่มวันที่อัปเดต"
        ),
    )

    route_prefix = "blog" if category == "blog" else "guides"
    detail_path = f"/{locale}/{route_prefix}/{row.slug}"
    listing_path = f"/{locale}/{route_prefix}"

    related_rows = db.scalars(
        select(Article)
        .where(
            Article.deleted_at.is_(None),
            Article.status == "published",
            Article.category == category,
            Article.id != row.id,
        )
        .order_by(desc(Article.published_at), desc(Article.updated_at), desc(Article.created_at))
        .limit(4)
    ).all()
    related_html = "".join(
        (
            f'<article class="card">'
            f'<a class="content-link" data-event="article_click" data-placement="related_content" data-card-slug="{escape(item.slug)}" href="/{locale}/{route_prefix}/{escape(item.slug)}">'
            f'<img class="media" src="{escape(_safe_media_url(item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}" alt="{escape(_localized_dict_text(item.title, locale) or item.slug)}" width="640" height="360" loading="lazy" />'
            f"<h3>{escape(_localized_dict_text(item.title, locale) or item.slug)}</h3></a>"
            f"<p>{escape(_localized_dict_text(item.excerpt, locale) or excerpt)}</p>"
            f"</article>"
        )
        for item in related_rows
    ) or (
        '<div class="card">'
        + escape(
            "Related content is pending publication. TODO: publish at least one related article."
            if locale == "en"
            else "ยังไม่มีคอนเทนต์ที่เกี่ยวข้อง TODO: เผยแพร่บทความที่เกี่ยวข้องอย่างน้อย 1 รายการ"
        )
        + "</div>"
    )

    toc_html = ""
    if show_toc:
        toc_html = (
            '<nav id="article-toc" class="card" aria-label="Table of contents">'
            + f"<h2>{'Table of contents' if locale == 'en' else 'สารบัญ'}</h2>"
            + "<ol>"
            + "".join(
                f'<li><a href="#{escape(anchor)}">{escape(label)}</a></li>'
                for label, anchor in toc_items
            )
            + "</ol></nav>"
        )

    tag_badges = "".join(f'<span class="tag">{escape(tag)}</span>' for tag in tags)
    tag_html = (
        f'<div class="tag-row">{tag_badges}</div>'
        if tags
        else f'<p class="muted">{"Tags pending publication. TODO: add approved topic tags." if locale == "en" else "ยังไม่มีแท็ก TODO: เพิ่มแท็กที่อนุมัติแล้ว"}</p>'
    )
    schema_payload: dict[str, object] = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": excerpt,
        "inLanguage": locale,
        "url": _absolute_url(request, detail_path),
        "mainEntityOfPage": _absolute_url(request, detail_path),
        "image": [_absolute_url(request, hero_media)],
        "datePublished": row.published_at.isoformat() if row.published_at else None,
        "dateModified": row.updated_at.isoformat() if row.updated_at else None,
    }
    if not author_pending:
        author_schema: dict[str, object] = {"@type": "Person", "name": author_label}
        if author_role:
            author_schema["jobTitle"] = author_role
        schema_payload["author"] = author_schema
    if tags:
        schema_payload["keywords"] = ", ".join(tags)
    schema_json = json.dumps(
        {k: v for k, v in schema_payload.items() if v is not None}, ensure_ascii=False
    )

    loading_id = "article-loading"
    error_id = "article-error"
    tracking_script = _content_tracking_script(loading_id=loading_id, error_id=error_id)
    detail_styles = (
        "<style>"
        ".article-layout{display:grid;gap:16px}.article-meta{display:grid;gap:8px}.article-prose{max-width:72ch;line-height:1.72}"
        ".article-prose p{margin:0 0 12px}.article-prose h2,.article-prose h3,.article-prose h4{margin:22px 0 10px;line-height:1.35}"
        ".article-prose ul,.article-prose ol{padding-left:22px;display:grid;gap:8px}.article-prose a{text-decoration:underline}"
        ".table-wrap{overflow-x:auto}.article-table{width:100%;border-collapse:collapse}.article-table th,.article-table td{border:1px solid #d1d5db;padding:8px;text-align:left;vertical-align:top}"
        ".tag-row{display:flex;gap:8px;flex-wrap:wrap}.tag{display:inline-flex;padding:2px 8px;border-radius:999px;background:#edf6f3;color:#0f6d5a;font-size:.85rem}"
        ".related-grid{display:grid;gap:16px;grid-template-columns:1fr}.content-link{display:grid;gap:10px;text-decoration:none}.cta-row{display:flex;gap:10px;flex-wrap:wrap}"
        "@media (min-width:768px){.related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        "@media (min-width:1200px){.related-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        "@media (min-width:1920px){.related-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}"
        "</style>"
    )
    author_role_html = f'<p class="muted">{escape(author_role)}</p>' if author_role else ""
    author_bio_html = f'<p class="muted">{escape(author_bio)}</p>' if author_bio else ""
    body = (
        f"{detail_styles}"
        f'<section id="article-hero" class="card article-layout">'
        f'<img class="media" src="{escape(hero_media)}" alt="{escape(title)}" width="1280" height="720" loading="eager" />'
        f"<p>{escape(excerpt)}</p>"
        f'<div class="article-meta">'
        f'<p class="muted">{"Published" if locale == "en" else "เผยแพร่"}: {escape(published_text)}</p>'
        f'<p class="muted">{"Updated" if locale == "en" else "อัปเดต"}: {escape(updated_text)}</p>'
        f'<p class="muted">{"Author" if locale == "en" else "ผู้เขียน"}: {escape(author_label)}</p>'
        f"{author_role_html}"
        f"{author_bio_html}"
        f"</div>"
        f"{tag_html}"
        f'<div class="cta-row"><a class="btn" data-event="content_cta_click" data-cta-id="article_consultation_hero" data-placement="article_hero" data-article-slug="{escape(row.slug)}" href="/{locale}/contact?intent=consultation&article={escape(row.slug)}">{"Request Consultation" if locale == "en" else "ขอคำปรึกษา"}</a>'
        f'<a class="btn btn-secondary-hero" href="{listing_path}">{"Back to listing" if locale == "en" else "กลับหน้ารายการ"}</a></div>'
        f"</section>"
        f"{toc_html}"
        f'<section id="article-body" class="card"><h2>{"Article" if locale == "en" else "บทความ"}</h2><div class="article-prose">{rendered_body}</div></section>'
        f'<section id="article-related" class="stack"><h2>{"Related content" if locale == "en" else "คอนเทนต์ที่เกี่ยวข้อง"}</h2><div class="related-grid">{related_html}</div></section>'
        f'<section class="card"><h2>{"Need help with this topic?" if locale == "en" else "ต้องการคำแนะนำต่อจากบทความนี้?"}</h2><p>{"Continue to consultation for a curated next step." if locale == "en" else "ไปต่อที่ consultation เพื่อรับขั้นตอนถัดไปที่เหมาะกับคุณ"}</p><div class="cta-row">'
        f'<a class="btn" data-event="content_cta_click" data-cta-id="article_consultation_footer" data-placement="article_footer" data-article-slug="{escape(row.slug)}" href="/{locale}/contact?intent=consultation&article={escape(row.slug)}">{"Request Consultation" if locale == "en" else "ขอคำปรึกษา"}</a>'
        f'<a class="btn btn-secondary-hero" href="/{locale}/insights">{"View all insights" if locale == "en" else "ดู Insights ทั้งหมด"}</a>'
        f"</div></section>"
        f'<div id="{loading_id}" class="state-loading" role="status" aria-live="polite" hidden>{"Loading article..." if locale == "en" else "กำลังโหลดบทความ..."}</div>'
        f'<div id="{error_id}" class="state-error" hidden>{"Unable to render article right now. Please retry." if locale == "en" else "ยังไม่สามารถแสดงบทความได้ กรุณาลองใหม่"}</div>'
        f'<script type="application/ld+json" data-schema-hook="article-detail">{schema_json}</script>'
        f"{tracking_script}"
    )
    canonical = _absolute_url(request, detail_path)
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=title,
            intro=excerpt,
            body=body,
            request=request,
            db=db,
            canonical_href=canonical,
            is_article_detail=True,
        )
    )


def _format_text_block(value: str) -> str:
    return "<br />".join(escape(part) for part in str(value or "").splitlines()) or ""


def _company_page(
    locale: str,
    slug: str,
    title: str,
    fallback: str,
    request: Request,
    db: Session,
) -> HTMLResponse:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    content = str(row.content if row is not None else fallback).strip() or fallback
    meta = str(row.meta_description if row is not None else "").strip()
    body = f'<section class="card"><p>{escape(meta)}</p><div>{_format_text_block(content)}</div><a class="btn" href="/{locale}/contact">{"Contact our team" if locale == "en" else "ติดต่อทีมงาน"}</a></section>'
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=title,
            intro=meta or title,
            body=body,
            request=request,
            db=db,
            meta_description=meta or title,
        )
    )


def _normalize_company_kv_key(raw: str) -> str:
    key = re.sub(r"[^a-z0-9]+", "_", str(raw or "").strip().lower()).strip("_")
    return key


def _parse_company_kv_content(content: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw_line in str(content or "").splitlines():
        line = raw_line.strip()
        if not line or ":" not in line:
            continue
        key_raw, value_raw = line.split(":", 1)
        key = _normalize_company_kv_key(key_raw)
        value = value_raw.strip()
        if not key or not value or key in out:
            continue
        out[key] = value
    return out


def _contact_detail_value(
    fields: dict[str, str],
    keys: list[str],
    *,
    fallback: str,
) -> str:
    for key in keys:
        value = str(fields.get(key) or "").strip()
        if value:
            return value
    return fallback


def _contact_map_href(fields: dict[str, str]) -> str | None:
    direct = str(
        fields.get("map_url") or fields.get("map") or fields.get("google_map") or ""
    ).strip()
    if direct:
        parsed = urlparse(direct)
        host = str(parsed.hostname or "").lower()
        if parsed.scheme in {"http", "https"} and host in {
            "maps.google.com",
            "www.google.com",
            "goo.gl",
            "maps.app.goo.gl",
        }:
            return direct

    lat_raw = fields.get("lat") or fields.get("latitude")
    lng_raw = fields.get("lng") or fields.get("longitude")
    lat, lng = _extract_lat_lng({"lat": lat_raw, "lng": lng_raw})
    if lat is None or lng is None:
        address = str(fields.get("address") or fields.get("office_address") or "").strip()
        if not address:
            return None
        return f"https://maps.google.com/?{urlencode({'q': address})}"
    return f"https://maps.google.com/?q={lat:.6f},{lng:.6f}"


def _contact_channel_href(kind: str, value: str) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if kind == "email":
        return f"mailto:{text}" if "@" in text else None
    if kind == "phone":
        compact = re.sub(r"[^0-9+]", "", text)
        return f"tel:{compact}" if compact else None
    if kind == "whatsapp":
        digits = re.sub(r"[^0-9]", "", text)
        return f"https://wa.me/{digits}" if digits else None
    if kind == "line":
        return f"https://line.me/R/ti/p/{text}" if text else None
    return None


def _render_about_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    about_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "about"))
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    team_rows = db.scalars(
        select(TeamMember)
        .where(TeamMember.deleted_at.is_(None), TeamMember.status == "active")
        .order_by(TeamMember.display_order.asc(), TeamMember.name.asc())
    ).all()
    review_rows = db.scalars(
        select(Testimonial)
        .where(Testimonial.deleted_at.is_(None), Testimonial.status == "published")
        .order_by(Testimonial.display_order.asc(), desc(Testimonial.updated_at))
        .limit(6)
    ).all()
    about_content = str(about_row.content if about_row is not None else "").strip()
    process_content = str(process_row.content if process_row is not None else "").strip()
    if not about_content:
        about_content = (
            "About content is not published yet. TODO: publish approved company overview."
            if locale == "en"
            else "ยังไม่มีเนื้อหา About ที่เผยแพร่ TODO: เพิ่มข้อมูลบริษัทที่อนุมัติแล้ว"
        )
    if not process_content:
        process_content = (
            "Process content is not published yet. TODO: publish approved workflow detail."
            if locale == "en"
            else "ยังไม่มีเนื้อหา Process ที่เผยแพร่ TODO: เพิ่มขั้นตอนการทำงานที่อนุมัติแล้ว"
        )
    team_cards = []
    for row in team_rows:
        photo = (
            _local_runtime_media_path(str(row.photo_url or "").strip(), request=request)
            or _DEFAULT_MEDIA_FALLBACK
        )
        photo_html = f'<img class="media" src="{escape(photo)}" alt="{escape(row.name)}" width="640" height="360" loading="lazy" />'
        team_cards.append(
            f'<article class="card">{photo_html}<h3>{escape(row.name)}</h3><p class="muted">{escape(row.role_title)}</p><p>{escape(_localized_dict_text(row.bio, locale) or "")}</p></article>'
        )
    team_body = "".join(team_cards)
    if not team_body:
        team_fallback = (
            "Team profiles are not published yet. TODO: publish approved team bios."
            if locale == "en"
            else "ยังไม่มีโปรไฟล์ทีมที่เผยแพร่ TODO: เพิ่มประวัติทีมที่อนุมัติแล้ว"
        )
        team_body = f'<div class="card">{escape(team_fallback)}</div>'
    reviews_body = "".join(
        f'<article class="card"><h3>{escape(row.attribution_name or ("Client review" if locale == "en" else "รีวิวลูกค้า"))}</h3><p><strong>{escape(row.quote)}</strong></p><p class="muted">{escape(str(row.context or row.persona or row.intent or "").strip())}</p></article>'
        for row in review_rows
    )
    if not reviews_body:
        review_fallback = (
            "Approved testimonials are not published yet. Publish testimonial records to populate this page."
            if locale == "en"
            else "ยังไม่มี testimonial ที่เผยแพร่ โปรดเผยแพร่ testimonial เพื่อให้หน้านี้แสดงผล"
        )
        reviews_body = f'<div class="card">{escape(review_fallback)}</div>'
    proof_cards = []
    for row in team_rows[:3]:
        photo = (
            _local_runtime_media_path(str(row.photo_url or "").strip(), request=request)
            or _DEFAULT_MEDIA_FALLBACK
        )
        proof_cards.append(
            f'<article class="card"><img class="media" src="{escape(photo)}" alt="{escape(row.name)} proof asset" width="640" height="360" loading="lazy" /><h3>{escape(row.name)}</h3><p>{"Published local media asset from workflow." if locale == "en" else "สื่อ local ที่เผยแพร่ผ่าน workflow"}</p></article>'
        )
    if not proof_cards:
        fallback_note = (
            "Proof assets are pending publication. TODO: publish approved local media assets."
            if locale == "en"
            else "ยังไม่มี proof assets ที่เผยแพร่ TODO: เพิ่มสื่อ local ที่อนุมัติแล้ว"
        )
        proof_cards.append(
            f'<article class="card"><img class="media" src="{_DEFAULT_MEDIA_FALLBACK}" alt="Proof asset fallback" width="640" height="360" loading="lazy" /><p>{escape(fallback_note)}</p></article>'
        )
    work_fallback = (
        "Video proof appears when approved local media is published in the system."
        if locale == "en"
        else "ส่วนวิดีโอจะแสดงเมื่อมีการเผยแพร่สื่อ local ที่อนุมัติแล้วในระบบ"
    )
    how_we_work_href = f"/{locale}/how-we-work"
    proof_cta_label = "Open how we work" if locale == "en" else "เปิดหน้า how we work"
    about_cta_label = "Contact our local team" if locale == "en" else "ติดต่อทีม local"
    body = (
        f'<section id="about-section" class="card"><h2>{escape(about_row.title if about_row is not None else ("About" if locale == "en" else "About"))}</h2><div>{_format_text_block(about_content)}</div></section>'
        f'<section id="process-section" class="card"><h2>{"How we work" if locale == "en" else "How we work"}</h2><div>{_format_text_block(process_content)}</div></section>'
        f'<section id="team-section" class="grid"><h2>{"Team" if locale == "en" else "Team"}</h2>{team_body}</section>'
        f'<section id="proof-assets" class="grid"><h2>{"Proof assets" if locale == "en" else "Proof assets"}</h2>{"".join(proof_cards)}</section>'
        f'<section id="client-reviews" class="grid"><h2>{"Client Reviews" if locale == "en" else "Client Reviews"}</h2>{reviews_body}</section>'
        f'<section id="work-proof" class="card"><h2>{"See our work" if locale == "en" else "ดูผลงานของเรา"}</h2><p>{escape(work_fallback)}</p><div class="grid"><a class="btn" href="{how_we_work_href}">{proof_cta_label}</a><a class="btn" href="/{locale}/contact?intent=consultation">{about_cta_label}</a></div></section>'
    )
    title = "About" if locale == "en" else "About"
    intro = str(about_row.meta_description if about_row is not None else "").strip() or (
        "Published company overview and supporting content."
        if locale == "en"
        else "ข้อมูลบริษัทและคอนเทนต์ที่เผยแพร่แล้ว"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=title,
            intro=intro,
            body=body,
            request=request,
            db=db,
        )
    )


def _render_how_we_work_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    content = str(process_row.content if process_row is not None else "").strip()
    if not content:
        content = (
            "How-we-work detail is not published yet. TODO: publish approved process details."
            if locale == "en"
            else "ยังไม่มีเนื้อหา how-we-work ที่เผยแพร่ TODO: เพิ่มรายละเอียด process ที่อนุมัติแล้ว"
        )
    intro = str(process_row.meta_description if process_row is not None else "").strip() or (
        "Process and handoff steps for consultation, valuation, and listing."
        if locale == "en"
        else "ขั้นตอนการทำงานและการส่งมอบสำหรับ consultation, valuation และ listing"
    )
    process_title = (
        process_row.title
        if process_row is not None
        else ("How we work" if locale == "en" else "How we work")
    )
    steps = (
        [
            "Consultation and goal setup",
            "Document review and data check",
            "Go-live plan with approval checkpoints",
        ]
        if locale == "en"
        else ["ตั้งเป้าหมายและรับข้อมูลเบื้องต้น", "ตรวจเอกสารและตรวจข้อมูล", "วางแผน go-live พร้อมจุดอนุมัติ"]
    )
    steps_html = "".join(f"<li>{escape(step)}</li>" for step in steps)
    body = (
        f'<section id="how-we-work-overview" class="card"><h2>{escape(process_title)}</h2><div>{_format_text_block(content)}</div></section>'
        f'<section id="how-we-work-steps" class="card"><h2>{"Process overview" if locale == "en" else "ภาพรวมขั้นตอน"}</h2><ol>{steps_html}</ol></section>'
        f'<section id="how-we-work-proof" class="card"><h2>{"Process proof assets" if locale == "en" else "หลักฐานประกอบ process"}</h2><img class="media" src="{_DEFAULT_MEDIA_FALLBACK}" alt="Process proof asset" width="1280" height="720" loading="lazy" /><p>{"Only local media from our runtime storage is used in public pages." if locale == "en" else "หน้า public ใช้เฉพาะสื่อ local จากระบบ storage ของเรา"}</p></section>'
        f'<section id="how-we-work-next-step" class="card"><h2>{"Next step" if locale == "en" else "ขั้นตอนถัดไป"}</h2><div class="grid"><a class="btn" href="/{locale}/contact?intent=consultation">{"Request consultation" if locale == "en" else "ขอคำปรึกษา"}</a><a class="btn" href="/{locale}/sell/list-property">{"List a property" if locale == "en" else "ลงประกาศทรัพย์"}</a></div></section>'
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=process_title,
            intro=intro,
            body=body,
            request=request,
            db=db,
        )
    )


def _foreign_buyer_hub_copy(locale: str) -> dict[str, object]:
    if locale == "th":
        return {
            "title": "Foreign Buyer Hub",
            "intro": "ศูนย์ข้อมูลนี้เป็น guidance เชิงภาพรวมสำหรับผู้ซื้อต่างชาติในพัทยาเท่านั้น ไม่ใช่คำรับรองทางกฎหมาย ภาษี หรือสิทธิ์ที่ใช้ได้กับทุกกรณี",
            "eyebrow": "Foreign Buyer Advisory",
            "coverage_title": "สิ่งที่ hub ครอบคลุมตอนนี้",
            "coverage_body": "hub ตอนนี้ครอบคลุม ownership, eligibility และ buying process basics เพื่อรวม guidance หลักไว้ในจุดเดียวโดยไม่เปลี่ยน funnel เดิมหรือหน้า V1 ที่มีอยู่",
            "ownership_title": "Ownership and eligibility basics",
            "ownership_points": [
                "คอนโดบางยูนิตอาจเข้ากรอบ foreign quota ได้ แต่ availability และเอกสารต้องตรวจสอบเป็นรายทรัพย์",
                "โครงสร้างการถือครองแบบอื่น เช่น leasehold หรือ company holding ต้องให้ที่ปรึกษาและทนายช่วยประเมินเป็นกรณี",
                "หน้า hub นี้อธิบายจุดเริ่มต้นของการประเมินสิทธิ์ ไม่ใช่คำยืนยันว่าธุรกรรมจะทำได้โดยอัตโนมัติ",
            ],
            "process_title": "Buying process module",
            "process_intro": "ลำดับด้านล่างเป็น roadmap เชิงอธิบายสำหรับผู้ซื้อต่างชาติ เพื่อช่วยเข้าใจจังหวะการตัดสินใจและจุดที่ควรกลับเข้าสู่ advisor หรือนักกฎหมาย",
            "process_steps": [
                {
                    "title": "1. Discovery and shortlist review",
                    "body": "เริ่มจากกำหนดเป้าหมาย งบ และประเภท inventory ที่น่าจะสอดคล้องกับ ownership path ก่อนค่อยคัด shortlist ที่ควรตรวจต่อ",
                },
                {
                    "title": "2. Reservation and due diligence stage",
                    "body": "เมื่อมีทรัพย์ที่สนใจ ควร review reservation terms, project facts, และจุดที่ต้องให้ advisor หรือนักกฎหมายช่วยตรวจเพิ่มเติมก่อน commit",
                },
                {
                    "title": "3. Transfer preparation",
                    "body": "ก่อนถึงวันโอน ควรเตรียมเอกสาร การโอนเงิน และการตรวจเงื่อนไขสัญญาที่เกี่ยวข้อง โดยยอมรับว่ารายการจริงอาจต่างกันตามเคส",
                },
                {
                    "title": "4. Post-transfer support expectations",
                    "body": "หลังโอนแล้ว อาจยังมีงานติดตาม เช่น handover, utility setup, หรือ coordination เพิ่มเติม ซึ่งควรถามทีมให้ชัดเจนตั้งแต่ก่อนปิดดีล",
                },
            ],
            "process_note": "workflow นี้เป็นคำอธิบายเชิงโครงสร้าง ไม่ใช่ checklist ทางกฎหมายที่ครบถ้วนสำหรับทุกกรณี",
            "documents_title": "Document guidance module",
            "documents_intro": "ส่วนนี้สรุปหมวดเอกสารที่มักถูกถามถึงบ่อย เพื่อช่วยให้ผู้ซื้อต่างชาติเตรียมตัวได้ดีขึ้นโดยไม่สื่อว่าเป็นรายการบังคับครบถ้วนสำหรับทุกดีล",
            "documents_common_title": "Common preparation categories",
            "documents_common_points": [
                "identity/passport baseline สำหรับยืนยันตัวตนและข้อมูลผู้ซื้อ",
                "หลักฐานการโอนเงินหรือ funds transfer evidence ที่เกี่ยวข้องกับเส้นทางการชำระเงิน",
                "เอกสารสัญญาหรือเงื่อนไขที่ควรให้ advisor และทนายช่วย review ก่อนลงนาม",
            ],
            "documents_case_title": "Case-specific reminders",
            "documents_case_points": [
                "โครงการใหม่กับ resale อาจต้องใช้เอกสารประกอบไม่เหมือนกัน แม้จะอยู่ใน budget หรือทำเลใกล้กัน",
                "บางกรณีอาจต้องมีเอกสารเพิ่มเติมตาม ownership path, ผู้ถือสิทธิ์ร่วม, หรือแหล่งที่มาของเงินโอน",
                "หากรายการเอกสารยังไม่ชัดเจน ควรยืนยันกับ advisor และ legal review แทนการตีความจาก list ทั่วไปเพียงอย่างเดียว",
            ],
            "documents_note": "หมวดเอกสารด้านบนเป็น guidance เพื่อการเตรียมตัว ไม่ใช่คำแนะนำทางกฎหมายหรือรายการที่รับรองว่าเพียงพอในทุกกรณี",
            "faq_title": "FAQ / clarification module",
            "faq_intro": "คำถามด้านล่างตอบข้อสงสัยที่พบบ่อยในระดับภาพรวม เพื่อช่วยจัดลำดับการถามทีมที่ปรึกษาโดยไม่แทนคำแนะนำเฉพาะเคส",
            "faq_items": [
                {
                    "question": "การซื้อของผู้ซื้อต่างชาติมักใช้เวลานานแค่ไหน?",
                    "answer": "timeline ต่างกันตามประเภททรัพย์, readiness ของเอกสาร, และจังหวะ review ของคู่สัญญา จึงควรใช้ช่วงเวลาใน hub นี้เป็นแนวคิด ไม่ใช่กำหนดการที่รับประกันได้",
                },
                {
                    "question": "ควรถามเรื่องค่าใช้จ่ายอะไรตั้งแต่ต้น?",
                    "answer": "ควรเริ่มจากภาพรวมของราคาซื้อ ค่าจอง ค่าธรรมเนียมวันโอน และค่าใช้จ่ายหลังโอนที่อาจตามมา แต่ตัวเลขจริงต้องยืนยันกับทีมและเอกสารของดีลนั้น",
                },
                {
                    "question": "ถ้ายังไม่แน่ใจเรื่อง ownership path ควรทำอย่างไร?",
                    "answer": "อย่าตัดสินจากคำอธิบายทั่วไปเพียงอย่างเดียว ควรให้ advisor ช่วยคัด inventory ที่เข้ากรอบเบื้องต้นและชี้จุดที่ต้องมี legal review เพิ่ม",
                },
                {
                    "question": "เมื่อไรควร escalate ไปหา advisor หรือ lawyer?",
                    "answer": "หากมีความไม่ชัดเจนเรื่องสิทธิ์ถือครอง, ค่าใช้จ่าย, เงื่อนไขสัญญา, หรือเอกสารที่ต้องใช้ ควรกลับเข้าสู่ advisor path เดิมและยกระดับไป legal review ก่อน commit",
                },
            ],
            "faq_note": "FAQ นี้ออกแบบมาเพื่อ clarification ระดับต้น ไม่ใช่ชุดคำตอบทางกฎหมาย การเงิน หรือภาษีที่ใช้แทนการ review รายกรณี",
            "review_title": "เมื่อใดที่ต้องขอ legal review",
            "review_points": [
                "เมื่อ ownership path ไม่ชัดเจนจากข้อมูลโครงการหรือเอกสารเบื้องต้น",
                "เมื่อมีคำถามเรื่อง quota, สัญญา, ภาษี หรือการโอนเงินจากต่างประเทศ",
                "เมื่อกรณีซื้อมีหลายผู้ถือสิทธิ์ หลายสัญชาติ หรือมีโครงสร้างที่ไม่ใช่มาตรฐาน",
            ],
            "advisory_title": "ขั้นตอนถัดไปที่ปลอดภัย",
            "advisory_body": "หากต้องการประเมิน eligibility ของเคสจริง ให้ใช้ช่องทางติดต่อเดิมเพื่อให้ทีมช่วยคัด inventory ที่เหมาะสมและระบุจุดที่ควรให้ทนายตรวจเพิ่ม",
            "primary_cta": "คุยกับทีมที่ปรึกษา",
            "secondary_cta": "ดูโครงการที่เผยแพร่",
        }
    return {
        "title": "Foreign Buyer Hub",
        "intro": "This hub provides conservative, high-level guidance for foreign buyers in Pattaya. It is not a legal, tax, or eligibility guarantee for every case.",
        "eyebrow": "Foreign Buyer Advisory",
        "coverage_title": "What the hub covers now",
        "coverage_body": "The hub now covers ownership, eligibility, and buying-process basics only, keeping current V1 pages and the existing advisory funnel unchanged.",
        "ownership_title": "Ownership and eligibility basics",
        "ownership_points": [
            "Some condo inventory may fit foreign-quota ownership, but availability and supporting documents must be checked case by case.",
            "Other holding paths such as leasehold or company structures require advisor and legal review before they are treated as viable.",
            "This hub explains the starting framework for ownership review. It does not certify that a transaction is automatically eligible.",
        ],
        "process_title": "Buying process module",
        "process_intro": "The sequence below is an advisory-safe roadmap for foreign buyers. It is meant to clarify decision points and when advisor or legal review should re-enter the process.",
        "process_steps": [
            {
                "title": "1. Discovery and shortlist review",
                "body": "Start by defining purchase goals, budget, and inventory fit before narrowing down which properties deserve deeper review.",
            },
            {
                "title": "2. Reservation and due diligence stage",
                "body": "Once a candidate property is identified, review reservation terms, project facts, and any points that need advisor or lawyer review before commitment.",
            },
            {
                "title": "3. Transfer preparation",
                "body": "Before transfer, prepare for document checks, funds-transfer coordination, and contract review, while treating the exact requirement set as case-specific.",
            },
            {
                "title": "4. Post-transfer support expectations",
                "body": "After transfer, additional coordination may still be needed for handover, utilities, or ownership follow-through, so those expectations should be clarified early.",
            },
        ],
        "process_note": "This workflow is explanatory only. It is not a complete legal checklist or a guarantee that every case follows the same path.",
        "documents_title": "Document guidance module",
        "documents_intro": "This section groups the document categories foreign buyers often need to prepare, while keeping the guidance advisory-safe and non-exhaustive.",
        "documents_common_title": "Common preparation categories",
        "documents_common_points": [
            "Identity and passport baseline for confirming buyer identity and core party details.",
            "Funds-transfer evidence guidance for the payment path and supporting remittance context.",
            "Contract documents or terms that should be reviewed with an advisor and lawyer before signature.",
        ],
        "documents_case_title": "Case-specific reminders",
        "documents_case_points": [
            "New-development and resale purchases may require different supporting documents even when they fit the same budget or location brief.",
            "Some cases need additional supporting records based on the ownership path, co-buyers, or the source of transferred funds.",
            "If the document list is still unclear, confirm the case with advisor and legal review instead of relying on a generic checklist alone.",
        ],
        "documents_note": "These document categories are preparation guidance only. They are not legal instructions and they are not guaranteed to be sufficient for every case.",
        "faq_title": "FAQ / clarification module",
        "faq_intro": "These short answers address recurring foreign-buyer questions at a high level, while preserving the advisor path for case-specific advice.",
        "faq_items": [
            {
                "question": "How long does a foreign-buyer purchase usually take?",
                "answer": "Timing varies by property type, document readiness, and how quickly the parties can complete reviews, so any timeline here should be treated as orientation only rather than a guarantee.",
            },
            {
                "question": "Which costs should be clarified early?",
                "answer": "Start with the purchase price, reservation amount, transfer-day fees, and likely post-transfer costs, then confirm the actual numbers against the live deal documents and advisor guidance.",
            },
            {
                "question": "What if the ownership path is still unclear?",
                "answer": "Do not rely on generic summaries alone. Use the advisor path to narrow eligible inventory first and identify where legal review needs to step in.",
            },
            {
                "question": "When should the case be escalated to an advisor or lawyer?",
                "answer": "If ownership eligibility, costs, contract terms, or required documents remain unclear, the case should move back into the existing advisor path and legal review before commitment.",
            },
        ],
        "faq_note": "This FAQ is for early clarification only. It is not legal, financial, or tax advice and it should not replace case-specific review.",
        "review_title": "When legal review is required",
        "review_points": [
            "When the ownership path is not clear from project facts or preliminary documents.",
            "When quota, contract, tax, or funds-transfer questions affect the purchase decision.",
            "When the purchase involves multiple owners, multiple jurisdictions, or a non-standard holding structure.",
        ],
        "advisory_title": "Safe next step",
        "advisory_body": "For a live case, use the existing advisory path so the team can shortlist eligible inventory and flag where lawyer review is needed.",
        "primary_cta": "Speak to an Advisor",
        "secondary_cta": "Browse Published Projects",
    }


def _market_intelligence_copy(locale: str) -> dict[str, object]:
    if locale == "th":
        return {
            "title": "Market Intelligence",
            "intro": "หน้านี้เป็น route owner สำหรับ Market Intelligence module ในระดับ public-safe เท่านั้น โดยจะเผยแพร่เฉพาะบริบทตลาดที่ผ่านการกำกับด้านแหล่งข้อมูล ความสดใหม่ และขอบเขตการเปิดเผยแล้ว",
            "eyebrow": "Market Intelligence",
            "overview_title": "สิ่งที่เปิดใช้งานใน slice นี้",
            "overview_body": "slice แรกเปิด route owner และ page shell เพื่อกำหนดพื้นที่ของ market overview, area comparison, investment signals, และ methodology/disclaimer โดยยังไม่ปล่อย charts หรือ data layer เต็มรูปแบบ",
            "boundary_title": "Public-safe boundary",
            "boundary_points": [
                "เผยแพร่ได้เฉพาะ market context ที่อ้างอิงแหล่งข้อมูลได้และผ่านการกำกับแล้ว",
                "ข้อมูล advisor-only, negotiation notes, หรือดีลเฉพาะรายต้องไม่ปรากฏบนหน้า public นี้",
                "หากสัญญาณใดยังไม่ชัดเจนพอ หน้านี้จะใช้ถ้อยคำเชิง conservative แทนการแสดง claim ที่แรงเกินจริง",
            ],
            "freshness_title": "Freshness and methodology framing",
            "freshness_points": [
                "สัญญาณแบบ fast จะต้องผูกกับ cadence ที่กำกับได้ก่อนแสดงบนหน้า public",
                "บทสรุปเชิง editorial ต้องมีจุดทบทวนรายเดือนหรือ disclosure ที่ชัดเจน",
                "methodology และ disclosure language จะเปลี่ยนได้เฉพาะเมื่อมี revision ที่อนุมัติแล้ว",
            ],
            "next_title": "สิ่งที่จะตามมาใน slice ถัดไป",
            "next_points": [
                "data source classification layer",
                "basic market overview charts",
                "advisory interpretation blocks",
            ],
            "note": "page shell นี้ยังไม่ใช่รายงานตลาดฉบับสมบูรณ์ และยังไม่เผยแพร่ advisor-only insight หรือ chart series เชิงลึก",
            "primary_cta": "คุยกับทีมที่ปรึกษา",
            "secondary_cta": "ดู Investment Methodology",
        }
    return {
        "title": "Market Intelligence",
        "intro": "This route is the public owner for the Market Intelligence module. It is limited to public-safe market context governed by source, freshness, and disclosure boundaries.",
        "eyebrow": "Market Intelligence",
        "overview_title": "What this slice activates",
        "overview_body": "The first slice launches the route owner and page shell for market overview, area comparison, investment signals, and methodology/disclaimer regions without publishing the full chart or data layers yet.",
        "boundary_title": "Public-safe boundary",
        "boundary_points": [
            "Only market context with governed source and disclosure support may appear on this public route.",
            "Advisor-only signals, negotiation notes, and deal-specific recommendations must stay outside this public page.",
            "Where confidence is limited, the page must fall back to conservative wording instead of stronger public claims.",
        ],
        "freshness_title": "Freshness and methodology framing",
        "freshness_points": [
            "Fast signals must be tied to a governed refresh cadence before public publication.",
            "Editorial summaries must carry a visible review rhythm or equivalent freshness disclosure.",
            "Methodology and disclosure language change only on approved revision.",
        ],
        "next_title": "What later slices add",
        "next_points": [
            "Data source classification layer",
            "Basic market overview charts",
            "Advisory interpretation blocks",
        ],
        "note": "This page shell is not a full market report yet. It does not publish advisor-only insight or deep chart series in this slice.",
        "primary_cta": "Speak to an Advisor",
        "secondary_cta": "View Investment Methodology",
    }


def _market_intelligence_source_classes(locale: str) -> list[dict[str, object]]:
    if locale == "th":
        return [
            {
                "slug": "public",
                "title": "Public",
                "summary": "ใช้กับข้อมูลที่เผยแพร่สู่สาธารณะได้อยู่แล้วและตรวจสอบซ้ำได้จากแหล่งที่ผ่านการกำกับ",
                "examples": [
                    "approved public inventory counts",
                    "published area or project statistics",
                    "approved methodology and disclosure copy",
                ],
                "freshness": "รองรับ cadence แบบ fast หรือ governed ตามชนิดของข้อมูล",
                "public_note": "เผยแพร่บนหน้า public ได้เมื่อมี source, freshness, และ disclosure รองรับ",
            },
            {
                "slug": "curated",
                "title": "Curated",
                "summary": "ใช้กับบทสรุปหรือ synthesis ที่ผ่านการ review แล้วและปลอดภัยสำหรับ public แม้ไม่ใช่ raw self-serve data",
                "examples": [
                    "editorial market commentary",
                    "governed directional summaries",
                    "approved narrative interpretation tied to dated inputs",
                ],
                "freshness": "ต้องมี review rhythm หรือ freshness disclosure ที่มองเห็นได้",
                "public_note": "เผยแพร่ได้เมื่อผ่าน governance review และไม่ยกระดับความมั่นใจเกิน source ที่รองรับ",
            },
            {
                "slug": "advisor-only",
                "title": "Advisor-only",
                "summary": "ใช้กับข้อมูลภายในที่ช่วยการตีความของทีม แต่ห้ามแสดงออกสู่ public module ใน gate นี้",
                "examples": [
                    "unpublished operator observations",
                    "deal-specific negotiation context",
                    "private shortlist recommendations",
                ],
                "freshness": "ใช้ได้เฉพาะในการ review ภายใน ไม่ใช่ cadence สำหรับ public publication",
                "public_note": "จัดเป็น boundary class เพื่อบอกสิ่งที่ห้ามเผยแพร่ ไม่ใช่ source class ที่ render เป็น market claim สาธารณะ",
            },
        ]
    return [
        {
            "slug": "public",
            "title": "Public",
            "summary": "Use this class for information already approved for public presentation and reproducible from governed public-facing sources.",
            "examples": [
                "Approved public inventory counts",
                "Published area or project statistics",
                "Approved methodology and disclosure copy",
            ],
            "freshness": "Supports fast or governed cadence depending on the data type.",
            "public_note": "This class may appear on the public route when source, freshness, and disclosure support are visible.",
        },
        {
            "slug": "curated",
            "title": "Curated",
            "summary": "Use this class for reviewed synthesis that is public-safe even when it is not exposed as raw self-serve data.",
            "examples": [
                "Editorial market commentary",
                "Governed directional summaries",
                "Approved narrative interpretation tied to dated inputs",
            ],
            "freshness": "Requires a visible review rhythm or equivalent freshness disclosure.",
            "public_note": "This class may publish only after governance review and must not overstate confidence beyond the supporting source inputs.",
        },
        {
            "slug": "advisor-only",
            "title": "Advisor-only",
            "summary": "Use this class for internal context that can assist advisory review but must not surface on the public module during this gate.",
            "examples": [
                "Unpublished operator observations",
                "Deal-specific negotiation context",
                "Private shortlist recommendations",
            ],
            "freshness": "Internal review only, not a public publication cadence.",
            "public_note": "This is a boundary class that defines what stays excluded from public market claims.",
        },
    ]


def _market_intelligence_report_regions(locale: str) -> list[dict[str, object]]:
    if locale == "th":
        return [
            {
                "title": "Market overview region",
                "allowed_classes": "public, curated",
                "rule": "เริ่มจาก directional snapshot ที่มี source class ชัดเจน และยังไม่ใช้ advisor-only commentary",
            },
            {
                "title": "Area comparison region",
                "allowed_classes": "public, curated",
                "rule": "เปรียบเทียบได้เฉพาะสัญญาณที่กำกับแหล่งข้อมูลและความสดใหม่ได้อย่างชัดเจน",
            },
            {
                "title": "Investment signals region",
                "allowed_classes": "public, curated",
                "rule": "ใช้ได้เฉพาะ confidence-qualified public context และยังไม่เปิด deal-specific strategy",
            },
            {
                "title": "Methodology / disclaimer region",
                "allowed_classes": "public",
                "rule": "ต้องเป็น disclosure ที่อนุมัติแล้วและใช้เป็น boundary ของทั้งหน้า",
            },
        ]
    return [
        {
            "title": "Market overview region",
            "allowed_classes": "public, curated",
            "rule": "Start with directional snapshots that already carry a clear source class and do not depend on advisor-only commentary.",
        },
        {
            "title": "Area comparison region",
            "allowed_classes": "public, curated",
            "rule": "Only compare signals whose source and freshness can be governed clearly on the public route.",
        },
        {
            "title": "Investment signals region",
            "allowed_classes": "public, curated",
            "rule": "Use confidence-qualified public context only and keep deal-specific strategy outside this slice.",
        },
        {
            "title": "Methodology / disclaimer region",
            "allowed_classes": "public",
            "rule": "This region must stay on approved disclosure language and act as the page-level boundary note.",
        },
    ]


def _market_intelligence_overview_chart_copy(locale: str) -> dict[str, str]:
    if locale == "th":
        return {
            "section_title": "Basic market overview charts",
            "section_intro": "slice นี้เปิด chart structures พื้นฐานสำหรับ market overview โดยใช้เฉพาะ runtime counts และ governed readiness signals ที่อยู่ในขอบเขต public-safe",
            "source_label": "Source class",
            "freshness_label": "Freshness tier",
            "coverage_title": "Published inventory coverage",
            "coverage_question": "ตอนนี้ public runtime ครอบคลุม inventory ที่เผยแพร่มากน้อยเพียงใด?",
            "coverage_caveat": "chart นี้สรุปจำนวน records ที่เผยแพร่ใน runtime ปัจจุบัน ไม่ใช่คำแนะนำการลงทุนหรือการคาดการณ์ตลาด",
            "coverage_areas": "Published areas",
            "coverage_projects": "Published projects",
            "coverage_properties": "Active properties",
            "readiness_title": "Governed signal readiness",
            "readiness_question": "มี public-safe market signals ที่พร้อมใช้เป็นฐานของ reports ถัดไปอยู่เท่าใด?",
            "readiness_caveat": "chart นี้แสดงเฉพาะ signals ที่มี source/freshness support ตามกติกาปัจจุบัน และไม่รวม advisor-only context",
            "readiness_areas": "Areas with verified metrics",
            "readiness_projects": "Projects with investment snapshot",
            "bar_label": "Signal value",
            "fast_tier": "fast",
            "governed_tier": "governed",
        }
    return {
        "section_title": "Basic market overview charts",
        "section_intro": "This slice introduces the first market-overview chart structures using only public-safe runtime counts and governed readiness signals.",
        "source_label": "Source class",
        "freshness_label": "Freshness tier",
        "coverage_title": "Published inventory coverage",
        "coverage_question": "How much published inventory does the current public runtime cover?",
        "coverage_caveat": "This chart summarizes records currently published in the runtime. It is not investment advice and it is not a market forecast.",
        "coverage_areas": "Published areas",
        "coverage_projects": "Published projects",
        "coverage_properties": "Active properties",
        "readiness_title": "Governed signal readiness",
        "readiness_question": "How much public-safe signal coverage is ready to support later reports?",
        "readiness_caveat": "This chart includes only signals with current source and freshness support. It excludes advisor-only context.",
        "readiness_areas": "Areas with verified metrics",
        "readiness_projects": "Projects with investment snapshot",
        "bar_label": "Signal value",
        "fast_tier": "fast",
        "governed_tier": "governed",
    }


def _market_intelligence_overview_charts(locale: str, db: Session) -> list[dict[str, object]]:
    copy = _market_intelligence_overview_chart_copy(locale)
    count_lookup = {key: value for key, value in _count_cards(db)}
    published_areas = db.scalars(
        select(Area).where(Area.deleted_at.is_(None), Area.status == "published")
    ).all()
    stats_by_area = _area_stats_lookup(db, [row.id for row in published_areas])
    verified_area_count = sum(
        1
        for row in published_areas
        if _has_verified_area_metrics(
            " ".join(str(row.source_note or "").split()),
            _area_metrics_cadence(row.content, locale),
            stats_by_area.get(str(row.id)),
        )
    )
    published_projects = db.scalars(
        select(Project).where(Project.deleted_at.is_(None), Project.status == "published")
    ).all()
    investment_snapshot_count = sum(
        1 for row in published_projects if _project_investment_snapshot_ready(row)
    )
    return [
        {
            "title": copy["coverage_title"],
            "question": copy["coverage_question"],
            "source_class": "public",
            "freshness_tier": copy["fast_tier"],
            "caveat": copy["coverage_caveat"],
            "series": [
                {"label": copy["coverage_areas"], "value": int(count_lookup.get("areas", 0))},
                {"label": copy["coverage_projects"], "value": int(count_lookup.get("projects", 0))},
                {
                    "label": copy["coverage_properties"],
                    "value": int(count_lookup.get("properties", 0)),
                },
            ],
        },
        {
            "title": copy["readiness_title"],
            "question": copy["readiness_question"],
            "source_class": "public",
            "freshness_tier": copy["governed_tier"],
            "caveat": copy["readiness_caveat"],
            "series": [
                {"label": copy["readiness_areas"], "value": int(verified_area_count)},
                {"label": copy["readiness_projects"], "value": int(investment_snapshot_count)},
            ],
        },
    ]


def _market_intelligence_chart_series_html(bar_label: str, series: list[dict[str, object]]) -> str:
    max_value = max((int(item["value"]) for item in series), default=0)
    rows: list[str] = []
    for point in series:
        value = int(point["value"])
        if max_value <= 0 or value <= 0:
            width = 0
        else:
            width = max(8, round((value / max_value) * 100))
        rows.append(
            "".join(
                [
                    '<div><div class="grid"><span>',
                    escape(str(point["label"])),
                    "</span><strong>",
                    f"{value:,}",
                    '</strong></div><div aria-label="',
                    escape(bar_label),
                    '" style="height:8px;border-radius:999px;background:#d9e4de;overflow:hidden;">',
                    '<span style="display:block;height:8px;border-radius:999px;background:#1f5c45;width:',
                    str(width),
                    '%;"></span></div></div>',
                ]
            )
        )
    return "".join(rows)


def _market_intelligence_overview_chart_html(
    *, chart: dict[str, object], labels: dict[str, str]
) -> str:
    return "".join(
        [
            '<article class="card"><p class="muted">',
            escape(labels["source_label"]),
            ": ",
            escape(str(chart["source_class"])),
            " • ",
            escape(labels["freshness_label"]),
            ": ",
            escape(str(chart["freshness_tier"])),
            "</p><h3>",
            escape(str(chart["title"])),
            "</h3><p>",
            escape(str(chart["question"])),
            '</p><div class="stack">',
            _market_intelligence_chart_series_html(labels["bar_label"], list(chart["series"])),
            '</div><p class="muted">',
            escape(str(chart["caveat"])),
            "</p></article>",
        ]
    )


def _market_intelligence_interpretation_copy(locale: str) -> dict[str, str]:
    if locale == "th":
        return {
            "section_title": "Advisory interpretation blocks",
            "section_intro": "blocks ด้านล่างช่วยแปลความหมายของ public-safe charts ในระดับภาพรวม โดยไม่ทำหน้าที่แทนคำแนะนำเฉพาะเคสหรือการคาดการณ์ตลาด",
            "source_label": "Source class",
            "coverage_title": "Coverage reading",
            "coverage_body": "public runtime ตอนนี้สะท้อน inventory ที่เผยแพร่แล้ว {areas} ทำเล, {projects} โครงการ, และ {properties} รายการ active ซึ่งช่วยให้เห็น breadth ของข้อมูลที่เปิดเผย แต่ยังไม่ใช่ภาพครบทุกโอกาสในตลาด",
            "readiness_title": "Readiness reading",
            "readiness_body": "signals ที่พร้อมใช้เป็นฐานของรายงานสาธารณะมีอยู่แล้วอย่างน้อย {areas_ready} ทำเลที่มี metrics ผ่าน source/freshness guard และ {projects_ready} โครงการที่มี investment snapshot พร้อมใช้เป็น reference เชิงสาธารณะ",
            "escalation_title": "Nuance and escalation",
            "escalation_body": "เมื่อผู้ใช้ต้องเทียบหลายทำเล, แปลความหมายของ signal ต่อ decision จริง, หรือแยกความต่างระหว่าง market context กับดีลเฉพาะราย ควรยกระดับไปยัง advisor path เดิมแทนการสรุปจากหน้า public นี้เพียงอย่างเดียว",
            "note": "interpretation เหล่านี้เป็น descriptive layer ไม่ใช่คำแนะนำลงทุน ไม่ใช่การรับประกันผลตอบแทน และไม่ใช่ความแน่นอนทางกฎหมายหรือการเงิน",
            "curated_class": "curated",
        }
    return {
        "section_title": "Advisory interpretation blocks",
        "section_intro": "These blocks help readers interpret the current public-safe charts at a high level without acting as case-specific advice or a market forecast.",
        "source_label": "Source class",
        "coverage_title": "Coverage reading",
        "coverage_body": "The current public runtime reflects published inventory across {areas} areas, {projects} projects, and {properties} active properties. That gives a useful picture of disclosed market breadth, but it does not represent every opportunity in the market.",
        "readiness_title": "Readiness reading",
        "readiness_body": "The public module already has at least {areas_ready} areas with governed metric support and {projects_ready} projects with an investment snapshot ready for public reference, which helps define what evidence is mature enough for later reporting layers.",
        "escalation_title": "Nuance and escalation",
        "escalation_body": "When a user needs to compare multiple submarkets, translate a signal into a live decision, or separate public context from deal-specific considerations, the next step should be the existing advisor path rather than this public page alone.",
        "note": "These interpretation blocks are descriptive only. They are not investment recommendations, they do not promise returns, and they do not create legal or financial certainty.",
        "curated_class": "curated",
    }


def _market_intelligence_interpretations(locale: str, db: Session) -> list[dict[str, object]]:
    count_lookup = {key: value for key, value in _count_cards(db)}
    published_areas = db.scalars(
        select(Area).where(Area.deleted_at.is_(None), Area.status == "published")
    ).all()
    stats_by_area = _area_stats_lookup(db, [row.id for row in published_areas])
    verified_area_count = sum(
        1
        for row in published_areas
        if _has_verified_area_metrics(
            " ".join(str(row.source_note or "").split()),
            _area_metrics_cadence(row.content, locale),
            stats_by_area.get(str(row.id)),
        )
    )
    published_projects = db.scalars(
        select(Project).where(Project.deleted_at.is_(None), Project.status == "published")
    ).all()
    investment_snapshot_count = sum(
        1 for row in published_projects if _project_investment_snapshot_ready(row)
    )
    copy = _market_intelligence_interpretation_copy(locale)
    return [
        {
            "title": copy["coverage_title"],
            "source_class": copy["curated_class"],
            "body": copy["coverage_body"].format(
                areas=int(count_lookup.get("areas", 0)),
                projects=int(count_lookup.get("projects", 0)),
                properties=int(count_lookup.get("properties", 0)),
            ),
        },
        {
            "title": copy["readiness_title"],
            "source_class": copy["curated_class"],
            "body": copy["readiness_body"].format(
                areas_ready=int(verified_area_count),
                projects_ready=int(investment_snapshot_count),
            ),
        },
        {
            "title": copy["escalation_title"],
            "source_class": copy["curated_class"],
            "body": copy["escalation_body"],
        },
    ]


def _render_market_intelligence_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _market_intelligence_copy(locale)
    overview_chart_copy = _market_intelligence_overview_chart_copy(locale)
    interpretation_copy = _market_intelligence_interpretation_copy(locale)
    source_classes = _market_intelligence_source_classes(locale)
    report_regions = _market_intelligence_report_regions(locale)
    overview_charts = _market_intelligence_overview_charts(locale, db)
    interpretations = _market_intelligence_interpretations(locale, db)
    boundary_html = "".join(f"<li>{escape(point)}</li>" for point in copy["boundary_points"])
    freshness_html = "".join(f"<li>{escape(point)}</li>" for point in copy["freshness_points"])
    next_html = "".join(f"<li>{escape(point)}</li>" for point in copy["next_points"])
    overview_chart_html = "".join(
        _market_intelligence_overview_chart_html(
            chart=chart,
            labels=overview_chart_copy,
        )
        for chart in overview_charts
    )
    source_class_html = "".join(
        f'<article class="card"><p class="muted">{escape(str(source_class["slug"]))}</p><h3>{escape(str(source_class["title"]))}</h3><p>{escape(str(source_class["summary"]))}</p><p><strong>{"Examples" if locale == "en" else "Examples"}:</strong></p><ul>{"".join(f"<li>{escape(str(example))}</li>" for example in source_class["examples"])}</ul><p><strong>{"Freshness" if locale == "en" else "Freshness"}:</strong> {escape(str(source_class["freshness"]))}</p><p class="muted">{escape(str(source_class["public_note"]))}</p></article>'
        for source_class in source_classes
    )
    report_region_html = "".join(
        f'<article class="card"><h3>{escape(str(region["title"]))}</h3><p><strong>{"Allowed classes" if locale == "en" else "Allowed classes"}:</strong> {escape(str(region["allowed_classes"]))}</p><p>{escape(str(region["rule"]))}</p></article>'
        for region in report_regions
    )
    interpretation_html = "".join(
        f'<article class="card"><p class="muted">{escape(interpretation_copy["source_label"])}: {escape(str(block["source_class"]))}</p><h3>{escape(str(block["title"]))}</h3><p>{escape(str(block["body"]))}</p></article>'
        for block in interpretations
    )
    contact_href = f"/{locale}/contact?intent=consultation&source=market_intelligence"
    methodology_href = f"/{locale}/investment/methodology?source=market_intelligence"
    body = (
        f'<section id="market-intelligence-overview" class="card"><p class="muted">{escape(str(copy["eyebrow"]))}</p><h2>{escape(str(copy["overview_title"]))}</h2><p>{escape(str(copy["overview_body"]))}</p><p class="muted">{escape(str(copy["note"]))}</p></section>'
        f'<section id="market-intelligence-boundary" class="card"><h2>{escape(str(copy["boundary_title"]))}</h2><ul>{boundary_html}</ul></section>'
        f'<section id="market-intelligence-overview-charts" class="stack"><div class="card"><h2>{escape(overview_chart_copy["section_title"])}</h2><p>{escape(overview_chart_copy["section_intro"])}</p></div><div class="grid">{overview_chart_html}</div></section>'
        f'<section id="market-intelligence-source-classes" class="stack"><div class="card"><h2>{"Source classification layer" if locale == "en" else "Source classification layer"}</h2><p>{"Every public block in this module must resolve to a governed source class before later chart or interpretation slices expand." if locale == "en" else "ทุก block ที่เผยแพร่บน module นี้ต้องผูกกับ source class ที่กำกับได้ก่อนที่ slice ถัดไปจะขยายไปสู่ charts หรือ interpretation"}</p></div><div class="grid">{source_class_html}</div></section>'
        f'<section id="market-intelligence-region-contract" class="stack"><div class="card"><h2>{"Report region contract" if locale == "en" else "Report region contract"}</h2><p>{"This slice prepares the runtime structure for later chart and report regions without enabling those deeper layers yet." if locale == "en" else "slice นี้เตรียมโครงสร้าง runtime สำหรับ report regions ถัดไป โดยยังไม่เปิดใช้งาน layers ที่ลึกกว่านี้"}</p></div><div class="grid">{report_region_html}</div></section>'
        f'<section id="market-intelligence-interpretation" class="stack"><div class="card"><h2>{escape(interpretation_copy["section_title"])}</h2><p>{escape(interpretation_copy["section_intro"])}</p><p class="muted">{escape(interpretation_copy["note"])}</p></div><div class="grid">{interpretation_html}</div></section>'
        f'<section id="market-intelligence-freshness" class="card"><h2>{escape(str(copy["freshness_title"]))}</h2><ul>{freshness_html}</ul></section>'
        f'<section id="market-intelligence-next" class="card"><h2>{escape(str(copy["next_title"]))}</h2><ul>{next_html}</ul></section>'
        f'<section id="market-intelligence-next-step" class="card"><h2>{"Advisor follow-up" if locale == "en" else "การคุยต่อกับทีมที่ปรึกษา"}</h2><div class="grid"><a class="btn" href="{escape(contact_href)}">{escape(str(copy["primary_cta"]))}</a><a class="btn" href="{escape(methodology_href)}">{escape(str(copy["secondary_cta"]))}</a></div></section>'
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=str(copy["title"]),
            intro=str(copy["intro"]),
            body=body,
            request=request,
            db=db,
            meta_description=str(copy["intro"]),
        )
    )


def _render_foreign_buyer_hub_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _foreign_buyer_hub_copy(locale)
    ownership_html = "".join(f"<li>{escape(point)}</li>" for point in copy["ownership_points"])
    process_steps_html = "".join(
        f'<article class="card"><h3>{escape(str(step["title"]))}</h3><p>{escape(str(step["body"]))}</p></article>'
        for step in copy["process_steps"]
    )
    documents_common_html = "".join(
        f"<li>{escape(point)}</li>" for point in copy["documents_common_points"]
    )
    documents_case_html = "".join(
        f"<li>{escape(point)}</li>" for point in copy["documents_case_points"]
    )
    faq_html = "".join(
        f'<article class="card"><h3>{escape(str(item["question"]))}</h3><p>{escape(str(item["answer"]))}</p></article>'
        for item in copy["faq_items"]
    )
    review_html = "".join(f"<li>{escape(point)}</li>" for point in copy["review_points"])
    contact_href = f"/{locale}/contact?intent=consultation&source=foreign_buyer_hub"
    projects_href = f"/{locale}/projects?source=foreign_buyer_hub"
    body = (
        f'<section id="foreign-buyer-coverage" class="card"><p class="muted">{escape(str(copy["eyebrow"]))}</p><h2>{escape(str(copy["coverage_title"]))}</h2><p>{escape(str(copy["coverage_body"]))}</p></section>'
        f'<section id="foreign-buyer-ownership" class="card"><h2>{escape(str(copy["ownership_title"]))}</h2><ul>{ownership_html}</ul></section>'
        f'<section id="foreign-buyer-process" class="stack"><div class="card"><h2>{escape(str(copy["process_title"]))}</h2><p>{escape(str(copy["process_intro"]))}</p><p class="muted">{escape(str(copy["process_note"]))}</p></div><div class="grid">{process_steps_html}</div></section>'
        f'<section id="foreign-buyer-documents" class="stack"><div class="card"><h2>{escape(str(copy["documents_title"]))}</h2><p>{escape(str(copy["documents_intro"]))}</p><p class="muted">{escape(str(copy["documents_note"]))}</p></div><div class="grid"><article class="card"><h3>{escape(str(copy["documents_common_title"]))}</h3><ul>{documents_common_html}</ul></article><article class="card"><h3>{escape(str(copy["documents_case_title"]))}</h3><ul>{documents_case_html}</ul></article></div></section>'
        f'<section id="foreign-buyer-faq" class="stack"><div class="card"><h2>{escape(str(copy["faq_title"]))}</h2><p>{escape(str(copy["faq_intro"]))}</p><p class="muted">{escape(str(copy["faq_note"]))}</p></div><div class="grid">{faq_html}</div></section>'
        f'<section id="foreign-buyer-legal-review" class="card"><h2>{escape(str(copy["review_title"]))}</h2><ul>{review_html}</ul></section>'
        f'<section id="foreign-buyer-next-step" class="card"><h2>{escape(str(copy["advisory_title"]))}</h2><p>{escape(str(copy["advisory_body"]))}</p><div class="grid"><a class="btn" href="{escape(contact_href)}">{escape(str(copy["primary_cta"]))}</a><a class="btn" href="{escape(projects_href)}">{escape(str(copy["secondary_cta"]))}</a></div></section>'
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=str(copy["title"]),
            intro=str(copy["intro"]),
            body=body,
            request=request,
            db=db,
            meta_description=str(copy["intro"]),
        )
    )


def _render_contact_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "contact"))
    raw_content = str(row.content if row is not None else "").strip()
    if not raw_content:
        raw_content = (
            "Contact details are not published yet. TODO: publish verified NAP, channels, and office schedule."
            if locale == "en"
            else "ยังไม่มีข้อมูลติดต่อที่เผยแพร่ TODO: เพิ่ม NAP, ช่องทางติดต่อ และเวลาเปิดทำการที่ยืนยันแล้ว"
        )
    fields = _parse_company_kv_content(raw_content)
    fallback_address = (
        "Address pending publication. TODO: publish verified office address."
        if locale == "en"
        else "ยังไม่เผยแพร่ที่อยู่สำนักงาน TODO: เพิ่มที่อยู่ที่ยืนยันแล้ว"
    )
    fallback_phone = (
        "Phone pending publication. TODO: publish verified phone."
        if locale == "en"
        else "ยังไม่เผยแพร่เบอร์โทร TODO: เพิ่มเบอร์ที่ยืนยันแล้ว"
    )
    fallback_email = (
        "Email pending publication. TODO: publish verified email."
        if locale == "en"
        else "ยังไม่เผยแพร่อีเมล TODO: เพิ่มอีเมลที่ยืนยันแล้ว"
    )
    nap_name = _contact_detail_value(
        fields, ["name", "company_name", "company"], fallback="FlowBiz"
    )
    nap_address = _contact_detail_value(
        fields, ["address", "office_address", "street_address"], fallback=fallback_address
    )
    nap_phone = _contact_detail_value(
        fields, ["phone", "telephone", "tel"], fallback=fallback_phone
    )
    nap_email = _contact_detail_value(fields, ["email", "contact_email"], fallback=fallback_email)
    office_hours = _contact_detail_value(
        fields,
        ["office_hours", "business_hours", "hours"],
        fallback=(
            "Office hours pending publication. TODO: publish verified schedule."
            if locale == "en"
            else "ยังไม่เผยแพร่เวลาเปิดทำการ TODO: เพิ่มเวลาที่ยืนยันแล้ว"
        ),
    )
    whatsapp_value = str(fields.get("whatsapp") or "").strip()
    line_value = str(fields.get("line") or fields.get("line_id") or "").strip()
    map_href = _contact_map_href(fields)

    channel_rows: list[str] = []
    for label, kind, raw in [
        ("Email", "email", nap_email),
        ("Phone", "phone", nap_phone),
        ("WhatsApp", "whatsapp", whatsapp_value),
        ("LINE", "line", line_value),
    ]:
        href = _contact_channel_href(kind, raw)
        if not href:
            continue
        rel_attr = ' target="_blank" rel="noopener"' if href.startswith("https://") else ""
        channel_rows.append(
            f'<li><a href="{escape(href)}"{rel_attr}>{escape(label)}: {escape(raw)}</a></li>'
        )
    if not channel_rows:
        channel_rows.append(
            f'<li class="state-empty">{escape("Contact channels pending publication. TODO: publish verified channels." if locale == "en" else "ยังไม่เผยแพร่ช่องทางติดต่อ TODO: เพิ่มช่องทางที่ยืนยันแล้ว")}</li>'
        )

    contact_intro = (
        "Send your requirement and we will follow up with the next approved step."
        if locale == "en"
        else "ส่งความต้องการของคุณ แล้วเราจะติดต่อกลับด้วยขั้นตอนถัดไปที่อนุมัติแล้ว"
    )
    required_error = (
        "Please fill all required fields." if locale == "en" else "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    )
    submitting_text = "Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."
    success_text = (
        "Submitted. Our team will review and contact you with the next step."
        if locale == "en"
        else "ส่งข้อมูลแล้ว ทีมงานจะตรวจสอบและติดต่อกลับพร้อมขั้นตอนถัดไป"
    )
    error_text = (
        "Unable to submit right now. Please try again."
        if locale == "en"
        else "ยังไม่สามารถส่งคำขอได้ในตอนนี้ กรุณาลองใหม่อีกครั้ง"
    )

    map_html = (
        f'<a class="btn" data-event="contact_map_open" data-placement="contact_map" data-cta-id="open_map" href="{escape(map_href)}" target="_blank" rel="noopener">{"Open map" if locale == "en" else "เปิดแผนที่"}</a>'
        if map_href
        else f'<p class="state-empty">{escape("Map pending publication. TODO: publish verified map URL or coordinates." if locale == "en" else "ยังไม่เผยแพร่แผนที่ TODO: เพิ่มลิงก์หรือพิกัดที่ยืนยันแล้ว")}</p>'
    )

    body = (
        f'<section id="contact-notes" class="card"><h2>{"Published contact notes" if locale == "en" else "ข้อมูลติดต่อที่เผยแพร่"}</h2><div>{_format_text_block(raw_content)}</div></section>'
        f'<section id="contact-nap" class="card"><h2>NAP</h2><p><strong>{escape(nap_name)}</strong></p><p>{escape(nap_address)}</p><p>{escape(nap_phone)}</p><p>{escape(nap_email)}</p></section>'
        f'<section id="contact-channels" class="card"><h2>{"Contact channels" if locale == "en" else "ช่องทางติดต่อ"}</h2><ul>{"".join(channel_rows)}</ul></section>'
        f'<section id="contact-map" class="card"><h2>{"Map" if locale == "en" else "แผนที่"}</h2>{map_html}</section>'
        f'<section id="contact-office-hours" class="card"><h2>{"Office hours" if locale == "en" else "เวลาเปิดทำการ"}</h2><p>{escape(office_hours)}</p></section>'
        f'<section id="contact-form" class="card"><h2>{"Contact form" if locale == "en" else "ฟอร์มติดต่อ"}</h2><p>{escape(contact_intro)}</p>'
        f'<form id="contact-lead-form" novalidate><label class="field" for="contact-name"><span>{"Name" if locale == "en" else "ชื่อ"}</span><input id="contact-name" name="name" type="text" required /></label>'
        f'<label class="field" for="contact-contact"><span>{"Email or phone" if locale == "en" else "อีเมลหรือเบอร์โทร"}</span><input id="contact-contact" name="contact" type="text" required /></label>'
        f'<label class="field" for="contact-intent"><span>{"Intent" if locale == "en" else "ความต้องการ"}</span><select id="contact-intent" name="intent" required><option value="">{"Select intent" if locale == "en" else "เลือกความต้องการ"}</option><option value="buy">Buy</option><option value="rent">Rent</option><option value="invest">Invest</option><option value="sell">Sell</option><option value="general">General</option></select></label>'
        f'<label class="field" for="contact-message"><span>{"Message" if locale == "en" else "ข้อความ"}</span><textarea id="contact-message" name="message" rows="4" required></textarea></label>'
        f'<div class="grid"><button id="contact-submit" class="btn" type="submit" data-event="contact_cta_click" data-placement="contact_form" data-cta-id="contact_submit">{"Submit contact request" if locale == "en" else "ส่งคำขอติดต่อ"}</button><a class="btn" href="/{locale}/sell/list-property" data-event="contact_cta_click" data-placement="contact_form" data-cta-id="contact_go_sell">{"List a property" if locale == "en" else "ลงประกาศทรัพย์"}</a></div>'
        f'<p id="contact-form-status" class="muted" role="status" aria-live="polite"></p><div id="contact-form-loading" class="state-loading" hidden>{"Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."}</div><div id="contact-form-error" class="state-error" hidden>{escape(error_text)}</div><div id="contact-form-success" class="state-success" hidden>{escape(success_text)}</div></form></section>'
        "<script>"
        "(() => {"
        "const locale = document.documentElement.lang || 'en';"
        "const endpoint = '/api/v1/events';"
        "const path = location.pathname;"
        "function compact(raw){const out={};for(const [key,value] of Object.entries(raw||{})){if(value===undefined||value===null)continue;if(Array.isArray(value)&&value.length===0)continue;out[key]=value;}return out;}"
        "function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}"
        "document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,intent:node.getAttribute('data-intent')||undefined});});});"
        "const form=document.getElementById('contact-lead-form');const submitBtn=document.getElementById('contact-submit');const statusEl=document.getElementById('contact-form-status');const loadingEl=document.getElementById('contact-form-loading');const errorEl=document.getElementById('contact-form-error');const successEl=document.getElementById('contact-form-success');"
        "if(!(form instanceof HTMLFormElement))return;"
        "const requiredFields=Array.from(form.querySelectorAll('[required]'));"
        "requiredFields.forEach((field)=>{const clear=()=>{if(String(field.value||'').trim())field.setAttribute('aria-invalid','false');};field.addEventListener('input',clear);field.addEventListener('change',clear);});"
        "form.addEventListener('submit',async(event)=>{event.preventDefault();if(!(submitBtn instanceof HTMLButtonElement)||!(statusEl instanceof HTMLElement)||!(loadingEl instanceof HTMLElement)||!(errorEl instanceof HTMLElement)||!(successEl instanceof HTMLElement))return;errorEl.hidden=true;successEl.hidden=true;statusEl.textContent='';let firstInvalid=null;for(const field of requiredFields){const invalid=String(field.value||'').trim().length===0;field.setAttribute('aria-invalid',invalid?'true':'false');if(invalid&&!firstInvalid)firstInvalid=field;}if(firstInvalid){statusEl.textContent="
        f"{required_error!r}"
        ";firstInvalid.focus();await track('contact_form_error',{reason:'validation',placement:'contact_form',cta_id:'contact_submit'});return;}loadingEl.hidden=false;statusEl.textContent="
        f"{submitting_text!r}"
        ";submitBtn.disabled=true;const data=Object.fromEntries(new FormData(form).entries());const contact=String(data.contact||'').trim();const isEmail=contact.includes('@');const intent=String(data.intent||'general').trim()||'general';const fieldsPresent=Object.entries(data).filter(([,value])=>String(value||'').trim().length>0).map(([key])=>key);try{await track('contact_form_submit',{placement:'contact_form',cta_id:'contact_submit',intent,fields_present:fieldsPresent});const response=await fetch('/v1/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:String(data.name||'').trim(),email:isEmail?contact:null,phone:isEmail?null:contact,message:String(data.message||'').trim(),source_page:location.pathname,intent})});if(!response.ok)throw new Error('submit_failed');await track('contact_form_success',{placement:'contact_form',cta_id:'contact_submit',intent});statusEl.textContent="
        f"{success_text!r}"
        ";successEl.hidden=false;form.reset();requiredFields.forEach((field)=>field.setAttribute('aria-invalid','false'));}catch{errorEl.hidden=false;statusEl.textContent="
        f"{error_text!r}"
        ";await track('contact_form_error',{reason:'submit_failed',placement:'contact_form',cta_id:'contact_submit',intent});}finally{loadingEl.hidden=true;submitBtn.disabled=false;}});"
        "})();"
        "</script>"
    )
    meta = str(row.meta_description if row is not None else "").strip()
    title = row.title if row is not None else ("Contact" if locale == "en" else "Contact")
    intro = meta or (
        "Current contact workflow and next-step guidance."
        if locale == "en"
        else "ช่องทางติดต่อและขั้นตอนถัดไปในปัจจุบัน"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=title,
            intro=intro,
            body=body,
            request=request,
            db=db,
            meta_description=meta or intro,
        )
    )


def _sell_copy(locale: str) -> dict[str, str]:
    if locale == "th":
        return {
            "title": "Sell",
            "intro": "ส่งรายละเอียดทรัพย์เพื่อเริ่ม valuation และวางแผน listing ตามข้อมูลที่ยืนยันแล้ว",
            "intent_title": "ตั้งต้นจากเป้าหมายการขายของคุณ",
            "intent_body": "ระบุเป้าหมายราคา ไทม์ไลน์ และข้อจำกัดที่สำคัญเพื่อให้ทีมช่วยวางแผนขั้นตอนถัดไป",
            "process_title": "Process overview",
            "docs_title": "Required documents",
            "trust_title": "Trust proof",
            "trust_fallback": "ยังไม่มี trust proof ที่เผยแพร่ TODO: เพิ่มข้อมูลที่อนุมัติแล้วจากระบบ",
            "go_list": "ไปที่ฟอร์มลงประกาศ",
            "go_value": "ไปที่ฟอร์มขอประเมินราคา",
            "contact_team": "ติดต่อทีม",
        }
    return {
        "title": "Sell",
        "intro": "Share your property details to start valuation and listing planning based on published facts.",
        "intent_title": "Start with seller intent",
        "intent_body": "Tell us your pricing goal, timeline, and constraints so we can map the next approved step.",
        "process_title": "Process overview",
        "docs_title": "Required documents",
        "trust_title": "Trust proof",
        "trust_fallback": "Trust proof is pending publication. TODO: publish approved trust records from system data.",
        "go_list": "Open list-property form",
        "go_value": "Open valuation form",
        "contact_team": "Contact team",
    }


def _sell_tracking_script() -> str:
    return (
        "<script>"
        "(()=>{const locale=document.documentElement.lang||'en';const endpoint='/api/v1/events';const path=location.pathname;"
        "function compact(raw){const out={};for(const [key,value] of Object.entries(raw||{})){if(value===undefined||value===null)continue;if(Array.isArray(value)&&value.length===0)continue;out[key]=value;}return out;}"
        "function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}"
        "document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,intent:node.getAttribute('data-intent')||undefined});});});"
        "})();"
        "</script>"
    )


def _render_sell_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _sell_copy(locale)
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    process_content = str(process_row.content if process_row is not None else "").strip() or (
        "Published process details are pending. TODO: publish approved process notes."
        if locale == "en"
        else "ยังไม่มีข้อมูล process ที่เผยแพร่ TODO: เพิ่มเนื้อหาที่อนุมัติแล้ว"
    )
    testimonials = db.scalars(
        select(Testimonial)
        .where(
            Testimonial.deleted_at.is_(None),
            Testimonial.status == "published",
            Testimonial.intent == "sell",
        )
        .order_by(Testimonial.display_order.asc(), desc(Testimonial.updated_at))
        .limit(3)
    ).all()
    if not testimonials:
        # Fallback to published general testimonials if sell-specific proof is not yet published.
        testimonials = db.scalars(
            select(Testimonial)
            .where(Testimonial.deleted_at.is_(None), Testimonial.status == "published")
            .order_by(Testimonial.display_order.asc(), desc(Testimonial.updated_at))
            .limit(3)
        ).all()
    trust_rows = "".join(
        f'<article class="card"><h3>{escape(row.attribution_name or ("Client proof" if locale == "en" else "หลักฐานลูกค้า"))}</h3><p><strong>{escape(row.quote)}</strong></p><p class="muted">{escape(str(row.context or row.persona or "").strip())}</p></article>'
        for row in testimonials
    )
    if not trust_rows:
        trust_rows = f'<div class="state-empty">{escape(copy["trust_fallback"])}</div>'
    docs = (
        [
            "Ownership document copy",
            "Current property photos from local source",
            "Latest utility/tax note (if available)",
            "Preferred timeline and expected price range",
        ]
        if locale == "en"
        else [
            "สำเนาเอกสารสิทธิ์",
            "รูปทรัพย์ปัจจุบันจากแหล่ง local",
            "ข้อมูลค่าสาธารณูปโภค/ภาษีล่าสุด (ถ้ามี)",
            "ไทม์ไลน์และช่วงราคาที่คาดหวัง",
        ]
    )
    docs_html = "".join(f"<li>{escape(item)}</li>" for item in docs)
    body = (
        f'<section id="seller-intent" class="card"><h2>{escape(copy["intent_title"])}</h2><p>{escape(copy["intent_body"])}</p><img class="media" src="{_DEFAULT_MEDIA_FALLBACK}" alt="Seller process proof" width="1280" height="720" loading="lazy" /></section>'
        f'<section id="seller-process" class="card"><h2>{escape(copy["process_title"])}</h2><div>{_format_text_block(process_content)}</div><a class="btn" href="/{locale}/how-we-work" data-event="sell_cta_click" data-placement="sell_process" data-cta-id="sell_how_we_work" data-intent="sell">{"Open how-we-work page" if locale == "en" else "เปิดหน้า how-we-work"}</a></section>'
        f'<section id="seller-docs" class="card"><h2>{escape(copy["docs_title"])}</h2><ul>{docs_html}</ul></section>'
        f'<section id="seller-trust" class="grid"><h2>{escape(copy["trust_title"])}</h2>{trust_rows}</section>'
        f'<section id="seller-cta" class="card"><h2>{"Next step" if locale == "en" else "ขั้นตอนถัดไป"}</h2><div class="grid"><a class="btn" href="/{locale}/sell/list-property" data-event="sell_cta_click" data-placement="sell_next_step" data-cta-id="sell_list_property" data-intent="sell">{escape(copy["go_list"])}</a><a class="btn" href="/{locale}/sell/valuation" data-event="sell_cta_click" data-placement="sell_next_step" data-cta-id="sell_valuation" data-intent="sell">{escape(copy["go_value"])}</a><a class="btn" href="/{locale}/contact?intent=sell" data-event="sell_cta_click" data-placement="sell_next_step" data-cta-id="sell_contact" data-intent="sell">{escape(copy["contact_team"])}</a></div></section>'
        f"{_sell_tracking_script()}"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=copy["title"],
            intro=copy["intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _render_sell_list_property_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _sell_copy(locale)
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    process_content = str(process_row.content if process_row is not None else "").strip() or (
        "Process details pending publication. TODO: publish approved handoff steps."
        if locale == "en"
        else "ยังไม่มีรายละเอียด process ที่เผยแพร่ TODO: เพิ่มขั้นตอนที่อนุมัติแล้ว"
    )
    required_error = (
        "Please fill all required fields." if locale == "en" else "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    )
    submitting_text = "Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."
    success_text = (
        "List-property request submitted. Our team will review and contact you."
        if locale == "en"
        else "ส่งคำขอลงประกาศแล้ว ทีมงานจะตรวจสอบและติดต่อกลับ"
    )
    error_text = (
        "Unable to submit right now. Please try again."
        if locale == "en"
        else "ยังไม่สามารถส่งคำขอได้ในตอนนี้ กรุณาลองใหม่อีกครั้ง"
    )
    docs = (
        "Include ownership document, local photos, and expected listing price."
        if locale == "en"
        else "แนบข้อมูลเอกสารสิทธิ์ รูปจากพื้นที่จริง และราคาที่ต้องการลงประกาศ"
    )
    body = (
        f'<section id="seller-intent" class="card"><h2>{escape(copy["intent_title"])}</h2><p>{escape(copy["intent_body"])}</p></section>'
        f'<section id="seller-process" class="card"><h2>{escape(copy["process_title"])}</h2><div>{_format_text_block(process_content)}</div></section>'
        f'<section id="seller-docs" class="card"><h2>{escape(copy["docs_title"])}</h2><p>{escape(docs)}</p></section>'
        f'<section id="seller-trust" class="card"><h2>{escape(copy["trust_title"])}</h2><p>{escape("Only data submitted through approved runtime forms will be used for next-step review." if locale == "en" else "ใช้เฉพาะข้อมูลที่ส่งผ่านฟอร์ม runtime ที่อนุมัติแล้วในการตรวจสอบขั้นตอนถัดไป")}</p></section>'
        f'<section id="sell-list-property-form" class="card"><h2>{"List-property form" if locale == "en" else "ฟอร์มลงประกาศทรัพย์"}</h2><form id="sell-list-form" novalidate>'
        f'<label class="field" for="sell-list-name"><span>{"Name" if locale == "en" else "ชื่อ"}</span><input id="sell-list-name" name="name" type="text" required /></label>'
        f'<label class="field" for="sell-list-contact"><span>{"Email or phone" if locale == "en" else "อีเมลหรือเบอร์โทร"}</span><input id="sell-list-contact" name="contact" type="text" required /></label>'
        f'<label class="field" for="sell-list-type"><span>{"Property type" if locale == "en" else "ประเภททรัพย์"}</span><select id="sell-list-type" name="property_type" required><option value="">{"Select property type" if locale == "en" else "เลือกประเภททรัพย์"}</option><option value="condo">Condo</option><option value="house">House</option><option value="villa">Villa</option><option value="land">Land</option><option value="commercial">Commercial</option></select></label>'
        f'<label class="field" for="sell-list-area"><span>{"Area" if locale == "en" else "ทำเล"}</span><input id="sell-list-area" name="area" type="text" required /></label>'
        f'<label class="field" for="sell-list-address"><span>{"Address or landmark" if locale == "en" else "ที่อยู่หรือจุดสังเกต"}</span><input id="sell-list-address" name="address" type="text" required /></label>'
        f'<label class="field" for="sell-list-ownership"><span>{"Ownership status" if locale == "en" else "สถานะกรรมสิทธิ์"}</span><select id="sell-list-ownership" name="ownership_status" required><option value="">{"Select ownership status" if locale == "en" else "เลือกสถานะกรรมสิทธิ์"}</option><option value="freehold">Freehold</option><option value="leasehold">Leasehold</option><option value="company">Company holding</option><option value="other">Other</option></select></label>'
        f'<label class="field" for="sell-list-price"><span>{"Expected listing price (THB)" if locale == "en" else "ราคาที่ต้องการลงประกาศ (บาท)"}</span><input id="sell-list-price" name="asking_price" type="number" min="0" inputmode="numeric" /></label>'
        f'<label class="field" for="sell-list-timeline"><span>{"Timeline" if locale == "en" else "ไทม์ไลน์"}</span><select id="sell-list-timeline" name="timeline" required><option value="">{"Select timeline" if locale == "en" else "เลือกไทม์ไลน์"}</option><option value="0_3m">0-3 months</option><option value="3_6m">3-6 months</option><option value="6m_plus">6+ months</option></select></label>'
        f'<label class="field" for="sell-list-docs"><span>{"Documents and notes" if locale == "en" else "เอกสารและหมายเหตุ"}</span><textarea id="sell-list-docs" name="documents" rows="4" required></textarea></label>'
        f'<div class="grid"><button id="sell-list-submit" class="btn" type="submit" data-event="sell_cta_click" data-placement="sell_list_form" data-cta-id="sell_list_submit" data-intent="sell">{"Submit list-property request" if locale == "en" else "ส่งคำขอลงประกาศ"}</button><a class="btn" href="/{locale}/sell/valuation" data-event="sell_cta_click" data-placement="sell_list_form" data-cta-id="sell_list_to_valuation" data-intent="sell">{escape(copy["go_value"])}</a></div>'
        f'<p id="sell-list-status" class="muted" role="status" aria-live="polite"></p><div id="sell-list-loading" class="state-loading" hidden>{"Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."}</div><div id="sell-list-error" class="state-error" hidden>{escape(error_text)}</div><div id="sell-list-success" class="state-success" hidden>{escape(success_text)}</div></form></section>'
        "<script>"
        "(()=>{const locale=document.documentElement.lang||'en';const endpoint='/api/v1/events';const path=location.pathname;"
        "function compact(raw){const out={};for(const [key,value] of Object.entries(raw||{})){if(value===undefined||value===null)continue;if(Array.isArray(value)&&value.length===0)continue;out[key]=value;}return out;}"
        "function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}"
        "document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,intent:node.getAttribute('data-intent')||undefined});});});"
        "const form=document.getElementById('sell-list-form');const submitBtn=document.getElementById('sell-list-submit');const statusEl=document.getElementById('sell-list-status');const loadingEl=document.getElementById('sell-list-loading');const errorEl=document.getElementById('sell-list-error');const successEl=document.getElementById('sell-list-success');if(!(form instanceof HTMLFormElement))return;const requiredFields=Array.from(form.querySelectorAll('[required]'));requiredFields.forEach((field)=>{const clear=()=>{if(String(field.value||'').trim())field.setAttribute('aria-invalid','false');};field.addEventListener('input',clear);field.addEventListener('change',clear);});"
        "form.addEventListener('submit',async(event)=>{event.preventDefault();if(!(submitBtn instanceof HTMLButtonElement)||!(statusEl instanceof HTMLElement)||!(loadingEl instanceof HTMLElement)||!(errorEl instanceof HTMLElement)||!(successEl instanceof HTMLElement))return;errorEl.hidden=true;successEl.hidden=true;statusEl.textContent='';let firstInvalid=null;for(const field of requiredFields){const invalid=String(field.value||'').trim().length===0;field.setAttribute('aria-invalid',invalid?'true':'false');if(invalid&&!firstInvalid)firstInvalid=field;}if(firstInvalid){statusEl.textContent="
        f"{required_error!r}"
        ";firstInvalid.focus();await track('sell_list_property_error',{reason:'validation',placement:'sell_list_form',cta_id:'sell_list_submit',intent:'sell'});return;}loadingEl.hidden=false;statusEl.textContent="
        f"{submitting_text!r}"
        ";submitBtn.disabled=true;const data=Object.fromEntries(new FormData(form).entries());const contact=String(data.contact||'').trim();const isEmail=contact.includes('@');const fieldsPresent=Object.entries(data).filter(([,value])=>String(value||'').trim().length>0).map(([key])=>key);const messageParts=['Property type: '+String(data.property_type||''),'Area: '+String(data.area||''),'Address: '+String(data.address||''),'Ownership: '+String(data.ownership_status||''),'Expected price: '+String(data.asking_price||''),'Documents: '+String(data.documents||'')];try{await track('sell_list_property_submit',{placement:'sell_list_form',cta_id:'sell_list_submit',intent:'sell',fields_present:fieldsPresent});const response=await fetch('/v1/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:String(data.name||'').trim(),email:isEmail?contact:null,phone:isEmail?null:contact,message:'Sell list-property request. '+messageParts.join('; '),source_page:location.pathname,intent:'sell',timeline:String(data.timeline||'').trim()||null,budget_band:String(data.asking_price||'').trim()||null})});if(!response.ok)throw new Error('submit_failed');await track('sell_list_property_success',{placement:'sell_list_form',cta_id:'sell_list_submit',intent:'sell'});statusEl.textContent="
        f"{success_text!r}"
        ";successEl.hidden=false;form.reset();requiredFields.forEach((field)=>field.setAttribute('aria-invalid','false'));}catch{errorEl.hidden=false;statusEl.textContent="
        f"{error_text!r}"
        ";await track('sell_list_property_error',{reason:'submit_failed',placement:'sell_list_form',cta_id:'sell_list_submit',intent:'sell'});}finally{loadingEl.hidden=true;submitBtn.disabled=false;}});})();"
        "</script>"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=f"{copy['title']} / List Property",
            intro=copy["intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _render_sell_valuation_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    copy = _sell_copy(locale)
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    process_content = str(process_row.content if process_row is not None else "").strip() or (
        "Process details pending publication. TODO: publish approved handoff steps."
        if locale == "en"
        else "ยังไม่มีรายละเอียด process ที่เผยแพร่ TODO: เพิ่มขั้นตอนที่อนุมัติแล้ว"
    )
    required_error = (
        "Please fill all required fields." if locale == "en" else "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
    )
    submitting_text = "Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."
    success_text = (
        "Valuation request submitted. Our team will review and contact you."
        if locale == "en"
        else "ส่งคำขอประเมินราคาแล้ว ทีมงานจะตรวจสอบและติดต่อกลับ"
    )
    error_text = (
        "Unable to submit right now. Please try again."
        if locale == "en"
        else "ยังไม่สามารถส่งคำขอได้ในตอนนี้ กรุณาลองใหม่อีกครั้ง"
    )
    docs = (
        "Include latest unit details, condition notes, and a clear valuation goal."
        if locale == "en"
        else "ระบุรายละเอียดทรัพย์ล่าสุด สภาพทรัพย์ และเป้าหมายการประเมินราคา"
    )
    body = (
        f'<section id="seller-intent" class="card"><h2>{escape(copy["intent_title"])}</h2><p>{escape(copy["intent_body"])}</p></section>'
        f'<section id="seller-process" class="card"><h2>{escape(copy["process_title"])}</h2><div>{_format_text_block(process_content)}</div></section>'
        f'<section id="seller-docs" class="card"><h2>{escape(copy["docs_title"])}</h2><p>{escape(docs)}</p></section>'
        f'<section id="seller-trust" class="card"><h2>{escape(copy["trust_title"])}</h2><p>{escape("Valuation is reviewed from submitted facts and available market evidence in system records." if locale == "en" else "การประเมินราคาพิจารณาจากข้อมูลที่ส่งเข้ามาและข้อมูลตลาดที่มีในระบบ")}</p></section>'
        f'<section id="sell-valuation-form" class="card"><h2>{"Valuation form" if locale == "en" else "ฟอร์มขอประเมินราคา"}</h2><form id="sell-valuation-lead-form" novalidate>'
        f'<label class="field" for="sell-value-name"><span>{"Name" if locale == "en" else "ชื่อ"}</span><input id="sell-value-name" name="name" type="text" required /></label>'
        f'<label class="field" for="sell-value-contact"><span>{"Email or phone" if locale == "en" else "อีเมลหรือเบอร์โทร"}</span><input id="sell-value-contact" name="contact" type="text" required /></label>'
        f'<label class="field" for="sell-value-type"><span>{"Property type" if locale == "en" else "ประเภททรัพย์"}</span><select id="sell-value-type" name="property_type" required><option value="">{"Select property type" if locale == "en" else "เลือกประเภททรัพย์"}</option><option value="condo">Condo</option><option value="house">House</option><option value="villa">Villa</option><option value="land">Land</option><option value="commercial">Commercial</option></select></label>'
        f'<label class="field" for="sell-value-area"><span>{"Area" if locale == "en" else "ทำเล"}</span><input id="sell-value-area" name="area" type="text" required /></label>'
        f'<label class="field" for="sell-value-size"><span>{"Size (sqm)" if locale == "en" else "ขนาด (ตร.ม.)"}</span><input id="sell-value-size" name="size_sqm" type="number" min="0" inputmode="numeric" required /></label>'
        f'<label class="field" for="sell-value-beds"><span>{"Bedrooms" if locale == "en" else "ห้องนอน"}</span><input id="sell-value-beds" name="bedrooms" type="number" min="0" inputmode="numeric" /></label>'
        f'<label class="field" for="sell-value-baths"><span>{"Bathrooms" if locale == "en" else "ห้องน้ำ"}</span><input id="sell-value-baths" name="bathrooms" type="number" min="0" inputmode="numeric" /></label>'
        f'<label class="field" for="sell-value-condition"><span>{"Condition" if locale == "en" else "สภาพทรัพย์"}</span><select id="sell-value-condition" name="condition" required><option value="">{"Select condition" if locale == "en" else "เลือกสภาพทรัพย์"}</option><option value="new">New</option><option value="good">Good</option><option value="needs_update">Needs update</option></select></label>'
        f'<label class="field" for="sell-value-timeline"><span>{"Timeline" if locale == "en" else "ไทม์ไลน์"}</span><select id="sell-value-timeline" name="timeline" required><option value="">{"Select timeline" if locale == "en" else "เลือกไทม์ไลน์"}</option><option value="0_3m">0-3 months</option><option value="3_6m">3-6 months</option><option value="6m_plus">6+ months</option></select></label>'
        f'<label class="field" for="sell-value-notes"><span>{"Notes" if locale == "en" else "หมายเหตุ"}</span><textarea id="sell-value-notes" name="notes" rows="4"></textarea></label>'
        f'<div class="grid"><button id="sell-value-submit" class="btn" type="submit" data-event="sell_cta_click" data-placement="sell_valuation_form" data-cta-id="sell_valuation_submit" data-intent="sell">{"Submit valuation request" if locale == "en" else "ส่งคำขอประเมินราคา"}</button><a class="btn" href="/{locale}/sell/list-property" data-event="sell_cta_click" data-placement="sell_valuation_form" data-cta-id="sell_valuation_to_list" data-intent="sell">{escape(copy["go_list"])}</a></div>'
        f'<p id="sell-valuation-status" class="muted" role="status" aria-live="polite"></p><div id="sell-valuation-loading" class="state-loading" hidden>{"Submitting..." if locale == "en" else "กำลังส่งข้อมูล..."}</div><div id="sell-valuation-error" class="state-error" hidden>{escape(error_text)}</div><div id="sell-valuation-success" class="state-success" hidden>{escape(success_text)}</div></form></section>'
        "<script>"
        "(()=>{const locale=document.documentElement.lang||'en';const endpoint='/api/v1/events';const path=location.pathname;"
        "function compact(raw){const out={};for(const [key,value] of Object.entries(raw||{})){if(value===undefined||value===null)continue;if(Array.isArray(value)&&value.length===0)continue;out[key]=value;}return out;}"
        "function track(eventName,payload){const payloadBody=compact(payload);const sourceBody=compact({app:'flowbiz-public-runtime',env:'runtime',page:path,locale,placement:payloadBody.placement});return fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name:eventName,source:sourceBody,payload:payloadBody}),keepalive:true}).catch(()=>null);}"
        "document.querySelectorAll('[data-event]').forEach((node)=>{node.addEventListener('click',()=>{const eventName=node.getAttribute('data-event');if(!eventName)return;track(eventName,{label:node.textContent?.trim()||'',placement:node.getAttribute('data-placement')||undefined,cta_id:node.getAttribute('data-cta-id')||undefined,intent:node.getAttribute('data-intent')||undefined});});});"
        "const form=document.getElementById('sell-valuation-lead-form');const submitBtn=document.getElementById('sell-value-submit');const statusEl=document.getElementById('sell-valuation-status');const loadingEl=document.getElementById('sell-valuation-loading');const errorEl=document.getElementById('sell-valuation-error');const successEl=document.getElementById('sell-valuation-success');if(!(form instanceof HTMLFormElement))return;const requiredFields=Array.from(form.querySelectorAll('[required]'));requiredFields.forEach((field)=>{const clear=()=>{if(String(field.value||'').trim())field.setAttribute('aria-invalid','false');};field.addEventListener('input',clear);field.addEventListener('change',clear);});"
        "form.addEventListener('submit',async(event)=>{event.preventDefault();if(!(submitBtn instanceof HTMLButtonElement)||!(statusEl instanceof HTMLElement)||!(loadingEl instanceof HTMLElement)||!(errorEl instanceof HTMLElement)||!(successEl instanceof HTMLElement))return;errorEl.hidden=true;successEl.hidden=true;statusEl.textContent='';let firstInvalid=null;for(const field of requiredFields){const invalid=String(field.value||'').trim().length===0;field.setAttribute('aria-invalid',invalid?'true':'false');if(invalid&&!firstInvalid)firstInvalid=field;}if(firstInvalid){statusEl.textContent="
        f"{required_error!r}"
        ";firstInvalid.focus();await track('sell_valuation_error',{reason:'validation',placement:'sell_valuation_form',cta_id:'sell_valuation_submit',intent:'sell'});return;}loadingEl.hidden=false;statusEl.textContent="
        f"{submitting_text!r}"
        ";submitBtn.disabled=true;const data=Object.fromEntries(new FormData(form).entries());const contact=String(data.contact||'').trim();const isEmail=contact.includes('@');const fieldsPresent=Object.entries(data).filter(([,value])=>String(value||'').trim().length>0).map(([key])=>key);const messageParts=['Property type: '+String(data.property_type||''),'Area: '+String(data.area||''),'Size sqm: '+String(data.size_sqm||''),'Bedrooms: '+String(data.bedrooms||''),'Bathrooms: '+String(data.bathrooms||''),'Condition: '+String(data.condition||''),'Notes: '+String(data.notes||'')];try{await track('sell_valuation_submit',{placement:'sell_valuation_form',cta_id:'sell_valuation_submit',intent:'sell',fields_present:fieldsPresent});const response=await fetch('/v1/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:String(data.name||'').trim(),email:isEmail?contact:null,phone:isEmail?null:contact,message:'Sell valuation request. '+messageParts.join('; '),source_page:location.pathname,intent:'sell',timeline:String(data.timeline||'').trim()||null,budget_band:null})});if(!response.ok)throw new Error('submit_failed');await track('sell_valuation_success',{placement:'sell_valuation_form',cta_id:'sell_valuation_submit',intent:'sell'});statusEl.textContent="
        f"{success_text!r}"
        ";successEl.hidden=false;form.reset();requiredFields.forEach((field)=>field.setAttribute('aria-invalid','false'));}catch{errorEl.hidden=false;statusEl.textContent="
        f"{error_text!r}"
        ";await track('sell_valuation_error',{reason:'submit_failed',placement:'sell_valuation_form',cta_id:'sell_valuation_submit',intent:'sell'});}finally{loadingEl.hidden=true;submitBtn.disabled=false;}});})();"
        "</script>"
    )
    return HTMLResponse(
        _render_page_shell(
            locale,
            title=f"{copy['title']} / Valuation",
            intro=copy["intro"],
            body=body,
            request=request,
            db=db,
        )
    )


def _request_locale(request: Request) -> str:
    return "th" if request.url.path.startswith("/th") else "en"


@router.get("/", response_class=HTMLResponse)
def render_home_root(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    source, resolved = _load_home_context(db, "en")
    return HTMLResponse(_render("en", request, db, source, resolved))


@router.get("/en", response_class=HTMLResponse)
def render_home_en(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    source, resolved = _load_home_context(db, "en")
    return HTMLResponse(_render("en", request, db, source, resolved))


@router.get("/th", response_class=HTMLResponse)
def render_home_th(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    source, resolved = _load_home_context(db, "th")
    return HTMLResponse(_render("th", request, db, source, resolved))


@router.get("/en/buy", response_class=HTMLResponse)
@router.get("/th/buy", response_class=HTMLResponse)
def render_listing_buy(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_property_listing_page(_request_locale(request), request, db, "buy")


@router.get("/en/rent", response_class=HTMLResponse)
@router.get("/th/rent", response_class=HTMLResponse)
def render_listing_rent(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_property_listing_page(_request_locale(request), request, db, "rent")


@router.get("/en/investment", response_class=HTMLResponse)
@router.get("/th/investment", response_class=HTMLResponse)
def render_listing_investment(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_property_listing_page(_request_locale(request), request, db, "investment")


@router.get("/en/invest", response_class=HTMLResponse)
@router.get("/th/invest", response_class=HTMLResponse)
@router.get("/invest", response_class=HTMLResponse)
def render_listing_invest(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = (
        _request_locale(request)
        if request.url.path.startswith("/en") or request.url.path.startswith("/th")
        else "en"
    )
    return _render_property_listing_page(locale, request, db, "investment")


@router.get("/en/marketplace", response_class=HTMLResponse)
@router.get("/th/marketplace", response_class=HTMLResponse)
def render_listing_marketplace(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_property_listing_page(_request_locale(request), request, db, "marketplace")


@router.get("/en/projects", response_class=HTMLResponse)
@router.get("/th/projects", response_class=HTMLResponse)
def render_projects(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_projects_page(_request_locale(request), request, db)


@router.get("/projects", response_class=HTMLResponse)
def render_projects_default_locale(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_projects_page("en", request, db)


@router.get("/en/projects/{slug}", response_class=HTMLResponse)
@router.get("/th/projects/{slug}", response_class=HTMLResponse)
def render_project_detail(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_project_detail_page(_request_locale(request), request, db, slug)


@router.get("/projects/{slug}", response_class=HTMLResponse)
def render_project_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_project_detail_page("en", request, db, slug)


@router.get("/en/smart-finder", response_class=HTMLResponse)
@router.get("/th/smart-finder", response_class=HTMLResponse)
def render_smart_finder(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_smart_finder_page(_request_locale(request), request, db)


@router.get("/en/compare", response_class=HTMLResponse)
@router.get("/th/compare", response_class=HTMLResponse)
def render_compare(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_compare_page(_request_locale(request), request, db)


@router.get("/compare", response_class=HTMLResponse)
def render_compare_default_locale(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_compare_page("en", request, db)


@router.get("/en/area-guide", response_class=HTMLResponse)
@router.get("/th/area-guide", response_class=HTMLResponse)
def render_area_guide(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_areas_page(_request_locale(request), request, db)


@router.get("/area-guide", response_class=HTMLResponse)
def render_area_guide_default_locale(
    request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_areas_page("en", request, db)


@router.get("/en/areas", response_class=HTMLResponse)
@router.get("/th/areas", response_class=HTMLResponse)
def render_areas(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_areas_page(_request_locale(request), request, db)


@router.get("/areas", response_class=HTMLResponse)
def render_areas_default_locale(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_areas_page("en", request, db)


@router.get("/en/area-guide/{slug}", response_class=HTMLResponse)
@router.get("/th/area-guide/{slug}", response_class=HTMLResponse)
def render_area_guide_detail(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_area_detail_page(_request_locale(request), request, db, slug)


@router.get("/area-guide/{slug}", response_class=HTMLResponse)
def render_area_guide_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_area_detail_page("en", request, db, slug)


@router.get("/en/areas/{slug}", response_class=HTMLResponse)
@router.get("/th/areas/{slug}", response_class=HTMLResponse)
def render_area_detail(slug: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_area_detail_page(_request_locale(request), request, db, slug)


@router.get("/areas/{slug}", response_class=HTMLResponse)
def render_area_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_area_detail_page("en", request, db, slug)


@router.get("/en/developers", response_class=HTMLResponse)
@router.get("/th/developers", response_class=HTMLResponse)
def render_developers(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_developers_page(_request_locale(request), request, db)


@router.get("/developers", response_class=HTMLResponse)
def render_developers_default_locale(
    request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_developers_page("en", request, db)


@router.get("/en/developers/{slug}", response_class=HTMLResponse)
@router.get("/th/developers/{slug}", response_class=HTMLResponse)
def render_developer_detail(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_developer_detail_page(_request_locale(request), request, db, slug)


@router.get("/developers/{slug}", response_class=HTMLResponse)
def render_developer_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_developer_detail_page("en", request, db, slug)


@router.get("/en/property/{property_ref}", response_class=HTMLResponse)
@router.get("/th/property/{property_ref}", response_class=HTMLResponse)
def render_property_detail(
    property_ref: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_property_detail_page(_request_locale(request), request, db, property_ref)


@router.get("/property/{property_ref}", response_class=HTMLResponse)
def render_property_detail_default_locale(
    property_ref: str,
    request: Request,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    return _render_property_detail_page("en", request, db, property_ref)


@router.get("/en/blog", response_class=HTMLResponse)
@router.get("/th/blog", response_class=HTMLResponse)
def render_blog_listing(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_content_listing_page(_request_locale(request), request, db, mode="blog")


@router.get("/blog", response_class=HTMLResponse)
def render_blog_listing_default_locale(
    request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_listing_page("en", request, db, mode="blog")


@router.get("/en/blog/{slug}", response_class=HTMLResponse)
@router.get("/th/blog/{slug}", response_class=HTMLResponse)
def render_blog_detail(slug: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_content_detail_page(_request_locale(request), request, db, slug, "blog")


@router.get("/blog/{slug}", response_class=HTMLResponse)
def render_blog_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_detail_page("en", request, db, slug, "blog")


@router.get("/en/guides", response_class=HTMLResponse)
@router.get("/th/guides", response_class=HTMLResponse)
def render_guides_listing(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_content_listing_page(_request_locale(request), request, db, mode="guides")


@router.get("/guides", response_class=HTMLResponse)
def render_guides_listing_default_locale(
    request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_listing_page("en", request, db, mode="guides")


@router.get("/en/guides/{slug}", response_class=HTMLResponse)
@router.get("/th/guides/{slug}", response_class=HTMLResponse)
def render_guides_detail(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_detail_page(_request_locale(request), request, db, slug, "guide")


@router.get("/guides/{slug}", response_class=HTMLResponse)
def render_guides_detail_default_locale(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_detail_page("en", request, db, slug, "guide")


@router.get("/en/invest/guides", response_class=HTMLResponse)
@router.get("/th/invest/guides", response_class=HTMLResponse)
def render_invest_guides_listing(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_content_listing_page(_request_locale(request), request, db, mode="invest-guides")


@router.get("/invest/guides", response_class=HTMLResponse)
def render_invest_guides_listing_default_locale(
    request: Request, db: Session = Depends(get_db)
) -> HTMLResponse:
    return _render_content_listing_page("en", request, db, mode="invest-guides")


@router.get("/en/insights", response_class=HTMLResponse)
@router.get("/th/insights", response_class=HTMLResponse)
def render_insights(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_insights_page(_request_locale(request), request, db)


@router.get("/en/about", response_class=HTMLResponse)
@router.get("/th/about", response_class=HTMLResponse)
def render_about(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_about_page(_request_locale(request), request, db)


@router.get("/en/how-we-work", response_class=HTMLResponse)
@router.get("/th/how-we-work", response_class=HTMLResponse)
@router.get("/how-we-work", response_class=HTMLResponse)
def render_how_we_work(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = (
        _request_locale(request)
        if request.url.path.startswith("/en") or request.url.path.startswith("/th")
        else "en"
    )
    return _render_how_we_work_page(locale, request, db)


@router.get("/en/contact", response_class=HTMLResponse)
@router.get("/th/contact", response_class=HTMLResponse)
def render_contact(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_contact_page(_request_locale(request), request, db)


@router.get("/en/sell", response_class=HTMLResponse)
@router.get("/th/sell", response_class=HTMLResponse)
@router.get("/sell", response_class=HTMLResponse)
def render_sell(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = (
        _request_locale(request)
        if request.url.path.startswith("/en") or request.url.path.startswith("/th")
        else "en"
    )
    return _render_sell_page(locale, request, db)


@router.get("/en/sell/list-property", response_class=HTMLResponse)
@router.get("/th/sell/list-property", response_class=HTMLResponse)
@router.get("/sell/list-property", response_class=HTMLResponse)
def render_sell_list_property(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = (
        _request_locale(request)
        if request.url.path.startswith("/en") or request.url.path.startswith("/th")
        else "en"
    )
    return _render_sell_list_property_page(locale, request, db)


@router.get("/en/sell/valuation", response_class=HTMLResponse)
@router.get("/th/sell/valuation", response_class=HTMLResponse)
@router.get("/sell/valuation", response_class=HTMLResponse)
def render_sell_valuation(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = (
        _request_locale(request)
        if request.url.path.startswith("/en") or request.url.path.startswith("/th")
        else "en"
    )
    return _render_sell_valuation_page(locale, request, db)


@router.get("/en/privacy", response_class=HTMLResponse)
@router.get("/th/privacy", response_class=HTMLResponse)
def render_privacy(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = (
        "Privacy content is not published yet. TODO: publish approved privacy details."
        if locale == "en"
        else "ยังไม่มีเนื้อหา Privacy ที่เผยแพร่ TODO: เพิ่มรายละเอียด privacy ที่อนุมัติแล้ว"
    )
    return _company_page(locale, "privacy", "Privacy Policy", fallback, request, db)


@router.get("/en/terms", response_class=HTMLResponse)
@router.get("/th/terms", response_class=HTMLResponse)
def render_terms(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = (
        "Terms content is not published yet. TODO: publish approved terms."
        if locale == "en"
        else "ยังไม่มีเนื้อหา Terms ที่เผยแพร่ TODO: เพิ่มข้อกำหนดที่อนุมัติแล้ว"
    )
    return _company_page(locale, "terms", "Terms", fallback, request, db)


@router.get("/en/cookies", response_class=HTMLResponse)
@router.get("/th/cookies", response_class=HTMLResponse)
def render_cookies(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = (
        "Cookies content is not published yet. TODO: publish approved cookie details."
        if locale == "en"
        else "ยังไม่มีเนื้อหา Cookies ที่เผยแพร่ TODO: เพิ่มรายละเอียด cookies ที่อนุมัติแล้ว"
    )
    return _company_page(locale, "cookies", "Cookies", fallback, request, db)


@router.get("/en/investment/methodology", response_class=HTMLResponse)
@router.get("/th/investment/methodology", response_class=HTMLResponse)
def render_investment_methodology(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = (
        "Investment methodology is not published yet. TODO: publish approved selection criteria and source notes."
        if locale == "en"
        else "ยังไม่มี methodology การลงทุนที่เผยแพร่ TODO: เพิ่มเกณฑ์คัดเลือกและ source notes ที่อนุมัติแล้ว"
    )
    title = "Investment Methodology" if locale == "en" else "Investment Methodology"
    return _company_page(locale, "investment-methodology", title, fallback, request, db)


@router.get("/en/foreign-buyer-hub", response_class=HTMLResponse)
@router.get("/th/foreign-buyer-hub", response_class=HTMLResponse)
def render_foreign_buyer_hub(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    return _render_foreign_buyer_hub_page(locale, request, db)


@router.get("/en/market-intelligence", response_class=HTMLResponse)
@router.get("/th/market-intelligence", response_class=HTMLResponse)
def render_market_intelligence(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    return _render_market_intelligence_page(locale, request, db)
