const express = require('express');
const router = express.Router();

const FEISHU_APP_ID = process.env.APP_ID;
const FEISHU_APP_SECRET = process.env.APP_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function fetchTenantAccessToken() {
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
        throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET');
    }

    const now = Date.now();
    // reuse cached token if not near expiry (1 minute safety margin)
    if (cachedToken && now < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let resp;
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: FEISHU_APP_ID,
                app_secret: FEISHU_APP_SECRET
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await r.json().catch(() => ({}));
        resp = { data };
        if (!r.ok) {
            const message = data.msg || data.message || `${r.status} ${r.statusText}`;
            throw new Error('Feishu auth error: ' + message);
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Feishu auth request timed out');
        }
        throw err;
    }

    const body = resp.data || {};
    // Feishu returns tenant_access_token and expire (seconds)
    const token = body.tenant_access_token || (body.data && body.data.tenant_access_token);
    const expireSeconds = body.expire || body.expires_in || (body.data && body.data.expire) || 3600;

    if (!token) {
        const message = body.msg || JSON.stringify(body);
        throw new Error('Failed to obtain tenant_access_token: ' + message);
    }

    cachedToken = token;
    tokenExpiresAt = Date.now() + expireSeconds * 1000;
    return cachedToken;
}

router.use(async (req, res, next) => {
    try {
        req.tenantAccessToken = await fetchTenantAccessToken();
        next();
    } catch (err) {
        console.error('Feishu tenant token error:', err && err.message ? err.message : err);
        res.status(503).json({ error: 'Failed to obtain Feishu tenant access token' });
    }
});

router.get('/bitable/v1/apps/:app_token/tables', async (req, res) => {
    const { app_token } = req.params;

    if (!app_token) {
        return res.status(400).json({ error: 'Missing app_token in URL' });
    }

    const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(app_token)}/tables`;
    const url = new URL(base);

    // forward query parameters from the incoming request
    const query = req.query || {};
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
            url.searchParams.append(key, String(value));
        }
    });

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${req.tenantAccessToken}`
            },
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await resp.json().catch(() => ({}));
        return res.status(resp.status).json(data);
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Feishu request timed out' });
        } else if (err.response) {
            return res.status(err.response.status || 502).json(err.response.data || { error: err.message });
        } else {
            return res.status(502).json({ error: err.message || 'Unknown error contacting Feishu' });
        }
    }
})

router.post('/bitable/v1/apps/:app_token/tables/:table_id/records/search', async (req, res) => {
    const { app_token, table_id } = req.params;

    if (!app_token || !table_id) {
        return res.status(400).json({ error: 'Missing app_token or table_id in URL' });
    }

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(app_token)}/tables/${encodeURIComponent(table_id)}/records/search`;
    const payload = req.body || {};

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${req.tenantAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await resp.json();

        return res.status(resp.status).json(data);
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Feishu request timed out' });
        } else if (err.response) {
            // Feishu returned an error response
            return res.status(err.response.status || 502).json(err.response.data || { error: err.message });
        } else {
            return res.status(502).json({ error: err.message || 'Unknown error contacting Feishu' });
        }
    }
})

module.exports = router;