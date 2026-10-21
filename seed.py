# ========================================
# SEED-SKRIPT
# ========================================
# Legt Startdaten an: Kategorien + Admin
# Sicher dank ON CONFLICT DO NOTHING

import psycopg2
import bcrypt

# Verbindung zur PostgreSQL-DB
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