// ========================================
// PRODUKTSEITE
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    
    await updateLoginStatus();
    updateCartCount();
    
    // Produkt-ID aus der URL lesen
    const params = new URLSearchParams(window.location.search);
    const produktId = params.get('id');
    
    if (!produktId) {
        document.getElementById('produktDetail').innerHTML = '<p>Produkt nicht gefunden.</p>';
        return;
    }
    
    await loadProdukt(produktId);
});

// ========================================
// PRODUKT LADEN
// ========================================

async function loadProdukt(id) {
    try {
        const produkt = await getProdukt(id);
        const container = document.getElementById('produktDetail');
        
        container.innerHTML = `
            <div style="display:flex; gap:40px; background:white; padding:40px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.08); flex-wrap:wrap;">
                <div style="flex:1; min-width:300px;">
                    <img src="${produkt.bild_url || 'https://via.placeholder.com/500x400'}" 
                         alt="${produkt.name}" 
                         style="width:100%; border-radius:8px;">
                </div>
                <div style="flex:1; min-width:300px;">
                    <h1 style="font-size:32px; margin-bottom:10px;">${produkt.name}</h1>
                    <p style="color:#888; margin-bottom:20px;">${produkt.beschreibung || ''}</p>
                    <p style="font-size:32px; font-weight:700; color:#e94560; margin-bottom:20px;">
                        ${produkt.preis.toFixed(2)} €
                    </p>
                    <p style="color:#4caf50; margin-bottom:25px;">
                        ✓ ${produkt.lagerbestand} auf Lager
                    </p>
                    
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">
                        <button class="btn" onclick="changeMenge(-1)">−</button>
                        <span id="menge" style="font-size:20px; font-weight:700; min-width:40px; text-align:center;">1</span>
                        <button class="btn" onclick="changeMenge(1)">+</button>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="addToCart(${produkt.id})">
                        🛒 In den Warenkorb
                    </button>
                    
                    <p id="message" style="margin-top:15px; text-align:center;"></p>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Fehler:', error);
        document.getElementById('produktDetail').innerHTML = '<p>Produkt nicht gefunden.</p>';
    }
}

// ========================================
// MENGE ÄNDERN
// ========================================

let aktuelleMenge = 1;

function changeMenge(delta) {
    aktuelleMenge += delta;
    if (aktuelleMenge < 1) aktuelleMenge = 1;
    document.getElementById('menge').textContent = aktuelleMenge;
}

// ========================================
// IN DEN WARENKORB
// ========================================

async function addToCart(produktId) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        await addToWarenkorb(produktId, aktuelleMenge);
        
        const message = document.getElementById('message');
        message.textContent = '✓ Zum Warenkorb hinzugefügt!';
        message.style.color = '#4caf50';
        
        updateCartCount();
        
        setTimeout(() => {
            message.textContent = '';
        }, 3000);
        
    } catch (error) {
        const message = document.getElementById('message');
        message.textContent = '✗ Fehler beim Hinzufügen';
        message.style.color = '#e94560';
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