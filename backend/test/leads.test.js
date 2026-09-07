'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
    MISSING_FIELDS_MESSAGE,
    validateLeadInput,
    firstNameOf,
    buildLead,
    renderWelcomeEmail,
    resolveAttachments,
} = require('../lib/leads');

const validBody = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '12345678',
    selectedDocuments: ['whitepaper.pdf'],
};

test('validateLeadInput', async (t) => {
    await t.test('accepts a complete payload', () => {
        assert.deepEqual(validateLeadInput(validBody), { valid: true });
    });

    await t.test('rejects a missing name', () => {
        const result = validateLeadInput({ ...validBody, name: '' });
        assert.equal(result.valid, false);
        assert.equal(result.error, MISSING_FIELDS_MESSAGE);
    });

    await t.test('rejects a missing email', () => {
        assert.equal(validateLeadInput({ ...validBody, email: undefined }).valid, false);
    });

    await t.test('rejects an empty document list', () => {
        assert.equal(validateLeadInput({ ...validBody, selectedDocuments: [] }).valid, false);
    });

    await t.test('rejects a non-array document list', () => {
        assert.equal(validateLeadInput({ ...validBody, selectedDocuments: 'whitepaper.pdf' }).valid, false);
    });

    await t.test('does not throw on undefined body', () => {
        assert.equal(validateLeadInput(undefined).valid, false);
    });
});

test('firstNameOf', async (t) => {
    await t.test('returns the first token of a full name', () => {
        assert.equal(firstNameOf('Jane Doe'), 'Jane');
    });

    await t.test('returns the whole string when there is no space', () => {
        assert.equal(firstNameOf('Jane'), 'Jane');
    });

    await t.test('falls back to the original value for a leading space', () => {
        assert.equal(firstNameOf(' Jane'), ' Jane');
    });
});

test('buildLead', async (t) => {
    const now = new Date('2026-01-02T03:04:05.000Z');

    await t.test('maps payload fields to the stored record', () => {
        const lead = buildLead(validBody, now);
        assert.deepEqual(lead, {
            id: String(now.getTime()),
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '12345678',
            selected_documents: ['whitepaper.pdf'],
            created_at: '2026-01-02T03:04:05.000Z',
        });
    });

    await t.test('normalises a missing phone to null', () => {
        const lead = buildLead({ ...validBody, phone: undefined }, now);
        assert.equal(lead.phone, null);
    });
});

test('renderWelcomeEmail', async (t) => {
    await t.test('substitutes the {{first_name}} placeholder', () => {
        assert.equal(
            renderWelcomeEmail('<p>Hi {{first_name}}!</p>', 'Jane'),
            '<p>Hi Jane!</p>',
        );
    });

    await t.test('leaves a template without the placeholder untouched', () => {
        assert.equal(renderWelcomeEmail('<p>Hello</p>', 'Jane'), '<p>Hello</p>');
    });
});

test('resolveAttachments', async (t) => {
    const dir = '/docs';
    const fakeFs = (present) => ({
        existsSync: (p) => present.has(p),
        readFileSync: (p) => Buffer.from('content-of-' + path.basename(p)),
    });

    await t.test('returns attachment objects for files that exist', () => {
        const fs = fakeFs(new Set([path.join(dir, 'a.pdf'), path.join(dir, 'b.pdf')]));
        const { attachments, missing } = resolveAttachments(['a.pdf', 'b.pdf'], dir, fs);
        assert.equal(missing.length, 0);
        assert.deepEqual(attachments.map((a) => a.filename), ['a.pdf', 'b.pdf']);
        assert.ok(Buffer.isBuffer(attachments[0].content));
    });

    await t.test('collects the paths of missing files and skips them', () => {
        const fs = fakeFs(new Set([path.join(dir, 'a.pdf')]));
        const { attachments, missing } = resolveAttachments(['a.pdf', 'gone.pdf'], dir, fs);
        assert.deepEqual(attachments.map((a) => a.filename), ['a.pdf']);
        assert.deepEqual(missing, [path.join(dir, 'gone.pdf')]);
    });

    await t.test('returns empty results for an empty request', () => {
        const { attachments, missing } = resolveAttachments([], dir, fakeFs(new Set()));
        assert.deepEqual(attachments, []);
        assert.deepEqual(missing, []);
    });
});
