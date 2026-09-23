/* Delyvo — shared client-side store.
   One JSON document in localStorage, synced live between every open tab/app
   (storage event + BroadcastChannel). All four apps (customer, driver,
   restaurant, admin) read and mutate the same state through window.DV.

   API summary
   -----------
   DV.state                      current state object (read only — mutate via DV.commit / actions)
   DV.on(fn)                     subscribe to changes: fn(state, {remote})
   DV.commit(fn)                 reload latest, run fn(state), save, broadcast
   DV.reset()                    wipe and reseed demo data
   DV.session(app[, value])      per-app login session (get / set / null to clear)

   Dates:   DV.today(), DV.addDays(iso,n), DV.weekday(iso), DV.isLocked(iso), DV.fmtDate(iso,lang,opts), DV.fmtTime(ts,lang)
   Lookups: DV.meal(id) DV.restaurant(id) DV.customer(id) DV.driver(id) DV.sub(id) DV.order(id) DV.planType(id) DV.mealOption(id)
   Text:    DV.L(value, lang)  -> picks value[lang] / value.ar / string;  DV.money(n, lang);  DV.esc(str)
   Meta:    DV.STATUS, DV.ALLERGENS, DV.TAGS, DV.SLOTS

   Actions: DV.price(cfg) DV.buildDates(start,weekdays,count) DV.mealsFor(planType,slot,customer)
            DV.isSafe(meal,customer) DV.createSubscription(customerId,cfg) DV.setDayMeal(subId,date,slot,mealId)
            DV.postponeDay(subId,date) DV.setOrderStatus(ids,status,{by,reason,proof})
            DV.assignDriver(ids,driverId) DV.autoAssign(date) DV.rateOrder(id,stars,comment)
            DV.notify(to,{title,body,icon,key,link}) DV.notificationsFor(to) DV.markRead(to[,id])
            DV.registerCustomer({name,phone,email}) DV.findCustomerByPhone(phone) DV.updateCustomer(id,patch)
            DV.broadcast(target,title,body) DV.housekeeping() DV.driverForCity(city)
            DV.ordersFor({date,restaurantId,driverId,customerId,subId,statuses})
*/
(function () {
  const VERSION = 4;
  const KEY = 'delyvo.state.v' + VERSION;
  const SEED = window.DV_SEED_DATA;
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('delyvo-sync') : null;
  const listeners = new Set();
  let state = null;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');

  // ---------------- dates ----------------
  const toISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const weekday = (iso) => fromISO(iso).getDay();
  const LOCALE = { ar: 'ar-u-nu-latn', nl: 'nl-NL', en: 'en-GB' };
  function fmtDate(iso, lang = 'ar', opts) {
    return fromISO(iso).toLocaleDateString(LOCALE[lang] || 'ar', opts || { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function fmtTime(ts, lang = 'ar') {
    return new Date(ts).toLocaleTimeString(LOCALE[lang] || 'ar', { hour: '2-digit', minute: '2-digit' });
  }
  /** A delivery date is locked (no meal change / postpone) once the cutoff for it has passed. */
  function isLocked(iso) {
    const t = today();
    if (iso <= t) return true;
    if (iso === addDays(t, 1) && new Date().getHours() >= state.settings.cutoffHour) return true;
    return false;
  }

  // ---------------- text ----------------
  function L(v, lang = 'ar') {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return v[lang] ?? v.ar ?? v.en ?? '';
  }
  function money(n, lang = 'ar') {
    return new Intl.NumberFormat(LOCALE[lang] || 'nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STATUS = {
    scheduled: { ar: 'مجدول',         nl: 'Gepland',        en: 'Scheduled',     color: '#64748B', step: 0 },
    accepted:  { ar: 'مقبول',         nl: 'Geaccepteerd',   en: 'Accepted',      color: '#2563EB', step: 1 },
    preparing: { ar: 'قيد التحضير',   nl: 'In bereiding',   en: 'Preparing',     color: '#D97706', step: 2 },
    ready:     { ar: 'جاهز للاستلام', nl: 'Klaar',          en: 'Ready',         color: '#7C3AED', step: 3 },
    picked:    { ar: 'استلمه السائق', nl: 'Opgehaald',      en: 'Picked up',     color: '#0891B2', step: 4 },
    on_way:    { ar: 'في الطريق',     nl: 'Onderweg',       en: 'On the way',    color: '#0284C7', step: 5 },
    delivered: { ar: 'تم التوصيل',    nl: 'Bezorgd',        en: 'Delivered',     color: '#16A34A', step: 6 },
    failed:    { ar: 'تعذّر التوصيل', nl: 'Niet bezorgd',   en: 'Failed',        color: '#DC2626', step: 6 },
    cancelled: { ar: 'مؤجَّل / ملغي', nl: 'Verzet / geannuleerd', en: 'Postponed / cancelled', color: '#94A3B8', step: -1 }
  };
  const SLOTS = {
    lunch:  { ar: 'غداء', nl: 'Lunch', en: 'Lunch', icon: '☀️' },
    dinner: { ar: 'عشاء', nl: 'Diner', en: 'Dinner', icon: '🌙' }
  };

  // ---------------- persistence & sync ----------------
  function readStored() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.version === VERSION) return s; } } catch (e) {}
    return null;
  }
  function persist() {
    state.rev = (state.rev || 0) + 1;
    state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Delyvo: storage full', e); }
    if (bc) bc.postMessage({ rev: state.rev });
  }
  function emit(remote) { listeners.forEach((fn) => { try { fn(state, { remote }); } catch (e) { console.error(e); } }); }
  function reloadRemote() {
    const s = readStored();
    if (s && s.rev !== state.rev) { state = s; emit(true); }
  }
  window.addEventListener('storage', (e) => { if (e.key === KEY) reloadRemote(); });
  if (bc) bc.onmessage = () => reloadRemote();

  function commit(fn) {
    const fresh = readStored(); if (fresh) state = fresh;
    const out = fn(state);
    persist(); emit(false);
    return out;
  }

  // ---------------- lookups ----------------
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const meal = (id) => byId(state.meals, id);
  const restaurant = (id) => byId(state.restaurants, id);
  const customer = (id) => byId(state.customers, id);
  const driver = (id) => byId(state.drivers, id);
  const sub = (id) => byId(state.subscriptions, id);
  const order = (id) => byId(state.orders, id);
  const planType = (id) => byId(state.plans.types, id);
  const mealOption = (id) => byId(state.plans.mealOptions, id);
  const uid = (p) => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

  function driverForCity(city) {
    const map = { 'Rotterdam': 'd1', 'Schiedam': 'd1', 'Capelle aan den IJssel': 'd1', 'Den Haag': 'd2', 'Rijswijk': 'd2', 'Delft': 'd3' };
    const want = map[city];
    const online = state.drivers.filter((d) => d.online);
    if (want && online.find((d) => d.id === want)) return want;
    return (online[0] || state.drivers[0] || {}).id || null;
  }

  // ---------------- catalogue helpers ----------------
  function isSafe(m, c) {
    if (!c || !c.allergies || !c.allergies.length) return true;
    return !m.allergens.some((a) => c.allergies.includes(a));
  }
  function mealsFor(planTypeId, slot, c) {
    return state.meals.filter((m) => m.active && m.plans.includes(planTypeId) && (!slot || m.slots.includes(slot)) &&
      (restaurant(m.restaurantId) || {}).active !== false);
  }
  function chefPick(planTypeId, slot, c, avoid = []) {
    const pool = mealsFor(planTypeId, slot, c).filter((m) => isSafe(m, c));
    if (!pool.length) return null;
    const fresh = pool.filter((m) => !avoid.includes(m.id));
    const list = fresh.length ? fresh : pool;
    list.sort((a, b) => (b.rating || 4) - (a.rating || 4) + (Math.random() - 0.5) * 1.2);
    return list[0].id;
  }

  function buildDates(start, weekdays, count) {
    const out = []; let d = start; let guard = 0;
    while (out.length < count && guard++ < 400) { if (weekdays.includes(weekday(d))) out.push(d); d = addDays(d, 1); }
    return out;
  }

  function price(cfg) {
    const t = planType(cfg.planType), dur = state.plans.durations.find((x) => x.days === +cfg.days), opt = mealOption(cfg.option);
    if (!t || !dur || !opt) return null;
    const meals = dur.days * opt.slots.length;
    const base = meals * t.pricePerMeal;
    const durDisc = base * dur.discount;
    const optDisc = (base - durDisc) * opt.discount;
    const subtotal = base - durDisc - optDisc;
    const zone = state.zones.find((z) => z.city === cfg.city);
    const deliveryFee = (zone ? zone.fee : 0) * dur.days;
    let promoDisc = 0, promo = null;
    if (cfg.promo) {
      promo = state.promos.find((p) => p.active && p.code.toUpperCase() === String(cfg.promo).trim().toUpperCase()) || null;
      if (promo) promoDisc = promo.type === 'percent' ? subtotal * promo.value / 100 : Math.min(promo.value, subtotal);
    }
    const r2 = (n) => Math.round(n * 100) / 100;
    const total = r2(Math.max(0, subtotal + deliveryFee - promoDisc));
    return { meals, base: r2(base), durDisc: r2(durDisc), optDisc: r2(optDisc), subtotal: r2(subtotal), deliveryFee: r2(deliveryFee),
      promoDisc: r2(promoDisc), promo: promo ? promo.code : null, total, vat: r2(total - total / (1 + state.settings.vatRate)), perMeal: r2(total / meals) };
  }

  // ---------------- notifications ----------------
  function notify(to, n) {
    if (n.key && state.notifications.some((x) => x.to === to && x.key === n.key)) return;
    state.notifications.unshift({ id: uid('n'), to, title: n.title, body: n.body || '', icon: n.icon || '🔔', key: n.key || null, link: n.link || null, at: n.at || Date.now(), read: !!n.read });
    if (state.notifications.length > 600) state.notifications.length = 600;
  }
  const notificationsFor = (to) => state.notifications.filter((n) => n.to === to);
  function markRead(to, id) {
    commit((s) => s.notifications.forEach((n) => { if (n.to === to && (!id || n.id === id)) n.read = true; }));
  }

  // ---------------- orders ----------------
  function makeOrder(s, sb, date, slot, mealId, c) {
    const m = mealId ? byId(s.meals, mealId) : null;
    const addr = (c.addresses.find((a) => a.id === sb.addressId) || c.addresses[0] || {});
    s.seq = (s.seq || 10000) + 1;
    const o = { id: uid('o'), no: 'DV' + s.seq, subId: sb.id, customerId: c.id, date, slot, mealId: mealId || null,
      restaurantId: m ? m.restaurantId : null, status: 'scheduled', driverId: null, window: sb.window, city: addr.city || '',
      printed: false, auto: false, history: [{ s: 'scheduled', at: Date.now() }], rating: null, comment: '', createdAt: Date.now() };
    s.orders.push(o);
    return o;
  }
  function ordersFor(q = {}) {
    return state.orders.filter((o) =>
      (!q.date || o.date === q.date) && (!q.restaurantId || o.restaurantId === q.restaurantId) &&
      (!q.driverId || o.driverId === q.driverId) && (!q.customerId || o.customerId === q.customerId) &&
      (!q.subId || o.subId === q.subId) && (!q.statuses || q.statuses.includes(o.status)));
  }

  // ---------------- customers ----------------
  const normPhone = (p) => String(p || '').replace(/[^\d]/g, '').replace(/^0031/, '31').replace(/^0/, '31');
  function findCustomerByPhone(phone) { const n = normPhone(phone); return state.customers.find((c) => normPhone(c.phone) === n) || null; }
  function registerCustomer({ name, phone, email }) {
    return commit((s) => {
      const c = { id: uid('c'), name: name || '', phone, email: email || '', allergies: [], dislikes: '', goal: 'balanced', addresses: [],
        wallet: 0, lang: 'ar', createdAt: Date.now(), notifPrefs: { push: true, whatsapp: true, email: false } };
      s.customers.push(c);
      notify('admin', { title: 'عميل جديد سجّل', body: (name || phone), icon: '👤' });
      return c;
    });
  }
  function updateCustomer(id, patch) { return commit((s) => { const c = byId(s.customers, id); Object.assign(c, patch); return c; }); }

  // ---------------- subscriptions ----------------
  function createSubscriptionIn(s, customerId, cfg, opts = {}) {
    const c = byId(s.customers, customerId);
    const pr = price({ ...cfg, city: (c.addresses.find((a) => a.id === cfg.addressId) || {}).city });
    const dates = buildDates(cfg.startDate, cfg.weekdays, +cfg.days);
    const slots = mealOption(cfg.option).slots;
    s.seq = (s.seq || 10000) + 1;
    const sb = { id: uid('s'), code: 'SUB-' + s.seq, customerId, planType: cfg.planType, daysCount: +cfg.days, option: cfg.option,
      startDate: dates[0], weekdays: cfg.weekdays.slice(), window: cfg.window, addressId: cfg.addressId, status: 'active',
      pricing: pr, payment: { method: cfg.payment.method, detail: cfg.payment.detail || '', ref: 'PAY-' + Math.random().toString(36).slice(2, 9).toUpperCase(), paidAt: opts.paidAt || Date.now() },
      postponed: 0, notes: cfg.notes || '', createdAt: opts.paidAt || Date.now(), days: [] };
    dates.forEach((date) => {
      const picks = (cfg.picks && cfg.picks[date]) || {};
      const day = { date, status: 'active', meals: {}, auto: {} };
      slots.forEach((sl) => { day.meals[sl] = picks[sl] || null; });
      sb.days.push(day);
      slots.forEach((sl) => makeOrder(s, sb, date, sl, day.meals[sl], c));
    });
    s.subscriptions.push(sb);
    if (pr && pr.promo) { const p = s.promos.find((x) => x.code === pr.promo); if (p) p.uses++; }
    if (!opts.silent) {
      const to = 'customer:' + customerId;
      notify(to, { icon: '✅', title: { ar: 'تم الدفع وتفعيل اشتراكك', nl: 'Betaling gelukt — abonnement actief', en: 'Payment received — plan active' },
        body: { ar: `${sb.code} · يبدأ ${fmtDate(sb.startDate, 'ar')}`, nl: `${sb.code} · start ${fmtDate(sb.startDate, 'nl')}`, en: `${sb.code} · starts ${fmtDate(sb.startDate, 'en')}` } });
      const empty = sb.days.filter((d) => Object.values(d.meals).some((v) => !v)).length;
      if (empty) notify(to, { icon: '🍽️', title: { ar: 'باقي تختار وجباتك', nl: 'Kies nog je maaltijden', en: 'Pick your remaining meals' },
        body: { ar: `عندك ${empty} يوم بدون اختيار. لو ما اخترت، الشيف يختار لك قبل الموعد.`, nl: `${empty} dag(en) zonder keuze. Anders kiest de chef voor je.`, en: `${empty} day(s) without a pick. Otherwise the chef chooses for you.` } });
      notify('admin', { icon: '💳', title: `اشتراك جديد ${sb.code}`, body: `${c.name} · ${L(planType(sb.planType).name)} · ${sb.daysCount} يوم · ${money(pr.total)}` });
      const perR = {};
      s.orders.filter((o) => o.subId === sb.id && o.restaurantId).forEach((o) => { perR[o.restaurantId] = (perR[o.restaurantId] || 0) + 1; });
      Object.entries(perR).forEach(([rid, n]) => notify('restaurant:' + rid, { icon: '🧾', title: `وصلتك ${n} طلبات جديدة`, body: `اشتراك ${sb.code} · من ${fmtDate(sb.startDate)}` }));
    }
    return sb;
  }
  const createSubscription = (customerId, cfg) => commit((s) => createSubscriptionIn(s, customerId, cfg));

  function setDayMeal(subId, date, slot, mealId) {
    if (isLocked(date)) return false;
    return commit((s) => {
      const sb = byId(s.subscriptions, subId); const day = sb.days.find((d) => d.date === date && d.status === 'active');
      if (!day) return false;
      const prev = day.meals[slot];
      day.meals[slot] = mealId; day.auto[slot] = false;
      const o = s.orders.find((x) => x.subId === subId && x.date === date && x.slot === slot && x.status !== 'cancelled');
      if (o) {
        const m = byId(s.meals, mealId);
        const prevR = o.restaurantId;
        o.mealId = mealId; o.restaurantId = m ? m.restaurantId : null; o.status = 'scheduled'; o.printed = false; o.auto = false;
        if (prevR && prevR !== o.restaurantId && prev) notify('restaurant:' + prevR, { icon: '↩️', title: 'طلب اتحوّل', body: `${o.no} · ${fmtDate(date)} لم يعد عندكم` });
      }
      return true;
    });
  }

  function postponeDay(subId, date) {
    if (isLocked(date)) return { ok: false, reason: 'locked' };
    return commit((s) => {
      const sb = byId(s.subscriptions, subId);
      if (sb.postponed >= s.settings.maxPostpones) return { ok: false, reason: 'limit' };
      const day = sb.days.find((d) => d.date === date && d.status === 'active');
      if (!day) return { ok: false, reason: 'missing' };
      day.status = 'postponed';
      const c = byId(s.customers, sb.customerId);
      s.orders.filter((o) => o.subId === subId && o.date === date && o.status !== 'cancelled').forEach((o) => {
        o.status = 'cancelled'; o.history.push({ s: 'cancelled', at: Date.now(), note: 'postponed' });
        if (o.restaurantId) notify('restaurant:' + o.restaurantId, { icon: '📅', title: 'طلب تأجّل', body: `${o.no} · ${fmtDate(date)}` });
      });
      const last = sb.days.filter((d) => d.status === 'active').map((d) => d.date).sort().pop() || date;
      let nd = addDays(last > date ? last : date, 1), guard = 0;
      while (!sb.weekdays.includes(weekday(nd)) && guard++ < 14) nd = addDays(nd, 1);
      const newDay = { date: nd, status: 'active', meals: { ...day.meals }, auto: {}, movedFrom: date };
      sb.days.push(newDay); sb.days.sort((a, b) => a.date.localeCompare(b.date));
      Object.entries(newDay.meals).forEach(([sl, mid]) => makeOrder(s, sb, nd, sl, mid, c));
      sb.postponed++;
      notify('customer:' + c.id, { icon: '📅', title: { ar: 'تم تأجيل وجبتك', nl: 'Maaltijd verzet', en: 'Meal postponed' },
        body: { ar: `من ${fmtDate(date, 'ar')} إلى ${fmtDate(nd, 'ar')}`, nl: `Van ${fmtDate(date, 'nl')} naar ${fmtDate(nd, 'nl')}`, en: `From ${fmtDate(date, 'en')} to ${fmtDate(nd, 'en')}` } });
      notify('admin', { icon: '📅', title: 'تأجيل يوم', body: `${c.name} · ${sb.code} · ${date} → ${nd}` });
      return { ok: true, newDate: nd };
    });
  }

  // ---------------- order lifecycle ----------------
  function setOrderStatus(ids, status, meta = {}) {
    ids = [].concat(ids);
    return commit((s) => {
      ids.forEach((id) => {
        const o = byId(s.orders, id); if (!o || o.status === status) return;
        o.status = status; o.history.push({ s: status, at: Date.now(), by: meta.by || '', note: meta.reason || '' });
        if (meta.proof) o.proof = meta.proof;
        if (meta.reason) o.failReason = meta.reason;
        const to = 'customer:' + o.customerId; const k = o.date + ':' + status;
        const dname = o.driverId ? (byId(s.drivers, o.driverId) || {}).name : '';
        if (status === 'preparing') notify(to, { key: 'prep:' + k, icon: '👨‍🍳', title: { ar: 'وجبتك قيد التحضير', nl: 'Je maaltijd wordt bereid', en: 'Your meal is being prepared' }, body: { ar: 'المطبخ بدأ تحضير وجبة اليوم بمكونات طازجة', nl: 'De keuken is gestart met verse ingrediënten', en: 'The kitchen started with fresh ingredients' } });
        if (status === 'ready' && o.driverId) notify('driver:' + o.driverId, { icon: '📦', title: 'طلب جاهز للاستلام', body: `${o.no} · ${(byId(s.restaurants, o.restaurantId) || {}).name || ''}` });
        if (status === 'on_way' || status === 'picked') notify(to, { key: 'way:' + o.date, icon: '🛵', title: { ar: 'المندوب في الطريق إليك', nl: 'Bezorger is onderweg', en: 'Your driver is on the way' }, body: { ar: `${dname} يوصل طلبك خلال الفترة المحددة`, nl: `${dname} bezorgt binnen je tijdvak`, en: `${dname} will arrive within your window` } });
        if (status === 'delivered') notify(to, { key: 'del:' + o.date, icon: '🎉', title: { ar: 'تم توصيل وجبتك — بالعافية!', nl: 'Bezorgd — eet smakelijk!', en: 'Delivered — enjoy!' }, body: { ar: 'قيّم وجبتك عشان نحسّن اختياراتك', nl: 'Beoordeel je maaltijd', en: 'Rate your meal to improve picks' } });
        if (status === 'failed') {
          notify(to, { key: 'fail:' + o.date, icon: '⚠️', title: { ar: 'تعذّر توصيل الطلب', nl: 'Bezorging mislukt', en: 'Delivery failed' }, body: { ar: 'فريق الدعم بيتواصل معك الآن', nl: 'Support neemt contact op', en: 'Support will contact you' } });
          notify('admin', { icon: '⚠️', title: `تعذّر توصيل ${o.no}`, body: `${(byId(s.customers, o.customerId) || {}).name} · ${meta.reason || ''}` });
        }
      });
      return true;
    });
  }
  function assignDriver(ids, driverId) {
    ids = [].concat(ids);
    return commit((s) => {
      ids.forEach((id) => { const o = byId(s.orders, id); if (o) o.driverId = driverId; });
      if (driverId && ids.length) notify('driver:' + driverId, { icon: '🗺️', title: `تم إسناد ${ids.length} طلب لك`, body: 'افتح قائمة التوصيل لليوم' });
    });
  }
  function autoAssign(date) {
    return commit((s) => {
      let n = 0;
      s.orders.filter((o) => o.date === date && !o.driverId && o.status !== 'cancelled').forEach((o) => { o.driverId = driverForCity(o.city); n++; });
      return n;
    });
  }
  function rateOrder(id, stars, comment) {
    return commit((s) => {
      const o = byId(s.orders, id); if (!o) return;
      o.rating = stars; o.comment = comment || '';
      const m = byId(s.meals, o.mealId);
      if (m) { m.rating = ((m.rating || 0) * m.ratingCount + stars) / (m.ratingCount + 1); m.ratingCount++; }
      if (stars <= 2) {
        notify('admin', { icon: '⭐', title: `تقييم منخفض (${stars}/5)`, body: `${m ? L(m.name) : ''} · ${comment || ''}` });
        if (o.restaurantId) notify('restaurant:' + o.restaurantId, { icon: '⭐', title: `تقييم ${stars}/5 على ${m ? L(m.name) : ''}`, body: comment || '' });
      }
    });
  }
  function broadcast(target, title, body) {
    return commit((s) => {
      const list = target === 'customers' ? s.customers.map((c) => 'customer:' + c.id)
        : target === 'drivers' ? s.drivers.map((d) => 'driver:' + d.id)
        : s.restaurants.map((r) => 'restaurant:' + r.id);
      list.forEach((to) => notify(to, { icon: '📣', title, body }));
      return list.length;
    });
  }

  // ---------------- housekeeping (idempotent) ----------------
  function housekeeping() {
    const t = today();
    let changed = false;
    const s = state;
    s.subscriptions.forEach((sb) => {
      if (sb.status !== 'active') return;
      const c = byId(s.customers, sb.customerId); if (!c) return;
      sb.days.forEach((d) => {
        if (d.status !== 'active') return;
        Object.keys(d.meals).forEach((sl) => {
          if (d.meals[sl] || !isLocked(d.date)) return;
          const recent = sb.days.flatMap((x) => Object.values(x.meals)).filter(Boolean);
          const mid = chefPick(sb.planType, sl, c, recent.slice(-6));
          if (!mid) return;
          d.meals[sl] = mid; d.auto[sl] = true; changed = true;
          const o = s.orders.find((x) => x.subId === sb.id && x.date === d.date && x.slot === sl && x.status !== 'cancelled');
          if (o) { o.mealId = mid; o.restaurantId = byId(s.meals, mid).restaurantId; o.auto = true; }
          notify('customer:' + c.id, { key: 'auto:' + sb.id + d.date + sl, icon: '👨‍🍳', title: { ar: 'اختار لك الشيف وجبتك', nl: 'De chef koos voor je', en: 'The chef picked for you' },
            body: { ar: `${L(byId(s.meals, mid).name, 'ar')} · ${fmtDate(d.date, 'ar')}`, nl: `${L(byId(s.meals, mid).name, 'nl')} · ${fmtDate(d.date, 'nl')}`, en: `${L(byId(s.meals, mid).name, 'en')} · ${fmtDate(d.date, 'en')}` } });
        });
      });
      const soon = sb.days.filter((d) => d.status === 'active' && d.date > t && d.date <= addDays(t, 3) && Object.values(d.meals).some((v) => !v));
      if (soon.length) { notify('customer:' + c.id, { key: 'remind:' + sb.id + ':' + t, icon: '⏰', title: { ar: 'تذكير: اختر وجبات الأيام الجاية', nl: 'Herinnering: kies je maaltijden', en: 'Reminder: pick upcoming meals' }, body: { ar: `${soon.length} يوم خلال ٣ أيام بدون اختيار — آخر موعد ${s.settings.cutoffHour}:00 قبل يوم التوصيل`, nl: `${soon.length} dag(en) zonder keuze — deadline ${s.settings.cutoffHour}:00 de dag ervoor`, en: `${soon.length} day(s) without a pick — deadline ${s.settings.cutoffHour}:00 the day before` } }); changed = true; }
      const active = sb.days.filter((d) => d.status === 'active');
      const left = active.filter((d) => d.date >= t).length;
      if (left > 0 && left <= 2) { notify('customer:' + c.id, { key: 'ending:' + sb.id, icon: '🔁', title: { ar: 'اشتراكك قرّب يخلص', nl: 'Je abonnement loopt bijna af', en: 'Your plan is ending soon' }, body: { ar: `باقي ${left} يوم — جدّد الآن بدون انقطاع`, nl: `Nog ${left} dag(en) — verleng zonder onderbreking`, en: `${left} day(s) left — renew without a gap` }, link: 'renew' }); changed = true; }
      if (left === 0 && active.every((d) => d.date < t)) { sb.status = 'completed'; changed = true; }
    });
    if (changed) persist();
  }

  // ---------------- seed ----------------
  function seed() {
    const S = clone(SEED);
    const s = {
      version: VERSION, rev: 0, seq: 10000, createdAt: Date.now(),
      settings: S.settings, plans: S.plans, banners: S.banners, restaurants: S.restaurants, meals: S.meals,
      drivers: S.drivers, zones: S.zones, promos: S.promos, customers: [], subscriptions: [], orders: [], notifications: []
    };
    state = s; // lookups used below read `state`
    let r = 42; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const t = today();
    S.people.forEach((p, i) => {
      const [name, city, street, zip, allergies] = p;
      s.customers.push({ id: 'c' + (i + 1), name, phone: i === 0 ? '+31 6 1234 5678' : '+31 6 ' + (20000000 + i * 137911).toString().replace(/(\d{4})(\d{4})/, '$1 $2'),
        email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.nl', allergies, dislikes: '', goal: pick(['balanced', 'lose', 'gain']),
        addresses: [{ id: 'a1', label: i % 3 === 1 ? 'العمل' : 'البيت', street, zip, city, notes: i % 4 === 0 ? 'الجرس الثاني، الطابق ٢' : '' }],
        wallet: 0, lang: 'ar', createdAt: Date.now() - (30 + i) * 864e5, notifPrefs: { push: true, whatsapp: true, email: false } });
    });
    S.subsPlan.forEach(([pi, plan, days, option, off, weekdays, window]) => {
      const c = s.customers[pi];
      const start = addDays(t, off);
      const dates = buildDates(start, weekdays, days);
      const slots = byId(s.plans.mealOptions, option).slots;
      const picks = {};
      dates.forEach((d, idx) => {
        // demo customer (Sara) leaves some upcoming days open to show the "choose later" flow
        if (pi === 0 && d > addDays(t, 2) && idx % 2 === 0) return;
        if (pi === 0 && d > addDays(t, 9)) return;
        picks[d] = {}; slots.forEach((sl) => { picks[d][sl] = chefPick(plan, sl, c, []); });
      });
      createSubscriptionIn(s, c.id, { planType: plan, days, option, startDate: start, weekdays, window, addressId: 'a1', picks,
        payment: { method: pick(['ideal', 'ideal', 'card', 'applepay', 'paypal', 'klarna']) }, promo: pi % 5 === 0 ? 'WELKOM10' : null },
        { silent: true, paidAt: Date.now() - (Math.max(1, -off) + 2) * 864e5 });
    });
    // statuses for past & today
    const windowStatus = { early: ['delivered', 'delivered', 'on_way'], noon: ['preparing', 'ready', 'accepted', 'preparing'], eve: ['accepted', 'scheduled', 'scheduled'] };
    s.orders.forEach((o, i) => {
      const now = Date.now();
      if (o.date < t) {
        o.status = 'delivered'; o.driverId = driverForCity(o.city); o.printed = true;
        o.history = [{ s: 'scheduled', at: now - 5e8 }, { s: 'delivered', at: now - 4e8 }];
        if (rnd() < 0.45) { o.rating = rnd() < 0.85 ? pick([4, 5, 5, 5]) : pick([2, 3]); const m = byId(s.meals, o.mealId); if (m) { m.rating = ((m.rating || 0) * m.ratingCount + o.rating) / (m.ratingCount + 1); m.ratingCount++; } }
      } else if (o.date === t) {
        const st = pick(windowStatus[o.window] || ['scheduled']);
        o.status = st; o.printed = STATUS[st].step >= 2;
        if (STATUS[st].step >= 1) o.driverId = driverForCity(o.city);
        o.history.push({ s: st, at: now - 36e5 });
      }
    });
    s.meals.forEach((m) => { if (!m.ratingCount) { m.rating = 4.4 + rnd() * 0.5; m.ratingCount = 3 + Math.floor(rnd() * 20); } m.rating = Math.round(m.rating * 10) / 10; });
    // a few starter notifications
    notify('customer:c1', { icon: '👋', title: { ar: 'أهلاً سارة! اشتراكك الصحي فعّال', nl: 'Hoi Sara! Je Gezond-abonnement is actief', en: 'Hi Sara! Your Healthy plan is active' }, body: { ar: 'تقدر تغيّر وجباتك أو تأجل أي يوم قبل الساعة 20:00 من اليوم السابق', nl: 'Wijzig of verzet tot 20:00 de dag ervoor', en: 'Change or postpone until 20:00 the day before' }, at: Date.now() - 864e5 * 3, read: true });
    notify('admin', { icon: '📊', title: 'مرحباً في لوحة Delyvo', body: 'البيانات تجريبية ومتزامنة مع كل التطبيقات', read: false });
    s.restaurants.forEach((rs) => notify('restaurant:' + rs.id, { icon: '🧾', title: 'طلبات اليوم جاهزة في اللوحة', body: 'اطبع الاستكرات قبل بدء التحضير' }));
    s.drivers.forEach((d) => notify('driver:' + d.id, { icon: '🗺️', title: 'مسار اليوم جاهز', body: 'ابدأ بالاستلام من المطاعم' }));
    return s;
  }

  function reset() { state = seed(); housekeeping(); persist(); emit(false); }

  function session(app, value) {
    const k = 'delyvo.session.' + app;
    if (value === undefined) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
    if (value === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(value));
    return value;
  }

  // ---------------- boot ----------------
  state = readStored();
  if (!state) { state = seed(); persist(); }
  housekeeping();

  window.DV = {
    get state() { return state; },
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    commit, reset, session,
    today, addDays, weekday, isLocked, fmtDate, fmtTime, fromISO, toISO,
    L, money, esc, uid, STATUS, SLOTS, ALLERGENS: SEED.ALLERGENS, TAGS: SEED.TAGS,
    meal, restaurant, customer, driver, sub, order, planType, mealOption, driverForCity,
    price, buildDates, mealsFor, isSafe, chefPick,
    createSubscription, setDayMeal, postponeDay, setOrderStatus, assignDriver, autoAssign, rateOrder,
    notify: (to, n) => commit(() => notify(to, n)), notificationsFor, markRead, broadcast,
    registerCustomer, findCustomerByPhone, updateCustomer, ordersFor, housekeeping
  };
})();
