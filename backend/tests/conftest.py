import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session")
def client():
    """Erzeugt einen globalen TestClient für alle Tests."""
    return TestClient(app)


@pytest.fixture(scope="session")
def auth_headers(client):
    """Registriert & loggt einen Testnutzer ein und gibt Auth-Header zurück."""
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "123456"
    }

    # Benutzer registrieren (falls bereits existiert, ignorieren)
    client.post("/register/", json=register_data)

    # Login durchführen
    login_data = {"username": "testuser", "password": "123456"}
    response = client.post("/login/", data=login_data)

    assert response.status_code == 200, f"Login fehlgeschlagen: {response.text}"

    token = response.json().get("access_token")
    assert token, "Kein Token erhalten!"

    return {"Authorization": f"Bearer {token}"}
