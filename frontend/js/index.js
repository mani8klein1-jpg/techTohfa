// ========================================
// STARTSEITE - PRODUKT-LISTE + KATEGORIE-FILTER
// ========================================

let alleProdukte = [];
let aktiveKategorie = null;  // null = "Alle"

document.addEventListener('DOMContentLoaded', async function() {
    
    await updateLoginStatus();
    updateCartCount();

    // Filter zurücksetzen
    aktiveKategorie = null;
    
    // ERST Produkte laden, DANN Kategorien
    await loadProdukte();
    await loadKategorien();
    
    // Suchbegriff aus URL lesen (falls vorhanden)
    const params = new URLSearchParams(window.location.search);
    const suche = params.get('suche');
    if (suche) {
        const input = document.getElementById('suchInput');
        if (input) input.value = suche;
        await sucheAusfuehren();
    }
});

// ========================================
// KATEGORIEN LADEN UND FILTER ANZEIGEN
// ========================================

async function loadKategorien() {
    try {
        const kategorien = await getKategorien();
        const container = document.getElementById('kategorieFilter');
        
        if (kategorien.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        // "Alle"-Button
        let html = `<button class="filter-btn active" onclick="filterKategorie(null, this)">Alle</button>`;
        
        // Kategorie-Buttons
        kategorien.forEach(kat => {
            // Zählen, wie viele Produkte in dieser Kategorie sind
            const anzahl = alleProdukte.filter(p => p.kategorie_id === kat.id).length;
            
            // Nur anzeigen, wenn mindestens 1 Produkt drin ist
            if (anzahl > 0) {
                html += `<button class="filter-btn" onclick="filterKategorie(${kat.id}, this)">
                    ${kat.name} <span class="filter-count">${anzahl}</span>
                </button>`;
            }
            
        });
        
        container.innerHTML = html;
        
        
    } 
    
    catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
    }
}

// ========================================
// PRODUKTE LADEN
// ========================================

async function loadProdukte() {
    try {
        alleProdukte = await getProdukte();
        zeigeProdukte(alleProdukte);
    } catch (error) {
        console.error('Fehler beim Laden der Produkte:', error);
    }
}

// ========================================
// PRODUKTE ANZEIGEN (mit Filter)
// ========================================

function zeigeProdukte(produkte) {
    const grid = document.getElementById('produktGrid');
    grid.innerHTML = '';
    
    if (produkte.length === 0) {
        grid.innerHTML = '<p style="color:#888;">Keine Produkte in dieser Kategorie.</p>';
        return;
    }
    
    produkte.forEach(produkt => {
        const card = document.createElement('div');
        card.className = 'produkt-card';
        card.onclick = () => window.location.href = `produkt.html?id=${produkt.id}`;
        
        card.innerHTML = `
            <img src="${produkt.bild_url || 'https://via.placeholder.com/300x200'}" alt="${produkt.name}">
            <div class="produkt-info">
                <h3>${produkt.name}</h3>
                <p class="beschreibung">${produkt.beschreibung || ''}</p>
                <p class="preis">${produkt.preis.toFixed(2)} €</p>
                <p class="lager">✓ ${produkt.lagerbestand} auf Lager</p>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ========================================
// FILTER ANWENDEN
// ========================================

function filterKategorie(kategorieId, button) {
    aktiveKategorie = kategorieId;
    
    // Buttons: active-Klasse umschalten
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Produkte filtern
    if (kategorieId === null) {
        zeigeProdukte(alleProdukte);
    } else {
        const gefiltert = alleProdukte.filter(p => p.kategorie_id === kategorieId);
        zeigeProdukte(gefiltert);
    }
}

// ========================================
// LOGIN-STATUS
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
    window.location.reload();
}

// ========================================
// WARENKORB-ANZAHL
// ========================================

async function updateCartCount() {
    if (!isLoggedIn()) return;
    
    try {
        const warenkorb = await getWarenkorb();
        const count = warenkorb.reduce((sum, item) => sum + item.menge, 0);
        document.getElementById('cartCount').textContent = count;
    } catch (error) {
        console.error('Fehler beim Laden des Warenkorbs:', error);
    }
}

// ========================================
// SUCHE
// ========================================

async function sucheAusfuehren() {
    const input = document.getElementById('suchInput');
    if (!input) return;
    
    const query = input.value.trim();
    
    // Leere Suche → alle Produkte
    if (query === '') {
        zeigeProdukte(alleProdukte);
        return;
    }
    
    const ergebnisse = await sucheProdukte(query);
    zeigeProdukte(ergebnisse);
    
    // Filter-Buttons zurücksetzen
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const alleBtn = document.querySelector('.filter-btn');
    if (alleBtn) alleBtn.classList.add('active');
}

// Enter-Taste in der Suchleiste
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('suchInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sucheAusfuehren();
            }
        });
    }
});


