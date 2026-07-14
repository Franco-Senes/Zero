const navbarContainer = document.getElementById('navbar-container');
const mainNav = document.getElementById('main-nav');
const loginDesktopContainer = document.getElementById('login-desktop-container');
const loginMobileContainer = document.getElementById('login-mobile-container');
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const authFeedback = document.getElementById('auth-feedback');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const socialBtns = document.querySelectorAll('.social-oauth-btn');
const oauthLoadingModal = document.getElementById('oauth-loading-modal');
const oauthLoadingText = document.getElementById('oauth-loading-text');

const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const line1 = document.getElementById('line-1');
const line2 = document.getElementById('line-2');
const line3 = document.getElementById('line-3');

const themeToggle = document.getElementById('theme-toggle');
const hamburgerLines = document.querySelectorAll('#menu-toggle span');

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


let isDarkMode = false;
let isMenuOpen = false;
let userHasToggled = false;

const translations = {
    es: {
        placeholder_2fa_code: "Codigo de 2FA",
        btn_login_2fa: "Iniciar sesion con 2FA",
        back_to_classic: "Volver al inicio de sesion clasico",
        nav_home: "Inicio",
        nav_login: "Acceder",
        login_title: "Iniciar sesion",
        email_label: "Correo electronico",
        pass_label: "Contraseña",
        forgot_password: "¿Olvidaste tu contraseña?",
        login_submit_btn: "Iniciar sesion",
        register_submit_btn: "Registrarse y acceder",
        or_divider: "o",
        secure_connection: "Conexion segura SSL.",
        login_error_wrong_pass: "Contraseña incorrecta.",
        login_prompt_create: "Esta cuenta no existe. ¿Deseas crearla ahora?",
        login_create_btn: "Crear cuenta",
        toast_login_success: "Sesion iniciada",
        toast_register_success: "Cuenta creada",
        toast_logout_success: "Sesion cerrada",
        oauth_simulating: "Conectando con {platform}...",
        logout_nav: "Cerrar sesion",
        nav_projects: "Proyectos",
        nav_hackathons: "Hackatons",
        nav_technologies: "Tecnologias",
        nav_contact: "Contacto",

        weather_title: "Clima en Santa Cruz",
        weather_sunny: "Soleado",
        weather_clear: "Despejado",
        weather_cloudy: "Nublado",
        weather_fog: "Niebla",
        weather_rain: "Lluvia",
        weather_snow: "Nieve",
        weather_showers: "Chubascos",
        weather_storm: "Tormenta",
        weather_partially_sunny: "Soleado",
        weather_connecting: "Cargando...",

        discord_sync: "Discord Sync",

        hero_bio: 'Tengo 13 años y hago paginas web en Santa Cruz, Bolivia. Me gusta usar Node.js, Python, HTML, CSS, JavaScript y Markdown.',
        hero_github_text: "Mi GitHub",
        hero_contact_btn: "Escribeme",

        projects_subtitle: "MI TRABAJO",
        projects_title: "Mis proyectos",
        projects_desc: "Aca estan las cosas que he hecho.",

        hackathons_subtitle: "MIS COMPETENCIAS",
        hackathons_title: "Hackatons",
        hackathons_desc: "Competencias de programacion en las que quiero participar.",
        hackathons_empty_title: "Buscando mi primer torneo",
        hackathons_empty_desc: "No he participado en hackatons todavia, pero estoy aprendiendo mucho programando y resolviendo problemas. Pronto me unire a una.",

        tech_subtitle: "LO QUE USO",
        tech_title: "Tecnologias",
        tech_desc_node: "Backend y Javascript",
        tech_desc_python: "Programacion y automatizacion",
        tech_desc_html: "Hacer paginas",
        tech_desc_js: "Hacer que las cosas se muevan",
        tech_desc_markdown: "Para escribir textos",
        tech_desc_git: "Para guardar mi codigo",
        tech_desc_sqlite: "Bases de datos sencillas",
        tech_desc_tailwind: "Para diseñar rapido",

        contact_subtitle: "Escribeme",
        contact_title: "Contacto",
        contact_name_label: "Tu nombre",
        contact_name_placeholder: "Escribe tu nombre aca",
        contact_email_label: "Tu correo",
        contact_email_placeholder: "tu@correo.com",
        contact_message_label: "Tu mensaje",
        contact_message_placeholder: "Escribe lo que quieras decirme...",
        contact_submit_btn: "Enviar",

        toast_success: "Mensaje enviado, te respondere pronto",

        footer_credits: "Zero Portafolio - Hecho por Franco",
        footer_back_to_top: "Volver arriba"
    },
    en: {
        placeholder_2fa_code: "2FA Code",
        btn_login_2fa: "Log in with 2FA",
        back_to_classic: "Back to classic login",
        nav_home: "Home",
        nav_login: "Login",
        login_title: "Sign In",
        email_label: "Email Address",
        pass_label: "Password",
        forgot_password: "Forgot your password?",
        login_submit_btn: "Sign In",
        register_submit_btn: "Sign Up & Login",
        or_divider: "o",
        secure_connection: "End-to-end SSL encrypted connection.",
        login_error_wrong_pass: "Incorrect password.",
        login_prompt_create: "This account does not exist. Do you want to create it now?",
        login_create_btn: "Create Account",
        toast_login_success: "Logged in successfully!",
        toast_register_success: "Account created and logged in successfully!",
        toast_logout_success: "Logged out successfully.",
        oauth_simulating: "Connecting securely with {platform}...",
        logout_nav: "Logout",
        nav_projects: "Projects",
        nav_hackathons: "Hackathons",
        nav_technologies: "Technologies",
        nav_contact: "Contact",

        weather_title: "Santa Cruz weather",
        weather_sunny: "Sunny",
        weather_clear: "Clear",
        weather_cloudy: "Partially Cloudy",
        weather_fog: "Fog",
        weather_rain: "Rain",
        weather_snow: "Snow",
        weather_showers: "Rain Showers",
        weather_storm: "Thunderstorm",
        weather_partially_sunny: "Partially Sunny",
        weather_connecting: "Connecting...",

        discord_sync: "Discord Sync",

        hero_bio: 'I am 13 years old and I make web pages in Santa Cruz, Bolivia. I like using Node.js, Python, HTML, CSS, JavaScript, and Markdown.',
        hero_github_text: "My GitHub",
        hero_contact_btn: "Write to me",

        projects_subtitle: "MY WORK",
        projects_title: "My Projects",
        projects_desc: "Here are the things I have made.",

        hackathons_subtitle: "MY COMPETITIONS",
        hackathons_title: "Hackathons",
        hackathons_desc: "Programming contests I want to join.",
        hackathons_empty_title: "Looking for my first contest",
        hackathons_empty_desc: "I have not joined a hackathon yet, but I am learning a lot by writing code and solving problems. I will join one soon!",

        tech_subtitle: "WHAT I USE",
        tech_title: "Technologies",
        tech_desc_node: "Backend and Javascript",
        tech_desc_python: "Coding and automation",
        tech_desc_html: "Making web pages",
        tech_desc_js: "Making things move",
        tech_desc_markdown: "Writing text files",
        tech_desc_git: "Saving my code",
        tech_desc_sqlite: "Simple databases",
        tech_desc_tailwind: "Fast designs",

        contact_subtitle: "Write to me",
        contact_title: "Contact",
        contact_name_label: "Your name",
        contact_name_placeholder: "Write your name here",
        contact_email_label: "Your email",
        contact_email_placeholder: "you@email.com",
        contact_message_label: "Your message",
        contact_message_placeholder: "Write anything you want to tell me...",
        contact_submit_btn: "Send",

        toast_success: "Message sent, I will reply soon",

        footer_credits: "Zero Portfolio - Made by Franco",
        footer_back_to_top: "Go back to top"
    }
};

let currentLanguage = localStorage.getItem('language') || 'es';

function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.setAttribute('placeholder', translations[lang][key]);
        }
    });

    const indicators = {
        es: [document.getElementById('lang-es-indicator'), document.getElementById('mobile-lang-es-indicator')],
        en: [document.getElementById('lang-en-indicator'), document.getElementById('mobile-lang-en-indicator')]
    };

    if (lang === 'es') {
        indicators.es.forEach(ind => {
            if (ind) ind.className = "text-black dark:text-white font-black";
        });
        indicators.en.forEach(ind => {
            if (ind) ind.className = "text-zinc-400 dark:text-zinc-600 font-medium";
        });
    } else {
        indicators.es.forEach(ind => {
            if (ind) ind.className = "text-zinc-400 dark:text-zinc-600 font-medium";
        });
        indicators.en.forEach(ind => {
            if (ind) ind.className = "text-black dark:text-white font-black";
        });
    }

    if (window.lastWeatherData) {
        const tempElement = document.getElementById('weather-temp');
        if (tempElement) {
            const condText = translations[lang][window.lastWeatherData.conditionKey] || window.lastWeatherData.conditionKey;
            tempElement.textContent = `${window.lastWeatherData.temp}°C • ${condText}`;
        }
    }

    if (typeof fetchGitHubProjects === 'function') {
        fetchGitHubProjects();
    }
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
}

const languageToggle = document.getElementById('language-toggle');
const mobileLanguageToggle = document.getElementById('mobile-language-toggle');

if (languageToggle) {
    languageToggle.addEventListener('click', () => {
        const nextLang = currentLanguage === 'es' ? 'en' : 'es';
        updateLanguage(nextLang);
    });
}

if (mobileLanguageToggle) {
    mobileLanguageToggle.addEventListener('click', () => {
        const nextLang = currentLanguage === 'es' ? 'en' : 'es';
        updateLanguage(nextLang);
    });
}

function setTheme(dark) {
    isDarkMode = dark;

    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('zero_theme', 'dark');
        themeToggle.classList.remove('hover:bg-black/5');
        themeToggle.classList.add('dark:hover:bg-white/10');
        menuToggle.classList.remove('hover:bg-black/5');
        menuToggle.classList.add('dark:hover:bg-white/10');

        hamburgerLines.forEach(line => {
            line.classList.remove('bg-black');
            line.classList.add('dark:bg-white');
        });
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('zero_theme', 'light');
        themeToggle.classList.remove('dark:hover:bg-white/10');
        themeToggle.classList.add('hover:bg-black/5');
        menuToggle.classList.remove('dark:hover:bg-white/10');
        menuToggle.classList.add('hover:bg-black/5');

        hamburgerLines.forEach(line => {
            line.classList.remove('dark:bg-white');
            line.classList.add('bg-black');
        });
    }

    if (typeof handleScroll === 'function') {
        handleScroll();
    }
}

const savedTheme = localStorage.getItem('zero_theme');
const systemHour = new Date().getHours();
const initialDark = savedTheme ? (savedTheme === 'dark') : (systemHour < 6 || systemHour >= 18);
setTheme(initialDark);

themeToggle.addEventListener('click', () => {
    userHasToggled = true;
    setTheme(!isDarkMode);
});

function handleScroll() {
    const scrollY = window.scrollY;
    const threshold = 60;

    if (scrollY > threshold) {
        navbarContainer.classList.remove('top-0', 'px-0');
        navbarContainer.classList.add('top-6', 'px-4');

        mainNav.className = "transition-navbar w-full max-w-5xl h-20 rounded-full px-6 sm:px-10 border-0 flex items-center justify-between shadow-inner";

        if (isDarkMode) {
            mainNav.classList.add('bg-zinc-950/55', 'backdrop-blur-[24px]', 'saturate-[180%]', 'shadow-[0_12px_40px_rgba(0,0,0,0.95)]');
        } else {
            mainNav.classList.add('bg-white/60', 'backdrop-blur-[24px]', 'saturate-[180%]', 'shadow-[0_12px_40px_rgba(0,0,0,0.08)]');
        }
    } else {
        navbarContainer.classList.remove('top-6', 'px-4');
        navbarContainer.classList.add('top-0', 'px-0');

        mainNav.className = "transition-navbar w-full max-w-full h-24 rounded-none px-8 sm:px-16 flex items-center justify-between";

        if (isDarkMode) {
            mainNav.classList.add('border-b', 'border-white/5', 'bg-black/40', 'backdrop-blur-md');
        } else {
            mainNav.classList.add('border-b', 'border-black/5', 'bg-white/40', 'backdrop-blur-md');
        }
    }
}

window.addEventListener('scroll', handleScroll);
handleScroll();

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('opacity-100', 'pointer-events-auto');

        line1.classList.add('rotate-45', 'translate-y-[6px]', '-translate-x-[2px]');
        line2.classList.add('opacity-0', 'translate-x-4');
        line3.classList.add('-rotate-45', '-translate-y-[6px]', '-translate-x-[2px]');

        document.body.classList.add('overflow-hidden');
    } else {
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');

        line1.classList.remove('rotate-45', 'translate-y-[6px]', '-translate-x-[2px]');
        line2.classList.remove('opacity-0', 'translate-x-4');
        line3.classList.remove('-rotate-45', '-translate-y-[6px]', '-translate-x-[2px]');

        document.body.classList.remove('overflow-hidden');
    }
}

menuToggle.addEventListener('click', toggleMenu);

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (isMenuOpen) toggleMenu();
    });
});

async function fetchWeather() {
    const tempElement = document.getElementById('weather-temp');
    const iconPlaceholder = document.getElementById('weather-icon-placeholder');
    if (!tempElement) return;

    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-17.7833&longitude=-63.1833&current_weather=true");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const weathercode = data.current_weather.weathercode;
        const isDay = data.current_weather.is_day;

        let icon = '⛅';
        let conditionKey = 'weather_partially_sunny';

        if (weathercode === 0) {
            icon = isDay ? '☀️' : '🌙';
            conditionKey = isDay ? 'weather_sunny' : 'weather_clear';
        } else if ([1, 2, 3].includes(weathercode)) {
            icon = '⛅';
            conditionKey = 'weather_partially_sunny';
        } else if ([45, 48].includes(weathercode)) {
            icon = '🌫️';
            conditionKey = 'weather_fog';
        } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weathercode)) {
            icon = '🌧️';
            conditionKey = 'weather_rain';
        } else if ([71, 73, 75, 77, 85, 86].includes(weathercode)) {
            icon = '❄️';
            conditionKey = 'weather_snow';
        } else if ([95, 96, 99].includes(weathercode)) {
            icon = '⚡';
            conditionKey = 'weather_storm';
        }

        window.lastWeatherData = { temp, icon, conditionKey };
        const conditionText = translations[currentLanguage][conditionKey] || conditionKey;
        tempElement.textContent = `${temp}°C • ${conditionText}`;
        iconPlaceholder.textContent = icon;

        if (!userHasToggled) {
            const isNight = isDay === 0;
            const isStormyOrRainy = weathercode >= 51;
            setTheme(isNight || isStormyOrRainy);
        }
    } catch (error) {
        window.lastWeatherData = { temp: 26, icon: '⛅', conditionKey: 'weather_partially_sunny' };
        const conditionText = translations[currentLanguage]['weather_partially_sunny'] || 'Soleado';
        tempElement.textContent = `26°C • ${conditionText}`;
        iconPlaceholder.textContent = '⛅';
    }
}

fetchWeather();

const MI_DISCORD_ID_POR_DEFECTO = "972304132310437940";
let activeDiscordId = MI_DISCORD_ID_POR_DEFECTO;
let isListeningLive = false;

const songTitleElement = document.getElementById('song-title');
const songArtistElement = document.getElementById('song-artist');
const playerPlatformBadge = document.getElementById('player-platform-badge');
const ytmusicCard = document.getElementById('ytmusic-card');

const eqBars = [
    document.getElementById('eq-bar-1'),
    document.getElementById('eq-bar-2'),
    document.getElementById('eq-bar-3'),
    document.getElementById('eq-bar-4')
];

async function fetchLanyardPresence() {
    if (!activeDiscordId) return;

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${activeDiscordId}`);
        if (!response.ok) throw new Error();

        const resJson = await response.json();
        if (!resJson.success) throw new Error();

        const data = resJson.data;

        if (data.listening_to_spotify && data.spotify) {
            if (ytmusicCard) ytmusicCard.classList.remove('hidden');
            switchToLiveState(
                data.spotify.song,
                data.spotify.artist,
                currentLanguage === 'es' ? "SPOTIFY" : "SPOTIFY PLAYER",
                "text-spotify",
                "bg-spotify",
                "#1DB954"
            );
            return;
        }

        const ytMusicActivity = data.activities.find(act =>
            act.name.toLowerCase().includes('youtube music') ||
            act.name.toLowerCase().includes('yt music')
        );

        if (ytMusicActivity) {
            if (ytmusicCard) ytmusicCard.classList.remove('hidden');
            switchToLiveState(
                ytMusicActivity.details || (currentLanguage === 'es' ? "Escuchando" : "Listening"),
                ytMusicActivity.state || "YouTube Music",
                currentLanguage === 'es' ? "YT MUSIC" : "YT MUSIC LIVE",
                "text-red-500",
                "bg-red-500",
                "#FF0000"
            );
            return;
        }

        isListeningLive = false;
        if (ytmusicCard) ytmusicCard.classList.add('hidden');

    } catch (err) {
        isListeningLive = false;
        if (ytmusicCard) ytmusicCard.classList.add('hidden');
    }
}

function switchToLiveState(songName, artistName, platformName, textColorClass, bgColorClass, hexColor) {
    isListeningLive = true;

    if (songTitleElement) songTitleElement.textContent = songName;
    if (songArtistElement) songArtistElement.textContent = artistName;
    if (playerPlatformBadge) {
        playerPlatformBadge.textContent = platformName;
        playerPlatformBadge.className = `text-[9px] font-mono tracking-widest ${textColorClass} uppercase font-bold block`;
    }

    eqBars.forEach((bar, index) => {
        if (bar) {
            bar.style.backgroundColor = hexColor;
            bar.className = `w-[3px] rounded-full eq-bar-active-${index + 1}`;
        }
    });
}

updateLanguage(currentLanguage);
fetchLanyardPresence();
setInterval(fetchLanyardPresence, 3000);

async function fetchGitHubProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    const repoUrl = 'https://api.github.com/repos/Franco-Senes/Zeroagent';

    let stars = 0;
    let forks = 0;

    try {
        const response = await fetch(repoUrl);
        if (response.ok) {
            const data = await response.json();
            stars = data.stargazers_count;
            forks = data.forks_count;
        }
    } catch (error) {
        console.warn("Error GitHub");
    }

    renderFeaturedProject(stars, forks);
}

function renderFeaturedProject(stars, forks) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const isEs = currentLanguage === 'es';
    const starsText = isEs ? `${stars} estrellas` : `${stars} stars`;
    const codeType = isEs ? 'Codigo Abierto' : 'Open Source';
    const githubLink = isEs ? 'Ver en GitHub &rarr;' : 'View on GitHub &rarr;';
    const supportedParams = isEs ? 'Parametros Soportados' : 'Supported Parameters';

    const desc = isEs
        ? 'Una potente y veloz libreria de Python diseñada para crear agentes de inteligencia artificial y chatbots conversacionales en tiempo record con configuraciones modulares y adaptativas.'
        : 'A powerful and fast Python library designed to build artificial intelligence agents and conversational chatbots in record time with modular and adaptive configurations.';

    const specs = isEs
        ? `
                                <div class="flex items-start gap-2.5 text-xs">
                                    <span class="text-green-500 select-none mt-0.5">&bull;</span>
                                    <p class="text-zinc-500 dark:text-zinc-400">
                                        <strong class="text-black dark:text-white font-semibold">Memoria Inteligente (.zr):</strong> Guarda automaticamente el historial de conversaciones estructurando y generando un titulo inteligente de hasta 5 palabras por conversacion.
                                    </p>
                                </div>
                                <div class="flex items-start gap-2.5 text-xs">
                                    <span class="text-green-500 select-none mt-0.5">&bull;</span>
                                    <p class="text-zinc-500 dark:text-zinc-400">
                                        <strong class="text-black dark:text-white font-semibold">Configuracion Dinamica (Settings.zr):</strong> Administra y edita de forma sencilla el modelo, los tokens y todos los parametros fundamentales del agente.
                                    </p>
                                </div>
                `
        : `
                                <div class="flex items-start gap-2.5 text-xs">
                                    <span class="text-green-500 select-none mt-0.5">&bull;</span>
                                    <p class="text-zinc-500 dark:text-zinc-400">
                                        <strong class="text-black dark:text-white font-semibold">Smart Memory (.zr):</strong> Automatically saves conversation history, structuring and generating a smart title of up to 5 words per conversation.
                                    </p>
                                </div>
                                <div class="flex items-start gap-2.5 text-xs">
                                    <span class="text-green-500 select-none mt-0.5">&bull;</span>
                                    <p class="text-zinc-500 dark:text-zinc-400">
                                        <strong class="text-black dark:text-white font-semibold">Dynamic Configuration (Settings.zr):</strong> Easily manages and edits the model, tokens, and all key parameters of the agent.
                                    </p>
                                </div>
                `;

    const comment1 = isEs ? 'Cargar configuraciones del archivo Settings.zr' : 'Load configuration from Settings.zr file';
    const comment2 = isEs ? 'Personalizar sistema' : 'Customize system instruction';
    const comment3 = isEs ? 'Activar herramientas de Google' : 'Enable Google Search integration';
    const comment4 = isEs ? 'Iniciar nueva sesion con memoria' : 'Start new session with active memory';
    const comment5 = isEs ? 'Enviar y recibir stream en consola' : 'Send message and stream response to console';
    const chatPrompt = isEs ? 'Hola, ¿quien eres?' : 'Hello, who are you?';
    const piratePrompt = isEs ? 'Eres un pirata simpatico...' : 'You are a friendly pirate...';

    const featuredHTML = `
                <div class="p-8 sm:p-10 rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950/40 relative overflow-hidden flex flex-col lg:flex-row gap-8 items-stretch justify-between transition-all duration-300 hover:border-black/20 dark:hover:border-white/20">
                    
                    <div class="lg:w-1/2 flex flex-col justify-between text-left">
                        <div>
                            <div class="flex flex-wrap items-center gap-2 mb-6">
                                <span class="text-xs font-mono tracking-wider px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">PYTHON</span>
                                <span class="text-xs font-mono tracking-wider px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">MADE IN BOLIVIA</span>
                            </div>
                            
                            <h3 class="text-3xl sm:text-4xl font-black font-syne uppercase mb-4 text-black dark:text-white">Zeroagent</h3>
                            <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm mb-6">
                                ${desc}
                            </p>

                            <div class="space-y-3 mb-8">
                                ${specs}
                            </div>

                            <div class="mb-8">
                                <h4 class="text-xs font-mono tracking-widest text-zinc-400 uppercase mb-3">${supportedParams}</h4>
                                <div class="flex flex-wrap gap-2">
                                    <span class="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-zinc-500 dark:text-zinc-400">System_Instruction</span>
                                    <span class="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-zinc-500 dark:text-zinc-400">Model</span>
                                    <span class="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-zinc-500 dark:text-zinc-400">API_Key</span>
                                    <span class="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-zinc-500 dark:text-zinc-400">Memory</span>
                                    <span class="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-zinc-500 dark:text-zinc-400">Request_Delay</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-6 pt-4 border-t border-black/5 dark:border-white/5">
                            <span class="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <svg class="w-4 h-4 fill-current text-yellow-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                ${starsText}
                            </span>
                            <span class="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 fill-current text-zinc-400" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                                ${codeType}
                            </span>
                            <a href="https://github.com/Franco-Senes/Zeroagent" target="_blank" rel="noopener noreferrer" class="text-xs font-mono text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors underline decoration-dotted font-semibold">
                                ${githubLink}
                            </a>
                        </div>
                    </div>

                    <div class="lg:w-1/2 flex flex-col justify-center">
                        <div class="w-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden text-left flex flex-col h-full min-h-[350px]">
                            <div class="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                                    <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                                    <span class="w-3 h-3 rounded-full bg-green-500/80"></span>
                                </div>
                                <span class="text-[10px] font-mono text-zinc-500">example.py</span>
                                <div class="w-12"></div>
                            </div>
                            
                            <div class="p-6 overflow-auto font-mono text-xs leading-relaxed text-zinc-400 bg-zinc-950/80 grow select-all">
                                <span class="text-purple-400">import</span> Agent<br><br>
                                <span class="text-zinc-500">${comment1}</span><br>
                                Agent.LoadAll()<br><br>
                                <span class="text-zinc-500">${comment2}</span><br>
                                Agent.System_Instruction = <span class="text-green-300">"${piratePrompt}"</span><br><br>
                                <span class="text-zinc-500 font-medium">${comment3}</span><br>
                                Agent.Google_Search_Tool = <span class="text-blue-400">True</span><br><br>
                                <span class="text-zinc-500">${comment4}</span><br>
                                Agent.New_Conversation()<br><br>
                                <span class="text-zinc-500">${comment5}</span><br>
                                stream = Agent.Create_Chat(<span class="text-green-300">"${chatPrompt}"</span>, stream=<span class="text-blue-400">True</span>)<br>
                                <span class="text-purple-400">for</span> chunk <span class="text-purple-400">in</span> stream:<br>
                                &nbsp;&nbsp;&nbsp;&nbsp;print(chunk, end="", flush=True)
                            </div>
                        </div>
                    </div>
                </div>
            `;
    grid.innerHTML = featuredHTML;
    bindSmoothScroll();
}

fetchGitHubProjects();

function bindSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
        anchor.addEventListener('click', handleAnchorClick);
    });
}

function handleAnchorClick(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#' || !targetId.startsWith('#')) return;

    e.preventDefault();
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
        if (isMenuOpen) toggleMenu();

        const navbarOffset = 90;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

bindSmoothScroll();

const contactForm = document.getElementById('contact-form');
const toast = document.getElementById('toast');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactForm.reset();

    toast.classList.remove('opacity-0', 'translate-y-24', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-24', 'pointer-events-none');
    }, 4000);
});

let isRegisteringMode = false;
let is2faOnlyMode = false;

function showToast(messageKey) {
    const toastElement = document.getElementById('toast');
    const toastMsgElement = document.getElementById('toast-message');
    const translatedText = translations[currentLanguage][messageKey] || messageKey;
    toastMsgElement.textContent = translatedText;
    toastElement.classList.remove('opacity-0', 'translate-y-24', 'pointer-events-none');
    toastElement.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toastElement.classList.remove('opacity-100', 'translate-y-0');
        toastElement.classList.add('opacity-0', 'translate-y-24', 'pointer-events-none');
    }, 4000);
}

async function updateAuthUI() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            const loggedUser = data.email;
            const initials = (data.username || loggedUser).slice(0, 2).toUpperCase();

            let avatarHTML = `<img src="${generateZeroAvatar(data.username || loggedUser)}" class="w-10 h-10 rounded-full object-cover">`;
            if (data.avatar_url) {
                avatarHTML = `<img src="${data.avatar_url}" class="w-10 h-10 rounded-full object-cover">`;
            }

            const desktopHTML = `
                <div class="relative group">
                    <button class="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black font-black flex items-center justify-center text-sm border border-black/10 dark:border-white/10 hover:opacity-90 transition-all focus:outline-none overflow-hidden" aria-label="Usuario">
                        ${avatarHTML}
                    </button>
                    <div class="absolute right-0 mt-2 w-48 rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-2xl py-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 z-50 origin-top-right before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2">
                        <div class="px-4 py-2 border-b border-black/5 dark:border-white/5 text-[10px] font-mono text-zinc-400 truncate">${data.username || loggedUser}</div>
                        <a href="/auth/account.html" class="w-full text-left px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            Ajustes
                        </a>
                        <button onclick="handleLogout()" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <span data-i18n="logout_nav">${translations[currentLanguage]['logout_nav']}</span>
                        </button>
                    </div>
                </div>
            `;
            const mobileHTML = `
                <div class="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <span class="text-xs font-mono text-zinc-400">${data.username || loggedUser}</span>
                    <div class="flex flex-wrap justify-center gap-2">
                        <a href="/auth/account.html" class="px-6 py-2.5 rounded-full border border-black/10 dark:border-white/10 text-sm font-semibold transition-all">
                            Ajustes
                        </a>
                        <button onclick="handleLogout()" class="px-6 py-2.5 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500/5 text-sm font-semibold transition-all">
                            ${translations[currentLanguage]['logout_nav']}
                        </button>
                    </div>
                </div>
            `;
            if (loginDesktopContainer) loginDesktopContainer.innerHTML = desktopHTML;
            if (loginMobileContainer) loginMobileContainer.innerHTML = mobileHTML;
        } else {
            showLoginButtons();
        }
    } catch (err) {
        showLoginButtons();
    }
}

function showLoginButtons() {
    const desktopHTML = `
        <button id="login-nav-btn" class="px-5 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs font-bold tracking-wider hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 focus:outline-none uppercase" data-i18n="nav_login">
            ${translations[currentLanguage]['nav_login']}
        </button>
    `;
    const mobileHTML = `
        <button id="login-mobile-btn" class="mt-4 px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-bold transition-all focus:outline-none uppercase" data-i18n="nav_login">
            ${translations[currentLanguage]['nav_login']}
        </button>
    `;
    if (loginDesktopContainer) {
        loginDesktopContainer.innerHTML = desktopHTML;
        const btn = document.getElementById('login-nav-btn');
        if (btn) btn.addEventListener('click', openModal);
    }
    if (loginMobileContainer) {
        loginMobileContainer.innerHTML = mobileHTML;
        const btn = document.getElementById('login-mobile-btn');
        if (btn) btn.addEventListener('click', openModal);
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        updateAuthUI();
        showToast('toast_logout_success');
    } catch (err) {
        showToast('Error al cerrar sesion.');
    }
}

window.handleLogout = handleLogout;

function set2faOnlyMode(active) {
    is2faOnlyMode = active;
    const passwordContainer = document.getElementById('auth-password-container');
    const container = document.getElementById('auth-2fa-container');
    const codeInput = document.getElementById('auth-2fa-code');
    const backBtn = document.getElementById('back-to-classic-btn');
    const forgotLink = document.getElementById('forgot-password-link');
    const socialContainer = document.getElementById('oauth-social-container');

    if (active) {
        if (passwordContainer) passwordContainer.classList.add('hidden');
        authPassword.required = false;
        authPassword.value = '';

        if (container) container.classList.remove('hidden');
        if (codeInput) {
            codeInput.required = true;
            codeInput.value = '';
        }

        if (backBtn) backBtn.classList.remove('hidden');
        if (forgotLink) forgotLink.classList.add('hidden');
        if (socialContainer) socialContainer.classList.add('hidden');

        authSubmitBtn.innerHTML = `
            <img class="w-4 h-4 shrink-0" src="https://icons.hackclub.com/api/icons/white/private">
            <span data-i18n="btn_login_2fa">${translations[currentLanguage]['btn_login_2fa']}</span>
        `;
    } else {
        if (passwordContainer) passwordContainer.classList.remove('hidden');
        authPassword.required = true;

        if (container) container.classList.add('hidden');
        if (codeInput) {
            codeInput.required = false;
            codeInput.value = '';
        }

        if (backBtn) backBtn.classList.add('hidden');
        if (forgotLink) forgotLink.classList.remove('hidden');
        if (socialContainer) socialContainer.classList.remove('hidden');

        const btnTextKey = isRegisteringMode ? 'register_submit_btn' : 'login_submit_btn';
        authSubmitBtn.innerHTML = `
            <img class="w-4 h-4 shrink-0" src="https://icons.hackclub.com/api/icons/white/private">
            <span data-i18n="${btnTextKey}">${translations[currentLanguage][btnTextKey]}</span>
        `;
    }

    authFeedback.innerHTML = '';
    authFeedback.classList.add('hidden');
}

function openModal() {
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    authFeedback.innerHTML = '';
    authFeedback.classList.add('hidden');
    authForm.reset();
    setRegisterMode(false);

    const container = document.getElementById('auth-2fa-container');
    const codeInput = document.getElementById('auth-2fa-code');
    if (container) container.classList.add('hidden');
    if (codeInput) {
        codeInput.required = false;
        codeInput.value = '';
    }

    set2faOnlyMode(false);
}

function closeModal() {
    authModal.classList.add('hidden');
    authModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
}

if (closeAuthModal) closeAuthModal.addEventListener('click', closeModal);
if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });
}

const toggle2faLoginBtn = document.getElementById('2fa-login-toggle-btn');
const backToClassicBtn = document.getElementById('back-to-classic-btn');

if (toggle2faLoginBtn) {
    toggle2faLoginBtn.addEventListener('click', () => {
        set2faOnlyMode(true);
    });
}

if (backToClassicBtn) {
    backToClassicBtn.addEventListener('click', () => {
        set2faOnlyMode(false);
    });
}

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = authPassword.type === 'password' ? 'text' : 'password';
        authPassword.type = type;
        const path1 = document.getElementById('eye-open-path');
        const path2 = document.getElementById('eye-closed-path');
        if (type === 'text') {
            if (path1) path1.classList.add('hidden');
            if (path2) path2.classList.remove('hidden');
        } else {
            if (path1) path1.classList.remove('hidden');
            if (path2) path2.classList.add('hidden');
        }
    });
}

function setRegisterMode(mode) {
    isRegisteringMode = mode;
    if (mode) {
        authSubmitBtn.textContent = translations[currentLanguage]['register_submit_btn'];
        authSubmitBtn.setAttribute('data-i18n', 'register_submit_btn');
    } else {
        authSubmitBtn.textContent = translations[currentLanguage]['login_submit_btn'];
        authSubmitBtn.setAttribute('data-i18n', 'login_submit_btn');
    }
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value;
        const codeInput = document.getElementById('auth-2fa-code');
        const code = codeInput ? codeInput.value.trim() : '';

        if (is2faOnlyMode) {
            if (!email || !code) return;
        } else {
            if (!email || !password) return;
        }

        const url = is2faOnlyMode ? '/api/auth/login-2fa' : (isRegisteringMode ? '/api/auth/register' : '/api/auth/login');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, code })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.two_factor_required) {
                    const container = document.getElementById('auth-2fa-container');
                    if (container) container.classList.remove('hidden');
                    if (codeInput) {
                        codeInput.required = true;
                        codeInput.focus();
                    }
                    authFeedback.textContent = '';
                    authFeedback.classList.add('hidden');
                    return;
                }

                closeModal();
                updateAuthUI();
                showToast(isRegisteringMode ? 'toast_register_success' : 'toast_login_success');

                const redirect_to = new URLSearchParams(window.location.search).get('redirect_to');
                if (redirect_to) {
                    window.location.href = decodeURIComponent(redirect_to);
                }
            } else {
                if (!isRegisteringMode && (data.error === 'Usuario no encontrado' || data.error === 'User not found')) {
                    authFeedback.innerHTML = `
                        <span class="block text-zinc-500 mb-2">${translations[currentLanguage]['login_prompt_create']}</span>
                        <button type="button" onclick="triggerRegistration()" class="px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold font-mono text-black dark:text-white transition-all uppercase">
                            ${translations[currentLanguage]['login_create_btn']}
                        </button>
                    `;
                    authFeedback.className = "text-xs font-mono text-center block mt-3 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 animate-fadeIn";
                    authFeedback.classList.remove('hidden');
                } else {
                    authFeedback.textContent = data.error || 'Error de autenticacion';
                    authFeedback.className = "text-xs font-mono text-red-500 font-bold text-center block mt-2 animate-fadeIn";
                    authFeedback.classList.remove('hidden');
                }
            }
        } catch (err) {
            authFeedback.textContent = 'Error de red al conectar al servidor.';
            authFeedback.className = "text-xs font-mono text-red-500 font-bold text-center block mt-2 animate-fadeIn";
            authFeedback.classList.remove('hidden');
        }
    });
}

function triggerRegistration() {
    setRegisterMode(true);
    authFeedback.innerHTML = '';
    authFeedback.classList.add('hidden');
    authForm.dispatchEvent(new Event('submit'));
}
window.triggerRegistration = triggerRegistration;

socialBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const platform = btn.getAttribute('data-platform');
        if (platform && platform.toLowerCase() === 'hackclub') {
            window.location.href = '/api/auth/hackclub';
            return;
        }
        const textTemplate = translations[currentLanguage]['oauth_simulating'] || "Connecting with {platform}...";
        oauthLoadingText.textContent = textTemplate.replace('{platform}', platform);

        oauthLoadingModal.classList.remove('hidden');
        oauthLoadingModal.classList.add('flex');

        setTimeout(async () => {
            oauthLoadingModal.classList.add('hidden');
            oauthLoadingModal.classList.remove('flex');

            const email = `user@${platform.toLowerCase()}.com`;
            const password = 'oauth_simulated_password_key_2026';

            try {
                const registerResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, username: `${platform} User` })
                });

                if (registerResponse.ok || registerResponse.status === 400) {
                    const loginResponse = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    if (loginResponse.ok) {
                        closeModal();
                        updateAuthUI();
                        showToast('toast_login_success');

                        const redirect_to = new URLSearchParams(window.location.search).get('redirect_to');
                        if (redirect_to) {
                            window.location.href = decodeURIComponent(redirect_to);
                        }
                    }
                }
            } catch (err) {
                showToast('Error de red al conectar por OAuth.');
            }
        }, 1800);
    });
});

updateAuthUI();