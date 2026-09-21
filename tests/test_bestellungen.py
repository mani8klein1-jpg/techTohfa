# ========================================
# TESTS FÜR /bestellungen
# ========================================
# Bestellungen aufgeben, anzeigen, löschen

# ========================================
# BESTELLUNG AUFGEBEN
# ========================================

def test_bestellung_leerer_warenkorb(client, test_benutzer):
    """Leerer Warenkorb → 400"""
    response = client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 400
    assert "leer" in response.json()["detail"].lower()


def test_bestellung_ohne_token(client):
    """Ohne Token → 401"""
    response = client.post("/bestellungen")
    
    assert response.status_code == 401


def test_bestellung_erfolgreich(client, test_benutzer, test_produkt):
    """Bestellung aufgeben"""
    # Produkt in den Warenkorb
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 2},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Bestellen
    response = client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["gesamtpreis"] == 2 * 99.99     # 2 × 99.99 = 199.98
    assert daten["status"] == "offen"
    assert "id" in daten


def test_bestellung_leert_warenkorb(client, test_benutzer, test_produkt):
    """Nach Bestellung ist der Warenkorb leer"""
    # Produkt in den Warenkorb
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Bestellen
    client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Warenkorb prüfen
    response = client.get(
        "/warenkorb",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.json() == []


def test_bestellung_reduziert_lager(client, test_benutzer, test_produkt):
    """Lagerbestand wird reduziert"""
    # Vorher: 10 auf Lager
    assert test_produkt.lagerbestand == 10
    
    # 3× in den Warenkorb
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 3},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Bestellen
    client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Produkt prüfen
    response = client.get(f"/produkte/{test_produkt.id}")
    
    assert response.json()["lagerbestand"] == 7   # 10 - 3 = 7


# ========================================
# BESTELLUNGEN ANZEIGEN
# ========================================

def test_bestellungen_leer(client, test_benutzer):
    """Keine Bestellungen → leere Liste"""
    response = client.get(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    assert response.json() == []


def test_bestellungen_anzeigen(client, test_benutzer, test_produkt):
    """Bestellungen werden angezeigt"""
    # 2× bestellen
    for _ in range(2):
        client.post(
            "/warenkorb",
            json={"produkt_id": test_produkt.id, "menge": 1},
            headers={"Authorization": f"Bearer {test_benutzer['token']}"}
        )
        client.post(
            "/bestellungen",
            headers={"Authorization": f"Bearer {test_benutzer['token']}"}
        )
    
    # Bestellungen abrufen
    response = client.get(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert len(daten) == 2


def test_bestellung_mit_positionen(client, test_benutzer, test_produkt):
    """Bestellung mit Positionen abrufen"""
    # Produkt in den Warenkorb
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 2},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Bestellen
    bestellung = client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    ).json()
    
    # Einzelne Bestellung abrufen
    response = client.get(
        f"/bestellungen/{bestellung['id']}",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert "positionen" in daten
    assert len(daten["positionen"]) == 1
    assert daten["positionen"][0]["menge"] == 2


# ========================================
# BESTELLUNG LÖSCHEN
# ========================================

def test_bestellung_loeschen(client, test_benutzer, test_produkt):
    """Bestellung löschen"""
    # Produkt in den Warenkorb + bestellen
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    bestellung = client.post(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    ).json()
    
    # Löschen
    response = client.delete(
        f"/bestellungen/{bestellung['id']}",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    
    # Prüfen: Bestellung ist weg
    response = client.get(
        "/bestellungen",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    assert response.json() == []