// Zero.info.bo
// Made with love in Bolivia
// https://github.com/Franco-Senes
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./database");
const sharp = require("sharp");
const { generateSecret, generateURI, verify } = require('otplib');
const qrcode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'v7q4qQqNLw6tOuznYainn6BZRISzJIcWfhTEZ2IO7NsDxMliOheppJSsaCmWLpZLgk7yB8X4RY_YUiWICzf0bw';

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://icons.hackclub.com"],
            connectSrc: ["'self'", "https://api.open-meteo.com", "https://api.lanyard.rest", "https://api.github.com"],
        },
    },
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Rate limiter for sensitive authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: 'Too many login or verification attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // just if something breaks
}

app.use('/uploads', express.static(uploadsDir));

app.use(express.static(path.join(__dirname, '../app')));
app.use('/auth', express.static(path.join(__dirname, '../auth')));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 *  1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname.toLowerCase()));
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only (png, jpg, jpeg, gif, webp)'));
    }
});


const authenticateToken = async (req, res, next) => {
    const token = req.cookies.zero_session || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.get(
            'SELECT id, email, username, avatar_url, two_factor_enabled, two_factor_login_required FROM users WHERE id = ?',
            [decoded.id]
        );
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        req.user.is_oauth = decoded.is_oauth || false;
        req.is_oauth = decoded.is_oauth || false;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token bruv' });
    }
};

const optionalAuthenticateToken = async (req, res, next) => {
    const token = req.cookies.zero_session || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.get('SELECT id, email, username, avatar_url, two_factor_enabled, two_factor_login_required, created_at FROM users WHERE id = ?', [decoded.id]);
        req.user = user || null;
        if (req.user) {
            req.user.is_oauth = decoded.is_oauth || false;
        }
        req.is_oauth = decoded.is_oauth || false;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) { // If the user actually exists, block registration
            return res.status(400).json({ error: 'The user exists'});
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const uName = username || email.split('@')[0];

        const result = await db.run(
            'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
            [email, passwordHash, uName],
        );

        const token = jwt.sign({ id: result.id, email }, JWT_SECRET, {expiresIn: '7d'});
        res.cookie('zero_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({ id: result.id, email, username: uName });
    } catch (err) {
        res.status(500).json({ error: 'Server error while registering user.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password, code } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password requeried' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        // if 2fa is enabled it will be OBLIGATORY for login
        if (user.two_factor_enabled === 1 && user.two_factor_login_required === 1) {
            if (!code) {
                return res.json({ two_factor_login_required: true, email: user.email });
            }

            const { valid } = await verify({ secret: user.two_factor_secret, token:code });
            if (!valid) {
                return res.status(400).json({error: 'Incorrect two factor code'})
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email}, JWT_SECRET, {expiresIn: '7d'});
        res.cookie('zero_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({ id: user.id, email: user.email, username: user.username, avatar_url: user.avatar_url });
    } catch (err) {
        res.status(500).json({ error: 'Server error while logining user.' });
    }
})

app.post('/api/auth/login-2fa', authLimiter, async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Email and password requeried' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ error: '2FA authentication isnt configured for this account' });
        }

        const { valid } = await verify({ secret: user.two_factor_secret, token: code });
        if (!valid) {
            return res.status(400).json({ error: 'Authentication code invalid or expired'})
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('zero_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({ id: user.id, email: user.email, username: user.username, avatar_url: user.avatar_url });
    } catch (err) {
        console.error("Error logging in with 2fa", err);
        res.status(500).json({ error: 'Server error while logining user.' });
    }
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('zero_session');
    res.json({message: 'Signed out successfully'});
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

app.post('/api/user/change-password', authenticateToken, authLimiter, async (req, res) => {
    const { currentPassword, newPassword, code } = req.body;
    if ((!currentPassword && !req.is_oauth) || !newPassword) {
        return res.status(400).json({ error: 'Both passwords are required' });
    }

    try {
        const user = await db.get('SELECT password_hash, two_factor_enabled, two_factor_secret FROM users WHERE id = ?', [req.user.id]);

        // is 2fa enabled?
        if (user.two_factor_enabled === 1) {
            if (!code) {
                return res.status(400).json({ error: 'It requieres a 2fa code to change the password.' });
            }
            const { valid } = await verify({ secret: user.two_factor_secret, token: code });
            if (!valid) {
                return res.status(400).json({ error: '2fa password incorrect.' });
            }
        }

        // Only compare current password if they didn't log in via OAuth
        if (!req.is_oauth) {
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: 'Actual password incorrect' });
            }
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
        res.json({ message: 'Password updated with success' });
    } catch (err) {
        res.status(500).json({ error: 'Error changing the password' });
    }
});

app.post('/api/user/avatar', authenticateToken, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({error: 'La imagen excede el límite de tamaño de 10MB.'});
            }
            return res.status(400).json({error: `Error de subida: ${err.message}`});
        } else if (err) {
            return res.status(400).json({error: err.message});
        }
        next();
    });
}, async (req, res) => {
    if (!req.user) {
        return res.status(400).json({error: 'No file was uploaded'});
    }

    try {
        // 1 get the old user avatar and delete it from memory to save space
        const olduser = await db.get('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        if (olduser && olduser.avatar_url) {
            const oldFilename = path.basename(olduser.avatar_url);
            const oldFilePath = path.join(uploadsDir, oldFilename);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (unlinkErr) {
                    console.error("Error while deleting previous avatar", unlinkErr)
                }
            }
        }

        // 2 generate a unique name with a webp format
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const filename = `avatar-${uniqueSuffix}.webp`;
        const webpFilePath = path.join(uploadsDir, filename);

        // 3 process and convert the image to webp redimensioning to 300x300 for disc space
        await sharp(req.file.buffer)
            .resize(300, 300, {fit: 'cover'})
            .webp({quality: 80})
            .toFile(webpFilePath);

        const avatarUrl = '/uploads/' + filename;

        // 4 update zero.db
        await db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.json({message: 'Image succesfully converted'});
    } catch (err) {
        console.error("Error saving avatar", err);
        res.status(500).json({error: 'Error proccesssing and saving the avatar'})
    }
});

app.post('/api/oauth/apps', authenticateToken, async (req, res) => {
    const { name, redirect_uri } = req.body;
    if (!name || !redirect_uri) {
        return res.status(400).json({ error: 'App name and redirection uri are required' });
    }

    try {
        const client_id = 'client_' + crypto.randomBytes(16).toString('hex');
        const client_secret = 'secret_' + crypto.randomBytes(24).toString('hex');

        await db.run(
            'INSERT INTO oauth_apps (client_id, client_Secret, name, redirect_uri, owner_id) VALUES (?, ?, ?, ?, ?)',
            [client_id, client_secret, name, redirect_uri, req.user.id]
        );

        res.status(201).json({ client_id, client_secret, name, redirect_uri});
    } catch (err) {
        res.status(500).json({ error: 'Error while creating Oauth app'});
    }
});

app.get('/api/oauth/apps', authenticateToken, async (req, res) => {
    try {
        const apps = await db.all('SELECT client_id, client_secret, name, redirect_uri FROM oauth_apps WHERE owner_id = ?', [req.user.id]);
        res.json(apps || []);
    } catch (err) {
        res.status(500).json({ error: 'Error listing oauth apps'});
    }
});

app.delete('/api/oauth/apps/:client_id', authenticateToken, async (req, res) => {
    const { client_id } = req.params;
    try {
        const appInfo = await db.get('SELECT owner_id FROM oauth_apps WHERE client_id = ?', [client_id]);
        if (!appInfo) {
            return res.status(404).json({ error: 'App not found' });
        }
        if (appInfo.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this app' });
        }

        await db.run('DELETE FROM oauth_codes WHERE client_id = ?', [client_id]);
        await db.run('DELETE FROM user_authorizations WHERE client_id = ?', [client_id]);
        await db.run('DELETE FROM oauth_apps WHERE client_id = ?', [client_id]);

        res.json({ message: 'App deleted successfully' });
    } catch (err) {
        console.error("Error deleting oauth app:", err);
        res.status(500).json({ error: 'Error deleting oauth app' });
    }
});

app.post('/api/oauth/apps/:client_id/regenerate-secret', authenticateToken, async (req, res) => {
    const { client_id } = req.params;
    try {
        const appInfo = await db.get('SELECT owner_id FROM oauth_apps WHERE client_id = ?', [client_id]);
        if (!appInfo) {
            return res.status(404).json({ error: 'App not found' });
        }
        if (appInfo.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to manage this app' });
        }

        const new_secret = 'secret_' + crypto.randomBytes(24).toString('hex');
        await db.run('UPDATE oauth_apps SET client_secret = ? WHERE client_id = ?', [new_secret, client_id]);

        res.json({ client_secret: new_secret });
    } catch (err) {
        console.error("Error regenerating client secret:", err);
        res.status(500).json({ error: 'Error regenerating client secret' });
    }
});


app.get('/api/oauth/authorized-apps', authenticateToken, async (req, res) => {
    try {
        const apps = await db.all(
            `SELECT a.client_id, a.name, a.redirect_uri, auth.authorized_at 
             FROM user_authorizations auth
             JOIN oauth_apps a ON auth.client_id = a.client_id
             WHERE auth.user_id = ?`,
            [req.user.id]
        );
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: 'Error listing oauth apps'})
    }
});

app.delete('/api/oauth/authorized-apps/:client_id', authenticateToken, async (req, res) => {
    const { client_id } = req.params;
    try {
        await db.run(
            'DELETE FROM user_authorizations WHERE user_id = ? AND client_id = ?',
            [req.user.id, client_id]
        );
        res.json({ message: 'Authorizacion recoced succesfully'})
    } catch (err) {
        res.status(500).json({ error: 'Error revocing the authorization'})
    }
});

app.post('/api/user/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const secret = generateSecret();
        const otpAuthUrl = generateURI({
            secret,
            issuer: 'Zero Portfolio',
            label: req.user.email
        });
        const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
        res.json({ secret, qrCodeUrl });
    } catch (err) {
        console.error("Error setting up 2fa:", err);
        res.status(500).json({ error: 'Error generating 2fa setting' });
    }
});

app.post('/api/user/2fa/verify', authenticateToken, async (req, res) => {
    const { secret, code } = req.body;
    if (!secret || !code ) {
        return res.status(400).json({ error: 'secret required and verification code' });
    }

    try {
        const { valid } = await verify({ secret, token: code });
        if (!valid) {
            return res.status(400).json({ error: 'verification code incorrect'});
        }

        await db.run(
            'UPDATE users SET two_factor_enabled = 1, two_factor_secret = ?, two_factor_login_required = 1 WHERE id = ?',
            [secret, req.user.id]
        );

        res.json({ message: ' 2fa authentication activaded succesfully'})
    } catch (err) {
        console.error("Error verifying 2fa setup", err);
        res.status(500).json({ error: 'Error while activating 2FA'});
    }
});

app.post('/api/user/2fa/disable', authenticateToken, async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Requieres 2fa code' });
    }
    try {
        const user = await db.get('SELECT two_factor_secret FROM users WHERE id = ?', [req.user.id]);
        if (!user || !user.two_factor_secret) {
            return res.status(400).json({ error: 'El 2FA no está activado para este usuario' });
        }

        const { valid } = await verify({ secret: user.two_factor_secret, token: code});
        if (!valid) {
            return res.status(400).json({ error: 'Incorrect 2fa code' });
        }

        await db.run(
            'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_login_required = 0 WHERE id = ?',
            [req.user.id]
        );
        res.json({ message: '2fa deactivated successfuly' });
    } catch (err) {
        console.error("Error disabling 2FA:", err);
        res.status(500).json({ error: 'Error deativating 2fa' });
    }
});

app.post('/api/user/2fa/toggle-login', authenticateToken, async (req, res) => {
    const { required } = req.body;
    if (required === undefined) {
        return res.status(400).json({ error: '2FA required is undefined.' });
    }

    try {
        await db.run(
            'UPDATE users SET two_factor_login_required = ? WHERE id = ?',
            [required ? 1 : 0, req.user.id]
        );
        res.json({ message: 'Preference for 2FA updated'})
    } catch (err) {
        console.error("Error toggling 2FA login requirement:", err);
        res.status(500).json({ error: 'Error toggling 2FA login requirement:.' });
    }
});

app.get('/oauth/authorize', async (req, res) => {
    const { client_id, redirect_uri, response_type, state } = req.query;

    if (!client_id || !redirect_uri || response_type !== 'code') {
        return res.status(400).send('oAuth parameters invalid');
    }

    try {
        const appInfo = await db.get('SELECT * FROM oauth_apps WHERE client_id = ?', [client_id]);
        if (!appInfo || appInfo.redirect_uri !== redirect_uri) {
            return res.status(400).send('invalid_redirect_uri');
        }

        const token = req.cookies.zero_session;
        if (!token) {
            return res.redirect(`/index.html?redirect_to=${encodeURIComponent(req.originalUrl)}`);
        }

        jwt.verify(token, JWT_SECRET);
        res.redirect(`/auth/oauth.html?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state || ''}`);
    } catch (err) {
        res.redirect(`/index.html?redirect_to=${encodeURIComponent(req.originalUrl)}`);
    }
});

app.get('/api/oauth/apps/:client_id', async (req, res) => {
    try {
        const appInfo = await db.get('SELECT client_id, name, redirect_uri FROM oauth_apps WHERE client_id = ?', [req.params.client_id]);
        if (!appInfo) {
            return res.status(404).json({ error: 'App not found' });
        }
        res.json(appInfo);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/oauth/consent', async (req, res) => {
    const { client_id, redirect_uri, state, action } = req.body;
    const token = req.cookies.zero_session;

    if (!token) {
        return res.status(401).json({ error: 'Sesion no iniciada'});
    }

    if (!client_id || !redirect_uri) {
        return res.status(400).json({ error: 'Faltan parametros del flujo de consentimiento.'});
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const appInfo = await db.get('SELECT * FROM oauth_apps WHERE client_id = ?', [client_id]);
        if (!appInfo || appInfo.redirect_uri !== redirect_uri) {
            return res.status(400).json({ error: 'invalid_redirect_uri' });
        }

        if (action === 'cancel') {
            const redirectUrl = new URL(redirect_uri);
            redirectUrl.searchParams.set('error', 'access_denied');
            if (state) redirectUrl.searchParams.set('state', state);
            return res.json({ redirect: redirectUrl.toString() });
        }

        await db.run(
            'INSERT OR REPLACE INTO user_authorizations (user_id, client_id) VALUES (?, ?)',
            [decoded.id, client_id]
        );

        const code = 'code_' + crypto.randomBytes(16).toString('hex');
        const expiresAt = Date.now() + 10 * 60 * 1000;

        await db.run(
            'INSERT INTO oauth_codes (code, client_id, user_id, expires_at) VALUES (?, ?, ?, ?)',
            [code, client_id, decoded.id, expiresAt]
        );

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', code);
        if (state) redirectUrl.searchParams.set('state', state);
        res.json({ redirect: redirectUrl.toString() });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error.' });
    }
});

app.post('/oauth/token', async (req, res) => {
    const { client_id, client_secret, code, grant_type, redirect_uri } = req.body;

    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    try {
        const appInfo = await db.get('SELECT * FROM oauth_apps WHERE client_id = ? AND client_secret = ?', [client_id, client_secret]);
        if (!appInfo || appInfo.redirect_uri !== redirect_uri) {
            return res.status(400).json({ error: 'invalid_client_secret_or_redirect_uri' });
        }

        const codeinfo = await db.get('SELECT * FROM oauth_codes WHERE code = ? AND client_id = ?', [code, client_id]);
        if (!codeinfo) {
            return res.status(400).json({ error: 'invalid_grant' });
        }

        if (Date.now() > codeinfo.expires_at) {
            await db.run('DELETE FROM oauth_codes WHERE code = ?', [code]);
            return res.status(400).json({ error: 'invalid_grant' });
        }

        await db.run('DELETE FROM oauth_codes WHERE code = ?', [code]);

        const accessToken = jwt.sign(
            { id: codeinfo.user_id, client_id },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            accessToken: accessToken,
            token_type: 'Bearer',
            expires_in: 3600 // seconds
        });
    } catch (err) {
        res.status(500).json({ error: 'server_error' });
    }
});

app.get('/api/userinfo', async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'invalid_token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.client_id) {
            const authRecord = await db.get(
                'SELECT id FROM user_authorizations WHERE user_id = ? AND client_id = ?',
                [decoded.id, decoded.client_id]
            );
            if (!authRecord) {
                return  res.status(401).json({ error: 'authorization_revoked', error_description: 'Access to this app has been revoked' });
            }

            const user = await db.get('SELECT id, email, username, avatar_url FROM users WHERE id = ?', [decoded.id]);
            if (!user) {
                return res.status(401).json({ error: 'invalid_token' });
            }
            res.json(user)
        }
    } catch (err) {
        res.status(500).json({ error: 'invalid_token' });
    }
});

app.get('/api/auth/hackclub', (req, res) => {
    const client_id = process.env.HACKCLUB_CLIENT_ID;
    const redirect_uri = process.env.HACKCLUB_REDIRECT_URI;
    const url = `https://auth.hackclub.com/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=openid+email+name`;
    res.redirect(url);
});

app.get('/api/auth/hackclub/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect('/index.html?error=missing_code');
    }

    try {
        const tokenResponse = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.HACKCLUB_CLIENT_ID,
                client_secret: process.env.HACKCLUB_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.HACKCLUB_REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            const errData = await tokenResponse.json().catch(() => ({}));
            console.error('Hack Club token exchange error:', errData);
            return res.redirect('/index.html?error=token_exchange_failed');
        }

        const { access_token } = await tokenResponse.json();

        const profileResponse = await fetch('https://auth.hackclub.com/api/v1/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!profileResponse.ok) {
            console.error('Hack Club profile fetch error');
            return res.redirect('/index.html?error=profile_fetch_failed');
        }

        const profileData = await profileResponse.json();
        const identity = profileData.identity;

        if (!identity || !identity.primary_email) {
            console.error('Invalid profile data structure from Hack Club');
            return res.redirect('/index.html?error=invalid_profile_data');
        }

        let user = await db.get('SELECT id, email, username FROM users WHERE email = ?', [identity.primary_email]);

        if (!user) {
            const nameBase = `${identity.first_name || ''}_${identity.last_name || ''}`
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '')
                .replace(/_+/g, '_');
            
            let username = nameBase || `user_${Math.floor(Math.random() * 10000)}`;

            const existingUsername = await db.get('SELECT id FROM users WHERE username = ?', [username]);
            if (existingUsername) {
                username = `${username}_${Math.floor(Math.random() * 1000)}`;
            }

            const randomPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            const result = await db.run(
                'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
                [identity.primary_email, username, passwordHash]
            );

            user = {
                id: result.lastID,
                email: identity.primary_email,
                username: username
            };
        }

        const sessionToken = jwt.sign(
            { id: user.id, email: user.email, is_oauth: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('zero_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/index.html');
    } catch (err) {
        console.error('Hack Club auth callback exception:', err);
        res.redirect('/index.html?error=internal_server_error');
    }
});

app.listen(PORT, () => {
    console.log('Zero.info.bo - Server')
    console.log('Running on http://localhost:' + PORT);
    console.log('Franco was here')
    console.log('------- Debug --------')
});
