/* Delyvo admin — boot: login, navigation, router, global search, notifications bell. */
(function () {
  const A = window.ADM;
  const { esc, L, toast } = A;

  // ---------------------------------------------------------------- navigation order
  A.sections._g_ops = { group: 'التشغيل' };
  A.sections._g_cat = { group: 'الكتالوج والمبيعات' };
  A.sections._g_sys = { group: 'النظام' };
  A.order = ['dashboard', '_g_ops', 'operations', 'drivers', 'subscriptions', 'customers', 'reviews',
    '_g_cat', 'restaurants', 'meals', 'plans', 'marketing', '_g_sys', 'settings'];
  const ROUTES = A.order.filter((k) => !A.sections[k].group);

  function routeFromHash() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return ROUTES.includes(h) ? h : 'dashboard';
  }
  window.addEventListener('hashchange', () => {
    const r = routeFromHash();
    if (r !== A.ui.route) { A.ui.route = r; A.ui.sel.clear(); window.scrollTo(0, 0); }
    document.body.classList.remove('nav-open');
    A.render();
  });
  A.act['nav-open'] = () => document.body.classList.add('nav-open');
  A.act['nav-close'] = () => document.body.classList.remove('nav-open');
  document.getElementById('sb-nav').addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });

  // ---------------------------------------------------------------- login
  const loginEl = document.getElementById('login');
  const shellEl = document.getElementById('shell');
  function showLogin() {
    A.authed = false; shellEl.hidden = true; loginEl.hidden = false;
    setTimeout(() => loginEl.querySelector('input').focus(), 50);
  }
  let inboxWired = false;
  function showApp() {
    A.authed = true; loginEl.hidden = true; shellEl.hidden = false;
    A.ui.route = routeFromHash();
    A.render();
    if (!inboxWired) {
      inboxWired = true;
      DVUI.watchInbox(() => 'admin', (n) => { if (!A.authed || A.localIds.has(n.id)) return; toast(L(n.title), L(n.body), n.icon || '🔔'); DVUI.beep(); });
    }
  }
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = e.target.elements.pw.value.trim();
    if (pw !== 'admin') {
      const err = document.getElementById('login-err'); err.hidden = false;
      e.target.classList.remove('shake'); void e.target.offsetWidth; e.target.classList.add('shake');
      return;
    }
    DV.session('admin', { ok: true, at: Date.now() });
    e.target.reset();
    showApp();
  });
  A.act.logout = () => {
    if (!confirm('تسجيل الخروج من لوحة الأدمن؟')) return;
    DV.session('admin', null); A.closeDrawer(); showLogin();
  };

  // ---------------------------------------------------------------- reset demo
  A.act['reset-demo'] = () => {
    if (!confirm('إعادة ضبط كل البيانات التجريبية؟\nسيتم مسح كل التعديلات والطلبات في كل التطبيقات المفتوحة.')) return;
    A.ui.sel.clear(); A.ui.drafts = {}; A.closeDrawer();
    DV.reset();
    toast('تمت إعادة ضبط البيانات', 'كل التطبيقات متزامنة الآن', '↺');
  };

  // ---------------------------------------------------------------- notifications bell
  const pop = document.getElementById('bell-pop');
  A.act.bell = (el, e) => {
    if (e) e.stopImmediatePropagation();
    pop.hidden = !pop.hidden;
    if (!pop.hidden) { window.scrollTo({ top: 0, behavior: 'smooth' }); A.renderBell(); }
  };
  A.act['bell-read-all'] = (el, e) => { e.stopImmediatePropagation(); DV.markRead('admin'); };
  A.act['bell-item'] = (el, e) => {
    e.stopImmediatePropagation();
    const n = DV.notificationsFor('admin').find((x) => x.id === el.dataset.id);
    if (n && !n.read) DV.markRead('admin', n.id);
    // jump to something useful when the title references a code
    const txt = L(n && n.title) + ' ' + L(n && n.body);
    const sub = txt.match(/SUB-\d+/); const ord = txt.match(/DV\d+/);
    if (sub) { const s = DV.state.subscriptions.find((x) => x.code === sub[0]); if (s) { pop.hidden = true; A.openDrawer('sub', s.id); } }
    else if (ord) { const o = DV.state.orders.find((x) => x.no === ord[0]); if (o) { pop.hidden = true; A.act['goto-order']({ dataset: { id: o.id } }); } }
  };
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !e.target.closest('.bell-wrap')) pop.hidden = true;
    if (!gsRes.hidden && !e.target.closest('#gsearch')) gsRes.hidden = true;
  });

  // ---------------------------------------------------------------- global search
  const gsIn = document.getElementById('gs-input');
  const gsRes = document.getElementById('gs-results');
  let gsIdx = -1;
  function searchAll(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const qn = q.replace(/[\s+-]/g, '');
    const s = DV.state, out = [];
    s.customers.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (qn.length > 3 && (c.phone || '').replace(/[\s+-]/g, '').includes(qn)))
        out.push({ kind: 'customer', id: c.id, icon: '👤', t: c.name, sub: `${c.phone} · ${(c.addresses[0] || {}).city || ''}` });
    });
    s.subscriptions.forEach((sb) => {
      const c = DV.customer(sb.customerId) || {};
      if (sb.code.toLowerCase().includes(q)) out.push({ kind: 'sub', id: sb.id, icon: '🔁', t: sb.code, sub: `${c.name} · ${L((DV.planType(sb.planType) || {}).name)} · ${sb.daysCount} يوم` });
    });
    s.orders.forEach((o) => {
      if (o.no.toLowerCase().includes(q)) { const c = DV.customer(o.customerId) || {}; out.push({ kind: 'order', id: o.id, icon: '📦', t: o.no, sub: `${c.name} · ${DV.fmtDate(o.date, 'ar', { day: 'numeric', month: 'short' })} · ${DV.STATUS[o.status].ar}` }); }
    });
    s.meals.forEach((m) => { if (['ar', 'nl', 'en'].some((l) => DV.L(m.name, l).toLowerCase().includes(q))) out.push({ kind: 'meal', id: m.id, icon: '🍽️', t: L(m.name), sub: (DV.restaurant(m.restaurantId) || {}).name }); });
    s.restaurants.forEach((r) => { if (r.name.toLowerCase().includes(q)) out.push({ kind: 'restaurant', id: r.id, icon: '🍳', t: r.name, sub: r.cuisine + ' · ' + r.city }); });
    return out.slice(0, 14);
  }
  const KIND = { customer: 'عميل', sub: 'اشتراك', order: 'طلب', meal: 'وجبة', restaurant: 'مطعم' };
  function renderSearch() {
    const res = searchAll(gsIn.value);
    gsIdx = res.length ? 0 : -1;
    if (gsIn.value.trim().length < 2) { gsRes.hidden = true; return; }
    gsRes.hidden = false;
    gsRes.innerHTML = res.length ? res.map((r, i) => `<button class="gs-i ${i === 0 ? 'on' : ''}" data-kind="${r.kind}" data-id="${r.id}"><span class="gs-ic">${r.icon}</span><span class="grow"><b>${esc(r.t)}</b><small>${esc(r.sub || '')}</small></span><span class="chip xs">${KIND[r.kind]}</span></button>`).join('')
      : `<div class="gs-empty">لا توجد نتائج لـ “${esc(gsIn.value)}”</div>`;
  }
  function openResult(kind, id) {
    gsRes.hidden = true; gsIn.value = ''; gsIn.blur();
    if (kind === 'customer') A.openDrawer('customer', id);
    else if (kind === 'sub') A.openDrawer('sub', id);
    else if (kind === 'order') A.act['goto-order']({ dataset: { id } });
    else if (kind === 'meal') { A.ui.mealF = { restaurant: '', plan: '', slot: '', active: '', q: L(DV.meal(id).name) }; A.go('meals'); }
    else if (kind === 'restaurant') A.go('restaurants');
  }
  gsIn.addEventListener('input', renderSearch);
  gsIn.addEventListener('focus', () => { if (gsIn.value.trim().length >= 2) renderSearch(); });
  gsIn.addEventListener('keydown', (e) => {
    const items = [...gsRes.querySelectorAll('.gs-i')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      gsIdx = (gsIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((b, i) => b.classList.toggle('on', i === gsIdx)); items[gsIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault(); const b = items[gsIdx]; if (b) openResult(b.dataset.kind, b.dataset.id);
    } else if (e.key === 'Escape') { gsRes.hidden = true; gsIn.blur(); }
  });
  gsRes.addEventListener('click', (e) => { const b = e.target.closest('.gs-i'); if (b) openResult(b.dataset.kind, b.dataset.id); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && A.authed && !e.target.closest('input, textarea, select')) { e.preventDefault(); gsIn.focus(); }
    if (e.key === 'Escape' && A.ui.drawer && !document.querySelector('.modal-ov')) A.closeDrawer();
  });

  // ---------------------------------------------------------------- live sync
  DV.on(() => A.schedule());
  setInterval(() => { try { DV.housekeeping(); } catch (e) {} if (A.authed && A.ui.route === 'dashboard') A.schedule(); }, 60000);

  // ---------------------------------------------------------------- boot
  const ses = DV.session('admin');
  if (ses && ses.ok) showApp(); else showLogin();
})();
