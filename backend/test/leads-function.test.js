'use strict';
// Tests for the Vercel lead function. Run: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const FRONTEND = process.env.FRONTEND_DIR || path.join(__dirname, '..', '..', 'frontend');
const lib = require(path.join(FRONTEND, 'api/_lib/leads.js'));
const artifacts = require(path.join(FRONTEND, 'assets/artifacts.json'));
const WP = 'AILEAN White Paper.pdf';

const ok = { name: 'Jane Doe', email: 'jane@example.com', phone: '12345678', selectedDocuments: [WP] };

test('parseLead accepts a valid lead and resolves document titles', () => {
    const r = lib.parseLead(ok, artifacts, new Date('2026-11-14T10:00:00Z'));
    assert.equal(r.valid, true);
    assert.equal(r.lead.documents[0].filename, WP);
    assert.equal(r.lead.createdAt, '2026-11-14T10:00:00.000Z');
});

test('parseLead rejects missing name, bad email, unknown or no documents', () => {
    assert.equal(lib.parseLead({ ...ok, name: '  ' }, artifacts).valid, false);
    assert.equal(lib.parseLead({ ...ok, email: 'nope' }, artifacts).valid, false);
    assert.equal(lib.parseLead({ ...ok, selectedDocuments: ['../../secret.pdf'] }, artifacts).valid, false);
    assert.equal(lib.parseLead({ ...ok, selectedDocuments: [] }, artifacts).valid, false);
    assert.equal(lib.parseLead(null, artifacts).valid, false);
});

test('parseLead drops unknown documents and duplicates but keeps valid ones', () => {
    const r = lib.parseLead({ ...ok, selectedDocuments: [WP, WP, 'x.pdf'] }, artifacts);
    assert.equal(r.lead.documents.length, 1);
});

test('notification email escapes HTML and replies to the lead', () => {
    const r = lib.parseLead({ ...ok, name: '<b>Eve</b>' }, artifacts);
    const m = lib.notificationEmail(r.lead);
    assert.ok(!m.html.includes('<b>Eve</b>'));
    assert.ok(m.html.includes('&lt;b&gt;Eve&lt;/b&gt;'));
    assert.equal(m.replyTo, 'jane@example.com');
});

test('confirmation email links to encoded document URLs', () => {
    const m = lib.confirmationEmail(lib.parseLead(ok, artifacts).lead);
    assert.ok(m.html.includes('https://www.ailean.dk/assets/documents/AILEAN%20White%20Paper.pdf'));
    assert.ok(m.text.startsWith('Hi Jane,'));
});

// Handler, with fetch replaced by a fake Resend.
function load(env, fetchImpl) {
    const p = path.join(FRONTEND, 'api/v1/leads.js');
    delete require.cache[require.resolve(p)];
    Object.assign(process.env, { RESEND_API_KEY: '', LEADS_TO: '', LEADS_SEND_CONFIRMATION: '' }, env);
    global.fetch = fetchImpl;
    return require(p);
}
function call(handler, req) {
    return new Promise((resolve) => {
        const res = { code: 200, headers: {},
            setHeader(k, v) { this.headers[k] = v; },
            status(c) { this.code = c; return this; },
            json(b) { resolve({ code: this.code, body: b }); } };
        handler(req, res);
    });
}
const quiet = () => { const e = console.error; console.error = () => {}; return () => { console.error = e; }; };

test('handler: 405 on GET', async () => {
    const h = load({}, async () => { throw new Error('no'); });
    assert.equal((await call(h, { method: 'GET' })).code, 405);
});

test('handler: 400 on invalid body', async () => {
    const h = load({ RESEND_API_KEY: 'k', LEADS_TO: 'a@b.dk' }, async () => { throw new Error('no'); });
    assert.equal((await call(h, { method: 'POST', body: { name: 'x' } })).code, 400);
});

test('handler: 503 when not configured', async () => {
    const restore = quiet();
    const h = load({}, async () => { throw new Error('no'); });
    const r = await call(h, { method: 'POST', body: ok });
    restore();
    assert.equal(r.code, 503);
});

test('handler: sends notification only, by default', async () => {
    const sent = [];
    const h = load({ RESEND_API_KEY: 'k', LEADS_TO: 'owner@x.dk, two@x.dk' }, async (url, opts) => {
        sent.push(JSON.parse(opts.body)); return { ok: true, text: async () => '' };
    });
    const r = await call(h, { method: 'POST', body: JSON.stringify(ok) });
    assert.equal(r.code, 200);
    assert.deepEqual(r.body, { success: true, confirmed: false });
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, ['owner@x.dk', 'two@x.dk']);
    assert.equal(sent[0].reply_to, 'jane@example.com');
});

test('handler: also confirms to the visitor when enabled', async () => {
    const sent = [];
    const h = load({ RESEND_API_KEY: 'k', LEADS_TO: 'owner@x.dk', LEADS_SEND_CONFIRMATION: 'true' }, async (u, o) => {
        sent.push(JSON.parse(o.body)); return { ok: true, text: async () => '' };
    });
    const r = await call(h, { method: 'POST', body: ok });
    assert.equal(r.body.confirmed, true);
    assert.deepEqual(sent[1].to, ['jane@example.com']);
});

test('handler: 502 when Resend rejects the notification', async () => {
    const restore = quiet();
    const h = load({ RESEND_API_KEY: 'k', LEADS_TO: 'owner@x.dk' }, async () => ({ ok: false, status: 403, text: async () => 'forbidden' }));
    const r = await call(h, { method: 'POST', body: ok });
    restore();
    assert.equal(r.code, 502);
});

test('handler: confirmation failure does not fail the request', async () => {
    const restore = quiet();
    let n = 0;
    const h = load({ RESEND_API_KEY: 'k', LEADS_TO: 'owner@x.dk', LEADS_SEND_CONFIRMATION: 'true' }, async () =>
        (++n === 1 ? { ok: true, text: async () => '' } : { ok: false, status: 422, text: async () => 'bad' }));
    const r = await call(h, { method: 'POST', body: ok });
    restore();
    assert.deepEqual([r.code, r.body.confirmed], [200, false]);
});
