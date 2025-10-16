import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.routes import vocab as vocab_routes
from app.routes import vocablist as vocablist_routes
from app.routes import user as user_routes
from app import auth


# Create an in-memory SQLite test database and session factory
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Ensure tables are created on the test engine
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def client():
    # Import app only after configuring any required overrides
    from app.main import app

    # Set predictable auth secrets for tests
    auth.SECRET_KEY = "test-secret"
    auth.ALGORITHM = "HS256"
    auth.ACCESS_TOKEN_EXPIRE_MINUTES = 60

    # Override dependency-injected DB sessions on all routers
    app.dependency_overrides[vocab_routes.get_db] = override_get_db
    app.dependency_overrides[vocablist_routes.get_db] = override_get_db
    app.dependency_overrides[user_routes.get_db] = override_get_db

    return TestClient(app)


@pytest.fixture()
def auth_headers_user(client):
    # Register and login a default user, return Authorization header
    username = "alice"
    password = "secret123"
    client.post("/register/", json={"username": username, "password": password})
    token_resp = client.post(
        "/login/",
        data={"username": username, "password": password},
        headers={"content-type": "application/x-www-form-urlencoded"},
    )
    access_token = token_resp.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture()
def auth_headers_other_user(client):
    username = "bob"
    password = "secret123"
    client.post("/register/", json={"username": username, "password": password})
    token_resp = client.post(
        "/login/",
        data={"username": username, "password": password},
        headers={"content-type": "application/x-www-form-urlencoded"},
    )
    access_token = token_resp.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


