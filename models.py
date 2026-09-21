# ========================================
# DATENBANK-MODELLE
# ========================================
# Diese Datei definiert alle Tabellen für
# unseren Shop. Jede Klasse ist eine Tabelle.

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# ========================================
# KATEGORIEN
# ========================================
# Hier speichern wir die Kategorien (z.B. Laptops, Monitore)

class Kategorie(Base):
    __tablename__ = "kategorien"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=True)

    # Beziehung: Eine Kategorie hat viele Produkte
    produkte = relationship("Produkt", back_populates="kategorie")


# ========================================
# PRODUKTE
# ========================================
# Hier speichern wir alle Produkte im Shop

class Produkt(Base):
    __tablename__ = "produkte"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=True)
    preis = Column(Float, nullable=False)
    lagerbestand = Column(Integer, default=0)
    bild_url = Column(String, nullable=True)
    kategorie_id = Column(Integer, ForeignKey("kategorien.id"))

    # Beziehung: Ein Produkt gehört zu einer Kategorie
    kategorie = relationship("Kategorie", back_populates="produkte")


# ========================================
# BENUTZER
# ========================================
# Hier speichern wir die Benutzer des Shops

class Benutzer(Base):
    __tablename__ = "benutzer"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    passwort_hash = Column(String, nullable=False)
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    ist_admin = Column(Boolean, default=False)   # ← NEU


# ========================================
# WARENKORB
# ========================================
# Hier speichern wir, was jeder Benutzer im Warenkorb hat

class Warenkorb(Base):
    __tablename__ = "warenkorb"

    id = Column(Integer, primary_key=True, index=True)
    benutzer_id = Column(Integer, ForeignKey("benutzer.id"))
    produkt_id = Column(Integer, ForeignKey("produkte.id"))
    menge = Column(Integer, default=1)


# ========================================
# BESTELLUNGEN
# ========================================
# Hier speichern wir die Bestellungen

class Bestellung(Base):
    __tablename__ = "bestellungen"

    id = Column(Integer, primary_key=True, index=True)
    benutzer_id = Column(Integer, ForeignKey("benutzer.id"))
    gesamtpreis = Column(Float, nullable=False)
    status = Column(String, default="offen")
    erstellt_am = Column(DateTime, default=datetime.now)

    # Beziehung: Eine Bestellung hat viele Positionen
    positionen = relationship("Bestellposition", back_populates="bestellung")


# ========================================
# BESTELLPOSITIONEN
# ========================================
# Hier speichern wir die einzelnen Produkte einer Bestellung

class Bestellposition(Base):
    __tablename__ = "bestellpositionen"

    id = Column(Integer, primary_key=True, index=True)
    bestellung_id = Column(Integer, ForeignKey("bestellungen.id"))
    produkt_id = Column(Integer, ForeignKey("produkte.id"))
    menge = Column(Integer, nullable=False)
    preis = Column(Float, nullable=False)

    # Beziehung: Eine Position gehört zu einer Bestellung
    bestellung = relationship("Bestellung", back_populates="positionen")