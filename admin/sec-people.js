/* Delyvo admin — Subscriptions, Customers, Drivers (+ detail drawers) */
(function () {
  const A = window.ADM;
  const { t, D, M, cutoffLabel, esc, L, money, num, sum, fdate, fdateLong, fts, pill, stars, windowLabel, slotLabel, payLabel, weekdayShort, subChip, avatar, opt, empty, toast, round2 } = A;

  const custName = (id) => (DV.customer(id) || {}).name || '—';
  const restName = (id) => (DV.restaurant(id) || {}).name || '—';
  const allergenLabel = (a) => `${(DV.ALLERGENS[a] || {}).icon || ''} ${DV.ALLERGENS[a] ? L(DV.ALLERGENS[a]) : a}`;

  /** Progress of a subscription: delivered days vs. total days */
  A.subProgress = function (sb) {
    const orders = DV.ordersFor({ subId: sb.id });
    const delivered = orders.filter((o) => o.status === 'delivered');
    const days = new Set(delivered.map((o) => o.date)).size;
    return { days, total: sb.daysCount, meals: delivered.length, totalMeals: (sb.pricing || {}).meals || orders.filter((o) => o.status !== 'cancelled').length };
  };
  const refunded = (sb) => sum(sb.refunds || [], (r) => r.amount);

  // =====================================================================================
  // SUBSCRIPTIONS
  // =====================================================================================
  A.sections.subscriptions = {
    get title() { return t('nav.subscriptions'); }, icon: 'subs',
    badge() { return DV.state.subscriptions.filter((x) => x.status === 'active').length || ''; },
    render() {
      const s = DV.state, f = A.ui.subF, q = f.q.trim().toLowerCase();
      const list = s.subscriptions.filter((sb) => (!f.status || sb.status === f.status) && (!f.plan || sb.planType === f.plan) &&
        (!q || sb.code.toLowerCase().includes(q) || custName(sb.customerId).toLowerCase().includes(q)))
        .sort((a, b) => (b.payment.paidAt || 0) - (a.payment.paidAt || 0));
      const cnt = (st) => s.subscriptions.filter((x) => !st || x.status === st).length;
      return `
      <div class="page-h"><div><h1>${esc(t('nav.subscriptions'))}</h1><p class="muted"><span class="num">${cnt('active')}</span> ${esc(t('subst.active'))} · <span class="num">${cnt('completed')}</span> ${esc(t('subst.completed'))} · <span class="num">${cnt('cancelled')}</span> ${esc(t('subst.cancelled'))}</p></div></div>
      <div class="toolbar card">
        <div class="tb-search"><input class="input sm" placeholder="${esc(t('sub.searchPh'))}" value="${esc(f.q)}" data-input="sub-q" data-focus-key="sub-q"></div>
        <div class="seg">${[['', t('common.all')], ['active', t('subst.active')], ['completed', t('subst.completed')], ['cancelled', t('subst.cancelled')]].map(([k, l]) => `<button class="${f.status === k ? 'on' : ''}" data-action="sub-status-f" data-v="${k}">${l} <span class="num muted">${cnt(k)}</span></button>`).join('')}</div>
        <select class="select sm" data-change="sub-plan-f">${opt('', t('f.allPlans'), f.plan)}${s.plans.types.map((p) => opt(p.id, `${p.icon} ${L(p.name)}`, f.plan)).join('')}</select>
        <div class="grow"></div><span class="muted small">${t('common.nResults', { n: `<span class="num">${list.length}</span>` })}</span>
      </div>
      <div class="card">${list.length ? `<div class="tbl-wrap"><table class="tbl hover"><thead><tr>
        ${['sub.th.code', 'sub.th.customer', 'sub.th.plan', 'sub.th.days', 'sub.th.meals', 'sub.th.start', 'sub.th.progress', 'sub.th.status', 'sub.th.paid', 'sub.th.payment'].map((k) => `<th>${esc(t(k))}</th>`).join('')}</tr></thead><tbody>
        ${list.map((sb) => { const p = DV.planType(sb.planType) || {}; const pr = A.subProgress(sb); const rf = refunded(sb); return `
          <tr data-action="open-sub" data-id="${sb.id}" class="clickable">
            <td><b class="num">${esc(sb.code)}</b></td>
            <td><div class="row">${avatar(custName(sb.customerId))}<span>${esc(custName(sb.customerId))}</span></div></td>
            <td><span class="chip" style="background:${p.color}1a;color:${p.color}">${p.icon || ''} ${esc(L(p.name))}</span></td>
            <td class="num">${sb.daysCount}</td>
            <td>${esc(L((DV.mealOption(sb.option) || {}).name))}</td>
            <td class="small">${fdate(sb.startDate)}</td>
            <td style="min-width:130px"><div class="row">${A.bar((pr.days / pr.total) * 100)}<span class="tiny num">${pr.days}/${pr.total}</span></div></td>
            <td>${subChip(sb.status)}${sb.postponed ? `<div class="tiny muted">${esc(t('sub.postponedN'))} <span class="num">${sb.postponed}</span></div>` : ''}</td>
            <td>${money((sb.pricing || {}).total)}${rf ? `<div class="tiny danger-t">${t('common.refundedAmt', { a: money(rf) })}</div>` : ''}</td>
            <td class="small">${esc(payLabel(sb.payment.method))}</td>
          </tr>`; }).join('')}
        </tbody></table></div>` : empty('🔁', t('sub.noMatch'))}</div>`;
    }
  };
  A.inp['sub-q'] = (el) => { A.ui.subF.q = el.value; A.render(); };
  A.act['sub-status-f'] = (el) => { A.ui.subF.status = el.dataset.v; A.render(); };
  A.chg['sub-plan-f'] = (el) => { A.ui.subF.plan = el.value; A.render(); };
  A.act['open-sub'] = (el) => A.openDrawer('sub', el.dataset.id);

  // ---- subscription drawer
  A.drawers.sub = function (id) {
    const sb = DV.sub(id); if (!sb) return null;
    const c = DV.customer(sb.customerId) || {};
    const p = DV.planType(sb.planType) || {};
    const pr = sb.pricing || {};
    const prog = A.subProgress(sb);
    const addr = (c.addresses || []).find((a) => a.id === sb.addressId) || (c.addresses || [])[0] || {};
    const td = DV.today();
    const rf = refunded(sb);
    const days = sb.days.slice().sort((a, b) => a.date.localeCompare(b.date));
    const orders = DV.ordersFor({ subId: sb.id });

    const dayRows = days.map((d) => {
      const locked = DV.isLocked(d.date);
      const isToday = d.date === td;
      const canEdit = sb.status === 'active' && d.status === 'active' && !locked;
      const slots = Object.keys(d.meals).map((sl) => {
        const m = DV.meal(d.meals[sl]);
        const o = orders.find((x) => x.date === d.date && x.slot === sl && (d.status !== 'active' || x.status !== 'cancelled'));
        const pool = DV.mealsFor(sb.planType, sl);
        if (m && !pool.find((x) => x.id === m.id)) pool.unshift(m);
        return `<div class="ds">
          <div class="ds-slot">${slotLabel(sl)}</div>
          <div class="ds-meal grow">${m ? `<div class="row">${`<img class="thumb" src="${esc(m.img)}" alt="" loading="lazy">`}<div class="grow"><b class="ellipsis">${esc(L(m.name))}</b><div class="tiny muted">${esc(restName(m.restaurantId))}${!DV.isSafe(m, c) ? ` · <span class="danger-t">⚠ ${esc(t('sub.hasAllergen'))}</span>` : ''}</div></div></div>` : `<span class="chip chip-warn xs">${esc(t('sub.notPicked'))}</span>`}
            ${d.auto && d.auto[sl] ? `<span class="chip xs chip-info">👨‍🍳 ${esc(t('common.chefPick'))}</span>` : ''}</div>
          <div class="ds-st">${o ? pill(o.status) : ''}</div>
          ${canEdit ? `<select class="select xs ds-sel" data-change="sub-meal" data-sub="${sb.id}" data-date="${d.date}" data-slot="${sl}">
              ${opt('', m ? t('sub.changeMeal') : t('sub.pickMeal'), '')}
              ${pool.map((x) => opt(x.id, `${DV.isSafe(x, c) ? '' : '⚠ '}${L(x.name)} — ${restName(x.restaurantId)}`, '')).join('')}
            </select>` : ''}
        </div>`;
      }).join('');
      return `<div class="day ${d.status !== 'active' ? 'day-off' : ''} ${isToday ? 'day-today' : ''}">
        <div class="day-h">
          <b>${fdate(d.date, { weekday: 'long', day: 'numeric', month: 'short' })}</b>
          ${isToday ? `<span class="chip xs chip-brand">${esc(t('common.today'))}</span>` : ''}
          ${d.status === 'postponed' ? `<span class="chip xs chip-warn">${esc(t('sub.postponed'))}</span>` : ''}
          ${d.movedFrom ? `<span class="chip xs">${esc(t('sub.movedFrom'))} ${fdate(d.movedFrom, { day: 'numeric', month: 'short' })}</span>` : ''}
          ${d.status === 'active' && locked && d.date > td ? `<span class="chip xs">🔒 ${esc(t('sub.locked'))}</span>` : ''}
          <div class="grow"></div>
          ${canEdit ? `<button class="btn btn-ghost btn-xs" data-action="sub-postpone" data-sub="${sb.id}" data-date="${d.date}">${esc(t('sub.postponeDay'))}</button>` : ''}
        </div>
        ${slots}
      </div>`;
    }).join('');

    return `
    <header class="drawer-h">
      <div class="grow"><div class="row"><h2 class="num">${esc(sb.code)}</h2>${subChip(sb.status)}</div>
        <p class="muted small"><button class="link" data-action="open-customer" data-id="${c.id}">${esc(c.name || '—')}</button> · ${esc(c.phone || '')}</p></div>
      <button class="icon-btn" data-action="drawer-close" aria-label="${esc(t('common.close'))}">✕</button>
    </header>
    <div class="drawer-b">
      <div class="dgrid">
        <div><small>${esc(t('sub.th.plan'))}</small><b>${p.icon || ''} ${esc(L(p.name))}</b></div>
        <div><small>${esc(t('sub.duration'))}</small><b>${t('common.nDays', { n: `<span class="num">${sb.daysCount}</span>` })} · ${esc(L((DV.mealOption(sb.option) || {}).name))}</b></div>
        <div><small>${esc(t('sub.th.start'))}</small><b>${fdate(sb.startDate)}</b></div>
        <div><small>${esc(t('ops.th.window'))}</small><b>${esc(windowLabel(sb.window))}</b></div>
        <div><small>${esc(t('set.weekdays'))}</small><b>${sb.weekdays.slice().sort().map((w) => esc(weekdayShort(w))).join(' ')}</b></div>
        <div><small>${esc(t('sub.address'))}</small><b class="lat">${esc([addr.street, addr.zip, addr.city].filter(Boolean).join(', ') || '—')}</b></div>
      </div>

      <div class="dsec">
        <div class="row between"><h4>${esc(t('sub.th.progress'))}</h4><span class="small muted">${t('sub.progLine', { d: `<span class="num">${prog.days}/${prog.total}</span>`, m: `<span class="num">${prog.meals}/${prog.totalMeals}</span>`, p: `<span class="num">${sb.postponed}/${DV.state.settings.maxPostpones}</span>` })}</span></div>
        ${A.bar((prog.days / prog.total) * 100)}
      </div>

      <div class="dsec">
        <h4>${esc(t('sub.th.payment'))}</h4>
        <div class="price-lines">
          <div><span>${t('sub.basePrice', { n: `<span class="num">${pr.meals || 0}</span>` })}</span><b>${money(pr.base)}</b></div>
          ${pr.durDisc ? `<div><span>${esc(t('sub.durDisc'))}</span><b>− ${money(pr.durDisc)}</b></div>` : ''}
          ${pr.optDisc ? `<div><span>${esc(t('sub.optDisc'))}</span><b>− ${money(pr.optDisc)}</b></div>` : ''}
          ${pr.deliveryFee ? `<div><span>${esc(t('sub.deliveryFee'))}</span><b>${money(pr.deliveryFee)}</b></div>` : ''}
          ${pr.promoDisc ? `<div><span>${esc(t('sub.promo'))} <span class="chip xs num">${esc(pr.promo)}</span></span><b>− ${money(pr.promoDisc)}</b></div>` : ''}
          <div class="pl-total"><span>${esc(t('sub.totalPaid'))}</span><b>${money(pr.total)}</b></div>
          <div class="muted tiny"><span>${t('sub.vatLine', { v: money(pr.vat), p: money(pr.perMeal) })}</span></div>
          ${(sb.refunds || []).map((r) => `<div class="danger-t"><span>${esc(t('sub.refund'))} ${esc(r.ref)} · ${fts(r.at)}</span><b>− ${money(r.amount)}</b></div>`).join('')}
        </div>
        <div class="row wrap small muted" style="margin-top:8px"><span class="chip">${esc(payLabel(sb.payment.method))}</span><span class="num">${esc(sb.payment.ref)}</span><span>· ${fts(sb.payment.paidAt)}</span></div>
      </div>

      <div class="dsec">
        <h4>${esc(t('sub.notes'))}</h4>
        ${sb.notes ? `<div class="note-i cust"><small>${esc(t('sub.custNote'))}</small>${esc(sb.notes)}</div>` : ''}
        ${(sb.adminNotes || []).map((n) => `<div class="note-i"><small>${fts(n.at)}</small>${esc(n.text)}</div>`).join('')}
        <div class="row"><input class="input sm grow" placeholder="${esc(t('sub.notePh'))}" value="${esc(A.ui.drafts['note:' + sb.id] || '')}" data-input="draft" data-k="note:${sb.id}" data-focus-key="note:${sb.id}"><button class="btn btn-dark btn-sm" data-action="sub-note" data-id="${sb.id}">${esc(t('common.add'))}</button></div>
      </div>

      <div class="dsec">
        <div class="row between"><h4>${esc(t('sub.schedule'))}</h4><span class="tiny muted">${+DV.state.settings.cutoffHour === 24 ? esc(t('sub.changeUntilMidnight')) : t('sub.changeUntil', { h: `<span class="num">${esc(cutoffLabel(DV.state.settings.cutoffHour))}</span>` })}</span></div>
        <div class="days">${dayRows}</div>
      </div>
    </div>
    <footer class="drawer-f">
      ${sb.status === 'active' ? `<button class="btn btn-danger btn-sm" data-action="sub-cancel" data-id="${sb.id}">${esc(t('sub.cancel'))}</button>` : ''}
      <button class="btn btn-outline btn-sm" data-action="sub-refund" data-id="${sb.id}" ${rf >= (pr.total || 0) ? 'disabled' : ''}>${esc(t('sub.refundDemo'))}</button>
      <div class="grow"></div>
      <button class="btn btn-ghost btn-sm" data-action="drawer-close">${esc(t('common.close'))}</button>
    </footer>`;
  };

  A.chg['sub-meal'] = (el) => {
    if (!el.value) return;
    const ok = DV.setDayMeal(el.dataset.sub, el.dataset.date, el.dataset.slot, el.value);
    if (!ok) { toast(t('sub.t.cantChange'), t('sub.t.dayLocked'), '🔒'); A.renderDrawer(); return; }
    const sb = DV.sub(el.dataset.sub);
    DV.notify('customer:' + sb.customerId, { icon: '🍽️', title: { ar: 'تم تعديل وجبتك', nl: 'Je maaltijd is aangepast', en: 'Your meal was updated' },
      body: { ar: `${DV.L(DV.meal(el.value).name, 'ar')} · ${DV.fmtDate(el.dataset.date, 'ar')}`, nl: `${DV.L(DV.meal(el.value).name, 'nl')} · ${DV.fmtDate(el.dataset.date, 'nl')}`, en: `${DV.L(DV.meal(el.value).name, 'en')} · ${DV.fmtDate(el.dataset.date, 'en')}` } });
    toast(t('sub.t.mealChanged'), `${L(DV.meal(el.value).name)} · ${D(el.dataset.date)}`, '🍽️');
  };
  A.act['sub-postpone'] = (el) => {
    if (!confirm(t('sub.postponeConfirm', { d: D(el.dataset.date) }))) return;
    const r = DV.postponeDay(el.dataset.sub, el.dataset.date);
    if (r.ok) toast(t('sub.t.postponed'), t('sub.t.newDay', { d: D(r.newDate) }), '📅');
    else toast(t('sub.t.postponeFail'), t(r.reason === 'locked' ? 'sub.t.locked' : r.reason === 'limit' ? 'sub.t.limit' : 'sub.t.noDay'), '⚠️');
  };
  A.act['sub-note'] = (el) => {
    const k = 'note:' + el.dataset.id; const text = (A.ui.drafts[k] || '').trim();
    if (!text) return toast(t('sub.t.noteFirst'), '', '⚠️');
    delete A.ui.drafts[k];
    DV.commit((s) => { const sb = s.subscriptions.find((x) => x.id === el.dataset.id); (sb.adminNotes = sb.adminNotes || []).push({ text, at: Date.now(), by: 'admin' }); });
    toast(t('sub.t.noteAdded'), '', '📝');
  };
  A.act['sub-cancel'] = (el) => {
    const sb = DV.sub(el.dataset.id);
    if (!confirm(t('sub.cancelConfirm', { code: sb.code }))) return;
    const n = DV.commit((s) => {
      const x = s.subscriptions.find((y) => y.id === sb.id); const td = DV.today();
      x.status = 'cancelled'; x.cancelledAt = Date.now();
      let k = 0; const perR = {};
      s.orders.forEach((o) => {
        if (o.subId === x.id && o.date > td && ['scheduled', 'accepted'].includes(o.status)) {
          o.status = 'cancelled'; o.history.push({ s: 'cancelled', at: Date.now(), by: 'admin', note: 'subscription cancelled' }); k++;
          if (o.restaurantId) perR[o.restaurantId] = (perR[o.restaurantId] || 0) + 1;
        }
      });
      Object.entries(perR).forEach(([rid, c]) => A.note(s, 'restaurant:' + rid, { icon: '🚫', title: `إلغاء ${c} طلب`, body: `اشتراك ${x.code} أُلغي من الإدارة` }));
      A.note(s, 'customer:' + x.customerId, { icon: '🚫', title: { ar: 'تم إلغاء اشتراكك', nl: 'Je abonnement is geannuleerd', en: 'Your plan was cancelled' }, body: { ar: `${x.code} — تواصل معنا لأي استفسار`, nl: `${x.code} — neem contact op bij vragen`, en: `${x.code} — contact us with any questions` } });
      A.note(s, 'admin', { icon: '🚫', title: `إلغاء اشتراك ${x.code}`, body: `${k} طلب قادم أُلغي` });
      return k;
    });
    toast(t('sub.t.cancelled'), t('sub.t.nCancelled', { n }), '🚫');
  };
  A.act['sub-refund'] = (el) => {
    const sb = DV.sub(el.dataset.id); const pr = sb.pricing || {};
    const delivered = DV.ordersFor({ subId: sb.id, statuses: ['delivered', 'picked', 'on_way', 'ready', 'preparing'] }).length;
    const remaining = Math.max(0, round2((pr.meals - delivered) * pr.perMeal - refunded(sb)));
    const max = round2((pr.total || 0) - refunded(sb));
    A.modal({
      title: `${t('sub.refundTitle')} — ${sb.code}`, saveLabel: t('sub.refundDo'),
      body: `<p class="small muted">${esc(t('sub.refundNote'))}</p>
        <div class="grid2">${A.field(t('sub.amount'), A.input('amount', Math.min(remaining, max).toFixed(2), 'type="number" step="0.01" min="0" class="input num"'))}
        ${A.field(t('sub.reason'), `<select class="select" name="reason">${['cancel', 'missing', 'quality', 'goodwill', 'other'].map((r) => opt(t('sub.rr.' + r), t('sub.rr.' + r), '')).join('')}</select>`)}</div>
        <p class="tiny muted">${t('sub.refundMax', { m: money(max), r: money(remaining) })}</p>`,
      onSave(form) {
        const amount = round2(A.fn(form, 'amount'));
        if (!(amount > 0) || amount > max + 0.001) return A.invalid(form, 'amount', t('sub.t.badAmount'));
        const reason = A.fv(form, 'reason');
        DV.commit((s) => {
          const x = s.subscriptions.find((y) => y.id === sb.id);
          const ref = 'RF-' + Math.random().toString(36).slice(2, 8).toUpperCase();
          (x.refunds = x.refunds || []).push({ amount, reason, at: Date.now(), ref, method: x.payment.method });
          A.note(s, 'customer:' + x.customerId, { icon: '💶', title: { ar: 'تم استرداد مبلغ لك', nl: 'Terugbetaling verwerkt', en: 'Refund processed' }, body: { ar: `${DV.money(amount, 'ar')} إلى ${payLabel(x.payment.method, 'ar')} · ${x.code}`, nl: `${DV.money(amount, 'nl')} naar ${payLabel(x.payment.method, 'nl')} · ${x.code}`, en: `${DV.money(amount, 'en')} to ${payLabel(x.payment.method, 'en')} · ${x.code}` } });
          A.note(s, 'admin', { icon: '💶', title: `استرداد ${DV.money(amount)}`, body: `${x.code} · ${reason}` });
        });
        toast(t('sub.t.refunded'), M(amount), '💶');
      }
    });
  };

  // =====================================================================================
  // CUSTOMERS
  // =====================================================================================
  function custStats(c) {
    const subs = DV.state.subscriptions.filter((x) => x.customerId === c.id);
    const orders = DV.ordersFor({ customerId: c.id });
    return { subs, orders, active: subs.filter((x) => x.status === 'active').length, spent: sum(subs, (x) => (x.pricing || {}).total) - sum(subs, refunded),
      delivered: orders.filter((o) => o.status === 'delivered').length, rated: orders.filter((o) => o.rating) };
  }
  A.sections.customers = {
    get title() { return t('nav.customers'); }, icon: 'users',
    render() {
      const s = DV.state, f = A.ui.custF, q = f.q.trim().toLowerCase();
      const cities = [...new Set(s.customers.flatMap((c) => c.addresses.map((a) => a.city)).filter(Boolean))].sort();
      const list = s.customers.filter((c) => (!q || c.name.toLowerCase().includes(q) || (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) || (c.email || '').toLowerCase().includes(q)) &&
        (!f.city || c.addresses.some((a) => a.city === f.city))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return `
      <div class="page-h"><div><h1>${esc(t('nav.customers'))}</h1><p class="muted">${t('cust.sub', { n: `<span class="num">${s.customers.length}</span>`, a: `<span class="num">${s.customers.filter((c) => custStats(c).active).length}</span>` })}</p></div></div>
      <div class="toolbar card">
        <div class="tb-search"><input class="input sm" placeholder="${esc(t('cust.searchPh'))}" value="${esc(f.q)}" data-input="cust-q" data-focus-key="cust-q"></div>
        <select class="select sm" data-change="cust-city">${opt('', t('f.allCities'), f.city)}${cities.map((c) => opt(c, c, f.city)).join('')}</select>
        <div class="grow"></div><span class="muted small">${t('common.nResults', { n: `<span class="num">${list.length}</span>` })}</span>
      </div>
      <div class="card">${list.length ? `<div class="tbl-wrap"><table class="tbl hover"><thead><tr>${['cust.th.customer', 'cust.th.phone', 'cust.th.city', 'cust.th.allergies', 'cust.th.subs', 'cust.th.delivered', 'cust.th.spent', 'cust.th.joined'].map((k) => `<th>${esc(t(k))}</th>`).join('')}</tr></thead><tbody>
        ${list.map((c) => { const st = custStats(c); return `<tr class="clickable" data-action="open-customer" data-id="${c.id}">
          <td><div class="row">${avatar(c.name)}<div><b>${esc(c.name || '—')}</b><div class="tiny muted lat">${esc(c.email)}</div></div></div></td>
          <td class="num small" dir="ltr">${esc(c.phone)}</td>
          <td class="lat small">${esc((c.addresses[0] || {}).city || '—')}</td>
          <td>${c.allergies && c.allergies.length ? c.allergies.map((a) => `<span class="chip xs chip-warn">${esc(allergenLabel(a))}</span>`).join(' ') : '<span class="muted small">—</span>'}</td>
          <td>${st.active ? `<span class="chip xs chip-brand num">${st.active} ${esc(t('subst.active'))}</span>` : ''} <span class="muted small num">${st.subs.length}</span></td>
          <td class="num">${st.delivered}</td>
          <td>${money(st.spent)}</td>
          <td class="small">${c.createdAt ? fdate(DV.toISO(new Date(c.createdAt)), { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td></tr>`; }).join('')}
        </tbody></table></div>` : empty('👤', t('cust.noMatch'))}</div>`;
    }
  };
  A.inp['cust-q'] = (el) => { A.ui.custF.q = el.value; A.render(); };
  A.chg['cust-city'] = (el) => { A.ui.custF.city = el.value; A.render(); };
  A.act['open-customer'] = (el, e) => { if (e) e.stopPropagation(); A.openDrawer('customer', el.dataset.id); };

  A.drawers.customer = function (id) {
    const c = DV.customer(id); if (!c) return null;
    const st = custStats(c);
    const orders = st.orders.slice().sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no));
    const upcoming = orders.filter((o) => o.date >= DV.today() && o.status !== 'cancelled').reverse().slice(0, 6);
    const past = orders.filter((o) => o.date < DV.today() || ['delivered', 'failed'].includes(o.status)).slice(0, 14);
    const avgR = st.rated.length ? sum(st.rated, (o) => o.rating) / st.rated.length : 0;
    const inbox = DV.notificationsFor('customer:' + c.id).slice(0, 5);
    const orderLi = (o) => { const m = DV.meal(o.mealId); return `<li><span class="num tiny muted">${esc(o.no)}</span><span class="small">${fdate(o.date, { day: 'numeric', month: 'short' })} · ${slotLabel(o.slot)}</span><span class="grow ellipsis small">${m ? esc(L(m.name)) : '—'} <span class="muted tiny">· ${esc(restName(o.restaurantId))}</span></span>${o.rating ? stars(o.rating) : ''}${pill(o.status)}</li>${o.comment ? `<li class="cmt">“${esc(o.comment)}”</li>` : ''}`; };
    return `
    <header class="drawer-h">
      ${avatar(c.name)}
      <div class="grow"><h2>${esc(c.name || '—')}</h2><p class="muted small"><span class="num" dir="ltr">${esc(c.phone)}</span> · <span class="lat">${esc(c.email)}</span></p></div>
      <button class="icon-btn" data-action="drawer-close" aria-label="${esc(t('common.close'))}">✕</button>
    </header>
    <div class="drawer-b">
      <div class="dgrid">
        <div><small>${esc(t('cust.activeSubs'))}</small><b class="num">${st.active}</b></div>
        <div><small>${esc(t('cust.th.spent'))}</small><b>${money(st.spent)}</b></div>
        <div><small>${esc(t('cust.th.delivered'))}</small><b class="num">${st.delivered}</b></div>
        <div><small>${esc(t('cust.avgRating'))}</small><b>${st.rated.length ? `<span class="num">${avgR.toFixed(1)}</span> ★ <small class="muted num">(${st.rated.length})</small>` : '—'}</b></div>
        <div><small>${esc(t('cust.goal'))}</small><b>${esc(['balanced', 'lose', 'gain'].includes(c.goal) ? t('goal.' + c.goal) : c.goal || '—')}</b></div>
        <div><small>${esc(t('cust.lang'))}</small><b class="lat">${esc((c.lang || 'ar').toUpperCase())}</b></div>
      </div>

      <div class="dsec"><h4>${esc(t('cust.addresses'))}</h4>
        ${c.addresses.length ? c.addresses.map((a) => `<div class="addr"><span class="chip xs">${esc(a.label || '')}</span><span class="lat">${esc([a.street, a.zip, a.city].filter(Boolean).join(', '))}</span>${a.notes ? `<small class="muted">${esc(a.notes)}</small>` : ''}</div>`).join('') : `<p class="muted small">${esc(t('cust.noAddr'))}</p>`}
      </div>

      <div class="dsec"><h4>${esc(t('cust.allergiesEdit'))}</h4>
        <div class="chips">${Object.keys(DV.ALLERGENS).map((a) => `<label class="tchip ${c.allergies.includes(a) ? 'bad' : ''}"><input type="checkbox" data-change="cust-allergy" data-id="${c.id}" value="${a}" ${c.allergies.includes(a) ? 'checked' : ''}><span>${esc(allergenLabel(a))}</span></label>`).join('')}</div>
        ${c.dislikes ? `<p class="small muted" style="margin-top:8px">${esc(t('cust.dislikes'))}: ${esc(c.dislikes)}</p>` : ''}
      </div>

      <div class="dsec"><h4>${esc(t('nav.subscriptions'))}</h4>
        ${st.subs.length ? `<div class="mini-list">${st.subs.slice().reverse().map((sb) => { const p = DV.planType(sb.planType) || {}; const pr = A.subProgress(sb); return `
          <button class="mini" data-action="open-sub" data-id="${sb.id}"><b class="num">${esc(sb.code)}</b><span>${p.icon || ''} ${esc(L(p.name))} · ${t('common.nDays', { n: `<span class="num">${sb.daysCount}</span>` })} · ${esc(L((DV.mealOption(sb.option) || {}).name))}</span><span class="grow"></span><span class="tiny num muted">${pr.days}/${pr.total}</span>${subChip(sb.status)}${money((sb.pricing || {}).total)}</button>`; }).join('')}</div>` : `<p class="muted small">${esc(t('cust.noSubs'))}</p>`}
      </div>

      ${upcoming.length ? `<div class="dsec"><h4>${esc(t('cust.upcoming'))}</h4><ul class="olist">${upcoming.map(orderLi).join('')}</ul></div>` : ''}
      <div class="dsec"><h4>${esc(t('cust.past'))}</h4>${past.length ? `<ul class="olist">${past.map(orderLi).join('')}</ul>` : `<p class="muted small">${esc(t('cust.noOrders'))}</p>`}</div>

      <div class="dsec"><h4>${esc(t('cust.notify'))}</h4>
        <div class="stack">
          <input class="input sm" placeholder="${esc(t('cust.notifyTitlePh'))}" value="${esc(A.ui.drafts['cn.title:' + c.id] || '')}" data-input="draft" data-k="cn.title:${c.id}" data-focus-key="cn.title">
          <textarea class="textarea" rows="2" placeholder="${esc(t('cust.notifyBodyPh'))}" data-input="draft" data-k="cn.body:${c.id}" data-focus-key="cn.body">${esc(A.ui.drafts['cn.body:' + c.id] || '')}</textarea>
          <div class="row"><select class="select sm" id="cn-icon" style="width:auto">${['💬', '🎁', '📣', '⚠️', '🍽️', '💶'].map((i) => opt(i, i, A.ui.drafts['cn.icon'] || '💬')).join('')}</select><div class="grow"></div><button class="btn btn-primary btn-sm" data-action="cust-notify" data-id="${c.id}">${esc(t('cust.sendToApp'))}</button></div>
        </div>
        ${inbox.length ? `<div class="tiny muted" style="margin:12px 0 6px">${esc(t('cust.lastNotifs'))}</div><ul class="feed compact">${inbox.map((n) => `<li><span class="feed-ic">${esc(n.icon)}</span><div class="grow"><b>${esc(L(n.title))}</b><small class="muted">${esc(L(n.body))}</small></div><span class="tiny muted">${A.ago(n.at)}</span></li>`).join('')}</ul>` : ''}
      </div>
    </div>`;
  };
  A.chg['cust-allergy'] = (el) => {
    const c = DV.customer(el.dataset.id);
    const set = new Set(c.allergies); el.checked ? set.add(el.value) : set.delete(el.value);
    DV.updateCustomer(c.id, { allergies: [...set] });
    toast(t('cust.t.allergies'), allergenLabel(el.value), '⚠️');
  };
  A.act['cust-notify'] = (el) => {
    const id = el.dataset.id, D = A.ui.drafts;
    const title = (D['cn.title:' + id] || '').trim();
    const body = (D['cn.body:' + id] || '').trim();
    const icon = document.getElementById('cn-icon').value;
    if (!title) return toast(t('cust.t.titleFirst'), '', '⚠️');
    delete D['cn.title:' + id]; delete D['cn.body:' + id];
    DV.notify('customer:' + el.dataset.id, { title, body, icon });
    toast(t('cust.t.sent'), custName(el.dataset.id), '📨');
  };

  // =====================================================================================
  // DRIVERS
  // =====================================================================================
  const VEH_IC = { 'e-bike': '🚲', scooter: '🛵', car: '🚗', bike: '🚴' };
  const vehLabel = (k) => VEH_IC[k] ? `${VEH_IC[k]} ${t('veh.' + k)}` : k;
  A.sections.drivers = {
    get title() { return t('nav.drivers'); }, icon: 'driver',
    render() {
      const s = DV.state, td = DV.today();
      return `
      <div class="page-h"><div><h1>${esc(t('nav.drivers'))}</h1><p class="muted">${t('drv.sub', { n: `<span class="num">${s.drivers.filter((d) => d.online).length}</span>`, of: `<span class="num">${s.drivers.length}</span>` })}</p></div>
        <div class="row"><button class="btn btn-ghost btn-sm" data-action="ops-auto" data-date="${td}">⚡ ${esc(t('drv.assignToday'))}</button><button class="btn btn-primary btn-sm" data-action="driver-edit">+ ${esc(t('drv.new'))}</button></div></div>
      <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>${['drv.th.driver', 'cust.th.phone', 'drv.th.vehicle', 'drv.th.zone', 'drv.th.online', 'drv.th.assigned', 'drv.th.delivered', 'drv.th.live'].map((k) => `<th>${esc(t(k))}</th>`).join('')}<th>PIN</th><th></th></tr></thead><tbody>
      ${s.drivers.map((d) => {
        const os = DV.ordersFor({ date: td, driverId: d.id }).filter((o) => o.status !== 'cancelled');
        const del = os.filter((o) => o.status === 'delivered').length;
        const live = os.filter((o) => ['picked', 'on_way'].includes(o.status)).length;
        return `<tr>
          <td><div class="row">${avatar(d.name, d.online ? '#1FA06B' : '#94A39C')}<b>${esc(d.name)}</b></div></td>
          <td class="num small" dir="ltr">${esc(d.phone)}</td>
          <td class="small">${esc(vehLabel(d.vehicle))} ${d.plate && d.plate !== '—' ? `<span class="chip xs num">${esc(d.plate)}</span>` : ''}</td>
          <td class="lat">${esc(d.zone)}</td>
          <td><span class="switch"><input type="checkbox" data-change="driver-online" data-id="${d.id}" ${d.online ? 'checked' : ''}><i></i></span></td>
          <td class="num"><b>${os.length}</b></td>
          <td><div class="row">${A.bar(os.length ? (del / os.length) * 100 : 0)}<span class="num small">${del}</span></div></td>
          <td class="num">${live}</td>
          <td class="num muted">${esc(d.pin)}</td>
          <td class="nowrap"><button class="btn btn-ghost btn-xs" data-action="driver-orders" data-id="${d.id}">${esc(t('drv.orders'))}</button> <button class="btn btn-ghost btn-xs" data-action="driver-edit" data-id="${d.id}">${esc(t('common.edit'))}</button></td>
        </tr>`; }).join('')}
      </tbody></table></div></div>`;
    }
  };
  A.chg['driver-online'] = (el) => {
    DV.commit((s) => { const d = s.drivers.find((x) => x.id === el.dataset.id); d.online = el.checked; });
    toast(el.checked ? t('drv.t.online') : t('drv.t.offline'), DV.driver(el.dataset.id).name, el.checked ? '🟢' : '⚪');
  };
  A.act['driver-orders'] = (el) => { A.ui.opsDate = DV.today(); Object.keys(A.ui.opsF).forEach((k) => { A.ui.opsF[k] = ''; }); A.ui.opsF.driver = el.dataset.id; A.go('operations'); };
  A.act['driver-edit'] = (el) => {
    const d = el.dataset.id ? DV.driver(el.dataset.id) : { name: '', phone: '+31 6 ', vehicle: 'e-bike', plate: '', pin: String(1000 + Math.floor(Math.random() * 9000)), zone: 'Rotterdam', online: true };
    const zones = DV.state.zones.map((z) => z.city);
    A.modal({
      title: el.dataset.id ? `${t('drv.editTitle')} — ${d.name}` : t('drv.new'),
      body: `<div class="grid2">
        ${A.field(t('drv.f.name'), A.input('name', d.name, 'required'))}
        ${A.field(t('cust.th.phone'), A.input('phone', d.phone, 'dir="ltr" class="input num"'))}
        ${A.field(t('drv.th.vehicle'), `<select class="select" name="vehicle">${Object.keys(VEH_IC).map((k) => opt(k, vehLabel(k), d.vehicle)).join('')}</select>`)}
        ${A.field(t('drv.f.plate'), A.input('plate', d.plate === '—' ? '' : d.plate, 'dir="ltr" class="input num"'))}
        ${A.field(t('drv.th.zone'), `<select class="select" name="zone">${[...new Set([d.zone, ...zones])].map((z) => opt(z, z, d.zone)).join('')}</select>`)}
        ${A.field(t('drv.f.pin'), A.input('pin', d.pin, 'inputmode="numeric" maxlength="6" class="input num"'))}
      </div>
      <label class="row sw-row">${A.sw('online', d.online)}<span>${esc(t('drv.f.onlineNow'))}</span></label>`,
      danger: el.dataset.id ? { label: t('drv.delete'), onClick: () => {
        if (!confirm(t('drv.deleteConfirm', { name: d.name }))) return false;
        DV.commit((s) => { s.drivers = s.drivers.filter((x) => x.id !== d.id); s.orders.forEach((o) => { if (o.driverId === d.id && o.status !== 'delivered') o.driverId = null; }); });
        toast(t('drv.t.deleted'), d.name, '🗑️');
      } } : null,
      onSave(form) {
        const name = A.fv(form, 'name'); if (!name) return A.invalid(form, 'name', t('drv.t.nameReq'));
        const pin = A.fv(form, 'pin'); if (!/^\d{4,6}$/.test(pin)) return A.invalid(form, 'pin', t('drv.t.pinBad'));
        const patch = { name, phone: A.fv(form, 'phone'), vehicle: A.fv(form, 'vehicle'), plate: A.fv(form, 'plate') || '—', zone: A.fv(form, 'zone'), pin, online: A.fbool(form, 'online') };
        DV.commit((s) => {
          if (el.dataset.id) Object.assign(s.drivers.find((x) => x.id === d.id), patch);
          else { s.drivers.push({ id: 'd' + Date.now(), ...patch }); }
        });
        toast(el.dataset.id ? t('drv.t.saved') : t('drv.t.added'), name, '🛵');
      }
    });
  };
})();
