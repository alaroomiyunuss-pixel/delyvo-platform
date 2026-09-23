/* Delyvo admin — Dashboard, daily Operations, Reviews */
(function () {
  const A = window.ADM;
  const { esc, L, money, num, sum, fdate, fdateLong, ftime, ago, pill, stars, windowLabel, slotLabel, avatar, opt, empty, toast } = A;
  const ACTIVE_ST = ['scheduled', 'accepted', 'preparing', 'ready', 'picked', 'on_way'];

  const restName = (id) => (DV.restaurant(id) || {}).name || '—';
  const restColor = (id) => (DV.restaurant(id) || {}).color || '#94A39C';
  const custName = (id) => (DV.customer(id) || {}).name || '—';
  const sameMonth = (ts, ref = new Date()) => { const d = new Date(ts); return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth(); };

  // =====================================================================================
  // DASHBOARD
  // =====================================================================================
  function kpi(label, value, sub, icon, tone = '') {
    return `<div class="kpi card ${tone}"><div class="kpi-top"><span class="kpi-l">${esc(label)}</span><span class="kpi-ic">${icon}</span></div>
      <div class="kpi-v">${value}</div>${sub ? `<div class="kpi-s">${sub}</div>` : ''}</div>`;
  }

  A.revenueStats = function () {
    const s = DV.state;
    const paid = s.subscriptions.filter((x) => x.payment && x.payment.paidAt && sameMonth(x.payment.paidAt));
    const refunds = sum(s.subscriptions.flatMap((x) => x.refunds || []).filter((r) => sameMonth(r.at)), (r) => r.amount);
    return { count: paid.length, gross: sum(paid, (x) => (x.pricing || {}).total), refunds, net: sum(paid, (x) => (x.pricing || {}).total) - refunds };
  };

  A.dashboardAlerts = function () {
    const s = DV.state, t = DV.today(), lim = DV.addDays(t, 2);
    const unselected = [];
    s.subscriptions.filter((x) => x.status === 'active').forEach((sb) => sb.days.forEach((d) => {
      if (d.status !== 'active' || d.date < t || d.date > lim) return;
      const miss = Object.keys(d.meals).filter((k) => !d.meals[k]);
      if (miss.length) unselected.push({ sb, d, miss });
    }));
    const failed = s.orders.filter((o) => o.status === 'failed' && o.date >= DV.addDays(t, -7));
    const low = s.orders.filter((o) => o.rating && o.rating <= 2).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    const noDriver = s.orders.filter((o) => o.date === t && !o.driverId && ACTIVE_ST.includes(o.status));
    return { unselected, failed, low, noDriver };
  };

  A.sections.dashboard = {
    title: 'الرئيسية', icon: 'home',
    render() {
      const s = DV.state, t = DV.today();
      const activeSubs = s.subscriptions.filter((x) => x.status === 'active');
      const todayOrders = s.orders.filter((o) => o.date === t && o.status !== 'cancelled');
      const delivered = todayOrders.filter((o) => o.status === 'delivered').length;
      const rev = A.revenueStats();
      const rated = s.orders.filter((o) => o.rating);
      const avgRating = rated.length ? sum(rated, (o) => o.rating) / rated.length : 0;
      const activeR = s.restaurants.filter((r) => r.active);
      const al = A.dashboardAlerts();

      // revenue last 14 days
      const days = [];
      for (let i = 13; i >= 0; i--) days.push(DV.addDays(t, -i));
      const byDay = {}; s.subscriptions.forEach((x) => { if (!x.payment || !x.payment.paidAt) return; const k = DV.toISO(new Date(x.payment.paidAt)); byDay[k] = (byDay[k] || 0) + ((x.pricing || {}).total || 0); });
      const pts = days.map((d) => ({ label: DV.fmtDate(d, 'ar', { day: 'numeric', month: 'numeric' }), value: Math.round(byDay[d] || 0) }));
      const rev14 = sum(pts, (p) => p.value);

      // pipeline
      const pipe = Object.keys(DV.STATUS).map((k) => ({ k, n: s.orders.filter((o) => o.date === t && o.status === k).length }));
      const pipeTotal = sum(pipe.filter((p) => p.k !== 'cancelled'), (p) => p.n) || 1;

      // meals per restaurant today
      const perR = s.restaurants.map((r) => ({ label: r.name, value: todayOrders.filter((o) => o.restaurantId === r.id).length, color: r.color, dot: true,
        sub: `${todayOrders.filter((o) => o.restaurantId === r.id && ['ready', 'picked', 'on_way', 'delivered'].includes(o.status)).length} جاهزة` })).filter((x) => x.value || true).sort((a, b) => b.value - a.value);
      const unassignedMeal = todayOrders.filter((o) => !o.mealId).length;
      if (unassignedMeal) perR.push({ label: 'بدون وجبة محددة', value: unassignedMeal, color: '#CBD5D0', dot: true });

      // plan mix
      const mix = s.plans.types.map((p) => ({ label: `${p.icon} ${L(p.name)}`, value: activeSubs.filter((x) => x.planType === p.id).length, color: p.color }));

      const alertsCount = al.unselected.length + al.failed.length + al.low.length + (al.noDriver.length ? 1 : 0);
      const acts = DV.notificationsFor('admin').slice(0, 9);

      return `
      <div class="page-h">
        <div><h1>صباح الخير 👋</h1><p class="muted">${fdateLong(t)} · نظرة عامة على التشغيل اليوم</p></div>
        <div class="row wrap"><a class="btn btn-ghost btn-sm" href="#operations">عمليات اليوم</a><button class="btn btn-primary btn-sm" data-action="ops-auto" data-date="${t}">توزيع تلقائي على السائقين</button></div>
      </div>

      <div class="kpis">
        ${kpi('الاشتراكات الفعّالة', num(activeSubs.length), `${num(s.subscriptions.length)} إجمالي الاشتراكات`, '🔁')}
        ${kpi('وجبات اليوم', num(todayOrders.length), `${num(todayOrders.filter((o) => o.slot === 'lunch').length)} غداء · ${num(todayOrders.filter((o) => o.slot === 'dinner').length)} عشاء`, '🍱')}
        ${kpi('التوصيلات اليوم', `${num(delivered)}<small class="muted"> / ${num(todayOrders.length)}</small>`, A.bar(todayOrders.length ? (delivered / todayOrders.length) * 100 : 0), '🛵')}
        ${kpi('إيراد الشهر', money(rev.net), `${num(rev.count)} اشتراك مدفوع${rev.refunds ? ` · مرتجع ${money(rev.refunds)}` : ''}`, '💶', 'kpi-brand')}
        ${kpi('متوسط تقييم الوجبات', `${num(avgRating, 2)}<small class="muted"> / 5</small>`, `${stars(avgRating)} <span class="muted">من ${num(rated.length)} تقييم</span>`, '⭐')}
        ${kpi('المطاعم الفعّالة', `${num(activeR.length)}<small class="muted"> / ${num(s.restaurants.length)}</small>`, `${num(s.meals.filter((m) => m.active).length)} وجبة فعّالة في الكتالوج`, '🍳')}
      </div>

      <div class="grid g-2-1">
        <section class="card panel">
          <div class="panel-h"><div><h3>الإيرادات — آخر ١٤ يوم</h3><p class="muted small">حسب تاريخ الدفع</p></div><div class="panel-big">${money(rev14)}</div></div>
          ${A.lineChart(pts, { fmt: (v) => '€' + Math.round(v) })}
        </section>
        <section class="card panel">
          <div class="panel-h"><div><h3>توزيع الباقات</h3><p class="muted small">الاشتراكات الفعّالة</p></div></div>
          ${A.donut(mix, { center: String(activeSubs.length), centerSub: 'اشتراك' })}
        </section>
      </div>

      <section class="card panel">
        <div class="panel-h"><div><h3>خط سير طلبات اليوم</h3><p class="muted small">عدد الطلبات في كل مرحلة</p></div><a class="btn btn-ghost btn-xs" href="#operations">فتح العمليات ←</a></div>
        <div class="pipe">${pipe.map((p) => { const st = DV.STATUS[p.k]; return `
          <button class="pipe-i" data-action="ops-filter-status" data-status="${p.k}" style="--c:${st.color}">
            <span class="pipe-n num">${p.n}</span><span class="pipe-l">${esc(st.ar)}</span>
            <span class="pipe-b"><i style="width:${p.k === 'cancelled' ? 0 : (p.n / pipeTotal) * 100}%"></i></span>
          </button>`; }).join('')}</div>
      </section>

      <div class="grid g-1-1">
        <section class="card panel">
          <div class="panel-h"><div><h3>وجبات اليوم حسب المطعم</h3><p class="muted small">داخلي — العميل لا يرى أسماء المطاعم</p></div></div>
          ${A.hbars(perR)}
        </section>
        <section class="card panel">
          <div class="panel-h"><div><h3>تنبيهات</h3><p class="muted small">أمور تحتاج تدخلك</p></div><span class="chip ${alertsCount ? 'chip-danger' : 'chip-brand'} num">${alertsCount}</span></div>
          <div class="alerts">
            ${al.noDriver.length ? `<div class="alert a-warn"><span class="al-ic">🚚</span><div class="grow"><b><span class="num">${al.noDriver.length}</span> طلب اليوم بدون سائق</b><small>وزّعها تلقائياً حسب المدينة أو يدوياً من العمليات</small></div><button class="btn btn-primary btn-xs" data-action="ops-auto" data-date="${t}">توزيع</button></div>` : ''}
            ${al.unselected.slice(0, 6).map((u) => `<div class="alert a-info"><span class="al-ic">🍽️</span><div class="grow"><b>${esc(custName(u.sb.customerId))} لم يختر وجبة</b><small>${fdate(u.d.date)} · ${u.miss.map(slotLabel).join('، ')} · ${esc(u.sb.code)} — الشيف يختار تلقائياً بعد الموعد النهائي</small></div><button class="btn btn-ghost btn-xs" data-action="open-sub" data-id="${u.sb.id}">فتح</button></div>`).join('')}
            ${al.unselected.length > 6 ? `<div class="tiny muted" style="padding:0 6px">+ <span class="num">${al.unselected.length - 6}</span> أيام أخرى بدون اختيار</div>` : ''}
            ${al.failed.map((o) => `<div class="alert a-danger"><span class="al-ic">⚠️</span><div class="grow"><b>تعذّر توصيل ${esc(o.no)}</b><small>${esc(custName(o.customerId))} · ${fdate(o.date)}${o.failReason ? ' · ' + esc(o.failReason) : ''}</small></div><button class="btn btn-ghost btn-xs" data-action="goto-order" data-id="${o.id}">عرض</button></div>`).join('')}
            ${al.low.map((o) => `<div class="alert a-warn"><span class="al-ic">⭐</span><div class="grow"><b>تقييم ${o.rating}/5 — ${esc(L((DV.meal(o.mealId) || {}).name))}</b><small>${esc(restName(o.restaurantId))} · ${esc(custName(o.customerId))}${o.comment ? ' · "' + esc(o.comment) + '"' : ''}</small></div><a class="btn btn-ghost btn-xs" href="#reviews">التقييمات</a></div>`).join('')}
            ${!alertsCount ? empty('✅', 'كل شيء تحت السيطرة', 'لا توجد تنبيهات حالياً') : ''}
          </div>
        </section>
      </div>

      <section class="card panel">
        <div class="panel-h"><div><h3>آخر النشاطات</h3><p class="muted small">إشعارات الأدمن</p></div><button class="btn btn-ghost btn-xs" data-action="bell">كل الإشعارات</button></div>
        <ul class="feed">${acts.length ? acts.map((n) => `<li class="${n.read ? '' : 'unread'}"><span class="feed-ic">${esc(n.icon || '🔔')}</span><div class="grow"><b>${esc(L(n.title))}</b><small class="muted">${esc(L(n.body))}</small></div><span class="tiny muted">${ago(n.at)}</span></li>`).join('') : `<li>${empty('🕊️', 'لا يوجد نشاط بعد')}</li>`}</ul>
      </section>`;
    }
  };

  // =====================================================================================
  // OPERATIONS
  // =====================================================================================
  function opsOrders() {
    const u = A.ui, f = u.opsF, q = f.q.trim().toLowerCase();
    return DV.state.orders.filter((o) => o.date === u.opsDate &&
      (!f.restaurant || (f.restaurant === '_none' ? !o.restaurantId : o.restaurantId === f.restaurant)) &&
      (!f.status || o.status === f.status) &&
      (!f.driver || (f.driver === '_none' ? !o.driverId : o.driverId === f.driver)) &&
      (!f.city || o.city === f.city) && (!f.slot || o.slot === f.slot) &&
      (!q || o.no.toLowerCase().includes(q) || custName(o.customerId).toLowerCase().includes(q) || L((DV.meal(o.mealId) || {}).name).toLowerCase().includes(q))
    ).sort((a, b) => (a.window || '').localeCompare(b.window || '') || a.slot.localeCompare(b.slot) || a.no.localeCompare(b.no));
  }
  const winOrder = { early: 0, noon: 1, eve: 2 };

  function driverSelect(o) {
    const ds = DV.state.drivers;
    return `<select class="select xs" data-change="ops-driver" data-id="${o.id}" ${['delivered', 'cancelled'].includes(o.status) ? 'disabled' : ''}>
      ${opt('', '— بدون سائق —', o.driverId || '')}${ds.map((d) => opt(d.id, `${d.online ? '🟢' : '⚪'} ${d.name}`, o.driverId || '')).join('')}</select>`;
  }
  function statusSelect(o) {
    return `<select class="select xs" data-change="ops-status" data-id="${o.id}">${Object.keys(DV.STATUS).map((k) => opt(k, DV.STATUS[k].ar, o.status)).join('')}</select>`;
  }
  function opsRow(o) {
    const m = DV.meal(o.mealId), c = DV.customer(o.customerId);
    const sel = A.ui.sel.has(o.id);
    return `<tr class="${sel ? 'sel' : ''} ${A.ui.highlight === o.id ? 'hl' : ''}" id="row-${o.id}">
      <td class="cb"><input type="checkbox" data-change="ops-sel" data-id="${o.id}" ${sel ? 'checked' : ''}></td>
      <td><b class="num">${esc(o.no)}</b>${o.auto ? '<div><span class="chip xs chip-info">اختيار الشيف</span></div>' : ''}</td>
      <td><button class="link" data-action="open-customer" data-id="${o.customerId}">${esc(c ? c.name : '—')}</button>${c && c.allergies && c.allergies.length ? `<div class="tiny warn-t">⚠ ${c.allergies.map((a) => esc((DV.ALLERGENS[a] || {}).ar || a)).join('، ')}</div>` : ''}</td>
      <td class="lat">${esc(o.city)}</td>
      <td>${slotLabel(o.slot)}</td>
      <td class="meal-cell">${m ? `<div class="row"><img class="thumb" src="${esc(m.img)}" alt="" loading="lazy"><div class="grow"><div class="ellipsis">${esc(L(m.name))}</div><div class="tiny"><i class="dot" style="background:${restColor(o.restaurantId)}"></i> ${esc(restName(o.restaurantId))}</div></div></div>` : `<span class="chip chip-warn xs">لم تُحدد بعد</span>`}</td>
      <td class="small">${esc(windowLabel(o.window))}</td>
      <td>${pill(o.status)}${o.status === 'failed' && o.failReason ? `<div class="tiny muted">${esc(o.failReason)}</div>` : ''}</td>
      <td>${driverSelect(o)}</td>
      <td>${statusSelect(o)}</td>
      <td>${o.subId ? `<button class="icon-btn sm" title="الاشتراك" data-action="open-sub" data-id="${o.subId}">↗</button>` : ''}</td>
    </tr>`;
  }
  function opsTable(list) {
    if (!list.length) return empty('📭', 'لا توجد طلبات مطابقة', 'غيّر التاريخ أو الفلاتر');
    const all = list.every((o) => A.ui.sel.has(o.id));
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th class="cb"><input type="checkbox" data-change="ops-sel-all" data-ids="${list.map((o) => o.id).join(',')}" ${all ? 'checked' : ''}></th>
      <th>رقم</th><th>العميل</th><th>المدينة</th><th>غداء/عشاء</th><th>الصنف · المطعم</th><th>نافذة التوصيل</th><th>الحالة</th><th>السائق</th><th>تغيير الحالة</th><th></th>
      </tr></thead><tbody>${list.map(opsRow).join('')}</tbody></table></div>`;
  }

  A.sections.operations = {
    title: 'العمليات اليومية', icon: 'ops',
    badge() { return DV.state.orders.filter((o) => o.date === DV.today() && ACTIVE_ST.includes(o.status)).length || ''; },
    render() {
      const s = DV.state, u = A.ui, f = u.opsF, d = u.opsDate;
      const dayAll = s.orders.filter((o) => o.date === d);
      const list = opsOrders();
      const cities = [...new Set(dayAll.map((o) => o.city).filter(Boolean))].sort();
      // prune selection to visible orders
      [...u.sel].forEach((id) => { if (!list.find((o) => o.id === id)) u.sel.delete(id); });
      const counts = {}; dayAll.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
      const noDriver = dayAll.filter((o) => !o.driverId && ACTIVE_ST.includes(o.status)).length;

      let body;
      if (u.opsGroup === 'restaurant' || u.opsGroup === 'driver') {
        const key = u.opsGroup === 'restaurant' ? 'restaurantId' : 'driverId';
        const ents = u.opsGroup === 'restaurant' ? s.restaurants : s.drivers;
        const groups = ents.map((e) => ({ e, list: list.filter((o) => o[key] === e.id) })).filter((g) => g.list.length);
        const none = list.filter((o) => !o[key]);
        if (none.length) groups.push({ e: { id: '', name: u.opsGroup === 'restaurant' ? 'بدون وجبة محددة' : 'بدون سائق', color: '#94A39C' }, list: none });
        body = groups.length ? groups.map((g) => {
          const act = g.list.filter((o) => o.status !== 'cancelled');
          const ready = act.filter((o) => ['ready', 'picked', 'on_way', 'delivered'].includes(o.status)).length;
          const prep = act.filter((o) => o.status === 'preparing').length;
          const deliv = act.filter((o) => o.status === 'delivered').length;
          const lunch = act.filter((o) => o.slot === 'lunch').length;
          const r = u.opsGroup === 'restaurant' ? DV.restaurant(g.e.id) : null;
          return `<section class="card dispatch">
            <header class="dp-h">
              ${A.avatar(g.e.name, g.e.color || '#1FA06B')}
              <div class="grow"><h3>${esc(g.e.name)}</h3>
                <p class="small muted">${u.opsGroup === 'restaurant'
                  ? `<b class="num">${act.length}</b> وجبة · <b class="num">${ready}</b> جاهزة · <b class="num">${prep}</b> قيد التحضير · ${lunch ? `${num(lunch)} غداء · ` : ''}${num(act.length - lunch)} عشاء${r ? ` · ${esc(r.phone)}` : ''}`
                  : `<b class="num">${act.length}</b> طلب · <b class="num">${deliv}</b> تم توصيلها · <b class="num">${ready - deliv}</b> جاهزة/في الطريق`}</p>
              </div>
              <div class="dp-prog">${A.bar(act.length ? ((u.opsGroup === 'restaurant' ? ready : deliv) / act.length) * 100 : 0, g.e.color)}<span class="tiny muted num">${act.length ? Math.round(((u.opsGroup === 'restaurant' ? ready : deliv) / act.length) * 100) : 0}%</span></div>
              ${u.opsGroup === 'restaurant' && g.e.id ? `<button class="btn btn-ghost btn-xs" data-action="ops-group-status" data-rid="${g.e.id}" data-status="accepted">قبول الكل</button>` : ''}
            </header>
            ${u.opsGroup === 'restaurant' ? dishSummary(act) : ''}
            ${opsTable(g.list)}
          </section>`;
        }).join('') : `<div class="card">${empty('📭', 'لا توجد طلبات مطابقة')}</div>`;
      } else {
        body = `<div class="card">${opsTable(list)}</div>`;
      }

      return `
      <div class="page-h">
        <div><h1>العمليات اليومية</h1><p class="muted">${fdateLong(d)} · <span class="num">${dayAll.filter((o) => o.status !== 'cancelled').length}</span> طلب فعّال${noDriver ? ` · <b class="danger-t"><span class="num">${noDriver}</span> بدون سائق</b>` : ''}</p></div>
        <div class="row wrap">
          <div class="date-nav">
            <button class="icon-btn sm" data-action="ops-day" data-n="-1" title="اليوم السابق">›</button>
            <input type="date" class="input sm num" value="${d}" data-change="ops-date">
            <button class="icon-btn sm" data-action="ops-day" data-n="1" title="اليوم التالي">‹</button>
            ${d !== DV.today() ? `<button class="btn btn-ghost btn-xs" data-action="ops-today">اليوم</button>` : ''}
          </div>
          <button class="btn btn-primary btn-sm" data-action="ops-auto" data-date="${d}">⚡ توزيع تلقائي على السائقين</button>
        </div>
      </div>

      <div class="status-strip">
        <button class="ss ${!f.status ? 'on' : ''}" data-action="ops-filter-status" data-status="">الكل <b class="num">${dayAll.length}</b></button>
        ${Object.keys(DV.STATUS).filter((k) => counts[k]).map((k) => `<button class="ss ${f.status === k ? 'on' : ''}" style="--c:${DV.STATUS[k].color}" data-action="ops-filter-status" data-status="${k}"><i></i>${esc(DV.STATUS[k].ar)} <b class="num">${counts[k]}</b></button>`).join('')}
      </div>

      <div class="toolbar card">
        <div class="tb-search"><input class="input sm" placeholder="بحث: رقم الطلب، العميل، الوجبة" value="${esc(f.q)}" data-input="ops-q" data-focus-key="ops-q"></div>
        <select class="select sm" data-change="ops-f" data-k="restaurant">${opt('', 'كل المطاعم', f.restaurant)}${s.restaurants.map((r) => opt(r.id, r.name, f.restaurant)).join('')}${opt('_none', 'بدون وجبة', f.restaurant)}</select>
        <select class="select sm" data-change="ops-f" data-k="status">${opt('', 'كل الحالات', f.status)}${Object.keys(DV.STATUS).map((k) => opt(k, DV.STATUS[k].ar, f.status)).join('')}</select>
        <select class="select sm" data-change="ops-f" data-k="driver">${opt('', 'كل السائقين', f.driver)}${s.drivers.map((x) => opt(x.id, x.name, f.driver)).join('')}${opt('_none', 'بدون سائق', f.driver)}</select>
        <select class="select sm" data-change="ops-f" data-k="city">${opt('', 'كل المدن', f.city)}${cities.map((c) => opt(c, c, f.city)).join('')}</select>
        <select class="select sm" data-change="ops-f" data-k="slot">${opt('', 'غداء + عشاء', f.slot)}${opt('lunch', 'غداء', f.slot)}${opt('dinner', 'عشاء', f.slot)}</select>
        ${Object.values(f).some(Boolean) ? `<button class="btn btn-ghost btn-xs" data-action="ops-clear">مسح الفلاتر</button>` : ''}
        <div class="grow"></div>
        <div class="seg">
          <button class="${u.opsGroup === 'none' ? 'on' : ''}" data-action="ops-group" data-g="none">قائمة</button>
          <button class="${u.opsGroup === 'restaurant' ? 'on' : ''}" data-action="ops-group" data-g="restaurant">حسب المطعم</button>
          <button class="${u.opsGroup === 'driver' ? 'on' : ''}" data-action="ops-group" data-g="driver">حسب السائق</button>
        </div>
      </div>

      ${u.sel.size ? `<div class="bulk card">
        <b>محدد <span class="num">${u.sel.size}</span></b>
        <select class="select sm" id="bulk-driver">${opt('', 'اختر سائق…', '')}${s.drivers.map((x) => opt(x.id, `${x.online ? '🟢' : '⚪'} ${x.name} · ${x.zone}`, '')).join('')}</select>
        <button class="btn btn-primary btn-sm" data-action="bulk-assign">إسناد</button>
        <span class="vsep"></span>
        <select class="select sm" id="bulk-status">${opt('', 'تغيير الحالة…', '')}${Object.keys(DV.STATUS).map((k) => opt(k, DV.STATUS[k].ar, '')).join('')}</select>
        <button class="btn btn-dark btn-sm" data-action="bulk-status">تطبيق</button>
        <div class="grow"></div>
        <button class="btn btn-ghost btn-sm" data-action="bulk-clear">إلغاء التحديد</button>
      </div>` : ''}

      <div class="ops-body">${body}</div>`;
    },
    after() {
      if (A.ui.highlight) {
        const el = document.getElementById('row-' + A.ui.highlight);
        if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); const id = A.ui.highlight; setTimeout(() => { if (A.ui.highlight === id) { A.ui.highlight = null; el.classList.remove('hl'); } }, 2600); }
      }
    }
  };
  function dishSummary(list) {
    const per = {}; list.forEach((o) => { if (o.mealId) per[o.mealId] = (per[o.mealId] || 0) + 1; });
    const arr = Object.entries(per).sort((a, b) => b[1] - a[1]);
    if (!arr.length) return '';
    return `<div class="dish-sum">${arr.map(([mid, n]) => `<span class="chip"><b class="num">${n}×</b> ${esc(L((DV.meal(mid) || {}).name))}</span>`).join('')}</div>`;
  }

  // ---- operations actions
  A.act['ops-day'] = (el) => { A.ui.opsDate = DV.addDays(A.ui.opsDate, +el.dataset.n); A.ui.sel.clear(); A.render(); };
  A.act['ops-today'] = () => { A.ui.opsDate = DV.today(); A.ui.sel.clear(); A.render(); };
  A.chg['ops-date'] = (el) => { if (el.value) { A.ui.opsDate = el.value; A.ui.sel.clear(); A.render(); } };
  A.chg['ops-f'] = (el) => { A.ui.opsF[el.dataset.k] = el.value; A.render(); };
  A.inp['ops-q'] = (el) => { A.ui.opsF.q = el.value; A.render(); };
  A.act['ops-clear'] = () => { Object.keys(A.ui.opsF).forEach((k) => { A.ui.opsF[k] = ''; }); A.render(); };
  A.act['ops-group'] = (el) => { A.ui.opsGroup = el.dataset.g; A.render(); };
  A.act['ops-filter-status'] = (el) => { A.ui.opsF.status = el.dataset.status; if (A.ui.route !== 'operations') { A.ui.opsDate = DV.today(); A.go('operations'); } else A.render(); };
  A.act['ops-auto'] = (el) => {
    const d = el.dataset.date || A.ui.opsDate;
    const n = DV.autoAssign(d);
    toast(n ? `تم توزيع ${n} طلب على السائقين` : 'كل الطلبات لديها سائق بالفعل', 'حسب منطقة كل سائق', '⚡');
    if (n) { // let each driver know
      const per = {}; DV.state.orders.filter((o) => o.date === d && o.driverId).forEach((o) => { per[o.driverId] = (per[o.driverId] || 0) + 1; });
      DV.commit((s) => Object.entries(per).forEach(([did, c]) => A.note(s, 'driver:' + did, { icon: '🗺️', title: `مسار ${DV.fmtDate(d, 'ar', { weekday: 'long' })}: ${c} طلب`, body: 'تم تحديث قائمة التوصيل من الإدارة' })));
    }
  };
  A.chg['ops-driver'] = (el) => {
    DV.assignDriver([el.dataset.id], el.value || null);
    toast(el.value ? `تم الإسناد إلى ${DV.driver(el.value).name}` : 'تمت إزالة السائق', DV.order(el.dataset.id).no, '🛵');
  };
  function applyStatus(ids, status) {
    if (!ids.length || !status) return;
    let reason = '';
    if (status === 'failed') { reason = prompt('سبب تعذّر التوصيل؟', 'العميل غير موجود'); if (reason === null) { A.render(); return; } }
    if (status === 'cancelled' && !confirm(`إلغاء ${ids.length} طلب؟`)) { A.render(); return; }
    DV.setOrderStatus(ids, status, { by: 'admin', reason });
    toast(`تم تحديث ${ids.length > 1 ? ids.length + ' طلبات' : DV.order(ids[0]).no}`, DV.STATUS[status].ar, '✅');
  }
  A.chg['ops-status'] = (el) => applyStatus([el.dataset.id], el.value);
  A.chg['ops-sel'] = (el) => { el.checked ? A.ui.sel.add(el.dataset.id) : A.ui.sel.delete(el.dataset.id); A.render(); };
  A.chg['ops-sel-all'] = (el) => { el.dataset.ids.split(',').filter(Boolean).forEach((id) => el.checked ? A.ui.sel.add(id) : A.ui.sel.delete(id)); A.render(); };
  A.act['bulk-clear'] = () => { A.ui.sel.clear(); A.render(); };
  A.act['bulk-assign'] = () => {
    const d = document.getElementById('bulk-driver').value;
    if (!d) return toast('اختر سائقاً أولاً', '', '⚠️');
    const ids = [...A.ui.sel]; DV.assignDriver(ids, d); A.ui.sel.clear();
    toast(`تم إسناد ${ids.length} طلب`, DV.driver(d).name, '🛵');
  };
  A.act['bulk-status'] = () => {
    const st = document.getElementById('bulk-status').value;
    if (!st) return toast('اختر الحالة أولاً', '', '⚠️');
    const ids = [...A.ui.sel]; A.ui.sel.clear(); applyStatus(ids, st);
  };
  A.act['ops-group-status'] = (el) => {
    const ids = opsOrders().filter((o) => o.restaurantId === el.dataset.rid && o.status === 'scheduled').map((o) => o.id);
    if (!ids.length) return toast('لا توجد طلبات مجدولة لهذا المطعم', '', 'ℹ️');
    applyStatus(ids, el.dataset.status);
  };
  A.act['goto-order'] = (el) => {
    const o = DV.order(el.dataset.id); if (!o) return;
    A.ui.opsDate = o.date; Object.keys(A.ui.opsF).forEach((k) => { A.ui.opsF[k] = ''; }); A.ui.highlight = o.id; A.closeDrawer();
    A.go('operations');
  };

  // =====================================================================================
  // REVIEWS
  // =====================================================================================
  A.sections.reviews = {
    title: 'التقييمات', icon: 'star',
    badge() { return DV.state.orders.filter((o) => o.rating && o.rating <= 2).length || ''; },
    render() {
      const s = DV.state, f = A.ui.revF;
      const all = s.orders.filter((o) => o.rating);
      const list = all.filter((o) => (!f.restaurant || o.restaurantId === f.restaurant) &&
        (!f.stars || (f.stars === 'low' ? o.rating <= 2 : o.rating === +f.stars))).sort((a, b) => b.date.localeCompare(a.date) || a.rating - b.rating);
      const avg = all.length ? sum(all, (o) => o.rating) / all.length : 0;
      const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: all.filter((o) => o.rating === n).length }));
      const perR = s.restaurants.map((r) => { const rs = all.filter((o) => o.restaurantId === r.id); return { r, n: rs.length, avg: rs.length ? sum(rs, (o) => o.rating) / rs.length : 0 }; }).filter((x) => x.n);
      const withComment = all.filter((o) => o.comment).length;
      return `
      <div class="page-h"><div><h1>التقييمات</h1><p class="muted">كل الطلبات المقيَّمة من العملاء — <span class="num">${all.length}</span> تقييم، <span class="num">${withComment}</span> مع تعليق</p></div></div>
      <div class="grid g-1-2">
        <section class="card panel">
          <div class="rev-big"><div class="num">${avg.toFixed(2)}</div>${stars(avg)}<p class="muted small">متوسط كل التقييمات</p></div>
          <div class="rev-dist">${dist.map((d) => `<div class="rd-row"><span class="num">${d.n}★</span>${A.bar(all.length ? (d.c / all.length) * 100 : 0, d.n <= 2 ? 'var(--danger)' : d.n === 3 ? 'var(--warn)' : '')}<b class="num">${d.c}</b></div>`).join('')}</div>
        </section>
        <section class="card panel">
          <div class="panel-h"><h3>حسب المطعم</h3></div>
          ${A.hbars(perR.map((x) => ({ label: x.r.name, value: Math.round(x.avg * 100) / 100, color: x.r.color, dot: true, sub: `${x.n} تقييم` })), { fmt: (v) => v.toFixed(2) + '★' })}
        </section>
      </div>
      <div class="toolbar card">
        <select class="select sm" data-change="rev-f" data-k="stars">${opt('', 'كل التقييمات', f.stars)}${opt('low', '⚠ منخفضة (١–٢)', f.stars)}${[5, 4, 3, 2, 1].map((n) => opt(n, `${n} نجوم`, f.stars)).join('')}</select>
        <select class="select sm" data-change="rev-f" data-k="restaurant">${opt('', 'كل المطاعم', f.restaurant)}${s.restaurants.map((r) => opt(r.id, r.name, f.restaurant)).join('')}</select>
        <div class="grow"></div><span class="muted small"><span class="num">${list.length}</span> نتيجة</span>
      </div>
      <div class="card">${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ</th><th>التقييم</th><th>التعليق</th><th>الوجبة</th><th>المطعم</th><th>العميل</th><th>الطلب</th></tr></thead><tbody>
        ${list.map((o) => { const m = DV.meal(o.mealId); return `<tr class="${o.rating <= 2 ? 'row-bad' : ''}">
          <td class="small">${fdate(o.date)}</td><td>${stars(o.rating)}</td>
          <td class="small">${o.comment ? `“${esc(o.comment)}”` : '<span class="muted">—</span>'}</td>
          <td>${m ? `<div class="row"><img class="thumb" src="${esc(m.img)}" alt="" loading="lazy"><span>${esc(L(m.name))}</span></div>` : '—'}</td>
          <td><i class="dot" style="background:${restColor(o.restaurantId)}"></i> ${esc(restName(o.restaurantId))}</td>
          <td><button class="link" data-action="open-customer" data-id="${o.customerId}">${esc(custName(o.customerId))}</button></td>
          <td><button class="link num" data-action="goto-order" data-id="${o.id}">${esc(o.no)}</button></td></tr>`; }).join('')}
        </tbody></table></div>` : empty('⭐', 'لا توجد تقييمات مطابقة')}</div>`;
    }
  };
  A.chg['rev-f'] = (el) => { A.ui.revF[el.dataset.k] = el.value; A.render(); };
})();
