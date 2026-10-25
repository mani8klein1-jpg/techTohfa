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

    // ========================================
    // 1. SUCHTEXT VORBEREITEN
    // ========================================
    let query = input.value
        .toLowerCase()
        .trim()
        .replace(/[?!,;:]+/g, ' ')
        .replace(/\s+/g, ' ');

    const originalQuery = query;

    // ========================================
    // 2. PREISFILTER ERKENNEN
    // Beispiele:
    // unter 500 Euro
    // bis 300 €
    // maximal 1000
    // nicht mehr als 200 Euro
    // ========================================
    let preisFilter = null;
    let preisModus = 'bis';

    const preisRegex =
        /\b(nicht mehr als|weniger als|unter|bis zu|maximal|max|höchstens|höchstens bis zu|bis)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:euro|eur|€)?\b/i;

    const preisMatch = query.match(preisRegex);

    if (preisMatch) {
        preisFilter = parseFloat(preisMatch[2].replace(',', '.'));

        preisModus =
            /^(unter|weniger als)$/i.test(preisMatch[1])
                ? 'unter'
                : 'bis';

        query = query.replace(preisMatch[0], ' ');
    }

    // ========================================
    // 3. GANZE PHRASES ENTFERNEN
    // Längere Phrasen zuerst!
    // ========================================
    const fuellwoerter = [
        // Ich suche ...
        'ich bin auf der suche nach',
        'ich bin auf der suche',
        'ich suche nach einer',
        'ich suche nach einem',
        'ich suche nach einer',
        'ich suche nach einem',
        'ich suche nach',
        'ich suche eine',
        'ich suche einen',
        'ich suche ein',
        'ich suche',

        // Ich möchte ...
        'ich möchte gerne eine',
        'ich möchte gerne einen',
        'ich möchte gerne ein',
        'ich möchte gerne',
        'ich möchte gern',
        'ich möchte eine',
        'ich möchte einen',
        'ich möchte ein',
        'ich möchte',

        // Ich brauche ...
        'ich benötige eine',
        'ich benötige einen',
        'ich benötige ein',
        'ich benötige',
        'ich brauche eine',
        'ich brauche einen',
        'ich brauche ein',
        'ich brauche',

        // Zeigen und Suchen
        'kannst du mir bitte zeigen',
        'kannst du mir zeigen',
        'kannst du mir bitte',
        'kannst du mir',
        'können sie mir bitte zeigen',
        'können sie mir zeigen',
        'können sie mir bitte',
        'können sie mir',
        'würdest du mir bitte zeigen',
        'würdest du mir zeigen',
        'zeige mir bitte eine',
        'zeige mir bitte einen',
        'zeige mir bitte ein',
        'zeige mir bitte',
        'zeig mir bitte eine',
        'zeig mir bitte einen',
        'zeig mir bitte ein',
        'zeig mir bitte',
        'zeige mir eine',
        'zeige mir einen',
        'zeige mir ein',
        'zeige mir',
        'zeig mir eine',
        'zeig mir einen',
        'zeig mir ein',
        'zeig mir',
        'suche nach einer',
        'suche nach einem',
        'suche nach',
        'suche bitte',
        'suche',

        // Fragen zum Angebot
        'was kannst du mir anbieten',
        'was können sie mir anbieten',
        'was habt ihr im angebot',
        'was haben sie im angebot',
        'was bietet ihr an',
        'was bieten sie an',
        'welche produkte gibt es',
        'welche produkte habt ihr',
        'welche produkte haben sie',
        'was kann ich kaufen',
        'was gibt es',
        'was habt ihr',
        'was haben sie',
        'hast du eine',
        'hast du einen',
        'hast du ein',
        'hast du',
        'habt ihr',
        'haben sie',
        'gibt es',

        // Preisfragen
        'wie viel kostet mich',
        'wie viel kostet denn',
        'wie viel kostet',
        'wieviel kostet',
        'was kostet mich',
        'was kostet denn',
        'was kostet',
        'wie viel kosten',
        'wieviel kosten',
        'was kosten',
        'wie teuer ist',
        'wie teuer sind',
        'nenne mir den preis',
        'nenn mir den preis',
        'zeige mir den preis',
        'preis von',
        'preis für',

        // Verfügbarkeit
        'ist das produkt verfügbar',
        'ist das noch verfügbar',
        'ist noch verfügbar',
        'sind noch verfügbar',
        'habt ihr noch',
        'haben sie noch',
        'auf lager',
        'sofort lieferbar',
        'ist verfügbar',
        'sind verfügbar',

        // Produktinformationen
        'was ist der unterschied zwischen',
        'was ist der unterschied',
        'was sind die unterschiede',
        'welche eigenschaften hat',
        'welche funktionen hat',
        'technische daten von',
        'mehr informationen über',
        'informationen zu',
        'details zu',
        'beschreibe mir',
        'erkläre mir',
        'wie funktioniert',
        'wie gut ist',
        'wie groß ist',
        'wie schwer ist',
        'wie schnell ist',
        'wie viel speicher hat',
        'wie viel ram hat',

        // Allgemeine Formulierungen
        'ich hätte gerne eine',
        'ich hätte gerne einen',
        'ich hätte gerne ein',
        'ich hätte gerne',
        'ich hätte gern',
        'ich würde gerne',
        'ich würde gern',
        'ich will eine',
        'ich will einen',
        'ich will ein',
        'ich will',
        'ich suche mir',
        'für mich',
        'wenn möglich',
        'wenn es geht',
        'bitte zeige',
        'bitte zeig',
        'bitte suche',
        'bitte finde',
        'bitte einmal',
        'einmal bitte'
    ];

    // Längere Phrasen immer zuerst entfernen
    fuellwoerter.sort((a, b) => b.length - a.length);

    for (const wort of fuellwoerter) {
        const escaped = wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        query = query.replace(
            new RegExp('(^|\\s)' + escaped + '(?=\\s|$)', 'gi'),
            ' '
        );
    }

    // ========================================
    // 4. EINZELNE FRAGE- UND FÜLLWÖRTER
    // ========================================
    const einzelneFuellwoerter = [
        'bitte', 'danke', 'dankeschön',
        'entschuldigung', 'entschuldige',
        'mal', 'doch', 'denn', 'also',
        'äh', 'ähm', 'hm', 'hmm',
        'naja', 'halt', 'eben', 'eigentlich',
        'vielleicht', 'sozusagen', 'irgendwie',
        'einfach', 'wirklich', 'gerade',
        'jetzt', 'einmal', 'gerne', 'gern',
        'ich', 'mir', 'mich', 'du',
        'kannst', 'könntest', 'können',
        'würdest', 'würden', 'möchte',
        'möchtest', 'will', 'wollte',
        'was', 'welche', 'welcher', 'welches',
        'warum', 'wo', 'wann', 'wer',
        'wie', 'hast', 'habt', 'haben',
        'hat', 'ist', 'sind', 'wäre',
        'wären', 'gibt', 'bitte',
        'der', 'die', 'das', 'den',
        'dem', 'des', 'ein', 'eine',
        'einen', 'einem', 'einer', 'eines',
        'und', 'oder'
    ];

    const einzelRegex = new RegExp(
        '\\b(?:' +
        einzelneFuellwoerter
            .sort((a, b) => b.length - a.length)
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|') +
        ')\\b',
        'gi'
    );

    query = query
        .replace(einzelRegex, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // ========================================
    // 5. SYNONYME UND PRODUKTBEZEICHNUNGEN
    // ========================================
    const synonymGruppen = [
        ['maus', 'mäuse', 'mouse', 'mice'],
        ['tastatur', 'tastaturen', 'keyboard', 'keyboards'],
        ['monitor', 'monitore', 'bildschirm', 'bildschirme', 'screen', 'screens'],
        ['laptop', 'laptops', 'notebook', 'notebooks'],
        ['kabel', 'kabeln', 'cable', 'cables'],
        ['kopfhörer', 'kopfhörern', 'headphone', 'headphones'],
        ['festplatte', 'festplatten', 'ssd'],
        ['zubehör', 'accessory', 'accessories']
    ];

    const synonymMap = {};

    for (const gruppe of synonymGruppen) {
        for (const wort of gruppe) {
            synonymMap[wort] = gruppe;
        }
    }

    // Schreibvarianten vereinheitlichen
    query = query
        .replace(/\bmäuse\b/g, 'maus')
        .replace(/\bmonitore\b/g, 'monitor')
        .replace(/\bbildschirme\b/g, 'bildschirm')
        .replace(/\btastaturen\b/g, 'tastatur')
        .replace(/\blaptops\b/g, 'laptop')
        .replace(/\bkabeln\b/g, 'kabel')
        .replace(/\bkopfhörern\b/g, 'kopfhörer')
        .replace(/\bfestplatten\b/g, 'festplatte');

    // ========================================
    // 6. PRODUKTE FILTERN
    // Suche in Name und Beschreibung
    // ========================================
    const suchWoerter = query
        .split(/\s+/)
        .filter(Boolean);

    let ergebnisse = alleProdukte.filter(produkt => {
        const name = (produkt.name || '').toLowerCase();
        const beschreibung = (produkt.beschreibung || '').toLowerCase();

        const text = `${name} ${beschreibung}`;

        // Jedes Suchwort muss passen.
        const passtText = suchWoerter.every(wort => {
            const varianten = synonymMap[wort] || [wort];

            return varianten.some(variante =>
                text.includes(variante)
            );
        });

        const passtPreis =
            preisFilter === null ||
            (preisModus === 'unter'
                ? produkt.preis < preisFilter
                : produkt.preis <= preisFilter);

        return passtText && passtPreis;
    });

    // ========================================
    // 7. ERGEBNISSE ANZEIGEN
    // ========================================
    zeigeProdukte(ergebnisse);

    // Kategorie-Filter zurücksetzen
    aktiveKategorie = null;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const alleBtn = document.querySelector('.filter-btn');
    if (alleBtn) alleBtn.classList.add('active');

    // Ursprüngliche Eingabe nicht überschreiben
    // So bleibt die gesprochene Frage sichtbar.
    input.value = originalQuery;
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


