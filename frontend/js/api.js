// ========================================
// API-KONFIGURATION
// ========================================
// Diese Datei kümmert sich um die Kommunikation
// mit dem Backend.

const API_URL = 'http://127.0.0.1:8000';

// ========================================
// TOKEN-VERWALTUNG
// ========================================

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function isLoggedIn() {
    return getToken() !== null;
}

// ========================================
// API-AUFRUFE
// ========================================

// Alle Produkte abrufen
async function getProdukte() {
    const response = await fetch(`${API_URL}/produkte`);
    return await response.json();
}

// Einzelnes Produkt abrufen
async function getProdukt(id) {
    const response = await fetch(`${API_URL}/produkte/${id}`);
    return await response.json();
}

// Warenkorb abrufen
async function getWarenkorb() {
    const response = await fetch(`${API_URL}/warenkorb`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Nicht eingeloggt');
    return await response.json();
}

// Produkt in den Warenkorb legen
async function addToWarenkorb(produktId, menge = 1) {
    const response = await fetch(`${API_URL}/warenkorb`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ produkt_id: produktId, menge: menge })
    });
    if (!response.ok) throw new Error('Fehler beim Hinzufügen');
    return await response.json();
}

// Produkt aus dem Warenkorb entfernen
async function removeFromWarenkorb(eintragId) {
    const response = await fetch(`${API_URL}/warenkorb/${eintragId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Fehler beim Entfernen');
    return await response.json();
}

// Bestellung aufgeben
async function createBestellung() {
    const response = await fetch(`${API_URL}/bestellungen`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Fehler beim Bestellen');
    return await response.json();
}

// Login
async function login(email, passwort) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', passwort);
    
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
    if (!response.ok) throw new Error('E-Mail oder Passwort falsch');
    return await response.json();
}

// Registrieren
async function registrieren(name, email, passwort) {
    const response = await fetch(`${API_URL}/registrieren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, passwort })
    });
    if (!response.ok) throw new Error('E-Mail bereits registriert');
    return await response.json();
}

// Alle Bestellungen des Benutzers abrufen
async function getBestellungen() {
    const response = await fetch(`${API_URL}/bestellungen`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Nicht eingeloggt');
    return await response.json();
}

// Einzelne Bestellung abrufen (mit Positionen)
async function getBestellung(bestellungId) {
    const response = await fetch(`${API_URL}/bestellungen/${bestellungId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Bestellung nicht gefunden');
    return await response.json();
}

// Aktuellen Benutzer abrufen
async function getBenutzer() {
    const response = await fetch(`${API_URL}/benutzer/ich`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Nicht eingeloggt');
    return await response.json();
}

// Alle Kategorien abrufen
async function getKategorien() {
    const response = await fetch(`${API_URL}/kategorien`);
    if (!response.ok) throw new Error('Fehler beim Laden der Kategorien');
    return await response.json();
}

// Menge eines Warenkorb-Eintrags ändern
async function updateWarenkorbMenge(eintragId, menge) {
    const response = await fetch(`${API_URL}/warenkorb/${eintragId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ menge: menge })
    });

    if (!response.ok) throw new Error('Fehler beim Ändern der Menge');
    return await response.json();
}

// Produkte suchen
async function sucheProdukte(query) {
    const alleProdukte = await getProdukte();
    const q = query.toLowerCase().trim();
    
    return alleProdukte.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.beschreibung && p.beschreibung.toLowerCase().includes(q))
    );
}

// Globale Suchfunktion (funktioniert auf allen Seiten)
function sucheAusfuehrenGlobal() {
    const input = document.getElementById('suchInput');
    if (!input) return;
    
    const query = input.value.trim();
    
    // Auf index.html → direkt filtern
    if (typeof sucheAusfuehren === 'function') {
        sucheAusfuehren();
    } else {
        // Auf anderen Seiten → zur Startseite
        if (query) {
            window.location.href = `index.html?suche=${encodeURIComponent(query)}`;
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Enter-Taste global
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('suchInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sucheAusfuehrenGlobal();
            }
        });
    }
});

// Bestellung löschen
async function deleteBestellung(bestellungId) {
    const response = await fetch(`${API_URL}/bestellungen/${bestellungId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Fehler beim Löschen');
    return await response.json();
}

// ========================================
// ADMIN-FUNKTIONEN
// ========================================

// Produkt anlegen (nur Admin)
async function createProdukt(daten) {
    const response = await fetch(`${API_URL}/produkte`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(daten)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Fehler beim Anlegen');
    }
    return await response.json();
}

// Produkt aktualisieren (nur Admin)
async function updateProdukt(produktId, daten) {
    const response = await fetch(`${API_URL}/produkte/${produktId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(daten)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Fehler beim Aktualisieren');
    }
    return await response.json();
}

// Produkt löschen (nur Admin)
async function deleteProdukt(produktId) {
    const response = await fetch(`${API_URL}/produkte/${produktId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Fehler beim Löschen');
    }
    return await response.json();
}

