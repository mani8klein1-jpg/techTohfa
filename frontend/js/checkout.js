// ========================================
// CHECKOUT-SEITE
// ========================================

let bestellungErfolgt = false;

document.addEventListener('DOMContentLoaded', async function() {
    
    await updateLoginStatus();
    
    // Prüfen, ob gerade eine Bestellung erfolgreich war
    const bestellungErfolgt = sessionStorage.getItem('bestellungErfolgt');
    
    if (bestellungErfolgt === 'true') {
        // Danke-Seite anzeigen
        zeigeDankeSeite();
        
        // Flag SOFORT löschen, damit beim nächsten Besuch das Adressformular erscheint
        sessionStorage.removeItem('bestellungErfolgt');
        return;
    }
    
    await loadCheckout();
});

// ========================================
// CHECKOUT LADEN
// ========================================

async function loadCheckout() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const warenkorb = await getWarenkorb();
        const container = document.getElementById('checkoutInhalt');
        
        if (warenkorb.length === 0) {
            container.innerHTML = `
                <p style="color:#888;">Ihr Warenkorb ist leer.</p>
                <a href="index.html" class="btn" style="margin-top:20px; display:inline-block;">Zurück zu den Produkten</a>
            `;
            document.getElementById('cartCount').textContent = '0';
            return;
        }
        
        // Produkte für jede Position laden
        let gesamtpreis = 0;
        let html = '<div style="background:white; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.08);">';
        html += '<h2 style="margin-bottom:20px;">Ihre Bestellung</h2>';
        
        for (const eintrag of warenkorb) {
            const produkt = await getProdukt(eintrag.produkt_id);
            const zwischensumme = produkt.preis * eintrag.menge;
            gesamtpreis += zwischensumme;
            
            html += `
                <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f0f0f0;">
                    <span>${produkt.name} × ${eintrag.menge}</span>
                    <span style="font-weight:700;">${zwischensumme.toFixed(2)} €</span>
                </div>
            `;
        }
        
        html += `
            <div style="display:flex; justify-content:space-between; padding:20px 0; margin-top:15px; border-top:2px solid #1a1a1a; font-size:22px; font-weight:700;">
                <span>Gesamt:</span>
                <span style="color:#e94560;">${gesamtpreis.toFixed(2)} €</span>
            </div>
        `;
        
        // Adress-Formular
        html += `
            <h2 style="margin-top:40px; margin-bottom:20px;">Lieferadresse</h2>
            <div class="form-group">
                <label for="vorname">Vorname</label>
                <input type="text" id="vorname" placeholder="Max" required>
            </div>
            <div class="form-group">
                <label for="nachname">Nachname</label>
                <input type="text" id="nachname" placeholder="Mustermann" required>
            </div>
            <div class="form-group">
                <label for="adresse">Straße und Hausnummer</label>
                <input type="text" id="adresse" placeholder="Musterstraße 12" required>
            </div>
            <div class="form-group">
                <label for="plz">Postleitzahl</label>
                <input type="text" id="plz" placeholder="12345" required>
            </div>
            <div class="form-group">
                <label for="ort">Ort</label>
                <input type="text" id="ort" placeholder="Berlin" required>
            </div>
            
            <button class="btn btn-primary btn-block" onclick="bestellen()" style="margin-top:20px;">
                Jetzt bestellen
            </button>
            <p id="message" style="margin-top:15px; text-align:center;"></p>
        `;
        
        html += '</div>';
        
        container.innerHTML = html;

        setTimeout(() => {
            const felder = ['vorname', 'nachname', 'adresse', 'plz', 'ort'];
            felder.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }, 100);
        
        const count = warenkorb.reduce((sum, item) => sum + item.menge, 0);
        document.getElementById('cartCount').textContent = count;
        
    } catch (error) {
        console.error('Fehler:', error);
        document.getElementById('checkoutInhalt').innerHTML = `
            <p style="color:#e94560;">Fehler beim Laden.</p>
        `;
    }
}

// ========================================
// BESTELLEN
// ========================================

async function bestellen() {
    const vorname = document.getElementById('vorname').value.trim();
    const nachname = document.getElementById('nachname').value.trim();
    const adresse = document.getElementById('adresse').value.trim();
    const plz = document.getElementById('plz').value.trim();
    const ort = document.getElementById('ort').value.trim();
    const message = document.getElementById('message');
    
    // Alle Felder prüfen
    if (!vorname || !nachname || !adresse || !plz || !ort) {
        message.textContent = '✗ Bitte füllen Sie alle Adressfelder aus.';
        message.style.color = '#e94560';
        return;
    }
    
    // PLZ prüfen: genau 5 Ziffern
    if (!/^\d{5}$/.test(plz)) {
        message.textContent = '✗ Die Postleitzahl muss genau 5 Ziffern haben.';
        message.style.color = '#e94560';
        return;
    }
    
    if (!confirm('Möchten Sie die Bestellung wirklich aufgeben?')) return;
    
    try {
        const bestellung = await createBestellung();
        
        // Bestelldaten in sessionStorage speichern
        sessionStorage.setItem('bestellungErfolgt', 'true');
        sessionStorage.setItem('bestellnummer', bestellung.id);
        sessionStorage.setItem('bestellpreis', bestellung.gesamtpreis.toFixed(2));
        sessionStorage.setItem('lieferadresse', `${vorname} ${nachname}, ${adresse}, ${plz} ${ort}`);
        
        // Seite neu laden → zeigt Danke-Seite
        window.location.reload();
        
    } catch (error) {
        message.textContent = '✗ Fehler beim Bestellen.';
        message.style.color = '#e94560';
        console.error('Fehler:', error);
    }
}

// ========================================
// DANKE-SEITE
// ========================================

function zeigeDankeSeite() {
    const bestellnummer = sessionStorage.getItem('bestellnummer');
    const bestellpreis = sessionStorage.getItem('bestellpreis');
    const lieferadresse = sessionStorage.getItem('lieferadresse');
    
    const container = document.getElementById('checkoutInhalt');
    
    // Warenkorb-Zähler zurücksetzen
    document.getElementById('cartCount').textContent = '0';
    
    container.innerHTML = `
        <div style="background:white; padding:50px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.08); text-align:center;">
            <h1 style="color:#4caf50; font-size:48px; margin-bottom:20px;">✓</h1>
            <h2 style="margin-bottom:15px;">Vielen Dank für Ihre Bestellung!</h2>
            <p style="color:#888; margin-bottom:30px;">Ihre Bestellung wurde erfolgreich aufgegeben.</p>
            
            <div style="background:#f9f9f9; padding:25px; border-radius:8px; margin-bottom:30px; text-align:left;">
                <p style="margin-bottom:10px;"><strong>Bestellnummer:</strong> ${bestellnummer}</p>
                <p style="margin-bottom:10px;"><strong>Gesamtpreis:</strong> ${bestellpreis} €</p>
                <p><strong>Lieferadresse:</strong> ${lieferadresse}</p>
            </div>
            
            <button class="btn btn-primary" onclick="weiterEinkaufen()">Weiter einkaufen</button>
        </div>
    `;
}

// ========================================
// HILFSFUNKTIONEN
// ========================================

async function updateLoginStatus() {
    const loginLink = document.getElementById('loginLink');
    const userMenu = document.getElementById('userMenu');
    const adminLink = document.getElementById('adminLink');
    
    if (isLoggedIn()) {
        loginLink.style.display = 'none';
        userMenu.style.display = 'block';
        
        try {
            const benutzer = await getBenutzer();
            document.getElementById('userNameText').textContent = benutzer.name;
            
            // Admin-Link anzeigen, wenn Admin
            if (adminLink) {
                adminLink.style.display = benutzer.ist_admin ? 'block' : 'none';
            }
        } catch (error) {
            document.getElementById('userNameText').textContent = 'Benutzer';
            if (adminLink) adminLink.style.display = 'none';
        }
    } else {
        loginLink.style.display = 'block';
        userMenu.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Dropdown ein-/ausblenden
function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Dropdown schließen bei Klick außerhalb
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

function logout() {
    removeToken();
    window.location.href = 'index.html';
}

// ========================================
// WEITER EINKAUFEN
// ========================================

function weiterEinkaufen() {
    // Alle Bestelldaten aus sessionStorage löschen
    sessionStorage.removeItem('bestellungErfolgt');
    sessionStorage.removeItem('bestellnummer');
    sessionStorage.removeItem('bestellpreis');
    sessionStorage.removeItem('lieferadresse');
    
    // Zur Startseite
    window.location.href = 'index.html';
}