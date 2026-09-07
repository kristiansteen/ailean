'use strict';

// Pure logic units for the lead-capture flow (POST /api/v1/leads).
// Kept side-effect free so they can be unit tested in isolation; the
// server wires them together and supplies fs / Resend.

const path = require('path');

const MISSING_FIELDS_MESSAGE = 'Missing required fields or documents';

/**
 * Validate the incoming lead payload.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateLeadInput(body) {
    const { name, email, selectedDocuments } = body || {};
    if (
        !name ||
        !email ||
        !selectedDocuments ||
        !Array.isArray(selectedDocuments) ||
        selectedDocuments.length === 0
    ) {
        return { valid: false, error: MISSING_FIELDS_MESSAGE };
    }
    return { valid: true };
}

/**
 * First token of a full name, falling back to the whole string.
 */
function firstNameOf(name) {
    return String(name).split(' ')[0] || name;
}

/**
 * Build the persisted lead record.
 * @param {Date} now - injected clock for deterministic tests
 */
function buildLead(body, now = new Date()) {
    const { name, email, phone, selectedDocuments } = body;
    return {
        id: now.getTime().toString(),
        name,
        email,
        phone: phone || null,
        selected_documents: selectedDocuments,
        created_at: now.toISOString(),
    };
}

/**
 * Substitute the {{first_name}} placeholder in the welcome-email template.
 */
function renderWelcomeEmail(template, firstName) {
    return template.replace('{{first_name}}', firstName);
}

/**
 * Resolve requested document filenames to Resend attachment objects.
 * @param {string[]} selectedDocuments
 * @param {string} documentsDir
 * @param {{ existsSync: Function, readFileSync: Function }} fsModule - injected
 * @returns {{ attachments: Array<{filename: string, content: Buffer}>, missing: string[] }}
 */
function resolveAttachments(selectedDocuments, documentsDir, fsModule) {
    const attachments = [];
    const missing = [];
    for (const filename of selectedDocuments) {
        const filePath = path.join(documentsDir, filename);
        if (fsModule.existsSync(filePath)) {
            attachments.push({ filename, content: fsModule.readFileSync(filePath) });
        } else {
            missing.push(filePath);
        }
    }
    return { attachments, missing };
}

module.exports = {
    MISSING_FIELDS_MESSAGE,
    validateLeadInput,
    firstNameOf,
    buildLead,
    renderWelcomeEmail,
    resolveAttachments,
};
