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
                <p class="preis">${produkt.preis.toFixed(2).replace('.', ',')} €</p>
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
    
    let query = input.value.trim().toLowerCase();
    
    // 1. PREIS-FILTER ERKENNEN (z.B. "unter 500", "bis 300 euro", "max 1000")
    let preisFilter = null;
    const preisRegex = /(?:unter|bis|max|maximal|höchstens)\s*(\d+)/i;
    const preisMatch = query.match(preisRegex);
    
    if (preisMatch) {
        preisFilter = parseInt(preisMatch[1]);
        query = query.replace(preisMatch[0], '').replace(/euro|€/gi, '').trim();
    }

    // 2. FÜLLWÖRTER UND GANZE PHRASEN ENTFERNEN
    
const fuellwoerter = [
    // ========================================
    // 1. ICH SUCHE ...
    // ========================================
    "ich suche eine", "ich suche einen", "ich suche ein",
    "ich suche", "ich bin auf der suche nach",
    "ich suche nach einer", "ich suche nach einem",
    "ich suche nach einem", "ich suche nach",
    "ich brauche eine", "ich brauche einen",
    "ich brauche ein", "ich brauche",
    "ich benötige eine", "ich benötige einen",
    "ich benötige ein", "ich benötige",
    "ich hätte gerne eine", "ich hätte gerne einen",
    "ich hätte gerne ein", "ich hätte gerne",
    "ich möchte eine", "ich möchte einen",
    "ich möchte ein", "ich möchte",
    "ich will eine", "ich will einen",
    "ich will ein", "ich will",

    // ========================================
    // 2. ZEIGEN UND ANZEIGEN
    // ========================================
    "zeig mir bitte eine", "zeig mir bitte einen",
    "zeig mir bitte ein", "zeig mir bitte",
    "zeige mir bitte eine", "zeige mir bitte einen",
    "zeige mir bitte ein", "zeige mir bitte",
    "zeig mir eine", "zeig mir einen",
    "zeig mir ein", "zeig mir",
    "zeige mir eine", "zeige mir einen",
    "zeige mir ein", "zeige mir",
    "kannst du mir zeigen", "kannst du zeigen",
    "können sie mir zeigen", "können sie zeigen",
    "ich möchte sehen", "ich will sehen",
    "zeige mir alle", "zeig mir alle",
    "anzeigen", "zeige", "zeig",

    // ========================================
    // 3. FRAGEN ZUR PRODUKTSUCHE
    // ========================================
    "hast du eine", "hast du einen", "hast du ein",
    "hast du", "haben sie eine", "haben sie einen",
    "haben sie ein", "haben sie",
    "gibt es eine", "gibt es einen", "gibt es ein",
    "gibt es", "habt ihr eine", "habt ihr einen",
    "habt ihr ein", "habt ihr",
    "finde ich eine", "finde ich einen",
    "finde ich ein", "finde ich",
    "wo finde ich eine", "wo finde ich einen",
    "wo finde ich ein", "wo finde ich",
    "wo gibt es", "wo bekomme ich",
    "kann ich eine kaufen", "kann ich einen kaufen",
    "kann ich ein kaufen", "kann ich kaufen",
    "welche produkte gibt es", "welche produkte habt ihr",
    "was habt ihr", "was gibt es",
    "was kann ich kaufen", "was bietet ihr an",
    "was bieten sie an", "welche artikel gibt es",

    // ========================================
    // 4. FRAGEN NACH PREISEN
    // ========================================
    "wie viel kostet eine", "wie viel kostet einen",
    "wie viel kostet ein", "wie viel kostet",
    "wieviel kostet eine", "wieviel kostet einen",
    "wieviel kostet ein", "wieviel kostet",
    "was kostet eine", "was kostet einen",
    "was kostet ein", "was kostet",
    "wie teuer ist eine", "wie teuer ist einen",
    "wie teuer ist ein", "wie teuer ist",
    "wie teuer sind", "wie viel kosten",
    "wieviel kosten", "was kosten",
    "nenne mir den preis", "nenn mir den preis",
    "zeige mir den preis", "preis von",
    "preis für", "zu welchem preis",
    "wie hoch ist der preis", "kostet das",

    // ========================================
    // 5. FRAGEN NACH VERFÜGBARKEIT
    // ========================================
    "ist eine verfügbar", "ist ein verfügbar",
    "ist eine auf lager", "ist ein auf lager",
    "ist das verfügbar", "ist das vorrätig",
    "habt ihr das auf lager", "haben sie das auf lager",
    "ist noch vorhanden", "noch verfügbar",
    "noch auf lager", "habt ihr noch",
    "gibt es noch", "kann ich bekommen",
    "kann ich bestellen", "sofort lieferbar",

    // ========================================
    // 6. FRAGEN NACH EIGENSCHAFTEN
    // ========================================
    "welche eigenschaften hat", "welche funktionen hat",
    "wie gut ist", "wie groß ist",
    "wie schwer ist", "wie schnell ist",
    "wie viel speicher hat", "wie viel ram hat",
    "hat das produkt", "hat dieser", "hat diese",
    "hat dieses", "ist dieser", "ist diese",
    "ist dieses", "welcher ist", "welche ist",
    "welches ist", "was ist der unterschied",
    "was sind die unterschiede", "erkläre mir",
    "beschreibe mir", "mehr informationen über",
    "informationen zu", "details zu",
    "technische daten von", "technische daten",
    "produktdetails", "produktbeschreibung",

    // ========================================
    // 7. KATEGORIEN UND PRODUKTFILTER
    // ========================================
    "ich suche nach monitoren", "suche monitore",
    "ich suche nach mäusen", "suche mäuse",
    "ich suche nach tastaturen", "suche tastaturen",
    "ich suche nach kabeln", "suche kabel",
    "ich suche nach laptops", "suche laptops",
    "ich suche nach zubehör", "suche zubehör",
    "in der kategorie", "aus der kategorie",
    "aus dem bereich", "im bereich",
    "zeige die kategorie", "kategorie",
    "produkte von", "artikel von",
    "produkte mit", "produkte unter",
    "produkte über", "günstige produkte",
    "billige produkte", "teure produkte",
    "preiswerte produkte", "die günstigsten",
    "die teuersten", "am billigsten",
    "am günstigsten", "unter euro",
    "bis euro", "für weniger als",

    // ========================================
    // 8. HÖFLICHE WÖRTER UND FÜLLWÖRTER
    // ========================================
    "bitte", "danke", "vielen dank", "wäre schön", "es wäre schön",
    "danke schön", "entschuldigung",
    "entschuldige", "verzeihung",
    "mal bitte", "doch bitte",
    "einmal bitte", "bitte einmal",
    "ich würde gerne", "ich würde gern",
    "ich möchte gerne", "ich möchte gern",
    "ich hätte gern", "ich hätte gerne",
    "wenn möglich", "wenn es geht",
    "könntest du bitte", "könntest du",
    "können sie bitte", "können sie",
    "kannst du bitte", "kannst du",
    "würdest du bitte", "würden sie bitte",
    "für mich", "mir bitte", "mir gerne",

    // ========================================
    // 9. ALLGEMEINE FÜLLWÖRTER
    // ========================================
    "also", "äh", "ähm", "hm", "hmm",
    "na ja", "naja", "halt", "eben",
    "eigentlich", "vielleicht", "sozusagen",
    "irgendwie", "einfach", "wirklich",
    "gerade", "jetzt", "denn", "doch",
    "mal", "nur", "noch", "schon",
    "da", "hier", "dort", "einmal",
    "bitte mal", "doch mal", "also bitte",

    // ========================================
    // 10. ARTIKEL UND KLEINE WÖRTER
    // ========================================
    "der", "die", "das", "den", "dem",
    "des", "ein", "eine", "einen",
    "einem", "einer", "eines",
    "und", "oder", "aber", "für",
    "mit", "ohne", "von", "vom",
    "zum", "zur", "im", "in der",
    "in dem", "auf dem", "bei den",
    "zu dem", "zu der", "bitte zeige",
    "mir den", "mir die", "mir das"
];

    
    fuellwoerter.sort((a, b) => b.length - a.length).forEach(wort => {
        query = query.replace(new RegExp(`\\b${wort}\\b`, 'gi'), '');
    });
    query = query.trim().replace(/\s+/g, ' ');

    // 3. SYNONYME ERKENNEN (Maus, Mouse, Mäuse, Mice)
    const synonyme = {
        "maus": "mouse", "mäuse": "mouse", "mice": "mouse",
        "tastatur": "keyboard", "tastaturen": "keyboard",
        "kabel": "cable", "kabeln": "cable",
        "kopfhörer": "headphones", "kopfhörern": "headphones",
        "laptop": "laptop", "laptops": "laptop",
        "monitor": "monitor", "monitore": "monitor", "bildschirm": "screen", "bildschirme": "screen",
        "usb": "usb", "festplatte": "ssd", "festplatten": "ssd"
    };

    if (synonyme[query]) {
        query = synonyme[query];
    }
    
    input.value = query;

    // 4. PRODUKTE FILTERN
    let ergebnisse;
    if (query === '') {
        ergebnisse = alleProdukte;
    } else {
        ergebnisse = alleProdukte.filter(p => {
            const passtName = p.name.toLowerCase().includes(query);
            const passtPreis = preisFilter === null || p.preis <= preisFilter;
            return passtName && passtPreis;
        });
    }

    // 5. ERGEBNISSE ANZEIGEN
    zeigeProdukte(ergebnisse);
    
    // Filter-Buttons zurücksetzen
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
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


