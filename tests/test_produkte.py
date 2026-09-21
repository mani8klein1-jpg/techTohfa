# ========================================
# TESTS FÜR /produkte
# ========================================

def test_get_produkte_leer(client):
    """Leere Produktliste"""
    response = client.get("/produkte")
    assert response.status_code == 200
    assert response.json() == []


def test_get_produkte_mit_produkt(client, test_produkt):
    """Produktliste mit einem Produkt"""
    response = client.get("/produkte")
    assert response.status_code == 200
    daten = response.json()
    assert len(daten) == 1
    assert daten[0]["name"] == "Test-Produkt"
    assert daten[0]["preis"] == 99.99


def test_get_produkt_by_id(client, test_produkt):
    """Einzelnes Produkt abrufen"""
    response = client.get(f"/produkte/{test_produkt.id}")
    assert response.status_code == 200
    daten = response.json()
    assert daten["name"] == "Test-Produkt"
    assert daten["lagerbestand"] == 10


def test_get_produkt_nicht_gefunden(client):
    """Produkt mit falscher ID → 404"""
    response = client.get("/produkte/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Produkt nicht gefunden"


def test_create_produkt_als_admin(client, test_benutzer, test_kategorie, db_session):
    """Produkt anlegen als Admin"""
    # Benutzer zum Admin machen
    from models import Benutzer
    benutzer = db_session.query(Benutzer).filter(Benutzer.email == "test@example.com").first()
    benutzer.ist_admin = True
    db_session.commit()
    
    # Produkt anlegen
    response = client.post(
        "/produkte",
        json={
            "name": "Neues Produkt",
            "beschreibung": "Beschreibung",
            "preis": 49.99,
            "lagerbestand": 5,
            "bild_url": "bilder/neu.png",
            "kategorie_id": test_kategorie.id
        },
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["name"] == "Neues Produkt"
    assert daten["preis"] == 49.99


def test_create_produkt_als_kunde(client, test_benutzer, test_kategorie):
    """Produkt anlegen als normaler Kunde → 403"""
    response = client.post(
        "/produkte",
        json={
            "name": "Hack",
            "beschreibung": "Sollte nicht funktionieren",
            "preis": 0.01,
            "lagerbestand": 999,
            "bild_url": "",
            "kategorie_id": test_kategorie.id
        },
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 403
    assert "Nur Admins" in response.json()["detail"]


def test_create_produkt_ohne_token(client, test_kategorie):
    """Produkt anlegen ohne Token → 401"""
    response = client.post(
        "/produkte",
        json={
            "name": "Produkt",
            "beschreibung": "Test",
            "preis": 10.00,
            "lagerbestand": 1,
            "bild_url": "",
            "kategorie_id": test_kategorie.id
        }
    )
    
    assert response.status_code == 401