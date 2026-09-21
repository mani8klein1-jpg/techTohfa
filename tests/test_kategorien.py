# ========================================
# TESTS FÜR /kategorien
# ========================================
# Kategorien abrufen und anlegen

# ========================================
# KATEGORIEN ABRUFEN
# ========================================

def test_kategorien_leer(client):
    """Keine Kategorien → leere Liste"""
    response = client.get("/kategorien")
    
    assert response.status_code == 200
    assert response.json() == []


def test_kategorien_anzeigen(client, test_kategorie):
    """Kategorien werden angezeigt"""
    response = client.get("/kategorien")
    
    assert response.status_code == 200
    daten = response.json()
    assert len(daten) == 1
    assert daten[0]["name"] == "Test-Kategorie"
    assert daten[0]["beschreibung"] == "Für Tests"


# ========================================
# KATEGORIE ANLEGEN
# ========================================

def test_kategorie_anlegen(client):
    """Neue Kategorie anlegen"""
    response = client.post("/kategorien", json={
        "name": "Neue Kategorie",
        "beschreibung": "Beschreibung der Kategorie"
    })
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["name"] == "Neue Kategorie"
    assert daten["beschreibung"] == "Beschreibung der Kategorie"
    assert "id" in daten