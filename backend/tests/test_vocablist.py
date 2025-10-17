def test_create_vocablist(client, auth_headers):
    data = {
        "name": "Medizinische Fachbegriffe",
        "description": "PTA Schule",
        "columns": [
            {"name": "Fachbegriff", "column_type": "custom", "position": 0, "is_primary": True},
            {"name": "Lateinisch", "column_type": "custom", "position": 1},
            {"name": "Definition", "column_type": "definition", "position": 2},
            {"name": "Anwendung", "column_type": "example", "position": 3},
        ],
    }

    response = client.post("/vocablist/", json=data, headers=auth_headers)
    assert response.status_code in (200, 201), response.text
    result = response.json()
    assert result["name"] == data["name"]


def test_get_all_vocablists(client, auth_headers):
    response = client.get("/vocablist/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_vocablist_by_id(client, auth_headers):
    response = client.get("/vocablist/1", headers=auth_headers)
    assert response.status_code in (200, 404)


def test_update_vocablist(client, auth_headers):
    update = {"name": "Neue Liste", "description": "Aktualisiert"}
    response = client.put("/vocablist/1", json=update, headers=auth_headers)
    assert response.status_code in (200, 404)


def test_delete_vocablist(client, auth_headers):
    response = client.delete("/vocablist/1", headers=auth_headers)
    assert response.status_code in (200, 404)
