from typing import Any


def test_create_list_and_entry_with_translations(client, auth_headers_user):
    # Create list
    r = client.post("/vocablist/", json={"name": "Spanisch"}, headers=auth_headers_user)
    assert r.status_code == 200, r.text
    vocab_list = r.json()

    # Create entry with two translations
    entry_payload = {
        "term": "Haus",
        "source_language": "de",
        "vocab_list_id": vocab_list["id"],
        "translations": [
            {"text": "house", "language": "en"},
            {"text": "casa", "language": "es"},
        ],
    }
    r = client.post("/vocab/entries", json=entry_payload, headers=auth_headers_user)
    assert r.status_code == 200, r.text
    entry = r.json()
    assert entry["term"] == "Haus"
    assert entry["source_language"] == "de"
    assert len(entry["translations"]) == 2


def test_list_entries_only_own_lists(client, auth_headers_user, auth_headers_other_user):
    # user1 creates a list and an entry
    r = client.post("/vocablist/", json={"name": "User1-List"}, headers=auth_headers_user)
    l1 = r.json()
    r = client.post(
        "/vocab/entries",
        json={"term": "Baum", "vocab_list_id": l1["id"]},
        headers=auth_headers_user,
    )
    assert r.status_code == 200

    # user2 creates a list and an entry
    r = client.post("/vocablist/", json={"name": "User2-List"}, headers=auth_headers_other_user)
    l2 = r.json()
    r = client.post(
        "/vocab/entries",
        json={"term": "Wasser", "vocab_list_id": l2["id"]},
        headers=auth_headers_other_user,
    )
    assert r.status_code == 200

    # user1 lists entries – must not see user2's entries
    r = client.get("/vocab/entries", headers=auth_headers_user)
    assert r.status_code == 200
    entries_user1 = r.json()
    assert all(e["vocab_list_id"] == l1["id"] for e in entries_user1)


def test_update_and_delete_entry(client, auth_headers_user):
    # Prepare list and entry
    l = client.post("/vocablist/", json={"name": "UpdateList"}, headers=auth_headers_user).json()
    e = client.post(
        "/vocab/entries",
        json={"term": "alt", "source_language": "de", "vocab_list_id": l["id"]},
        headers=auth_headers_user,
    ).json()

    # Update term
    r = client.put(f"/vocab/entries/{e['id']}", json={"term": "neu"}, headers=auth_headers_user)
    assert r.status_code == 200
    assert r.json()["term"] == "neu"

    # Delete entry
    r = client.delete(f"/vocab/entries/{e['id']}", headers=auth_headers_user)
    assert r.status_code == 200
    # Ensure gone
    r = client.get(f"/vocab/entries/{e['id']}", headers=auth_headers_user)
    assert r.status_code == 404


def test_add_update_delete_translation(client, auth_headers_user):
    # Prepare list and entry
    l = client.post("/vocablist/", json={"name": "TransList"}, headers=auth_headers_user).json()
    e = client.post(
        "/vocab/entries",
        json={"term": "Katze", "vocab_list_id": l["id"]},
        headers=auth_headers_user,
    ).json()

    # Add translation
    r = client.post(
        f"/vocab/entries/{e['id']}/translations",
        json={"text": "cat", "language": "en"},
        headers=auth_headers_user,
    )
    assert r.status_code == 200
    t = r.json()
    assert t["text"] == "cat"
    assert t["language"] == "en"

    # Update translation
    r = client.put(
        f"/vocab/translations/{t['id']}",
        json={"text": "kitty", "language": "en"},
        headers=auth_headers_user,
    )
    assert r.status_code == 200
    assert r.json()["text"] == "kitty"

    # Delete translation
    r = client.delete(f"/vocab/translations/{t['id']}", headers=auth_headers_user)
    assert r.status_code == 200

