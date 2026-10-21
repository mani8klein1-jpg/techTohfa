# ========================================
# SEED-SKRIPT
# ========================================
# Legt Startdaten an: Kategorien + Admin
# Sicher dank ON CONFLICT DO NOTHING

import os
import psycopg2
import bcrypt
from dotenv import load_dotenv

# Lade .env (für lokal)
load_dotenv()

# Prüfe, ob wir auf Render sind (DATABASE_URL existiert)
db_url = os.getenv("DATABASE_URL")

if db_url:
    # Auf Render: Nutze die DATABASE_URL
    # Wichtig: Render gibt manchmal postgres:// statt postgresql:// aus
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    conn = psycopg2.connect(db_url)
else:
    # Lokal (Docker): Nutze die festen Zugangsdaten
    conn = psycopg2.connect(
        host="db",
        database="techstore",
        user="techstore",
        password="techstore123"
    )

cur = conn.cursor()

# ========================================
# 1. KATEGORIEN
# ========================================

kategorien = [
    ("Zubehör", "Mäuse, Tastaturen, Kabel"),
    ("Monitore", "Bildschirme und Displays"),
    ("Mäuse", "Gaming- und Büromäuse"),
    ("Kabel", "USB, HDMI, DisplayPort"),
    ("Tastaturen", "Mechanische und Membran-Tastaturen"),
    ("Laptops", "Tragbare Computer und Notebooks"),
]

print("Kategorien anlegen...")
for name, beschreibung in kategorien:
    cur.execute("""
        INSERT INTO kategorien (name, beschreibung)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """, (name, beschreibung))
    print(f"  {name}: OK")

# ========================================
# 2. ADMIN-BENUTZER
# ========================================

print("\nAdmin anlegen...")
passwort_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

cur.execute("""
    INSERT INTO benutzer (name, email, passwort_hash, ist_admin)
    VALUES (%s, %s, %s, TRUE)
    ON CONFLICT (email) DO NOTHING
""", ("Admin", "admin@techstore.de", passwort_hash))
print("  admin@techstore.de: OK (Passwort: admin123)")

# ========================================
# 3. SPEICHERN
# ========================================

conn.commit()

# Prüfen
print("\n--- Aktuelle Daten ---")
cur.execute("SELECT id, name FROM kategorien ORDER BY id")
for row in cur.fetchall():
    print(f"  Kategorie: {row}")

cur.execute("SELECT id, email, ist_admin FROM benutzer ORDER BY id")
for row in cur.fetchall():
    print(f"  Benutzer: {row}")

cur.close()
conn.close()
print("\n✅ Seed fertig!")