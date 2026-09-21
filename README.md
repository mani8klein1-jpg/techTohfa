# TechTohfa – E-Commerce-Shop

Ein vollständiger Online-Shop mit FastAPI (Backend) und Vanilla JavaScript (Frontend).

## Features

- **Produkte** – Anzeige mit Bildern, Beschreibung, Preis, Lagerbestand
- **Kategorien-Filter** – Produkte nach Kategorie filtern
- **Benutzerverwaltung** – Registrierung, Login (JWT), Dropdown-Menü
- **Warenkorb** – Produkte hinzufügen, Menge ändern (+/−), entfernen
- **Checkout** – Lieferadresse eingeben (Vorname, Nachname, Straße, PLZ, Ort), Bestellung aufgeben
- **Bestellungen** – Übersicht aller Bestellungen des Benutzers
- **PLZ-Validierung** – Nur 5 Ziffern erlaubt

## Technologien

### Backend
- **FastAPI** – Web-Framework
- **SQLAlchemy** – ORM für Datenbank
- **SQLite** – Datenbank
- **JWT** (python-jose) – Authentifizierung
- **bcrypt** – Passwort-Hashing
- **Pydantic** – Datenvalidierung
- **Uvicorn** – ASGI-Server

### Frontend
- **HTML5** – Struktur
- **CSS3** – Styling (Responsive)
- **Vanilla JavaScript** – Logik (kein Framework)
- **Fetch API** – Kommunikation mit Backend

## Projektstruktur


Was in der README steht
Die README enthält genau das, was du gerade zitiert hast:

markdown
### Terminal 1: Backend

```powershell
cd C:\techstore
python main.py
Erwartete Ausgabe:

text
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
text

## Warum das wichtig ist

**In 3 Monaten** hast du vergessen:

- Wie starte ich den Server?
- Was muss ich eingeben?
- Wie sieht die erwartete Ausgabe aus?

**Dann öffnest du die `README.md`** – und siehst:
Terminal 1: cd C:\techstore → python main.py

Terminal 2: cd C:\techstore\frontend → python -m http.server 5500

Browser: http://127.0.0.1:5500/index.html

text

**Problem gelöst in 10 Sekunden.**

## Die komplette README nochmal

Boss, **hier die komplette README als eine Datei** – kopiere sie einfach in `C:\techstore\README.md`:

```markdown
# TechStore – E-Commerce-Shop

Ein vollständiger Online-Shop mit FastAPI (Backend) und Vanilla JavaScript (Frontend).

## Features

- **Produkte** – Anzeige mit Bildern, Beschreibung, Preis, Lagerbestand
- **Kategorien-Filter** – Produkte nach Kategorie filtern
- **Benutzerverwaltung** – Registrierung, Login (JWT), Dropdown-Menü
- **Warenkorb** – Produkte hinzufügen, Menge ändern (+/−), entfernen
- **Checkout** – Lieferadresse eingeben (Vorname, Nachname, Straße, PLZ, Ort)
- **Bestellungen** – Übersicht aller Bestellungen des Benutzers
- **PLZ-Validierung** – Nur 5 Ziffern erlaubt

## Technologien

### Backend
- **FastAPI** – Web-Framework
- **SQLAlchemy** – ORM
- **SQLite** – Datenbank
- **JWT** (python-jose) – Authentifizierung
- **bcrypt** – Passwort-Hashing
- **Pydantic** – Datenvalidierung
- **Uvicorn** – ASGI-Server

### Frontend
- **HTML5**, **CSS3**, **Vanilla JavaScript**
- **Fetch API** – Kommunikation mit Backend

## Projektstruktur
C:\techstore
├── main.py # FastAPI-Hauptdatei
├── database.py # Datenbank-Verbindung
├── models.py # SQLAlchemy-Modelle
├── schemas.py # Pydantic-Schemas
├── auth.py # JWT + Passwort-Hashing
├── requirements.txt # Python-Abhängigkeiten
├── .env # Umgebungsvariablen (nicht in Git!)
├── techstore.db # SQLite-Datenbank
└── frontend
├── index.html # Startseite
├── produkt.html # Produktdetail
├── warenkorb.html # Warenkorb
├── checkout.html # Kasse
├── login.html # Login
├── bestellungen.html
├── css\style.css
├── js*.js
└── bilder\

text

## Installation

### Voraussetzungen
- Python 3.10+
- Moderner Browser

### 1. In den Projektordner wechseln

```powershell
cd C:\techstore
2. Abhängigkeiten installieren
powershell
pip install -r requirements.txt
Falls requirements.txt fehlt:

powershell
pip install fastapi uvicorn sqlalchemy pydantic python-jose[cryptography] bcrypt python-dotenv python-multipart
3. .env-Datei erstellen
C:\techstore\.env:

text
DATABASE_URL=sqlite:///./techstore.db
SECRET_KEY=dein-geheimer-schluessel-hier-aendern
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
Wichtig: SECRET_KEY durch einen eigenen Wert ersetzen!

Starten
Du brauchst zwei Terminals – beide müssen laufen.

Terminal 1: Backend
powershell
cd C:\techstore
python main.py
Erwartete Ausgabe:

text
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Terminal 2: Frontend
powershell
cd C:\techstore\frontend
python -m http.server 5500
Erwartete Ausgabe:

text
Serving HTTP on 0.0.0.0 port 5500 ...
Browser öffnen
text
http://127.0.0.1:5500/index.html
Wichtige URLs
Zweck	URL
Shop (Startseite)	http://127.0.0.1:5500/index.html
API-Dokumentation (Swagger)	http://127.0.0.1:8000/docs
API-Root	http://127.0.0.1:8000/
API-Routen
Öffentlich
GET / – API-Status

GET /produkte – Alle Produkte

GET /produkte/{id} – Einzelnes Produkt

GET /kategorien – Alle Kategorien

POST /registrieren – Neuen Benutzer anlegen

POST /login – Login (liefert JWT)

Geschützt (Token nötig)
GET /benutzer/ich – Aktueller Benutzer

GET /warenkorb – Warenkorb

POST /warenkorb – Produkt hinzufügen

PUT /warenkorb/{id} – Menge ändern

DELETE /warenkorb/{id} – Eintrag löschen

POST /bestellungen – Bestellung aufgeben

GET /bestellungen – Alle Bestellungen

GET /bestellungen/{id} – Einzelne Bestellung

Bekannte Probleme & Lösungen
„database is locked"
Ursache: DB Browser for SQLite ist offen.
Lösung: DB Browser schließen, Server neu starten.

„ERR_CONNECTION_REFUSED"
Ursache: Backend-Server läuft nicht.
Lösung: python main.py starten.

Änderungen an JS/CSS werden nicht sichtbar
Ursache: Browser-Cache.
Lösung: F12 → Network → „Disable cache" ✅ → STRG + SHIFT + R

Token läuft zu schnell ab
Lösung: In .env → ACCESS_TOKEN_EXPIRE_MINUTES=10080 (7 Tage)

CORS-Fehler
Lösung: In main.py muss CORSMiddleware mit allow_origins=["*"] und allow_credentials=False konfiguriert sein.

Entwicklung
Neue Route hinzufügen
main.py – Route definieren

schemas.py – Pydantic-Schema (falls nötig)

api.js – Frontend-Funktion

Server neu starten

Neue Seite hinzufügen
frontend/neue-seite.html – HTML

frontend/js/neue-seite.js – JavaScript

api.js – bei Bedarf erweitern

Navigation in allen HTML-Dateien erweitern

Sicherheitshinweise
SECRET_KEY niemals in Git committen

.env in .gitignore aufnehmen

HTTPS in Produktion verwenden (nicht HTTP)

Passwörter werden mit bcrypt gehasht

JWT-Token haben 7 Tage Laufzeit (in Produktion kürzer + Refresh-Token)

Lizenz
Privates Lernprojekt – keine Lizenz.

Autor
Erstellt als Lernprojekt für FastAPI + Vanilla JS.

text

## Zusammenfassung

| Frage | Antwort |
|---|---|
| Kommt die Startanleitung in die README? | ✅ Ja, genau das ist der Sinn |
| Warum? | Damit du in 3 Monaten noch weißt, wie es geht |
| Wo steht sie? | Unter „## Starten" |
| Format | Markdown (`.md`) |

## Was ich von dir brauche

Boss, kopiere die **komplette README** in `C:\techstore\README.md` – und dann:

1. **Öffne `README.md` in VS Code**
2. **`STRG + SHIFT + V`** (Vorschau)
3. **Sieht alles gut aus?**
