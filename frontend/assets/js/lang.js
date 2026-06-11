/**
 * vimpl Language Switcher
 * Same pattern as ailean: sets lang attribute on <html>, elements use
 * data-i18n="key" for text content and data-i18n-placeholder="key"
 * for input placeholders.
 *
 * Include this script on every page, then call initLang() on DOMContentLoaded.
 */

/* Inject lang-switcher CSS once so it works on every page */
(function () {
  if (document.getElementById('vimpl-lang-css')) return;
  const s = document.createElement('style');
  s.id = 'vimpl-lang-css';
  s.textContent = `
    .lang-switcher {
      display: inline-flex; align-items: center;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px; overflow: hidden;
    }
    .lang-btn {
      font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
      color: rgba(255,255,255,0.45); background: transparent;
      border: none; padding: 4px 8px; cursor: pointer;
      transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .lang-btn:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }
    .lang-btn.active { color: #fff; background: rgba(101,196,52,0.25); }
    /* Light variant — for white headers / cards */
    .lang-switcher.light { background: #f1f5f9; border: 1px solid #e2e8f0; }
    .lang-switcher.light .lang-btn { color: #94a3b8; }
    .lang-switcher.light .lang-btn:hover { color: #475569; background: #e2e8f0; }
    .lang-switcher.light .lang-btn.active { color: #1e293b; background: rgba(101,196,52,0.15); }
  `;
  document.head.appendChild(s);
})();

const VIMPL_LANG_KEY = 'vimpl_lang';

const vimplTranslations = {
  en: {
    // ── Navigation / board header ────────────────────────────────
    dashboard:        'Dashboard',
    newBoard:         'New Board',
    editLayout:       'Edit Layout',
    toggleGrid:       'Toggle Grid',
    eventLog:         'Event Log',
    exportJson:       'Export JSON',
    voiceToBpmn:      'Voice to BPMN',
    logout:           'Logout',
    allChangesSaved:  'All changes saved',
    poweredBy:        'Powered by',

    // ── Sidebar ──────────────────────────────────────────────────
    notes:            'Notes',
    addNote:          'Add Note',
    select:           'Select',
    addSection:       'Add Section',

    // ── Dashboard ────────────────────────────────────────────────
    myBoards:         'My Boards',
    newBoardBtn:      '+ New Board',
    loadingBoards:    'Loading your boards...',
    noBoardsYet:      'No boards yet',
    createFirstBoard: 'Create your first board to start planning!',
    createYourFirst:  'Create Your First Board',
    updatedLabel:     'Updated',
    sharedWithYou:    'Shared with you',
    logOut:           'Log out',

    // ── Create board modal ───────────────────────────────────────
    createNewBoard:   'Create New Board',
    boardTitle:       'Board Title *',
    description:      'Description (optional)',
    boardTitlePh:     'e.g., Q1 Planning',
    boardDescPh:      "What's this board for?",
    cancel:           'Cancel',
    createBoard:      'Create Board',

    // ── Share modal ──────────────────────────────────────────────
    shareBoard:       'Share Board',
    userEmail:        'User Email address',
    emailHelper:      'User must be registered first.',
    emailPh:          'colleague@example.com',
    shareBtn:         'Share Board',

    // ── Login ────────────────────────────────────────────────────
    welcomeBack:      'Welcome back! Please login to your account.',
    emailLabel:       'Email',
    passwordLabel:    'Password',
    forgotPassword:   'Forgot password?',
    loginBtn:         'Log in',
    continueGoogle:   'Continue with Google',
    orDivider:        'or',
    noAccount:        "Don't have an account?",
    signUp:           'Sign up',

    // ── Register ─────────────────────────────────────────────────
    createAccount:    'Create your account and start planning.',
    fullName:         'Full Name',
    fullNamePh:       'John Doe',
    passwordPh:       'At least 8 characters',
    createAccountBtn: 'Create Account',
    alreadyAccount:   'Already have an account?',
    logIn:            'Log in',
    agreeTerms:       'By creating an account, you agree to our',
    termsLink:        'Terms of Service',
    andWord:          'and',
    privacyLink:      'Privacy Policy',
  },

  da: {
    // ── Navigation / board header ────────────────────────────────
    dashboard:        'Dashboard',
    newBoard:         'Nyt board',
    editLayout:       'Rediger layout',
    toggleGrid:       'Slå gitter til/fra',
    eventLog:         'Hændelseslog',
    exportJson:       'Eksportér JSON',
    voiceToBpmn:      'Stemme til BPMN',
    logout:           'Log ud',
    allChangesSaved:  'Alle ændringer gemt',
    poweredBy:        'Drevet af',

    // ── Sidebar ──────────────────────────────────────────────────
    notes:            'Noter',
    addNote:          'Tilføj note',
    select:           'Vælg',
    addSection:       'Tilføj sektion',

    // ── Dashboard ────────────────────────────────────────────────
    myBoards:         'Mine boards',
    newBoardBtn:      '+ Nyt board',
    loadingBoards:    'Indlæser dine boards...',
    noBoardsYet:      'Ingen boards endnu',
    createFirstBoard: 'Opret dit første board og begynd at planlægge!',
    createYourFirst:  'Opret dit første board',
    updatedLabel:     'Opdateret',
    sharedWithYou:    'Delt med dig',
    logOut:           'Log ud',

    // ── Create board modal ───────────────────────────────────────
    createNewBoard:   'Opret nyt board',
    boardTitle:       'Board-titel *',
    description:      'Beskrivelse (valgfri)',
    boardTitlePh:     'f.eks. Q1-planlægning',
    boardDescPh:      'Hvad bruges dette board til?',
    cancel:           'Annuller',
    createBoard:      'Opret board',

    // ── Share modal ──────────────────────────────────────────────
    shareBoard:       'Del board',
    userEmail:        'Brugerens e-mailadresse',
    emailHelper:      'Brugeren skal være registreret først.',
    emailPh:          'kollega@eksempel.com',
    shareBtn:         'Del board',

    // ── Login ────────────────────────────────────────────────────
    welcomeBack:      'Velkommen tilbage! Log ind på din konto.',
    emailLabel:       'E-mail',
    passwordLabel:    'Adgangskode',
    forgotPassword:   'Glemt adgangskode?',
    loginBtn:         'Log ind',
    continueGoogle:   'Fortsæt med Google',
    orDivider:        'eller',
    noAccount:        'Har du ikke en konto?',
    signUp:           'Tilmeld dig',

    // ── Register ─────────────────────────────────────────────────
    createAccount:    'Opret din konto og begynd at planlægge.',
    fullName:         'Fulde navn',
    fullNamePh:       'Hans Hansen',
    passwordPh:       'Mindst 8 tegn',
    createAccountBtn: 'Opret konto',
    alreadyAccount:   'Har du allerede en konto?',
    logIn:            'Log ind',
    agreeTerms:       'Ved at oprette en konto accepterer du vores',
    termsLink:        'Servicevilkår',
    andWord:          'og',
    privacyLink:      'Privatlivspolitik',
  },
};

function applyVimplTranslations(lang) {
  const t = vimplTranslations[lang] || vimplTranslations.en;

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (t[key] !== undefined) el.title = t[key];
  });

  // Aria-label attributes
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
  });
}

function initLang() {
  const saved = localStorage.getItem(VIMPL_LANG_KEY) || 'en';
  applyVimplTranslations(saved);

  // Sync active state on all switcher buttons on this page
  document.querySelectorAll('.lang-btn[data-lang-switch]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang-switch') === saved);
  });

  // Wire up switcher buttons
  document.querySelectorAll('.lang-btn[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang-switch');
      localStorage.setItem(VIMPL_LANG_KEY, lang);
      applyVimplTranslations(lang);
      document.querySelectorAll('.lang-btn[data-lang-switch]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lang-switch') === lang);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initLang);
