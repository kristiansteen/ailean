(function () {
  if (localStorage.getItem('ailean_cookie_consent')) return;

  // Detect current language (matches ailean's lang system)
  var lang = localStorage.getItem('ailean_lang') || 'da';

  var text = lang === 'en'
    ? 'We use essential cookies only to make our site work &mdash; no tracking, no ads.'
    : 'Vi bruger kun n&oslash;dvendige cookies for at siden fungerer &mdash; ingen sporing, ingen annoncer.';
  var privacyLabel = lang === 'en' ? 'Privacy policy' : 'Privatlivspolitik';
  var btnLabel = lang === 'en' ? 'Got it' : 'OK, forst&aring;et';

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = [
    '<div id="cookie-banner-inner">',
    '  <span id="cookie-banner-text">',
    '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:#65c434">',
    '      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>',
    '      <path d="M12 8v4m0 4h.01"/>',
    '    </svg>',
    '    ' + text + ' <a href="ailean-privacy.html" id="cookie-privacy-link">' + privacyLabel + '</a>',
    '  </span>',
    '  <button id="cookie-accept-btn">' + btnLabel + '</button>',
    '</div>',
  ].join('');

  var style = document.createElement('style');
  style.textContent = [
    '#cookie-banner{',
    '  position:fixed;bottom:0;left:0;right:0;z-index:9999;',
    '  background:rgba(10,10,10,0.97);',
    '  border-top:1px solid rgba(101,196,52,0.25);',
    '  backdrop-filter:blur(8px);',
    '  padding:14px 24px;',
    '  transform:translateY(100%);',
    '  transition:transform 0.3s ease;',
    '}',
    '#cookie-banner.visible{transform:translateY(0);}',
    '#cookie-banner-inner{',
    '  max-width:1200px;margin:0 auto;',
    '  display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;',
    '}',
    '#cookie-banner-text{',
    '  display:flex;align-items:center;gap:10px;',
    '  color:rgba(255,255,255,0.75);font-size:13px;font-family:Inter,sans-serif;line-height:1.5;',
    '}',
    '#cookie-privacy-link{color:#65c434;text-decoration:none;margin-left:4px;}',
    '#cookie-privacy-link:hover{text-decoration:underline;}',
    '#cookie-accept-btn{',
    '  flex-shrink:0;',
    '  background:#65c434;color:#fff;border:none;',
    '  padding:8px 20px;border-radius:8px;',
    '  font-size:13px;font-weight:600;font-family:Inter,sans-serif;',
    '  cursor:pointer;transition:background 0.15s;white-space:nowrap;',
    '}',
    '#cookie-accept-btn:hover{background:#3d7a1f;}',
  ].join('');

  document.head.appendChild(style);
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.classList.add('visible'); });
  });

  document.getElementById('cookie-accept-btn').addEventListener('click', function () {
    localStorage.setItem('ailean_cookie_consent', '1');
    banner.style.transition = 'transform 0.2s ease';
    banner.style.transform = 'translateY(100%)';
    setTimeout(function () { banner.remove(); }, 250);
  });
})();
