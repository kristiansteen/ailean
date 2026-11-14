'use strict';

// POST /api/v1/leads — called by the white paper and book form (ailean-downloads.html).
// Emails each lead to LEADS_TO via Resend. Optionally sends the visitor a
// confirmation with download links (LEADS_SEND_CONFIRMATION=true, needs a
// verified sending domain in Resend and LEADS_FROM on that domain).
//
// Environment variables (Vercel project settings):
//   RESEND_API_KEY            required
//   LEADS_TO                  required, comma-separated recipients
//   LEADS_FROM                optional, default "AILEAN <onboarding@resend.dev>"
//   LEADS_SEND_CONFIRMATION   optional, "true" to email the visitor

const artifacts = require('../../assets/artifacts.json');
const { parseLead, notificationEmail, confirmationEmail, config } = require('../_lib/leads');

async function sendEmail(cfg, message) {
    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: cfg.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
    });
    if (!r.ok) {
        const detail = await r.text().catch(() => '');
        throw new Error(`Resend ${r.status}: ${detail.slice(0, 300)}`);
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = null; }
    }

    const parsed = parseLead(body, artifacts);
    if (!parsed.valid) return res.status(400).json({ error: parsed.error });
    const { lead } = parsed;

    const cfg = config(process.env);
    if (!cfg.apiKey || cfg.to.length === 0) {
        console.error('Lead not delivered: RESEND_API_KEY or LEADS_TO is not set', JSON.stringify(lead));
        return res.status(503).json({ error: 'Lead capture is not configured' });
    }

    try {
        await sendEmail(cfg, { to: cfg.to, ...notificationEmail(lead) });
    } catch (err) {
        // Log the lead so it can be recovered from Vercel logs.
        console.error('Lead notification failed', err.message, JSON.stringify(lead));
        return res.status(502).json({ error: 'Could not record the request' });
    }

    let confirmed = false;
    if (cfg.sendConfirmation) {
        try {
            await sendEmail(cfg, { to: [lead.email], ...confirmationEmail(lead) });
            confirmed = true;
        } catch (err) {
            console.error('Confirmation email failed', err.message);
        }
    }

    return res.status(200).json({ success: true, confirmed });
};
