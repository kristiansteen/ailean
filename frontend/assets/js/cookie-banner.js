/* AILEAN cookie consent.
   Google Analytics (G-N6T4H0QH68) is loaded only after the visitor accepts
   statistics cookies. The choice is stored in localStorage ('ailean_consent':
   'analytics' | 'necessary'). Any element with [data-cookie-settings] reopens the banner. */
(function () {
  var GA_ID = 'G-N6T4H0QH68';
  var KEY = 'ailean_consent';

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function lang() {
    var l = document.documentElement.getAttribute('lang');
    if (l !== 'en' && l !== 'da') { try { l = localStorage.getItem('ailean_lang'); } catch (e) {} }
    return l === 'en' ? 'en' : 'da';
  }

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function clearGACookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  var TEXT = {
    da: {
      body: 'Vi vil gerne måle, hvordan siden bruges, med Google Analytics. Det sker kun, hvis du siger ja. Nødvendige cookies bruges altid.',
      privacy: 'Privatlivspolitik',
      accept: 'Tillad statistik',
      decline: 'Kun nødvendige'
    },
    en: {
      body: 'We would like to measure how the site is used with Google Analytics. That only happens if you say yes. Necessary cookies are always used.',
      privacy: 'Privacy policy',
      accept: 'Allow statistics',
      decline: 'Necessary only'
    }
  };

  function injectStyle() {
    if (document.getElementById('cookie-banner-style')) return;
    var st = document.createElement('style');
    st.id = 'cookie-banner-style';
    st.textContent =
      '#cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#151515;color:#F1F1EE;' +
      'font:14px/1.5 Inter,"Helvetica Neue",Helvetica,Arial,sans-serif;padding:16px 24px;transform:translateY(100%);transition:transform .25s ease}' +
      '#cookie-banner.visible{transform:none}' +
      '#cookie-banner .cb-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:20px;flex-wrap:wrap}' +
      '#cookie-banner p{flex:1 1 420px;margin:0;color:#F1F1EE}' +
      '#cookie-banner a{color:#F1F1EE;text-decoration:underline;margin-left:4px}' +
      '#cookie-banner .cb-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '#cookie-banner button{font:inherit;font-weight:500;border-radius:999px;padding:8px 18px;cursor:pointer;border:1px solid #F1F1EE}' +
      '#cookie-banner .cb-yes{background:#F1F1EE;color:#151515}' +
      '#cookie-banner .cb-no{background:transparent;color:#F1F1EE}' +
      '#cookie-banner button:hover{background:#E8500A;border-color:#E8500A;color:#fff}' +
      '#cookie-banner button:focus-visible{outline:2px solid #E8500A;outline-offset:2px}' +
      '@media (prefers-reduced-motion:reduce){#cookie-banner{transition:none}}';
    document.head.appendChild(st);
  }

  function show() {
    var old = document.getElementById('cookie-banner');
    if (old) old.remove();
    injectStyle();
    var t = TEXT[lang()];
    var b = document.createElement('div');
    b.id = 'cookie-banner';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Cookies');
    b.innerHTML =
      '<div class="cb-in"><p>' + t.body + '<a href="ailean-privacy.html#cookies">' + t.privacy + '</a></p>' +
      '<div class="cb-btns"><button type="button" class="cb-no">' + t.decline + '</button>' +
      '<button type="button" class="cb-yes">' + t.accept + '</button></div></div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('visible'); }); });

    function close() {
      b.classList.remove('visible');
      setTimeout(function () { b.remove(); }, 260);
    }
    b.querySelector('.cb-yes').addEventListener('click', function () { set('analytics'); loadGA(); close(); });
    b.querySelector('.cb-no').addEventListener('click', function () {
      var had = get() === 'analytics';
      set('necessary'); clearGACookies(); close();
      if (had && gaLoaded) location.reload(); /* stop the already-loaded script */
    });
  }

  function init() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!el) return;
      e.preventDefault();
      show();
    });
    var c = get();
    if (c === 'analytics') loadGA();
    else if (c !== 'necessary') show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
