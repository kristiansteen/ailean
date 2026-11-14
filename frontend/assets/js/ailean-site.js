/* Shared AILEAN site behaviour: one language switch for every page, remembered across pages. */
(function () {
  var KEY = 'ailean_lang';
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }
  function apply(l) {
    document.documentElement.setAttribute('lang', l);
    document.querySelectorAll('[data-lang-switch]').forEach(function (b) {
      var on = b.getAttribute('data-lang-switch') === l;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (typeof window.setLanguage === 'function') { try { window.setLanguage(l); } catch (e) {} }
  }
  function init() {
    document.querySelectorAll('[data-lang-switch]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.getAttribute('data-lang-switch');
        store(l); apply(l);
      });
    });
    if (saved() === 'en') {
      var en = document.querySelector('[data-lang-switch="en"]');
      if (en) en.click();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
