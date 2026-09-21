// ========================================
// LOGIN & REGISTRIERUNG
// ========================================

let istLogin = true;  // true = Login, false = Registrierung

// ========================================
// FEHLER ANZEIGEN
// ========================================
// Diese Funktion steht ganz oben, damit sie
// überall verfügbar ist.

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
    console.error('Fehler:', message);
}

// ========================================
// FORMULAR-UMSCHALTEN
// ========================================

function updateForm() {
    const title = document.getElementById('formTitle');
    const subtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    
    if (istLogin) {
        title.textContent = 'Anmelden';
        subtitle.textContent = 'Melden Sie sich an, um einzukaufen.';
        submitBtn.textContent = 'Anmelden';
        switchText.textContent = 'Noch kein Konto?';
        switchLink.textContent = 'Jetzt registrieren';
    } else {
        title.textContent = 'Registrieren';
        subtitle.textContent = 'Erstellen Sie ein neues Konto.';
        submitBtn.textContent = 'Registrieren';
        switchText.textContent = 'Bereits ein Konto?';
        switchLink.textContent = 'Jetzt anmelden';
    }
    
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.style.display = 'none';
}

// ========================================
// LOGIN
// ========================================

async function doLogin(email, passwort) {
    try {
        const data = await login(email, passwort);
        setToken(data.access_token);
        window.location.href = 'index.html';
    } catch (error) {
        showError('E-Mail oder Passwort falsch.');
    }
}

// ========================================
// REGISTRIEREN
// ========================================

async function doRegistrieren(email, passwort) {
    try {
        // Name aus dem E-Mail-Prefix ableiten (bis @)
        const name = email.split('@')[0];
        
        await registrieren(name, email, passwort);
        
        // Nach der Registrierung direkt einloggen
        const data = await login(email, passwort);
        setToken(data.access_token);
        window.location.href = 'index.html';
        
    } catch (error) {
        showError(error.message || 'Fehler bei der Registrierung.');
    }
}

// ========================================
// BEIM LADEN DER SEITE
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    const form = document.getElementById('loginForm');
    const switchLink = document.getElementById('switchLink');
    
    // Formular absenden
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const passwort = document.getElementById('passwort').value;
        
        if (istLogin) {
            await doLogin(email, passwort);
        } else {
            await doRegistrieren(email, passwort);
        }
    });
    
    // Zwischen Login und Registrierung wechseln
    switchLink.addEventListener('click', function(e) {
        e.preventDefault();
        istLogin = !istLogin;
        updateForm();
    });
});