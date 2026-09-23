/* Delyvo admin — core: helpers, charts, modal/drawer infrastructure, render loop, event delegation.
   Sections register themselves on window.ADM.sections; click handlers on ADM.act (data-action),
   change handlers on ADM.chg (data-change), input handlers on ADM.inp (data-input). */
(function () {
  const A = window.ADM = { sections: {}, order: [], act: {}, chg: {}, inp: {}, drawers: {} };

  // ---------------------------------------------------------------- helpers
  const esc = DV.esc;
  const L = (v) => DV.L(v, 'ar');
  const money = (n) => `<span class="num">${esc(DV.money(n, 'ar'))}</span>`;
  const num = (n, d = 0) => `<span class="num">${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}</span>`;
  const sum = (arr, f) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
  const fdate = (iso, opts) => esc(DV.fmtDate(iso, 'ar', opts || { weekday: 'short', day: 'numeric', month: 'short' }));
  const fdateLong = (iso) => esc(DV.fmtDate(iso, 'ar'));
  const ftime = (ts) => `<span class="num">${esc(DV.fmtTime(ts, 'ar'))}</span>`;
  const fts = (ts) => `${fdate(DV.toISO(new Date(ts)), { day: 'numeric', month: 'short' })} ${ftime(ts)}`;
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return `قبل <span class="num">${m}</span> د`;
    const h = Math.round(m / 60);
    if (h < 24) return `قبل <span class="num">${h}</span> س`;
    return `قبل <span class="num">${Math.round(h / 24)}</span> يوم`;
  }
  function pill(status) {
    const s = DV.STATUS[status]; if (!s) return '';
    return `<span class="status-pill" style="color:${s.color};background:${s.color}17">${esc(s.ar)}</span>`;
  }
  function stars(n) {
    n = Math.round(n || 0);
    return `<span class="stars" title="${n}/5">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  }
  const windowLabel = (id) => { const w = DV.state.settings.deliveryWindows.find((x) => x.id === id); return w ? L(w.label) : id || '—'; };
  const slotLabel = (sl) => DV.SLOTS[sl] ? `${DV.SLOTS[sl].icon} ${DV.SLOTS[sl].ar}` : sl;
  const PAY = { ideal: 'iDEAL', card: 'بطاقة', applepay: 'Apple Pay', paypal: 'PayPal', klarna: 'Klarna', cash: 'نقداً', wallet: 'المحفظة' };
  const payLabel = (m) => PAY[m] || m || '—';
  const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const SUB_STATUS = { active: ['فعّال', 'chip-brand'], completed: ['مكتمل', ''], cancelled: ['ملغي', 'chip-danger'], paused: ['موقوف', 'chip-warn'] };
  const subChip = (st) => { const x = SUB_STATUS[st] || [st, '']; return `<span class="chip ${x[1]}">${esc(x[0])}</span>`; };
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const avatar = (name, color) => `<span class="avatar" style="${color ? `background:${color}1f;color:${color}` : ''}">${esc(initials(name))}</span>`;
  /** Push a notification inside a DV.commit callback (never call DV actions inside commit — they re-commit). */
  const localIds = new Set();
  function note(s, to, n) {
    const id = DV.uid('n'); if (to === 'admin') localIds.add(id);
    s.notifications.unshift({ id, to, title: n.title, body: n.body || '', icon: n.icon || '🔔', key: null, link: n.link || null, at: Date.now(), read: false });
  }
  const opt = (value, label, sel) => `<option value="${esc(value)}"${String(sel) === String(value) ? ' selected' : ''}>${esc(label)}</option>`;
  const empty = (icon, title, sub) => `<div class="empty"><div class="e-ic">${icon}</div><b>${esc(title)}</b>${sub ? `<p class="small">${esc(sub)}</p>` : ''}</div>`;
  const toast = (t, b, i) => DVUI.toast(t, b, i);
  const round2 = (n) => Math.round(n * 100) / 100;

  // ---------------------------------------------------------------- charts (inline SVG / HTML)
  /** Area/line chart. points: [{label, value}] — time flows left → right. */
  function lineChart(points, { height = 220, color = '#1FA06B', fmt = (v) => v } = {}) {
    const W = 640, H = height, pl = 46, pr = 12, pt = 14, pb = 28;
    const max = Math.max(1, ...points.map((p) => p.value));
    const nice = niceMax(max);
    const iw = W - pl - pr, ih = H - pt - pb;
    const x = (i) => pl + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
    const y = (v) => pt + ih - (v / nice) * ih;
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(1)},${pt + ih} L${x(0).toFixed(1)},${pt + ih} Z`;
    let grid = '';
    for (let k = 0; k <= 4; k++) {
      const v = (nice / 4) * k, yy = y(v);
      grid += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${pl - 8}" y="${yy + 4}" text-anchor="end" class="ch-lbl">${esc(fmt(v))}</text>`;
    }
    const step = Math.ceil(points.length / 7);
    const labels = points.map((p, i) => (i % step === 0 || i === points.length - 1) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="ch-lbl">${esc(p.label)}</text>` : '').join('');
    const dots = points.map((p, i) => `<g class="ch-pt"><circle cx="${x(i)}" cy="${y(p.value)}" r="9" fill="transparent"/><circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/><title>${esc(p.label)}: ${esc(fmt(p.value))}</title></g>`).join('');
    const gid = 'g' + Math.random().toString(36).slice(2, 7);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" dir="ltr" role="img">
      <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
  }
  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  /** Horizontal bars (HTML). items: [{label, value, color, sub}] */
  function hbars(items, { fmt = (v) => v } = {}) {
    if (!items.length) return empty('📭', 'لا توجد بيانات');
    const max = Math.max(1, ...items.map((i) => i.value));
    return `<div class="hbars">${items.map((i) => `
      <div class="hb-row">
        <div class="hb-lbl ellipsis">${i.dot ? `<i class="dot" style="background:${i.color}"></i>` : ''}${esc(i.label)}${i.sub ? `<small class="muted"> · ${i.sub}</small>` : ''}</div>
        <div class="hb-track"><div class="hb-fill" style="width:${Math.max(2, (i.value / max) * 100)}%;background:${i.color || 'var(--brand)'}"></div></div>
        <div class="hb-val num">${esc(fmt(i.value))}</div>
      </div>`).join('')}</div>`;
  }
  /** Donut (SVG) + legend. items: [{label, value, color}] */
  function donut(items, { center = '', centerSub = '' } = {}) {
    const total = sum(items, (i) => i.value);
    const R = 54, C = 2 * Math.PI * R;
    let off = 0;
    const segs = total ? items.filter((i) => i.value).map((i) => {
      const len = (i.value / total) * C;
      const s = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${i.color}" stroke-width="18" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${esc(i.label)}: ${i.value}</title></circle>`;
      off += len; return s;
    }).join('') : '';
    return `<div class="donut">
      <svg viewBox="0 0 140 140" width="150" height="150"><g transform="rotate(-90 70 70)"><circle r="${R}" cx="70" cy="70" fill="none" stroke="#EEF2EF" stroke-width="18"/>${segs}</g>
        <text x="70" y="68" text-anchor="middle" class="dn-c num">${esc(center)}</text><text x="70" y="88" text-anchor="middle" class="dn-s">${esc(centerSub)}</text></svg>
      <ul class="dn-legend">${items.map((i) => `<li><i class="dot" style="background:${i.color}"></i><span class="grow">${esc(i.label)}</span><b class="num">${i.value}</b><small class="muted num">${total ? Math.round((i.value / total) * 100) : 0}%</small></li>`).join('')}</ul>
    </div>`;
  }
  const bar = (pct, color) => `<div class="pbar"><i style="width:${Math.max(0, Math.min(100, pct))}%;${color ? `background:${color}` : ''}"></i></div>`;

  // ---------------------------------------------------------------- UI state
  A.ui = {
    route: 'dashboard',
    opsDate: DV.today(),
    opsF: { restaurant: '', status: '', driver: '', city: '', slot: '', q: '' },
    opsGroup: 'none',
    sel: new Set(),
    highlight: null,
    subF: { status: 'active', plan: '', q: '' },
    custF: { q: '', city: '' },
    mealF: { restaurant: '', plan: '', slot: '', active: '', q: '' },
    revF: { stars: '', restaurant: '' },
    drafts: {},
    drawer: null
  };

  // ---------------------------------------------------------------- modal
  const modalRoot = () => document.getElementById('modal-root');
  /** Open a modal. body = inner form HTML. onSave(form) → return false to keep open. onInput(form) for live previews. */
  A.modal = function ({ title, body, wide, saveLabel = 'حفظ', onSave, onInput, onOpen, danger, cancelLabel = 'إلغاء' }) {
    const ov = document.createElement('div');
    ov.className = 'modal-ov';
    ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <header class="modal-h"><h3>${esc(title)}</h3><button type="button" class="icon-btn sm" data-x aria-label="إغلاق">✕</button></header>
      <form class="modal-b" novalidate>${body}</form>
      <footer class="modal-f">
        ${danger ? `<button type="button" class="btn btn-danger btn-sm" data-danger>${esc(danger.label)}</button>` : ''}
        <div class="grow"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-x>${esc(cancelLabel)}</button>
        ${onSave ? `<button type="submit" class="btn btn-primary btn-sm" data-save>${esc(saveLabel)}</button>` : ''}
      </footer></div>`;
    const form = ov.querySelector('form');
    const close = () => { ov.classList.add('out'); document.removeEventListener('keydown', onKey); setTimeout(() => ov.remove(), 180); };
    const onKey = (e) => { if (e.key === 'Escape' && modalRoot().lastElementChild === ov) close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    ov.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', close));
    const save = (e) => { e && e.preventDefault(); if (!onSave) return; const r = onSave(form, ov); if (r !== false) close(); };
    form.addEventListener('submit', save);
    ov.querySelector('[data-save]') && ov.querySelector('[data-save]').addEventListener('click', save);
    if (danger) ov.querySelector('[data-danger]').addEventListener('click', () => { if (danger.onClick(form) !== false) close(); });
    if (onInput) { form.addEventListener('input', () => onInput(form)); form.addEventListener('change', () => onInput(form)); }
    modalRoot().appendChild(ov);
    if (onOpen) onOpen(form, ov);
    if (onInput) onInput(form);
    const first = form.querySelector('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea');
    if (first) setTimeout(() => first.focus(), 60);
    return { el: ov, form, close };
  };
  /** Form helpers */
  A.fv = (form, name) => { const el = form.elements[name]; return el ? String(el.value).trim() : ''; };
  A.fn = (form, name) => { const v = parseFloat(String(A.fv(form, name)).replace(',', '.')); return isNaN(v) ? 0 : v; };
  A.fchecks = (form, name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
  A.fbool = (form, name) => !!(form.elements[name] && form.elements[name].checked);
  /** Invalid-field feedback */
  A.invalid = (form, name, msg) => {
    const el = form.elements[name]; if (el && el.classList) { el.classList.add('is-bad'); el.focus(); setTimeout(() => el.classList.remove('is-bad'), 1600); }
    toast(msg || 'أكمل الحقول المطلوبة', '', '⚠️'); return false;
  };
  const field = (label, inner, cls = '') => `<label class="field ${cls}"><span>${esc(label)}</span>${inner}</label>`;
  const inp = (name, value, attrs = '') => `<input ${/class=/.test(attrs) ? '' : 'class="input"'} name="${name}" value="${esc(value ?? '')}" ${attrs}>`;
  const trio = (label, name, obj, attrs = '') => `<div class="trio"><div class="trio-l">${esc(label)}</div>
    <div class="trio-g">
      <label class="field"><span>عربي</span><input class="input" name="${name}_ar" value="${esc((obj || {}).ar || '')}" dir="rtl" ${attrs}></label>
      <label class="field"><span>Nederlands</span><input class="input lat" name="${name}_nl" value="${esc((obj || {}).nl || '')}" dir="ltr" ${attrs}></label>
      <label class="field"><span>English</span><input class="input lat" name="${name}_en" value="${esc((obj || {}).en || '')}" dir="ltr" ${attrs}></label>
    </div></div>`;
  const trioArea = (label, name, obj) => `<div class="trio"><div class="trio-l">${esc(label)}</div>
    <div class="trio-g">
      <label class="field"><span>عربي</span><textarea class="textarea" name="${name}_ar" rows="2" dir="rtl">${esc((obj || {}).ar || '')}</textarea></label>
      <label class="field"><span>Nederlands</span><textarea class="textarea lat" name="${name}_nl" rows="2" dir="ltr">${esc((obj || {}).nl || '')}</textarea></label>
      <label class="field"><span>English</span><textarea class="textarea lat" name="${name}_en" rows="2" dir="ltr">${esc((obj || {}).en || '')}</textarea></label>
    </div></div>`;
  const readTrio = (form, name) => {
    const ar = A.fv(form, name + '_ar'), nl = A.fv(form, name + '_nl'), en = A.fv(form, name + '_en');
    return { ar, nl: nl || en || ar, en: en || nl || ar };
  };
  const sw = (name, checked, attrs = '') => `<span class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} ${attrs}><i></i></span>`;
  const togChip = (name, value, label, checked) => `<label class="tchip"><input type="checkbox" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;

  // ---------------------------------------------------------------- drawer
  A.openDrawer = (kind, id) => { A.ui.drawer = { kind, id, fresh: true }; A.renderDrawer(); };
  A.closeDrawer = () => {
    const root = document.getElementById('drawer-root');
    const d = root.querySelector('.drawer'); A.ui.drawer = null;
    if (!d) { root.innerHTML = ''; return; }
    root.classList.add('closing');
    setTimeout(() => { if (!A.ui.drawer) root.innerHTML = ''; root.classList.remove('closing'); }, 200);
  };
  /** Re-render a region while keeping focus/caret on a [data-focus-key] field inside it. */
  function keepFocus(root, fn) {
    const a = document.activeElement;
    let fk = null, selS = 0, selE = 0;
    if (a && a.getAttribute && a.getAttribute('data-focus-key') && root.contains(a)) { fk = a.getAttribute('data-focus-key'); try { selS = a.selectionStart; selE = a.selectionEnd; } catch (e) {} }
    fn();
    if (fk) { const el = root.querySelector(`[data-focus-key="${fk}"]`); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(selS, selE); } catch (e) {} } }
  }
  A.renderDrawer = function () {
    const root = document.getElementById('drawer-root');
    const dr = A.ui.drawer;
    if (!dr) return;
    const fn = A.drawers[dr.kind];
    const html = fn ? fn(dr.id) : null;
    if (html == null) { A.ui.drawer = null; root.innerHTML = ''; return; }
    const prev = root.querySelector('.drawer-b');
    const scroll = prev ? prev.scrollTop : 0;
    keepFocus(root, () => { root.innerHTML = `<div class="drawer-ov" data-action="drawer-close"></div><aside class="drawer ${dr.fresh ? 'anim' : ''}" role="dialog">${html}</aside>`; });
    dr.fresh = false;
    const b = root.querySelector('.drawer-b'); if (b) b.scrollTop = scroll;
  };

  // ---------------------------------------------------------------- render loop
  let raf = 0, pending = false;
  function focusGuard() {
    // Don't re-render while the admin types into a field that would be destroyed (except live-filter fields, which we restore).
    const a = document.activeElement;
    if (!a || !a.matches) return false;
    if (!a.matches('input, textarea')) return false;
    if (a.type === 'checkbox' || a.type === 'radio') return false;
    if (a.closest('.modal-ov') || a.closest('.topbar')) return false;
    if (a.hasAttribute('data-focus-key')) return false;
    return !!(a.closest('#main') || a.closest('#drawer-root'));
  }
  A.schedule = function () {
    if (focusGuard()) { pending = true; return; }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => A.render());
  };
  document.addEventListener('focusout', () => {
    if (!pending) return;
    setTimeout(() => { if (pending && !focusGuard()) { pending = false; A.render(); } }, 30);
  });

  A.render = function () {
    if (!A.authed) return;
    pending = false;
    const main = document.getElementById('main');
    const sec = A.sections[A.ui.route] || A.sections.dashboard;
    keepFocus(main, () => {
      try { main.innerHTML = sec.render(); } catch (e) { console.error(e); main.innerHTML = `<div class="card pad">حدث خطأ في عرض هذا القسم: ${esc(e.message)}</div>`; }
    });
    if (sec.after) sec.after(main);
    A.renderNav();
    A.renderBell();
    A.renderDrawer();
    document.title = `${sec.title} · Delyvo Admin`;
  };

  // ---------------------------------------------------------------- nav & bell
  A.renderNav = function () {
    const nav = document.getElementById('sb-nav'); if (!nav) return;
    nav.innerHTML = A.order.map((k) => {
      const s = A.sections[k];
      if (s.group) return `<div class="sb-group tiny">${esc(s.group)}</div>`;
      const badge = s.badge ? s.badge() : '';
      return `<a href="#${k}" class="sb-link ${A.ui.route === k ? 'on' : ''}">${ICON[s.icon] || ''}<span class="grow">${esc(s.title)}</span>${badge ? `<b class="sb-badge num">${badge}</b>` : ''}</a>`;
    }).join('');
  };
  A.renderBell = function () {
    const list = DV.notificationsFor('admin');
    const unread = list.filter((n) => !n.read).length;
    const c = document.getElementById('bell-count');
    c.hidden = !unread; c.textContent = unread > 99 ? '99+' : unread;
    const pop = document.getElementById('bell-pop');
    if (pop.hidden) return;
    pop.innerHTML = `<div class="bp-h"><b>الإشعارات</b>${unread ? `<button class="btn btn-ghost btn-xs" data-action="bell-read-all">تعليم الكل كمقروء</button>` : ''}</div>
      <div class="bp-list">${list.length ? list.slice(0, 30).map((n) => `
        <button class="bp-item ${n.read ? '' : 'unread'}" data-action="bell-item" data-id="${n.id}">
          <span class="bp-ic">${esc(n.icon || '🔔')}</span>
          <span class="grow"><b>${esc(L(n.title))}</b><small>${esc(L(n.body))}</small><em class="tiny muted">${ago(n.at)}</em></span>
        </button>`).join('') : empty('🔕', 'لا توجد إشعارات')}</div>`;
  };

  // ---------------------------------------------------------------- icons
  const I = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = A.ICON = {
    home: I('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    ops: I('<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
    subs: I('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
    users: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    store: I('<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/><path d="M10 21v-5h4v5"/>'),
    meal: I('<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M12 3v3"/><path d="M8 5v2"/><path d="M16 5v2"/>'),
    tag: I('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    mega: I('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
    driver: I('<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 7.5"/><path d="M5.5 17.5 9 9h5l4.5 8.5"/>'),
    cog: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    star: I('<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    edit: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')
  };

  // ---------------------------------------------------------------- event delegation
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = A.act[el.dataset.action];
    if (fn) { if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && A.chg[el.dataset.change]) A.chg[el.dataset.change](el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && A.inp[el.dataset.input]) A.inp[el.dataset.input](el, e);
  });

  A.act['drawer-close'] = () => A.closeDrawer();
  A.go = (route) => { if (location.hash !== '#' + route) location.hash = route; else A.render(); };

  Object.assign(A, { localIds, esc, L, money, num, sum, fdate, fdateLong, ftime, fts, ago, pill, stars, windowLabel, slotLabel, payLabel, WEEKDAYS, subChip,
    avatar, note, opt, empty, toast, round2, lineChart, hbars, donut, bar, field, input: inp, trio, trioArea, readTrio, sw, togChip });
})();
