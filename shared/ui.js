/* Small shared UI helpers: toasts, sound, phone frame, Dynamic-Island alerts. */
(function () {
  let host = null;
  function toastHost() {
    if (host && document.body.contains(host)) return host;
    host = document.createElement('div'); host.className = 'toast-host';
    (document.querySelector('.device-screen') || document.body).appendChild(host);
    return host;
  }
  function toast(title, body, icon = '✅', ms = 3200) {
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = `<div class="t-ic">${icon}</div><div class="grow"><b>${DV.esc(title)}</b>${body ? `<small>${DV.esc(body)}</small>` : ''}</div>`;
    toastHost().appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
  }

  let ctx = null;
  function beep(kind = 'ding') {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === 'order' ? [880, 1175, 1480] : [988, 1319];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.13;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  }
  function vibrate(p = 40) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  /** Wrap #app in an iPhone frame. info = HTML for the side panel on desktop. */
  function mountPhone(info, opts = {}) {
    document.body.classList.add('phone-app');
    const app = document.getElementById('app');
    const stage = document.createElement('div'); stage.className = 'stage';
    stage.innerHTML = `<aside class="stage-info">${info || ''}</aside>
      <div class="device"><div class="device-screen">
        <div class="statusbar"><span class="sb-time num">9:41</span><span class="sb-icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.6 0-1.1.2-1.5.6L8 11.6l1.5-1.6c-.4-.4-.9-.6-1.5-.6Z"/></svg>
          <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="22" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor"/><path d="M24.5 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity=".5"/></svg>
        </span></div>
        <div class="island"><span class="isl-ic"></span><span class="isl-t"></span></div>
        <div class="home-ind"></div>
      </div></div>`;
    app.parentNode.insertBefore(stage, app);
    stage.querySelector('.device-screen').appendChild(app);
    const tEl = stage.querySelector('.sb-time');
    const tick = () => { const d = new Date(); tEl.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
    tick(); setInterval(tick, 15000);
    if (opts.manifest) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = opts.manifest; document.head.appendChild(l); }
  }
  let islT = null;
  function island(title, body, icon = '🔔') {
    const el = document.querySelector('.island');
    if (!el || getComputedStyle(el).display === 'none') { toast(title, body, icon); return; }
    el.querySelector('.isl-ic').textContent = icon;
    el.querySelector('.isl-t').innerHTML = `<b>${DV.esc(title)}</b><small>${DV.esc(body || '')}</small>`;
    el.classList.add('expand');
    clearTimeout(islT); islT = setTimeout(() => { el.classList.remove('expand'); el.querySelector('.isl-ic').textContent = ''; }, 3600);
  }
  function statusbarColor(c) { document.documentElement.style.setProperty('--sb-color', c); }

  /** Watch a notification inbox and fire a callback for items that arrive after load. */
  function watchInbox(to, cb) {
    const seen = new Set(DV.notificationsFor(to()).map((n) => n.id));
    DV.on(() => {
      const list = DV.notificationsFor(to());
      list.slice().reverse().forEach((n) => { if (!seen.has(n.id)) { seen.add(n.id); cb(n); } });
    });
    return (addr) => DV.notificationsFor(addr).forEach((n) => seen.add(n.id));
  }

  window.DVUI = { toast, beep, vibrate, mountPhone, island, statusbarColor, watchInbox };
})();
