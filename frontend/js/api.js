// ========================================
// API-KONFIGURATION
// ========================================
// Diese Datei kümmert sich um die Kommunikation
// mit dem Backend.

const API_URL = 'https://techtohfa-backend.onrender.com';
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
        p.name.toLowerCase().includes(q)
    );
}

// Globale Suchfunktion (funktioniert auf allen Seiten)
// Globale Suchfunktion (funktioniert auf allen Seiten)
function sucheAusfuehrenGlobal() {
    const input = document.getElementById('suchInput');
    if (!input) return;
    
    // Auf index.html → direkt filtern
    if (typeof sucheAusfuehren === 'function') {
        sucheAusfuehren();
    } else {
        // Auf anderen Seiten → zur Startseite
        const query = input.value.trim();
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

// ========================================
// HAMBURGER-MENÜ STEUERUNG
// ========================================

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    if (nav) {
        nav.classList.toggle('open');
    }
}

// ========================================
// SPRACHERKENNUNG (Speech-to-Text)
// ========================================

let recognition = null;
let isListening = false;

function startSpeech() {
    // Browser-Support prüfen
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Spracherkennung wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.');
        return;
    }
    
    // Falls schon am Zuhören: stoppen
    if (isListening) {
        if (recognition) recognition.stop();
        return;
    }
    
    // Neue Erkennung starten
    recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';           // Deutsch
    recognition.continuous = false;       // Nach einer Phrase stoppen
    recognition.interimResults = false;   // Nur Endergebnis
    
    const micBtn = document.getElementById('micBtn');
    const suchInput = document.getElementById('suchInput');
    
    recognition.onstart = function() {
        isListening = true;
        if (micBtn) {
            micBtn.classList.add('listening');
            micBtn.textContent = '🔴';
        }
        if (suchInput) suchInput.placeholder = '🎤 Sprich jetzt...';
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        if (suchInput) suchInput.value = transcript;
        
        // Suche direkt ausführen
        if (typeof sucheAusfuehren === 'function') {
            sucheAusfuehren();
        } else if (typeof sucheAusfuehrenGlobal === 'function') {
            sucheAusfuehrenGlobal();
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Spracherkennungs-Fehler:', event.error);
        if (micBtn) {
            micBtn.classList.remove('listening');
            micBtn.textContent = '🎤';
        }
        isListening = false;
        
        if (event.error === 'not-allowed') {
            alert('Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.');
        }
    };
    
    recognition.onend = function() {
        isListening = false;
        if (micBtn) {
            micBtn.classList.remove('listening');
            micBtn.textContent = '🎤';
        }
        if (suchInput) suchInput.placeholder = '🔍 Produkte suchen...';
    };
    
    recognition.start();
}