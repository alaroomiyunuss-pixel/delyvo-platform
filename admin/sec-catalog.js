/* Delyvo admin — Restaurants, Meals catalogue, Plans & pricing, Marketing, Settings */
(function () {
  const A = window.ADM;
  const { t, M, cutoffLabel, esc, L, money, num, sum, fdate, stars, avatar, opt, empty, toast, round2, field, trio, trioArea, readTrio, sw, togChip, weekdays } = A;
  const draft = (k, d = '') => (A.ui.drafts[k] ?? d);
  const sameMonth = (iso) => { const n = new Date(); const d = DV.fromISO(iso); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); };

  // =====================================================================================
  // RESTAURANTS
  // =====================================================================================
  A.restaurantStats = function (r) {
    const s = DV.state, td = DV.today();
    const orders = s.orders.filter((o) => o.restaurantId === r.id);
    const meals = s.meals.filter((m) => m.restaurantId === r.id);
    const rated = orders.filter((o) => o.rating);
    const monthDelivered = orders.filter((o) => o.status === 'delivered' && sameMonth(o.date)).length;
    return {
      meals: meals.length, activeMeals: meals.filter((m) => m.active).length,
      today: orders.filter((o) => o.date === td && o.status !== 'cancelled').length,
      todayReady: orders.filter((o) => o.date === td && ['ready', 'picked', 'on_way', 'delivered'].includes(o.status)).length,
      upcoming: orders.filter((o) => o.date > td && o.status !== 'cancelled').length,
      avg: rated.length ? sum(rated, (o) => o.rating) / rated.length : 0, rated: rated.length,
      monthDelivered, payout: round2(monthDelivered * (r.costPerMeal || 0))
    };
  };

  A.sections.restaurants = {
    get title() { return t('nav.restaurants'); }, icon: 'store',
    render() {
      const s = DV.state;
      const stats = s.restaurants.map((r) => ({ r, st: A.restaurantStats(r) }));
      const totalPayout = sum(stats, (x) => x.st.payout);
      const totalMeals = sum(stats, (x) => x.st.monthDelivered);
      return `
      <div class="page-h"><div><h1>${esc(t('nav.restaurants'))}</h1><p class="muted">${esc(t('rest.sub'))}</p></div>
        <button class="btn btn-primary btn-sm" data-action="rest-edit">+ ${esc(t('rest.new'))}</button></div>
      <div class="kpis kpis-3">
        <div class="kpi card"><div class="kpi-top"><span class="kpi-l">${esc(t('rest.kpi.active'))}</span><span class="kpi-ic">🍳</span></div><div class="kpi-v">${num(s.restaurants.filter((r) => r.active).length)}<small class="muted"> / ${num(s.restaurants.length)}</small></div></div>
        <div class="kpi card"><div class="kpi-top"><span class="kpi-l">${esc(t('rest.kpi.delivered'))}</span><span class="kpi-ic">📦</span></div><div class="kpi-v">${num(totalMeals)}</div></div>
        <div class="kpi card kpi-brand"><div class="kpi-top"><span class="kpi-l">${esc(t('rest.kpi.payout'))}</span><span class="kpi-ic">💶</span></div><div class="kpi-v">${money(totalPayout)}</div><div class="kpi-s">${esc(t('rest.kpi.payoutSub'))}</div></div>
      </div>
      <div class="rgrid">${stats.map(({ r, st }) => `
        <article class="card rcard ${r.active ? '' : 'off'}" style="--rc:${r.color || '#1FA06B'}">
          <header class="rc-h">
            ${avatar(r.name, r.color)}
            <div class="grow"><h3>${esc(r.name)}</h3><p class="small muted">${esc(L(r.cuisine))} · <span class="lat">${esc(r.city)}</span></p></div>
            <label class="switch" title="${esc(r.active ? t('subst.active') : t('subst.paused'))}"><input type="checkbox" data-change="rest-active" data-id="${r.id}" ${r.active ? 'checked' : ''}><i></i></label>
          </header>
          ${r.active ? '' : `<div class="rc-off">${esc(t('rest.offNote'))}</div>`}
          <div class="rc-contact small"><span>👤 ${esc(r.contact || '—')}</span><span class="num" dir="ltr">${esc(r.phone || '')}</span><span class="lat muted ellipsis">${esc(r.address || '')}</span></div>
          <div class="rc-stats">
            <div><small>${esc(t('rest.cost'))}</small><b>${money(r.costPerMeal)}</b></div>
            <div><small>${esc(t('nav.meals'))}</small><b class="num">${st.activeMeals}<small class="muted">/${st.meals}</small></b></div>
            <div><small>${esc(t('rest.todayOrders'))}</small><b class="num">${st.today}<small class="muted"> · ${esc(t('dash.nReady', { n: st.todayReady }))}</small></b></div>
            <div><small>${esc(t('rev.th.rating'))}</small><b>${st.rated ? `<span class="num">${st.avg.toFixed(2)}</span> ★` : '—'}<small class="muted num"> (${st.rated})</small></b></div>
            <div><small>${esc(t('rest.monthDelivered'))}</small><b class="num">${st.monthDelivered}</b></div>
            <div><small>${esc(t('rest.monthPayout'))}</small><b class="brand-t">${money(st.payout)}</b></div>
          </div>
          <footer class="rc-f">
            <button class="btn btn-ghost btn-xs" data-action="rest-meals" data-id="${r.id}">${esc(t('nav.meals'))}</button>
            <button class="btn btn-ghost btn-xs" data-action="rest-today" data-id="${r.id}">${esc(t('rest.todayOrders'))}</button>
            <div class="grow"></div>
            <span class="tiny muted">PIN <span class="num">${esc(r.pin || '')}</span></span>
            <button class="btn btn-outline btn-xs" data-action="rest-edit" data-id="${r.id}">${esc(t('common.edit'))}</button>
          </footer>
        </article>`).join('')}</div>`;
    }
  };
  A.chg['rest-active'] = (el) => {
    const r = DV.restaurant(el.dataset.id);
    const st = A.restaurantStats(r);
    if (!el.checked && !confirm(t('rest.pauseConfirm', { name: r.name }) + (st.upcoming ? '\n' + t('rest.pauseUpcoming', { n: st.upcoming }) : ''))) { el.checked = true; return; }
    DV.commit((s) => {
      const x = s.restaurants.find((y) => y.id === r.id); x.active = el.checked;
      A.note(s, 'restaurant:' + r.id, { icon: el.checked ? '✅' : '⏸️', title: el.checked ? DV.tri('تم تفعيل مطعمك في Delyvo', 'Je restaurant is actief op Delyvo', 'Your restaurant is live on Delyvo') : DV.tri('تم إيقاف مطعمك مؤقتاً', 'Je restaurant is tijdelijk gepauzeerd', 'Your restaurant is temporarily paused'), body: el.checked ? DV.tri('وجباتك ظاهرة للعملاء من جديد', 'Je gerechten zijn weer zichtbaar voor klanten', 'Your meals are visible to customers again') : DV.tri('تواصل مع إدارة Delyvo', 'Neem contact op met Delyvo', 'Please contact Delyvo') });
    });
    toast(el.checked ? t('rest.t.activated') : t('rest.t.paused'), r.name, el.checked ? '✅' : '⏸️');
  };
  A.act['rest-meals'] = (el) => { A.ui.mealF = { restaurant: el.dataset.id, plan: '', slot: '', active: '', q: '' }; A.go('meals'); };
  A.act['rest-today'] = (el) => { A.ui.opsDate = DV.today(); Object.keys(A.ui.opsF).forEach((k) => { A.ui.opsF[k] = ''; }); A.ui.opsF.restaurant = el.dataset.id; A.ui.opsGroup = 'restaurant'; A.go('operations'); };
  A.act['rest-edit'] = (el) => {
    const isNew = !el.dataset.id;
    const r = isNew ? { name: '', cuisine: '', city: 'Rotterdam', address: '', phone: '', contact: '', pin: String(1000 + Math.floor(Math.random() * 9000)), active: true, costPerMeal: 6.5, color: '#1FA06B' } : DV.restaurant(el.dataset.id);
    A.modal({
      title: isNew ? t('rest.newTitle') : `${t('common.edit')} — ${r.name}`,
      body: `<div class="grid2">
        ${field(t('rest.f.name'), A.input('name', r.name))}
        ${field(t('rest.f.cuisine'), A.input('cuisine', L(r.cuisine), `placeholder="${esc(t('rest.f.cuisinePh'))}"`))}
        ${field(t('cust.th.city'), `<select class="select" name="city">${[...new Set([r.city, ...DV.state.zones.map((z) => z.city)])].map((c) => opt(c, c, r.city)).join('')}</select>`)}
        ${field(t('sub.address'), A.input('address', r.address, 'dir="ltr"'))}
        ${field(t('cust.th.phone'), A.input('phone', r.phone, 'dir="ltr" class="input num"'))}
        ${field(t('rest.f.contact'), A.input('contact', r.contact))}
        ${field(t('rest.f.cost'), A.input('costPerMeal', r.costPerMeal, 'type="number" step="0.05" min="0" class="input num"'))}
        ${field(t('rest.f.pin'), A.input('pin', r.pin, 'inputmode="numeric" class="input num"'))}
        ${field(t('rest.f.color'), `<input type="color" class="input color" name="color" value="${esc(r.color || '#1FA06B')}">`)}
        <label class="row sw-row" style="align-self:end">${sw('active', r.active)}<span>${esc(t('rest.f.active'))}</span></label>
      </div>`,
      onSave(form) {
        const name = A.fv(form, 'name'); if (!name) return A.invalid(form, 'name', t('rest.t.nameReq'));
        const cost = A.fn(form, 'costPerMeal'); if (!(cost > 0)) return A.invalid(form, 'costPerMeal', t('rest.t.costBad'));
        const cv = A.fv(form, 'cuisine'); // keep other languages when editing a multilingual cuisine label
        const patch = { name, cuisine: r.cuisine && typeof r.cuisine === 'object' ? { ...r.cuisine, [A.lang()]: cv } : cv, city: A.fv(form, 'city'), address: A.fv(form, 'address'), phone: A.fv(form, 'phone'), contact: A.fv(form, 'contact'),
          costPerMeal: cost, pin: A.fv(form, 'pin') || '1234', color: A.fv(form, 'color'), active: A.fbool(form, 'active') };
        DV.commit((s) => {
          if (isNew) s.restaurants.push({ id: 'r' + Date.now(), ...patch });
          else Object.assign(s.restaurants.find((x) => x.id === r.id), patch);
        });
        toast(isNew ? t('rest.t.added') : t('rest.t.saved'), name, '🍳');
      }
    });
  };

  // =====================================================================================
  // MEALS CATALOGUE
  // =====================================================================================
  const planChip = (id) => { const p = DV.planType(id) || {}; return `<span class="chip xs" style="background:${p.color}1a;color:${p.color}">${p.icon || ''} ${esc(L(p.name))}</span>`; };
  const margins = (m, rid = m.restaurantId, plans = m.plans) => {
    const r = DV.restaurant(rid) || { costPerMeal: 0 };
    return plans.map((pid) => { const p = DV.planType(pid); return p ? { p, v: round2(p.pricePerMeal - r.costPerMeal) } : null; }).filter(Boolean);
  };
  const marginHtml = (list) => list.length ? list.map((x) => `<span class="mg ${x.v < 3 ? 'low' : ''}" title="${esc(L(x.p.name))}: ${esc(M(x.p.pricePerMeal))} − ${esc(t('meal.restCost'))}">${x.p.icon} ${money(x.v)}</span>`).join('') : '<span class="muted">—</span>';

  A.sections.meals = {
    get title() { return t('nav.meals'); }, icon: 'meal',
    render() {
      const s = DV.state, f = A.ui.mealF, q = f.q.trim().toLowerCase();
      const list = s.meals.filter((m) => (!f.restaurant || m.restaurantId === f.restaurant) && (!f.plan || m.plans.includes(f.plan)) && (!f.slot || m.slots.includes(f.slot)) &&
        (!f.active || (f.active === 'on' ? m.active : !m.active)) &&
        (!q || ['ar', 'nl', 'en'].some((l) => DV.L(m.name, l).toLowerCase().includes(q))));
      return `
      <div class="page-h"><div><h1>${esc(t('meal.catalog'))}</h1><p class="muted">${t('meal.sub', { n: `<span class="num">${s.meals.filter((m) => m.active).length}</span>`, of: `<span class="num">${s.meals.length}</span>` })}</p></div>
        <button class="btn btn-primary btn-sm" data-action="meal-edit">+ ${esc(t('meal.new'))}</button></div>
      <div class="toolbar card">
        <div class="tb-search"><input class="input sm" placeholder="${esc(t('meal.searchPh'))}" value="${esc(f.q)}" data-input="meal-q" data-focus-key="meal-q"></div>
        <select class="select sm" data-change="meal-f" data-k="restaurant">${opt('', t('f.allRest'), f.restaurant)}${s.restaurants.map((r) => opt(r.id, r.name, f.restaurant)).join('')}</select>
        <select class="select sm" data-change="meal-f" data-k="plan">${opt('', t('f.allPlans'), f.plan)}${s.plans.types.map((p) => opt(p.id, `${p.icon} ${L(p.name)}`, f.plan)).join('')}</select>
        <select class="select sm" data-change="meal-f" data-k="slot">${opt('', t('f.lunchDinner'), f.slot)}${opt('lunch', L(DV.SLOTS.lunch), f.slot)}${opt('dinner', L(DV.SLOTS.dinner), f.slot)}</select>
        <select class="select sm" data-change="meal-f" data-k="active">${opt('', t('common.all'), f.active)}${opt('on', t('meal.f.on'), f.active)}${opt('off', t('meal.f.off'), f.active)}</select>
        <div class="grow"></div><span class="muted small">${t('meal.nMeals', { n: `<span class="num">${list.length}</span>` })}</span>
      </div>
      <div class="card">${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${['rev.th.meal', 'meal.th.supplier', 'meal.th.plans', 'meal.th.slot', 'meal.th.nutrition', 'meal.th.allergens', 'rev.th.rating', 'meal.th.margin', 'meal.th.active'].map((k) => `<th>${esc(t(k))}</th>`).join('')}<th></th></tr></thead><tbody>
        ${list.map((m) => { const r = DV.restaurant(m.restaurantId) || {}; return `<tr class="${m.active && r.active !== false ? '' : 'row-off'}">
          <td><div class="row"><img class="thumb lg" src="${esc(m.img)}" alt="" loading="lazy"><div class="grow"><b>${esc(L(m.name))}</b><div class="tiny muted lat">${esc(DV.L(m.name, 'nl'))}</div>${m.tags.length ? `<div class="tags">${m.tags.map((tg) => `<span class="tag">${esc(DV.TAGS[tg] ? L(DV.TAGS[tg]) : tg)}</span>`).join('')}</div>` : ''}</div></div></td>
          <td><span class="row" style="gap:6px"><i class="dot" style="background:${r.color}"></i>${esc(r.name || '—')}</span>${r.active === false ? `<span class="chip xs chip-danger">${esc(t('meal.restPaused'))}</span>` : ''}<div class="tiny muted">${esc(t('meal.cost'))} ${money(r.costPerMeal)}</div></td>
          <td><div class="chips">${m.plans.map(planChip).join('')}</div></td>
          <td class="small nowrap">${m.slots.map((sl) => DV.SLOTS[sl].icon).join(' ')}</td>
          <td class="small num nowrap">${m.kcal} kcal<div class="tiny muted">P${m.protein} · C${m.carbs} · F${m.fat}</div></td>
          <td>${m.allergens.length ? `<div class="chips">${m.allergens.map((a) => `<span class="chip xs" title="${esc(DV.ALLERGENS[a] ? L(DV.ALLERGENS[a]) : a)}">${(DV.ALLERGENS[a] || {}).icon || ''} ${esc(DV.ALLERGENS[a] ? L(DV.ALLERGENS[a]) : a)}</span>`).join('')}</div>` : `<span class="chip xs chip-brand">${esc(t('meal.none'))}</span>`}</td>
          <td class="nowrap"><span class="num">${(m.rating || 0).toFixed(1)}</span> ★<div class="tiny muted num">(${m.ratingCount || 0})</div></td>
          <td class="nowrap">${marginHtml(margins(m))}</td>
          <td><span class="switch"><input type="checkbox" data-change="meal-active" data-id="${m.id}" ${m.active ? 'checked' : ''}><i></i></span></td>
          <td><button class="btn btn-ghost btn-xs" data-action="meal-edit" data-id="${m.id}">${esc(t('common.edit'))}</button></td>
        </tr>`; }).join('')}
      </tbody></table></div>` : empty('🍽️', t('meal.noMatch'))}</div>`;
    }
  };
  A.inp['meal-q'] = (el) => { A.ui.mealF.q = el.value; A.render(); };
  A.chg['meal-f'] = (el) => { A.ui.mealF[el.dataset.k] = el.value; A.render(); };
  A.chg['meal-active'] = (el) => {
    DV.commit((s) => { s.meals.find((m) => m.id === el.dataset.id).active = el.checked; });
    toast(el.checked ? t('meal.t.visible') : t('meal.t.hidden'), L(DV.meal(el.dataset.id).name), el.checked ? '👁️' : '🙈');
  };
  const imageLibrary = () => [...new Set(DV.state.meals.map((m) => m.img).concat(DV.state.banners.map((b) => b.img)).filter((x) => x && x.includes('/meals/')))].sort();
  const imagePicker = (current) => `
    <div class="imgpick">
      <div class="ip-prev"><img id="ip-prev" src="${esc(current || '')}" alt=""></div>
      <div class="grow">
        ${field(t('img.label'), `<input class="input lat" name="img" id="ip-url" value="${esc(current || '')}" dir="ltr" placeholder="${esc(t('img.ph'))}">`)}
        <div class="ip-grid">${imageLibrary().map((src) => `<button type="button" class="ip-i ${src === current ? 'on' : ''}" data-src="${esc(src)}" title="${esc(src.split('/').pop())}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>
      </div>
    </div>`;
  function wireImagePicker(form) {
    const url = form.querySelector('#ip-url'), prev = form.querySelector('#ip-prev');
    form.querySelector('.ip-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.ip-i'); if (!b) return;
      url.value = b.dataset.src; form.querySelectorAll('.ip-i').forEach((x) => x.classList.toggle('on', x === b));
      url.dispatchEvent(new Event('input', { bubbles: true }));
    });
    url.addEventListener('input', () => { prev.src = url.value; });
  }
  A.act['meal-edit'] = (el) => {
    const isNew = !el.dataset.id;
    const s = DV.state;
    const m = isNew ? { name: {}, desc: {}, ingredients: {}, restaurantId: A.ui.mealF.restaurant || s.restaurants[0].id, plans: A.ui.mealF.plan ? [A.ui.mealF.plan] : ['varied'], slots: ['lunch', 'dinner'], kcal: 600, protein: 35, carbs: 60, fat: 20, allergens: [], tags: [], img: imageLibrary()[0] || '', active: true } : DV.meal(el.dataset.id);
    A.modal({
      title: isNew ? t('meal.new') : `${t('common.edit')} — ${L(m.name)}`, wide: true,
      body: `
        ${trio(t('meal.f.name'), 'name', m.name)}
        ${trioArea(t('meal.f.desc'), 'desc', m.desc)}
        ${trio(t('meal.f.ingr'), 'ingr', m.ingredients)}
        <div class="grid2">
          ${field(t('meal.f.supplier'), `<select class="select" name="restaurantId">${s.restaurants.map((r) => opt(r.id, `${r.name} — ${t('meal.cost')} ${M(r.costPerMeal)}${r.active ? '' : ` (${t('subst.paused')})`}`, m.restaurantId)).join('')}</select>`)}
          <div class="field"><span>${esc(t('meal.f.margin'))}</span><div class="margin-box" id="mg-live"></div></div>
        </div>
        <div class="grid2">
          <div class="field"><span>${esc(t('meal.th.plans'))}</span><div class="chips">${s.plans.types.map((p) => togChip('plans', p.id, `${p.icon} ${esc(L(p.name))}`, m.plans.includes(p.id))).join('')}</div></div>
          <div class="field"><span>${esc(t('meal.th.slot'))}</span><div class="chips">${Object.keys(DV.SLOTS).map((sl) => togChip('slots', sl, `${DV.SLOTS[sl].icon} ${esc(L(DV.SLOTS[sl]))}`, m.slots.includes(sl))).join('')}</div></div>
        </div>
        <div class="grid4">
          ${field(t('meal.f.kcal'), A.input('kcal', m.kcal, 'type="number" min="0" class="input num"'))}
          ${field(t('meal.f.protein'), A.input('protein', m.protein, 'type="number" min="0" class="input num"'))}
          ${field(t('meal.f.carbs'), A.input('carbs', m.carbs, 'type="number" min="0" class="input num"'))}
          ${field(t('meal.f.fat'), A.input('fat', m.fat, 'type="number" min="0" class="input num"'))}
        </div>
        <div class="field"><span>${esc(t('meal.f.allergens'))}</span><div class="chips">${Object.keys(DV.ALLERGENS).map((a) => togChip('allergens', a, `${DV.ALLERGENS[a].icon} ${esc(L(DV.ALLERGENS[a]))}`, m.allergens.includes(a))).join('')}</div></div>
        <div class="field"><span>${esc(t('meal.f.tags'))}</span><div class="chips">${Object.keys(DV.TAGS).map((tg) => togChip('tags', tg, esc(L(DV.TAGS[tg])), m.tags.includes(tg))).join('')}</div></div>
        ${imagePicker(m.img)}
        <label class="row sw-row">${sw('active', m.active)}<span>${esc(t('meal.f.active'))}</span></label>`,
      onOpen: (form) => wireImagePicker(form),
      onInput(form) {
        const rid = A.fv(form, 'restaurantId'), plans = A.fchecks(form, 'plans');
        const box = form.querySelector('#mg-live');
        const r = DV.restaurant(rid) || {};
        box.innerHTML = plans.length ? margins({}, rid, plans).map((x) => `<div class="row between"><span>${x.p.icon} ${esc(L(x.p.name))} <small class="muted">${esc(M(x.p.pricePerMeal))} − ${esc(M(r.costPerMeal))}</small></span><b class="${x.v < 3 ? 'danger-t' : 'brand-t'}">${money(x.v)}</b></div>`).join('') : `<span class="muted small">${esc(t('meal.t.pickPlan'))}</span>`;
      },
      onSave(form) {
        const name = readTrio(form, 'name'); if (!name.ar) return A.invalid(form, 'name_ar', t('meal.t.nameArReq'));
        const plans = A.fchecks(form, 'plans'), slots = A.fchecks(form, 'slots');
        if (!plans.length) return A.invalid(form, 'x', t('meal.t.pickPlan'));
        if (!slots.length) return A.invalid(form, 'x', t('meal.t.pickSlot'));
        const img = A.fv(form, 'img'); if (!img) return A.invalid(form, 'img', t('meal.t.pickImg'));
        const patch = { name, desc: readTrio(form, 'desc'), ingredients: readTrio(form, 'ingr'), restaurantId: A.fv(form, 'restaurantId'), plans, slots,
          kcal: Math.round(A.fn(form, 'kcal')), protein: Math.round(A.fn(form, 'protein')), carbs: Math.round(A.fn(form, 'carbs')), fat: Math.round(A.fn(form, 'fat')),
          allergens: A.fchecks(form, 'allergens'), tags: A.fchecks(form, 'tags'), img, active: A.fbool(form, 'active') };
        DV.commit((st) => {
          if (isNew) st.meals.push({ id: 'm' + Date.now(), ...patch, rating: 0, ratingCount: 0, shelfDays: 2, reheat: { ar: 'سخّن في الميكروويف 2–3 دقائق', nl: 'Verwarm 2–3 min in de magnetron', en: 'Microwave 2–3 min' } });
          else {
            const x = st.meals.find((y) => y.id === m.id);
            const moved = x.restaurantId !== patch.restaurantId;
            Object.assign(x, patch);
            if (moved) { // re-route future orders of this meal to the new supplier
              const td = DV.today();
              st.orders.forEach((o) => { if (o.mealId === x.id && o.date > td && ['scheduled', 'accepted'].includes(o.status)) { o.restaurantId = x.restaurantId; o.status = 'scheduled'; o.printed = false; } });
            }
          }
        });
        toast(isNew ? t('meal.t.added') : t('meal.t.saved'), L(name), '🍽️');
      }
    });
  };

  // =====================================================================================
  // PLANS & PRICING
  // =====================================================================================
  A.sections.plans = {
    get title() { return t('nav.plans'); }, icon: 'tag',
    render() {
      const s = DV.state, P = s.plans;
      const matrix = P.types.map((pt) => `
        <tbody class="mx-g"><tr class="mx-h"><th colspan="${P.mealOptions.length + 1}">${pt.icon} ${esc(L(pt.name))} <small class="muted">· ${t('plan.perMealPrice', { p: money(pt.pricePerMeal) })}</small></th></tr>
        ${P.durations.map((d) => `<tr><td>${t('common.nDays', { n: `<b class="num">${d.days}</b>` })} <small class="muted">${esc(L(d.label))}</small></td>
          ${P.mealOptions.map((o) => { const pr = DV.price({ planType: pt.id, days: d.days, option: o.id, city: 'Rotterdam' }); return `<td>${pr ? `<b>${money(pr.total)}</b><div class="tiny muted">${money(pr.perMeal)} / ${esc(t('plan.meal'))}${pr.durDisc + pr.optDisc ? ` · ${t('plan.save', { a: money(pr.durDisc + pr.optDisc) })}` : ''}</div>` : '—'}</td>`; }).join('')}</tr>`).join('')}
        </tbody>`).join('');
      const avgCost = (pid) => { const ms = s.meals.filter((m) => m.active && m.plans.includes(pid)); return ms.length ? sum(ms, (m) => (DV.restaurant(m.restaurantId) || {}).costPerMeal || 0) / ms.length : 0; };
      return `
      <div class="page-h"><div><h1>${esc(t('nav.plans'))}</h1><p class="muted">${esc(t('plan.sub'))}</p></div></div>

      <div class="plan-grid">${P.types.map((pt, i) => { const cost = avgCost(pt.id); return `
        <section class="card panel plan-card" style="--pc:${pt.color}">
          <div class="panel-h"><div class="row"><span class="plan-ic">${pt.icon}</span><div><h3>${esc(L(pt.name))}</h3><p class="tiny muted">${t('meal.nMeals', { n: num(s.meals.filter((m) => m.active && m.plans.includes(pt.id)).length) })} · ${t('plan.nActiveSubs', { n: num(s.subscriptions.filter((x) => x.status === 'active' && x.planType === pt.id).length) })}</p></div></div></div>
          <div class="grid2">
            ${field(t('plan.f.price'), `<input class="input num big" type="number" step="0.05" min="0" value="${pt.pricePerMeal}" data-change="plan-type" data-i="${i}" data-k="pricePerMeal" data-num>`)}
            <div class="field"><span>${esc(t('plan.f.margin'))}</span><div class="margin-box"><b class="${pt.pricePerMeal - cost < 3 ? 'danger-t' : 'brand-t'}">${money(pt.pricePerMeal - cost)}</b><small class="muted"> ${t('plan.avgCost', { a: money(cost) })}</small></div></div>
          </div>
          <div class="grid3">
            ${['ar', 'nl', 'en'].map((l) => field(t('plan.f.name') + ' ' + l.toUpperCase(), `<input class="input ${l === 'ar' ? '' : 'lat'}" dir="${l === 'ar' ? 'rtl' : 'ltr'}" value="${esc(pt.name[l] || '')}" data-change="plan-type" data-i="${i}" data-k="name.${l}">`)).join('')}
          </div>
          ${['ar', 'nl', 'en'].map((l) => field(t('plan.f.desc') + ' ' + l.toUpperCase(), `<textarea class="textarea ${l === 'ar' ? '' : 'lat'}" rows="2" dir="${l === 'ar' ? 'rtl' : 'ltr'}" data-change="plan-type" data-i="${i}" data-k="desc.${l}">${esc(pt.desc[l] || '')}</textarea>`)).join('')}
          <div class="grid3">
            ${field(t('plan.f.icon'), `<input class="input" value="${esc(pt.icon)}" data-change="plan-type" data-i="${i}" data-k="icon">`)}
            ${field(t('plan.f.kcal'), `<input class="input num" dir="ltr" value="${esc(pt.kcal || '')}" data-change="plan-type" data-i="${i}" data-k="kcal">`)}
            ${field(t('plan.f.color'), `<input type="color" class="input color" value="${esc(pt.color)}" data-change="plan-type" data-i="${i}" data-k="color">`)}
          </div>
        </section>`; }).join('')}</div>

      <div class="grid g-1-1">
        <section class="card panel">
          <div class="panel-h"><div><h3>${esc(t('plan.durDiscounts'))}</h3><p class="muted small">${esc(t('plan.durDiscountsSub'))}</p></div></div>
          <table class="tbl plain"><thead><tr><th>${esc(t('sub.duration'))}</th><th>${esc(t('plan.discountPct'))}</th><th>${esc(t('plan.badgeAr'))}</th><th>NL</th><th>EN</th></tr></thead><tbody>
          ${P.durations.map((d, i) => `<tr><td>${t('common.nDays', { n: `<b class="num">${d.days}</b>` })}</td>
            <td><input class="input sm num w80" type="number" step="0.5" min="0" max="90" value="${round2(d.discount * 100)}" data-change="plan-dur" data-i="${i}" data-k="discount" data-pct></td>
            <td><input class="input sm" value="${esc(d.label.ar || '')}" data-change="plan-dur" data-i="${i}" data-k="label.ar"></td>
            <td><input class="input sm lat" dir="ltr" value="${esc(d.label.nl || '')}" data-change="plan-dur" data-i="${i}" data-k="label.nl"></td>
            <td><input class="input sm lat" dir="ltr" value="${esc(d.label.en || '')}" data-change="plan-dur" data-i="${i}" data-k="label.en"></td></tr>`).join('')}
          </tbody></table>
        </section>
        <section class="card panel">
          <div class="panel-h"><div><h3>${esc(t('plan.mealOptions'))}</h3><p class="muted small">${esc(t('plan.mealOptionsSub'))}</p></div></div>
          <table class="tbl plain"><thead><tr><th>${esc(t('plan.option'))}</th><th>${esc(t('plan.discountPct'))}</th><th>${esc(t('plan.mealsPerDay'))}</th></tr></thead><tbody>
          ${P.mealOptions.map((o, i) => `<tr><td>${o.icon} ${esc(L(o.name))}</td>
            <td><input class="input sm num w80" type="number" step="0.5" min="0" max="90" value="${round2(o.discount * 100)}" data-change="plan-opt" data-i="${i}" data-k="discount" data-pct></td>
            <td class="num">${o.slots.length}</td></tr>`).join('')}
          </tbody></table>
          <p class="tiny muted" style="margin-top:10px">${t('plan.vatNote', { v: `<span class="num">${round2(s.settings.vatRate * 100)}%</span>` })}</p>
        </section>
      </div>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('plan.preview'))}</h3><p class="muted small">${esc(t('plan.previewSub'))}</p></div></div>
        <div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>${esc(t('sub.duration'))}</th>${P.mealOptions.map((o) => `<th>${o.icon} ${esc(L(o.name))}</th>`).join('')}</tr></thead>${matrix}</table></div>
      </section>`;
    }
  };
  function setPath(obj, path, val) { const ks = path.split('.'); const last = ks.pop(); let o = obj; ks.forEach((k) => { o = o[k] = o[k] || {}; }); o[last] = val; }
  function readVal(el) {
    if (el.hasAttribute('data-pct')) { const v = parseFloat(el.value); return isNaN(v) ? null : Math.max(0, Math.min(90, v)) / 100; }
    if (el.hasAttribute('data-num')) { const v = parseFloat(el.value); return isNaN(v) || v < 0 ? null : round2(v); }
    return el.value.trim();
  }
  const planChange = (coll) => (el) => {
    const v = readVal(el);
    if (v === null || v === '') { toast(t('common.badValue'), '', '⚠️'); A.render(); return; }
    DV.commit((s) => setPath(s.plans[coll][+el.dataset.i], el.dataset.k, v));
    toast(t('common.saved'), t('plan.t.updated'), '💾');
  };
  A.chg['plan-type'] = planChange('types');
  A.chg['plan-dur'] = planChange('durations');
  A.chg['plan-opt'] = planChange('mealOptions');

  // =====================================================================================
  // MARKETING — banners, promo codes, broadcast
  // =====================================================================================
  const bannerCard = (b, lang = 'ar') => `<div class="bn-prev ${lang === 'ar' ? '' : 'ltr'}" style="--bc:${esc(b.color || '#0B5D3B')}">
      <img src="${esc(b.img || '')}" alt="" onerror="this.style.visibility='hidden'"><div class="bn-shade"></div>
      <div class="bn-txt" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><b>${esc(DV.L(b.title, lang))}</b><small>${esc(DV.L(b.sub, lang))}</small></div></div>`;

  A.sections.marketing = {
    get title() { return t('nav.marketing'); }, icon: 'mega',
    render() {
      const s = DV.state;
      const bc = { target: draft('bc.target', 'customers'), title_ar: draft('bc.title_ar'), title_nl: draft('bc.title_nl'), title_en: draft('bc.title_en'), body_ar: draft('bc.body_ar'), body_nl: draft('bc.body_nl'), body_en: draft('bc.body_en') };
      const tgtCount = { customers: s.customers.length, drivers: s.drivers.length, restaurants: s.restaurants.length };
      return `
      <div class="page-h"><div><h1>${esc(t('nav.marketing'))}</h1><p class="muted">${esc(t('mkt.sub'))}</p></div></div>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('mkt.banners'))}</h3><p class="muted small">${t('mkt.bannersSub', { n: `<span class="num">${s.banners.filter((b) => b.active).length}</span>`, of: `<span class="num">${s.banners.length}</span>` })}</p></div><button class="btn btn-primary btn-sm" data-action="banner-edit">+ ${esc(t('mkt.newBanner'))}</button></div>
        <div class="bn-grid">${s.banners.length ? s.banners.map((b, i) => `
          <div class="bn-item ${b.active ? '' : 'off'}">
            ${bannerCard(b, A.lang())}
            <div class="bn-bar">
              <span class="num tiny muted">#${i + 1}</span>
              <button class="icon-btn xs" data-action="banner-move" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} title="${esc(t('mkt.moveUp'))}">▲</button>
              <button class="icon-btn xs" data-action="banner-move" data-i="${i}" data-d="1" ${i === s.banners.length - 1 ? 'disabled' : ''} title="${esc(t('mkt.moveDown'))}">▼</button>
              <div class="grow"></div>
              <span class="switch sm"><input type="checkbox" data-change="banner-active" data-id="${b.id}" ${b.active ? 'checked' : ''}><i></i></span>
              <button class="btn btn-ghost btn-xs" data-action="banner-edit" data-id="${b.id}">${esc(t('common.edit'))}</button>
            </div>
          </div>`).join('') : empty('🖼️', t('mkt.noBanners'))}</div>
      </section>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('mkt.promos'))}</h3><p class="muted small">${esc(t('mkt.promosSub'))}</p></div><button class="btn btn-primary btn-sm" data-action="promo-edit">+ ${esc(t('mkt.newPromo'))}</button></div>
        ${s.promos.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${['sub.th.code', 'mkt.th.type', 'mkt.th.value', 'mkt.th.uses', 'mkt.th.note', 'mkt.th.active'].map((k) => `<th>${esc(t(k))}</th>`).join('')}<th></th></tr></thead><tbody>
          ${s.promos.map((p) => `<tr class="${p.active ? '' : 'row-off'}"><td><code class="code num">${esc(p.code)}</code></td><td>${esc(p.type === 'percent' ? t('mkt.percent') : t('mkt.fixed'))}</td>
            <td><b class="num">${p.type === 'percent' ? p.value + '%' : esc(M(p.value))}</b></td><td class="num">${p.uses || 0}</td><td class="small muted">${esc(L(p.note) || '')}</td>
            <td><span class="switch"><input type="checkbox" data-change="promo-active" data-code="${esc(p.code)}" ${p.active ? 'checked' : ''}><i></i></span></td>
            <td><button class="btn btn-ghost btn-xs" data-action="promo-edit" data-code="${esc(p.code)}">${esc(t('common.edit'))}</button></td></tr>`).join('')}
        </tbody></table></div>` : empty('🏷️', t('mkt.noPromos'))}
      </section>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('mkt.broadcast'))}</h3><p class="muted small">${esc(t('mkt.broadcastSub'))}</p></div></div>
        <div class="bc-grid">
          <div class="stack">
            <div class="seg">${[['customers', '👥 ' + t('mkt.allCustomers')], ['drivers', '🛵 ' + t('mkt.allDrivers')], ['restaurants', '🍳 ' + t('mkt.allRestaurants')]].map(([k, l]) => `<button class="${bc.target === k ? 'on' : ''}" data-action="bc-target" data-v="${k}">${l} <span class="num muted">${tgtCount[k]}</span></button>`).join('')}</div>
            ${bc.target === 'customers' ? `
              ${trioDraft(t('mkt.f.title'), 'title', bc)}
              ${trioDraft(t('mkt.f.body'), 'body', bc, true)}
              <p class="tiny muted">${esc(t('mkt.langNote'))}</p>` : `
              ${field(t('mkt.f.title'), `<input class="input" value="${esc(bc.title_ar)}" data-input="draft" data-k="bc.title_ar" data-focus-key="bc.title_ar">`)}
              ${field(t('mkt.f.body'), `<textarea class="textarea" rows="3" data-input="draft" data-k="bc.body_ar" data-focus-key="bc.body_ar">${esc(bc.body_ar)}</textarea>`)}`}
            <div class="row"><div class="grow"></div><button class="btn btn-primary" data-action="bc-send">📣 ${t('mkt.sendTo.' + bc.target, { n: num(tgtCount[bc.target]) })}</button></div>
          </div>
          <div class="bc-phone"><div class="bcp-notif"><span class="bcp-ic">📣</span><div class="grow"><b>${esc(bc.title_ar || t('mkt.previewTitle'))}</b><small>${esc(bc.body_ar || t('mkt.previewBody'))}</small></div><span class="tiny muted">${esc(t('ago.now'))}</span></div><p class="tiny muted" style="text-align:center;margin-top:10px">${esc(t('mkt.preview'))}</p></div>
        </div>
      </section>`;
    }
  };
  function trioDraft(label, name, bc, area) {
    const one = (l) => { const k = `bc.${name}_${l}`; const dir = l === 'ar' ? 'rtl' : 'ltr';
      return `<label class="field"><span>${esc(t('lang.' + l))}</span>${area
        ? `<textarea class="textarea ${l === 'ar' ? '' : 'lat'}" rows="2" dir="${dir}" data-input="draft" data-k="${k}" data-focus-key="${k}">${esc(bc[name + '_' + l])}</textarea>`
        : `<input class="input ${l === 'ar' ? '' : 'lat'}" dir="${dir}" value="${esc(bc[name + '_' + l])}" data-input="draft" data-k="${k}" data-focus-key="${k}">`}</label>`; };
    return `<div class="trio"><div class="trio-l">${esc(label)}</div><div class="trio-g">${one('ar')}${one('nl')}${one('en')}</div></div>`;
  }
  A.inp.draft = (el) => {
    A.ui.drafts[el.dataset.k] = el.value;
    if (el.dataset.k === 'bc.title_ar' || el.dataset.k === 'bc.body_ar') { // update preview without a full re-render
      const box = document.querySelector('.bcp-notif');
      if (box) { box.querySelector('b').textContent = draft('bc.title_ar') || t('mkt.previewTitle'); box.querySelector('small').textContent = draft('bc.body_ar') || t('mkt.previewBody'); }
    }
  };
  A.act['bc-target'] = (el) => { A.ui.drafts['bc.target'] = el.dataset.v; A.render(); };
  A.act['bc-send'] = () => {
    const target = draft('bc.target', 'customers');
    const tt = { ar: draft('bc.title_ar').trim(), nl: draft('bc.title_nl').trim(), en: draft('bc.title_en').trim() };
    const b = { ar: draft('bc.body_ar').trim(), nl: draft('bc.body_nl').trim(), en: draft('bc.body_en').trim() };
    if (!tt.ar && !tt.nl && !tt.en) { toast(t('mkt.t.titleArReq'), '', '⚠️'); return; }
    if (!confirm(t('mkt.sendConfirm'))) return;
    // every audience gets all three languages; empty ones fall back to whatever was filled in
    const fill = (x) => ({ ar: x.ar || x.en || x.nl, nl: x.nl || x.en || x.ar, en: x.en || x.nl || x.ar });
    const title = fill(tt), body = fill(b);
    const n = DV.broadcast(target, title, body);
    ['title_ar', 'title_nl', 'title_en', 'body_ar', 'body_nl', 'body_en'].forEach((k) => { delete A.ui.drafts['bc.' + k]; });
    A.render();
    toast(t('mkt.t.sent', { n }), tt.ar, '📣');
  };

  A.chg['banner-active'] = (el) => { DV.commit((s) => { s.banners.find((b) => b.id === el.dataset.id).active = el.checked; }); toast(el.checked ? t('mkt.t.bannerOn') : t('mkt.t.bannerOff'), '', '🖼️'); };
  A.act['banner-move'] = (el) => {
    const i = +el.dataset.i, j = i + +el.dataset.d;
    DV.commit((s) => { if (j < 0 || j >= s.banners.length) return; const [b] = s.banners.splice(i, 1); s.banners.splice(j, 0, b); });
  };
  A.act['banner-edit'] = (el) => {
    const isNew = !el.dataset.id;
    const b = isNew ? { id: 'b' + Date.now(), active: true, img: imageLibrary()[0] || '', color: '#0B5D3B', title: {}, sub: {} } : JSON.parse(JSON.stringify(DV.state.banners.find((x) => x.id === el.dataset.id)));
    A.modal({
      title: isNew ? t('mkt.newBanner') : t('mkt.editBanner'), wide: true,
      body: `<div class="bn-edit">
        <div class="grow stack">
          ${trio(t('mkt.f.title'), 'title', b.title)}
          ${trio(t('mkt.f.subtitle'), 'sub', b.sub)}
          <div class="grid2">${field(t('mkt.f.bg'), `<input type="color" class="input color" name="color" value="${esc(b.color)}">`)}<label class="row sw-row" style="align-self:end">${sw('active', b.active)}<span>${esc(t('mkt.f.visible'))}</span></label></div>
          ${imagePicker(b.img)}
        </div>
        <div class="bn-live"><div class="tiny muted">${esc(t('mkt.livePreview'))}</div><div id="bn-live-ar"></div><div id="bn-live-nl"></div></div>
      </div>`,
      danger: isNew ? null : { label: t('mkt.deleteBanner'), onClick: () => { if (!confirm(t('mkt.deleteBannerConfirm'))) return false; DV.commit((s) => { s.banners = s.banners.filter((x) => x.id !== b.id); }); toast(t('mkt.t.bannerDeleted'), '', '🗑️'); } },
      onOpen: (form) => wireImagePicker(form),
      onInput(form) {
        const cur = { img: A.fv(form, 'img'), color: A.fv(form, 'color'), title: readTrio(form, 'title'), sub: readTrio(form, 'sub') };
        if (!cur.title.ar) cur.title = { ar: I18N.tIn('ar', 'mkt.bannerTitlePh'), nl: 'Titel', en: 'Title' };
        form.querySelector('#bn-live-ar').innerHTML = bannerCard(cur, 'ar');
        form.querySelector('#bn-live-nl').innerHTML = bannerCard(cur, 'nl');
      },
      onSave(form) {
        const title = readTrio(form, 'title'); if (!title.ar) return A.invalid(form, 'title_ar', t('mkt.t.bannerTitleReq'));
        const patch = { title, sub: readTrio(form, 'sub'), color: A.fv(form, 'color'), img: A.fv(form, 'img'), active: A.fbool(form, 'active') };
        DV.commit((s) => { if (isNew) s.banners.push({ id: b.id, ...patch }); else Object.assign(s.banners.find((x) => x.id === b.id), patch); });
        toast(isNew ? t('mkt.t.bannerAdded') : t('mkt.t.bannerSaved'), L(title), '🖼️');
      }
    });
  };

  A.chg['promo-active'] = (el) => { DV.commit((s) => { s.promos.find((p) => p.code === el.dataset.code).active = el.checked; }); toast(el.checked ? t('mkt.t.promoOn') : t('mkt.t.promoOff'), el.dataset.code, '🏷️'); };
  A.act['promo-edit'] = (el) => {
    const isNew = !el.dataset.code;
    const p = isNew ? { code: '', type: 'percent', value: 10, active: true, uses: 0, note: '' } : DV.state.promos.find((x) => x.code === el.dataset.code);
    A.modal({
      title: isNew ? t('mkt.newPromoTitle') : `${t('common.edit')} ${p.code}`,
      body: `<div class="grid2">
        ${field(t('sub.th.code'), A.input('code', p.code, 'dir="ltr" class="input num upper" placeholder="ZOMER15"'))}
        ${field(t('mkt.th.type'), `<select class="select" name="type">${opt('percent', t('mkt.percent') + ' %', p.type)}${opt('fixed', t('mkt.fixed') + ' €', p.type)}</select>`)}
        ${field(t('mkt.th.value'), A.input('value', p.value, 'type="number" step="0.5" min="0" class="input num"'))}
        ${field(t('mkt.f.internalNote'), A.input('note', L(p.note)))}
        </div><label class="row sw-row">${sw('active', p.active)}<span>${esc(t('subst.active'))}</span></label>
        ${isNew ? '' : `<p class="tiny muted">${t('mkt.usedN', { n: `<span class="num">${p.uses || 0}</span>` })}</p>`}`,
      danger: isNew ? null : { label: t('mkt.deletePromo'), onClick: () => { if (!confirm(t('common.deleteConfirm', { name: p.code }))) return false; DV.commit((s) => { s.promos = s.promos.filter((x) => x.code !== p.code); }); toast(t('mkt.t.promoDeleted'), p.code, '🗑️'); } },
      onSave(form) {
        const code = A.fv(form, 'code').toUpperCase().replace(/\s+/g, '');
        if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return A.invalid(form, 'code', t('mkt.t.codeBad'));
        if (DV.state.promos.some((x) => x.code === code && x.code !== p.code)) return A.invalid(form, 'code', t('mkt.t.codeExists'));
        const type = A.fv(form, 'type'), value = A.fn(form, 'value');
        if (!(value > 0) || (type === 'percent' && value > 100)) return A.invalid(form, 'value', t('common.badValue'));
        const nv = A.fv(form, 'note');
        const patch = { code, type, value, note: p.note && typeof p.note === 'object' ? { ...p.note, [A.lang()]: nv } : nv, active: A.fbool(form, 'active') };
        DV.commit((s) => { if (isNew) s.promos.push({ ...patch, uses: 0 }); else Object.assign(s.promos.find((x) => x.code === p.code), patch); });
        toast(isNew ? t('mkt.t.promoAdded') : t('mkt.t.promoSaved'), code, '🏷️');
      }
    });
  };

  // =====================================================================================
  // SETTINGS
  // =====================================================================================
  A.sections.settings = {
    get title() { return t('nav.settings'); }, icon: 'cog',
    render() {
      const st = DV.state.settings, zones = DV.state.zones;
      return `
      <div class="page-h"><div><h1>${esc(t('nav.settings'))}</h1><p class="muted">${esc(t('set.sub'))}</p></div></div>
      <div class="grid g-1-1">
        <section class="card panel">
          <div class="panel-h"><div><h3>${esc(t('set.rules'))}</h3><p class="muted small">${esc(t('set.rulesSub'))}</p></div></div>
          <div class="grid3">
            ${field(t('set.cutoff'), `<select class="select" data-change="set" data-k="cutoffHour" data-int data-min="0" data-max="24">${[...new Set([18, 20, 22, 24, +st.cutoffHour])].sort((a, b) => a - b).map((h) => opt(h, cutoffLabel(h), +st.cutoffHour)).join('')}</select>`)}
            ${field(t('set.minLead'), `<input class="input num" type="number" min="0" max="14" value="${st.minLeadDays}" data-change="set" data-k="minLeadDays" data-int data-min="0" data-max="14">`)}
            ${field(t('set.maxPostpones'), `<input class="input num" type="number" min="0" max="30" value="${st.maxPostpones}" data-change="set" data-k="maxPostpones" data-int data-min="0" data-max="30">`)}
          </div>
          <p class="tiny muted">${+st.cutoffHour === 24 ? esc(t('set.cutoffEx24')) : t('set.cutoffEx', { h: `<span class="num">${esc(cutoffLabel(st.cutoffHour))}</span>` })} ${esc(t('set.cutoffExTail'))}</p>
          <div class="hr"></div>
          <h4 class="sub-h">${esc(t('set.weekdays'))}</h4>
          <div class="chips">${weekdays().map((w, i) => `<label class="tchip"><input type="checkbox" data-change="set-weekday" value="${i}" ${st.deliveryWeekdays.includes(i) ? 'checked' : ''}><span>${esc(w)}</span></label>`).join('')}</div>
        </section>
        <section class="card panel">
          <div class="panel-h"><div><h3>${esc(t('set.finance'))}</h3></div></div>
          <div class="grid2">
            ${field(t('set.vat'), `<div class="suffix"><input class="input num" type="number" step="0.5" min="0" max="30" value="${round2(st.vatRate * 100)}" data-change="set" data-k="vatRate" data-pct><span>%</span></div>`)}
            ${field(t('set.whatsapp'), `<input class="input num" dir="ltr" value="${esc(st.supportWhatsapp || '')}" data-change="set" data-k="supportWhatsapp">`)}
          </div>
          <div class="hr"></div>
          <h4 class="sub-h">${esc(t('set.demo'))}</h4>
          <p class="small muted">${esc(t('set.demoSub'))}</p>
          <button class="btn btn-danger btn-sm" data-action="reset-demo" style="margin-top:10px">↺ ${esc(t('app.reset'))}</button>
        </section>
      </div>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('set.windows'))}</h3><p class="muted small">${esc(t('set.windowsSub'))}</p></div></div>
        <table class="tbl plain"><thead><tr><th>${esc(t('set.id'))}</th><th>${esc(t('lang.ar'))}</th><th>Nederlands</th><th>English</th></tr></thead><tbody>
        ${st.deliveryWindows.map((w, i) => `<tr><td><code class="code">${esc(w.id)}</code></td>${['ar', 'nl', 'en'].map((l) => `<td><input class="input sm ${l === 'ar' ? '' : 'lat'}" dir="${l === 'ar' ? 'rtl' : 'ltr'}" value="${esc(w.label[l] || '')}" data-change="set-window" data-i="${i}" data-l="${l}"></td>`).join('')}</tr>`).join('')}
        </tbody></table>
      </section>

      <section class="card panel">
        <div class="panel-h"><div><h3>${esc(t('set.zones'))}</h3><p class="muted small">${esc(t('set.zonesSub'))}</p></div></div>
        <table class="tbl plain"><thead><tr>${['cust.th.city', 'set.th.fee', 'meal.th.active', 'set.th.customers'].map((k) => `<th>${esc(t(k))}</th>`).join('')}<th></th></tr></thead><tbody>
        ${zones.map((z, i) => `<tr class="${z.active ? '' : 'row-off'}"><td class="lat"><b>${esc(z.city)}</b></td>
          <td><div class="suffix w120"><input class="input sm num" type="number" step="0.25" min="0" value="${z.fee}" data-change="zone-fee" data-i="${i}"><span>€</span></div></td>
          <td><span class="switch"><input type="checkbox" data-change="zone-active" data-i="${i}" ${z.active ? 'checked' : ''}><i></i></span></td>
          <td class="num">${DV.state.customers.filter((c) => c.addresses.some((a) => a.city === z.city)).length}</td>
          <td><button class="btn btn-ghost btn-xs" data-action="zone-del" data-i="${i}">${esc(t('common.delete'))}</button></td></tr>`).join('')}
        <tr class="add-row"><td><input class="input sm lat" dir="ltr" placeholder="${esc(t('set.newCity'))}" value="${esc(draft('zone.city'))}" data-input="draft" data-k="zone.city" data-focus-key="zone.city"></td>
          <td><div class="suffix w120"><input class="input sm num" type="number" step="0.25" min="0" placeholder="0" value="${esc(draft('zone.fee'))}" data-input="draft" data-k="zone.fee" data-focus-key="zone.fee"><span>€</span></div></td>
          <td colspan="3"><button class="btn btn-primary btn-xs" data-action="zone-add">+ ${esc(t('set.addZone'))}</button></td></tr>
        </tbody></table>
      </section>`;
    }
  };
  A.chg.set = (el) => {
    let v;
    if (el.hasAttribute('data-pct')) { v = parseFloat(el.value); if (isNaN(v) || v < 0 || v > 30) { toast(t('common.badValue'), '', '⚠️'); A.render(); return; } v = round2(v) / 100; }
    else if (el.hasAttribute('data-int')) { v = parseInt(el.value, 10); const mn = +el.dataset.min, mx = +el.dataset.max; if (isNaN(v) || v < mn || v > mx) { toast(t('common.badValue'), t('common.between', { a: mn, b: mx }), '⚠️'); A.render(); return; } }
    else v = el.value.trim();
    DV.commit((s) => { s.settings[el.dataset.k] = v; });
    toast(t('set.t.saved'), '', '💾');
  };
  A.chg['set-weekday'] = (el) => {
    const cur = new Set(DV.state.settings.deliveryWeekdays); el.checked ? cur.add(+el.value) : cur.delete(+el.value);
    if (!cur.size) { el.checked = true; return toast(t('set.t.oneDay'), '', '⚠️'); }
    DV.commit((s) => { s.settings.deliveryWeekdays = [...cur].sort(); });
    toast(t('set.t.weekdays'), '', '📅');
  };
  A.chg['set-window'] = (el) => { const v = el.value.trim(); if (!v) { A.render(); return; } DV.commit((s) => { s.settings.deliveryWindows[+el.dataset.i].label[el.dataset.l] = v; }); toast(t('set.t.window'), v, '💾'); };
  A.chg['zone-fee'] = (el) => { const v = parseFloat(el.value); if (isNaN(v) || v < 0) { A.render(); return; } DV.commit((s) => { s.zones[+el.dataset.i].fee = round2(v); }); toast(t('set.t.fee'), '', '💾'); };
  A.chg['zone-active'] = (el) => { DV.commit((s) => { s.zones[+el.dataset.i].active = el.checked; }); };
  A.act['zone-del'] = (el) => { const z = DV.state.zones[+el.dataset.i]; if (!confirm(t('set.zoneDelConfirm', { city: z.city }))) return; DV.commit((s) => { s.zones.splice(+el.dataset.i, 1); }); };
  A.act['zone-add'] = () => {
    const city = draft('zone.city').trim(); const fee = parseFloat(draft('zone.fee') || '0');
    if (!city) return toast(t('set.t.cityReq'), '', '⚠️');
    if (DV.state.zones.some((z) => z.city.toLowerCase() === city.toLowerCase())) return toast(t('set.t.cityExists'), '', '⚠️');
    delete A.ui.drafts['zone.city']; delete A.ui.drafts['zone.fee'];
    DV.commit((s) => { s.zones.push({ city, fee: isNaN(fee) ? 0 : round2(fee), active: true }); });
    toast(t('set.t.zoneAdded'), city, '📍');
  };
})();
