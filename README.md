# TechTOHFA – E-Commerce-Shop

Ein vollständiger, full-stack E-Commerce-Shop, der von der Datenbank bis zum Frontend komplett selbst entwickelt wurde. Dieses Projekt dient als Portfolio-Projekt, um moderne Backend- und Frontend-Entwicklung zu demonstrieren.

## 🚀 Live-Demo

Die Anwendung ist live auf Render gehostet:
*   **Frontend:** [https://techtohfa-frontend.onrender.com](https://techtohfa-frontend.onrender.com)
*   **Backend (API):** [https://techtohfa-backend.onrender.com](https://techtohfa-backend.onrender.com)
*   **API-Dokumentation (Swagger):** [https://techtohfa-backend.onrender.com/docs](https://techtohfa-backend.onrender.com/docs)

*Hinweis: Da die Anwendung auf dem kostenlosen Render-Tier läuft, kann der erste Aufruf bis zu 50 Sekunden dauern, da der Server aus dem Ruhezustand aufwacht.*

## ✨ Features

*   **Produktverwaltung:** Anzeige von Produkten mit Bildern, Beschreibungen, Preisen und Lagerbeständen.
*   **Kategorien:** Filterung von Produkten nach Kategorien.
*   **Benutzerverwaltung:** Sichere Registrierung und Login mit JWT (JSON Web Tokens).
*   **Rollen-System:** Unterscheidung zwischen normalen Kunden und Administratoren.
*   **Admin-Bereich:** Erstellen, Bearbeiten und Löschen von Produkten (nur für Admins).
*   **Warenkorb:** Hinzufügen, Ändern der Menge und Entfernen von Produkten.
*   **Checkout:** Eingabe der Lieferadresse mit Validierung (z.B. 5-stellige PLZ).
*   **Bestellungen:** Bestellübersicht für Kunden und Reduzierung des Lagerbestands nach dem Kauf.
*   **Responsive Design:** Optimierte Darstellung für Desktop und Mobilgeräte (inkl. Hamburger-Menü).

## 🛠️ Tech-Stack

### Backend
*   **Python / FastAPI:** Modernes, schnelles Web-Framework.
*   **SQLAlchemy:** ORM für die Datenbank-Interaktion.
*   **PostgreSQL:** Relationale Datenbank (gehostet auf Render).
*   **JWT (python-jose):** Sichere Authentifizierung.
*   **bcrypt:** Passwort-Hashing.
*   **Pydantic:** Datenvalidierung.

### Frontend
*   **HTML5 / CSS3:** Struktur und responsives Styling.
*   **Vanilla JavaScript:** Interaktive Logik und Fetch-API für die Kommunikation mit dem Backend.
*   **Kein Framework:** Zeigt ein tiefes Verständnis der Web-Grundlagen.

### DevOps & Testing
*   **Docker & Docker Compose:** Containerisierung für lokale Entwicklung und Deployment.
*   **GitHub Actions:** CI/CD-Pipeline, die bei jedem Push automatisch Tests ausführt.
*   **Pytest:** Automatisierte Tests für die Backend-Routen mit über 90 % Code-Coverage.

## 💻 Lokale Installation

So startest du das Projekt auf deinem eigenen Rechner:

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/mani8klein1-jpg/techTohfa.git
    cd techTohfa