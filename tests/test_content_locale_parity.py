from __future__ import annotations

from datetime import datetime, timezone

from ops.validate_content_locale_parity import collect_locale_parity_issues
from packages.core.database import SessionLocal, init_db
from packages.core.models import Article


def _insert_article(*, slug: str, title: dict, body: dict, status: str = "published") -> None:
    with SessionLocal() as db:
        row = Article(
            slug=slug,
            category="blog",
            status=status,
            title=title,
            excerpt={"en": "excerpt en", "th": "excerpt th"},
            body_md=body,
            published_at=datetime.now(timezone.utc),
        )
        db.add(row)
        db.commit()


def setup_function() -> None:
    init_db()
    with SessionLocal() as db:
        db.query(Article).delete()
        db.commit()


def test_content_locale_parity_detects_missing_th() -> None:
    _insert_article(
        slug="content-locale-missing-th",
        title={"en": "EN title", "th": "TH title"},
        body={"en": "EN body", "th": ""},
    )

    issues = collect_locale_parity_issues()
    assert issues
    assert any(issue.slug == "content-locale-missing-th" for issue in issues)


def test_content_locale_parity_passes_when_complete() -> None:
    _insert_article(
        slug="content-locale-complete",
        title={"en": "EN title", "th": "TH title"},
        body={"en": "EN body", "th": "TH body"},
    )

    issues = collect_locale_parity_issues()
    assert issues == []
