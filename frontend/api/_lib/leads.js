'use strict';

// Pure logic for POST /api/v1/leads (Vercel function).
// No I/O here, so it can be unit tested; api/v1/leads.js wires it to Resend.

const SITE = 'https://www.ailean.dk';
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const MAX = { name: 120, email: 200, phone: 40 };

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Validate and normalise the payload. Only documents listed in
 * assets/artifacts.json are accepted.
 * @returns {{ valid: true, lead: object } | { valid: false, error: string }}
 */
function parseLead(body, artifacts, now = new Date()) {
    const b = body && typeof body === 'object' ? body : {};
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    const email = typeof b.email === 'string' ? b.email.trim() : '';
    const phone = typeof b.phone === 'string' ? b.phone.trim() : '';
    const docs = Array.isArray(b.selectedDocuments) ? b.selectedDocuments : [];

    if (!name || name.length > MAX.name) return { valid: false, error: 'Name is required' };
    if (!EMAIL_RE.test(email) || email.length > MAX.email) return { valid: false, error: 'A valid email is required' };
    if (phone.length > MAX.phone) return { valid: false, error: 'Phone number is too long' };

    const byFile = new Map(artifacts.map((a) => [a.filename, a]));
    const documents = [...new Set(docs)].filter((f) => byFile.has(f)).map((f) => byFile.get(f));
    if (documents.length === 0) return { valid: false, error: 'Select at least one document' };

    return {
        valid: true,
        lead: { name, email, phone: phone || null, documents, createdAt: now.toISOString() },
    };
}

function docUrl(filename) {
    return `${SITE}/assets/documents/${encodeURIComponent(filename)}`;
}

/** Email to AILEAN with the lead's details. Reply goes to the lead. */
function notificationEmail(lead) {
    const rows = [
        ['Name', lead.name],
        ['Email', lead.email],
        ['Phone', lead.phone || '—'],
        ['Documents', lead.documents.map((d) => d.title).join(', ')],
        ['Time (UTC)', lead.createdAt],
    ];
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    const html =
        '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
        rows
            .map(
                ([k, v]) =>
                    `<tr><td style="padding:4px 16px 4px 0;color:#62625D">${escapeHtml(k)}</td>` +
                    `<td style="padding:4px 0;color:#151515">${escapeHtml(v)}</td></tr>`
            )
            .join('') +
        '</table>';
    return {
        subject: `New lead: ${lead.name} (${lead.documents.length} document${lead.documents.length > 1 ? 's' : ''})`,
        text,
        html,
        replyTo: lead.email,
    };
}

/** Confirmation to the lead with links to the documents. */
function confirmationEmail(lead) {
    const first = lead.name.split(/\s+/)[0] || lead.name;
    const links = lead.documents.map((d) => ({ title: d.title, url: docUrl(d.filename) }));
    const text =
        `Hi ${first},\n\nThank you for your interest in AILEAN. Here are your documents:\n\n` +
        links.map((l) => `${l.title}\n${l.url}`).join('\n\n') +
        `\n\nWant to see how Ailean maps a process from a spoken interview? Create a free account at ${SITE}\n\nBest regards,\nAILEAN`;
    const html =
        '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#151515;max-width:560px">' +
        `<p>Hi ${escapeHtml(first)},</p>` +
        '<p>Thank you for your interest in AILEAN. Here are your documents:</p>' +
        '<ul style="padding-left:18px">' +
        links.map((l) => `<li style="margin:6px 0"><a href="${l.url}" style="color:#151515">${escapeHtml(l.title)}</a></li>`).join('') +
        '</ul>' +
        `<p>Want to see how Ailean maps a process from a spoken interview? <a href="${SITE}" style="color:#151515">Create a free account</a>.</p>` +
        '<p>Best regards,<br>AILEAN</p>' +
        '</div>';
    return { subject: 'Your AILEAN documents', text, html };
}

/** Read config from the environment. */
function config(env) {
    const to = (env.LEADS_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
    return {
        apiKey: env.RESEND_API_KEY || '',
        to,
        from: env.LEADS_FROM || 'AILEAN <onboarding@resend.dev>',
        sendConfirmation: env.LEADS_SEND_CONFIRMATION === 'true',
    };
}

module.exports = { escapeHtml, parseLead, notificationEmail, confirmationEmail, config, docUrl };
