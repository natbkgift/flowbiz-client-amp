from __future__ import annotations

import json
from decimal import Decimal
from html import escape
from pathlib import Path
from urllib.parse import urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from apps.api.routes.home_composer_contract import normalize_home_config, resolve_home_runtime
from packages.core.database import get_db
from packages.core.models import Area, Article, CompanyInfo, Developer, HomeComposerConfig, Project, Property, TeamMember, Testimonial

router = APIRouter(tags=["home-runtime"])

_INTERNAL_MEDIA_HOSTS = {"localhost", "127.0.0.1", "flowbiz.com", "www.flowbiz.com"}
_ALLOWED_RUNTIME_PATHS = {"/", "/en", "/th"}
_PUBLIC_ROUTE_SUFFIXES = {
    "",
    "/projects",
    "/developers",
    "/smart-finder",
    "/areas",
    "/insights",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/investment/methodology",
}
_DEFAULT_MEDIA_FALLBACK = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
_MEDIA_ROOTS = [
    Path("storage/media"),
    Path("admin-app/public/media"),
]


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
            {"key": "invest", "title": "Invest", "fit": "สำหรับผู้ใช้ที่กำลังเทียบผลตอบแทน ดีมานด์ และทางออกการลงทุน", "outcome": "ดูรายการที่มีข้อมูลเปรียบเทียบพร้อมใช้งานในระบบ"},
            {"key": "buy", "title": "Buy", "fit": "สำหรับผู้ซื้อที่กำลังมองหาอสังหาที่เหมาะกับการถือครองในพัทยา", "outcome": "ดูโครงการคัดสรรและขั้นตอนถัดไปที่ชัดเจน"},
            {"key": "rent", "title": "Rent", "fit": "สำหรับผู้เช่าที่กำลังวางแผนย้ายอยู่ระยะยาวหรือแบบยืดหยุ่น", "outcome": "เริ่มจากการแจ้งความต้องการเพื่อรับคำแนะนำถัดไป"},
            {"key": "sell", "title": "Sell", "fit": "สำหรับเจ้าของที่ต้องการเริ่มต้นขายอย่างเป็นระบบ", "outcome": "ส่งรายละเอียดเบื้องต้นเพื่อรับขั้นตอนถัดไป"},
        ]
    return [
        {"key": "invest", "title": "Invest", "fit": "For people comparing yield, demand, and exit visibility", "outcome": "See which published picks currently have comparison data"},
        {"key": "buy", "title": "Buy", "fit": "For buyers looking for the right Pattaya property to own", "outcome": "Browse curated projects and the clearest next step"},
        {"key": "rent", "title": "Rent", "fit": "For renters planning a move, long stay, or flexible setup", "outcome": "Start with a request so we can guide the next step"},
        {"key": "sell", "title": "Sell", "fit": "For owners who want to start with clear input and next-step guidance", "outcome": "Share the basics and request the next step"},
    ]


def _section_href(locale: str, fragment: str) -> str:
    return f"/{locale}{fragment}"


def _locale_path(locale: str, suffix: str = "") -> str:
    return f"/{locale}{suffix}"


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
    row = db.scalar(select(HomeComposerConfig).where(HomeComposerConfig.page_key == "home", HomeComposerConfig.locale == locale, HomeComposerConfig.status == "published").order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at)).limit(1))
    if row is None and locale != "en":
        row = db.scalar(select(HomeComposerConfig).where(HomeComposerConfig.page_key == "home", HomeComposerConfig.locale == "en", HomeComposerConfig.status == "published").order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at)).limit(1))
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
    areas = int(db.scalar(select(func.count()).select_from(Area).where(Area.status == "published")) or 0)
    projects = int(
        db.scalar(
            select(func.count()).select_from(Project).where(Project.deleted_at.is_(None), Project.status == "published")
        )
        or 0
    )
    properties = int(db.scalar(select(func.count()).select_from(Property).where(Property.status == "active")) or 0)
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
        media = _safe_media_url(item.get("cover_image_url") or item.get("hero_image_url"), _DEFAULT_MEDIA_FALLBACK, request=request)
        name = escape(str(item.get("name") or "Project"))
        area_name = _area_name(db, getattr(project, "area_id", None)) or copy["featured_pending_area"]
        price_text = _format_money(getattr(project, "starting_price", None), fallback=copy["featured_pending_price"])
        facts = _project_facts(project)
        facts_html = (
            f"<ul class=\"facts\">{''.join(f'<li>{escape(fact)}</li>' for fact in facts)}</ul>"
            if facts
            else f"<div class=\"state-empty state-inline\">{escape(copy['featured_pending_facts'])}</div>"
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
    return f"<div class=\"state-empty\">{escape(copy['featured_fallback'])}</div>"


def _build_investment_html(db: Session, request: Request, locale: str, copy: dict[str, str], resolved: dict) -> str:
    cards: list[str] = []
    for item in (resolved.get("investment_picks") or [])[:6]:
        prop = _property_by_id(db, str(item.get("id") or ""))
        item_id = escape(str(item.get("id") or "pick"))
        item_slug = escape(str(getattr(prop, "slug", "") or item.get("slug") or ""))
        title = escape(str(item.get("title") or "Investment pick"))
        media = _safe_media_url(item.get("cover_image_url"), _DEFAULT_MEDIA_FALLBACK, request=request)
        price_text = _format_money(item.get("price"), fallback=copy["featured_pending_price"])
        stats = _property_stats(prop)
        tags = _property_tags(prop)
        stats_html = (
            f"<ul class=\"facts\">{''.join(f'<li>{escape(stat)}</li>' for stat in stats)}</ul>"
            if stats
            else f"<div class=\"state-empty state-inline\">{escape(copy['investment_pending_stats'])}</div>"
        )
        tags_html = "".join(f"<span class=\"tag\">{escape(tag)}</span>" for tag in tags)
        cards.append(
            f"""
            <article class=\"card\" data-item-id=\"{item_id}\" data-card-id=\"{item_id}\" data-card-slug=\"{item_slug}\">
              <img class=\"cover-media\" src=\"{escape(media)}\" alt=\"{title}\" loading=\"lazy\" width=\"640\" height=\"360\" />
              <p class=\"price\">{escape(price_text)}</p>
              <h3>{title}</h3>
              {stats_html}
              <div class=\"tag-row\">{tags_html}</div>
              <a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_investment_pick_click\" data-cta-id=\"investment_pick_cta\" data-item-id=\"{item_id}\" data-card-id=\"{item_id}\" data-card-slug=\"{item_slug}\" data-placement=\"investment_card\" href=\"{_section_href(locale, '#consult-title')}\">{escape(copy['view_pick'])}</a>
            </article>
            """
        )
    if cards:
        return "".join(cards)
    return f"<div class=\"state-empty\">{escape(copy['investment_fallback'])}</div>"


def _build_why_html(db: Session, copy: dict[str, str]) -> str:
    counts = _count_cards(db)
    if not any(value for _, value in counts):
        return f"<div class=\"state-empty\">{escape(copy['why_empty'])}</div>"
    labels = {"areas": copy["why_areas"], "projects": copy["why_projects"], "properties": copy["why_properties"]}
    cards = "".join(
        f"<article class=\"metric\"><h3>{escape(labels[key])}</h3><p>{value}</p></article>"
        for key, value in counts
    )
    return f"<div class=\"metrics\">{cards}</div><p class=\"muted\">{escape(copy['why_source'])}</p>"


def _build_trust_html(copy: dict[str, str], resolved: dict) -> str:
    blocks = resolved.get("trust_blocks") or []
    rendered = [
        f"<article class=\"card\"><h3>{escape(str(block.get('title') or 'Trust block'))}</h3><p>{escape(str(block.get('body') or ''))}</p></article>"
        for block in blocks
        if str(block.get("title") or "").strip() or str(block.get("body") or "").strip()
    ]
    if rendered:
        return "".join(rendered)
    return (
        f"<div class=\"state-empty\" id=\"trust-publication-note\">{escape(copy['trust_fallback'])}</div>"
        f"<div class=\"state-empty\" id=\"team-note\">{escape(copy['team_note'])}</div>"
        f"<div class=\"state-empty\" id=\"process-note\">{escape(copy['process_note'])}</div>"
    )


def _build_video_html(request: Request, copy: dict[str, str], resolved: dict) -> str:
    cards: list[str] = []
    for item in (resolved.get("video_items") or [])[:4]:
        thumb = _safe_media_url(item.get("thumbnail_path"), _DEFAULT_MEDIA_FALLBACK, request=request)
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
    return f"<div class=\"state-empty\">{escape(copy['video_fallback'])}</div>"


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
        return f"<div id=\"insights-note\" class=\"state-empty\">{escape(copy['insights_fallback'])}</div>"
    cards = []
    for row in rows:
        title = _localized_dict_text(row.title, locale) or row.slug
        excerpt = _localized_dict_text(row.excerpt, locale) or copy["insights_fallback"]
        cards.append(
            f"<article class=\"card\"><h3>{escape(title)}</h3><p class=\"muted\">{escape(row.category)}</p><p>{escape(excerpt)}</p></article>"
        )
    return f"<div class=\"grid-3\">{''.join(cards)}</div>"


def _build_reviews_html(db: Session, locale: str, copy: dict[str, str], resolved: dict) -> str:
    review_ids = [str(item) for item in ((resolved.get("reviews") or {}).get("source_ids") or []) if str(item).strip()]
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
        return f"<div id=\"reviews-note\" class=\"state-empty\">{escape(copy['reviews_fallback'])}</div>"
    cards = []
    for row in rows[:3]:
        title = row.attribution_name or ("Client review" if locale == "en" else "รีวิวลูกค้า")
        context = row.context or row.persona or row.intent
        cards.append(
            f"<article class=\"card\"><h3>{escape(title)}</h3><p><strong>{escape(row.quote)}</strong></p><p class=\"muted\">{escape(str(context or '').strip())}</p></article>"
        )
    return f"<div class=\"grid-3\">{''.join(cards)}</div>"

def _render(locale: str, request: Request, db: Session, source: str, resolved: dict) -> str:
    copy = _safe_copy(locale)
    hero = resolved.get("hero") or {}
    secondary_cta = resolved.get("hero_secondary_cta") or {}
    primary_cta = hero.get("cta") if isinstance(hero.get("cta"), dict) else {}
    consultation = resolved.get("consultation") or {}
    trust_items = [str(item.get("text") or "").strip() for item in (resolved.get("trust_micro_strip") or []) if str(item.get("text") or "").strip()]
    hero_title = _published_text(hero.get("headline"), copy["h1"]) if source == "published" else copy["h1"]
    hero_sub = _published_text(hero.get("subheadline"), copy["sub"]) if source == "published" else copy["sub"]
    hero_trust_strip = " • ".join(trust_items[:4]) if source == "published" and trust_items else copy["trust_strip"]
    consult_copy = _published_text(consultation.get("promise_copy"), copy["consult_sub"]) if source == "published" else copy["consult_sub"]
    consult_trust = _published_text(consultation.get("trust_note"), copy["consult_trust"]) if source == "published" else copy["consult_trust"]
    hero_primary_label = _resolve_cta_text(primary_cta.get("text"), copy["cta_primary"], source=source)
    hero_secondary_label = _resolve_cta_text(secondary_cta.get("text"), copy["cta_secondary"], source=source)
    path_cards = resolved.get("path_selector", {}).get("cards") if source == "published" else None
    cards = path_cards if isinstance(path_cards, list) and len(path_cards) == 4 else _default_path_cards(locale)
    fallback_targets = {
        "invest": "/investment/methodology",
        "buy": "/projects",
        "rent": "/contact",
        "sell": "/contact",
    }
    card_html = "".join(
        f"""
        <a class=\"intent-card\" href=\"{_safe_forward_href(locale, card.get('href') if isinstance(card, dict) else None, fallback_targets.get(str((card or {}).get('key') or ''), '#consult-title'))}\" data-event=\"home_intent_start_click\" data-cta-id=\"intent_{escape(str((card or {}).get('key') or 'path'))}\" data-intent=\"{escape(str((card or {}).get('key') or 'path'))}\" data-filter-values='["{escape(str((card or {}).get("key") or "path"))}"]' data-placement=\"intent_selector\">
          <h3>{escape(str((card or {}).get('title') or (card or {}).get('key') or 'Path'))}</h3>
          <p><strong>Fit:</strong> {escape(str((card or {}).get('fit') or ''))}</p>
          <p><strong>Outcome:</strong> {escape(str((card or {}).get('outcome') or ''))}</p>
          <span class=\"start-pill\">{escape(copy['start'])}</span>
        </a>
        """
        for card in cards
    )
    consult_href = _safe_forward_href(locale, primary_cta.get("href") if isinstance(primary_cta, dict) else None, "/contact")
    featured_href = _resolve_secondary_cta_href(locale, secondary_cta.get("href") if isinstance(secondary_cta, dict) else None, hero_secondary_label)
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
    return f"""<!doctype html>
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
    <main id=\"main\" class=\"container stack\">
      <section class=\"hero\" aria-labelledby=\"hero-title\">
        <img class=\"hero-media\" src=\"{escape(hero_media)}\" alt=\"{escape(copy['hero_alt'])}\" width=\"1280\" height=\"720\" loading=\"eager\" />
        <h1 id=\"hero-title\">{escape(hero_title)}</h1>
        <p>{escape(hero_sub)}</p>
        <div class=\"cta-row\"><a class=\"btn btn-primary-hero\" data-event=\"home_hero_primary_click\" data-cta-id=\"hero_primary\" data-placement=\"hero\" href=\"{consult_href}\">{escape(hero_primary_label)}</a><a class=\"btn btn-secondary-hero\" data-event=\"home_hero_secondary_click\" data-cta-id=\"hero_secondary\" data-placement=\"hero\" href=\"{featured_href}\">{escape(hero_secondary_label)}</a></div>
        <p class=\"trust-strip\">{escape(hero_trust_strip)}</p>
      </section>
      <section aria-labelledby=\"intent-title\"><h2 id=\"intent-title\">{escape(copy['path_title'])}</h2><div class=\"grid-2\">{card_html}</div></section>
      <section aria-labelledby=\"featured-title\"><h2 id=\"featured-title\">{escape(copy['featured_title'])}</h2><p class=\"muted\">{escape(copy['featured_sub'])}</p><div class=\"grid-3\">{featured_html}</div><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_browse_projects_click\" data-cta-id=\"featured_footer_cta\" data-placement=\"featured_footer\" href=\"{featured_href}\">{escape(hero_secondary_label)}</a></section>
      <section aria-labelledby=\"investment-title\"><div style=\"display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap\"><h2 id=\"investment-title\">{escape(copy['investment_title'])}</h2><a id=\"investment-methodology\" href=\"{_locale_path(locale, '/investment/methodology')}\">{escape(copy['methodology'])}</a></div><p class=\"muted\">{escape(copy['investment_disclaimer'])}</p><div class=\"grid-5\">{investment_html}</div><div id=\"methodology-note\" class=\"state-empty\">{escape(copy['methodology_note'])}</div><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_investment_pick_click\" data-cta-id=\"investment_all_picks_cta\" data-item-id=\"all_picks\" data-placement=\"investment_footer\" href=\"{_locale_path(locale, '/investment/methodology')}\">{escape(copy['view_all_picks'])}</a></section>
      <section aria-labelledby=\"why-pattaya-title\"><h2 id=\"why-pattaya-title\">{escape(copy['why_title'])}</h2><p>{escape(copy['why_intro'])}</p>{why_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/areas')}\">{escape(copy['area_guides'])}</a></section>
      <section aria-labelledby=\"trust-title\"><h2 id=\"trust-title\">{escape(copy['trust_title'])}</h2><div class=\"grid-2\">{trust_html}</div><div class=\"cta-row\"><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/about')}#team-section\">{escape(copy['team_link'])}</a><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/about')}#process-section\">{escape(copy['process_link'])}</a></div></section>
      <section aria-labelledby=\"insights-title\"><h2 id=\"insights-title\">{escape(copy['insights_title'])}</h2><p>{escape(copy['insights_sub'])}</p>{insights_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/insights')}\">{escape(copy['browse_insights'])}</a></section>
      <section aria-labelledby=\"reviews-title\"><h2 id=\"reviews-title\">{escape(copy['reviews_title'])}</h2>{reviews_html}<a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/about')}#client-reviews\">{escape(copy['see_client_stories'])}</a></section>
      <section aria-labelledby=\"video-title\"><h2 id=\"video-title\">{escape(copy['work_title'])}</h2><p>{escape(copy['work_sub'])}</p><div class=\"grid-2\">{video_html}</div><a class=\"btn btn-secondary-hero btn-sm\" href=\"{_locale_path(locale, '/about')}#work-proof\">{escape(copy['watch_more'])}</a></section>
      <section aria-labelledby=\"consult-title\"><h2 id=\"consult-title\">{escape(copy['consult_title'])}</h2><p>{escape(consult_copy)}</p><form id=\"consultation-form\" class=\"card\" novalidate><label class=\"field\" for=\"name\"><span>{escape(copy['name'])}</span><input id=\"name\" name=\"name\" type=\"text\" required /></label><label class=\"field\" for=\"contact\"><span>{escape(copy['contact'])}</span><input id=\"contact\" name=\"contact\" type=\"text\" required /></label><label class=\"field\" for=\"budget\"><span>{escape(copy['budget'])}</span><select id=\"budget\" name=\"budget\" required><option value=\"\">{escape(copy['select_budget'])}</option><option value=\"lt_3m\">Below THB 3M</option><option value=\"3m_6m\">THB 3M - 6M</option><option value=\"6m_10m\">THB 6M - 10M</option><option value=\"gt_10m\">Above THB 10M</option></select></label><label class=\"field\" for=\"purpose\"><span>{escape(copy['purpose'])}</span><select id=\"purpose\" name=\"purpose\" required><option value=\"\">{escape(copy['select_purpose'])}</option><option value=\"invest\">Invest</option><option value=\"buy\">Buy</option><option value=\"rent\">Rent</option><option value=\"sell\">Sell</option></select></label><label class=\"field\" for=\"timeline\"><span>{escape(copy['timeline'])}</span><select id=\"timeline\" name=\"timeline\" required><option value=\"\">{escape(copy['select_timeline'])}</option><option value=\"0_3m\">0-3 months</option><option value=\"3_6m\">3-6 months</option><option value=\"6m_plus\">6+ months</option></select></label><div class=\"cta-row\"><button id=\"consult-submit\" class=\"btn\" type=\"submit\">{escape(hero_primary_label)}</button><a class=\"btn btn-secondary-hero btn-sm\" data-event=\"home_whatsapp_click\" data-cta-id=\"whatsapp_cta\" data-placement=\"bottom_form\" href=\"https://wa.me/66000000000\">WhatsApp</a><a class=\"btn btn-secondary-hero btn-sm\" href=\"https://line.me/R/ti/p/@flowbiz\">LINE</a></div><p class=\"muted\">{escape(consult_trust)}</p><p id=\"form-status\" class=\"muted\" role=\"status\" aria-live=\"polite\"></p><div id=\"form-loading\" class=\"state-loading\" hidden>{escape(copy['submitting'])}</div><div id=\"form-error\" class=\"state-error\" hidden>{escape(copy['submit_error'])}</div></form></section>
    </main>
    <footer><div class=\"container\" style=\"display:grid;gap:12px\"><nav class=\"footer-links\"><a href=\"{_locale_path(locale, '/projects')}\">{escape(copy['footer_projects'])}</a><a href=\"{_locale_path(locale, '/areas')}\">{escape(copy['footer_areas'])}</a><a href=\"{_locale_path(locale, '/investment/methodology')}\">{escape(copy['footer_investment'])}</a><a href=\"{_locale_path(locale, '/about')}\">{escape(copy['footer_about'])}</a><a href=\"{_locale_path(locale, '/contact')}\">{escape(copy['footer_contact'])}</a></nav><nav class=\"footer-links\"><a href=\"{_locale_path(locale, '/privacy')}\">{escape(copy['privacy'])}</a><a href=\"{_locale_path(locale, '/terms')}\">{escape(copy['terms'])}</a><a href=\"{_locale_path(locale, '/cookies')}\">{escape(copy['cookies'])}</a></nav></div></footer>
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
            event.preventDefault(); errorEl.hidden = true; loadingEl.hidden = false; statusEl.textContent = {copy['submitting']!r}; submitBtn.disabled = true;
            const data = Object.fromEntries(new FormData(form).entries());
            const contact = String(data.contact || '').trim();
            const intent = String(data.purpose || 'general');
            const fieldsPresent = Object.entries(data).filter(([, value]) => String(value || '').trim().length > 0).map(([key]) => key);
            const isEmail = contact.includes('@');
            try {{
              await track('home_form_submit', {{ fields_present: fieldsPresent, intent, filter_values: intent ? [intent] : [], placement: 'consult_form', cta_id: 'consult_submit' }});
              await fetch('/v1/inquiries', {{ method: 'POST', headers: {{ 'content-type': 'application/json' }}, body: JSON.stringify({{ name: data.name, email: isEmail ? contact : null, phone: isEmail ? null : contact, message: 'Budget: ' + String(data.budget || '') + '; Purpose: ' + String(data.purpose || '') + '; Timeline: ' + String(data.timeline || ''), source_page: location.pathname, intent, budget_band: String(data.budget || ''), timeline: String(data.timeline || '') }}) }});
              statusEl.textContent = {copy['submit_success']!r}; form.reset();
            }} catch {{ errorEl.hidden = false; statusEl.textContent = ''; }} finally {{ loadingEl.hidden = true; submitBtn.disabled = false; }}
          }});
        }}
      }})();
    </script>
  </body>
</html>
"""


def _render_page_shell(locale: str, *, title: str, intro: str, body: str) -> str:
    nav_items = [
        ("projects", "Projects" if locale == "en" else "โครงการ"),
        ("areas", "Areas" if locale == "en" else "ทำเล"),
        ("developers", "Developers" if locale == "en" else "ผู้พัฒนา"),
        ("insights", "Insights" if locale == "en" else "บทความ"),
        ("about", "About" if locale == "en" else "เกี่ยวกับเรา"),
        ("contact", "Contact" if locale == "en" else "ติดต่อ"),
    ]
    nav_html = "".join(
        f'<a class="btn" href="/{locale}/{path}">{escape(label)}</a>' for path, label in nav_items
    )
    return f"""<!doctype html>
<html lang="{locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(title)}</title>
    <style>
      :root{{--c1:#0f6d5a;--txt:#1f2937;--muted:#5b6472;--bg:#f6f7f9;--surface:#fff;--border:#d1d5db;--pad:16px;--max:1080px}}
      *{{box-sizing:border-box}} body{{margin:0;font-family:Segoe UI,Tahoma,"Noto Sans Thai",sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}}
      a{{color:inherit}} :focus-visible{{outline:3px solid var(--c1);outline-offset:2px}}
      .container{{max-width:var(--max);margin:0 auto;padding:24px var(--pad)}} .stack{{display:grid;gap:16px}}
      .card{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;display:grid;gap:12px}}
      .grid{{display:grid;gap:16px;grid-template-columns:1fr}} .muted{{color:var(--muted)}} .btn{{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;border:1px solid var(--c1);padding:10px 16px;background:#fff;color:var(--c1);text-decoration:none}}
      .media{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:#e5e7eb}}
      @media (min-width:768px){{.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
    </style>
  </head>
  <body>
    <main class="container stack">
            <section class="card"><div class="grid">{nav_html}</div></section>
            <a class="btn" href="/{locale}">Back to Home</a>
      <section class="card">
        <h1>{escape(title)}</h1>
        <p>{escape(intro)}</p>
      </section>
      {body}
    </main>
  </body>
</html>
"""


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
    return _localized_dict_text(getattr(prop, "title_i18n", None), locale) or str(prop.title or "").strip() or (
        "Property" if locale == "en" else "อสังหา"
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
        media = _safe_media_url(row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
        area_name = _area_name(db, row.area_id) or ("Area pending publication" if locale == "en" else "พื้นที่รอเผยแพร่")
        price_text = _format_money(row.starting_price, fallback="Pricing pending publication" if locale == "en" else "รอเผยแพร่ราคา")
        summary = _localized_dict_text(row.summary, locale) or ("Summary pending publication." if locale == "en" else "รอสรุปเนื้อหาเผยแพร่")
        updated_text = row.updated_at.strftime("%Y-%m-%d") if row.updated_at else "-"
        type_text = str(row.property_type or "").strip() or ("property" if locale == "en" else "อสังหา")
        cards.append(
            f"<article class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(row.name)}\" width=\"640\" height=\"360\" /><h2>{escape(row.name)}</h2><p class=\"muted\">{escape(area_name)} • {escape(price_text)}</p><p class=\"muted\">{escape(type_text)} • Updated {escape(updated_text)}</p><p>{escape(summary)}</p><div class=\"grid\"><a class=\"btn\" href=\"/{locale}/projects/{escape(row.slug)}\">{'View project details' if locale == 'en' else 'ดูรายละเอียดโครงการ'}</a><a class=\"btn\" href=\"/{locale}/contact?intent=consultation&project={escape(row.slug)}\">{'Request details' if locale == 'en' else 'ขอรายละเอียด'}</a></div></article>"
        )
    fallback = "Published projects are not available yet. Publish project records to populate this page." if locale == "en" else "ยังไม่มีโครงการที่เผยแพร่ โปรดเผยแพร่ข้อมูลโครงการเพื่อให้หน้านี้แสดงผล"
    body_content = "".join(cards) if cards else f"<div class=\"card\">{escape(fallback)}</div>"
    body = f"<section class=\"grid\">{body_content}</section>"
    title = "Projects" if locale == "en" else "Projects"
    intro = "Published projects from the current system with verified local media and direct consultation paths." if locale == "en" else "โครงการที่เผยแพร่จากระบบปัจจุบัน พร้อมสื่อภายในระบบและเส้นทางติดต่อที่ชัดเจน"
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_project_detail_page(locale: str, request: Request, db: Session, slug: str) -> HTMLResponse:
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
    if developer_row is not None and (developer_row.deleted_at is not None or developer_row.status != "active"):
        developer_row = None

    area_name = str(getattr(area_row, "name", "") or "").strip() or ("Area pending publication" if locale == "en" else "พื้นที่รอเผยแพร่")
    area_href = f"/{locale}/areas/{area_row.slug}" if area_row is not None and area_row.status == "published" else f"/{locale}/areas"
    developer_name = str(getattr(developer_row, "name", "") or "").strip() or ("Developer pending publication" if locale == "en" else "ผู้พัฒนารอเผยแพร่")
    developer_href = f"/{locale}/developers/{developer_row.slug}" if developer_row is not None else f"/{locale}/developers"

    summary_text = _localized_dict_text(row.summary, locale) or ("Summary pending publication." if locale == "en" else "รอสรุปเนื้อหาเผยแพร่")
    description_text = _localized_dict_text(row.description, locale) or ""
    status_text = str(row.status or "").strip() or "-"
    price_text = _format_money(row.starting_price, fallback="Pricing pending publication" if locale == "en" else "รอเผยแพร่ราคา")

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
    facts_html = "".join(f"<li>{escape(item)}</li>" for item in facts) or f"<li>{escape(copy['empty_list'])}</li>"
    highlights_html = "".join(f"<li>{escape(item)}</li>" for item in highlights) or f"<li>{escape(copy['empty_list'])}</li>"
    amenities_html = "".join(f"<li>{escape(item)}</li>" for item in amenities) or f"<li>{escape(copy['empty_list'])}</li>"

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
            f"<p class=\"muted\">{escape(f'Lat {lat:.6f}, Lng {lng:.6f}')}</p>"
            f"<a class=\"btn\" href=\"{escape(map_href)}\" rel=\"noopener\" target=\"_blank\">{escape(copy['map_link'])}</a>"
        )
    else:
        location_body = f"<p>{escape(copy['location_fallback'])}</p><a class=\"btn\" href=\"{area_href}\">{escape(area_name)}</a>"

    source_notes = row.source_notes if isinstance(row.source_notes, dict) else {}
    snapshot = row.investment_snapshot if isinstance(row.investment_snapshot, dict) else {}
    investment_source = str(snapshot.get("source") or source_notes.get("investment_source") or source_notes.get("source") or "").strip()
    investment_updated = str(snapshot.get("updated_at") or "").strip() or (row.claims_updated_at.date().isoformat() if row.claims_updated_at else "")
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
        metrics_html = "".join(f"<li><strong>{escape(label)}:</strong> {escape(value)}</li>" for label, value in investment_rows)
        if not metrics_html:
            metrics_html = f"<li>{escape(copy['empty_list'])}</li>"
        investment_body = (
            f"<p class=\"muted\">{escape(copy['source'])}: {escape(investment_source)}</p>"
            f"<p class=\"muted\">{escape(copy['updated'])}: {escape(investment_updated)}</p>"
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
            f"<article class=\"card\">"
            f"<img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(title)}\" width=\"640\" height=\"360\" loading=\"lazy\" />"
            f"<h3>{escape(title)}</h3>"
            f"<p class=\"muted\">{escape(price)}</p>"
            f"<p class=\"muted\">{escape(stats)}</p>"
            f"<a class=\"btn\" href=\"{href}\">{escape(copy['view_property'])}</a>"
            f"</article>"
        )

    buy_html = "".join(_unit_card(item) for item in buy_units[:3]) or f"<div class=\"card\">{escape(copy['availability_fallback'])}</div>"
    rent_html = "".join(_unit_card(item) for item in rent_units[:3]) or f"<div class=\"card\">{escape(copy['availability_fallback'])}</div>"

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
    related_projects = db.scalars(related_projects_query.order_by(desc(Project.updated_at)).limit(4)).all()
    related_projects_html = "".join(
        (
            f"<article class=\"card\">"
            f"<img class=\"media\" src=\"{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}\" alt=\"{escape(item.name)}\" width=\"640\" height=\"360\" loading=\"lazy\" />"
            f"<h3>{escape(item.name)}</h3>"
            f"<p class=\"muted\">{escape(_format_money(item.starting_price, fallback='-'))}</p>"
            f"<a class=\"btn\" href=\"/{locale}/projects/{escape(item.slug)}\">{escape(copy['view_project'])}</a>"
            f"</article>"
        )
        for item in related_projects
    ) or f"<div class=\"card\">{escape(copy['related_projects_fallback'])}</div>"

    related_properties: list[Property] = []
    seen_property_ids = {str(item.id) for item in unit_rows}
    if row.area_id is not None or row.developer_id is not None:
        candidates = db.scalars(
            select(Property).where(Property.status == "active").order_by(desc(Property.updated_at)).limit(60)
        ).all()
        for item in candidates:
            if str(item.id) in seen_property_ids:
                continue
            matches_area = row.area_id is not None and item.area_id == row.area_id
            matches_developer = row.developer_id is not None and item.developer_id == row.developer_id
            if not (matches_area or matches_developer):
                continue
            related_properties.append(item)
            seen_property_ids.add(str(item.id))
            if len(related_properties) == 4:
                break
    related_properties_html = "".join(_unit_card(item) for item in related_properties) or f"<div class=\"card\">{escape(copy['related_properties_fallback'])}</div>"

    faq_items = _project_faq_items(row, locale)
    faq_html = ""
    if faq_items:
        faq_rows = "".join(
            f"<details class=\"card\"><summary><strong>{escape(question)}</strong></summary><p>{escape(answer)}</p></details>"
            for question, answer in faq_items
        )
        faq_html = f"<section id=\"project-faq\" class=\"stack\"><h2>{escape(copy['faq'])}</h2>{faq_rows}</section>"

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
        f"<section id=\"project-hero\" class=\"card\"><img class=\"media\" src=\"{escape(hero_media)}\" alt=\"{escape(row.name)}\" width=\"1280\" height=\"720\" loading=\"eager\" /><h2>{escape(row.name)}</h2><p>{escape(summary_text)}</p>"
        f"<div class=\"grid\"><a class=\"btn\" href=\"/{locale}/contact?intent=consultation&project={escape(row.slug)}\">{escape(copy['request_consultation'])}</a><a class=\"btn\" href=\"/{locale}/contact?intent=viewing&project={escape(row.slug)}\">{escape(copy['book_viewing'])}</a></div></section>"
        f"<section id=\"project-gallery\" class=\"stack\"><h2>Gallery</h2>{gallery_note_html}<section class=\"grid\"><article class=\"card\"><img class=\"media\" src=\"{escape(hero_media)}\" alt=\"{escape(row.name)}\" width=\"1280\" height=\"720\" loading=\"lazy\" /></article>{gallery_extra}</section></section>"
        f"<section id=\"project-summary\" class=\"card\"><h2>{escape(copy['summary_title'])}</h2><p><strong>{escape(copy['area'])}:</strong> <a href=\"{area_href}\">{escape(area_name)}</a></p><p><strong>{escape(copy['developer'])}:</strong> <a href=\"{developer_href}\">{escape(developer_name)}</a></p><p><strong>{escape(copy['status'])}:</strong> {escape(status_text)}</p><p><strong>{escape(copy['starting_price'])}:</strong> {escape(price_text)}</p>{f'<p>{escape(description_text)}</p>' if description_text else ''}</section>"
        f"<section id=\"project-facts\" class=\"grid\"><article class=\"card\"><h2>{escape(copy['facts'])}</h2><ul>{facts_html}</ul></article><article class=\"card\"><h2>{escape(copy['highlights'])}</h2><ul>{highlights_html}</ul></article><article class=\"card\"><h2>{escape(copy['amenities'])}</h2><ul>{amenities_html}</ul></article></section>"
        f"<section id=\"project-location\" class=\"card\"><h2>{escape(copy['location'])}</h2>{location_body}</section>"
        f"<section id=\"project-investment\" class=\"card\"><h2>{escape(copy['investment'])}</h2>{investment_body}</section>"
        f"<section id=\"project-availability\" class=\"stack\"><h2>{escape(copy['availability'])}</h2><article class=\"card\"><h3>{escape(copy['buy_units'])}</h3><section class=\"grid\">{buy_html}</section></article><article class=\"card\"><h3>{escape(copy['rent_units'])}</h3><section class=\"grid\">{rent_html}</section></article></section>"
        f"<section id=\"project-related\" class=\"stack\"><article><h2>{escape(copy['related_projects'])}</h2><section class=\"grid\">{related_projects_html}</section></article><article><h2>{escape(copy['related_properties'])}</h2><section class=\"grid\">{related_properties_html}</section></article></section>"
        f"{faq_html}{schema_html}"
    )
    title = row.name
    intro = detail_intro
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_smart_finder_page(locale: str, request: Request) -> HTMLResponse:
    selected_intent = str(request.query_params.get("intent") or "").strip().lower()
    intents = [
        (
            "invest",
            "Invest" if locale == "en" else "ลงทุน",
            "Shortlist yield-focused opportunities and next-step review."
            if locale == "en"
            else "คัด shortlist สำหรับการลงทุนและวางขั้นตอนถัดไป",
        ),
        (
            "buy",
            "Buy" if locale == "en" else "ซื้อ",
            "Focus on ownership fit, budget, and legal next steps."
            if locale == "en"
            else "โฟกัสความเหมาะสม งบประมาณ และขั้นตอนกฎหมาย",
        ),
        (
            "rent",
            "Rent" if locale == "en" else "เช่า",
            "Filter for move-in timing, budget band, and lifestyle needs."
            if locale == "en"
            else "คัดตามช่วงย้ายเข้า งบประมาณ และรูปแบบการอยู่อาศัย",
        ),
        (
            "sell",
            "Sell" if locale == "en" else "ขาย",
            "Prepare pricing context, asset facts, and launch readiness."
            if locale == "en"
            else "เตรียมบริบทด้านราคา ข้อมูลทรัพย์ และความพร้อมก่อนปล่อยขาย",
        ),
    ]
    selected_copy = next((description for key, _, description in intents if key == selected_intent), None)
    selection_note = (
        selected_copy
        or (
            "Choose the path that matches your goal, then continue to consultation or published inventory."
            if locale == "en"
            else "เลือกเส้นทางที่ตรงกับเป้าหมายของคุณ แล้วไปต่อที่ consultation หรือ inventory ที่เผยแพร่"
        )
    )
    cards = "".join(
        f"<article class=\"card\"><h2>{escape(label)}</h2><p>{escape(description)}</p><a class=\"btn\" href=\"/{locale}/smart-finder?intent={escape(key)}\">{'Use this path' if locale == 'en' else 'เลือกเส้นทางนี้'}</a></article>"
        for key, label, description in intents
    )
    body = (
        f"<section class=\"card\"><h2>{'Smart Finder' if locale == 'en' else 'Smart Finder'}</h2><p>{escape(selection_note)}</p>"
        f"<div class=\"grid\"><a class=\"btn\" href=\"/{locale}#consult-title\">{'Request consultation' if locale == 'en' else 'ขอคำปรึกษา'}</a>"
        f"<a class=\"btn\" href=\"/{locale}/projects\">{'Browse published projects' if locale == 'en' else 'ดูโครงการที่เผยแพร่'}</a></div></section>"
        f"<section class=\"grid\">{cards}</section>"
    )
    title = "Smart Finder"
    intro = (
        "A guided public route that narrows the next step before consultation."
        if locale == "en"
        else "เส้นทาง public สำหรับคัด step ถัดไปก่อนเข้าสู่ consultation"
    )
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_areas_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    rows = db.scalars(select(Area).where(Area.deleted_at.is_(None), Area.status == "published").order_by(Area.name.asc()).limit(12)).all()
    project_counts = {
        str(area_id): total
        for area_id, total in db.execute(
            select(Project.area_id, func.count(Project.id))
            .where(Project.deleted_at.is_(None), Project.status == "published", Project.area_id.is_not(None))
            .group_by(Project.area_id)
        ).all()
    }
    cards = []
    for row in rows:
        media = _safe_media_url(row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
        summary = _localized_dict_text(row.summary, locale) or ("Area summary pending publication." if locale == "en" else "รอสรุปพื้นที่เผยแพร่")
        source_note = str(row.source_note or "").strip()
        source_html = f"<p class=\"muted\">{escape(source_note)}</p>" if source_note else ""
        area_projects = project_counts.get(str(row.id), 0)
        area_projects_text = f"{area_projects} published projects" if locale == "en" else f"{area_projects} โครงการที่เผยแพร่"
        cards.append(
            f"<article class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(row.name)}\" width=\"640\" height=\"360\" /><h2>{escape(row.name)}</h2><p class=\"muted\">{escape(area_projects_text)}</p><p>{escape(summary)}</p>{source_html}<a class=\"btn\" href=\"/{locale}/projects\">{'Browse projects in Pattaya' if locale == 'en' else 'ดูโครงการในพัทยา'}</a></article>"
        )
    fallback = "Published areas are not available yet. Publish area records to populate this page." if locale == "en" else "ยังไม่มีพื้นที่ที่เผยแพร่ โปรดเผยแพร่ข้อมูลทำเลเพื่อให้หน้านี้แสดงผล"
    body_content = "".join(cards) if cards else f"<div class=\"card\">{escape(fallback)}</div>"
    body = f"<section class=\"grid\">{body_content}</section>"
    title = "Areas" if locale == "en" else "Areas"
    intro = "Published area coverage from the current system with linked project inventory context." if locale == "en" else "ทำเลที่เผยแพร่จากระบบปัจจุบัน พร้อมบริบทจำนวนโครงการที่มีอยู่"
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_area_detail_page(locale: str, request: Request, db: Session, slug: str) -> HTMLResponse:
    row = db.scalar(
        select(Area).where(
            Area.deleted_at.is_(None),
            Area.status == "published",
            Area.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    summary = _localized_dict_text(row.summary, locale) or ("Area summary pending publication." if locale == "en" else "รอสรุปพื้นที่เผยแพร่")
    media = _safe_media_url(row.cover_image_url or row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
    projects = db.scalars(
        select(Project)
        .where(Project.deleted_at.is_(None), Project.status == "published", Project.area_id == row.id)
        .order_by(desc(Project.updated_at))
        .limit(8)
    ).all()
    project_cards = "".join(
        f"<article class=\"card\"><img class=\"media\" src=\"{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}\" alt=\"{escape(item.name)}\" width=\"640\" height=\"360\" loading=\"lazy\" /><h3>{escape(item.name)}</h3><p class=\"muted\">{escape(_format_money(item.starting_price, fallback='-'))}</p><a class=\"btn\" href=\"/{locale}/projects/{escape(item.slug)}\">{'View project details' if locale == 'en' else 'ดูรายละเอียดโครงการ'}</a></article>"
        for item in projects
    ) or (
        f"<div class=\"card\">{'No published projects are linked to this area yet.' if locale == 'en' else 'ยังไม่มีโครงการที่เผยแพร่เชื่อมกับทำเลนี้'}</div>"
    )

    map_center = row.map_center if isinstance(row.map_center, dict) else {}
    lat_raw = map_center.get("lat") or map_center.get("latitude")
    lng_raw = map_center.get("lng") or map_center.get("longitude")
    try:
        lat = float(lat_raw) if lat_raw is not None else None
    except (TypeError, ValueError):
        lat = None
    try:
        lng = float(lng_raw) if lng_raw is not None else None
    except (TypeError, ValueError):
        lng = None
    if lat is not None and lng is not None:
        map_html = (
            f"<p class=\"muted\">{escape(f'Lat {lat:.6f}, Lng {lng:.6f}')}</p>"
            f"<a class=\"btn\" href=\"https://maps.google.com/?q={lat:.6f},{lng:.6f}\" target=\"_blank\" rel=\"noopener\">{'Open map context' if locale == 'en' else 'เปิดบริบทแผนที่'}</a>"
        )
    else:
        map_html = f"<p>{'Map coordinates are pending publication.' if locale == 'en' else 'ยังไม่มีพิกัดแผนที่ที่เผยแพร่'}</p>"

    body = (
        f"<section class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(row.name)}\" width=\"1280\" height=\"720\" loading=\"lazy\" /><h2>{escape(row.name)}</h2><p>{escape(summary)}</p></section>"
        f"<section class=\"card\"><h2>{'Location context' if locale == 'en' else 'บริบททำเล'}</h2>{map_html}</section>"
        f"<section class=\"stack\"><h2>{'Published projects in this area' if locale == 'en' else 'โครงการที่เผยแพร่ในทำเลนี้'}</h2><section class=\"grid\">{project_cards}</section></section>"
    )
    title = row.name
    intro = summary
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_developers_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    rows = db.scalars(
        select(Developer)
        .where(Developer.deleted_at.is_(None), Developer.status == "active")
        .order_by(Developer.name.asc())
        .limit(20)
    ).all()
    cards = []
    for row in rows:
        media = _safe_media_url(row.cover_image_url or row.logo_url, _DEFAULT_MEDIA_FALLBACK, request=request)
        profile = _localized_dict_text(row.profile or row.summary, locale) or (
            "Developer profile pending publication." if locale == "en" else "รอเผยแพร่โปรไฟล์ผู้พัฒนา"
        )
        cards.append(
            f"<article class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(row.name)}\" width=\"640\" height=\"360\" loading=\"lazy\" /><h2>{escape(row.name)}</h2><p>{escape(profile)}</p><a class=\"btn\" href=\"/{locale}/developers/{escape(row.slug)}\">{'View developer' if locale == 'en' else 'ดูรายละเอียดผู้พัฒนา'}</a></article>"
        )
    fallback = "No active developers are published yet." if locale == "en" else "ยังไม่มีผู้พัฒนาที่เผยแพร่"
    body_content = "".join(cards) if cards else f"<div class=\"card\">{escape(fallback)}</div>"
    body = f"<section class=\"grid\">{body_content}</section>"
    title = "Developers"
    intro = "Published developer profiles and linked project context." if locale == "en" else "โปรไฟล์ผู้พัฒนาที่เผยแพร่และบริบทโครงการที่เกี่ยวข้อง"
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_developer_detail_page(locale: str, request: Request, db: Session, slug: str) -> HTMLResponse:
    row = db.scalar(
        select(Developer).where(
            Developer.deleted_at.is_(None),
            Developer.status == "active",
            Developer.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")

    media = _safe_media_url(row.cover_image_url or row.logo_url, _DEFAULT_MEDIA_FALLBACK, request=request)
    profile = _localized_dict_text(row.profile or row.summary, locale) or (
        "Developer profile pending publication." if locale == "en" else "รอเผยแพร่โปรไฟล์ผู้พัฒนา"
    )
    projects = db.scalars(
        select(Project)
        .where(Project.deleted_at.is_(None), Project.status == "published", Project.developer_id == row.id)
        .order_by(desc(Project.updated_at))
        .limit(8)
    ).all()
    project_cards = "".join(
        f"<article class=\"card\"><img class=\"media\" src=\"{escape(_safe_media_url(item.cover_image_url or item.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request))}\" alt=\"{escape(item.name)}\" width=\"640\" height=\"360\" loading=\"lazy\" /><h3>{escape(item.name)}</h3><p class=\"muted\">{escape(_format_money(item.starting_price, fallback='-'))}</p><a class=\"btn\" href=\"/{locale}/projects/{escape(item.slug)}\">{'View project details' if locale == 'en' else 'ดูรายละเอียดโครงการ'}</a></article>"
        for item in projects
    ) or (
        f"<div class=\"card\">{'No published projects are linked to this developer yet.' if locale == 'en' else 'ยังไม่มีโครงการที่เผยแพร่เชื่อมกับผู้พัฒนารายนี้'}</div>"
    )
    website_text = str(row.website or "").strip()
    website_html = (
        f'<a class="btn" href="{escape(website_text)}" target="_blank" rel="noopener">{escape(website_text)}</a>'
        if website_text
        else ""
    )

    body = (
        f"<section class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(row.name)}\" width=\"1280\" height=\"720\" loading=\"lazy\" /><h2>{escape(row.name)}</h2><p>{escape(profile)}</p>{website_html}</section>"
        f"<section class=\"stack\"><h2>{'Published projects by this developer' if locale == 'en' else 'โครงการที่เผยแพร่ของผู้พัฒนานี้'}</h2><section class=\"grid\">{project_cards}</section></section>"
    )
    title = row.name
    intro = profile
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


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


def _render_property_detail_page(locale: str, request: Request, db: Session, property_ref: str) -> HTMLResponse:
    row = _property_or_404(db, property_ref)

    title = _property_title_for_locale(row, locale)
    description = _property_description_for_locale(row, locale)
    media = _property_media_path(row, request=request)
    area_row = db.get(Area, row.area_id) if row.area_id else None
    if area_row is not None and area_row.deleted_at is not None:
        area_row = None
    developer_row = db.get(Developer, row.developer_id) if row.developer_id else None
    if developer_row is not None and (developer_row.deleted_at is not None or developer_row.status != "active"):
        developer_row = None
    project_row = db.get(Project, row.project_id) if row.project_id else None
    if project_row is not None and (project_row.deleted_at is not None or project_row.status != "published"):
        project_row = None

    area_href = f"/{locale}/areas/{area_row.slug}" if area_row is not None and area_row.status == "published" else f"/{locale}/areas"
    developer_href = f"/{locale}/developers/{developer_row.slug}" if developer_row is not None else f"/{locale}/developers"
    project_href = f"/{locale}/projects/{project_row.slug}" if project_row is not None else f"/{locale}/projects"
    price_text = _format_money(row.price, fallback="-")
    stats_text = " • ".join(_property_stats(row)) or "-"

    body = (
        f"<section class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(title)}\" width=\"1280\" height=\"720\" loading=\"lazy\" /><h2>{escape(title)}</h2><p class=\"muted\">{escape(price_text)} • {escape(stats_text)}</p>{f'<p>{escape(description)}</p>' if description else ''}</section>"
        f"<section class=\"card\"><p><strong>{'Area' if locale == 'en' else 'ทำเล'}:</strong> <a href=\"{area_href}\">{escape(str(getattr(area_row, 'name', '') or '-'))}</a></p><p><strong>{'Developer' if locale == 'en' else 'ผู้พัฒนา'}:</strong> <a href=\"{developer_href}\">{escape(str(getattr(developer_row, 'name', '') or '-'))}</a></p><p><strong>{'Project' if locale == 'en' else 'โครงการ'}:</strong> <a href=\"{project_href}\">{escape(str(getattr(project_row, 'name', '') or '-'))}</a></p><a class=\"btn\" href=\"/{locale}/contact?intent=viewing&property={escape(_property_ref_for_route(row))}\">{'Book Viewing' if locale == 'en' else 'จองนัดเข้าชม'}</a></section>"
    )
    intro = description or title
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_insights_page(locale: str, request: Request, db: Session) -> HTMLResponse:
    rows = db.scalars(select(Article).where(Article.deleted_at.is_(None), Article.status == "published", Article.category.in_(["guide", "blog"])).order_by(desc(Article.published_at), desc(Article.created_at)).limit(12)).all()
    cards = []
    for row in rows:
        title = _localized_dict_text(row.title, locale) or row.slug
        excerpt = _localized_dict_text(row.excerpt, locale) or ("Excerpt pending publication." if locale == "en" else "รอเผยแพร่บทสรุป")
        media = _safe_media_url(row.hero_image_url, _DEFAULT_MEDIA_FALLBACK, request=request)
        published = row.published_at.strftime("%Y-%m-%d") if row.published_at is not None else "-"
        cards.append(
            f"<article class=\"card\"><img class=\"media\" src=\"{escape(media)}\" alt=\"{escape(title)}\" width=\"640\" height=\"360\" /><h2>{escape(title)}</h2><p class=\"muted\">{escape(row.category)} • {escape(published)}</p><p>{escape(excerpt)}</p><p class=\"muted\">Slug: {escape(row.slug)}</p><a class=\"btn\" href=\"/{locale}/contact\">{'Talk to an advisor' if locale == 'en' else 'คุยกับที่ปรึกษา'}</a></article>"
        )
    fallback = "Published insights are not available yet. Publish guide or blog content to populate this page." if locale == "en" else "ยังไม่มีบทความที่เผยแพร่ โปรดเผยแพร่ guide หรือ blog เพื่อให้หน้านี้แสดงผล"
    body_content = "".join(cards) if cards else f"<div class=\"card\">{escape(fallback)}</div>"
    body = f"<section class=\"grid\">{body_content}</section>"
    title = "Market Insights" if locale == "en" else "Market Insights"
    intro = "Published guides and articles from the current system, mapped to consultable next steps." if locale == "en" else "ไกด์และบทความที่เผยแพร่จากระบบปัจจุบัน พร้อมทางไปสู่ขั้นตอนปรึกษา"
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _format_text_block(value: str) -> str:
    return "<br />".join(escape(part) for part in str(value or "").splitlines()) or ""


def _company_page(locale: str, slug: str, title: str, fallback: str, db: Session) -> HTMLResponse:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    content = str(row.content if row is not None else fallback).strip() or fallback
    meta = str(row.meta_description if row is not None else "").strip()
    body = f"<section class=\"card\"><p>{escape(meta)}</p><div>{_format_text_block(content)}</div><a class=\"btn\" href=\"/{locale}/contact\">{'Contact our team' if locale == 'en' else 'ติดต่อทีมงาน'}</a></section>"
    return HTMLResponse(_render_page_shell(locale, title=title, intro=meta or title, body=body))


def _render_about_page(locale: str, db: Session) -> HTMLResponse:
    about_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "about"))
    process_row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "how-we-work"))
    team_rows = db.scalars(
        select(TeamMember)
        .where(TeamMember.deleted_at.is_(None), TeamMember.status == "active")
        .order_by(TeamMember.display_order.asc(), TeamMember.name.asc())
        .limit(12)
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
        photo = str(row.photo_url or "").strip()
        photo_html = f'<img class="media" src="{escape(photo)}" alt="{escape(row.name)}" width="640" height="360" />' if photo.startswith("/media/") else ""
        team_cards.append(
            f"<article class=\"card\">{photo_html}<h3>{escape(row.name)}</h3><p class=\"muted\">{escape(row.role_title)}</p><p>{escape(_localized_dict_text(row.bio, locale) or '')}</p></article>"
        )
    team_body = "".join(team_cards)
    if not team_body:
        team_fallback = "Team profiles are not published yet. TODO: publish approved team bios." if locale == "en" else "ยังไม่มีโปรไฟล์ทีมที่เผยแพร่ TODO: เพิ่มประวัติทีมที่อนุมัติแล้ว"
        team_body = f"<div class=\"card\">{escape(team_fallback)}</div>"
    reviews_body = "".join(
        f"<article class=\"card\"><h3>{escape(row.attribution_name or ('Client review' if locale == 'en' else 'รีวิวลูกค้า'))}</h3><p><strong>{escape(row.quote)}</strong></p><p class=\"muted\">{escape(str(row.context or row.persona or row.intent or '').strip())}</p></article>"
        for row in review_rows
    )
    if not reviews_body:
        review_fallback = "Approved testimonials are not published yet. Publish testimonial records to populate this page." if locale == "en" else "ยังไม่มี testimonial ที่เผยแพร่ โปรดเผยแพร่ testimonial เพื่อให้หน้านี้แสดงผล"
        reviews_body = f"<div class=\"card\">{escape(review_fallback)}</div>"
    work_fallback = "Video proof appears when mirrored local media is published through approved workflow." if locale == "en" else "ส่วนวิดีโอจะแสดงเมื่อมีการเผยแพร่ local media ผ่าน workflow ที่อนุมัติแล้ว"
    body = (
        f"<section id=\"about-section\" class=\"card\"><h2>{escape(about_row.title if about_row is not None else ('About' if locale == 'en' else 'About'))}</h2><div>{_format_text_block(about_content)}</div></section>"
        f"<section id=\"process-section\" class=\"card\"><h2>{'How we work' if locale == 'en' else 'How we work'}</h2><div>{_format_text_block(process_content)}</div></section>"
        f"<section id=\"team-section\" class=\"grid\"><h2>{'Team' if locale == 'en' else 'Team'}</h2>{team_body}</section>"
        f"<section id=\"client-reviews\" class=\"grid\"><h2>{'Client Reviews' if locale == 'en' else 'Client Reviews'}</h2>{reviews_body}</section>"
        f"<section id=\"work-proof\" class=\"card\"><h2>{'See Our Work' if locale == 'en' else 'See Our Work'}</h2><p>{escape(work_fallback)}</p><a class=\"btn\" href=\"/{locale}\">{'Back to Home' if locale == 'en' else 'กลับหน้าแรก'}</a></section>"
    )
    title = "About" if locale == "en" else "About"
    intro = str(about_row.meta_description if about_row is not None else "").strip() or ("Published company overview and supporting content." if locale == "en" else "ข้อมูลบริษัทและคอนเทนต์ที่เผยแพร่แล้ว")
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


def _render_contact_page(locale: str, db: Session) -> HTMLResponse:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "contact"))
    content = str(row.content if row is not None else "").strip()
    if not content:
        content = (
            "Contact page details are not published yet. Use the consultation form on Home for the current workflow."
            if locale == "en"
            else "ยังไม่มีรายละเอียดหน้า Contact ที่เผยแพร่ ใช้ฟอร์มปรึกษาบนหน้า Home สำหรับ workflow ปัจจุบัน"
        )
    meta = str(row.meta_description if row is not None else "").strip()
    body = (
        f"<section class=\"card\"><div>{_format_text_block(content)}</div><a class=\"btn\" href=\"/{locale}#consult-title\">"
        f"{'Go to consultation form' if locale == 'en' else 'ไปที่ฟอร์มปรึกษา'}</a></section>"
    )
    title = row.title if row is not None else ("Contact" if locale == "en" else "Contact")
    intro = meta or ("Current contact workflow and next-step guidance." if locale == "en" else "ช่องทางติดต่อและขั้นตอนถัดไปในปัจจุบัน")
    return HTMLResponse(_render_page_shell(locale, title=title, intro=intro, body=body))


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


@router.get("/en/projects", response_class=HTMLResponse)
@router.get("/th/projects", response_class=HTMLResponse)
def render_projects(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_projects_page(_request_locale(request), request, db)


@router.get("/en/projects/{slug}", response_class=HTMLResponse)
@router.get("/th/projects/{slug}", response_class=HTMLResponse)
def render_project_detail(slug: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_project_detail_page(_request_locale(request), request, db, slug)


@router.get("/en/smart-finder", response_class=HTMLResponse)
@router.get("/th/smart-finder", response_class=HTMLResponse)
def render_smart_finder(request: Request) -> HTMLResponse:
    return _render_smart_finder_page(_request_locale(request), request)


@router.get("/en/areas", response_class=HTMLResponse)
@router.get("/th/areas", response_class=HTMLResponse)
def render_areas(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_areas_page(_request_locale(request), request, db)


@router.get("/en/areas/{slug}", response_class=HTMLResponse)
@router.get("/th/areas/{slug}", response_class=HTMLResponse)
def render_area_detail(slug: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_area_detail_page(_request_locale(request), request, db, slug)


@router.get("/en/developers", response_class=HTMLResponse)
@router.get("/th/developers", response_class=HTMLResponse)
def render_developers(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_developers_page(_request_locale(request), request, db)


@router.get("/en/developers/{slug}", response_class=HTMLResponse)
@router.get("/th/developers/{slug}", response_class=HTMLResponse)
def render_developer_detail(slug: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_developer_detail_page(_request_locale(request), request, db, slug)


@router.get("/en/property/{property_ref}", response_class=HTMLResponse)
@router.get("/th/property/{property_ref}", response_class=HTMLResponse)
def render_property_detail(property_ref: str, request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_property_detail_page(_request_locale(request), request, db, property_ref)


@router.get("/en/insights", response_class=HTMLResponse)
@router.get("/th/insights", response_class=HTMLResponse)
def render_insights(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_insights_page(_request_locale(request), request, db)


@router.get("/en/about", response_class=HTMLResponse)
@router.get("/th/about", response_class=HTMLResponse)
def render_about(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_about_page(_request_locale(request), db)


@router.get("/en/contact", response_class=HTMLResponse)
@router.get("/th/contact", response_class=HTMLResponse)
def render_contact(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    return _render_contact_page(_request_locale(request), db)


@router.get("/en/privacy", response_class=HTMLResponse)
@router.get("/th/privacy", response_class=HTMLResponse)
def render_privacy(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = "Privacy content is not published yet. TODO: publish approved privacy details." if locale == "en" else "ยังไม่มีเนื้อหา Privacy ที่เผยแพร่ TODO: เพิ่มรายละเอียด privacy ที่อนุมัติแล้ว"
    return _company_page(locale, "privacy", "Privacy Policy", fallback, db)


@router.get("/en/terms", response_class=HTMLResponse)
@router.get("/th/terms", response_class=HTMLResponse)
def render_terms(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = "Terms content is not published yet. TODO: publish approved terms." if locale == "en" else "ยังไม่มีเนื้อหา Terms ที่เผยแพร่ TODO: เพิ่มข้อกำหนดที่อนุมัติแล้ว"
    return _company_page(locale, "terms", "Terms", fallback, db)


@router.get("/en/cookies", response_class=HTMLResponse)
@router.get("/th/cookies", response_class=HTMLResponse)
def render_cookies(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = "Cookies content is not published yet. TODO: publish approved cookie details." if locale == "en" else "ยังไม่มีเนื้อหา Cookies ที่เผยแพร่ TODO: เพิ่มรายละเอียด cookies ที่อนุมัติแล้ว"
    return _company_page(locale, "cookies", "Cookies", fallback, db)


@router.get("/en/investment/methodology", response_class=HTMLResponse)
@router.get("/th/investment/methodology", response_class=HTMLResponse)
def render_investment_methodology(request: Request, db: Session = Depends(get_db)) -> HTMLResponse:
    locale = _request_locale(request)
    fallback = "Investment methodology is not published yet. TODO: publish approved selection criteria and source notes." if locale == "en" else "ยังไม่มี methodology การลงทุนที่เผยแพร่ TODO: เพิ่มเกณฑ์คัดเลือกและ source notes ที่อนุมัติแล้ว"
    title = "Investment Methodology" if locale == "en" else "Investment Methodology"
    return _company_page(locale, "investment-methodology", title, fallback, db)
