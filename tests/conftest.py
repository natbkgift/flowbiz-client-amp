import os

import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = "./test_flowbiz.db"

# Ensure the app uses a test DB before importing settings/engine.
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

# Avoid PyJWT InsecureKeyLengthWarning during tests.
# RFC 7518 recommends ≥ 32 bytes for HS256.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-32-bytes-minimum!!")

# Ensure a clean slate before the FastAPI app creates tables.
try:
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
except OSError:
    pass


@pytest.fixture
def client() -> TestClient:
    from apps.api.main import app

    with TestClient(app) as test_client:
        yield test_client
