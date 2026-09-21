# ========================================
# PYTEST-KONFIGURATION
# ========================================
# Fixtures für alle Tests

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db

# ========================================
# TEST-DATENBANK (SQLite im Speicher)
# ========================================

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ========================================
# FIXTURES
# ========================================

@pytest.fixture(scope="function")
def db_session():
    """Erstellt für jeden Test eine frische Datenbank"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient mit Test-DB"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_benutzer(client):
    """Erstellt einen Test-Benutzer und gibt Token zurück"""
    # Registrieren
    client.post("/registrieren", json={
        "name": "Testuser",
        "email": "test@example.com",
        "passwort": "test123"
    })
    
    # Login
    response = client.post("/login", data={
        "username": "test@example.com",
        "password": "test123"
    })
    
    token = response.json()["access_token"]
    return {"email": "test@example.com", "password": "test123", "token": token}


@pytest.fixture
def test_kategorie(db_session):
    """Erstellt eine Test-Kategorie"""
    from models import Kategorie
    kategorie = Kategorie(name="Test-Kategorie", beschreibung="Für Tests")
    db_session.add(kategorie)
    db_session.commit()
    db_session.refresh(kategorie)
    return kategorie


@pytest.fixture
def test_produkt(db_session, test_kategorie):
    """Erstellt ein Test-Produkt"""
    from models import Produkt
    produkt = Produkt(
        name="Test-Produkt",
        beschreibung="Ein Produkt für Tests",
        preis=99.99,
        lagerbestand=10,
        bild_url="bilder/test.png",
        kategorie_id=test_kategorie.id
    )
    db_session.add(produkt)
    db_session.commit()
    db_session.refresh(produkt)
    return produkt