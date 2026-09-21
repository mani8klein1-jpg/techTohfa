# ========================================
# DATENBANK-VERBINDUNG
# ========================================
# Diese Datei kümmert sich um die Verbindung
# zur Datenbank. Wir nutzen SQLite für die
# Entwicklung.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Lade die Umgebungsvariablen aus der .env-Datei
load_dotenv()

# Die Datenbank-URL aus der .env-Datei holen
DATABASE_URL = os.getenv("DATABASE_URL")

# Der Engine ist die "Maschine", die die Datenbank steuert
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Die SessionLocal ist eine "Sitzung", mit der wir Abfragen machen
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Die Base ist die "Basis", von der alle Tabellen erben
Base = declarative_base()