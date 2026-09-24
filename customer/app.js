/* Delyvo — customer app (mobile). Vanilla JS, state in window.DV (shared/store.js). */
(function () {
  const $app = document.getElementById('app');
  let lang = localStorage.getItem('delyvo.customer.lang') || 'ar';
  const T = (k, vars) => { let s = I18N[lang][k] ?? I18N.ar[k] ?? k; if (vars) Object.entries(vars).forEach(([a, b]) => { s = String(s).replace('{' + a + '}', b); }); return s; };
  const Lx = (v) => DV.L(v, lang);
  const E = DV.esc;
  const money = (n) => DV.money(n, lang);
  const fd = (iso, o) => DV.fmtDate(iso, lang, o);
  const fdShort = (iso) => fd(iso, { day: 'numeric', month: 'short' });
  const today = () => DV.today();

  let ses = DV.session('customer');
  const me = () => (ses && DV.customer(ses.cid)) || null;

  const ui = {
    view: 'tabs', tab: 'home', page: null, onb: 0,
    login: { step: 'phone', phone: '', code: '', name: '', email: '', err: '' },
    wiz: null, sheet: null, sheetAnim: false, anim: null, resetScroll: false,
    planSub: null, planDay: null, bannerIdx: 0, menuFilter: 'all', pickFilter: 'all', faqOpen: null, lastSub: null
  };
  if (!me()) { ses = null; ui.view = localStorage.getItem('delyvo.customer.onb') ? 'login' : 'onboarding'; }

  // ---------------- icons ----------------
  const I = {
    home: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    bowl: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M17 7c0-1.5 1-2 1-3.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    swap: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v4l3 2"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 4v7h7"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>'
  };
  const back = () => (I18N[lang].dir === 'rtl' ? I.back.replace('m15 18-6-6 6-6', 'm9 18 6-6-6-6') : I.back);
  const chev = () => (I18N[lang].dir === 'rtl' ? I.chev.replace('m9 18 6-6-6-6', 'm15 18-6-6 6-6') : I.chev);

  // ---------------- helpers ----------------
  const activeSubs = () => (me() ? DV.state.subscriptions.filter((s) => s.customerId === me().id && s.status === 'active').sort((a, b) => a.startDate.localeCompare(b.startDate)) : []);
  /** Progress numbers for a subscription; endingSoon drives whether renewal is offered. */
  function subStats(sb) {
    const t = today(); const act = sb.days.filter((d) => d.status === 'active');
    const left = act.filter((d) => d.date >= t).length;
    return { left, done: sb.daysCount - left, total: sb.daysCount, last: (act[act.length - 1] || {}).date || sb.startDate,
      needPick: act.filter((d) => d.date >= t && Object.values(d.meals).some((v) => !v)).length, endingSoon: left <= 3 };
  }
  const allSubs = () => (me() ? DV.state.subscriptions.filter((s) => s.customerId === me().id).sort((a, b) => b.createdAt - a.createdAt) : []);
  const inbox = () => (me() ? DV.notificationsFor('customer:' + me().id) : []);
  const unread = () => inbox().filter((n) => !n.read).length;
  const orderFor = (subId, date, slot) => DV.state.orders.find((o) => o.subId === subId && o.date === date && o.slot === slot && o.status !== 'cancelled');
  const firstName = (n) => String(n || '').split(' ')[0];
  const initials = (n) => String(n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const allergenNames = (list) => list.map((a) => (DV.ALLERGENS[a] ? DV.ALLERGENS[a].icon + ' ' + Lx(DV.ALLERGENS[a]) : a));
  const macro = (m) => `<span class="mac"><b class="num">${m.kcal}</b> ${T('kcal')}</span><span class="mac">P <b class="num">${m.protein}g</b></span><span class="mac">C <b class="num">${m.carbs}g</b></span><span class="mac">F <b class="num">${m.fat}g</b></span>`;
  const stars = (r) => `<span class="stars">${I.star}<b class="num">${(+r || 0).toFixed(1)}</b></span>`;
  const trackStep = (st) => ({ scheduled: 0, accepted: 0, preparing: 1, ready: 1, picked: 2, on_way: 2, delivered: 3, failed: 3 }[st] ?? 0);
  function go(view, extra = {}) { Object.assign(ui, { view, anim: 'push', resetScroll: true }, extra); render(); }
  function setTab(tab) { ui.tab = tab; ui.view = 'tabs'; ui.page = null; ui.resetScroll = true; render(); if (tab === 'inbox' && me()) setTimeout(() => { if (ui.tab === 'inbox' && unread()) DV.markRead('customer:' + me().id); }, 1600); }
  function openSheet(s) { ui.sheet = s; ui.sheetAnim = true; render(); }
  function closeSheet() { const sh = $app.querySelector('.sheet'); if (!sh) { ui.sheet = null; return render(); } sh.classList.add('out'); $app.querySelector('.sheet-back')?.classList.add('out'); setTimeout(() => { ui.sheet = null; render(); }, 220); }
  function greet() { const h = new Date().getHours(); return h < 12 ? T('goodMorning') : h >= 17 ? T('goodEvening') : T('hello'); }

  // ================= views =================
  function vOnboarding() {
    const slides = [
      { img: '../assets/img/meals/so-salmon-bowl.jpg', t: T('onb1t'), s: T('onb1s') },
      { img: '../assets/img/meals/kip-mandi.jpg', t: T('onb2t'), s: T('onb2s') },
      { img: '../assets/img/meals/vegan-lasagna.jpg', t: T('onb3t'), s: T('onb3s') }
    ];
    const s = slides[ui.onb];
    return `<div class="screen onb">
      <div class="onb-img" style="background-image:url('${s.img}')"><div class="onb-fade"></div>
        <div class="onb-top"><img src="../assets/img/logo.png" alt="Delyvo" class="onb-logo"><button class="chip" data-a="langSheet">${I.globe} ${{ ar: 'العربية', nl: 'Nederlands', en: 'English' }[lang]}</button></div></div>
      <div class="onb-body fade-up" key="${ui.onb}">
        <div class="dots">${slides.map((_, i) => `<i class="${i === ui.onb ? 'on' : ''}"></i>`).join('')}</div>
        <h1>${E(s.t)}</h1><p class="muted">${E(s.s)}</p>
        <div class="onb-actions">
          ${ui.onb < 2 ? `<button class="btn btn-ghost" data-a="onbSkip">${T('skip')}</button><button class="btn btn-primary grow" data-a="onbNext">${T('next')}</button>`
            : `<button class="btn btn-primary btn-block" data-a="onbSkip">${T('start')}</button>`}
        </div>
      </div></div>`;
  }

  function vLogin() {
    const L = ui.login;
    let body = '';
    if (L.step === 'phone') {
      body = `<h1>${T('loginTitle')}</h1><p class="muted">${T('loginSub')}</p>
        <label class="field phone-field"><span>${T('phone')}</span><div class="phone-in"><b class="num">🇳🇱 +31</b><input class="input num" inputmode="tel" data-m="login.phone" value="${E(L.phone)}" placeholder="6 1234 5678" autocomplete="tel"></div></label>
        ${L.err ? `<p class="err">${E(L.err)}</p>` : ''}
        <button class="btn btn-primary btn-block" data-a="sendCode">${T('sendCode')}</button>
        <div class="or"><span>أو · of · or</span></div>
        <button class="demo-login" data-a="demoLogin"><span class="av">SA</span><span class="grow"><b>${T('demoLogin')}</b><small>${T('demoNote')}</small></span>${chev()}</button>`;
    } else if (L.step === 'otp') {
      body = `<h1>${T('otpTitle')}</h1><p class="muted">${T('otpSub')} <b class="num" dir="ltr">+31 ${E(L.phone)}</b></p>
        <div class="otp" dir="ltr">${[0, 1, 2, 3].map((i) => `<span class="${L.code.length === i ? 'cur' : ''}">${E(L.code[i] || '')}</span>`).join('')}</div>
        <p class="chip chip-brand" style="margin:0 auto;display:flex;width:max-content">${T('otpHint')}</p>
        ${L.err ? `<p class="err">${E(L.err)}</p>` : ''}
        <div class="keypad" dir="ltr">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => k === '' ? '<i></i>' : `<button data-a="key" data-k="${k}">${k}</button>`).join('')}</div>`;
    } else {
      body = `<h1>${T('profileTitle')}</h1>
        <label class="field"><span>${T('fullName')}</span><input class="input" data-m="login.name" value="${E(L.name)}" autocomplete="name"></label>
        <label class="field"><span>${T('email')}</span><input class="input" type="email" data-m="login.email" value="${E(L.email)}" autocomplete="email"></label>
        ${L.err ? `<p class="err">${E(L.err)}</p>` : ''}
        <button class="btn btn-primary btn-block" data-a="finishProfile">${T('continue')}</button>`;
    }
    return `<div class="screen ${ui.anim === 'push' ? 'push' : ''}">
      <header class="nav">${L.step !== 'phone' ? `<button class="icon-btn" data-a="loginBack">${back()}</button>` : '<img src="../assets/img/logo.png" class="nav-logo" alt="Delyvo">'}<span class="grow"></span><button class="chip" data-a="langSheet">${I.globe} ${{ ar: 'العربية', nl: 'Nederlands', en: 'English' }[lang]}</button></header>
      <div class="scroll pad-x login stack" data-scroll="login">${body}</div></div>`;
  }

  // ---------- tabs ----------
  function vTabs() {
    const content = { home: vHome, plan: vPlan, inbox: vInbox, account: vAccount }[ui.tab]();
    const u = unread();
    const tab = (id, icon, label, badge) => `<button class="tb ${ui.tab === id ? 'on' : ''}" data-a="tab" data-t="${id}">${icon}${badge ? `<i class="badge-dot num">${badge}</i>` : ''}<span>${label}</span></button>`;
    return `<div class="screen">${content}
      <nav class="tabbar">${tab('home', I.home, T('tabHome'))}${tab('plan', I.bowl, T('tabPlan'))}${tab('inbox', I.bell, T('tabInbox'), u)}${tab('account', I.user, T('tabAccount'))}</nav></div>`;
  }

  function vHome() {
    const c = me(); const S = DV.state;
    const banners = S.banners.filter((b) => b.active);
    const subs = activeSubs();
    const t = today();
    let todayCard = '';
    if (subs.length) {
      const sb = subs[0];
      const day = sb.days.find((d) => d.date === t && d.status === 'active');
      const next = sb.days.find((d) => d.date > t && d.status === 'active');
      if (day) {
        const os = Object.keys(day.meals).map((sl) => orderFor(sb.id, t, sl)).filter(Boolean);
        const step = Math.min(...os.map((o) => trackStep(o.status)));
        todayCard = `<section class="today card" data-a="openDay" data-s="${sb.id}" data-d="${t}">
          <div class="row between"><h3>${T('todayMeals')}</h3><span class="chip chip-brand">${I.clock} ${E(Lx((S.settings.deliveryWindows.find((w) => w.id === sb.window) || {}).label))}</span></div>
          <div class="today-meals">${os.map((o) => { const m = DV.meal(o.mealId); return m ? `<div class="tm"><img src="${m.img}" alt=""><div class="grow"><small class="muted">${DV.SLOTS[o.slot].icon} ${Lx(DV.SLOTS[o.slot])}</small><b class="ellipsis">${E(Lx(m.name))}</b><small class="num muted">${m.kcal} ${T('kcal')}</small></div></div>` : ''; }).join('')}</div>
          ${tracker(step, os)}
        </section>`;
      } else if (next) {
        const ms = Object.values(next.meals).map((id) => DV.meal(id)).filter(Boolean);
        todayCard = `<section class="today card" data-a="openDay" data-s="${sb.id}" data-d="${next.date}">
          <div class="row between"><h3>${T('nextDelivery')}</h3><span class="chip">${I.cal} ${E(fd(next.date))}</span></div>
          <div class="today-meals">${ms.length ? ms.map((m) => `<div class="tm"><img src="${m.img}" alt=""><div class="grow"><b class="ellipsis">${E(Lx(m.name))}</b><small class="num muted">${m.kcal} ${T('kcal')}</small></div></div>`).join('') : `<p class="muted small">${T('skipped')} — <b class="brand">${T('chooseMeal')}</b></p>`}</div>
        </section>`;
      }
    }
    const weekMeals = S.meals.filter((m) => m.active && (DV.restaurant(m.restaurantId) || {}).active !== false).sort((a, b) => b.rating - a.rating).slice(0, 10);
    return `<div class="scroll with-tabbar" data-scroll="home">
      <header class="home-head">
        <div class="grow"><small class="muted">${greet()}${c ? '، ' : ''}</small><h2>${c ? E(firstName(c.name)) + ' 👋' : '<span class="logo-word">Delyvo</span>'}</h2></div>
        <button class="icon-btn" data-a="tab" data-t="inbox">${I.bell}${unread() ? `<i class="badge-dot num">${unread()}</i>` : ''}</button>
      </header>
      ${banners.length ? `<section class="banners"><div class="banner-track" data-banners>${banners.map((b) => `
        <article class="banner" style="--bc:${E(b.color)}" data-a="bannerTap"><div class="b-txt"><b>${E(Lx(b.title))}</b><small>${E(Lx(b.sub))}</small><span class="b-cta">${subs.length ? T('seeMenu') : T('subscribeNow')} ${chev()}</span></div><img src="${E(b.img)}" alt=""></article>`).join('')}</div>
        <div class="dots">${banners.map((_, i) => `<i class="${i === ui.bannerIdx % banners.length ? 'on' : ''}"></i>`).join('')}</div></section>` : ''}
      ${todayCard}
      ${subs.length ? manageCard(subs[0]) : `<section class="sec"><div class="sec-h"><div><h3>${T('choosePlan')}</h3><small class="muted">${T('choosePlanSub')}</small></div></div>
        <div class="plan-cards">${S.plans.types.map((p) => `
          <button class="plan-card" data-a="startWiz" data-type="${p.id}" style="--pc:${p.color}">
            <span class="pc-ic">${p.icon}</span><b>${E(Lx(p.name))}</b><small>${E(Lx(p.desc))}</small>
            <span class="pc-price"><small>${T('from')}</small> <b class="num">${money(DV.price({ planType: p.id, days: 5, option: 'lunch', city: '' }).total)}</b><small> / ${T('daysN', { n: 5 })}</small></span>
            <span class="pc-kcal num">${p.kcal} ${T('kcal')}</span>
          </button>`).join('')}</div></section>`}
      <section class="sec"><div class="sec-h"><h3>${T('thisWeek')}</h3><button class="link" data-a="page" data-p="menu">${T('seeAll')}</button></div>
        <div class="h-scroll">${weekMeals.map((m) => mealMini(m)).join('')}</div></section>
      ${subs.length ? '' : `<section class="sec"><h3 style="margin-bottom:12px">${T('howItWorks')}</h3>
        <div class="how">${[['🥗', T('how1')], ['📅', T('how2')], ['🛵', T('how3')]].map(([ic, t], i) => `<div class="how-i"><span class="how-n num">${i + 1}</span><span class="how-ic">${ic}</span><b>${t}</b></div>`).join('')}</div></section>`}
      <section class="trust">${[['🌿', T('trustFresh')], ['✅', T('trustHalal')], ['📅', T('trustFlex')]].map(([i, t]) => `<div><span>${i}</span><small>${t}</small></div>`).join('')}</section>
      <div style="height:18px"></div></div>`;
  }

  function manageCard(sb) {
    const p = DV.planType(sb.planType); const st = subStats(sb); const pct = Math.round((st.done / st.total) * 100);
    const act = (ic, label, a, extra = '') => `<button class="mg-a" data-a="${a}" ${extra}><span>${ic}</span><small>${label}</small></button>`;
    return `<section class="sec"><div class="sec-h"><h3>${T('mySub')}</h3><button class="link" data-a="tab" data-t="plan">${T('manage')}</button></div>
      <div class="manage card" style="--pc:${p.color}">
        <div class="row"><span class="pc-ic">${p.icon}</span><div class="grow"><b>${E(Lx(p.name))} · ${T('daysN', { n: st.total })}</b><small class="muted">${E(Lx(DV.mealOption(sb.option).name))} · ${E(sb.code)}</small></div>
          <div class="ring sm" style="--p:${pct}"><div><b class="num">${st.done}</b><small class="num">/${st.total}</small></div></div></div>
        <div class="mg-bar"><i style="width:${pct}%"></i></div>
        <div class="row between small"><span class="muted">${T('remaining')}: <b class="num">${st.left}</b> ${T('days')}</span><span class="muted">${T('endsOn')}: <b>${fdShort(st.last)}</b></span></div>
        ${st.needPick ? `<button class="mg-warn" data-a="tab" data-t="plan">⏳ ${T('needPickN', { n: st.needPick })}<b>${T('chooseMeal')} ${chev()}</b></button>` : ''}
        <div class="mg-actions">
          ${act('🍽️', T('changeMeal'), 'tab', 'data-t="plan"')}${act('📅', T('postponeDay'), 'tab', 'data-t="plan"')}${act('🧾', T('invoice'), 'invoiceSheet', `data-id="${sb.id}"`)}
          <a class="mg-a" href="https://wa.me/${DV.state.settings.supportWhatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener"><span>💬</span><small>${T('supportShort')}</small></a>
        </div>
        ${st.endingSoon ? `<button class="mg-renew" data-a="startWiz" data-renew="${sb.id}">🔁 <span class="grow">${T('renewSoon')}</span><b>${T('renew')}</b></button>` : ''}
      </div></section>`;
  }

  function tracker(step, orders) {
    const on = orders.find((o) => o.status === 'on_way' || o.status === 'picked');
    const drv = on && on.driverId ? DV.driver(on.driverId) : null;
    const failed = orders.some((o) => o.status === 'failed');
    const steps = [T('tConfirmed'), T('tPreparing'), T('tOnWay'), T('tDelivered')];
    return `<div class="tracker ${failed ? 'failed' : ''}"><div class="tr-bar"><i style="width:${(step / 3) * 100}%"></i></div>
      <div class="tr-steps">${steps.map((s, i) => `<span class="${i <= step ? 'on' : ''} ${i === step ? 'cur' : ''}"><i></i>${s}</span>`).join('')}</div>
      ${drv ? `<div class="driver-row"><span class="av">${initials(drv.name)}</span><div class="grow"><b>${E(drv.name)}</b><small class="muted">${T('tOnWay')} · ${drv.vehicle === 'car' ? '🚗' : drv.vehicle === 'scooter' ? '🛵' : '🚲'}</small></div><a class="icon-btn" href="tel:${E(drv.phone)}" data-stop>${I.phone}</a></div>` : ''}
      ${failed ? `<p class="err small">⚠️ ${I18N[lang].statusLabel.failed}</p>` : ''}</div>`;
  }

  function mealMini(m, ctx = '') {
    return `<button class="meal-mini" data-a="mealSheet" data-id="${m.id}" ${ctx}>
      <div class="mm-img"><img src="${m.img}" alt="" loading="lazy">${m.tags.includes('new') ? `<span class="tag-new">${Lx(DV.TAGS.new)}</span>` : ''}</div>
      <b class="ellipsis">${E(Lx(m.name))}</b><div class="row between small"><span class="muted num">${m.kcal} ${T('kcal')}</span>${stars(m.rating)}</div></button>`;
  }

  // ---------- my plan ----------
  function vPlan() {
    const subs = activeSubs();
    if (!subs.length) {
      const past = allSubs();
      return `<div class="scroll with-tabbar" data-scroll="plan"><header class="big-title"><h1>${T('tabPlan')}</h1></header>
        <div class="empty"><div class="e-ic">🍱</div><h3>${T('noSub')}</h3><p class="muted">${T('noSubSub')}</p><br><button class="btn btn-primary" data-a="startWiz">${T('subscribeNow')}</button></div>
        ${past.length ? `<section class="sec"><h3>${T('mySubs')}</h3>${past.map(subRow).join('')}</section>` : ''}</div>`;
    }
    let sb = subs.find((s) => s.id === ui.planSub) || subs[0];
    ui.planSub = sb.id;
    const t = today();
    const act = sb.days.filter((d) => d.status === 'active');
    const deliveredDays = act.filter((d) => d.date < t || (d.date === t && Object.keys(d.meals).every((sl) => (orderFor(sb.id, t, sl) || {}).status === 'delivered'))).length;
    const total = sb.daysCount;
    if (!ui.planDay || !sb.days.find((d) => d.date === ui.planDay)) ui.planDay = (act.find((d) => d.date >= t) || act[act.length - 1] || sb.days[0]).date;
    const p = DV.planType(sb.planType);
    const pct = Math.round((deliveredDays / total) * 100);
    const needPick = act.filter((d) => d.date >= t && Object.values(d.meals).some((v) => !v)).length;
    return `<div class="scroll with-tabbar" data-scroll="plan">
      <header class="big-title row between"><h1>${T('tabPlan')}</h1>${subStats(sb).endingSoon ? `<button class="btn btn-sm btn-ghost" data-a="startWiz" data-renew="${sb.id}">🔁 ${T('renew')}</button>` : ''}</header>
      ${subs.length > 1 ? `<div class="seg-scroll">${subs.map((s) => `<button class="chip ${s.id === sb.id ? 'chip-brand' : ''}" data-a="pickSub" data-id="${s.id}">${DV.planType(s.planType).icon} ${E(Lx(DV.planType(s.planType).name))} · ${fdShort(s.startDate)}</button>`).join('')}</div>` : ''}
      <section class="sub-hero" style="--pc:${p.color}">
        <div class="ring" style="--p:${pct}"><div><b class="num">${deliveredDays}</b><small class="num">/${total}</small></div></div>
        <div class="grow"><small class="op">${E(sb.code)}</small><h3>${p.icon} ${E(Lx(p.name))} · ${T('daysN', { n: total })}</h3>
          <small class="op">${E(Lx(DV.mealOption(sb.option).name))} · ${E(Lx((DV.state.settings.deliveryWindows.find((w) => w.id === sb.window) || {}).label))}</small>
          <div class="row wrap" style="gap:6px;margin-top:8px"><span class="pill-w">${T('postpones')}: <b class="num">${sb.postponed}/${DV.state.settings.maxPostpones}</b></span>${needPick ? `<span class="pill-w warn">⏳ ${T('toChoose')}: <b class="num">${needPick}</b></span>` : ''}</div></div>
      </section>
      <div class="day-strip" data-scroll="strip">${sb.days.map((d) => dayChip(sb, d)).join('')}</div>
      ${dayDetail(sb, sb.days.find((d) => d.date === ui.planDay))}
      ${subStats(sb).endingSoon ? `<section class="sec"><button class="renew-card" data-a="startWiz" data-renew="${sb.id}"><span>🔁</span><div class="grow"><b>${T('renew')}</b><small class="muted">${T('endsOn')}: ${fd(act.length ? act[act.length - 1].date : sb.startDate)}</small></div>${chev()}</button></section>` : ''}
      <div style="height:12px"></div></div>`;
  }

  function dayChip(sb, d) {
    const t = today();
    const os = Object.keys(d.meals).map((sl) => orderFor(sb.id, d.date, sl)).filter(Boolean);
    let cls = '';
    if (d.status === 'postponed') cls = 'off';
    else if (d.date < t || os.length && os.every((o) => o.status === 'delivered')) cls = 'done';
    else if (Object.values(d.meals).some((v) => !v)) cls = 'need';
    const wd = DV.weekday(d.date);
    return `<button class="dchip ${cls} ${d.date === ui.planDay ? 'sel' : ''} ${d.date === t ? 'is-today' : ''}" data-a="pickDay" data-d="${d.date}">
      <small>${I18N[lang].wd[wd]}</small><b class="num">${+d.date.slice(8)}</b><i></i></button>`;
  }

  function dayDetail(sb, d) {
    if (!d) return '';
    const t = today();
    const locked = DV.isLocked(d.date);
    const h = DV.cutoffLabel(lang);
    if (d.status === 'postponed') {
      const moved = sb.days.find((x) => x.movedFrom === d.date);
      return `<section class="day-detail card pad"><div class="row"><span class="big-ic">📅</span><div class="grow"><b>${fd(d.date)}</b><p class="muted small">${T('dayOff')}${moved ? ' → ' + fd(moved.date) : ''}</p></div></div></section>`;
    }
    const slots = Object.keys(d.meals);
    const os = slots.map((sl) => orderFor(sb.id, d.date, sl)).filter(Boolean);
    const isToday = d.date === t;
    const step = os.length ? Math.min(...os.map((o) => trackStep(o.status))) : 0;
    return `<section class="day-detail">
      <div class="row between dd-h"><div><h3>${fd(d.date)}</h3>${d.movedFrom ? `<small class="muted">↪︎ ${fd(d.movedFrom, { day: 'numeric', month: 'short' })}</small>` : ''}</div>
        ${locked ? `<span class="chip">${I.lock} ${T('locked')}</span>` : `<span class="chip chip-brand">${I.clock} ${T('lockedSub', { h })}</span>`}</div>
      ${isToday && os.length ? `<div class="card pad" style="margin-bottom:12px">${tracker(step, os)}</div>` : ''}
      ${slots.map((sl) => slotCard(sb, d, sl, locked)).join('')}
      ${!locked ? `<button class="btn btn-outline btn-block" data-a="postponeAsk" data-s="${sb.id}" data-d="${d.date}">${I.pause} ${T('postponeDay')}</button>` : ''}
    </section>`;
  }

  function slotCard(sb, d, sl, locked) {
    const m = d.meals[sl] ? DV.meal(d.meals[sl]) : null;
    const o = orderFor(sb.id, d.date, sl);
    const st = o ? o.status : 'scheduled';
    const past = d.date < today();
    const slot = `<small class="muted">${DV.SLOTS[sl].icon} ${Lx(DV.SLOTS[sl])}</small>`;
    if (!m) {
      return `<div class="slot-card empty-slot">${slot}<div class="row"><span class="es-ic">🍽️</span><div class="grow"><b>${T('skipped')}</b><small class="muted">${T('skipHint', { h: DV.cutoffLabel(lang) })}</small></div></div>
        ${!locked ? `<button class="btn btn-primary btn-sm btn-block" data-a="pickerSheet" data-s="${sb.id}" data-d="${d.date}" data-sl="${sl}">${T('chooseMeal')}</button>` : ''}</div>`;
    }
    const col = DV.STATUS[st].color;
    return `<div class="slot-card">
      <div class="row between">${slot}${(past || d.date === today()) ? `<span class="status-pill" style="color:${col};background:${col}14">${I18N[lang].statusLabel[st]}</span>` : d.auto[sl] ? `<span class="chip chip-warn">👨‍🍳 ${T('chefChoice')}</span>` : ''}</div>
      <div class="sc-main" data-a="mealSheet" data-id="${m.id}"><img src="${m.img}" alt=""><div class="grow"><b>${E(Lx(m.name))}</b><div class="macros">${macro(m)}</div></div></div>
      <div class="row" style="gap:8px">
        ${!locked ? `<button class="btn btn-ghost btn-sm grow" data-a="pickerSheet" data-s="${sb.id}" data-d="${d.date}" data-sl="${sl}">${I.swap} ${T('changeMeal')}</button>` : ''}
        ${o && o.status === 'delivered' ? (o.rating ? `<span class="rated">${T('yourRating')}: ${'★'.repeat(o.rating)}${'☆'.repeat(5 - o.rating)}</span>` : `<button class="btn btn-primary btn-sm grow" data-a="rateSheet" data-o="${o.id}">⭐ ${T('rate')}</button>`) : ''}
      </div></div>`;
  }

  function subRow(sb) {
    const p = DV.planType(sb.planType);
    return `<button class="list-row" data-a="invoiceSheet" data-id="${sb.id}"><span class="lr-ic">${p.icon}</span><div class="grow"><b>${E(Lx(p.name))} · ${T('daysN', { n: sb.daysCount })}</b><small class="muted">${E(sb.code)} · ${fdShort(sb.startDate)}</small></div><b class="num">${money(sb.pricing.total)}</b></button>`;
  }

  // ---------- inbox ----------
  function vInbox() {
    const list = inbox();
    return `<div class="scroll with-tabbar" data-scroll="inbox"><header class="big-title row between"><h1>${T('inbox')}</h1>${unread() ? `<button class="link" data-a="markAll">${T('markAll')}</button>` : ''}</header>
      ${list.length ? `<div class="notifs">${list.map((n) => `<button class="notif ${n.read ? '' : 'unread'}" data-a="notifTap" data-id="${n.id}" data-link="${E(n.link || '')}">
        <span class="n-ic">${n.icon}</span><div class="grow"><b>${E(Lx(n.title))}</b><p class="small muted">${E(Lx(n.body))}</p><small class="tiny muted num">${timeAgo(n.at)}</small></div></button>`).join('')}</div>`
        : `<div class="empty"><div class="e-ic">🔔</div><p>${T('noNotifs')}</p></div>`}</div>`;
  }
  function timeAgo(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { numeric: 'auto' });
    if (m < 60) return rtf.format(-m, 'minute'); const h = Math.round(m / 60); if (h < 24) return rtf.format(-h, 'hour'); return rtf.format(-Math.round(h / 24), 'day');
  }

  // ---------- account ----------
  function vAccount() {
    const c = me();
    const row = (a, p, ic, label, extra = '') => `<button class="list-row" data-a="${a}" data-p="${p}"><span class="lr-ic">${ic}</span><span class="grow">${label}</span>${extra}${chev()}</button>`;
    return `<div class="scroll with-tabbar" data-scroll="account"><header class="big-title"><h1>${T('account')}</h1></header>
      <section class="profile-card"><span class="av big">${initials(c.name)}</span><div class="grow"><b>${E(c.name || '—')}</b><small class="num muted" dir="ltr">${E(c.phone)}</small></div><button class="btn btn-sm btn-ghost" data-a="page" data-p="personal">${T('edit')}</button></section>
      <div class="list-group">
        ${row('page', 'prefs', '🥜', T('prefs'), c.allergies.length ? `<span class="chip chip-danger">${c.allergies.length}</span>` : '')}
        ${row('page', 'addresses', '📍', T('addresses'), `<small class="muted num">${c.addresses.length}</small>`)}
        ${row('page', 'payments', '🧾', T('payments'))}
        ${row('page', 'notifs', '🔔', T('notifications'))}
      </div>
      <div class="list-group">
        ${row('langSheet', '', '🌐', T('language'), `<small class="muted">${{ ar: 'العربية', nl: 'Nederlands', en: 'English' }[lang]}</small>`)}
        ${row('page', 'help', '💬', T('help'))}
        <a class="list-row" href="https://wa.me/${DV.state.settings.supportWhatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener"><span class="lr-ic">🟢</span><span class="grow">${T('support')}</span>${chev()}</a>
      </div>
      <div class="list-group">
        <button class="list-row danger" data-a="logout"><span class="lr-ic">↩︎</span><span class="grow">${T('logout')}</span></button>
        <button class="list-row" data-a="resetDemo"><span class="lr-ic">♻️</span><span class="grow muted">${T('resetDemo')}</span></button>
      </div>
      <p class="tiny muted" style="text-align:center;margin:10px 0 20px">Delyvo · v1.0 demo</p></div>`;
  }

  // ---------- sub pages ----------
  function vPage() {
    const c = me();
    const P = ui.page;
    let title = '', body = '', footer = '';
    if (P === 'menu') {
      title = T('thisWeek');
      const types = DV.state.plans.types;
      const list = DV.state.meals.filter((m) => m.active && (DV.restaurant(m.restaurantId) || {}).active !== false && (ui.menuFilter === 'all' || m.plans.includes(ui.menuFilter)));
      body = `<div class="seg-scroll">${[['all', T('filterAll')], ...types.map((p) => [p.id, p.icon + ' ' + Lx(p.name)])].map(([id, l]) => `<button class="chip ${ui.menuFilter === id ? 'chip-brand' : ''}" data-a="menuFilter" data-f="${id}">${E(l)}</button>`).join('')}</div>
        <div class="meal-grid">${list.map((m) => mealMini(m)).join('')}</div>`;
    } else if (P === 'personal') {
      title = T('personal');
      body = `<div class="stack pad-x"><label class="field"><span>${T('fullName')}</span><input class="input" id="f-name" value="${E(c.name)}"></label>
        <label class="field"><span>${T('email')}</span><input class="input" id="f-email" type="email" value="${E(c.email)}"></label>
        <label class="field"><span>${T('phone')}</span><input class="input num" value="${E(c.phone)}" disabled dir="ltr"></label></div>`;
      footer = `<button class="btn btn-primary btn-block" data-a="savePersonal">${T('save')}</button>`;
    } else if (P === 'prefs') {
      title = T('prefs');
      const sel = ui.prefDraft || (ui.prefDraft = { allergies: c.allergies.slice(), dislikes: c.dislikes || '', goal: c.goal || 'balanced' });
      body = `<div class="pad-x stack"><div><h3>${T('allergies')}</h3><p class="muted small">${T('allergiesSub')}</p></div>
        ${allergyGrid(sel.allergies, 'prefAllergy')}
        <label class="field"><span>${T('dislikes')}</span><input class="input" data-m="prefDraft.dislikes" value="${E(sel.dislikes)}" placeholder="${T('dislikesPh')}"></label>
        <div><span class="field-l">${T('goal')}</span><div class="seg">${[['balanced', T('goalBalanced')], ['lose', T('goalLose')], ['gain', T('goalGain')]].map(([id, l]) => `<button class="${sel.goal === id ? 'on' : ''}" data-a="prefGoal" data-g="${id}">${l}</button>`).join('')}</div></div></div>`;
      footer = `<button class="btn btn-primary btn-block" data-a="savePrefs">${T('save')}</button>`;
    } else if (P === 'addresses') {
      title = T('addresses');
      body = `<div class="pad-x stack">${c.addresses.map((a) => `<div class="card pad row"><span class="lr-ic">${I.pin}</span><div class="grow"><b>${E(DV.addrLabel(a, lang) || T('home'))}</b><small class="muted">${E(a.street)}, ${E(a.zip)} ${E(a.city)}</small>${a.notes ? `<small class="muted">📝 ${E(a.notes)}</small>` : ''}</div></div>`).join('')}
        <h3 style="margin-top:18px">${T('addAddress')}</h3>${addressForm('addrDraft')}</div>`;
      footer = `<button class="btn btn-primary btn-block" data-a="saveAddress">${T('save')}</button>`;
    } else if (P === 'payments') {
      title = T('payments');
      const subs = allSubs();
      body = `<div class="pad-x">${subs.length ? `<div class="list-group" style="margin:0">${subs.map(subRow).join('')}</div>` : `<div class="empty"><div class="e-ic">🧾</div></div>`}</div>`;
    } else if (P === 'notifs') {
      title = T('notifications');
      const np = c.notifPrefs || {};
      body = `<div class="pad-x"><div class="list-group" style="margin:0">${[['push', T('pushN')], ['whatsapp', T('waN')], ['email', T('emailN')]].map(([k, l]) => `<label class="list-row"><span class="grow">${l}</span><span class="switch"><input type="checkbox" data-a="notifPref" data-k="${k}" ${np[k] ? 'checked' : ''}><i></i></span></label>`).join('')}</div></div>`;
    } else if (P === 'help') {
      title = T('help');
      body = `<div class="pad-x">${[1, 2, 3, 4, 5].map((i) => `<div class="faq ${ui.faqOpen === i ? 'open' : ''}"><button data-a="faq" data-i="${i}"><b>${T('faq' + i + 'q')}</b><span>＋</span></button><p>${T('faq' + i + 'a', { h: DV.cutoffLabel(lang) })}</p></div>`).join('')}
        <a class="btn btn-primary btn-block" style="margin-top:16px" href="https://wa.me/${DV.state.settings.supportWhatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">🟢 ${T('support')}</a></div>`;
    }
    return `<div class="screen ${ui.anim === 'push' ? 'push' : ''}"><header class="nav"><button class="icon-btn" data-a="pageBack">${back()}</button><h3 class="grow nav-t">${E(title)}</h3><span style="width:40px"></span></header>
      <div class="scroll" data-scroll="page-${P}">${body}<div style="height:24px"></div></div>${footer ? `<footer class="cta-bar">${footer}</footer>` : ''}</div>`;
  }

  function allergyGrid(sel, act) {
    return `<div class="allergy-grid">${Object.entries(DV.ALLERGENS).map(([k, a]) => `<button class="al ${sel.includes(k) ? 'on' : ''}" data-a="${act}" data-k="${k}"><span>${a.icon}</span>${E(Lx(a))}</button>`).join('')}</div>`;
  }
  function addressForm(path) {
    const d = path.split('.').reduce((o, k) => o[k], ui) || {};
    const zones = DV.state.zones.filter((z) => z.active);
    return `<div class="stack">
      <div class="seg">${[['home', T('home')], ['work', T('work')]].map(([id, l]) => `<button class="${(d.labelKey || 'home') === id ? 'on' : ''}" data-a="addrLabel" data-path="${path}" data-l="${id}">${id === 'home' ? '🏠' : '💼'} ${l}</button>`).join('')}</div>
      <label class="field"><span>${T('street')}</span><input class="input" data-m="${path}.street" value="${E(d.street || '')}" placeholder="Coolsingel 40" autocomplete="street-address"></label>
      <div class="row" style="gap:10px;align-items:flex-end"><label class="field" style="flex:1"><span>${T('zip')}</span><input class="input num" data-m="${path}.zip" value="${E(d.zip || '')}" placeholder="3011 AD" autocomplete="postal-code"></label>
      <label class="field" style="flex:1.3"><span>${T('city')}</span><select class="select" data-m="${path}.city" data-r="1">${zones.map((z) => `<option ${d.city === z.city ? 'selected' : ''}>${E(z.city)}</option>`).join('')}</select></label></div>
      <label class="field"><span>${T('notes')}</span><input class="input" data-m="${path}.notes" value="${E(d.notes || '')}"></label></div>`;
  }

  // ================= subscription wizard =================
  const STEPS = ['type', 'duration', 'meals', 'start', 'address', 'pick', 'pay'];
  function newWizard(type, renewFrom) {
    const c = me(); const S = DV.state;
    const src = renewFrom ? DV.sub(renewFrom) : null;
    const lead = S.settings.minLeadDays;
    let start = DV.addDays(today(), lead);
    if (src) { const last = src.days.filter((d) => d.status === 'active').map((d) => d.date).sort().pop(); if (last && last >= start) start = DV.addDays(last, 1); }
    ui.wiz = {
      step: type ? 1 : 0, type: type || (src ? src.planType : 'varied'), days: src ? src.daysCount : 10, option: src ? src.option : 'both',
      start, weekdays: src ? src.weekdays.slice() : [1, 2, 3, 4, 5], window: src ? src.window : 'noon', calMonth: start.slice(0, 7),
      addrMode: c.addresses.length ? 'existing' : 'new', addressId: src ? src.addressId : (c.addresses[0] || {}).id,
      newAddr: { labelKey: 'home', street: '', zip: '', city: (S.zones[0] || {}).city, notes: '' },
      allergies: c.allergies.slice(), dislikes: c.dislikes || '', picks: {}, pickDay: null,
      promo: '', promoApplied: null, promoMsg: '', pay: 'ideal', bank: 'ING', card: { num: '', exp: '', cvc: '' }, terms: false
    };
  }
  const wDates = () => { const w = ui.wiz; return DV.buildDates(w.start, w.weekdays, w.days); };
  const wSlots = () => DV.mealOption(ui.wiz.option).slots;
  const wCity = () => { const w = ui.wiz; return w.addrMode === 'new' ? w.newAddr.city : ((me().addresses.find((a) => a.id === w.addressId) || {}).city); };
  const wPrice = () => { const w = ui.wiz; return DV.price({ planType: w.type, days: w.days, option: w.option, city: wCity(), promo: w.promoApplied }); };

  function vWizard() {
    const w = ui.wiz; const st = STEPS[w.step];
    const titles = { type: T('stepType'), duration: T('stepDuration'), meals: T('stepMeals'), start: T('stepStart'), address: T('stepAddress'), pick: T('stepPick'), pay: T('stepPay') };
    const body = { type: wType, duration: wDuration, meals: wMeals, start: wStart, address: wAddress, pick: wPick, pay: wPay }[st]();
    const pr = wPrice();
    const canNext = wValid();
    const cta = st === 'pay'
      ? `<button class="btn btn-primary btn-block" data-a="payNow" ${canNext ? '' : 'disabled'}>🔒 ${T('payNow', { x: money(pr.total) })}</button>`
      : `<div class="price-mini"><small class="muted">${T('total')}</small><b class="num">${money(pr.total)}</b><small class="muted num">${T('mealsN', { n: pr.meals })}</small></div><button class="btn btn-primary grow" data-a="wizNext" ${canNext ? '' : 'disabled'}>${T('continue')}</button>`;
    return `<div class="screen wiz ${ui.anim === 'push' ? 'push' : ui.anim === 'step' ? 'step' : ''}">
      <header class="nav"><button class="icon-btn" data-a="wizBack">${back()}</button><div class="grow wiz-t"><small class="muted num">${w.step + 1} / ${STEPS.length}</small><b>${titles[st]}</b></div><button class="icon-btn" data-a="wizClose">✕</button></header>
      <div class="wiz-progress"><i style="width:${((w.step + 1) / STEPS.length) * 100}%"></i></div>
      <div class="scroll" data-scroll="wiz-${st}">${body}<div style="height:20px"></div></div>
      <footer class="cta-bar row">${cta}</footer></div>`;
  }
  function wValid() {
    const w = ui.wiz; const st = STEPS[w.step];
    if (st === 'start') return w.weekdays.length >= 2;
    if (st === 'address') return w.addrMode === 'existing' ? !!w.addressId : (w.newAddr.street.trim().length > 3 && w.newAddr.zip.trim().length >= 4 && !!w.newAddr.city);
    if (st === 'pay') { if (!w.terms) return false; if (w.pay === 'card') return w.card.num.replace(/\D/g, '').length >= 15 && /^\d\d\/\d\d$/.test(w.card.exp) && w.card.cvc.length >= 3; return true; }
    return true;
  }

  function wType() {
    const w = ui.wiz;
    return `<div class="pad-x stack"><p class="muted">${T('choosePlanSub')}</p>${DV.state.plans.types.map((p) => {
      const sample = DV.mealsFor(p.id).slice(0, 3);
      return `<button class="opt-card type ${w.type === p.id ? 'on' : ''}" data-a="wizSet" data-k="type" data-v="${p.id}" style="--pc:${p.color}">
        <div class="row"><span class="pc-ic">${p.icon}</span><div class="grow"><b>${E(Lx(p.name))}</b><small class="muted">${E(Lx(p.desc))}</small></div><span class="radio"></span></div>
        <div class="row between"><div class="thumbs">${sample.map((m) => `<img src="${m.img}" alt="">`).join('')}</div><span class="small"><span class="muted">${T('from')}</span> <b class="num">${money(DV.price({ planType: p.id, days: 5, option: 'lunch', city: '' }).total)}</b> <span class="muted">/ ${T('daysN', { n: 5 })}</span></span></div>
        <small class="muted num">🔥 ${p.kcal} ${T('kcal')}</small></button>`;
    }).join('')}</div>`;
  }
  function wDuration() {
    const w = ui.wiz; const t = DV.planType(w.type);
    return `<div class="pad-x stack">${DV.state.plans.durations.map((d) => {
      const pr = DV.price({ planType: w.type, days: d.days, option: w.option, city: wCity() });
      return `<button class="opt-card ${w.days === d.days ? 'on' : ''}" data-a="wizSet" data-k="days" data-v="${d.days}" style="--pc:${t.color}">
        <div class="row"><div class="dur-n"><b class="num">${d.days}</b><small>${T('days')}</small></div><div class="grow"><b>${E(Lx(d.label))}</b><small class="muted num">${T('mealsN', { n: pr.meals })} · <b>${money(pr.total)}</b></small></div>
        ${d.discount ? `<span class="chip chip-brand">${T('save_')} <span class="num">${Math.round(d.discount * 100)}%</span></span>` : ''}<span class="radio"></span></div></button>`;
    }).join('')}</div>`;
  }
  function wMeals() {
    const w = ui.wiz;
    return `<div class="pad-x stack"><p class="muted">${T('whichMeals')}</p>${DV.state.plans.mealOptions.map((o) => `
      <button class="opt-card ${w.option === o.id ? 'on' : ''}" data-a="wizSet" data-k="option" data-v="${o.id}">
        <div class="row"><span class="big-ic">${o.icon}</span><div class="grow"><b>${E(Lx(o.name))}</b><small class="muted num">${T('mealsN', { n: o.slots.length * w.days })} · ${T('daysN', { n: w.days })}</small></div>
        ${o.discount ? `<span class="chip chip-brand">${T('save_')} <span class="num">${Math.round(o.discount * 100)}%</span></span>` : ''}<span class="radio"></span></div></button>`).join('')}</div>`;
  }
  function wStart() {
    const w = ui.wiz; const S = DV.state;
    const minD = DV.addDays(today(), S.settings.minLeadDays);
    const [y, m] = w.calMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1); const nDays = new Date(y, m, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // Monday first
    const wdOrder = [1, 2, 3, 4, 5, 6, 0];
    const dates = wDates();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push('<i></i>');
    for (let d = 1; d <= nDays; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dis = iso < minD || !S.settings.deliveryWeekdays.includes(DV.weekday(iso));
      cells.push(`<button class="cd ${iso === w.start ? 'sel' : ''} ${dates.includes(iso) && iso !== w.start ? 'in' : ''} ${iso === today() ? 'tdy' : ''}" ${dis ? 'disabled' : ''} data-a="wizSet" data-k="start" data-v="${iso}"><span class="num">${d}</span></button>`);
    }
    const monthName = first.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang, { month: 'long', year: 'numeric' });
    const canPrev = w.calMonth > today().slice(0, 7);
    return `<div class="pad-x stack">
      <h3>${T('startDate')}</h3>
      <div class="cal card pad"><div class="row between cal-h"><button class="icon-btn" data-a="calNav" data-n="-1" ${canPrev ? '' : 'disabled'}>${back()}</button><b>${monthName}</b><button class="icon-btn" data-a="calNav" data-n="1">${chev()}</button></div>
        <div class="cal-g wd">${wdOrder.map((i) => `<small>${I18N[lang].wd[i]}</small>`).join('')}</div><div class="cal-g">${cells.join('')}</div></div>
      <h3>${T('deliveryDays')}</h3>
      <div class="wd-chips">${wdOrder.filter((i) => S.settings.deliveryWeekdays.includes(i)).map((i) => `<button class="${w.weekdays.includes(i) ? 'on' : ''}" data-a="wizWd" data-v="${i}">${I18N[lang].wd[i]}</button>`).join('')}</div>
      ${w.weekdays.length < 2 ? `<p class="err small">${T('minDays')}</p>` : ''}
      <div class="info-box"><div class="row between"><span class="muted small">${T('firstDelivery')}</span><b>${fd(dates[0])}</b></div><div class="row between"><span class="muted small">${T('endsOn')}</span><b>${fd(dates[dates.length - 1])}</b></div></div>
      <h3>${T('deliveryWindow')}</h3>
      <div class="stack">${S.settings.deliveryWindows.map((x) => `<button class="opt-card slim ${w.window === x.id ? 'on' : ''}" data-a="wizSet" data-k="window" data-v="${x.id}"><div class="row">${I.clock}<b class="grow">${E(Lx(x.label))}</b><span class="radio"></span></div></button>`).join('')}</div>
    </div>`;
  }
  function wAddress() {
    const w = ui.wiz; const c = me();
    return `<div class="pad-x stack">
      <h3>${T('address')}</h3>
      ${c.addresses.map((a) => `<button class="opt-card slim ${w.addrMode === 'existing' && w.addressId === a.id ? 'on' : ''}" data-a="wizAddr" data-id="${a.id}"><div class="row">${I.pin}<div class="grow"><b>${E(DV.addrLabel(a, lang) || T('home'))}</b><small class="muted">${E(a.street)}, ${E(a.zip)} ${E(a.city)}</small></div><span class="radio"></span></div></button>`).join('')}
      <button class="opt-card slim ${w.addrMode === 'new' ? 'on' : ''}" data-a="wizAddr" data-id=""><div class="row"><span>＋</span><b class="grow">${T('addAddress')}</b><span class="radio"></span></div></button>
      ${w.addrMode === 'new' ? addressForm('wiz.newAddr') : ''}
      <div class="hr"></div>
      <div><h3>${T('allergies')}</h3><p class="muted small">${T('allergiesSub')}</p></div>
      ${allergyGrid(w.allergies, 'wizAllergy')}
      <label class="field"><span>${T('dislikes')}</span><input class="input" data-m="wiz.dislikes" value="${E(w.dislikes)}" placeholder="${T('dislikesPh')}"></label>
    </div>`;
  }
  function wPick() {
    const w = ui.wiz; const dates = wDates(); const slots = wSlots();
    if (!w.pickDay || !dates.includes(w.pickDay)) w.pickDay = dates[0];
    const d = w.pickDay; const picks = w.picks[d] || (w.picks[d] = {});
    const done = dates.filter((x) => slots.every((sl) => (w.picks[x] || {})[sl])).length;
    const cust = { allergies: w.allergies };
    const filt = (m) => ui.pickFilter === 'all' || (ui.pickFilter === 'protein' && m.protein >= 38) || (ui.pickFilter === 'light' && m.kcal < 550);
    return `<div class="pick">
      <div class="pad-x"><div class="row between"><p class="small muted">${T('picks')}: <b class="num">${done}/${dates.length}</b></p><button class="link" data-a="chefAll">👨‍🍳 ${T('chefPickAll')}</button></div></div>
      <div class="day-strip" data-scroll="wstrip">${dates.map((x) => {
        const full = slots.every((sl) => (w.picks[x] || {})[sl]); const some = slots.some((sl) => (w.picks[x] || {})[sl]);
        return `<button class="dchip ${x === d ? 'sel' : ''} ${full ? 'done' : some ? 'half' : ''}" data-a="wizPickDay" data-d="${x}"><small>${I18N[lang].wd[DV.weekday(x)]}</small><b class="num">${+x.slice(8)}</b><i></i></button>`;
      }).join('')}</div>
      <div class="pad-x"><div class="row between" style="margin:4px 0 10px"><h3>${fd(d)}</h3><button class="chip" data-a="skipDay">${T('skipDay')}</button></div>
        ${w.allergies.length ? `<p class="safe-note">🛡️ ${T('allSafe')}</p>` : ''}
        <div class="seg-scroll" style="padding:0 0 10px">${[['all', T('filterAll')], ['protein', '💪 ' + T('highProtein')], ['light', '🔥 ' + T('lowCal')]].map(([id, l]) => `<button class="chip ${ui.pickFilter === id ? 'chip-brand' : ''}" data-a="pickFilter" data-f="${id}">${l}</button>`).join('')}</div>
        ${slots.map((sl) => {
          const list = DV.mealsFor(w.type, sl).filter((m) => DV.isSafe(m, cust)).filter(filt);
          return `<div class="slot-h"><b>${DV.SLOTS[sl].icon} ${Lx(DV.SLOTS[sl])}</b>${picks[sl] ? `<span class="chip chip-brand">${I.check} ${T('selected')}</span>` : `<span class="chip">${T('skipped')}</span>`}</div>
            <div class="pick-grid">${list.map((m) => `<div class="pick-card ${picks[sl] === m.id ? 'on' : ''}" data-a="wizPick" data-sl="${sl}" data-id="${m.id}">
              <div class="pk-img"><img src="${m.img}" alt="" loading="lazy"><button class="pk-info" data-a="mealSheet" data-id="${m.id}" data-ctx="wiz" data-sl="${sl}">${I.info}</button><span class="pk-check">${I.check}</span></div>
              <b>${E(Lx(m.name))}</b><div class="row between tiny"><span class="muted num">${m.kcal} kcal · P${m.protein}</span>${stars(m.rating)}</div></div>`).join('')}</div>`;
        }).join('')}
        <p class="hint">💡 ${T('skipHint', { h: DV.cutoffLabel(lang) })}</p></div></div>`;
  }
  function wPay() {
    const w = ui.wiz; const pr = wPrice(); const dates = wDates(); const slots = wSlots(); const t = DV.planType(w.type);
    const picked = dates.reduce((n, d) => n + slots.filter((sl) => (w.picks[d] || {})[sl]).length, 0);
    const addr = w.addrMode === 'new' ? w.newAddr : me().addresses.find((a) => a.id === w.addressId) || {};
    const line = (l, v, cls = '') => `<div class="row between ${cls}"><span>${l}</span><span class="num">${v}</span></div>`;
    const methods = [['ideal', '🏦', T('ideal')], ['applepay', '', T('applepay')], ['card', '💳', T('card')], ['paypal', '🅿️', T('paypal')], ['klarna', '🩷', T('klarna')]];
    const banks = ['ING', 'Rabobank', 'ABN AMRO', 'SNS', 'ASN Bank', 'bunq', 'Triodos', 'Knab', 'RegioBank', 'Revolut'];
    return `<div class="pad-x stack">
      <div class="card pad sum">
        <div class="row"><span class="pc-ic" style="--pc:${t.color}">${t.icon}</span><div class="grow"><b>${E(Lx(t.name))} · ${T('daysN', { n: w.days })}</b><small class="muted">${E(Lx(DV.mealOption(w.option).name))}</small></div><button class="link" data-a="wizGo" data-s="0">${T('edit')}</button></div>
        <div class="hr"></div>
        <div class="sum-rows">
          <div class="row">${I.cal}<span class="grow">${fdShort(dates[0])} → ${fdShort(dates[dates.length - 1])}</span><small class="muted">${w.weekdays.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((i) => I18N[lang].wd[i]).join('، ')}</small></div>
          <div class="row">${I.clock}<span class="grow">${E(Lx((DV.state.settings.deliveryWindows.find((x) => x.id === w.window) || {}).label))}</span></div>
          <div class="row">${I.pin}<span class="grow">${E(addr.street || '')}, ${E(addr.city || '')}</span></div>
          <div class="row">🍽️<span class="grow">${T('picks')}: <b class="num">${picked}</b> · ${T('toChoose')}: <b class="num">${pr.meals - picked}</b></span><button class="link" data-a="wizGo" data-s="5">${T('edit')}</button></div>
          ${w.allergies.length ? `<div class="row">🛡️<span class="grow small">${allergenNames(w.allergies).join('، ')}</span></div>` : ''}
        </div></div>
      <div class="card pad price-box">
        ${line(`${T('subPrice')} (${T('mealsN', { n: pr.meals })})`, money(pr.base))}
        ${pr.durDisc ? line(T('durationDisc'), '−' + money(pr.durDisc), 'green') : ''}
        ${pr.optDisc ? line(T('bothDisc'), '−' + money(pr.optDisc), 'green') : ''}
        ${line(T('deliveryFee'), pr.deliveryFee ? money(pr.deliveryFee) : T('free'), pr.deliveryFee ? '' : 'green')}
        ${pr.promoDisc ? line(T('promo') + ' ' + pr.promo, '−' + money(pr.promoDisc), 'green') : ''}
        <div class="promo row"><input class="input" data-m="wiz.promo" value="${E(w.promo)}" placeholder="${T('promo')}" autocapitalize="characters"><button class="btn btn-dark btn-sm" data-a="applyPromo">${T('apply')}</button></div>
        ${w.promoMsg ? `<p class="small ${w.promoApplied ? 'green' : 'err'}">${E(w.promoMsg)}</p>` : ''}
        <div class="hr"></div>
        <div class="row between total"><b>${T('total')}</b><b class="num">${money(pr.total)}</b></div>
        <div class="row between tiny muted"><span>${T('vatIncl')} (${money(pr.vat)})</span></div>
      </div>
      <h3>${T('payMethod')}</h3>
      <div class="pay-list">${methods.map(([id, ic, l]) => `<button class="pay-m ${w.pay === id ? 'on' : ''}" data-a="wizSet" data-k="pay" data-v="${id}"><span class="pm-ic ${id}">${id === 'applepay' ? '<b>Pay</b>' : id === 'ideal' ? '<b>iD</b>' : ic}</span><b class="grow">${l}</b><span class="radio"></span></button>
        ${w.pay === id && id === 'ideal' ? `<div class="banks">${banks.map((b) => `<button class="${w.bank === b ? 'on' : ''}" data-a="wizSet" data-k="bank" data-v="${b}">${b}</button>`).join('')}</div>` : ''}
        ${w.pay === id && id === 'card' ? `<div class="card-form stack"><input class="input num" dir="ltr" inputmode="numeric" data-m="wiz.card.num" data-fmt="card" value="${E(w.card.num)}" placeholder="4242 4242 4242 4242"><div class="row" style="gap:10px"><input class="input num" dir="ltr" data-m="wiz.card.exp" data-fmt="exp" value="${E(w.card.exp)}" placeholder="${T('expiry')}" inputmode="numeric"><input class="input num" dir="ltr" data-m="wiz.card.cvc" data-fmt="cvc" value="${E(w.card.cvc)}" placeholder="${T('cvc')}" inputmode="numeric"></div></div>` : ''}`).join('')}</div>
      <label class="terms"><input type="checkbox" data-a="terms" ${w.terms ? 'checked' : ''}><span>${T('terms')}</span></label>
    </div>`;
  }

  function vSuccess() {
    const sb = DV.sub(ui.lastSub);
    const conf = Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * 1.2).toFixed(2)}s;--c:${['#1FA06B', '#F59E0B', '#3B82F6', '#EF4444', '#A855F7'][i % 5]};--r:${Math.round(Math.random() * 360)}deg"></i>`).join('');
    return `<div class="screen success"><div class="confetti">${conf}</div>
      <div class="succ-body"><div class="succ-ic">${I.check}</div><h1>${T('paySuccess')}</h1><p class="muted">${T('paySuccessSub')}</p>
        ${sb ? `<div class="card pad" style="text-align:start;margin-top:18px"><div class="row between"><span class="muted small">${E(sb.code)}</span><b class="num">${money(sb.pricing.total)}</b></div>
          <div class="row between"><span class="muted small">${T('firstDelivery')}</span><b>${fd(sb.startDate)}</b></div><div class="row between"><span class="muted small">${T('paidWith')}</span><b>${E(T(sb.payment.method))}</b></div></div>` : ''}
      </div><footer class="cta-bar"><button class="btn btn-primary btn-block" data-a="goPlan">${T('goMyPlan')}</button></footer></div>`;
  }

  // ================= sheets =================
  function vSheet() {
    const s = ui.sheet; if (!s) return '';
    if (!me() && s.type !== 'lang') { ui.sheet = null; return ''; }
    let inner = '';
    if (s.type === 'meal') inner = shMeal(s);
    else if (s.type === 'picker') inner = shPicker(s);
    else if (s.type === 'postpone') inner = shPostpone(s);
    else if (s.type === 'rate') inner = shRate(s);
    else if (s.type === 'lang') inner = shLang();
    else if (s.type === 'pay') inner = shPay(s);
    else if (s.type === 'invoice') inner = shInvoice(s);
    const anim = ui.sheetAnim ? 'in' : '';
    return `<div class="sheet-back ${anim}" data-a="${s.type === 'pay' ? '' : 'closeSheet'}"></div><div class="sheet ${anim} ${s.type === 'meal' ? 'tall' : ''}"><div class="grab"></div>${inner}</div>`;
  }
  function shMeal(s) {
    const m = DV.meal(s.id); const c = me() || { allergies: [] };
    const allergies = ui.wiz && s.ctx === 'wiz' ? ui.wiz.allergies : c.allergies;
    const bad = m.allergens.filter((a) => allergies.includes(a));
    const tot = m.protein * 4 + m.carbs * 4 + m.fat * 9;
    const bar = (v, k, col) => `<div class="mbar"><div class="row between small"><span>${T(k)}</span><b class="num">${v}g</b></div><div class="mb"><i style="width:${Math.round((v * (k === 'fat' ? 9 : 4) / tot) * 100)}%;background:${col}"></i></div></div>`;
    let action = '';
    if (s.ctx === 'wiz' && !bad.length) action = `<button class="btn btn-primary btn-block" data-a="wizPick" data-sl="${s.sl}" data-id="${m.id}" data-close="1">${T('select')}</button>`;
    if (s.ctx === 'plan' && !bad.length) action = `<button class="btn btn-primary btn-block" data-a="planPick" data-s="${s.subId}" data-d="${s.date}" data-sl="${s.sl}" data-id="${m.id}">${T('select')}</button>`;
    return `<div class="sheet-scroll"><div class="sm-img"><img src="${m.img}" alt=""><button class="icon-btn sm-x" data-a="closeSheet">✕</button></div>
      <div class="pad stack">
        <div class="row wrap" style="gap:6px">${m.tags.map((t) => DV.TAGS[t] ? `<span class="chip ${t === 'spicy' ? 'chip-danger' : 'chip-brand'}">${E(Lx(DV.TAGS[t]))}</span>` : '').join('')}${m.plans.map((p) => `<span class="chip">${DV.planType(p).icon} ${E(Lx(DV.planType(p).name))}</span>`).join('')}</div>
        <div><h2>${E(Lx(m.name))}</h2><div class="row small" style="margin-top:4px">${stars(m.rating)}<span class="muted num">(${m.ratingCount} ${T('reviews')})</span></div></div>
        <p class="muted">${E(Lx(m.desc))}</p>
        ${bad.length ? `<div class="warn-box">⚠️ ${T('notForYou')}: <b>${allergenNames(bad).join('، ')}</b></div>` : ''}
        <div class="macro-box"><div class="kcal-ring"><b class="num">${m.kcal}</b><small>${T('kcal')}</small></div><div class="grow stack" style="--g:8px">${bar(m.protein, 'protein', '#1FA06B')}${bar(m.carbs, 'carbs', '#F59E0B')}${bar(m.fat, 'fat', '#3B82F6')}</div></div>
        <div><h4>${T('ingredients')}</h4><p class="muted small">${E(Lx(m.ingredients))}</p></div>
        <div><h4>${T('allergensT')}</h4>${m.allergens.length ? `<div class="row wrap" style="gap:6px;margin-top:6px">${m.allergens.map((a) => `<span class="chip ${allergies.includes(a) ? 'chip-danger' : 'chip-warn'}">${DV.ALLERGENS[a].icon} ${E(Lx(DV.ALLERGENS[a]))}</span>`).join('')}</div>` : `<p class="muted small">✅ ${T('noAllergens')}</p>`}</div>
        <div class="info-box small"><b>🔥 ${T('reheat')}</b><p class="muted">${E(Lx(m.reheat))}</p><p class="muted">❄️ ${T('shelf', { n: m.shelfDays })}</p></div>
      </div></div>${action ? `<div class="sheet-cta">${action}</div>` : ''}`;
  }
  function shPicker(s) {
    const sb = DV.sub(s.subId); const c = me();
    const cur = (sb.days.find((d) => d.date === s.date) || { meals: {} }).meals[s.sl];
    const list = DV.mealsFor(sb.planType, s.sl).filter((m) => DV.isSafe(m, c));
    return `<div class="sh-head"><h3>${T('chooseMeal')}</h3><small class="muted">${fd(s.date)} · ${DV.SLOTS[s.sl].icon} ${Lx(DV.SLOTS[s.sl])}</small></div>
      <div class="sheet-scroll"><div class="pick-list">${list.map((m) => `<div class="pl-row ${cur === m.id ? 'on' : ''}">
        <img src="${m.img}" alt="" data-a="mealSheet" data-id="${m.id}" data-ctx="plan" data-s="${sb.id}" data-d="${s.date}" data-sl="${s.sl}">
        <div class="grow" data-a="mealSheet" data-id="${m.id}" data-ctx="plan" data-s="${sb.id}" data-d="${s.date}" data-sl="${s.sl}"><b>${E(Lx(m.name))}</b><div class="macros">${macro(m)}</div></div>
        ${cur === m.id ? `<span class="chip chip-brand">${I.check}</span>` : `<button class="btn btn-primary btn-xs" data-a="planPick" data-s="${sb.id}" data-d="${s.date}" data-sl="${s.sl}" data-id="${m.id}">${T('select')}</button>`}</div>`).join('')}</div></div>`;
  }
  function shPostpone(s) {
    const sb = DV.sub(s.subId); const max = DV.state.settings.maxPostpones;
    const left = max - sb.postponed;
    return `<div class="pad stack" style="text-align:center"><div class="big-emoji">📅</div><h3>${T('postponeTitle')}</h3><p class="muted">${fd(s.date)}</p><p class="small">${T('postponeSub', { n: max })}</p>
      <p class="chip ${left > 0 ? 'chip-brand' : 'chip-danger'}" style="margin:0 auto;display:flex;width:max-content">${T('postpones')}: <span class="num">${sb.postponed}/${max}</span></p>
      <div class="row" style="gap:10px"><button class="btn btn-ghost grow" data-a="closeSheet">${T('cancel')}</button><button class="btn btn-primary grow" data-a="postponeDo" data-s="${sb.id}" data-d="${s.date}" ${left > 0 ? '' : 'disabled'}>${T('confirm')}</button></div></div>`;
  }
  function shRate(s) {
    const o = DV.order(s.o); const m = DV.meal(o.mealId);
    const r = s.stars || 0;
    return `<div class="pad stack" style="text-align:center"><img src="${m.img}" class="rate-img" alt=""><h3>${T('rate')}</h3><p class="muted">${E(Lx(m.name))}</p>
      <div class="rate-stars">${[1, 2, 3, 4, 5].map((i) => `<button class="${i <= r ? 'on' : ''}" data-a="rateStar" data-v="${i}">★</button>`).join('')}</div>
      <textarea class="textarea" data-m="sheet.comment" placeholder="${T('commentPh')}">${E(s.comment || '')}</textarea>
      <button class="btn btn-primary btn-block" data-a="rateSend" ${r ? '' : 'disabled'}>${T('send')}</button></div>`;
  }
  function shLang() {
    return `<div class="pad stack"><h3>${T('language')}</h3>${[['ar', 'العربية', '🇸🇦'], ['nl', 'Nederlands', '🇳🇱'], ['en', 'English', '🇬🇧']].map(([id, l, f]) => `<button class="opt-card slim ${lang === id ? 'on' : ''}" data-a="setLang" data-l="${id}"><div class="row"><span class="big-ic">${f}</span><b class="grow">${l}</b><span class="radio"></span></div></button>`).join('')}</div>`;
  }
  function shPay(s) {
    const w = ui.wiz; const pr = wPrice();
    if (s.stage === 'processing') return `<div class="pad stack pay-proc"><div class="spinner"></div><h3>${T('processing')}</h3><p class="muted num">${money(pr.total)}</p></div>`;
    if (w.pay === 'applepay') return `<div class="pad stack apple"><div class="row between"><b style="font-size:20px"> Pay</b><button class="link" data-a="closeSheet">${T('cancel')}</button></div>
      <div class="ap-card"><span>💳</span><div class="grow"><b>Visa •••• 4242</b><small class="muted">Delyvo B.V.</small></div></div>
      <div class="row between"><span class="muted">${T('total')}</span><b class="num">${money(pr.total)}</b></div>
      <button class="faceid" data-a="payConfirm"><span class="fi">🙂</span><small>Face ID — ${T('confirmPay')}</small></button></div>`;
    const brand = { ideal: { n: w.bank, c: { ING: '#FF6200', Rabobank: '#000099', 'ABN AMRO': '#00857A', bunq: '#1F2B3A', Revolut: '#0666EB' }[w.bank] || '#CC0066' }, card: { n: '3-D Secure', c: '#1A1F71' }, paypal: { n: 'PayPal', c: '#003087' }, klarna: { n: 'Klarna', c: '#FFA8CD' } }[w.pay];
    return `<div class="bank-mock"><div class="bm-head" style="background:${brand.c}"><span>🔒 ${T('redirecting')} ${E(brand.n)}</span><button data-a="closeSheet">✕</button></div>
      <div class="pad stack" style="text-align:center"><div class="bm-logo" style="color:${brand.c}">${E(brand.n)}</div>
      <p class="muted small">Delyvo B.V. · ${E(pr.promo || '')}</p><div class="bm-amt num">${money(pr.total)}</div>
      <p class="small muted">${w.pay === 'klarna' ? 'Betaal over 30 dagen · 0% rente' : w.pay === 'card' ? 'Bevestig de betaling in je bank-app' : 'Bevestig met je bank-app'}</p>
      <button class="btn btn-block" style="background:${brand.c};color:${w.pay === 'klarna' ? '#111' : '#fff'}" data-a="payConfirm">${T('confirmPay')}</button></div></div>`;
  }
  function shInvoice(s) {
    const sb = DV.sub(s.id); const c = me(); const p = DV.planType(sb.planType); const pr = sb.pricing;
    const line = (l, v) => `<div class="row between small"><span class="muted">${l}</span><span class="num">${v}</span></div>`;
    return `<div class="pad stack invoice"><div class="row between"><span class="logo-word" style="font-size:22px">Delyvo</span><span class="chip chip-brand">${T('invoice')}</span></div>
      ${line('No.', sb.payment.ref)}${line(T('dates'), new Date(sb.payment.paidAt).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang))}${line(T('fullName'), E(c.name))}
      <div class="hr"></div>${line(`${p.icon} ${Lx(p.name)} · ${T('daysN', { n: sb.daysCount })} · ${Lx(DV.mealOption(sb.option).name)}`, money(pr.base))}
      ${pr.durDisc ? line(T('durationDisc'), '−' + money(pr.durDisc)) : ''}${pr.optDisc ? line(T('bothDisc'), '−' + money(pr.optDisc)) : ''}${pr.deliveryFee ? line(T('deliveryFee'), money(pr.deliveryFee)) : ''}${pr.promoDisc ? line(T('promo') + ' ' + pr.promo, '−' + money(pr.promoDisc)) : ''}
      <div class="hr"></div><div class="row between"><b>${T('total')}</b><b class="num">${money(pr.total)}</b></div>${line('BTW 9%', money(pr.vat))}${line(T('paidWith'), T(sb.payment.method))}
      <p class="tiny muted">Delyvo B.V. · KvK 00000000 · BTW NL000000000B01</p>
      <button class="btn btn-ghost btn-block" data-a="closeSheet">${T('close')}</button></div>`;
  }

  // ================= actions =================
  function setPath(path, val) { const ks = path.split('.'); let o = ui; ks.slice(0, -1).forEach((k) => { o = o[k]; }); o[ks[ks.length - 1]] = val; }
  function login(c) {
    ses = DV.session('customer', { cid: c.id });
    markSeen('customer:' + c.id);
    ui.view = 'tabs'; ui.tab = 'home'; ui.anim = 'push'; ui.login = { step: 'phone', phone: '', code: '', name: '', email: '', err: '' };
    render();
    DVUI.island(greet() + ' ' + firstName(c.name), 'Delyvo', '👋');
  }
  function wizNext() {
    const w = ui.wiz; if (!wValid()) return;
    if (STEPS[w.step] === 'address' && w.addrMode === 'existing') { /* keep */ }
    if (w.step < STEPS.length - 1) { w.step++; ui.anim = 'step'; ui.resetScroll = true; render(); }
  }
  function wizPick(sl, id, close) {
    const w = ui.wiz; const d = w.pickDay; const p = w.picks[d] || (w.picks[d] = {});
    p[sl] = p[sl] === id ? null : id;
    DVUI.vibrate(15);
    if (close) { ui.sheet = null; }
    const slots = wSlots(); const dates = wDates();
    if (p[sl] && slots.every((x) => p[x])) {
      const nxt = dates.find((x) => x > d && !slots.every((s2) => (w.picks[x] || {})[s2]));
      render();
      if (nxt) setTimeout(() => { if (ui.wiz && ui.wiz.pickDay === d) { ui.wiz.pickDay = nxt; ui.resetScroll = false; render(); const el = $app.querySelector('.pick .dchip.sel'); el && el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); $app.querySelector('[data-scroll="wiz-pick"]')?.scrollTo({ top: 0, behavior: 'smooth' }); } }, 380);
      return;
    }
    render();
  }
  function doPay() {
    const w = ui.wiz; const c = me();
    let addressId = w.addressId;
    const patch = { allergies: w.allergies.slice(), dislikes: w.dislikes };
    if (w.addrMode === 'new') {
      addressId = DV.uid('a');
      patch.addresses = c.addresses.concat([{ id: addressId, labelKey: w.newAddr.labelKey === 'work' ? 'work' : 'home', label: w.newAddr.labelKey === 'work' ? T('work') : T('home'), street: w.newAddr.street, zip: w.newAddr.zip, city: w.newAddr.city, notes: w.newAddr.notes }]);
    }
    DV.updateCustomer(c.id, patch);
    const sb = DV.createSubscription(c.id, { planType: w.type, days: w.days, option: w.option, startDate: w.start, weekdays: w.weekdays, window: w.window, addressId, picks: w.picks, promo: w.promoApplied, payment: { method: w.pay, detail: w.pay === 'ideal' ? w.bank : w.pay === 'card' ? '•••• ' + w.card.num.replace(/\D/g, '').slice(-4) : '' } });
    ui.lastSub = sb.id; ui.planSub = sb.id; ui.planDay = null; ui.wiz = null; ui.sheet = null; ui.view = 'success';
    render();
  }

  const A = {
    onbNext: () => { ui.onb++; render(); },
    onbSkip: () => { localStorage.setItem('delyvo.customer.onb', '1'); go('login'); },
    langSheet: () => openSheet({ type: 'lang' }),
    setLang: (d) => { lang = d.l; localStorage.setItem('delyvo.customer.lang', lang); if (me()) DV.updateCustomer(me().id, { lang }); ui.sheet = null; render(); },
    demoLogin: () => { const c = DV.customer('c1') || DV.state.customers[0]; login(c); },
    sendCode: () => {
      const digits = ui.login.phone.replace(/\D/g, '');
      if (digits.length < 9) { ui.login.err = T('phone') + ' ✕'; return render(); }
      ui.login.err = ''; ui.login.step = 'otp'; ui.login.code = ''; ui.anim = 'push'; render();
      setTimeout(() => DVUI.island('Delyvo', T('otpHint'), '💬'), 700);
    },
    key: (d) => {
      const L = ui.login;
      if (d.k === '⌫') L.code = L.code.slice(0, -1); else if (L.code.length < 4) L.code += d.k;
      L.err = ''; DVUI.vibrate(8);
      if (L.code.length === 4) {
        if (L.code !== '1234') { L.err = T('wrongCode'); L.code = ''; DVUI.vibrate([30, 40, 30]); return render(); }
        const phone = '+31 ' + L.phone.replace(/\D/g, '').replace(/^0?31/, '').replace(/^0/, '');
        const found = DV.findCustomerByPhone(phone);
        if (found) return login(found);
        L.step = 'profile'; L.phonefull = phone; ui.anim = 'push';
      }
      render();
    },
    loginBack: () => { ui.login.step = ui.login.step === 'profile' ? 'otp' : 'phone'; ui.login.err = ''; render(); },
    finishProfile: () => { const L = ui.login; if (L.name.trim().length < 2) { L.err = T('fullName') + ' ✕'; return render(); } const c = DV.registerCustomer({ name: L.name.trim(), phone: L.phonefull, email: L.email.trim() }); login(c); },
    tab: (d) => setTab(d.t),
    page: (d) => { ui.page = d.p; ui.prefDraft = null; ui.addrDraft = { labelKey: 'home', street: '', zip: '', city: (DV.state.zones[0] || {}).city, notes: '' }; go('page'); },
    pageBack: () => { ui.view = 'tabs'; ui.page = null; render(); },
    menuFilter: (d) => { ui.menuFilter = d.f; render(); },
    bannerTap: () => (activeSubs().length ? A.page({ p: 'menu' }) : A.startWiz({})),
    startWiz: (d) => {
      if (!me()) return go('login');
      // one active plan at a time: subscribers manage it; renewal only opens near the end
      const cur = activeSubs()[0];
      if (cur && !(d.renew && subStats(cur).endingSoon)) { DVUI.toast(T('alreadySub'), T('alreadySubSub'), '✅', 2400); return setTab('plan'); }
      newWizard(d.type, d.renew); go('wizard');
    },
    wizBack: () => { const w = ui.wiz; if (w.step === 0 || (w.step === 1 && w.skippedType)) return A.wizClose(); w.step--; ui.anim = 'step'; ui.resetScroll = true; render(); },
    wizClose: () => { ui.wiz = null; ui.view = 'tabs'; render(); },
    wizGo: (d) => { ui.wiz.step = +d.s; ui.resetScroll = true; render(); },
    wizNext,
    wizSet: (d) => {
      const w = ui.wiz; let v = d.v;
      if (d.k === 'days') v = +v;
      w[d.k] = v;
      if (d.k === 'start') w.calMonth = v.slice(0, 7);
      if (['days', 'option', 'start', 'type'].includes(d.k) && d.k !== 'start') { /* picks remain keyed by date; filter on read */ }
      if (d.k === 'type') w.picks = {};
      render();
    },
    calNav: (d) => { const w = ui.wiz; const [y, m] = w.calMonth.split('-').map(Number); const nd = new Date(y, m - 1 + +d.n, 1); w.calMonth = nd.getFullYear() + '-' + String(nd.getMonth() + 1).padStart(2, '0'); render(); },
    wizWd: (d) => { const w = ui.wiz; const v = +d.v; w.weekdays = w.weekdays.includes(v) ? w.weekdays.filter((x) => x !== v) : w.weekdays.concat(v); if (w.weekdays.length && !w.weekdays.includes(DV.weekday(w.start))) { let s = w.start; for (let i = 0; i < 7 && !w.weekdays.includes(DV.weekday(s)); i++) s = DV.addDays(s, 1); w.start = s; w.calMonth = s.slice(0, 7); } render(); },
    wizAddr: (d) => { const w = ui.wiz; if (d.id) { w.addrMode = 'existing'; w.addressId = d.id; } else w.addrMode = 'new'; render(); },
    addrLabel: (d) => { const o = d.path.split('.').reduce((x, k) => x[k], ui); o.labelKey = d.l; render(); },
    wizAllergy: (d) => { const w = ui.wiz; w.allergies = w.allergies.includes(d.k) ? w.allergies.filter((x) => x !== d.k) : w.allergies.concat(d.k);
      Object.values(w.picks).forEach((p) => Object.keys(p).forEach((sl) => { const m = p[sl] && DV.meal(p[sl]); if (m && !DV.isSafe(m, { allergies: w.allergies })) p[sl] = null; })); render(); },
    wizPickDay: (d) => { ui.wiz.pickDay = d.d; render(); },
    wizPick: (d) => wizPick(d.sl, d.id, !!d.close),
    pickFilter: (d) => { ui.pickFilter = d.f; render(); },
    skipDay: () => { const w = ui.wiz; w.picks[w.pickDay] = {}; const dates = wDates(); const i = dates.indexOf(w.pickDay); if (i < dates.length - 1) w.pickDay = dates[i + 1]; DVUI.toast(T('skipped'), fd(dates[i]), '⏭️', 1600); render(); },
    chefAll: () => { const w = ui.wiz; const cust = { allergies: w.allergies }; const used = []; wDates().forEach((d) => { const p = w.picks[d] || (w.picks[d] = {}); wSlots().forEach((sl) => { if (!p[sl]) { p[sl] = DV.chefPick(w.type, sl, cust, used.slice(-5)); } used.push(p[sl]); }); }); DVUI.toast(T('chefChoice'), '👨‍🍳 ✓', '👨‍🍳', 1800); render(); },
    applyPromo: () => { const w = ui.wiz; const code = w.promo.trim().toUpperCase(); const ok = DV.state.promos.find((p) => p.active && p.code === code); w.promoApplied = ok ? code : null; w.promoMsg = ok ? T('promoOk') + ' ✓' : T('promoBad'); render(); },
    terms: (d, el) => { ui.wiz.terms = el.checked; render(); },
    payNow: () => openSheet({ type: 'pay', stage: 'confirm' }),
    payConfirm: () => { ui.sheet.stage = 'processing'; ui.sheetAnim = false; render(); setTimeout(doPay, 1400); },
    goPlan: () => { ui.view = 'tabs'; setTab('plan'); },
    closeSheet,
    mealSheet: (d) => openSheet({ type: 'meal', id: d.id, ctx: d.ctx, sl: d.sl, subId: d.s, date: d.d }),
    pickSub: (d) => { ui.planSub = d.id; ui.planDay = null; render(); },
    pickDay: (d) => { ui.planDay = d.d; render(); },
    openDay: (d) => { ui.planSub = d.s; ui.planDay = d.d; setTab('plan'); },
    pickerSheet: (d) => openSheet({ type: 'picker', subId: d.s, date: d.d, sl: d.sl }),
    planPick: (d) => { const ok = DV.setDayMeal(d.s, d.d, d.sl, d.id); ui.sheet = null; if (ok) DVUI.toast(T('saved'), Lx(DV.meal(d.id).name), '✅'); else DVUI.toast(T('locked'), T('lockedSub', { h: DV.cutoffLabel(lang) }), '🔒'); render(); },
    postponeAsk: (d) => openSheet({ type: 'postpone', subId: d.s, date: d.d }),
    postponeDo: (d) => { const r = DV.postponeDay(d.s, d.d); ui.sheet = null; if (r.ok) { ui.planDay = r.newDate; DVUI.toast(T('postponed', { d: fd(r.newDate) }), '', '📅'); } else DVUI.toast(r.reason === 'limit' ? T('limitReached') : T('locked'), '', '⚠️'); render(); },
    rateSheet: (d) => openSheet({ type: 'rate', o: d.o, stars: 0, comment: '' }),
    rateStar: (d) => { ui.sheet.stars = +d.v; ui.sheetAnim = false; render(); },
    rateSend: () => { DV.rateOrder(ui.sheet.o, ui.sheet.stars, ui.sheet.comment); ui.sheet = null; DVUI.toast(T('rated'), '', '⭐'); render(); },
    markAll: () => DV.markRead('customer:' + me().id),
    notifTap: (d) => { if (d.link === 'renew') { const s = activeSubs()[0]; newWizard(null, s && s.id); go('wizard'); } },
    invoiceSheet: (d) => openSheet({ type: 'invoice', id: d.id }),
    faq: (d) => { ui.faqOpen = ui.faqOpen === +d.i ? null : +d.i; render(); },
    savePersonal: () => { DV.updateCustomer(me().id, { name: $app.querySelector('#f-name').value.trim(), email: $app.querySelector('#f-email').value.trim() }); DVUI.toast(T('saved'), '', '✅'); A.pageBack(); },
    prefAllergy: (d) => { const p = ui.prefDraft; p.allergies = p.allergies.includes(d.k) ? p.allergies.filter((x) => x !== d.k) : p.allergies.concat(d.k); render(); },
    prefGoal: (d) => { ui.prefDraft.goal = d.g; render(); },
    savePrefs: () => { DV.updateCustomer(me().id, ui.prefDraft); DVUI.toast(T('saved'), '', '✅'); A.pageBack(); },
    saveAddress: () => { const a = ui.addrDraft; if (a.street.trim().length < 3) return DVUI.toast(T('street'), '✕', '⚠️'); DV.updateCustomer(me().id, { addresses: me().addresses.concat([{ id: DV.uid('a'), labelKey: a.labelKey === 'work' ? 'work' : 'home', label: a.labelKey === 'work' ? T('work') : T('home'), street: a.street, zip: a.zip, city: a.city, notes: a.notes }]) }); DVUI.toast(T('saved'), '', '📍'); A.pageBack(); },
    notifPref: (d, el) => { const np = Object.assign({}, me().notifPrefs, { [d.k]: el.checked }); DV.updateCustomer(me().id, { notifPrefs: np }); },
    logout: () => { DV.session('customer', null); ses = null; ui.sheet = null; ui.wiz = null; ui.view = 'login'; ui.tab = 'home'; render(); },
    resetDemo: () => { if (confirm('Reset demo data?')) { DV.reset(); DV.session('customer', null); ses = null; ui.sheet = null; ui.wiz = null; ui.view = 'login'; render(); } }
  };

  $app.addEventListener('click', (e) => {
    if (e.target.closest('[data-stop]')) return;
    const el = e.target.closest('[data-a]'); if (!el || !el.dataset.a) return;
    if (el.tagName === 'INPUT' && el.type === 'checkbox') { A[el.dataset.a] && A[el.dataset.a](el.dataset, el); return; }
    const fn = A[el.dataset.a]; if (!fn) return;
    e.preventDefault(); e.stopPropagation();
    fn(el.dataset, el, e);
  });
  $app.addEventListener('input', (e) => {
    const el = e.target; if (!el.dataset || !el.dataset.m) return;
    let v = el.value;
    if (el.dataset.fmt === 'card') { v = v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); el.value = v; }
    if (el.dataset.fmt === 'exp') { v = v.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); el.value = v; }
    if (el.dataset.fmt === 'cvc') { v = v.replace(/\D/g, '').slice(0, 4); el.value = v; }
    setPath(el.dataset.m, v);
    if (ui.view === 'wizard') { // refresh CTA enabled state without full re-render
      const btn = $app.querySelector('[data-a="wizNext"],[data-a="payNow"]'); if (btn) btn.disabled = !wValid();
    }
  });
  $app.addEventListener('change', (e) => { const el = e.target; if (el.dataset && el.dataset.m) { setPath(el.dataset.m, el.value); if (el.dataset.r) render(); } });
  $app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && ui.view === 'login' && ui.login.step === 'phone') A.sendCode(); });

  // ================= render =================
  let bannerTimer = null;
  // clear language switch outside the phone frame (hidden on real phones, where the in-app one is used)
  const langFloat = document.createElement('div');
  langFloat.className = 'lang-float';
  langFloat.innerHTML = [['ar', 'العربية'], ['nl', 'Nederlands'], ['en', 'English']].map(([id, l]) => `<button data-l="${id}">${l}</button>`).join('');
  langFloat.addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b && b.dataset.l !== lang) A.setLang({ l: b.dataset.l }); });
  document.body.appendChild(langFloat);

  function render() {
    langFloat.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', b.dataset.l === lang));
    const scrolls = {};
    $app.querySelectorAll('[data-scroll]').forEach((el) => { scrolls[el.dataset.scroll] = [el.scrollTop, el.scrollLeft]; });
    document.documentElement.lang = lang; document.documentElement.dir = I18N[lang].dir;
    document.body.classList.toggle('lat', lang !== 'ar');
    const info = document.querySelector('.stage-info'); const il = lang === 'ar' ? 'ar' : 'en';
    if (info && window.DV_INFO && info.dataset.l !== il) { info.innerHTML = DV_INFO[il]; info.dataset.l = il; info.dir = il === 'ar' ? 'rtl' : 'ltr'; }
    let html;
    if (!me() && !['onboarding', 'login'].includes(ui.view)) ui.view = 'login';
    if (ui.view === 'onboarding') html = vOnboarding();
    else if (ui.view === 'login') html = vLogin();
    else if (ui.view === 'wizard' && ui.wiz) html = vWizard();
    else if (ui.view === 'success') html = vSuccess();
    else if (ui.view === 'page') html = vPage();
    else { ui.view = 'tabs'; html = vTabs(); }
    $app.innerHTML = html + vSheet();
    if (!ui.resetScroll) $app.querySelectorAll('[data-scroll]').forEach((el) => { const s = scrolls[el.dataset.scroll]; if (s) { el.scrollTop = s[0]; el.scrollLeft = s[1]; } });
    else { const sel = $app.querySelector('.day-strip .dchip.sel'); sel && sel.scrollIntoView({ inline: 'center', block: 'nearest' }); }
    ui.resetScroll = false; ui.anim = null; ui.sheetAnim = false;
    DVUI.statusbarColor(ui.view === 'onboarding' ? '#fff' : '#0E1512');
    setupBanners();
  }
  function setupBanners() {
    clearInterval(bannerTimer);
    const track = $app.querySelector('[data-banners]'); if (!track) return;
    const n = track.children.length; if (n < 2) return;
    const dots = $app.querySelectorAll('.banners .dots i');
    track.addEventListener('scroll', () => {
      const w = track.clientWidth; const i = Math.round(Math.abs(track.scrollLeft) / (w * 0.88));
      ui.bannerIdx = Math.min(n - 1, i); dots.forEach((d, j) => d.classList.toggle('on', j === ui.bannerIdx));
    }, { passive: true });
    const show = (i, smooth) => { const el = track.children[i]; if (!el) return; const dir = I18N[lang].dir === 'rtl' ? -1 : 1; track.scrollTo({ left: dir * (el.offsetWidth + 12) * i, behavior: smooth ? 'smooth' : 'auto' }); };
    show(ui.bannerIdx % n, false);
    bannerTimer = setInterval(() => { if (ui.sheet || ui.view !== 'tabs' || ui.tab !== 'home') return; show((ui.bannerIdx + 1) % n, true); }, 4200);
  }

  // live sync with other apps
  DV.on((s, meta) => { if (meta.remote) { if (ses && !DV.customer(ses.cid)) { ses = null; ui.view = 'login'; } render(); } });
  const markSeen = DVUI.watchInbox(() => 'customer:' + (ses ? ses.cid : '-'), (n) => {
    if (!ses || n.to !== 'customer:' + ses.cid) return;
    DVUI.island(Lx(n.title), Lx(n.body), n.icon); DVUI.beep(); DVUI.vibrate([20, 40, 20]);
  });
  setInterval(() => { DV.housekeeping(); }, 60000);

  render();
})();
