# ========================================
# TESTS FÜR /auth
# ========================================
# Login, Registrierung, Token-Prüfung

# ========================================
# REGISTRIERUNG
# ========================================

def test_registrieren(client):
    """Neuen Benutzer anlegen"""
    response = client.post("/registrieren", json={
        "name": "Neuer User",
        "email": "neu@example.com",
        "passwort": "sicher123"
    })
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["name"] == "Neuer User"
    assert daten["email"] == "neu@example.com"
    assert "id" in daten
    assert "passwort" not in daten          # Passwort darf NICHT zurückkommen
    assert "passwort_hash" not in daten     # Hash darf NICHT zurückkommen


def test_registrieren_doppelte_email(client, test_benutzer):
    """Gleiche E-Mail → 400"""
    response = client.post("/registrieren", json={
        "name": "Zweiter User",
        "email": "test@example.com",         # existiert schon
        "passwort": "sicher123"
    })
    
    assert response.status_code == 400
    assert "bereits registriert" in response.json()["detail"]


# ========================================
# LOGIN
# ========================================

def test_login_erfolgreich(client, test_benutzer):
    """Login mit gültigen Daten"""
    response = client.post("/login", data={
        "username": "test@example.com",
        "password": "test123"
    })
    
    assert response.status_code == 200
    daten = response.json()
    assert "access_token" in daten
    assert daten["token_type"] == "bearer"
    assert len(daten["access_token"]) > 20     # Token ist lang


def test_login_falsches_passwort(client, test_benutzer):
    """Falsches Passwort → 401"""
    response = client.post("/login", data={
        "username": "test@example.com",
        "password": "FALSCH"
    })
    
    assert response.status_code == 401
    assert "falsch" in response.json()["detail"].lower()


def test_login_unbekannte_email(client):
    """Unbekannte E-Mail → 401"""
    response = client.post("/login", data={
        "username": "unbekannt@example.com",
        "password": "egal123"
    })
    
    assert response.status_code == 401


# ========================================
# BENUTZER-INFO
# ========================================

def test_get_benutzer_ich(client, test_benutzer):
    """Aktueller Benutzer abrufen"""
    response = client.get(
        "/benutzer/ich",
        headers={"Authorization": f"Bearer {test_benutzer['token']}"}
    )
    
    assert response.status_code == 200
    daten = response.json()
    assert daten["email"] == "test@example.com"
    assert daten["name"] == "Testuser"
    assert daten["ist_admin"] == False       # Standard: kein Admin


def test_get_benutzer_ich_ohne_token(client):
    """Ohne Token → 401"""
    response = client.get("/benutzer/ich")
    
    assert response.status_code == 401


def test_get_benutzer_ich_mit_ungueltigem_token(client):
    """Ungültiger Token → 401"""
    response = client.get(
        "/benutzer/ich",
        headers={"Authorization": "Bearer ungueltiger.token.hier"}
    )
    
    assert response.status_code == 401