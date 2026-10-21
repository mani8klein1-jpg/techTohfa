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
                <div class="produkt-detail-wrapper">
                    <div class="produkt-detail-bild">
                        <img src="${produkt.bild_url || 'https://via.placeholder.com/500x400'}" 
                            alt="${produkt.name}">
                    </div>
                    <div class="produkt-detail-info">
                        <h1>${produkt.name}</h1>
                        <p class="beschreibung">${produkt.beschreibung || ''}</p>
                        <p class="preis">${produkt.preis.toFixed(2)} €</p>
                        <p class="lager">✓ ${produkt.lagerbestand} auf Lager</p>
                        
                        <div class="mengen-selector">
                            <button class="btn" onclick="changeMenge(-1)">−</button>
                            <span id="menge">1</span>
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