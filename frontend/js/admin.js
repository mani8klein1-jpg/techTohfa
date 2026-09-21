// ========================================
// ADMIN-BEREICH
// ========================================

let aktuelleProdukte = [];
let aktuelleKategorien = [];

document.addEventListener('DOMContentLoaded', async function() {
    
    // Prüfen, ob eingeloggt + Admin
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const benutzer = await getBenutzer();
        
        // Prüfen, ob Admin
        if (!benutzer.ist_admin) {
            alert('Zugriff verweigert. Nur Admins dürfen diese Seite aufrufen.');
            window.location.href = 'index.html';
            return;
        }
        
        // Admin-Link im Dropdown anzeigen
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'block';
        
        // Login-Status aktualisieren
        await updateLoginStatus();
        await updateCartCount();
        
        // Produkte + Kategorien laden
        await ladeAlles();
        
    } catch (error) {
        console.error('Fehler:', error);
        window.location.href = 'login.html';
    }
});

// ========================================
// ALLES LADEN
// ========================================

async function ladeAlles() {
    try {
        aktuelleProdukte = await getProdukte();
        aktuelleKategorien = await getKategorien();
        
        zeigeProdukteAdmin();
        fuelleKategorieDropdown();
        
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        document.getElementById('adminInhalt').innerHTML = `
            <p style="color:#e94560;">Fehler beim Laden der Produkte.</p>
        `;
    }
}

// ========================================
// PRODUKTE ANZEIGEN
// ========================================

function zeigeProdukteAdmin() {
    const container = document.getElementById('adminInhalt');
    
    if (aktuelleProdukte.length === 0) {
        container.innerHTML = `
            <p style="color:#888;">Noch keine Produkte vorhanden.</p>
        `;
        return;
    }
    
    let html = '';
    
    aktuelleProdukte.forEach(produkt => {
        // Kategorie-Name finden
        const kategorie = aktuelleKategorien.find(k => k.id === produkt.kategorie_id);
        const kategorieName = kategorie ? kategorie.name : '–';
        
        html += `
            <div class="admin-produkt" style="background:white; border-radius:8px; padding:20px; margin-bottom:15px; display:flex; align-items:center; gap:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <img src="${produkt.bild_url || 'https://via.placeholder.com/80x80'}" 
                     alt="${produkt.name}" 
                     style="width:80px; height:80px; object-fit:cover; border-radius:6px; background:#f9f9f9;">
                
                <div style="flex:1;">
                    <h3 style="font-size:18px; margin-bottom:5px;">${produkt.name}</h3>
                    <p style="color:#888; font-size:14px; margin-bottom:5px;">${produkt.beschreibung || ''}</p>
                    <p style="font-size:14px; color:#555;">
                        <strong style="color:#e94560;">${produkt.preis.toFixed(2)} €</strong>
                        · ${produkt.lagerbestand} auf Lager
                        · ${kategorieName}
                    </p>
                </div>
                
                <div style="display:flex; gap:8px;">
                    <button class="btn" onclick="bearbeiteProdukt(${produkt.id})" 
                            style="background:#2196f3; padding:8px 14px; font-size:13px;">
                        ✏️ Bearbeiten
                    </button>
                    <button class="btn" onclick="loescheProdukt(${produkt.id}, '${produkt.name.replace(/'/g, "\\'")}')" 
                            style="background:#e94560; padding:8px 14px; font-size:13px;">
                        🗑 Löschen
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========================================
// KATEGORIE-DROPDOWN FÜLLEN
// ========================================

function fuelleKategorieDropdown() {
    const select = document.getElementById('kategorie_id');
    if (!select) return;
    
    let html = '';
    aktuelleKategorien.forEach(kat => {
        html += `<option value="${kat.id}">${kat.name}</option>`;
    });
    
    select.innerHTML = html;
}

// ========================================
// MODAL ÖFFNEN (NEU)
// ========================================

function oeffneProduktModal() {
    document.getElementById('produktId').value = '';
    document.getElementById('modalTitel').textContent = 'Neues Produkt';
    document.getElementById('produktForm').reset();
    document.getElementById('modalMessage').textContent = '';
    
    // Standard-Kategorie auswählen
    if (aktuelleKategorien.length > 0) {
        document.getElementById('kategorie_id').value = aktuelleKategorien[0].id;
    }
    
    document.getElementById('produktModal').style.display = 'flex';
}

// ========================================
// MODAL ÖFFNEN (BEARBEITEN)
// ========================================

function bearbeiteProdukt(produktId) {
    const produkt = aktuelleProdukte.find(p => p.id === produktId);
    if (!produkt) return;
    
    document.getElementById('produktId').value = produkt.id;
    document.getElementById('modalTitel').textContent = 'Produkt bearbeiten';
    document.getElementById('name').value = produkt.name;
    document.getElementById('beschreibung').value = produkt.beschreibung || '';
    document.getElementById('preis').value = produkt.preis;
    document.getElementById('lagerbestand').value = produkt.lagerbestand;
    document.getElementById('bild_url').value = produkt.bild_url || '';
    document.getElementById('kategorie_id').value = produkt.kategorie_id || '';
    document.getElementById('modalMessage').textContent = '';
    
    document.getElementById('produktModal').style.display = 'flex';
}

// ========================================
// MODAL SCHLIESSEN
// ========================================

function schliesseProduktModal() {
    document.getElementById('produktModal').style.display = 'none';
}

// ========================================
// PRODUKT SPEICHERN (NEU ODER BEARBEITEN)
// ========================================

async function speichereProdukt(event) {
    event.preventDefault();
    
    const produktId = document.getElementById('produktId').value;
    const message = document.getElementById('modalMessage');
    
    const daten = {
        name: document.getElementById('name').value.trim(),
        beschreibung: document.getElementById('beschreibung').value.trim(),
        preis: parseFloat(document.getElementById('preis').value),
        lagerbestand: parseInt(document.getElementById('lagerbestand').value),
        bild_url: document.getElementById('bild_url').value.trim(),
        kategorie_id: parseInt(document.getElementById('kategorie_id').value)
    };
    
    // Validierung
    if (!daten.name || isNaN(daten.preis) || isNaN(daten.lagerbestand)) {
        message.textContent = '✗ Bitte alle Pflichtfelder ausfüllen.';
        message.style.color = '#e94560';
        return;
    }
    
    try {
        if (produktId) {
            // Bearbeiten
            await updateProdukt(produktId, daten);
            message.textContent = '✓ Produkt aktualisiert!';
        } else {
            // Neu anlegen
            await createProdukt(daten);
            message.textContent = '✓ Produkt angelegt!';
        }
        
        message.style.color = '#4caf50';
        
        // Nach 1 Sekunde schließen + neu laden
        setTimeout(async () => {
            schliesseProduktModal();
            await ladeAlles();
        }, 1000);
        
    } catch (error) {
        message.textContent = '✗ Fehler: ' + error.message;
        message.style.color = '#e94560';
        console.error('Fehler:', error);
    }
}

// ========================================
// PRODUKT LÖSCHEN
// ========================================

async function loescheProdukt(produktId, name) {
    if (!confirm(`Produkt "${name}" wirklich löschen?\n\nAchtung: Das Produkt wird aus allen Warenkörben entfernt!`)) {
        return;
    }
    
    try {
        await deleteProdukt(produktId);
        await ladeAlles();
    } catch (error) {
        alert('Fehler beim Löschen: ' + error.message);
    }
}

// ========================================
// HILFSFUNKTIONEN
// ========================================

async function updateLoginStatus() {
    const loginLink = document.getElementById('loginLink');
    const userMenu = document.getElementById('userMenu');
    
    if (isLoggedIn()) {
        loginLink.style.display = 'none';
        userMenu.style.display = 'block';
        
        try {
            const benutzer = await getBenutzer();
            document.getElementById('userNameText').textContent = benutzer.name;
            
            // Admin-Link anzeigen
            if (benutzer.ist_admin) {
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.style.display = 'block';
            }
        } catch (error) {
            document.getElementById('userNameText').textContent = 'Benutzer';
        }
    } else {
        loginLink.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

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

async function updateCartCount() {
    if (!isLoggedIn()) return;
    
    try {
        const warenkorb = await getWarenkorb();
        const count = warenkorb.reduce((sum, item) => sum + item.menge, 0);
        document.getElementById('cartCount').textContent = count;
    } catch (error) {
        console.error('Fehler:', error);
    }
}