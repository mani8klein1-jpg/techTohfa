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
                    <p><strong>Name:</strong> ${benutzer.name}</p>
                    <p><strong>E-Mail:</strong> ${benutzer.email}</p>
                    <p><strong>Registriert am:</strong> ${regDatum}</p>
                    <p><strong>Status:</strong> ${benutzer.ist_admin ? 'Administrator' : 'Kunde'}</p>
                </div>
                <a href="bestellungen.html" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Meine Bestellungen ansehen</a>
            </div>
        `;
    } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
        document.getElementById('profilInhalt').innerHTML = '<p style="color:#e94560;">Fehler beim Laden des Profils.</p>';
    }
}

// Hilfsfunktionen (updateLoginStatus, updateCartCount, toggleDropdown, logout)
// Diese sind bereits in deiner api.js oder müssen hier eingefügt werden.