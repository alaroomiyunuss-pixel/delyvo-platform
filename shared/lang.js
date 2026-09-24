/* Delyvo — language selection shared by every page. Loaded first, before the apps read their saved language.
   1. ?lang=en (or ar / nl) in the URL sets the language for every app (hub, customer, driver, restaurant, admin).
   2. Otherwise, an app the visitor never set a language for follows the device/browser language:
      Arabic → ar, Dutch → nl, anything else → en. A language picked by hand is saved and always wins. */
(function () {
  const APPS = ['hub', 'customer', 'driver', 'restaurant', 'admin'];
  const ONLY_AR_EN = ['hub', 'admin']; // these two have no Dutch UI
  const fit = (app, l) => (ONLY_AR_EN.includes(app) && l === 'nl' ? 'en' : l);
  function detect() {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map((x) => String(x).toLowerCase());
    for (const l of list) { if (l.startsWith('ar')) return 'ar'; if (l.startsWith('nl')) return 'nl'; if (l.startsWith('en')) return 'en'; }
    return 'en';
  }
  try {
    const forced = new URLSearchParams(location.search).get('lang');
    if (['ar', 'nl', 'en'].includes(forced)) { APPS.forEach((a) => localStorage.setItem('delyvo.' + a + '.lang', fit(a, forced))); return; }
    const auto = detect();
    APPS.forEach((a) => { const k = 'delyvo.' + a + '.lang'; if (!localStorage.getItem(k)) localStorage.setItem(k, fit(a, auto)); });
  } catch (e) {}
})();
