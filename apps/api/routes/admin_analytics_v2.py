from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import (
    AnalyticsEvent,
    Inquiry,
    MarketplaceItem,
    Property,
    SellerSubmission,
    User,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics/summary")
async def analytics_summary(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    now = datetime.now(timezone.utc).isoformat()

    # Inquiries: funnel/status distribution.
    status_rows = db.execute(select(Inquiry.status, func.count()).group_by(Inquiry.status)).all()
    inquiries_by_status = {str(status): int(count) for status, count in status_rows}

    # Leads by source (utm_source).
    src_rows = db.execute(
        select(Inquiry.utm_source, func.count())
        .where(Inquiry.utm_source.is_not(None))
        .group_by(Inquiry.utm_source)
        .order_by(func.count().desc())
        .limit(10)
    ).all()
    leads_by_source = [
        {"source": str(src), "count": int(count)} for src, count in src_rows if src is not None
    ]

    # Advisor performance: assigned vs closed counts.
    assigned_rows = db.execute(
        select(Inquiry.advisor_user_id, func.count())
        .where(Inquiry.advisor_user_id.is_not(None))
        .group_by(Inquiry.advisor_user_id)
    ).all()
    closed_rows = db.execute(
        select(Inquiry.advisor_user_id, func.count())
        .where(Inquiry.advisor_user_id.is_not(None), Inquiry.status == "closed")
        .group_by(Inquiry.advisor_user_id)
    ).all()

    assigned_map = {uid: int(count) for uid, count in assigned_rows if uid is not None}
    closed_map = {uid: int(count) for uid, count in closed_rows if uid is not None}

    advisor_metrics = []
    for uid, assigned_count in assigned_map.items():
        closed_count = closed_map.get(uid, 0)
        ratio = (closed_count / assigned_count) if assigned_count else 0.0
        advisor_metrics.append(
            {
                "advisor_user_id": str(uid),
                "assigned": assigned_count,
                "closed": closed_count,
                "conversion_ratio": round(ratio, 4),
            }
        )
    advisor_metrics.sort(key=lambda r: (r["conversion_ratio"], r["assigned"]), reverse=True)

    # Avg days to close (best-effort using updated_at/created_at).
    closed = db.scalars(
        select(Inquiry)
        .where(Inquiry.status == "closed")
        .order_by(Inquiry.updated_at.desc())
        .limit(500)
    ).all()
    days = []
    for i in closed:
        if i.created_at and i.updated_at:
            delta = i.updated_at - i.created_at
            days.append(delta.total_seconds() / 86400)
    avg_days_to_close = round(sum(days) / len(days), 2) if days else None

    # Top projects by inquiry count (join via property_id -> properties.project_id).
    top_projects = db.execute(
        select(Property.project_id, func.count())
        .join(Inquiry, Inquiry.property_id == Property.id)
        .where(Property.project_id.is_not(None))
        .group_by(Property.project_id)
        .order_by(func.count().desc())
        .limit(10)
    ).all()
    top_projects_rows = [
        {"project_id": str(pid), "inquiries": int(count)}
        for pid, count in top_projects
        if pid is not None
    ]

    # Marketplace: published listings count.
    marketplace_published = db.scalar(
        select(func.count())
        .select_from(MarketplaceItem)
        .where(MarketplaceItem.status == "published")
    )

    # Marketplace engagement (best-effort): count analytics events for marketplace pages.
    marketplace_events = db.scalar(
        select(func.count())
        .select_from(AnalyticsEvent)
        .where(AnalyticsEvent.page.is_not(None), AnalyticsEvent.page.like("%/marketplace%"))
    )

    # Seller conversion.
    seller_total = db.scalar(select(func.count()).select_from(SellerSubmission))
    seller_approved = db.scalar(
        select(func.count())
        .select_from(SellerSubmission)
        .where(SellerSubmission.status == "approved")
    )
    seller_conversion_ratio = (
        round((seller_approved or 0) / (seller_total or 1), 4) if seller_total else 0.0
    )

    return {
        "generated_at": now,
        "inquiries_by_status": inquiries_by_status,
        "leads_by_source": leads_by_source,
        "advisor_metrics": advisor_metrics[:20],
        "avg_days_to_close": avg_days_to_close,
        "top_projects": top_projects_rows,
        "marketplace": {
            "published_items": int(marketplace_published or 0),
            "engagement_events": int(marketplace_events or 0),
        },
        "seller": {
            "total_submissions": int(seller_total or 0),
            "approved_submissions": int(seller_approved or 0),
            "conversion_ratio": seller_conversion_ratio,
        },
    }
