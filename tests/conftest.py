from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from packages.core.database import init_db


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    init_db()
    with TestClient(app) as test_client:
        yield test_client
