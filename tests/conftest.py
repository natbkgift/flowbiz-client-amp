from __future__ import annotations

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from apps.api.main import app
from packages.core.database import init_db


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    init_db()
    with TestClient(app) as test_client:
        yield test_client
