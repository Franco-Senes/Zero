let currentUser = null;
let current2faSecret = null;

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

const toastElement = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Notification handler
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    if (isError) {
        toastElement.firstElementChild.className = "px-6 py-4 rounded-2xl bg-red-500 text-white shadow-2xl flex items-center gap-3 border border-red-600";
    } else {
        toastElement.firstElementChild.className = "px-6 py-4 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black shadow-2xl flex items-center gap-3 border border-white/10 dark:border-black/10";
    }
    toastElement.classList.remove('translate-y-24', 'opacity-0');
    toastElement.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toastElement.classList.remove('translate-y-0', 'opacity-100');
        toastElement.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

// Theme handling
const themeToggleBtn = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

function updateThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}

themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeUI();
});

const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
updateThemeUI();

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => {
            if (content.id === `tab-${tabName}`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    });
});
// load cookies
async function loadProfile() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
            window.location.href = '/index.html';
            return;
        }
        
        currentUser = await res.json();
        
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('edit-username').value = currentUser.username;
        document.getElementById('edit-email').value = currentUser.email;
        
        if (currentUser.avatar_url) {
            document.getElementById('user-avatar').src = currentUser.avatar_url;
        } else {
            document.getElementById('user-avatar').src = generateZeroAvatar(currentUser.username);
        }

        if (currentUser.is_oauth) {
            const currentPassInput = document.getElementById('current-password');
            if (currentPassInput) {
                currentPassInput.removeAttribute('required');
                const label = currentPassInput.previousElementSibling;
                if (label) {
                    label.textContent = "Contraseña actual (opcional si entraste con Hack Club)";
                }
            }
        }
        
        init2faState();
    } catch (err) {
        window.location.href = '/index.html';
    }
}

const avatarInput = document.getElementById('avatar-input');
avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const res = await fetch('/api/user/avatar', {
            method: 'POST',
            body: formData
        });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById('user-avatar').src = data.avatar_url;
            showToast('Avatar updated successfully.');
        } else {
            const err = await res.json();
            showToast(err.error || 'Something happened while uploading the avatar', true);
        }
    } catch (err) {
        showToast('Conection error while uploading the avatar', true);
    }
});

const passwordForm = document.getElementById('password-form');
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    try {
        const res = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (res.ok) {
            passwordForm.reset();
            showToast('Password updated succesfully');
        } else {
            const err = await res.json();
            showToast(err.error || 'Error while updating password', true);
        }
    } catch (err) {
        showToast('Conextion error', true);
    }
});
// 2fa frontend handler
const twoFactorToggle = document.getElementById('2fa-toggle');
const setupSection = document.getElementById('2fa-setup-section');
const statusActive = document.getElementById('2fa-status-active');
const qrContainer = document.getElementById('2fa-qr-container');
const verificationInput = document.getElementById('2fa-verification-code');
const activateBtn = document.getElementById('2fa-activate-btn');

function init2faState() {
    if (currentUser.two_factor_enabled) {
        twoFactorToggle.checked = true;
        statusActive.classList.remove('hidden');
        setupSection.classList.add('hidden');
    } else {
        twoFactorToggle.checked = false;
        statusActive.classList.add('hidden');
        setupSection.classList.add('hidden');
    }
}

twoFactorToggle.addEventListener('change', async () => {
    if (twoFactorToggle.checked) {
        try {
            const res = await fetch('/api/user/2fa/setup', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                current2faSecret = data.secret;
                qrContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="Codigo QR 2FA" class="w-32 h-32">`;
                setupSection.classList.remove('hidden');
                statusActive.classList.add('hidden');
            } else {
                twoFactorToggle.checked = false;
                showToast('Error while starting 2fa configuration', true);
            }
        } catch (err) {
            twoFactorToggle.checked = false;
            showToast('2fa conextion error', true);
        }
    } else {
        const code = prompt('Introduce your 2fa to deactivate:');
        if (!code) {
            twoFactorToggle.checked = true;
            return;
        }
        
        try {
            const res = await fetch('/api/user/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            if (res.ok) {
                currentUser.two_factor_enabled = false;
                showToast('2fa deactivated succesfully');
                init2faState();
            } else {
                twoFactorToggle.checked = true;
                const err = await res.json();
                showToast(err.error || 'Incorrect code', true);
            }
        } catch (err) {
            twoFactorToggle.checked = true;
            showToast('Conextion error with 2fa', true);
        }
    }
});

activateBtn.addEventListener('click', async () => {
    const code = verificationInput.value;
    if (!code || !current2faSecret) return;
    
    try {
        const res = await fetch('/api/user/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: current2faSecret, code })
        });
        
        if (res.ok) {
            currentUser.two_factor_enabled = true;
            verificationInput.value = '';
            showToast('2FA activated succesfully');
            init2faState();
        } else {
            const err = await res.json();
            showToast(err.error || '2fa code invalid', true);
        }
    } catch (err) {
        showToast('2fa conextion error', true);
    }
});
// developer app handler
const createAppForm = document.getElementById('create-app-form');
const appsList = document.getElementById('developer-apps-list');
const authorizedAppsList = document.getElementById('authorized-apps-list');

async function loadDeveloperApps() {
    try {
        const res = await fetch('/api/oauth/apps');
        if (res.ok) {
            const apps = await res.json();
            if (apps.length === 0) {
                appsList.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">No tienes ninguna aplicacion registrada todavia</p>';
                return;
            }
            // developer apps template
            appsList.innerHTML = apps.map(app => {
                const appAvatar = generateZeroAvatar(app.name);
                return `
                <div class="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <img class="w-10 h-10 rounded-xl border border-black/5 dark:border-white/5 object-cover" src="${appAvatar}" alt="${app.name}">
                            <div>
                                <h3 class="text-sm font-bold text-black dark:text-white">${app.name}</h3>
                                <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Developer App</span>
                            </div>
                        </div>
                        <button onclick="deleteApp('${app.client_id}')" class="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all">
                            Eliminar
                        </button>
                    </div>
                    <div class="grid grid-cols-1 gap-3 text-xs pt-2">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                            <span class="text-zinc-500 dark:text-zinc-400 font-mono">Client ID</span>
                            <span class="font-mono text-black dark:text-white select-all">${app.client_id}</span>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                            <span class="text-zinc-500 dark:text-zinc-400 font-mono">Client Secret</span>
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-black dark:text-white inline-block blur-sm select-none" id="secret-${app.client_id}">${app.client_secret}</span>
                                <button onclick="toggleSecret('${app.client_id}', this)" class="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                    Ver
                                </button>
                                <span class="text-zinc-300 dark:text-zinc-700">|</span>
                                <button onclick="regenerateSecret('${app.client_id}')" class="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                    Regenerar
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between">
                            <span class="text-zinc-500 dark:text-zinc-400 font-mono">Redirect URI</span>
                            <span class="font-mono text-black dark:text-white">${app.redirect_uri}</span>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (err) {
        showToast('Error while loading developer apps', true);
    }
}

function toggleSecret(clientId, btn) {
    const el = document.getElementById(`secret-${clientId}`);
    if (!el) return;
    if (el.classList.contains('blur-sm')) {
        el.classList.remove('blur-sm', 'select-none');
        el.classList.add('select-all');
        if (btn) btn.textContent = 'Ocultar';
    } else {
        el.classList.add('blur-sm', 'select-none');
        el.classList.remove('select-all');
        if (btn) btn.textContent = 'Ver';
    }
}
window.toggleSecret = toggleSecret;

async function deleteApp(clientId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta aplicación? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        const res = await fetch(`/api/oauth/apps/${clientId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showToast('Aplicación eliminada correctamente');
            loadDeveloperApps();
        } else {
            const err = await res.json();
            showToast(err.error || 'Error al eliminar la aplicación', true);
        }
    } catch (err) {
        showToast('Error de conexión al eliminar la aplicación', true);
    }
}
window.deleteApp = deleteApp;

async function regenerateSecret(clientId) {
    if (!confirm('¿Estás seguro de que deseas regenerar el client secret? Cualquier integración que use el secreto actual dejará de funcionar.')) {
        return;
    }
    try {
        const res = await fetch(`/api/oauth/apps/${clientId}/regenerate-secret`, {
            method: 'POST'
        });
        if (res.ok) {
            const data = await res.json();
            showToast('Client secret regenerado correctamente');
            const el = document.getElementById(`secret-${clientId}`);
            if (el) {
                el.textContent = data.client_secret;
                el.classList.add('blur-sm', 'select-none');
                el.classList.remove('select-all');
                const btn = el.nextElementSibling;
                if (btn) btn.textContent = 'Ver';
            }
        } else {
            const err = await res.json();
            showToast(err.error || 'Error al regenerar el client secret', true);
        }
    } catch (err) {
        showToast('Error de conexión al regenerar el client secret', true);
    }
}
window.regenerateSecret = regenerateSecret;

createAppForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('app-name').value;
    const redirect_uri = document.getElementById('app-redirect-uri').value;
    
    try {
        const res = await fetch('/api/oauth/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, redirect_uri })
        });
        
        if (res.ok) {
            createAppForm.reset();
            showToast('App registered succesfully');
            loadDeveloperApps();
        } else {
            const err = await res.json();
            showToast(err.error || 'Error registering your app', true);
        }
    } catch (err) {
        showToast('Conexion error while loading your app', true);
    }
});

async function loadAuthorizedApps() {
    try {
        const res = await fetch('/api/oauth/authorized-apps');
        if (res.ok) {
            const apps = await res.json();
            if (apps.length === 0) {
                authorizedAppsList.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">No has autorizado ninguna aplicacion de terceros todavia</p>';
                return;
            }
            
            authorizedAppsList.innerHTML = apps.map(app => `
                <div class="flex items-center justify-between p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                    <div>
                        <h4 class="text-sm font-bold">${app.name}</h4>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Autorizado el: ${new Date(app.authorized_at).toLocaleDateString()}</p>
                    </div>
                    <button onclick="revokeApp('${app.client_id}')" class="px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all">
                        Revocar
                    </button>
                </div>
            `).join('');
        }
    } catch (err) {
        showToast('Error loading your authorized apps', true);
    }
}

async function revokeApp(clientId) {
    try {
        const res = await fetch(`/api/oauth/authorized-apps/${clientId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showToast('Access revoked succesfully');
            loadAuthorizedApps();
        } else {
            showToast('Error revoking access', true);
        }
    } catch (err) {
        showToast('Conexion error revoking access', true);
    }
}
window.revokeApp = revokeApp;

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            window.location.href = '/index.html';
        }
    } catch (err) {
        window.location.href = '/index.html';
    }
});

loadProfile();
loadDeveloperApps();
loadAuthorizedApps();
