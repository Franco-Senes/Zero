const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('client_id');
const redirectUri = urlParams.get('redirect_uri');
const state = urlParams.get('state');

function generateZeroAvatar(text) {
    const name = text || 'U';
    const firstLetter = name.charAt(0).toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const gradients = [
        ['#000000', '#27272a'],
        ['#09090b', '#71717a'],
        ['#27272a', '#a1a1aa'],
        ['#18181b', '#3f3f46'],
        ['#52525b', '#09090b'],
        ['#71717a', '#18181b'],
        ['#e4e4e7', '#71717a'],
        ['#f4f4f5', '#a1a1aa']
    ];
    
    const index = Math.abs(hash) % gradients.length;
    const colors = gradients[index];
    const textColor = index >= 6 ? '#000000' : '#ffffff';
    
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <defs>
                <linearGradient id="grad-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grad-${index})" />
            <text x="50%" y="54%" 
                  dominant-baseline="middle" 
                  text-anchor="middle" 
                  fill="${textColor}" 
                  font-family="'Syne', 'Inter', sans-serif" 
                  font-weight="800" 
                  font-size="44" 
                  style="user-select: none;">${firstLetter}</text>
        </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


const appIcon = document.getElementById('app-icon');
const appNameDisplay = document.getElementById('app-name-display');
const authorizeBtn = document.getElementById('authorize-btn');
const cancelBtn = document.getElementById('cancel-btn');

if (!clientId || !redirectUri) {
    document.body.innerHTML = `
        <div class="text-center p-8 max-w-[400px] rounded-3xl border border-red-500/20 bg-red-500/10 text-red-600">
            <h1 class="text-lg font-bold">400 - Invalid Oauth parameters</h1>
            <p class="text-sm mt-2">The parameters for the OAuth are invalid. Contact the app developer to fix it.</p>
        </div>
    `;
} else {
    loadAppDetails();
}

async function loadAppDetails() {
    try {
        const res = await fetch(`/api/oauth/apps/${clientId}`);
        if (!res.ok) {
            document.body.innerHTML = `
                <div class="text-center p-8 max-w-[400px] rounded-3xl border border-red-500/20 bg-red-500/10 text-red-600">
                    <h1 class="text-lg font-bold">404 - App wasnt found</h1>
                    <p class="text-sm mt-2">The app your are wishing access is not in our database. Contact the developer to fix it.</p>
                </div>
            `;
            return;
        }
        
        const app = await res.json();
        
        appNameDisplay.textContent = app.name;
        if (appIcon) {
            appIcon.src = generateZeroAvatar(app.name);
        }
    } catch (err) {
        appNameDisplay.textContent = 'Error while loading';
    }
}

authorizeBtn.addEventListener('click', () => submitConsent('allow'));
cancelBtn.addEventListener('click', () => submitConsent('cancel'));

async function submitConsent(action) {
    try {
        authorizeBtn.disabled = true;
        cancelBtn.disabled = true;
        
        const res = await fetch('/oauth/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state || '',
                action: action
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } else {
            const err = await res.json();
            alert(err.error || 'Error while submiting consent');
            authorizeBtn.disabled = false;
            cancelBtn.disabled = false;
        }
    } catch (err) {
        authorizeBtn.disabled = false;
        cancelBtn.disabled = false;
    }
}
