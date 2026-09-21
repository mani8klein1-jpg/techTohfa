# ========================================
# TESTS FÜR /warenkorb
# ========================================
# Warenkorb: Hinzufügen, Menge ändern, Löschen

# ========================================
# WARENKORB ABRUFEN
# ========================================

def test_warenkorb_leer(client, test_benutzer):
    """Leerer Warenkorb"""
    response = client.get(
        "/warenkorb",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    assert response.json() == []


def test_warenkorb_ohne_token(client):
    """Ohne Token → 401"""
    response = client.get("/warenkorb")
    
    assert response.status_code == 401


# ========================================
# PRODUKT HINZUFÜGEN
# ========================================

def test_warenkorb_hinzufuegen(client, test_benutzer, test_produkt):
    """Produkt in den Warenkorb legen"""
    response = client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["produkt_id"] == test_produkt.id
    assert daten["menge"] == 1


def test_warenkorb_menge_erhoehen(client, test_benutzer, test_produkt):
    """Gleiches Produkt 2× hinzufügen → Menge 2"""
    # 1× hinzufügen
    client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Nochmal hinzufügen
    response = client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    assert response.json()["menge"] == 2


def test_warenkorb_produkt_nicht_gefunden(client, test_benutzer):
    """Unbekanntes Produkt → 404"""
    response = client.post(
        "/warenkorb",
        json={"produkt_id": 99999, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 404
    assert "nicht gefunden" in response.json()["detail"].lower()


# ========================================
# MENGE ÄNDERN
# ========================================

def test_warenkorb_menge_aendern(client, test_benutzer, test_produkt):
    """Menge ändern via PUT"""
    # Produkt hinzufügen
    response = client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    eintrag_id = response.json()["id"]
    
    # Menge auf 5 ändern
    response = client.put(
        f"/warenkorb/{eintrag_id}",
        json={"menge": 5},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    assert response.json()["menge"] == 5


def test_warenkorb_menge_null_loescht_eintrag(client, test_benutzer, test_produkt):
    """Menge 0 → Eintrag wird gelöscht"""
    # Produkt hinzufügen
    response = client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    eintrag_id = response.json()["id"]
    
    # Menge auf 0 setzen
    client.put(
        f"/warenkorb/{eintrag_id}",
        json={"menge": 0},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    # Warenkorb sollte leer sein
    response = client.get(
        "/warenkorb",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    assert response.json() == []


# ========================================
# PRODUKT LÖSCHEN
# ========================================

def test_warenkorb_loeschen(client, test_benutzer, test_produkt):
    """Produkt aus dem Warenkorb entfernen"""
    # Produkt hinzufügen
    response = client.post(
        "/warenkorb",
        json={"produkt_id": test_produkt.id, "menge": 1},
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    eintrag_id = response.json()["id"]
    
    # Löschen
    response = client.delete(
        f"/warenkorb/{eintrag_id}",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    
    # Warenkorb sollte leer sein
    response = client.get(
        "/warenkorb",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    assert response.json() == []