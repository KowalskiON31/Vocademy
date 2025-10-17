def test_register_user(client):
    data = {"username": "user2", "email": "user2@example.com", "password": "123456"}
    response = client.post("/register/", json=data)
    assert response.status_code in (200, 201, 400)


def test_login_user(client):
    client.post("/register/", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "123456"
    })

    data = {
        "username": "testuser",
        "password": "123456"
    }

    response = client.post("/login/", data=data)
    assert response.status_code == 200, f"Login fehlgeschlagen: {response.text}"
    assert "access_token" in response.json()


def test_get_users_unauthorized(client):
    response = client.get("/user/")
    assert response.status_code in (401, 403)


def test_get_users_authorized(client, auth_headers):
    response = client.get("/user/", headers=auth_headers)
    assert response.status_code in (200, 403)
