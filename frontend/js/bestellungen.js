// ========================================
// BESTELLUNGEN-SEITE
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    
    await updateLoginStatus();
    updateCartCount();
    await loadBestellungen();
});

// ========================================
// BESTELLUNGEN LADEN
// ========================================

async function loadBestellungen() {
    if (!isLoggedIn()) {
        document.getElementById('bestellungenInhalt').innerHTML = `
            <p>Bitte <a href="login.html" style="color:#e94560;">melden Sie sich an</a>, um Ihre Bestellungen zu sehen.</p>
        `;
        return;
    }
    
    try {
        const bestellungen = await getBestellungen();
        const container = document.getElementById('bestellungenInhalt');
        
        if (bestellungen.length === 0) {
            container.innerHTML = `
                <p style="color:#888;">Sie haben noch keine Bestellungen aufgegeben.</p>
                <a href="index.html" class="btn" style="margin-top:20px; display:inline-block;">Jetzt einkaufen</a>
            `;
            return;
        }
        
        // Bestellungen sortieren: neueste zuerst
        bestellungen.sort((a, b) => b.id - a.id);
        
        let html = '';
        
        for (const bestellung of bestellungen) {
            // Status-Farbe bestimmen
            let statusFarbe = '#888';
            if (bestellung.status === 'offen') statusFarbe = '#ff9800';
            if (bestellung.status === 'versandt') statusFarbe = '#2196f3';
            if (bestellung.status === 'geliefert') statusFarbe = '#4caf50';
            
// Datum formatieren
const datum = new Date(bestellung.erstellt_am);
const datumFormatiert = datum.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

html += `
    <div class="bestellung-card" style="background:white; border-radius:8px; padding:25px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
            <div>
                <h3 style="font-size:20px; margin-bottom:5px;">Bestellung #${bestellung.id}</h3>
                <p style="color:#888; font-size:14px; margin-bottom:3px;">
                    📅 ${datumFormatiert}
                </p>
                <p style="color:#888; font-size:14px;">
                    Status: <span style="color:${statusFarbe}; font-weight:700;">${bestellung.status.toUpperCase()}</span>
                </p>
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <p style="font-size:24px; font-weight:700; color:#e94560; margin:0;">
                    ${bestellung.gesamtpreis.toFixed(2)} €
                </p>
                <button class="btn" onclick="loescheBestellung(${bestellung.id})" 
                        style="background:#e94560; padding:8px 14px; font-size:13px;">
                    🗑 Löschen
                </button>
            </div>
        </div>
        
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid #f0f0f0;">
            <p style="color:#888; font-size:14px;">Bestellpositionen werden geladen...</p>
        </div>
    </div>
`;
        }
        
        container.innerHTML = html;
        
        // Positionen nachladen
        await loadPositionen(bestellungen);
        
    } catch (error) {
        console.error('Fehler:', error);
        document.getElementById('bestellungenInhalt').innerHTML = `
            <p style="color:#e94560;">Fehler beim Laden der Bestellungen.</p>
        `;
    }
}

// ========================================
// BESTELLPOSITIONEN LADEN
// ========================================

async function loadPositionen(bestellungen) {
    // Alle Produkte einmal laden (effizienter als pro Bestellung)
    const alleProdukte = await getProdukte();
    const produktMap = {};
    alleProdukte.forEach(p => produktMap[p.id] = p);
    
    // Alle Bestellkarten holen
    const cards = document.querySelectorAll('.bestellung-card');
    
    // Jede Bestellung einzeln laden (mit Positionen)
    for (let i = 0; i < bestellungen.length; i++) {
        const bestellung = bestellungen[i];
        const card = cards[i];   // ← Direkt zuordnen, nicht per nth-child
        
        try {
            const detail = await getBestellung(bestellung.id);
            
            if (!card || !detail.positionen) continue;
            
            let positionenHtml = '<h4 style="margin-bottom:10px; font-size:16px;">Positionen:</h4>';
            
            for (const pos of detail.positionen) {
                const produkt = produktMap[pos.produkt_id];
                const name = produkt ? produkt.name : `Produkt #${pos.produkt_id}`;
                const zwischensumme = pos.preis * pos.menge;
                
                positionenHtml += `
                    <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:14px; border-bottom:1px solid #f5f5f5;">
                        <span>${name} × ${pos.menge}</span>
                        <span style="font-weight:700;">${zwischensumme.toFixed(2)} €</span>
                    </div>
                `;
            }
            
            const positionenDiv = card.querySelector('div[style*="margin-top:20px"]');
            if (positionenDiv) {
                positionenDiv.innerHTML = positionenHtml;
            }
            
        } catch (error) {
            console.error(`Fehler bei Bestellung ${bestellung.id}:`, error);
        }
    }
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

// ========================================
// BESTELLUNG LÖSCHEN
// ========================================

async function loescheBestellung(bestellungId) {
    if (!confirm(`Bestellung #${bestellungId} wirklich löschen?`)) return;
    
    try {
        await deleteBestellung(bestellungId);
        await loadBestellungen();
    } catch (error) {
        alert('Fehler beim Löschen: ' + error.message);
    }
}