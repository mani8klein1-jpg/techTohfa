document.addEventListener('DOMContentLoaded', async function() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    await updateLoginStatus();
    await updateCartCount();
    await loadProfil();
});

async function loadProfil() {
    try {
        const benutzer = await getBenutzer();
        const container = document.getElementById('profilInhalt');

        const regDatum = new Date(benutzer.erstellt_am).toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        container.innerHTML = `
            <div style="background:white; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                <h2 style="margin-bottom:20px;">Persönliche Daten</h2>
                <div class="profil-daten">
                    <p style="margin-bottom: 10px;"><strong>Name:</strong> ${benutzer.name}</p>
                    <p style="margin-bottom: 10px;"><strong>E-Mail:</strong> ${benutzer.email}</p>
                    <p style="margin-bottom: 10px;"><strong>Registriert am:</strong> ${regDatum}</p>
                    <p style="margin-bottom: 10px;"><strong>Status:</strong> ${benutzer.ist_admin ? 'Administrator' : 'Kunde'}</p>
                </div>
                <a href="bestellungen.html" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Meine Bestellungen ansehen</a>
            </div>
        `;
    } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
        document.getElementById('profilInhalt').innerHTML = '<p style="color:#e94560;">Fehler beim Laden des Profils.</p>';
    }
}

// ========================================
// HILFSFUNKTIONEN (kopiert aus anderen JS-Dateien)
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