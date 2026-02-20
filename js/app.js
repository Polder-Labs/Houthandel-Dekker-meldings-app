/* ============================================
   HoutVeilig - Meldingsapp Houtbranche
   JavaScript Application Logic
   ============================================ */

// === App State ===
const state = {
    fotos: [],          // Array van { dataUrl, file } objecten
    locatie: null,      // { lat, lng, accuracy }
    meldingen: [],      // Opgeslagen meldingen
    maxFotos: 5
};

// === DOM Elements ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// === Initialization ===
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Microsoft 365 SSO first
    if (typeof initAuth === 'function') {
        const account = await initAuth();
        if (account) {
            // User is authenticated, initialize the app
            initApp();
        }
        // If not authenticated, login screen is shown by auth.js
    } else {
        // Auth module not loaded (e.g., local dev without MSAL)
        // Show app directly
        initApp();
    }
});

function initApp() {
    // Laad opgeslagen gegevens
    laadOpgeslagenGegevens();
    
    // Splash screen verbergen (skip if auth already handled it)
    const splashScreen = $('#splash-screen');
    if (splashScreen && splashScreen.style.display !== 'none') {
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            $('#app').classList.remove('hidden');
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }, 800);
    }

    // Event Listeners
    initTabNavigatie();
    initFotoKnoppen();
    initFormulier();
    initLocatie();
    initOverzicht();
    
    // Pre-fill name from SSO if available, otherwise from localStorage
    if (typeof getUserDisplayName === 'function' && getUserDisplayName()) {
        $('#melder-naam').value = getUserDisplayName();
    } else {
        const opgeslagenNaam = localStorage.getItem('houtveilig-naam');
        if (opgeslagenNaam) {
            $('#melder-naam').value = opgeslagenNaam;
        }
    }
    
    // Laad opgeslagen e-mail als die er is
    const opgeslagenEmail = localStorage.getItem('houtveilig-email');
    if (opgeslagenEmail) {
        $('#email-ontvanger').value = opgeslagenEmail;
    }
}

// === Tab Navigatie ===
function initTabNavigatie() {
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Actieve tab bijwerken
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Tab content bijwerken
            $$('.tab-content').forEach(content => content.classList.remove('active'));
            $(`#tab-${tabId}`).classList.add('active');
            
            // Scroll naar boven
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// === Foto Functionaliteit ===
function initFotoKnoppen() {
    // Camera knop
    $('#btn-camera').addEventListener('click', () => {
        $('#camera-input').click();
    });
    
    // Galerij knop
    $('#btn-gallery').addEventListener('click', () => {
        $('#gallery-input').click();
    });
    
    // Camera input change
    $('#camera-input').addEventListener('change', (e) => {
        verwerkFotos(e.target.files);
        e.target.value = ''; // Reset input
    });
    
    // Galerij input change
    $('#gallery-input').addEventListener('change', (e) => {
        verwerkFotos(e.target.files);
        e.target.value = ''; // Reset input
    });
}

function verwerkFotos(files) {
    if (!files || files.length === 0) return;
    
    const resterend = state.maxFotos - state.fotos.length;
    if (resterend <= 0) {
        toonToast(`Maximaal ${state.maxFotos} foto's toegestaan`, 'warning');
        return;
    }
    
    const teVerwerken = Array.from(files).slice(0, resterend);
    
    teVerwerken.forEach(file => {
        // Comprimeer de foto voor e-mail compatibiliteit
        comprimeerFoto(file, (dataUrl) => {
            state.fotos.push({ dataUrl, naam: file.name });
            updateFotoPreview();
        });
    });
    
    if (files.length > resterend) {
        toonToast(`${files.length - resterend} foto('s) overgeslagen (max ${state.maxFotos})`, 'warning');
    }
}

function comprimeerFoto(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxBreedte = 1200;
            const maxHoogte = 1200;
            
            let breedte = img.width;
            let hoogte = img.height;
            
            // Verhouding behouden
            if (breedte > maxBreedte) {
                hoogte = (hoogte * maxBreedte) / breedte;
                breedte = maxBreedte;
            }
            if (hoogte > maxHoogte) {
                breedte = (breedte * maxHoogte) / hoogte;
                hoogte = maxHoogte;
            }
            
            canvas.width = breedte;
            canvas.height = hoogte;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, breedte, hoogte);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateFotoPreview() {
    const container = $('#foto-preview');
    container.innerHTML = '';
    
    state.fotos.forEach((foto, index) => {
        const item = document.createElement('div');
        item.className = 'foto-preview-item';
        item.innerHTML = `
            <img src="${foto.dataUrl}" alt="Foto ${index + 1}">
            <button type="button" class="foto-remove" data-index="${index}">✕</button>
        `;
        container.appendChild(item);
    });
    
    // Verwijder knoppen
    container.querySelectorAll('.foto-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.fotos.splice(index, 1);
            updateFotoPreview();
            toonToast('Foto verwijderd', 'warning');
        });
    });
}

// === GPS Locatie ===
function initLocatie() {
    haalLocatieOp();
    
    $('#btn-locatie').addEventListener('click', () => {
        haalLocatieOp();
    });
}

function haalLocatieOp() {
    const statusEl = $('#locatie-status');
    const infoEl = $('#locatie-info');
    
    statusEl.className = 'locatie-status';
    statusEl.innerHTML = `
        <span class="locatie-icon">🔍</span>
        <span class="locatie-text">Locatie wordt opgehaald...</span>
    `;
    infoEl.classList.add('hidden');
    
    if (!navigator.geolocation) {
        statusEl.className = 'locatie-status error';
        statusEl.innerHTML = `
            <span class="locatie-icon">❌</span>
            <span class="locatie-text">GPS niet beschikbaar op dit apparaat</span>
        `;
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (positie) => {
            state.locatie = {
                lat: positie.coords.latitude,
                lng: positie.coords.longitude,
                accuracy: positie.coords.accuracy
            };
            
            statusEl.className = 'locatie-status success';
            statusEl.innerHTML = `
                <span class="locatie-icon">✅</span>
                <span class="locatie-text">Locatie succesvol opgehaald!</span>
            `;
            
            // Toon locatie details
            $('#lat-value').textContent = state.locatie.lat.toFixed(6);
            $('#lng-value').textContent = state.locatie.lng.toFixed(6);
            $('#accuracy-value').textContent = `±${Math.round(state.locatie.accuracy)} meter`;
            $('#maps-link').href = `https://www.google.com/maps?q=${state.locatie.lat},${state.locatie.lng}`;
            infoEl.classList.remove('hidden');
        },
        (error) => {
            let bericht = 'Locatie kon niet worden opgehaald';
            switch (error.code) {
                case 1:
                    bericht = 'Locatietoegang geweigerd. Sta GPS toe in uw instellingen.';
                    break;
                case 2:
                    bericht = 'Locatie niet beschikbaar. Controleer uw GPS.';
                    break;
                case 3:
                    bericht = 'Locatie-aanvraag verlopen. Probeer opnieuw.';
                    break;
            }
            
            statusEl.className = 'locatie-status error';
            statusEl.innerHTML = `
                <span class="locatie-icon">⚠️</span>
                <span class="locatie-text">${bericht}</span>
            `;
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

// === Formulier Verwerking ===
function initFormulier() {
    const form = $('#melding-form');
    
    // Formulier verzenden via e-mail
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        verzendViaEmail();
    });
    
    // Lokaal opslaan knop
    $('#btn-opslaan').addEventListener('click', () => {
        if (valideerFormulier()) {
            slaOp();
        }
    });
}

function valideerFormulier() {
    const type = document.querySelector('input[name="meldingType"]:checked');
    const naam = $('#melder-naam').value.trim();
    const prioriteit = $('#prioriteit').value;
    const beschrijving = $('#beschrijving').value.trim();
    const email = $('#email-ontvanger').value.trim();
    
    if (!type) {
        toonToast('Selecteer een type melding', 'error');
        return false;
    }
    if (!naam) {
        toonToast('Vul uw naam in', 'error');
        $('#melder-naam').focus();
        return false;
    }
    if (!prioriteit) {
        toonToast('Selecteer een prioriteit', 'error');
        $('#prioriteit').focus();
        return false;
    }
    if (!beschrijving) {
        toonToast('Vul een beschrijving in', 'error');
        $('#beschrijving').focus();
        return false;
    }
    
    return true;
}

function verzamelMeldingData() {
    const typeRadio = document.querySelector('input[name="meldingType"]:checked');
    const typeLabels = {
        'gevaarlijke-situatie': 'Gevaarlijke Situatie',
        'schade': 'Schade',
        'bijna-ongeval': 'Bijna Ongeval',
        'onveilige-handeling': 'Onveilige Handeling',
        'defect-materiaal': 'Defect Materiaal',
        'overig': 'Overig'
    };
    
    const prioriteitLabels = {
        'laag': '🟢 Laag',
        'middel': '🟡 Middel',
        'hoog': '🟠 Hoog',
        'kritiek': '🔴 Kritiek'
    };
    
    return {
        type: typeRadio ? typeRadio.value : '',
        typeLabel: typeRadio ? typeLabels[typeRadio.value] : '',
        naam: $('#melder-naam').value.trim(),
        locatieBeschrijving: $('#locatie-beschrijving').value.trim(),
        prioriteit: $('#prioriteit').value,
        prioriteitLabel: prioriteitLabels[$('#prioriteit').value] || '',
        beschrijving: $('#beschrijving').value.trim(),
        actieGenomen: $('#actie-genomen').value.trim(),
        email: $('#email-ontvanger').value.trim(),
        locatie: state.locatie,
        fotos: state.fotos,
        datum: new Date().toLocaleString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: Date.now()
    };
}

function verzendViaEmail() {
    if (!valideerFormulier()) return;
    
    const data = verzamelMeldingData();
    
    // Sla naam en e-mail op voor volgende keer
    localStorage.setItem('houtveilig-naam', data.naam);
    localStorage.setItem('houtveilig-email', data.email);
    
    // Bouw e-mail onderwerp
    const onderwerp = `[HoutVeilig] ${data.prioriteitLabel} - ${data.typeLabel} - ${data.datum}`;
    
    // Bouw e-mail body
    let body = `MELDING GEVAARLIJKE SITUATIE / SCHADE\n`;
    body += `${'='.repeat(45)}\n\n`;
    body += `📋 MELDINGSDETAILS\n`;
    body += `${'-'.repeat(30)}\n`;
    body += `Type: ${data.typeLabel}\n`;
    body += `Prioriteit: ${data.prioriteitLabel}\n`;
    body += `Datum/Tijd: ${data.datum}\n`;
    body += `Melder: ${data.naam}\n`;
    
    if (data.locatieBeschrijving) {
        body += `Locatie: ${data.locatieBeschrijving}\n`;
    }
    
    body += `\n📝 BESCHRIJVING\n`;
    body += `${'-'.repeat(30)}\n`;
    body += `${data.beschrijving}\n`;
    
    if (data.actieGenomen) {
        body += `\n✅ ACTIE ONDERNOMEN\n`;
        body += `${'-'.repeat(30)}\n`;
        body += `${data.actieGenomen}\n`;
    }
    
    if (data.locatie) {
        body += `\n📍 GPS LOCATIE\n`;
        body += `${'-'.repeat(30)}\n`;
        body += `Breedtegraad: ${data.locatie.lat.toFixed(6)}\n`;
        body += `Lengtegraad: ${data.locatie.lng.toFixed(6)}\n`;
        body += `Nauwkeurigheid: ±${Math.round(data.locatie.accuracy)} meter\n`;
        body += `Google Maps: https://www.google.com/maps?q=${data.locatie.lat},${data.locatie.lng}\n`;
    }
    
    if (data.fotos.length > 0) {
        body += `\n📷 FOTO'S\n`;
        body += `${'-'.repeat(30)}\n`;
        body += `Aantal foto's: ${data.fotos.length}\n`;
        body += `Let op: de foto's zijn als bijlage opgeslagen. Zie hieronder.\n`;
    }
    
    body += `\n${'='.repeat(45)}\n`;
    body += `Verzonden via HoutVeilig Meldingsapp\n`;
    
    // Als er foto's zijn, gebruik de Web Share API of download als alternatief
    if (data.fotos.length > 0 && navigator.canShare) {
        // Probeer Web Share API met bestanden
        deelMetFotos(data, onderwerp, body);
    } else {
        // Fallback: mailto link (zonder foto's in de e-mail zelf)
        const mailtoLink = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
        
        if (data.fotos.length > 0) {
            // Download foto's apart
            setTimeout(() => {
                toonToast('Foto\'s worden apart gedownload voor bijlage', 'warning');
                downloadFotos(data);
            }, 1000);
        }
        
        // Sla ook lokaal op
        slaOp(true);
    }
}

async function deelMetFotos(data, onderwerp, body) {
    try {
        // Converteer data URLs naar bestanden
        const bestanden = await Promise.all(
            data.fotos.map(async (foto, index) => {
                const response = await fetch(foto.dataUrl);
                const blob = await response.blob();
                return new File([blob], `melding-foto-${index + 1}.jpg`, { type: 'image/jpeg' });
            })
        );
        
        const shareData = {
            title: onderwerp,
            text: body,
            files: bestanden
        };
        
        if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toonToast('Melding succesvol gedeeld!', 'success');
            slaOp(true);
            resetFormulier();
        } else {
            // Fallback naar mailto
            const mailtoLink = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            downloadFotos(data);
            slaOp(true);
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            // Als delen mislukt, fallback naar mailto
            const mailtoLink = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            
            if (data.fotos.length > 0) {
                setTimeout(() => downloadFotos(data), 1000);
            }
            slaOp(true);
        }
    }
}

function downloadFotos(data) {
    data.fotos.forEach((foto, index) => {
        const link = document.createElement('a');
        link.download = `melding-foto-${index + 1}.jpg`;
        link.href = foto.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// === Opslaan & Laden ===
function slaOp(stil = false) {
    if (!stilValideerFormulier() && !stil) {
        if (!valideerFormulier()) return;
    }
    
    const data = verzamelMeldingData();
    data.id = Date.now();
    
    state.meldingen.unshift(data);
    
    // Bewaar in localStorage (zonder foto data URLs om ruimte te besparen)
    const opslagData = state.meldingen.map(m => ({
        ...m,
        fotos: m.fotos.map(f => ({ naam: f.naam })), // Alleen naam bewaren
        aantalFotos: m.fotos.length
    }));
    
    try {
        localStorage.setItem('houtveilig-meldingen', JSON.stringify(opslagData));
    } catch (e) {
        // localStorage kan vol zijn
        console.warn('Kon melding niet opslaan in localStorage:', e);
    }
    
    if (!stil) {
        toonToast('Melding lokaal opgeslagen! ✅', 'success');
        resetFormulier();
    }
    
    updateMeldingenOverzicht();
}

function stilValideerFormulier() {
    const type = document.querySelector('input[name="meldingType"]:checked');
    const beschrijving = $('#beschrijving').value.trim();
    return type && beschrijving;
}

function laadOpgeslagenGegevens() {
    try {
        const opgeslagen = localStorage.getItem('houtveilig-meldingen');
        if (opgeslagen) {
            state.meldingen = JSON.parse(opgeslagen);
        }
    } catch (e) {
        console.warn('Kon opgeslagen meldingen niet laden:', e);
        state.meldingen = [];
    }
}

function resetFormulier() {
    // Reset radio buttons
    $$('input[name="meldingType"]').forEach(r => r.checked = false);
    
    // Reset text inputs (behalve naam en email)
    $('#locatie-beschrijving').value = '';
    $('#prioriteit').value = '';
    $('#beschrijving').value = '';
    $('#actie-genomen').value = '';
    
    // Reset foto's
    state.fotos = [];
    updateFotoPreview();
    
    // Scroll naar boven
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === Overzicht ===
function initOverzicht() {
    $('#btn-clear-meldingen').addEventListener('click', () => {
        if (confirm('Weet u zeker dat u alle opgeslagen meldingen wilt verwijderen?')) {
            state.meldingen = [];
            localStorage.removeItem('houtveilig-meldingen');
            updateMeldingenOverzicht();
            toonToast('Alle meldingen verwijderd', 'warning');
        }
    });
    
    updateMeldingenOverzicht();
}

function updateMeldingenOverzicht() {
    const lijst = $('#meldingen-lijst');
    
    if (state.meldingen.length === 0) {
        lijst.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>Nog geen opgeslagen meldingen</p>
            </div>
        `;
        return;
    }
    
    const typeLabels = {
        'gevaarlijke-situatie': '⚠️ Gevaarlijke Situatie',
        'schade': '🔨 Schade',
        'bijna-ongeval': '🚨 Bijna Ongeval',
        'onveilige-handeling': '🖐️ Onveilige Handeling',
        'defect-materiaal': '🔧 Defect Materiaal',
        'overig': '📌 Overig'
    };
    
    lijst.innerHTML = state.meldingen.map(melding => `
        <div class="melding-card prioriteit-${melding.prioriteit}">
            <div class="melding-card-header">
                <span class="melding-card-type">${typeLabels[melding.type] || melding.type}</span>
                <span class="melding-card-datum">${melding.datum}</span>
            </div>
            <p class="melding-card-beschrijving">${escapeHtml(melding.beschrijving).substring(0, 150)}${melding.beschrijving.length > 150 ? '...' : ''}</p>
            <div class="melding-card-footer">
                <span class="melding-card-prioriteit prioriteit-badge-${melding.prioriteit}">
                    ${melding.prioriteitLabel}
                </span>
                <div class="melding-card-actions">
                    ${melding.aantalFotos ? `<span style="font-size:0.75rem;color:#757575;">📷 ${melding.aantalFotos}</span>` : ''}
                    <button class="btn btn-danger btn-small" onclick="verwijderMelding(${melding.id})">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function verwijderMelding(id) {
    state.meldingen = state.meldingen.filter(m => m.id !== id);
    try {
        localStorage.setItem('houtveilig-meldingen', JSON.stringify(state.meldingen));
    } catch (e) {
        console.warn('Fout bij opslaan:', e);
    }
    updateMeldingenOverzicht();
    toonToast('Melding verwijderd', 'warning');
}

// === Toast Notifications ===
function toonToast(bericht, type = 'info') {
    const toast = $('#toast');
    const message = $('#toast-message');
    
    // Verwijder bestaande classes
    toast.className = 'toast';
    
    message.textContent = bericht;
    
    if (type) {
        toast.classList.add(`toast-${type}`);
    }
    
    toast.classList.remove('hidden');
    
    // Trigger reflow voor animatie
    void toast.offsetWidth;
    toast.classList.add('show');
    
    // Verberg na 3 seconden
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// === Hulpfuncties ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Service Worker Registratie ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker geregistreerd:', reg.scope))
            .catch(err => console.log('Service Worker registratie mislukt:', err));
    });
}
