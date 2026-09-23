/* Delyvo Driver — simple rider app (frontend-only demo, data via window.DV). */
(function () {
  'use strict';

  const E = DV.esc;
  const RATE = 2.5; // € per delivered stop
  const LANG_KEY = 'delyvo.driver.lang';
  const PRE = ['scheduled', 'accepted', 'preparing', 'ready'];
  const FINAL = ['delivered', 'failed'];
  const WIN_ORDER = { early: 0, noon: 1, eve: 2 };

  // ---------------------------------------------------------------- i18n
  const T = {
    ar: {
      appName: 'Delyvo Driver', chooseAccount: 'اختر حسابك', enterPin: 'أدخل رمز الدخول', pinHint: 'رموز تجريبية: 1111 · 2222 · 3333',
      wrongPin: 'الرمز غير صحيح', loginSub: 'استلم من المطاعم، وصّل للمشتركين.', back: 'رجوع',
      tabToday: 'الرئيسية', tabRoute: 'المسار', tabEarn: 'الأرباح', tabNotif: 'الإشعارات', tabProfile: 'حسابي',
      morning: 'صباح الخير', afternoon: 'مساء الخير', today: 'اليوم', tomorrow: 'غداً',
      online: 'متصل', offline: 'غير متصل', onlineSub: 'تستقبل الطلبات الآن — اضغط للإيقاف', offlineSub: 'لن تُسند لك طلبات جديدة — اضغط للاتصال',
      goOnlineFirst: 'اتصل أولاً لبدء العمل', stopsDone: 'توصيلات منجزة', stops: 'محطات', meals: 'وجبات', pickupsLeft: 'استلام متبقٍ',
      next: 'المهمة التالية', nextPickup: 'استلام من {n}', nextStop: 'توصيل إلى {n}', allDone: 'خلصت كل توصيلات اليوم — عمل رائع!',
      pickups: 'الاستلام من المطاعم', deliveries: 'التوصيلات', orders: 'طلبات', readyOf: '{r} من {t} جاهز',
      pickedAll: 'استلمت الطلبات', pickReady: 'استلام الجاهز فقط', waitRest: 'بانتظار المطعم', pickedDone: 'تم الاستلام',
      navigate: 'الملاحة', call: 'اتصال', startDelivery: 'ابدأ التوصيل', delivered: 'تم التسليم', failed: 'تعذّر التسليم',
      waitingPickup: 'بانتظار الاستلام', bags: 'أكياس', bag: 'كيس', noOrders: 'لا توجد طلبات مسندة لك', noOrdersSub: 'ستصلك إشعارات فور إسناد طلبات من الإدارة.',
      tomorrowRO: 'معاينة طلبات الغد — للقراءة فقط', tomorrowEmpty: 'لم تُسند طلبات الغد بعد', tomorrowEmptySub: 'الإدارة تُسند المسارات عادةً مساء اليوم السابق.',
      st_waiting: 'بانتظار الاستلام', st_picked: 'جاهز للتوصيل', st_on_way: 'في الطريق', st_delivered: 'تم التسليم', st_failed: 'تعذّر',
      proofTitle: 'تأكيد التسليم', proofPhoto: 'صورة إثبات (اختياري)', takePhoto: 'التقط صورة', retake: 'إعادة', handoff: 'طريقة التسليم',
      toCustomer: 'سلّمت للعميل', atDoor: 'تركتها عند الباب', confirm: 'تأكيد التسليم', cancel: 'إلغاء',
      failTitle: 'تعذّر التسليم', failSub: 'اختر السبب — سيتواصل الدعم مع العميل فوراً.', r_noanswer: 'العميل لا يرد', r_address: 'العنوان خاطئ',
      r_closed: 'المبنى مغلق', r_other: 'أخرى', otherPh: 'اكتب السبب…', sendFail: 'تسجيل التعذّر',
      toastPicked: 'تم الاستلام', toastOnWay: 'بدأ التوصيل', toastOnWaySub: 'تم إشعار العميل أنك في الطريق', toastDelivered: 'تم التسليم', toastFailed: 'تم تسجيل التعذّر',
      items: 'الوجبات', history: 'السجل', address: 'العنوان', notes: 'ملاحظات التوصيل', window: 'فترة التوصيل', orderNo: 'رقم الطلب', proof: 'إثبات التسليم',
      routeTitle: 'مسار اليوم', routeSub: 'المطاعم أولاً ثم العملاء بالترتيب', openRoute: 'فتح المسار كاملاً في Google Maps', pickupAt: 'استلام', dropAt: 'توصيل',
      routeEmpty: 'لا يوجد مسار بعد', earnTitle: 'الأرباح', thisWeek: 'آخر ٧ أيام', estEarn: 'الأرباح التقديرية', perStop: '{m} لكل محطة', delivStops: 'محطات موصّلة',
      delivMeals: 'وجبات موصّلة', rating: 'التقييم', soon: 'قريباً', payout: 'تُحوَّل الأرباح أسبوعياً كل اثنين', todayEarn: 'أرباح اليوم',
      notifTitle: 'الإشعارات', markAll: 'تحديد الكل كمقروء', noNotif: 'لا توجد إشعارات',
      profile: 'حسابي', vehicle: 'المركبة', zone: 'المنطقة', phone: 'الهاتف', plate: 'اللوحة', language: 'اللغة', support: 'تواصل مع الدعم', logout: 'تسجيل الخروج',
      readOnly: 'للقراءة فقط', now: 'الآن', minAgo: 'منذ {n} د', hAgo: 'منذ {n} س', driverApp: 'تطبيق السائق', version: 'نسخة تجريبية 1.0',
      byHand: 'سُلّمت للعميل', byDoor: 'تُركت عند الباب', meal: 'وجبة', restaurant: 'المطعم', photoAdded: 'تمت إضافة الصورة'
    },
    nl: {
      appName: 'Delyvo Driver', chooseAccount: 'Kies je account', enterPin: 'Voer je pincode in', pinHint: 'Demo-codes: 1111 · 2222 · 3333',
      wrongPin: 'Onjuiste pincode', loginSub: 'Ophalen bij restaurants, bezorgen bij abonnees.', back: 'Terug',
      tabToday: 'Vandaag', tabRoute: 'Route', tabEarn: 'Verdiensten', tabNotif: 'Meldingen', tabProfile: 'Profiel',
      morning: 'Goedemorgen', afternoon: 'Goedemiddag', today: 'Vandaag', tomorrow: 'Morgen',
      online: 'Online', offline: 'Offline', onlineSub: 'Je ontvangt ritten — tik om te pauzeren', offlineSub: 'Geen nieuwe ritten — tik om online te gaan',
      goOnlineFirst: 'Ga eerst online om te starten', stopsDone: 'Stops bezorgd', stops: 'Stops', meals: 'Maaltijden', pickupsLeft: 'Op te halen',
      next: 'Volgende taak', nextPickup: 'Ophalen bij {n}', nextStop: 'Bezorgen bij {n}', allDone: 'Alle bezorgingen van vandaag klaar — top!',
      pickups: 'Ophalen bij restaurants', deliveries: 'Bezorgingen', orders: 'bestellingen', readyOf: '{r} van {t} klaar',
      pickedAll: 'Alles opgehaald', pickReady: 'Alleen klare ophalen', waitRest: 'Wacht op restaurant', pickedDone: 'Opgehaald',
      navigate: 'Navigeer', call: 'Bellen', startDelivery: 'Start bezorging', delivered: 'Bezorgd', failed: 'Niet gelukt',
      waitingPickup: 'Nog ophalen', bags: 'tassen', bag: 'tas', noOrders: 'Geen bestellingen toegewezen', noOrdersSub: 'Je krijgt een melding zodra de planning ritten toewijst.',
      tomorrowRO: 'Voorvertoning morgen — alleen lezen', tomorrowEmpty: 'Morgen nog niet ingepland', tomorrowEmptySub: 'Routes worden meestal de avond ervoor toegewezen.',
      st_waiting: 'Nog ophalen', st_picked: 'Klaar om te bezorgen', st_on_way: 'Onderweg', st_delivered: 'Bezorgd', st_failed: 'Mislukt',
      proofTitle: 'Bezorging bevestigen', proofPhoto: 'Fotobewijs (optioneel)', takePhoto: 'Maak foto', retake: 'Opnieuw', handoff: 'Overdracht',
      toCustomer: 'Aan klant gegeven', atDoor: 'Bij de deur gezet', confirm: 'Bevestig bezorging', cancel: 'Annuleren',
      failTitle: 'Bezorging mislukt', failSub: 'Kies een reden — support neemt direct contact op.', r_noanswer: 'Klant reageert niet', r_address: 'Verkeerd adres',
      r_closed: 'Gebouw gesloten', r_other: 'Anders', otherPh: 'Omschrijf de reden…', sendFail: 'Registreer',
      toastPicked: 'Opgehaald', toastOnWay: 'Bezorging gestart', toastOnWaySub: 'Klant is op de hoogte gebracht', toastDelivered: 'Bezorgd', toastFailed: 'Mislukte bezorging geregistreerd',
      items: 'Maaltijden', history: 'Historie', address: 'Adres', notes: 'Bezorgnotities', window: 'Tijdvak', orderNo: 'Bestelnr.', proof: 'Bezorgbewijs',
      routeTitle: 'Route vandaag', routeSub: 'Eerst restaurants, dan klanten op volgorde', openRoute: 'Open volledige route in Google Maps', pickupAt: 'Ophalen', dropAt: 'Bezorgen',
      routeEmpty: 'Nog geen route', earnTitle: 'Verdiensten', thisWeek: 'Laatste 7 dagen', estEarn: 'Geschatte verdiensten', perStop: '{m} per stop', delivStops: 'Stops bezorgd',
      delivMeals: 'Maaltijden bezorgd', rating: 'Beoordeling', soon: 'Binnenkort', payout: 'Uitbetaling wekelijks op maandag', todayEarn: 'Vandaag verdiend',
      notifTitle: 'Meldingen', markAll: 'Alles gelezen', noNotif: 'Geen meldingen',
      profile: 'Profiel', vehicle: 'Voertuig', zone: 'Gebied', phone: 'Telefoon', plate: 'Kenteken', language: 'Taal', support: 'Contact met support', logout: 'Uitloggen',
      readOnly: 'Alleen lezen', now: 'nu', minAgo: '{n} min geleden', hAgo: '{n} u geleden', driverApp: 'Bezorgers-app', version: 'Demoversie 1.0',
      byHand: 'Aan klant gegeven', byDoor: 'Bij de deur gezet', meal: 'maaltijd', restaurant: 'Restaurant', photoAdded: 'Foto toegevoegd'
    }
  };
  function t(k, vars) {
    let s = (T[lang] && T[lang][k]) || T.ar[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  }

  const VEHICLES = {
    'e-bike': { ar: 'دراجة كهربائية', nl: 'E-bike', ic: '🚲' },
    car: { ar: 'سيارة', nl: 'Auto', ic: '🚗' },
    scooter: { ar: 'سكوتر', nl: 'Scooter', ic: '🛵' }
  };
  const AV_COLORS = ['#1FA06B', '#2563EB', '#D97706', '#7C3AED', '#0891B2'];

  // ---------------------------------------------------------------- icons
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    phone: '<path d="M5 3h3.5l1.5 5-2.2 1.3a11 11 0 0 0 6 6L15 13l5 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m15 6-6 6 6 6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    store: '<path d="M4 9h16l-1.5-5h-13z"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    help: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19a3 3 0 0 1-3 2h-2"/>',
    del: '<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 10 4 4m0-4-4 4"/>',
    power: '<path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    note: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>'
  };
  const ic = (n, sz = 22, sw = 1.9) => `<svg class="ic" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------------------------------------------------------------- state
  let lang = (() => { try { return localStorage.getItem(LANG_KEY) || 'ar'; } catch (e) { return 'ar'; } })();
  if (!T[lang]) lang = 'ar';
  const sess = DV.session('driver');
  let did = sess && sess.did && DV.driver(sess.did) ? sess.did : null;
  let tab = 'today';
  let dayMode = 'today';
  let detailKey = null;
  let loginPick = null;
  let pin = '';

  const app = document.getElementById('app');
  const me = () => DV.driver(did);
  const inbox = () => 'driver:' + (did || 'none');
  const dayISO = () => (dayMode === 'today' ? DV.today() : DV.addDays(DV.today(), 1));
  const readOnly = () => dayMode !== 'today';

  // ---------------------------------------------------------------- data helpers
  function myOrders(date) {
    return DV.ordersFor({ date: date || dayISO(), driverId: did }).filter((o) => o.status !== 'cancelled');
  }
  function addrOf(o) {
    const c = DV.customer(o.customerId); if (!c) return {};
    const sb = DV.sub(o.subId);
    return (sb && c.addresses.find((a) => a.id === sb.addressId)) || c.addresses[0] || {};
  }
  const fullAddr = (a) => [a.street, [a.zip, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const mapsUrl = (addr) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addr);
  const telUrl = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  const winLabel = (id) => DV.L((DV.state.settings.deliveryWindows.find((w) => w.id === id) || {}).label, lang);
  const firstName = (n) => String(n || '').split(' ')[0];
  const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const avColor = (id) => AV_COLORS[(parseInt(String(id).replace(/\D/g, ''), 10) || 0) % AV_COLORS.length];
  const statusLabel = (s) => (DV.STATUS[s] ? DV.STATUS[s][lang] || DV.STATUS[s].ar : s);
  const statusPill = (s) => `<span class="status-pill" style="color:${(DV.STATUS[s] || {}).color || '#64748B'};background:${((DV.STATUS[s] || {}).color || '#64748B')}14">${E(statusLabel(s))}</span>`;

  function stopState(orders) {
    const st = orders.map((o) => o.status);
    if (st.every((s) => FINAL.includes(s))) return st.includes('failed') ? 'failed' : 'delivered';
    if (st.includes('on_way')) return 'on_way';
    const open = st.filter((s) => !FINAL.includes(s));
    if (open.length && open.every((s) => s === 'picked')) return 'picked';
    return 'waiting';
  }
  function buildStops(orders) {
    const map = new Map();
    orders.forEach((o) => {
      if (!map.has(o.customerId)) map.set(o.customerId, []);
      map.get(o.customerId).push(o);
    });
    const stops = [...map.entries()].map(([cid, os]) => {
      os.sort((a, b) => (a.slot === 'lunch' ? 0 : 1) - (b.slot === 'lunch' ? 0 : 1));
      const c = DV.customer(cid) || { name: '—', phone: '' };
      const a = addrOf(os[0]);
      const win = os.map((o) => o.window).sort((x, y) => (WIN_ORDER[x] ?? 9) - (WIN_ORDER[y] ?? 9))[0];
      return { key: cid, c, orders: os, addr: a, city: a.city || os[0].city || '', window: win, state: stopState(os) };
    });
    stops.sort((x, y) => ((WIN_ORDER[x.window] ?? 9) - (WIN_ORDER[y.window] ?? 9)) || x.city.localeCompare(y.city) || String(x.c.name).localeCompare(String(y.c.name)));
    stops.forEach((s, i) => { s.seq = i + 1; });
    return stops;
  }
  function buildPickups(orders) {
    const map = new Map();
    orders.forEach((o) => {
      if (!o.restaurantId) return;
      if (!map.has(o.restaurantId)) map.set(o.restaurantId, []);
      map.get(o.restaurantId).push(o);
    });
    return [...map.entries()].map(([rid, os]) => {
      const r = DV.restaurant(rid) || { name: '—', address: '', phone: '' };
      const pending = os.filter((o) => PRE.includes(o.status));
      const ready = pending.filter((o) => o.status === 'ready');
      const state = !pending.length ? 'done' : ready.length === pending.length ? 'ready' : ready.length ? 'partial' : 'waiting';
      return { rid, r, orders: os, pending, ready, state };
    }).sort((a, b) => ({ ready: 0, partial: 1, waiting: 2, done: 3 }[a.state] - { ready: 0, partial: 1, waiting: 2, done: 3 }[b.state]) || a.r.name.localeCompare(b.r.name));
  }
  function unreadCount() { return did ? DV.notificationsFor(inbox()).filter((n) => !n.read).length : 0; }

  // ---------------------------------------------------------------- language
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
  function setLang(l) {
    lang = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    applyLang(); shellBuilt = false; render(); if (detailKey) renderDetail();
  }

  // ---------------------------------------------------------------- login
  function renderLogin() {
    shellBuilt = false;
    DVUI.statusbarColor('#FFFFFF');
    const drivers = DV.state.drivers;
    let body;
    if (!loginPick) {
      body = `<h2 class="lg-h">${t('chooseAccount')}</h2>
        <div class="drv-list">${drivers.map((d) => {
          const v = VEHICLES[d.vehicle] || { ic: '🚚', ar: d.vehicle, nl: d.vehicle };
          return `<button class="drv-card press" data-act="login-driver" data-id="${E(d.id)}">
            <span class="avatar" style="background:${avColor(d.id)}">${E(initials(d.name))}</span>
            <span class="grow"><b>${E(d.name)}</b><small class="muted">${ic('pin', 14)} ${E(d.zone)} · ${v.ic} ${E(v[lang] || v.ar)}</small></span>
            <span class="chev">${ic('chev', 18)}</span></button>`;
        }).join('')}</div>
        <p class="pin-hint">🔑 ${t('pinHint')}</p>`;
    } else {
      const d = DV.driver(loginPick);
      body = `<button class="lg-back press" data-act="login-back">${ic('back', 20)} ${t('back')}</button>
        <div class="pin-who"><span class="avatar lg" style="background:${avColor(d.id)}">${E(initials(d.name))}</span><b>${E(d.name)}</b><small class="muted">${t('enterPin')}</small></div>
        <div class="pin-dots" id="pinDots">${[0, 1, 2, 3].map((i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-act="key" data-k="${n}">${n}</button>`).join('')}
          <span></span><button class="key" data-act="key" data-k="0">0</button><button class="key key-del" data-act="key-del" aria-label="del">${ic('del', 24)}</button></div>
        <p class="pin-hint">🔑 ${t('pinHint')}</p>`;
    }
    app.innerHTML = `<div class="login">
      <div class="lg-top">
        <div class="lg-lang">${langSeg()}</div>
        <div class="lg-brand"><div class="lg-logo">${ic('route', 34, 2)}</div><h1>Delyvo <span>Driver</span></h1><p>${t('loginSub')}</p></div>
      </div>
      <div class="lg-sheet fade-up">${body}</div>
    </div>`;
  }
  function langSeg() {
    return `<div class="seg seg-sm">${['ar', 'nl'].map((l) => `<button class="${lang === l ? 'on' : ''}" data-act="lang" data-l="${l}">${l === 'ar' ? 'العربية' : 'NL'}</button>`).join('')}</div>`;
  }
  function pressKey(k) {
    if (pin.length >= 4) return;
    pin += k; DVUI.vibrate(8);
    const dots = document.getElementById('pinDots');
    if (dots) dots.innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('');
    if (pin.length === 4) {
      const d = DV.driver(loginPick);
      setTimeout(() => {
        if (d && d.pin === pin) {
          did = d.id; DV.session('driver', { did }); pin = ''; loginPick = null; tab = 'today'; dayMode = 'today';
          markSeen(inbox());
          render();
          DVUI.toast(t('morning') + ' ' + firstName(d.name), '', '👋');
        } else {
          pin = ''; DVUI.vibrate([60, 40, 60]);
          if (dots) { dots.classList.add('shake'); dots.innerHTML = [0, 1, 2, 3].map(() => '<i class="err"></i>').join(''); }
          setTimeout(() => { if (dots) { dots.classList.remove('shake'); dots.innerHTML = [0, 1, 2, 3].map(() => '<i></i>').join(''); } }, 520);
          DVUI.toast(t('wrongPin'), '', '⛔', 1800);
        }
      }, 160);
    }
  }

  // ---------------------------------------------------------------- shell
  let shellBuilt = false;
  const TABS = [['today', 'home', 'tabToday'], ['route', 'route', 'tabRoute'], ['earn', 'wallet', 'tabEarn'], ['notif', 'bell', 'tabNotif'], ['profile', 'user', 'tabProfile']];
  function buildShell() {
    app.innerHTML = `<div class="main">
        <header class="topbar"><div class="tb-title"></div></header>
        <div class="scroll" id="scroll"><div class="scroll-in" id="scrollIn"></div></div>
        <nav class="tabbar">${TABS.map(([id, icn, lbl]) => `<button class="tab press" data-act="tab" data-tab="${id}">
          <span class="tab-ic">${ic(icn, 24)}<em class="tab-badge" hidden></em></span><span class="tab-l">${t(lbl)}</span></button>`).join('')}</nav>
      </div>
      <section class="push" id="push" aria-hidden="true"></section>`;
    const sc = document.getElementById('scroll');
    sc.addEventListener('scroll', () => app.querySelector('.topbar').classList.toggle('scrolled', sc.scrollTop > 36), { passive: true });
    shellBuilt = true;
  }
  const TITLES = { today: 'tabToday', route: 'routeTitle', earn: 'earnTitle', notif: 'notifTitle', profile: 'profile' };

  function render() {
    applyLang();
    if (!did || !me()) { did = null; closeDetail(true); renderLogin(); return; }
    if (!shellBuilt || !document.getElementById('scrollIn')) buildShell();
    DVUI.statusbarColor('#0E1512');
    app.querySelector('.tb-title').textContent = t(TITLES[tab]);
    app.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const n = unreadCount(); const badge = app.querySelector('.tab[data-tab="notif"] .tab-badge');
    badge.hidden = !n; badge.textContent = n > 9 ? '9+' : n;
    const html = tab === 'today' ? viewToday() : tab === 'route' ? viewRoute() : tab === 'earn' ? viewEarn() : tab === 'notif' ? viewNotif() : viewProfile();
    document.getElementById('scrollIn').innerHTML = html;
  }
  function switchTab(id) {
    if (id === tab) { const sc = document.getElementById('scroll'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    tab = id; DVUI.vibrate(6);
    render();
    const sc = document.getElementById('scroll'); if (sc) sc.scrollTop = 0;
    app.querySelector('.topbar').classList.remove('scrolled');
    const inEl = document.getElementById('scrollIn'); inEl.classList.remove('tab-in'); void inEl.offsetWidth; inEl.classList.add('tab-in');
  }

  // ---------------------------------------------------------------- TODAY
  function viewToday() {
    const d = me();
    const orders = myOrders();
    const stops = buildStops(orders);
    const pickups = buildPickups(orders);
    const ro = readOnly();
    const h = new Date().getHours();
    const greet = h < 12 ? t('morning') : t('afternoon');
    const done = stops.filter((s) => s.state === 'delivered' || s.state === 'failed').length;
    const pct = stops.length ? done / stops.length : 0;
    const pickLeft = pickups.filter((p) => p.state !== 'done').length;
    const C = 2 * Math.PI * 38;

    let out = `<div class="large-head">
      <div class="row between"><div><small class="muted">${E(DV.fmtDate(dayISO(), lang))}</small><h1 class="lt">${greet}، ${E(firstName(d.name))}</h1></div>
      <button class="avatar-btn press" data-act="tab" data-tab="profile" style="background:${avColor(d.id)}">${E(initials(d.name))}</button></div>
      <div class="seg day-seg">${['today', 'tomorrow'].map((m) => `<button class="${dayMode === m ? 'on' : ''}" data-act="day" data-d="${m}">${t(m)}</button>`).join('')}</div>
    </div>`;

    if (ro) {
      out += `<div class="ro-banner">${ic('clock', 18)} ${t('tomorrowRO')}</div>`;
    } else {
      out += `<button class="online-card press ${d.online ? 'is-on' : ''}" data-act="toggle-online">
        <span class="oc-dot"></span>
        <span class="grow"><b>${d.online ? t('online') : t('offline')}</b><small>${d.online ? t('onlineSub') : t('offlineSub')}</small></span>
        <span class="oc-switch"><i></i></span></button>`;
    }

    if (!orders.length) {
      return out + `<div class="empty card"><div class="e-ic">${ro ? '🗓️' : '🛵'}</div><b>${ro ? t('tomorrowEmpty') : t('noOrders')}</b><p class="small">${ro ? t('tomorrowEmptySub') : t('noOrdersSub')}</p></div>`;
    }

    const meals = orders.length;
    out += `<div class="card progress-card">
      <div class="ring"><svg viewBox="0 0 88 88" width="88" height="88"><circle cx="44" cy="44" r="38" class="ring-bg"/><circle cx="44" cy="44" r="38" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <div class="ring-t"><b class="num">${done}/${stops.length}</b><small>${t('stopsDone')}</small></div></div>
      <div class="kpis">
        <div><b class="num">${stops.length}</b><small>${t('stops')}</small></div>
        <div><b class="num">${meals}</b><small>${t('meals')}</small></div>
        <div><b class="num ${pickLeft ? 'warn' : ''}">${pickLeft}</b><small>${t('pickupsLeft')}</small></div>
      </div></div>`;

    if (!ro) {
      const nextP = pickups.find((p) => p.state !== 'done');
      const nextS = stops.find((s) => s.state === 'on_way') || stops.find((s) => s.state === 'picked') || stops.find((s) => s.state === 'waiting');
      let txt, icon = '📦';
      if (nextP) txt = t('nextPickup', { n: E(nextP.r.name) });
      else if (nextS) { txt = t('nextStop', { n: E(nextS.c.name) }) + ` · <span class="muted">${E(winLabel(nextS.window))}</span>`; icon = '🛵'; }
      else { txt = t('allDone'); icon = '🎉'; }
      out += `<div class="next-card"><span class="nx-ic">${icon}</span><div class="grow"><small>${t('next')}</small><b>${txt}</b></div></div>`;
    }

    // pickups
    if (pickups.length) {
      out += `<div class="sec-h"><h3>${t('pickups')}</h3><span class="chip">${pickups.filter((p) => p.state === 'done').length}/${pickups.length}</span></div>`;
      out += pickups.map((p) => pickupCard(p, ro)).join('');
    }
    // stops
    out += `<div class="sec-h"><h3>${t('deliveries')}</h3><span class="chip">${done}/${stops.length}</span></div>`;
    out += stops.map((s) => stopCard(s, ro)).join('');
    return out + '<div class="end-space"></div>';
  }

  function pickupCard(p, ro) {
    const r = p.r;
    const total = p.orders.length;
    const readyN = p.orders.filter((o) => o.status === 'ready').length;
    const pickedN = total - p.pending.length;
    let foot = '';
    if (p.state === 'done') foot = `<span class="chip chip-brand">${ic('check', 15, 2.4)} ${t('pickedDone')}</span>`;
    else if (!ro) {
      if (p.state === 'ready') foot = `<button class="btn btn-primary btn-sm grow" data-act="pick-all" data-id="${E(p.rid)}">${ic('check', 18, 2.4)} ${t('pickedAll')}</button>`;
      else if (p.state === 'partial') foot = `<span class="chip chip-warn">${ic('clock', 14)} ${t('waitRest')}</span><button class="btn btn-outline btn-sm grow" data-act="pick-ready" data-id="${E(p.rid)}">${t('pickReady')} (${p.ready.length})</button>`;
      else foot = `<span class="chip chip-warn">${ic('clock', 14)} ${t('waitRest')}</span>`;
    } else foot = `<span class="chip">${ic('clock', 14)} ${t('waitRest')}</span>`;
    const pct = total ? Math.round(((pickedN + (p.state === 'done' ? 0 : readyN)) / total) * 100) : 0;
    return `<div class="card pk-card ${p.state === 'done' ? 'is-done' : ''}">
      <div class="row">
        <span class="pk-ic" style="background:${E(r.color || '#1FA06B')}1A;color:${E(r.color || '#1FA06B')}">${ic('store', 22)}</span>
        <div class="grow"><b class="ellipsis">${E(r.name)}</b><small class="muted ellipsis">${E(r.address)}</small></div>
        <a class="icon-btn" href="${E(telUrl(r.phone))}" data-act="noop" aria-label="${t('call')}">${ic('phone', 19)}</a>
        <a class="icon-btn" href="${E(mapsUrl(r.address))}" target="_blank" rel="noopener" data-act="noop" aria-label="${t('navigate')}">${ic('nav', 19)}</a>
      </div>
      <div class="pk-meta"><span><b class="num">${total}</b> ${t('orders')}</span><span>·</span><span>${t('readyOf', { r: `<b class="num">${p.state === 'done' ? total : readyN + pickedN}</b>`, t: `<b class="num">${total}</b>` })}</span></div>
      <div class="bar"><i style="width:${p.state === 'done' ? 100 : pct}%"></i></div>
      <div class="pk-nos">${p.orders.map((o) => `<span class="no-tag ${o.status === 'ready' ? 'rdy' : ''} ${PRE.includes(o.status) ? '' : 'got'}" title="${E(statusLabel(o.status))}">${E(o.no)}</span>`).join('')}</div>
      <div class="row pk-foot">${foot}</div>
    </div>`;
  }

  const STATE_CLS = { waiting: 'st-wait', picked: 'st-picked', on_way: 'st-way', delivered: 'st-done', failed: 'st-fail' };
  function stopCard(s, ro) {
    const a = s.addr;
    const bags = s.orders.length;
    let actions = '';
    if (!ro) {
      if (s.state === 'picked') actions = `<button class="btn btn-primary btn-sm grow" data-act="start" data-id="${E(s.key)}">${ic('nav', 17)} ${t('startDelivery')}</button>`;
      else if (s.state === 'on_way') actions = `<button class="btn btn-primary btn-sm grow" data-act="deliver" data-id="${E(s.key)}">${ic('check', 18, 2.4)} ${t('delivered')}</button><button class="btn btn-danger btn-sm" data-act="fail" data-id="${E(s.key)}">${t('failed')}</button>`;
      else if (s.state === 'waiting') actions = `<button class="btn btn-ghost btn-sm grow" disabled>${ic('clock', 16)} ${t('waitingPickup')}</button>`;
    }
    const quick = s.state === 'delivered' || s.state === 'failed' || ro ? '' : `
        <a class="icon-btn" href="${E(telUrl(s.c.phone))}" data-act="noop" aria-label="${t('call')}">${ic('phone', 19)}</a>
        <a class="icon-btn" href="${E(mapsUrl(fullAddr(a)))}" target="_blank" rel="noopener" data-act="noop" aria-label="${t('navigate')}">${ic('nav', 19)}</a>`;
    return `<div class="card stop-card press-soft ${STATE_CLS[s.state]}" data-act="stop-open" data-id="${E(s.key)}">
      <div class="row top">
        <span class="seq num">${s.state === 'delivered' ? ic('check', 18, 2.6) : s.state === 'failed' ? ic('x', 16, 2.6) : s.seq}</span>
        <div class="grow"><b class="ellipsis">${E(s.c.name)}</b><small class="muted ellipsis">${E(a.street || '')} · ${E(s.city)}</small></div>
        ${quick}
      </div>
      <div class="stop-meta">
        <span class="chip">${ic('clock', 14)} ${E(winLabel(s.window))}</span>
        <span class="chip">${ic('bag', 14)} <span class="num">${bags}</span> ${bags === 1 ? t('bag') : t('bags')}</span>
        <span class="chip st-chip">${t('st_' + s.state)}</span>
      </div>
      ${a.notes ? `<div class="stop-note">${ic('note', 15)} ${E(a.notes)}</div>` : ''}
      ${actions ? `<div class="row stop-act">${actions}</div>` : ''}
    </div>`;
  }

  // ---------------------------------------------------------------- DETAIL (push screen)
  function currentStop() {
    if (!detailKey) return null;
    const stops = buildStops(myOrders());
    return stops.find((s) => s.key === detailKey) || null;
  }
  function openDetail(key) {
    detailKey = key; renderDetail();
    const push = document.getElementById('push');
    requestAnimationFrame(() => { push.classList.add('open'); push.setAttribute('aria-hidden', 'false'); });
  }
  function closeDetail(instant) {
    detailKey = null;
    const push = document.getElementById('push');
    if (!push) return;
    push.classList.remove('open'); push.setAttribute('aria-hidden', 'true');
    if (instant) push.innerHTML = '';
  }
  function renderDetail() {
    const push = document.getElementById('push'); if (!push || !detailKey) return;
    const s = currentStop();
    if (!s) { closeDetail(); return; }
    const ro = readOnly();
    const a = s.addr;
    const keepTop = push.querySelector('.scroll') ? push.querySelector('.scroll').scrollTop : 0;
    const hist = [];
    s.orders.forEach((o) => (o.history || []).forEach((h) => hist.push({ ...h, no: o.no })));
    hist.sort((x, y) => y.at - x.at);
    const proofO = s.orders.find((o) => o.proof && String(o.proof).startsWith('data:image'));
    const handO = s.orders.find((o) => o.handoff);
    let actions = '';
    if (!ro) {
      if (s.state === 'picked') actions = `<button class="btn btn-primary btn-block" data-act="start" data-id="${E(s.key)}">${ic('nav', 18)} ${t('startDelivery')}</button>`;
      else if (s.state === 'on_way') actions = `<button class="btn btn-primary grow" data-act="deliver" data-id="${E(s.key)}">${ic('check', 18, 2.4)} ${t('delivered')}</button><button class="btn btn-danger" data-act="fail" data-id="${E(s.key)}">${t('failed')}</button>`;
      else if (s.state === 'waiting') actions = `<button class="btn btn-ghost btn-block" disabled>${ic('clock', 17)} ${t('waitingPickup')}</button>`;
    }
    push.innerHTML = `
      <header class="topbar solid"><button class="nav-back press" data-act="back">${ic('back', 24, 2.2)}<span>${t('back')}</span></button>
        <div class="tb-title on">#${s.seq} · ${E(firstName(s.c.name))}</div></header>
      <div class="scroll"><div class="scroll-in">
        <div class="dt-hero ${STATE_CLS[s.state]}">
          <span class="avatar lg" style="background:${avColor(s.key)}">${E(initials(s.c.name))}</span>
          <h2>${E(s.c.name)}</h2>
          <span class="chip st-chip">${t('st_' + s.state)}</span>
          <div class="dt-quick">
            <a class="qa press" href="${E(telUrl(s.c.phone))}" data-act="noop">${ic('phone', 22)}<span>${t('call')}</span></a>
            <a class="qa press" href="${E(mapsUrl(fullAddr(a)))}" target="_blank" rel="noopener" data-act="noop">${ic('nav', 22)}<span>${t('navigate')}</span></a>
          </div>
        </div>
        <div class="card list">
          <div class="li">${ic('pin', 20)}<div class="grow"><small class="muted">${t('address')}</small><b>${E(fullAddr(a) || s.city)}</b></div></div>
          <div class="li">${ic('clock', 20)}<div class="grow"><small class="muted">${t('window')}</small><b>${E(winLabel(s.window))}</b></div></div>
          ${a.notes ? `<div class="li warn-li">${ic('note', 20)}<div class="grow"><small class="muted">${t('notes')}</small><b>${E(a.notes)}</b></div></div>` : ''}
          <div class="li">${ic('phone', 20)}<div class="grow"><small class="muted">${t('phone')}</small><b class="num" dir="ltr">${E(s.c.phone)}</b></div></div>
        </div>
        <div class="sec-h"><h3>${t('items')}</h3><span class="chip">${ic('bag', 14)} <span class="num">${s.orders.length}</span></span></div>
        <div class="card list">${s.orders.map((o) => {
          const m = DV.meal(o.mealId); const r = DV.restaurant(o.restaurantId); const sl = DV.SLOTS[o.slot] || {};
          return `<div class="li item">
            ${m && m.img ? `<img class="thumb" src="${E(m.img)}" alt="" loading="lazy">` : '<span class="thumb ph">🍱</span>'}
            <div class="grow"><b class="ellipsis">${E(m ? DV.L(m.name, lang) : '—')}</b>
              <small class="muted">${sl.icon || ''} ${E(DV.L(sl, lang))} · ${E(r ? r.name : '—')}</small>
              <div class="row it-meta"><span class="no-tag big num">${E(o.no)}</span>${statusPill(o.status)}</div></div></div>`;
        }).join('')}</div>
        ${proofO || handO ? `<div class="sec-h"><h3>${t('proof')}</h3></div><div class="card pad proof-card">
          ${proofO ? `<img src="${E(proofO.proof)}" alt="proof">` : ''}<div><b>${handO ? (handO.handoff === 'door' ? t('byDoor') : t('byHand')) : ''}</b></div></div>` : ''}
        <div class="sec-h"><h3>${t('history')}</h3></div>
        <div class="card pad timeline">${hist.map((h) => `<div class="tl-i"><i style="background:${(DV.STATUS[h.s] || {}).color || '#94A3B8'}"></i>
          <div class="grow"><b>${E(statusLabel(h.s))}</b> <span class="muted small num">${E(h.no)}</span>${h.note ? `<small class="muted">${E(h.note)}</small>` : ''}</div>
          <span class="muted tiny num">${E(DV.fmtTime(h.at, lang))}</span></div>`).join('')}</div>
        <div class="end-space"></div>
      </div></div>
      ${actions ? `<div class="dock row">${actions}</div>` : ''}`;
    const sc = push.querySelector('.scroll'); if (sc) sc.scrollTop = keepTop;
  }

  // ---------------------------------------------------------------- ROUTE
  function viewRoute() {
    const orders = myOrders();
    const stops = buildStops(orders);
    const pickups = buildPickups(orders);
    let out = `<div class="large-head"><h1 class="lt">${t('routeTitle')}</h1><p class="muted small">${t('routeSub')} · ${E(DV.fmtDate(dayISO(), lang))}</p>
      <div class="seg day-seg">${['today', 'tomorrow'].map((m) => `<button class="${dayMode === m ? 'on' : ''}" data-act="day" data-d="${m}">${t(m)}</button>`).join('')}</div></div>`;
    if (!orders.length) return out + `<div class="empty card"><div class="e-ic">🗺️</div><b>${t('routeEmpty')}</b></div>`;
    const pts = [];
    pickups.forEach((p) => pts.push({ kind: 'pick', done: p.state === 'done', title: p.r.name, sub: p.r.address, addr: p.r.address, meta: `${p.orders.length} ${t('orders')}`, color: p.r.color }));
    stops.forEach((s) => pts.push({ kind: 'drop', done: s.state === 'delivered' || s.state === 'failed', fail: s.state === 'failed', title: s.c.name, sub: fullAddr(s.addr), addr: fullAddr(s.addr), meta: winLabel(s.window), seq: s.seq, key: s.key }));
    const firstOpen = pts.findIndex((p) => !p.done);
    out += `<button class="btn btn-primary btn-block route-btn" data-act="route-open">${ic('nav', 18)} ${t('openRoute')}</button>
      <div class="card route">${pts.map((p, i) => `
        <div class="rt ${p.done ? 'done' : ''} ${i === firstOpen ? 'cur' : ''} ${p.kind}" ${p.key ? `data-act="stop-open" data-id="${E(p.key)}"` : ''}>
          <div class="rt-rail"><span class="rt-dot">${p.done ? (p.fail ? ic('x', 13, 3) : ic('check', 14, 3)) : p.kind === 'pick' ? ic('store', 14, 2.2) : `<span class="num">${p.seq}</span>`}</span></div>
          <div class="grow rt-body"><small class="rt-k">${p.kind === 'pick' ? t('pickupAt') : t('dropAt')} · ${E(p.meta)}</small><b class="ellipsis">${E(p.title)}</b><small class="muted ellipsis">${E(p.sub)}</small></div>
          <a class="icon-btn sm" href="${E(mapsUrl(p.addr))}" target="_blank" rel="noopener" data-act="noop">${ic('nav', 17)}</a>
        </div>`).join('')}</div><div class="end-space"></div>`;
    return out;
  }
  function routeUrl() {
    const orders = myOrders();
    const stops = buildStops(orders);
    const pickups = buildPickups(orders);
    let pts = pickups.filter((p) => p.state !== 'done').map((p) => p.r.address)
      .concat(stops.filter((s) => s.state !== 'delivered' && s.state !== 'failed').map((s) => fullAddr(s.addr)));
    if (pts.length < 2) pts = pickups.map((p) => p.r.address).concat(stops.map((s) => fullAddr(s.addr)));
    pts = pts.filter(Boolean);
    if (!pts.length) return null;
    const origin = pts[0], dest = pts[pts.length - 1], way = pts.slice(1, -1);
    let u = 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + encodeURIComponent(origin) + '&destination=' + encodeURIComponent(dest);
    if (way.length) u += '&waypoints=' + encodeURIComponent(way.join('|'));
    return u;
  }

  // ---------------------------------------------------------------- EARNINGS
  function viewEarn() {
    const t0 = DV.today();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(DV.addDays(t0, -i));
    const mine = DV.state.orders.filter((o) => o.driverId === did && o.status === 'delivered' && days.includes(o.date));
    const per = days.map((d) => {
      const os = mine.filter((o) => o.date === d);
      return { d, meals: os.length, stops: new Set(os.map((o) => o.customerId)).size };
    });
    const max = Math.max(1, ...per.map((p) => p.stops));
    const totStops = per.reduce((a, p) => a + p.stops, 0);
    const totMeals = per.reduce((a, p) => a + p.meals, 0);
    const todayStops = per[per.length - 1].stops;
    return `<div class="large-head"><h1 class="lt">${t('earnTitle')}</h1><p class="muted small">${t('thisWeek')}</p></div>
      <div class="earn-hero">
        <small>${t('estEarn')}</small>
        <b class="num">${E(DV.money(totStops * RATE, lang))}</b>
        <span>${t('perStop', { m: E(DV.money(RATE, lang)) })} · ${t('todayEarn')}: <b class="num">${E(DV.money(todayStops * RATE, lang))}</b></span>
      </div>
      <div class="card pad">
        <div class="chart">${per.map((p) => `<div class="col ${p.d === t0 ? 'today' : ''}">
          <span class="v num">${p.stops || ''}</span>
          <div class="bar-v"><i style="height:${Math.max(4, (p.stops / max) * 100)}%"></i></div>
          <small>${E(DV.fmtDate(p.d, lang, { weekday: 'short' }))}</small></div>`).join('')}</div>
      </div>
      <div class="grid3">
        <div class="card stat"><b class="num">${totStops}</b><small>${t('delivStops')}</small></div>
        <div class="card stat"><b class="num">${totMeals}</b><small>${t('delivMeals')}</small></div>
        <div class="card stat"><b class="num">4.9 <span class="star">★</span></b><small>${t('rating')} · ${t('soon')}</small></div>
      </div>
      <p class="muted small center-note">${ic('wallet', 16)} ${t('payout')}</p>
      <div class="end-space"></div>`;
  }

  // ---------------------------------------------------------------- NOTIFICATIONS
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return t('now');
    if (m < 60) return t('minAgo', { n: m });
    if (m < 24 * 60) return t('hAgo', { n: Math.round(m / 60) });
    return DV.fmtDate(DV.toISO(new Date(ts)), lang, { day: 'numeric', month: 'short' });
  }
  function viewNotif() {
    const list = DV.notificationsFor(inbox());
    const unread = list.filter((n) => !n.read).length;
    let out = `<div class="large-head row between"><h1 class="lt">${t('notifTitle')}</h1>${unread ? `<button class="btn btn-ghost btn-xs" data-act="notif-all">${t('markAll')}</button>` : ''}</div>`;
    if (!list.length) return out + `<div class="empty card"><div class="e-ic">🔔</div><b>${t('noNotif')}</b></div>`;
    return out + `<div class="card list notif-list">${list.map((n) => `
      <button class="li notif press-soft ${n.read ? '' : 'unread'}" data-act="notif-read" data-id="${E(n.id)}">
        <span class="n-ic">${E(n.icon || '🔔')}</span>
        <div class="grow"><b>${E(DV.L(n.title, lang))}</b>${n.body ? `<small class="muted">${E(DV.L(n.body, lang))}</small>` : ''}</div>
        <span class="n-time tiny muted">${E(ago(n.at))}</span>
      </button>`).join('')}</div><div class="end-space"></div>`;
  }

  // ---------------------------------------------------------------- PROFILE
  function viewProfile() {
    const d = me();
    const v = VEHICLES[d.vehicle] || { ic: '🚚', ar: d.vehicle, nl: d.vehicle };
    return `<div class="prof-hero">
        <span class="avatar xl" style="background:${avColor(d.id)}">${E(initials(d.name))}</span>
        <h2>${E(d.name)}</h2>
        <span class="chip ${d.online ? 'chip-brand' : ''}">● ${d.online ? t('online') : t('offline')}</span>
      </div>
      <div class="card list">
        <div class="li"><span class="li-ic">${v.ic}</span><div class="grow"><small class="muted">${t('vehicle')}</small><b>${E(v[lang] || v.ar)}${d.plate && d.plate !== '—' ? ` · <span class="num" dir="ltr">${E(d.plate)}</span>` : ''}</b></div></div>
        <div class="li">${ic('pin', 20)}<div class="grow"><small class="muted">${t('zone')}</small><b>${E(d.zone)}</b></div></div>
        <div class="li">${ic('phone', 20)}<div class="grow"><small class="muted">${t('phone')}</small><b class="num" dir="ltr">${E(d.phone)}</b></div></div>
      </div>
      <div class="card list">
        <div class="li">${ic('globe', 20)}<div class="grow"><b>${t('language')}</b></div>${langSeg()}</div>
        <a class="li press-soft" href="https://wa.me/${E(String(DV.state.settings.supportWhatsapp || '').replace(/\D/g, ''))}" target="_blank" rel="noopener" data-act="noop">${ic('help', 20)}<div class="grow"><b>${t('support')}</b></div><span class="chev">${ic('chev', 18)}</span></a>
      </div>
      <button class="btn btn-danger btn-block logout" data-act="logout">${ic('logout', 18)} ${t('logout')}</button>
      <p class="muted tiny center-note">Delyvo · ${t('driverApp')} · ${t('version')}</p>
      <div class="end-space"></div>`;
  }

  // ---------------------------------------------------------------- bottom sheets
  function openSheet(html, onMount) {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = `<div class="sheet-bg"></div><div class="sheet" role="dialog"><div class="grab"><i></i></div>${html}</div>`;
    app.appendChild(wrap);
    const sheet = wrap.querySelector('.sheet');
    const close = () => {
      wrap.classList.remove('open'); wrap.classList.add('closing'); sheet.style.transform = '';
      setTimeout(() => wrap.remove(), 320);
    };
    wrap.querySelector('.sheet-bg').addEventListener('click', close);
    // swipe down to dismiss
    const grab = wrap.querySelector('.grab');
    let y0 = null, dy = 0;
    grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; sheet.style.transition = 'none'; grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; sheet.style.transition = ''; if (dy > 90) close(); else sheet.style.transform = ''; };
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    if (onMount) onMount(sheet, close);
    return close;
  }

  function stopByKey(key) { return buildStops(myOrders(DV.today())).find((s) => s.key === key); }

  function deliverSheet(key) {
    const s = stopByKey(key); if (!s) return;
    let photo = null, mode = 'hand';
    openSheet(`<h3 class="sh-t">${t('proofTitle')}</h3><p class="muted small">${E(s.c.name)} · ${s.orders.map((o) => E(o.no)).join(' · ')}</p>
      <div class="sh-label">${t('proofPhoto')}</div>
      <label class="photo-drop press-soft"><input type="file" accept="image/*" capture="environment" hidden>
        <span class="ph-empty">${ic('camera', 30)}<b>${t('takePhoto')}</b></span><img alt="" hidden></label>
      <div class="sh-label">${t('handoff')}</div>
      <div class="opt-grid">
        <button class="opt on" data-mode="hand"><span>🤝</span>${t('toCustomer')}</button>
        <button class="opt" data-mode="door"><span>🚪</span>${t('atDoor')}</button>
      </div>
      <div class="row sh-actions"><button class="btn btn-ghost" data-x="cancel">${t('cancel')}</button><button class="btn btn-primary grow" data-x="ok">${ic('check', 18, 2.4)} ${t('confirm')}</button></div>`,
    (sheet, close) => {
      const inp = sheet.querySelector('input[type=file]'); const img = sheet.querySelector('.photo-drop img'); const emp = sheet.querySelector('.ph-empty');
      inp.addEventListener('change', async () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        try { photo = await toThumb(f); img.src = photo; img.hidden = false; emp.hidden = true; DVUI.toast(t('photoAdded'), '', '📷', 1400); } catch (e) { photo = null; }
      });
      sheet.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
        mode = b.dataset.mode; sheet.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === b)); DVUI.vibrate(6);
      }));
      sheet.querySelector('[data-x=cancel]').addEventListener('click', close);
      sheet.querySelector('[data-x=ok]').addEventListener('click', () => {
        const cur = stopByKey(key); if (!cur) { close(); return; }
        const ids = cur.orders.filter((o) => !FINAL.includes(o.status)).map((o) => o.id);
        if (ids.length) {
          DV.setOrderStatus(ids, 'delivered', { by: 'driver:' + did, proof: photo || undefined });
          DV.commit((st) => { st.orders.forEach((o) => { if (ids.includes(o.id)) o.handoff = mode; }); });
        }
        close(); DVUI.vibrate([30, 40, 30]); DVUI.beep();
        DVUI.toast(t('toastDelivered'), cur.c.name, '🎉');
      });
    });
  }

  function failSheet(key) {
    const s = stopByKey(key); if (!s) return;
    const reasons = ['r_noanswer', 'r_address', 'r_closed', 'r_other'];
    let pick = null;
    openSheet(`<h3 class="sh-t">${t('failTitle')}</h3><p class="muted small">${t('failSub')}</p>
      <div class="reasons">${reasons.map((r) => `<button class="reason press-soft" data-r="${r}"><span class="rd"></span>${t(r)}</button>`).join('')}</div>
      <textarea class="textarea other-txt" rows="2" placeholder="${E(t('otherPh'))}" hidden></textarea>
      <div class="row sh-actions"><button class="btn btn-ghost" data-x="cancel">${t('cancel')}</button><button class="btn btn-dark grow" data-x="ok" disabled>${t('sendFail')}</button></div>`,
    (sheet, close) => {
      const ok = sheet.querySelector('[data-x=ok]'); const txt = sheet.querySelector('.other-txt');
      const valid = () => { ok.disabled = !pick || (pick === 'r_other' && !txt.value.trim()); };
      sheet.querySelectorAll('.reason').forEach((b) => b.addEventListener('click', () => {
        pick = b.dataset.r; sheet.querySelectorAll('.reason').forEach((x) => x.classList.toggle('on', x === b));
        txt.hidden = pick !== 'r_other'; if (!txt.hidden) txt.focus(); valid(); DVUI.vibrate(6);
      }));
      txt.addEventListener('input', valid);
      sheet.querySelector('[data-x=cancel]').addEventListener('click', close);
      ok.addEventListener('click', () => {
        const cur = stopByKey(key); if (!cur) { close(); return; }
        const reason = pick === 'r_other' ? txt.value.trim() : T.ar[pick];
        const ids = cur.orders.filter((o) => !FINAL.includes(o.status)).map((o) => o.id);
        if (ids.length) DV.setOrderStatus(ids, 'failed', { by: 'driver:' + did, reason });
        close(); DVUI.vibrate([80, 50, 80]);
        DVUI.toast(t('toastFailed'), reason, '⚠️');
      });
    });
  }

  function toThumb(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 200 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------- actions
  function requireOnline() {
    if (me() && me().online) return true;
    DVUI.toast(t('goOnlineFirst'), '', '⏸️', 2200); DVUI.vibrate([40, 30, 40]);
    const oc = app.querySelector('.online-card'); if (oc) { oc.classList.remove('nudge'); void oc.offsetWidth; oc.classList.add('nudge'); }
    return false;
  }
  function doPick(rid, onlyReady) {
    if (!requireOnline()) return;
    const p = buildPickups(myOrders(DV.today())).find((x) => x.rid === rid); if (!p) return;
    const ids = (onlyReady ? p.ready : p.pending.filter((o) => ['ready', 'accepted', 'preparing'].includes(o.status))).map((o) => o.id);
    if (!ids.length) return;
    DV.setOrderStatus(ids, 'picked', { by: 'driver:' + did });
    DVUI.vibrate(30); DVUI.toast(t('toastPicked'), `${p.r.name} · ${ids.length} ${t('orders')}`, '📦');
  }
  function doStart(key) {
    if (!requireOnline()) return;
    const s = stopByKey(key); if (!s) return;
    const ids = s.orders.filter((o) => o.status === 'picked').map((o) => o.id);
    if (!ids.length) return;
    DV.setOrderStatus(ids, 'on_way', { by: 'driver:' + did });
    DVUI.vibrate(30); DVUI.toast(t('toastOnWay'), t('toastOnWaySub'), '🛵');
  }

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !app.contains(el)) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case 'noop': return;
      case 'login-driver': loginPick = id; pin = ''; renderLogin(); break;
      case 'login-back': loginPick = null; pin = ''; renderLogin(); break;
      case 'key': pressKey(el.dataset.k); break;
      case 'key-del': pin = pin.slice(0, -1); { const dots = document.getElementById('pinDots'); if (dots) dots.innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join(''); } break;
      case 'lang': setLang(el.dataset.l); break;
      case 'tab': switchTab(el.dataset.tab); break;
      case 'day': if (dayMode !== el.dataset.d) { dayMode = el.dataset.d; DVUI.vibrate(6); render(); } break;
      case 'toggle-online':
        DV.commit((s) => { const d = s.drivers.find((x) => x.id === did); if (d) d.online = !d.online; });
        DVUI.vibrate(me().online ? [20, 30, 20] : 20);
        DVUI.toast(me().online ? t('online') : t('offline'), me().online ? t('onlineSub') : t('offlineSub'), me().online ? '🟢' : '⏸️', 1800);
        break;
      case 'pick-all': doPick(id, false); break;
      case 'pick-ready': doPick(id, true); break;
      case 'stop-open': openDetail(id); break;
      case 'back': closeDetail(); break;
      case 'start': doStart(id); break;
      case 'deliver': if (requireOnline()) deliverSheet(id); break;
      case 'fail': if (requireOnline()) failSheet(id); break;
      case 'route-open': { const u = routeUrl(); if (u) window.open(u, '_blank', 'noopener'); break; }
      case 'notif-read': DV.markRead(inbox(), id); break;
      case 'notif-all': DV.markRead(inbox()); break;
      case 'logout':
        DV.session('driver', null); did = null; tab = 'today'; dayMode = 'today'; closeDetail(true);
        app.querySelectorAll('.sheet-wrap').forEach((w) => w.remove());
        render(); break;
    }
  });

  // iOS-like swipe back on detail screen (drag from the leading edge)
  (function swipeBack() {
    let x0 = null, y0 = 0, dx = 0, push = null;
    app.addEventListener('touchstart', (e) => {
      push = document.getElementById('push'); if (!push || !push.classList.contains('open')) return;
      const rect = app.getBoundingClientRect(); const x = e.touches[0].clientX - rect.left;
      const edge = document.documentElement.dir === 'rtl' ? rect.width - x : x;
      if (edge > 28) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; push.style.transition = 'none';
    }, { passive: true });
    app.addEventListener('touchmove', (e) => {
      if (x0 == null) return;
      const rtl = document.documentElement.dir === 'rtl';
      dx = (e.touches[0].clientX - x0) * (rtl ? -1 : 1);
      if (Math.abs(e.touches[0].clientY - y0) > 60 && dx < 20) { x0 = null; push.style.transition = ''; push.style.transform = ''; return; }
      push.style.transform = `translateX(${Math.max(0, dx) * (rtl ? -1 : 1)}px)`;
    }, { passive: true });
    app.addEventListener('touchend', () => {
      if (x0 == null) return; x0 = null; push.style.transition = ''; push.style.transform = '';
      if (dx > 90) closeDetail();
    });
  })();

  // ---------------------------------------------------------------- live sync + inbox
  const markSeen = DVUI.watchInbox(inbox, (n) => {
    if (!did || n.to !== inbox()) return;
    DVUI.island(DV.L(n.title, lang), DV.L(n.body, lang), n.icon || '🔔');
    DVUI.beep('order'); DVUI.vibrate([60, 40, 60]);
  });
  DV.on(() => { render(); if (detailKey) renderDetail(); });
  setInterval(() => { if (did && tab === 'notif') render(); }, 60000);

  applyLang();
  render();
})();
