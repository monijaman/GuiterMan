// Language switcher: a custom menu driving Google Website Translator.
// First visit picks a language from the browser settings or the visitor's
// time zone (country); an explicit choice is remembered after that.
(() => {
  const STORAGE_KEY = 'guitar-field-notes-lang';
  const LANGUAGES = [
    { code: 'en', name: 'English', label: 'English', flag: 'gb' },
    { code: 'es', name: 'Español', label: 'Spanish', flag: 'es' },
    { code: 'pt', name: 'Português', label: 'Portuguese', flag: 'br' },
    { code: 'fr', name: 'Français', label: 'French', flag: 'fr' },
    { code: 'de', name: 'Deutsch', label: 'German', flag: 'de' },
    { code: 'it', name: 'Italiano', label: 'Italian', flag: 'it' },
    { code: 'ru', name: 'Русский', label: 'Russian', flag: 'ru' },
    { code: 'zh-CN', name: '中文', label: 'Chinese', flag: 'cn' },
    { code: 'ja', name: '日本語', label: 'Japanese', flag: 'jp' },
    { code: 'ko', name: '한국어', label: 'Korean', flag: 'kr' },
    { code: 'ar', name: 'العربية', label: 'Arabic', flag: 'sa' },
    { code: 'hi', name: 'हिन्दी', label: 'Hindi', flag: 'in' },
    { code: 'bn', name: 'বাংলা', label: 'Bengali', flag: 'bd' },
  ];
  const byCode = Object.fromEntries(LANGUAGES.map((lang) => [lang.code, lang]));

  const COUNTRY_LANG = {};
  const countryGroups = {
    es: 'ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY PR',
    pt: 'PT BR AO MZ',
    fr: 'FR SN CI CM ML BF NE CD HT MG MC',
    de: 'DE AT CH LI',
    it: 'IT SM',
    ru: 'RU BY KZ KG',
    'zh-CN': 'CN TW HK MO',
    ja: 'JP',
    ko: 'KR',
    ar: 'SA AE EG IQ JO KW LB LY MA DZ TN OM QA BH SY YE SD',
    hi: 'IN',
    bn: 'BD',
  };
  for (const [code, countries] of Object.entries(countryGroups)) {
    for (const country of countries.split(' ')) COUNTRY_LANG[country] = code;
  }

  const TIMEZONE_COUNTRY = {
    'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'America/Mexico_City': 'MX', 'America/Monterrey': 'MX',
    'America/Cancun': 'MX', 'America/Tijuana': 'MX', 'America/Bogota': 'CO', 'America/Santiago': 'CL',
    'America/Lima': 'PE', 'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/Guatemala': 'GT',
    'America/Havana': 'CU', 'America/La_Paz': 'BO', 'America/Santo_Domingo': 'DO', 'America/Tegucigalpa': 'HN',
    'America/Asuncion': 'PY', 'America/El_Salvador': 'SV', 'America/Managua': 'NI', 'America/Costa_Rica': 'CR',
    'America/Panama': 'PA', 'America/Montevideo': 'UY', 'America/Puerto_Rico': 'PR',
    'Europe/Lisbon': 'PT', 'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR',
    'America/Bahia': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR', 'Africa/Luanda': 'AO', 'Africa/Maputo': 'MZ',
    'Europe/Paris': 'FR', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Douala': 'CM',
    'America/Port-au-Prince': 'HT', 'Europe/Monaco': 'MC',
    'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Rome': 'IT',
    'Europe/Moscow': 'RU', 'Europe/Samara': 'RU', 'Asia/Yekaterinburg': 'RU', 'Asia/Novosibirsk': 'RU',
    'Asia/Krasnoyarsk': 'RU', 'Asia/Irkutsk': 'RU', 'Asia/Vladivostok': 'RU', 'Europe/Minsk': 'BY',
    'Asia/Almaty': 'KZ', 'Asia/Bishkek': 'KG',
    'Asia/Shanghai': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Macau': 'MO',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
    'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Africa/Cairo': 'EG', 'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO',
    'Asia/Kuwait': 'KW', 'Asia/Beirut': 'LB', 'Africa/Tripoli': 'LY', 'Africa/Casablanca': 'MA',
    'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA', 'Asia/Bahrain': 'BH',
    'Asia/Damascus': 'SY', 'Asia/Aden': 'YE', 'Africa/Khartoum': 'SD',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dhaka': 'BD',
  };

  function detectCountry() {
    let timeZone = '';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
    if (TIMEZONE_COUNTRY[timeZone]) return TIMEZONE_COUNTRY[timeZone];
    if (timeZone.startsWith('America/Argentina/')) return 'AR';
    const region = (navigator.language || '').split('-')[1];
    return region && region.length === 2 ? region.toUpperCase() : '';
  }

  function supportedCode(tag) {
    const lower = (tag || '').toLowerCase();
    if (lower.startsWith('zh')) return 'zh-CN';
    const base = lower.split('-')[0];
    return byCode[base] ? base : '';
  }

  // A non-English browser language is the strongest signal; otherwise use the country.
  function detectLanguage(country) {
    for (const tag of navigator.languages || [navigator.language]) {
      const code = supportedCode(tag);
      if (code && code !== 'en') return code;
    }
    return COUNTRY_LANG[country] || 'en';
  }

  function readCookieLang() {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function writeCookieLang(code) {
    const hosts = ['', location.hostname, `.${location.hostname}`];
    for (const host of hosts) {
      const domain = host ? `; domain=${host}` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
    if (code !== 'en') document.cookie = `googtrans=/en/${code}; path=/; max-age=31536000; SameSite=Lax`;
  }

  let saved = '';
  try { saved = localStorage.getItem(STORAGE_KEY) || ''; } catch {}
  const country = detectCountry();
  const detected = detectLanguage(country);

  let current = byCode[saved] ? saved : '';
  if (!current) {
    current = byCode[readCookieLang()] ? readCookieLang() : detected;
  }
  if (readCookieLang() !== (current === 'en' ? '' : current)) writeCookieLang(current);

  // Keep musical notation, diagrams and the brand mark out of translation.
  function markNoTranslate(el) {
    el.setAttribute('translate', 'no');
    el.classList.add('notranslate');
  }

  function protect(root) {
    if (!(root instanceof Element)) return;
    const targets = root.matches('svg, canvas, .brand, .notranslate') ? [root] : [];
    targets.push(...root.querySelectorAll('svg, canvas, .brand'));
    targets.forEach(markNoTranslate);
  }

  // Note names (C, F#, Bb), chords (Am, Bdim, Cmaj7, D/F#), keys (A minor) and
  // Roman numerals (ii, IV, vii°) stay in English inside translated text.
  const NOTE = '[A-G](?:#|b|♯|♭)?';
  const QUALITY = '(?:maj|min|dim|aug|sus|add|m|°|ø|\\+)?\\d*(?:(?:sus|add|maj|b|#|♭|♯)\\d+)*';
  const CHORD = `${NOTE}${QUALITY}(?:\\/${NOTE})?`;
  const ROMAN = '(?:b|♭)?(?:vii|VII|iii|III|ii|II|iv|IV|vi|VI|v|V|i|I)(?:°|ø|\\+|maj7|m7|7)?';
  const SAFE_ROMAN = '(?:b|♭)?(?:vii|VII|iii|III|ii|IV|iv|vi|VI|V)(?:°|ø|\\+|maj7|m7|7)?';
  const END = '(?![\\w#♯♭°ø+])';
  const START = '(?<![\\w#♯♭])';
  const RUN_SEP = '(?:\\s*[–—\\-,]\\s*|\\s+)';
  // "key of G" is kept whole: machine translation turns "key" into a door key.
  const KEY = `(?:[Kk]ey of\\s+)?${CHORD}(?:\\s+(?:major|minor))?`;
  // A text node made only of notation, e.g. a table cell "C E G", "F#dim", "vii°", "7" or "minor".
  const WHOLE_NODE = new RegExp(`^[\\s–—\\-,·()/]*(?:(?:${CHORD}|${ROMAN}|\\d+|dim|aug|major|minor)${END}[\\s–—\\-,·()/]*)+$`);
  // Notation inside a sentence: chord/key runs, Roman numeral progressions, lone safe numerals.
  const IN_TEXT = new RegExp(
    `${START}(?:${KEY}${END}(?:${RUN_SEP}${KEY}${END})*|${ROMAN}(?:\\s*[–—\\-,]\\s*${ROMAN})+${END}|${SAFE_ROMAN}${END})`,
    'g',
  );
  const SKIP_PARENTS = 'script, style, textarea, code, pre, font, svg, .notranslate, [translate="no"]';

  // A bare capital "A" at the start of a sentence, followed by an ordinary word,
  // is the article ("A visual guide"); anywhere else it is the note.
  function isArticle(match, before, rest) {
    if (match !== 'A' || !/(?:^|[.!?:"“‘]\s*)\s*$/.test(before)) return false;
    if (/^\s+(?:string|note|notes|root|shape|form|and|or|is|to)\b/.test(rest)) return false;
    return /^\s+(?:[a-z]|[A-Z][a-z]{2,})/.test(rest);
  }

  function protectText(node) {
    const text = node.nodeValue;
    const parent = node.parentElement;
    if (!parent || !text.trim() || parent.closest(SKIP_PARENTS)) return;

    if (WHOLE_NODE.test(text)) {
      if (parent.childNodes.length === 1 || parent.matches('option')) {
        markNoTranslate(parent);
        if (parent.matches('b, strong, em, i, span, a, small')) parent.classList.add('gfn-note');
        return;
      }
      const span = document.createElement('span');
      markNoTranslate(span);
      node.replaceWith(span);
      span.append(node);
      return;
    }
    if (parent.matches('option, title')) return;

    const pieces = [];
    let last = 0;
    for (const found of text.matchAll(IN_TEXT)) {
      const end = found.index + found[0].length;
      if (isArticle(found[0], text.slice(0, found.index), text.slice(end))) continue;
      pieces.push(text.slice(last, found.index));
      const span = document.createElement('span');
      markNoTranslate(span);
      span.classList.add('gfn-note');
      span.textContent = found[0];
      pieces.push(span);
      last = end;
    }
    if (!pieces.length) return;
    pieces.push(text.slice(last));
    node.replaceWith(...pieces.filter((piece) => piece !== ''));
  }

  function protectNotation(root) {
    if (root.nodeType === Node.TEXT_NODE) return protectText(root);
    if (!(root instanceof Element) || root.closest(SKIP_PARENTS)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(protectText);
  }

  if (current !== 'en') {
    protect(document.body);
    protectNotation(document.body);
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          protect(node);
          protectNotation(node);
        });
      }
    }).observe(document.body, { childList: true, subtree: true });

    const host = document.createElement('div');
    host.id = 'gfn-translate-el';
    host.hidden = true;
    document.body.append(host);
    window.gfnTranslateInit = () => {
      new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'gfn-translate-el');
    };
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=gfnTranslateInit';
    script.async = true;
    document.head.append(script);
  }

  const flagUrl = (flag) => `https://flagcdn.com/${flag}.svg`;
  let countryName = '';
  if (country) {
    try { countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(country) || ''; } catch {}
  }

  const wrap = document.createElement('div');
  wrap.className = 'lang-switch notranslate';
  wrap.setAttribute('translate', 'no');

  const active = byCode[current];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lang-button';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', `Language: ${active.label}. Change language`);
  button.innerHTML = `
    <svg class="lang-globe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5M12 2.5C9.4 5.2 8.1 8.4 8.1 12s1.3 6.8 3.9 9.5"/></svg>
    <img class="lang-flag" src="${flagUrl(active.flag)}" alt="" width="20" height="15">
    <span class="lang-current">${active.name}</span>
    <span class="lang-code">${active.code.slice(0, 2).toUpperCase()}</span>
    <svg class="lang-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>`;

  const menu = document.createElement('div');
  menu.className = 'lang-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  const detectedLang = byCode[detected];
  const detectedNote = countryName
    ? `<p class="lang-detected"><img src="${flagUrl(country.toLowerCase())}" alt="" width="18" height="13"> We think you're in <strong>${countryName}</strong>${detected !== 'en' ? ` · suggested: ${detectedLang.name}` : ''}</p>`
    : '';
  menu.innerHTML = `
    <div class="lang-menu-head"><span>Choose language</span><span class="lang-count">${LANGUAGES.length} languages</span></div>
    ${detectedNote}
    <div class="lang-grid">
      ${LANGUAGES.map((lang) => `
        <button type="button" role="menuitemradio" class="lang-option${lang.code === current ? ' is-active' : ''}${lang.code === detected && lang.code !== 'en' ? ' is-suggested' : ''}" data-lang="${lang.code}" aria-checked="${lang.code === current}" lang="${lang.code}">
          <img src="${flagUrl(lang.flag)}" alt="" width="22" height="16" loading="lazy">
          <span><strong>${lang.name}</strong><small>${lang.label}</small></span>
        </button>`).join('')}
    </div>
    <p class="lang-footnote">Automatic translation by Google. Chord names and diagrams stay in standard notation.</p>`;

  wrap.append(button, menu);

  function setOpen(open) {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    wrap.classList.toggle('is-open', open);
    if (open) menu.querySelector('.lang-option.is-active')?.focus();
  }

  button.addEventListener('click', () => setOpen(menu.hidden));
  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      button.focus();
    }
  });
  menu.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const options = [...menu.querySelectorAll('.lang-option')];
    const index = options.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    options[(index + step + options.length) % options.length].focus();
    event.preventDefault();
  });
  menu.addEventListener('click', (event) => {
    const option = event.target.closest('.lang-option');
    if (!option) return;
    const code = option.dataset.lang;
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    if (code === current) return setOpen(false);
    if (typeof window.gtag === 'function') window.gtag('event', 'language_change', { language: code });
    writeCookieLang(code);
    location.reload();
  });

  const topbar = document.querySelector('.topbar');
  const themeToggle = topbar?.querySelector('.theme-toggle');
  const tools = document.createElement('div');
  tools.className = 'topbar-tools';
  tools.append(wrap);
  if (themeToggle) tools.append(themeToggle);
  topbar?.append(tools);
})();
