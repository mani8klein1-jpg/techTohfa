import psycopg2
import bcrypt

# Verbindung zur DB
conn = psycopg2.connect(
    host="db", database="techstore",
    user="techstore", password="techstore123"
)
cur = conn.cursor()

# Neues Passwort
neues_passwort = "admin123"
email = "admin@techtohfa.de"

# Hash generieren
hash = bcrypt.hashpw(neues_passwort.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# In DB speichern
cur.execute("UPDATE benutzer SET passwort_hash = %s WHERE email = %s", (hash, email))
conn.commit()

print(f"✅ Passwort für {email} auf '{neues_passwort}' geändert.")

# Prüfen
cur.execute("SELECT id, email, ist_admin FROM benutzer WHERE email = %s", (email,))
print(cur.fetchone())

conn.close()