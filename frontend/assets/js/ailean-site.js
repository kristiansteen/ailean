/* Shared AILEAN site behaviour:
   - one language switch for every page, remembered across pages
   - conversion events (sent to Google Analytics only after consent, see cookie-banner.js) */
(function () {
  var KEY = 'ailean_lang';
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  /* Track an event. gtag only exists after the visitor accepted statistics cookies;
     before that, events are dropped. */
  window.aileanTrack = function (name, params) {
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, params || {}); } catch (e) {}
    }
  };

  function eventFor(a) {
    if (a.hasAttribute('data-track')) return a.getAttribute('data-track');
    var h = a.getAttribute('href') || '';
    if (h.indexOf('voice-2-launch.vercel.app') > -1) return h.indexOf('register=1') > -1 ? 'sign_up_click' : 'login_click';
    if (h.indexOf('calendar.google.com') > -1) return 'book_demo_click';
    if (h.indexOf('buy.stripe.com') > -1) return 'begin_checkout';
    if (h.indexOf('ailean-downloads') > -1) return 'whitepaper_cta_click';
    return null;
  }

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
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href]');
      if (!a) return;
      var name = eventFor(a);
      if (name) window.aileanTrack(name, { link_url: a.href, page: location.pathname });
    }, true);

    if (document.body.hasAttribute('data-own-lang')) return; /* page handles its own switch */
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
