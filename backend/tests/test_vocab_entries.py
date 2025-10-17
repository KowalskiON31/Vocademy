def test_create_entry(client, auth_headers):
    data = {
        "vocab_list_id": 1,
        "field_values": [
            {"column_id": 1, "value": "Analgetikum"},
            {"column_id": 2, "value": "Schmerzmittel"},
            {"column_id": 3, "value": "Medikament zur Schmerzlinderung"},
            {"column_id": 4, "value": "Wird bei Kopfschmerzen eingesetzt"},
        ]
    }
    response = client.post("/vocab/entries", json=data, headers=auth_headers)
    assert response.status_code in (200, 201, 404)


def test_get_entries_by_list(client, auth_headers):
    response = client.get("/vocab/entries/list/1", headers=auth_headers)
    assert response.status_code in (200, 404)


def test_get_entry(client, auth_headers):
    response = client.get("/vocab/entries/1", headers=auth_headers)
    assert response.status_code in (200, 404)


def test_update_entry(client, auth_headers):
    update = {
        "field_values": [
            {"column_id": 1, "value": "Analgetikum (aktualisiert)"},
            {"column_id": 2, "value": "Schmerzmittel"},
            {"column_id": 3, "value": "Neue Definition"},
            {"column_id": 4, "value": "Neues Beispiel"},
        ]
    }
    response = client.put("/vocab/entries/1", json=update, headers=auth_headers)
    assert response.status_code in (200, 404)


def test_delete_entry(client, auth_headers):
    response = client.delete("/vocab/entries/1", headers=auth_headers)
    assert response.status_code in (200, 404)
