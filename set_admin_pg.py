import psycopg2

conn = psycopg2.connect(
    host="db",
    database="techstore",
    user="techstore",
    password="techstore123"
)
cur = conn.cursor()

# Admin setzen
cur.execute("UPDATE benutzer SET ist_admin = TRUE WHERE email = 'admin@techtohfa.de'")
conn.commit()

# Prüfen
print("Alle Benutzer:")
cur.execute("SELECT id, email, ist_admin FROM benutzer")
for row in cur.fetchall():
    print(f"  {row}")

conn.close()
print("\nFertig!")