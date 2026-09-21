// ========================================
// WARENKORB-SEITE
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    
    await updateLoginStatus();
    await loadWarenkorb();
});

// ========================================
// WARENKORB LADEN
// ========================================

async function loadWarenkorb() {
    if (!isLoggedIn()) {
        document.getElementById('warenkorbInhalt').innerHTML = `
            <p>Bitte <a href="login.html" style="color:#e94560;">melden Sie sich an</a>, um Ihren Warenkorb zu sehen.</p>
        `;
        return;
    }
    
    try {
        const warenkorb = await getWarenkorb();
        const container = document.getElementById('warenkorbInhalt');
        
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
        let html = '';
        
        for (const eintrag of warenkorb) {
            const produkt = await getProdukt(eintrag.produkt_id);
            const zwischensumme = produkt.preis * eintrag.menge;
            gesamtpreis += zwischensumme;
            
    html += `
    <div class="warenkorb-item">
        <div style="display:flex; align-items:center; gap:20px;">
            <img src="${produkt.bild_url || 'https://via.placeholder.com/80x80'}" 
                alt="${produkt.name}" 
                style="width:80px; height:80px; object-fit:cover; border-radius:6px; background:#f9f9f9;">
            <div class="warenkorb-item-info">
                <h3>${produkt.name}</h3>
                <p class="preis">${produkt.preis.toFixed(2)} € × ${eintrag.menge} = ${zwischensumme.toFixed(2)} €</p>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:15px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn" onclick="changeMengeWarenkorb(${eintrag.id}, ${eintrag.menge - 1})" 
                        style="padding:6px 12px; font-size:16px; min-width:35px;">−</button>
                <span style="font-size:16px; font-weight:700; min-width:30px; text-align:center;">${eintrag.menge}</span>
                <button class="btn" onclick="changeMengeWarenkorb(${eintrag.id}, ${eintrag.menge + 1})" 
                        style="padding:6px 12px; font-size:16px; min-width:35px;">+</button>
            </div>
            <button class="btn" onclick="removeItem(${eintrag.id})" 
                    style="background:#e94560; padding:8px 16px; font-size:13px;">
                🗑
            </button>
        </div>
    </div>
`;
        }
        
        html += `
            <div class="warenkorb-summe">
                <h2>Gesamt: <span class="gesamt">${gesamtpreis.toFixed(2)} €</span></h2>
                <button class="btn btn-primary" onclick="checkout()" style="margin-top:15px;">
                    Zur Kasse
                </button>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Warenkorb-Zähler aktualisieren
        const count = warenkorb.reduce((sum, item) => sum + item.menge, 0);
        document.getElementById('cartCount').textContent = count;
        
    } catch (error) {
        console.error('Fehler:', error);
        document.getElementById('warenkorbInhalt').innerHTML = `
            <p style="color:#e94560;">Fehler beim Laden des Warenkorbs.</p>
        `;
    }
}

// ========================================
// MENGE ÄNDERN
// ========================================

async function changeMengeWarenkorb(eintragId, neueMenge) {
    try {
        await updateWarenkorbMenge(eintragId, neueMenge);
        await loadWarenkorb();
    } catch (error) {
        alert('Fehler beim Ändern der Menge: ' + error.message);
    }
}


// ========================================
// PRODUKT ENTFERNEN
// ========================================

async function removeItem(eintragId) {
    try {
        await removeFromWarenkorb(eintragId);
        await loadWarenkorb();
    } catch (error) {
        alert('Fehler beim Entfernen: ' + error.message);
    }
}

// ========================================
// ZUR KASSE
// ========================================

async function checkout() {
    window.location.href = 'checkout.html';
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