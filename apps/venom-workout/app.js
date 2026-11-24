/* =====================================================================
   Venom Workout — rascunho funcional (PWA)
   Dados salvos no aparelho (localStorage + IndexedDB para fotos).
   Na versão de produção isso vai para um backend (ver README).
   ===================================================================== */
(() => {
'use strict';

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEK_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTH = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDate = (s) => { const d = parseDate(s); return `${WEEK[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`; };
const fmtShort = (s) => { const d = parseDate(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`; };
const classDateTime = (date, time) => { const d = parseDate(date); const [h, m] = time.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
};
const parseTime = (s) => { // "mm:ss" ou "h:mm:ss" -> segundos
  if (!s) return null;
  const p = String(s).trim().split(':').map(Number);
  if (p.some(isNaN)) return null;
  return p.reduce((a, v) => a * 60 + v, 0);
};
const fmtTime = (sec) => {
  if (sec == null) return '-';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// ---------- armazenamento ----------
const db = {
  get(k, def) { try { const v = localStorage.getItem('vw_' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) {
    try { localStorage.setItem('vw_' + k, JSON.stringify(v)); return true; }
    catch { toast('Sem espaço no aparelho para salvar.'); return false; }
  }
};

// fotos em IndexedDB (localStorage é pequeno demais)
const imgStore = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('venom-workout', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('img');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('img', mode); const q = fn(t.objectStore('img')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  return {
    put: (key, val) => tx('readwrite', (s) => s.put(val, key)).catch(() => null),
    get: (key) => tx('readonly', (s) => s.get(key)).catch(() => null),
    del: (key) => tx('readwrite', (s) => s.delete(key)).catch(() => null)
  };
})();

async function hash(pw) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('venom:' + pw));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { // contexto sem crypto.subtle (ex.: arquivo local)
    let h = 0; for (const c of 'venom:' + pw) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h;
  }
}

// comprime foto para ~1080px JPEG
function compressImage(file, max = 1080, q = 0.8) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- estado ----------
let me = null;
const users = () => db.get('users', []);
const userById = (id) => users().find((u) => u.id === id);
const saveUser = (u) => { const all = users(); const i = all.findIndex((x) => x.id === u.id); if (i >= 0) all[i] = u; else all.push(u); db.set('users', all); if (me && me.id === u.id) me = u; };

async function seed() {
  if (db.get('seeded')) return;
  const coach = { id: 'coach', name: 'Karrasco', email: 'coach@venom.com', pass: await hash('venom123'), role: 'coach', level: 'Coach', phone: '', created: Date.now() };
  const demo = { id: 'demo', name: 'Atleta Demo', email: 'atleta@venom.com', pass: await hash('venom123'), role: 'athlete', level: 'Intermediário', phone: '', created: Date.now() };
  db.set('users', [coach, demo]);
  db.set('wod', {
    date: today(),
    title: 'WOD do dia',
    text: 'Força: Back Squat 5x5 @75%\n\nMetcon — "Venom 15"\nAMRAP 15 min:\n10 Wall Balls (9/6 kg)\n10 Toes-to-Bar\n200 m Corrida'
  });
  const t = Date.now();
  db.set('posts', [{
    id: uid(), userId: 'coach', created: t - 3600e3 * 5, date: today(), classTime: '07:00', kind: 'WOD',
    wod: 'For time:\n21-15-9\nThruster (43/30 kg)\nPull-up', result: 'Turma das 07h voando! 🐍', rx: true,
    caption: 'Bem-vindos ao app da Venom Workout! Registrem seus treinos e PRs por aqui. 💚', img: null, likes: ['demo'], comments: [{ userId: 'demo', text: 'Bora! 🔥', ts: t - 3600e3 * 4 }]
  }]);
  db.set('seeded', true);
}

// ---------- toast / modal ----------
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function openModal(html, onMount) {
  const m = $('#modal'); const s = $('.sheet', m);
  s.innerHTML = html; m.hidden = false; document.body.style.overflow = 'hidden';
  m.onclick = (e) => { if (e.target === m) closeModal(); };
  $$('[data-close]', s).forEach((b) => b.onclick = closeModal);
  onMount && onMount(s);
}
function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }
const emptyState = (ico, text) => `<div class="empty"><span class="e-ico">${ico}</span>${text}</div>`;
const avatarHtml = (u, cls = '') => `<div class="avatar ${cls}" data-avatar="${u ? esc(u.id) : ''}">${u && u.photo ? `<img src="${u.photo}" alt="">` : esc(initials(u ? u.name : '?'))}</div>`;

// =====================================================================
// SPLASH -> LOGIN -> APP
// =====================================================================
async function boot() {
  await seed();
  const sessionId = db.get('session');
  me = sessionId ? userById(sessionId) : null;
  setTimeout(() => {
    $('#splash').classList.add('out');
    if (me) startApp(); else renderAuth('login');
  }, 2600);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

function renderAuth(mode) {
  const el = $('#auth'); el.hidden = false; $('#app').hidden = true;
  const isLogin = mode === 'login';
  el.innerHTML = `
    <div class="auth-card">
      <div class="auth-head">
        <img src="icons/logo-512.png" alt="Venom Workout">
        <h1><b>VENOM</b> WORKOUT</h1>
        <p>Cross Training · Skyfit Mogi das Cruzes</p>
      </div>
      <div class="seg"><button data-m="login" class="${isLogin ? 'on' : ''}">Entrar</button><button data-m="signup" class="${!isLogin ? 'on' : ''}">Criar conta</button></div>
      <form id="auth-form" novalidate>
        ${isLogin ? '' : `
          <label class="field"><span>Nome completo</span><input class="input" name="name" required autocomplete="name"></label>
          <label class="field"><span>WhatsApp</span><input class="input" name="phone" type="tel" placeholder="(11) 9 0000-0000" autocomplete="tel"></label>
          <label class="field"><span>Nível</span><select class="input" name="level"><option>Iniciante</option><option selected>Intermediário</option><option>RX</option><option>Elite</option></select></label>`}
        <label class="field"><span>E-mail</span><input class="input" name="email" type="email" required autocomplete="email"></label>
        <label class="field"><span>Senha</span><input class="input" name="pass" type="password" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}"></label>
        ${isLogin ? '<p style="text-align:right;margin:-4px 0 16px"><button type="button" class="link-btn small" id="forgot">Esqueci minha senha</button></p>' : `
          <label class="toggle small"><span>Li e aceito os termos de uso e a política de privacidade (LGPD)</span><input type="checkbox" class="switch" name="terms" required></label>`}
        <button class="btn" type="submit">${isLogin ? 'Entrar' : 'Criar minha conta'}</button>
      </form>
      ${isLogin ? '<p class="hint">Demo: <b>atleta@venom.com</b> / <b>venom123</b><br>Coach: <b>coach@venom.com</b> / <b>venom123</b></p>' : ''}
    </div>`;
  $$('.seg button', el).forEach((b) => b.onclick = () => renderAuth(b.dataset.m));
  const forgot = $('#forgot', el);
  if (forgot) forgot.onclick = () => openModal(`
    <h2>Recuperar senha</h2><p class="muted">Enviaremos um link para redefinir sua senha.</p>
    <label class="field"><span>E-mail</span><input class="input" id="fg-email" type="email"></label>
    <button class="btn" id="fg-send">Enviar link</button>`, (s) => {
    $('#fg-send', s).onclick = () => { closeModal(); toast('Se o e-mail existir, você receberá o link. (rascunho)'); };
  });
  $('#auth-form', el).onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    f.email = (f.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast('Informe um e-mail válido.');
    if ((f.pass || '').length < 6) return toast('A senha precisa de pelo menos 6 caracteres.');
    const all = users();
    if (isLogin) {
      const u = all.find((x) => x.email === f.email);
      if (!u || u.pass !== await hash(f.pass)) return toast('E-mail ou senha incorretos.');
      me = u;
    } else {
      if (!f.name || f.name.trim().length < 3) return toast('Informe seu nome.');
      if (!e.target.terms.checked) return toast('Aceite os termos para continuar.');
      if (all.some((x) => x.email === f.email)) return toast('Já existe uma conta com esse e-mail.');
      me = { id: uid(), name: f.name.trim(), email: f.email, phone: f.phone || '', level: f.level, role: 'athlete', pass: await hash(f.pass), created: Date.now() };
      saveUser(me);
      toast(`Bem-vindo(a) à Venom, ${me.name.split(' ')[0]}! 🐍`);
    }
    db.set('session', me.id);
    startApp();
  };
}

function logout() { db.set('session', null); me = null; location.hash = ''; renderAuth('login'); }

// =====================================================================
// APP + ROTEADOR
// =====================================================================
const ROUTES = { home: ['Início', viewHome], agenda: ['Agenda', viewAgenda], prs: ['Meus PRs', viewPRs], feed: ['Treinos', viewFeed], perfil: ['Perfil', viewPerfil] };

function startApp() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#btn-notif').onclick = showNotifications;
  window.onhashchange = route;
  if (!location.hash) location.hash = '#/home'; else route();
}

function route() {
  if (!me) return;
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const r = ROUTES[name] || ROUTES.home;
  const key = ROUTES[name] ? name : 'home';
  $('#page-title').textContent = r[0];
  $$('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === key));
  $('.fab')?.remove();
  if (!$('#modal').hidden) closeModal();
  const v = $('#view'); v.style.animation = 'none'; v.offsetHeight; v.style.animation = '';
  r[1](v, arg && decodeURIComponent(arg));
  window.scrollTo(0, 0);
  $('#notif-dot').hidden = notifications().length === 0;
}

// =====================================================================
// AGENDAMENTO
// =====================================================================
// ---------------------------------------------------------------------
// Regra: ORDEM DE CHEGADA. Os primeiros N a agendar (N = limite da turma)
// ficam confirmados; os demais entram na fila. Se alguém cancela, o
// próximo da fila é confirmado automaticamente e recebe um aviso.
// ---------------------------------------------------------------------
const bookings = () => db.get('bookings', []);
const closureFor = (date) => (GYM.closures || {})[date] || null;
const upcomingClosures = (days = 7) => Object.entries(GYM.closures || {}).filter(([d]) => { const diff = (parseDate(d) - parseDate(today())) / 864e5; return diff >= 0 && diff <= days; }).sort();
const slotsFor = (date) => (closureFor(date) ? [] : GYM.schedule[parseDate(date).getDay()] || []);
const classType = (time, date) => { const d = date ? parseDate(date).getDay() : null; const c = GYM.classTypes; return c[`${d}|${time}`] || c[d] || c.default; };
const coachFor = () => GYM.coach;
// limite de vagas: padrão geral + exceção por dia da semana/horário (definidos pelo coach)
const capSettings = () => db.get('capacity', { default: GYM.capacity, overrides: {} });
const capacityFor = (date, time) => { const c = capSettings(); const o = c.overrides[`${parseDate(date).getDay()}|${time}`]; return o != null ? o : c.default; };
// fila da turma em ordem de agendamento
const queueAt = (date, time) => bookings().filter((b) => b.date === date && b.time === time && b.status !== 'cancelled').sort((a, b) => a.created - b.created);
const statusOf = (b) => {
  if (b.status === 'cancelled' || b.status === 'checkin') return b.status;
  const q = queueAt(b.date, b.time); const i = q.findIndex((x) => x.id === b.id);
  return i < capacityFor(b.date, b.time) ? 'booked' : 'waitlist';
};
const positionOf = (b) => { const q = queueAt(b.date, b.time); const i = q.findIndex((x) => x.id === b.id); const cap = capacityFor(b.date, b.time); return i < cap ? i + 1 : i - cap + 1; };
const occupancy = (date, time) => Math.min(capacityFor(date, time), queueAt(date, time).length);
const waitCount = (date, time) => Math.max(0, queueAt(date, time).length - capacityFor(date, time));
const STATUS_LABEL = { booked: 'Confirmada', waitlist: 'Fila de espera', checkin: 'Check-in' };
const myBooking = (date, time) => bookings().find((b) => b.userId === me.id && b.date === date && b.time === time && b.status !== 'cancelled');
const myUpcoming = () => bookings().filter((b) => b.userId === me.id && b.status !== 'cancelled' && classDateTime(b.date, b.time) > Date.now() - 60 * 60e3)
  .sort((a, b) => classDateTime(a.date, a.time) - classDateTime(b.date, b.time));

// avisos individuais (ex.: "você saiu da fila e está confirmado")
const pushInbox = (userId, text) => { const k = 'inbox_' + userId; const box = db.get(k, []); box.unshift({ text, ts: Date.now() }); db.set(k, box.slice(0, 30)); };
const confirmedIds = (date, time) => new Set(queueAt(date, time).filter((b) => statusOf(b) !== 'waitlist').map((b) => b.id));
const notifyPromoted = (date, time, before) => {
  queueAt(date, time).forEach((b) => { if (!before.has(b.id) && statusOf(b) === 'booked') pushInbox(b.userId, `✅ Abriu vaga! Você saiu da fila e está confirmado(a) na aula de ${fmtDate(date)} às ${time}.`); });
};

function book(date, time) {
  const all = bookings();
  if (all.some((b) => b.userId === me.id && b.date === date && b.status !== 'cancelled')) return toast('Você já tem um agendamento nesse dia.');
  all.push({ id: uid(), userId: me.id, date, time, status: 'booked', created: Date.now() });
  db.set('bookings', all);
  const mine = myBooking(date, time);
  toast(statusOf(mine) === 'waitlist'
    ? `Turma lotada — você é o ${positionOf(mine)}º da fila de espera.`
    : `Vaga garantida: ${fmtDate(date)} às ${time} ✅ (${positionOf(mine)}º a agendar)`);
}
function cancelBooking(id) {
  const all = bookings(); const b = all.find((x) => x.id === id); if (!b) return;
  const st = statusOf(b);
  const minsLeft = (classDateTime(b.date, b.time) - Date.now()) / 60e3;
  if (st === 'booked' && minsLeft < GYM.cancelLimitMin) return toast(`Cancelamento só até ${GYM.cancelLimitMin} min antes da aula.`);
  const before = confirmedIds(b.date, b.time);
  b.status = 'cancelled'; b.cancelledAt = Date.now();
  db.set('bookings', all);
  notifyPromoted(b.date, b.time, before);
  toast(st === 'waitlist' ? 'Você saiu da fila de espera.' : 'Agendamento cancelado. A vaga foi para o próximo da fila.');
}
function checkin(id) {
  const all = bookings(); const b = all.find((x) => x.id === id); if (!b) return;
  b.status = 'checkin'; b.checkinAt = Date.now(); db.set('bookings', all); toast('Check-in feito! Bom treino 💪');
}

let agendaDay = null;
function viewAgenda(v) {
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return isoDate(d); });
  if (!agendaDay || !days.includes(agendaDay)) agendaDay = days.find((d) => slotsFor(d).length) || days[0];
  const slots = slotsFor(agendaDay);
  const now = Date.now();
  v.innerHTML = `
    <div class="card-head"><div><h2 style="font-size:24px">${GYM.name}</h2><span class="muted small">Cross Training · Coach ${esc(GYM.coach)} · vagas por ordem de agendamento</span></div></div>
    <div class="days">${days.map((d) => { const dt = parseDate(d); return `<button class="day ${d === agendaDay ? 'on' : ''} ${slotsFor(d).length ? '' : 'closed'} ${closureFor(d) ? 'event' : ''}" data-d="${d}"><small>${WEEK[dt.getDay()]}</small><b>${dt.getDate()}</b></button>`; }).join('')}</div>
    <h3 class="group-title">${WEEK_FULL[parseDate(agendaDay).getDay()]}, ${parseDate(agendaDay).getDate()} de ${MONTH[parseDate(agendaDay).getMonth()]}</h3>
    ${slots.length ? slots.map((t) => {
      const start = classDateTime(agendaDay, t); const past = start < now;
      const cap = capacityFor(agendaDay, t); const occ = occupancy(agendaDay, t); const full = occ >= cap; const wait = waitCount(agendaDay, t);
      const mine = myBooking(agendaDay, t); const st = mine && statusOf(mine);
      const minsLeft = (start - now) / 60e3;
      let action;
      if (st === 'checkin') action = '<span class="chip">Check-in ✓</span>';
      else if (st === 'booked' && minsLeft <= 30 && minsLeft > -60) action = `<button class="btn sm" data-checkin="${mine.id}">Check-in</button>`;
      else if (mine && !past) action = `<button class="btn sm danger" data-cancel="${mine.id}">${st === 'waitlist' ? 'Sair da fila' : 'Cancelar'}</button>`;
      else if (past) action = '<span class="chip gray">Encerrada</span>';
      else action = `<button class="btn sm ${full ? 'ghost' : ''}" data-book="${t}">${full ? 'Entrar na fila' : 'Agendar'}</button>`;
      const myTag = mine ? (st === 'waitlist'
        ? `<span class="chip warn">${positionOf(mine)}º na fila</span>`
        : `<span class="chip">${STATUS_LABEL[st]} · ${positionOf(mine)}º</span>`) : '';
      return `<div class="slot ${mine ? 'mine' : ''}" style="${past && !mine ? 'opacity:.5' : ''}">
        <div class="time">${t}</div>
        <div class="info">
          <div style="font-weight:600">${esc(classType(t, agendaDay))} ${myTag}</div>
          <div class="muted small">${occ}/${cap} vagas ${full ? '· <b style="color:var(--danger)">lotada</b>' : `· ${cap - occ} livre(s)`}${wait ? ` · ${wait} na fila` : ''}</div>
          <div class="bar ${full ? 'full' : ''}"><i style="width:${cap ? (occ / cap) * 100 : 100}%"></i></div>
        </div>
        ${action}
      </div>`;
    }).join('') : (closureFor(agendaDay) ? emptyState('🏆', esc(closureFor(agendaDay))) : emptyState('😴', 'Sem aulas nesse dia. Descanso também é treino!'))}
    <div class="card" style="margin-top:18px">
      <h2>Minhas próximas aulas</h2>
      ${myUpcoming().length ? `<ul class="list">${myUpcoming().map((b) => { const st = statusOf(b); return `<li><div class="grow"><div class="title">${fmtDate(b.date)} · ${b.time}</div><div class="muted small">${esc(classType(b.time, b.date))}</div></div><span class="chip ${st === 'waitlist' ? 'warn' : ''}">${st === 'waitlist' ? positionOf(b) + 'º na fila' : STATUS_LABEL[st]}</span></li>`; }).join('')}</ul>` : '<p class="muted">Nenhuma aula agendada.</p>'}
      <p class="muted small" style="margin-bottom:0"><b>Regras:</b> as vagas são por ordem de agendamento — quem agenda primeiro garante a vaga. Turma lotada? Entre na fila: se alguém cancelar, o 1º da fila é confirmado automaticamente. 1 agendamento por dia · cancelamento até ${GYM.cancelLimitMin} min antes · check-in liberado 30 min antes.</p>
    </div>`;
  $$('[data-d]', v).forEach((b) => b.onclick = () => { agendaDay = b.dataset.d; viewAgenda(v); });
  $$('[data-book]', v).forEach((b) => b.onclick = () => { book(agendaDay, b.dataset.book); viewAgenda(v); });
  $$('[data-cancel]', v).forEach((b) => b.onclick = () => { cancelBooking(b.dataset.cancel); viewAgenda(v); });
  $$('[data-checkin]', v).forEach((b) => b.onclick = () => { checkin(b.dataset.checkin); viewAgenda(v); });
  $('.day.on', v)?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// =====================================================================
// PRs
// =====================================================================
const customMovs = () => db.get('custom_movs', []);
const allGroups = () => {
  const c = customMovs();
  return c.length ? [...MOVEMENT_GROUPS, { id: 'custom', name: 'Personalizados', type: 'load', items: c.map((m) => m.name), custom: c }] : MOVEMENT_GROUPS;
};
const movType = (name) => {
  const cm = customMovs().find((m) => m.name === name); if (cm) return cm.type;
  return (MOVEMENT_GROUPS.find((g) => g.items.includes(name)) || { type: 'load' }).type;
};
const prs = () => db.get('prs', []);
const myPRs = (mov) => prs().filter((p) => p.userId === me.id && (!mov || p.movement === mov));

// valor comparável (maior = melhor)
function score(p) {
  switch (p.type) {
    case 'load': return p.weight * 1000 + (p.reps || 1);
    case 'time': return p.time ? -p.time : -Infinity;
    case 'hold': return p.time || 0;
    case 'amrap': return (p.rounds || 0) * 1000 + (p.reps || 0);
    case 'cal': return p.cal || 0;
    case 'dist': return p.dist || 0;
    default: return (p.reps || 0) * 1000 + (p.weight || 0);
  }
}
const best = (list) => list.reduce((b, p) => (!b || score(p) > score(b) ? p : b), null);
function prLabel(p) {
  if (!p) return '';
  switch (p.type) {
    case 'load': return `${p.weight} kg${p.reps > 1 ? ` × ${p.reps}` : ''}`;
    case 'time': case 'hold': return fmtTime(p.time);
    case 'amrap': return `${p.rounds} rds${p.reps ? ` + ${p.reps}` : ''}`;
    case 'cal': return `${p.cal} cal`;
    case 'dist': return `${p.dist} ${/cm/.test(p.movement) ? 'cm' : 'm'}`;
    default: return `${p.reps} reps${p.weight ? ` @ ${p.weight} kg` : ''}`;
  }
}
const est1RM = (w, r) => (r <= 1 ? w : w * (1 + r / 30)); // fórmula de Epley

let prFilter = 'mine', prQuery = '';
function viewPRs(v, movArg) {
  const groups = allGroups();
  const mine = prs().filter((p) => p.userId === me.id);
  const movsWithPR = new Set(mine.map((p) => p.movement));
  const q = prQuery.trim().toLowerCase();
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  v.innerHTML = `
    <div class="stats">
      <div class="stat"><b>${mine.length}</b><span>Registros</span></div>
      <div class="stat"><b>${movsWithPR.size}</b><span>Movimentos</span></div>
      <div class="stat"><b>${total}</b><span>No catálogo</span></div>
    </div>
    <div class="search"><input class="input" id="pr-q" placeholder="Buscar movimento, benchmark, Hero WOD…" value="${esc(prQuery)}"></div>
    <div class="filters">
      <button data-f="mine" class="${prFilter === 'mine' ? 'on' : ''}">⭐ Meus PRs</button>
      <button data-f="all" class="${prFilter === 'all' ? 'on' : ''}">Todos</button>
      ${groups.map((g) => `<button data-f="${g.id}" class="${prFilter === g.id ? 'on' : ''}">${esc(g.name)}</button>`).join('')}
    </div>
    <div id="pr-list"></div>
    <button class="btn ghost" id="add-mov" style="margin-top:10px">+ Adicionar movimento personalizado</button>`;
  const listEl = $('#pr-list', v);
  const renderList = () => {
    const qq = prQuery.trim().toLowerCase();
    let html = '';
    for (const g of groups) {
      if (!['mine', 'all'].includes(prFilter) && prFilter !== g.id) continue;
      const items = g.items.filter((m) => (!qq || m.toLowerCase().includes(qq)) && (prFilter !== 'mine' || movsWithPR.has(m)));
      if (!items.length) continue;
      html += `<h3 class="group-title">${esc(g.name)} <span class="chip gray">${TYPE_LABEL[g.type]}</span></h3><div class="card" style="padding:4px 14px"><ul class="list">` +
        items.map((m) => { const b = best(mine.filter((p) => p.movement === m)); return `<li class="mov" data-mov="${esc(m)}"><div class="grow"><div class="title">${esc(m)}</div>${b ? `<div class="muted small">${fmtShort(b.date)}${b.classTime ? ' · aula ' + b.classTime : ''}</div>` : ''}</div><div class="best ${b ? '' : 'none'}">${b ? esc(prLabel(b)) : '+ registrar'}</div></li>`; }).join('') + '</ul></div>';
    }
    listEl.innerHTML = html || (prFilter === 'mine' && !qq
      ? emptyState('🏆', 'Você ainda não registrou PRs.<br>Toque em <b>Todos</b> e escolha um movimento.')
      : emptyState('🔎', 'Nenhum movimento encontrado.'));
    $$('[data-mov]', listEl).forEach((li) => li.onclick = () => showMovement(li.dataset.mov));
  };
  renderList();
  $('#pr-q', v).oninput = (e) => { prQuery = e.target.value; if (prQuery && prFilter === 'mine') { prFilter = 'all'; $$('.filters button', v).forEach((b) => b.classList.toggle('on', b.dataset.f === 'all')); } renderList(); };
  $$('[data-f]', v).forEach((b) => b.onclick = () => { prFilter = b.dataset.f; $$('.filters button', v).forEach((x) => x.classList.toggle('on', x === b)); renderList(); });
  $('#add-mov', v).onclick = addCustomMovement;
  if (q && prFilter === 'mine') prFilter = 'all';
  if (movArg) showMovement(movArg);
}

function addCustomMovement() {
  openModal(`<h2>Novo movimento</h2><p class="muted">Não achou no catálogo? Crie o seu.</p>
    <label class="field"><span>Nome</span><input class="input" id="cm-name" placeholder="Ex.: Venom Complex"></label>
    <label class="field"><span>Tipo de registro</span><select class="input" id="cm-type">${Object.entries(TYPE_LABEL).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
    <button class="btn" id="cm-save">Salvar</button>`, (s) => {
    $('#cm-save', s).onclick = () => {
      const name = $('#cm-name', s).value.trim(); if (!name) return toast('Dê um nome ao movimento.');
      const c = customMovs(); if (c.some((m) => m.name === name) || MOVEMENT_GROUPS.some((g) => g.items.includes(name))) return toast('Esse movimento já existe.');
      c.push({ name, type: $('#cm-type', s).value }); db.set('custom_movs', c); closeModal(); prFilter = 'custom'; route(); showMovement(name);
    };
  });
}

function lineChart(list) {
  if (list.length < 2) return '';
  const pts = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const vals = pts.map((p) => (p.type === 'time' ? -p.time : p.type === 'load' ? est1RM(p.weight, p.reps || 1) : score(p) / (p.type === 'amrap' ? 1000 : 1)));
  const min = Math.min(...vals), max = Math.max(...vals), W = 320, H = 120, P = 12;
  const x = (i) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (val) => H - P - (max === min ? 0.5 : (val - min) / (max - min)) * (H - 2 * P);
  const d = vals.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolução">
    <path d="${d} L${x(pts.length - 1)},${H} L${x(0)},${H} Z" fill="rgba(255,59,68,.14)"/>
    <path d="${d}" fill="none" stroke="#ff3b44" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    ${vals.map((val, i) => `<circle cx="${x(i)}" cy="${y(val)}" r="3.5" fill="#ff3b44"/>`).join('')}
  </svg><p class="muted small" style="margin:4px 0 0">Evolução${pts[0].type === 'load' ? ' (1RM estimado)' : ''} · ${fmtShort(pts[0].date)} → ${fmtShort(pts[pts.length - 1].date)}</p>`;
}

function showMovement(mov) {
  const type = movType(mov);
  const list = myPRs(mov).sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  const b = best(list);
  let pct = '';
  if (type === 'load' && b) {
    const rm = Math.max(...list.map((p) => est1RM(p.weight, p.reps || 1)));
    pct = `<h3 class="group-title">Tabela de % (1RM ${rm.toFixed(1)} kg${list.some((p) => (p.reps || 1) === 1 && p.weight >= rm) ? '' : ' est.'})</h3>
      <div class="pct">${[50, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110].map((p) => `<div>${p}%<b>${(Math.round((rm * p) / 100 * 2) / 2).toFixed(1)}</b></div>`).join('')}</div>`;
  }
  openModal(`
    <div class="card-head"><div><span class="chip gray">${TYPE_LABEL[type]}</span><h2 style="margin-top:6px">${esc(mov)}</h2></div><button class="icon-btn" data-close aria-label="Fechar">✕</button></div>
    ${b ? `<div class="card hero"><span class="muted small">MELHOR MARCA</span><div class="big venom">${esc(prLabel(b))}</div><div class="muted small">${fmtDate(b.date)}${b.classTime ? ' · aula das ' + b.classTime : ''} · ${b.rx ? 'RX' : 'Scaled'}</div></div>` : '<p class="muted">Nenhum registro ainda. Bora marcar o primeiro PR! 🔥</p>'}
    <button class="btn" id="new-pr">+ Registrar ${b ? 'nova marca' : 'PR'}</button>
    ${lineChart(list) ? `<div class="card" style="margin-top:14px">${lineChart(list)}</div>` : ''}
    ${pct}
    ${list.length ? `<h3 class="group-title">Histórico</h3><ul class="list">${list.map((p) => `<li><div class="grow"><div class="title">${esc(prLabel(p))} ${p === b ? '<span class="chip">PR</span>' : ''}</div><div class="muted small">${fmtDate(p.date)}${p.classTime ? ' · aula ' + p.classTime : ''} · ${p.rx ? 'RX' : 'Scaled'}${p.notes ? ' · ' + esc(p.notes) : ''}</div></div><button class="link-btn small" data-del="${p.id}" style="color:var(--danger)">excluir</button></li>`).join('')}</ul>` : ''}
  `, (s) => {
    $('#new-pr', s).onclick = () => prForm(mov, type);
    $$('[data-del]', s).forEach((btn) => btn.onclick = () => {
      if (!confirm('Excluir este registro?')) return;
      db.set('prs', prs().filter((p) => p.id !== btn.dataset.del)); showMovement(mov); refreshBehind();
    });
  });
}

function classTimeOptions(date, selected) {
  const slots = slotsFor(date);
  const myB = bookings().find((b) => b.userId === me.id && b.date === date && b.status !== 'cancelled' && statusOf(b) !== 'waitlist');
  const sel = selected ?? (myB ? myB.time : '');
  return `<option value="">Fora de aula / Open Box</option>` + slots.map((t) => `<option ${t === sel ? 'selected' : ''}>${t}</option>`).join('');
}

function prForm(mov, type) {
  const fields = {
    load: `<div class="row"><label class="field"><span>Peso (kg)</span><input class="input" name="weight" type="number" step="0.5" min="0" inputmode="decimal" required></label><label class="field"><span>Reps</span><input class="input" name="reps" type="number" min="1" value="1" inputmode="numeric"></label></div>`,
    reps: `<div class="row"><label class="field"><span>Repetições</span><input class="input" name="reps" type="number" min="1" inputmode="numeric" required></label><label class="field"><span>Carga extra (kg)</span><input class="input" name="weight" type="number" step="0.5" min="0" inputmode="decimal" placeholder="opcional"></label></div>`,
    time: `<label class="field"><span>Tempo (mm:ss ou h:mm:ss)</span><input class="input" name="time" placeholder="ex.: 4:35" required></label>`,
    hold: `<label class="field"><span>Tempo sustentado (mm:ss)</span><input class="input" name="time" placeholder="ex.: 1:10" required></label>`,
    amrap: `<div class="row"><label class="field"><span>Rounds</span><input class="input" name="rounds" type="number" min="0" inputmode="numeric" required></label><label class="field"><span>+ Reps</span><input class="input" name="reps" type="number" min="0" value="0" inputmode="numeric"></label></div>`,
    cal: `<label class="field"><span>Calorias</span><input class="input" name="cal" type="number" min="1" inputmode="numeric" required></label>`,
    dist: `<label class="field"><span>${/cm/.test(mov) ? 'Altura/Distância (cm)' : 'Distância (m)'}</span><input class="input" name="dist" type="number" step="0.1" min="0" inputmode="decimal" required></label>`
  };
  const d0 = today();
  openModal(`
    <h2>Registrar marca</h2><p class="muted" style="margin-top:0">${esc(mov)}</p>
    <form id="pr-form">
      ${fields[type]}
      <div class="row">
        <label class="field"><span>Data</span><input class="input" name="date" type="date" value="${d0}" max="${d0}" required></label>
        <label class="field"><span>Horário da aula</span><select class="input" name="classTime">${classTimeOptions(d0)}</select></label>
      </div>
      <label class="toggle"><span>Feito RX (sem adaptação)</span><input type="checkbox" class="switch" name="rx" checked></label>
      <label class="field"><span>Observações</span><input class="input" name="notes" placeholder="ex.: sem cinto, toque e vai, joelheira…"></label>
      <label class="toggle"><span>Postar no feed da equipe</span><input type="checkbox" class="switch" name="share"></label>
      <button class="btn" type="submit">Salvar marca</button>
      <button class="btn ghost" type="button" data-close style="margin-top:8px">Cancelar</button>
    </form>`, (s) => {
    const form = $('#pr-form', s);
    form.date.onchange = () => { form.classTime.innerHTML = classTimeOptions(form.date.value); };
    form.onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const num = (k) => (f.get(k) === '' || f.get(k) == null ? null : Number(f.get(k)));
      const p = { id: uid(), userId: me.id, movement: mov, type, date: f.get('date'), classTime: f.get('classTime'), rx: !!f.get('rx'), notes: (f.get('notes') || '').trim(), created: Date.now(),
        weight: num('weight'), reps: num('reps'), rounds: num('rounds'), cal: num('cal'), dist: num('dist'), time: parseTime(f.get('time')) };
      if (type === 'load' && !(p.weight > 0)) return toast('Informe o peso.');
      if (['time', 'hold'].includes(type) && !p.time) return toast('Tempo inválido. Use mm:ss.');
      if (type === 'reps' && !(p.reps > 0)) return toast('Informe as repetições.');
      if (type === 'load') p.reps = p.reps || 1;
      const prev = best(myPRs(mov));
      const isPR = !prev || score(p) > score(prev);
      const all = prs(); all.push(p); db.set('prs', all);
      if (f.get('share')) {
        const posts = db.get('posts', []);
        posts.unshift({ id: uid(), userId: me.id, created: Date.now(), date: p.date, classTime: p.classTime, kind: isPR ? 'PR' : 'Marca', wod: mov, result: prLabel(p), rx: p.rx, caption: p.notes, img: null, likes: [], comments: [] });
        db.set('posts', posts);
      }
      toast(isPR ? `🔥 NOVO PR! ${mov}: ${prLabel(p)}` : 'Marca registrada.');
      showMovement(mov); refreshBehind();
    };
  });
}
// re-renderiza a tela atrás do modal sem fechá-lo
function refreshBehind() { const [name] = location.hash.replace(/^#\/?/, '').split('/'); const r = ROUTES[name]; if (r && name !== 'prs') r[1]($('#view')); else if (name === 'prs') { const v = $('#view'); const y = scrollY; viewPRs(v); scrollTo(0, y); } }

// =====================================================================
// FEED (fotos + registro de treinos)
// =====================================================================
let feedFilter = 'all';
function viewFeed(v) {
  const posts = db.get('posts', []).filter((p) => feedFilter === 'all' || p.userId === me.id).sort((a, b) => b.created - a.created);
  v.innerHTML = `
    <div class="filters" style="margin-bottom:14px">
      <button data-f="all" class="${feedFilter === 'all' ? 'on' : ''}">🐍 Equipe</button>
      <button data-f="mine" class="${feedFilter === 'mine' ? 'on' : ''}">Meus treinos</button>
    </div>
    ${posts.length ? posts.map(postHtml).join('') : emptyState('📸', 'Nenhum treino registrado ainda.<br>Toque no <b>+</b> para postar o primeiro!')}`;
  const fab = document.createElement('button'); fab.className = 'fab'; fab.textContent = '+'; fab.setAttribute('aria-label', 'Novo treino'); fab.onclick = postForm; document.body.appendChild(fab);
  $$('[data-f]', v).forEach((b) => b.onclick = () => { feedFilter = b.dataset.f; viewFeed(v); });
  bindPosts(v);
}
function postHtml(p) {
  const u = userById(p.userId) || { name: 'Atleta' };
  const liked = p.likes.includes(me.id);
  return `<article class="card post" data-post="${p.id}">
    <div class="post-head">${avatarHtml(u)}<div class="grow" style="flex:1;min-width:0"><b>${esc(u.name)}</b> ${u.role === 'coach' ? '<span class="chip">Coach</span>' : ''}<div class="muted small">${fmtDate(p.date)}${p.classTime ? ' · aula ' + p.classTime : ''} · ${timeAgo(p.created)}</div></div>
      ${p.userId === me.id || me.role === 'coach' ? `<button class="link-btn small" data-delpost="${p.id}" style="color:var(--muted)">⋯</button>` : ''}</div>
    ${p.img ? `<img class="post-img" data-img="${p.img}" alt="Foto do treino">` : ''}
    <div class="post-body">
      <span class="chip ${p.kind === 'PR' ? '' : 'gray'}">${p.kind === 'PR' ? '🏆 PR' : esc(p.kind || 'WOD')}</span> ${p.rx != null ? `<span class="chip gray">${p.rx ? 'RX' : 'Scaled'}</span>` : ''}
      ${p.wod ? `<div class="wod">${esc(p.wod)}</div>` : ''}
      ${p.result ? `<div><b>Resultado:</b> <span class="venom">${esc(p.result)}</span></div>` : ''}
      ${p.caption ? `<p style="margin:8px 0 0">${esc(p.caption)}</p>` : ''}
      <div class="post-actions"><button data-like="${p.id}" class="${liked ? 'liked' : ''}">${liked ? '💚' : '🤍'} ${p.likes.length}</button><button data-comment="${p.id}">💬 ${p.comments.length}</button></div>
      ${p.comments.slice(-3).map((c) => `<div class="comment"><b>${esc((userById(c.userId) || { name: 'Atleta' }).name.split(' ')[0])}</b> ${esc(c.text)}</div>`).join('')}
    </div></article>`;
}
function bindPosts(v) {
  $$('[data-img]', v).forEach(async (img) => { const src = await imgStore.get(img.dataset.img); if (src) img.src = src; else img.remove(); });
  const update = (id, fn) => { const all = db.get('posts', []); const p = all.find((x) => x.id === id); if (p) { fn(p); db.set('posts', all); } };
  $$('[data-like]', v).forEach((b) => b.onclick = () => { update(b.dataset.like, (p) => { p.likes = p.likes.includes(me.id) ? p.likes.filter((x) => x !== me.id) : [...p.likes, me.id]; }); route(); });
  $$('[data-comment]', v).forEach((b) => b.onclick = () => openModal(`<h2>Comentar</h2><textarea class="input" id="cm-text" placeholder="Manda a real… 🔥"></textarea><button class="btn" id="cm-send" style="margin-top:10px">Enviar</button>`, (s) => {
    $('#cm-text', s).focus();
    $('#cm-send', s).onclick = () => { const t = $('#cm-text', s).value.trim(); if (!t) return; update(b.dataset.comment, (p) => p.comments.push({ userId: me.id, text: t, ts: Date.now() })); closeModal(); route(); };
  }));
  $$('[data-delpost]', v).forEach((b) => b.onclick = () => {
    if (!confirm('Excluir esta publicação?')) return;
    const all = db.get('posts', []); const p = all.find((x) => x.id === b.dataset.delpost);
    if (p && p.img) imgStore.del(p.img);
    db.set('posts', all.filter((x) => x.id !== b.dataset.delpost)); route();
  });
}
function postForm() {
  let photo = null;
  const d0 = today();
  openModal(`
    <h2>Registrar treino</h2>
    <form id="post-form">
      <label class="photo-drop" id="drop"><span>📷 Toque para adicionar foto</span><input type="file" accept="image/*" hidden id="photo"></label>
      <div class="row">
        <label class="field"><span>Tipo</span><select class="input" name="kind"><option>WOD</option><option>PR</option><option>Força</option><option>LPO</option><option>Ginástica</option><option>Cardio</option><option>Competição</option></select></label>
        <label class="field"><span>Horário da aula</span><select class="input" name="classTime">${classTimeOptions(d0)}</select></label>
      </div>
      <label class="field"><span>Data</span><input class="input" type="date" name="date" value="${d0}" max="${d0}"></label>
      <label class="field"><span>Treino (WOD)</span><textarea class="input" name="wod" placeholder="ex.: AMRAP 12'&#10;12 KB Swing 24 kg&#10;9 Box Jump&#10;6 C2B"></textarea></label>
      <div class="row">
        <label class="field" style="flex:2"><span>Resultado</span><input class="input" name="result" placeholder="ex.: 7 rds + 10 / 12:45"></label>
        <label class="toggle" style="flex:1;padding-top:24px"><span>RX</span><input type="checkbox" class="switch" name="rx" checked></label>
      </div>
      <label class="field"><span>Legenda</span><input class="input" name="caption" placeholder="Como foi o treino?"></label>
      <button class="btn" type="submit">Publicar</button>
    </form>`, (s) => {
    const form = $('#post-form', s);
    form.date.onchange = () => { form.classTime.innerHTML = classTimeOptions(form.date.value); };
    $('#photo', s).onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { photo = await compressImage(file); $('#drop', s).innerHTML = `<img src="${photo}" alt="">`; $('#drop', s).appendChild(e.target); } catch { toast('Não foi possível ler a imagem.'); }
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      if (!photo && !f.wod.trim() && !f.caption.trim()) return toast('Adicione uma foto, o treino ou uma legenda.');
      let img = null;
      if (photo) { img = 'img_' + uid(); await imgStore.put(img, photo); }
      const posts = db.get('posts', []);
      posts.unshift({ id: uid(), userId: me.id, created: Date.now(), date: f.date || d0, classTime: f.classTime, kind: f.kind, wod: f.wod.trim(), result: f.result.trim(), rx: !!f.rx, caption: f.caption.trim(), img, likes: [], comments: [] });
      db.set('posts', posts); closeModal(); toast('Treino publicado! 💚'); route();
    };
  });
}

// =====================================================================
// INÍCIO (dashboard)
// =====================================================================
function weekStreak() {
  const done = bookings().filter((b) => b.userId === me.id && (b.status === 'checkin' || (statusOf(b) === 'booked' && classDateTime(b.date, b.time) < Date.now())));
  const weekKey = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return isoDate(x); };
  const weeks = new Set(done.map((b) => weekKey(parseDate(b.date))));
  let n = 0; const cur = new Date();
  if (!weeks.has(weekKey(cur))) cur.setDate(cur.getDate() - 7);
  while (weeks.has(weekKey(cur))) { n++; cur.setDate(cur.getDate() - 7); }
  return n;
}
function viewHome(v) {
  const first = me.name.split(' ')[0];
  const h = new Date().getHours();
  const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const next = myUpcoming()[0];
  const month = today().slice(0, 7);
  const monthClasses = bookings().filter((b) => b.userId === me.id && b.date.startsWith(month) && ['booked', 'checkin'].includes(statusOf(b))).length;
  const mine = prs().filter((p) => p.userId === me.id);
  const recent = [...mine].sort((a, b) => b.created - a.created).slice(0, 4);
  const wod = db.get('wod', null);
  v.innerHTML = `
    <p class="muted" style="margin:0 0 2px">${greet},</p>
    <h2 style="font-size:34px;margin-bottom:14px">${esc(first)} <span class="venom">⚡</span></h2>
    <div class="card hero">
      ${next ? `<span class="muted small">PRÓXIMA AULA</span>
        <div class="big">${fmtDate(next.date)} · <span class="venom">${next.time}</span></div>
        <div class="muted small" style="margin-bottom:12px">${esc(classType(next.time, next.date))} · ${esc(GYM.name)} ${statusOf(next) === 'waitlist' ? `· <span class="chip warn">${positionOf(next)}º na fila</span>` : ''}</div>
        <a class="btn sm" href="#/agenda">Ver agenda</a>`
      : `<span class="muted small">NENHUMA AULA AGENDADA</span><div class="big">Bora treinar?</div><p class="muted small">Garanta sua vaga na turma.</p><a class="btn sm" href="#/agenda">Agendar aula</a>`}
    </div>
    <div class="stats">
      <div class="stat"><b>${monthClasses}</b><span>Aulas no mês</span></div>
      <div class="stat"><b>${mine.length}</b><span>Marcas</span></div>
      <div class="stat"><b>${weekStreak()}</b><span>Semanas seguidas</span></div>
    </div>
    ${upcomingClosures().map(([d, msg]) => `<div class="card" style="border-color:rgba(255,194,61,.4)"><span class="chip warn">Aviso</span><div style="font-weight:600;margin-top:6px">${fmtDate(d)} — ${esc(msg)}</div></div>`).join('')}
    ${wod ? `<div class="card"><div class="card-head"><h2>${esc(wod.title || 'WOD do dia')}</h2><span class="chip gray">${fmtShort(wod.date)}</span></div><div class="wod" style="margin:0">${esc(wod.text)}</div>
      <button class="btn ghost sm" style="margin-top:12px" id="log-wod">Registrar meu resultado</button></div>` : ''}
    <div class="card">
      <div class="card-head"><h2>Últimas marcas</h2><a href="#/prs" class="small">Ver todas</a></div>
      ${recent.length ? `<ul class="list">${recent.map((p) => `<li class="mov" data-mov="${esc(p.movement)}"><div class="grow"><div class="title">${esc(p.movement)}</div><div class="muted small">${fmtShort(p.date)}${p.classTime ? ' · ' + p.classTime : ''}</div></div><div class="best">${esc(prLabel(p))}</div></li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Registre seu primeiro PR na aba 🏆 PRs.</p>'}
    </div>
    <div class="card"><a class="ig" href="${GYM.instagram}" target="_blank" rel="noopener"><div class="ig-ico">📷</div><div class="grow"><b>@crossvenomworkout</b><div class="muted small">Siga a equipe no Instagram</div></div><span class="venom">↗</span></a></div>`;
  $$('[data-mov]', v).forEach((li) => li.onclick = () => showMovement(li.dataset.mov));
  $('#log-wod', v)?.addEventListener('click', () => { postForm(); const f = $('#post-form'); f.wod.value = wod.text; });
}

// =====================================================================
// PERFIL / CONFIGURAÇÕES / COACH
// =====================================================================
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });

function viewPerfil(v) {
  const s = db.get('settings_' + me.id, { remind: true, feedNotif: true });
  const myPosts = db.get('posts', []).filter((p) => p.userId === me.id).length;
  const totalClasses = bookings().filter((b) => b.userId === me.id && ['booked', 'checkin'].includes(statusOf(b)) && classDateTime(b.date, b.time) < Date.now()).length;
  v.innerHTML = `
    <div class="card"><div class="profile-head">
      <label style="cursor:pointer">${avatarHtml(me, 'lg')}<input type="file" accept="image/*" id="av" hidden></label>
      <div style="min-width:0"><h2 style="font-size:28px;margin:0">${esc(me.name)}</h2><div class="muted small">${esc(me.email)}</div>
        <div style="margin-top:6px"><span class="chip">${esc(me.level || 'Atleta')}</span> ${me.role === 'coach' ? '<span class="chip warn">Coach</span>' : ''}</div></div>
    </div>
    <div class="stats" style="margin:16px 0 0"><div class="stat"><b>${totalClasses}</b><span>Aulas feitas</span></div><div class="stat"><b>${myPRs().length}</b><span>Marcas</span></div><div class="stat"><b>${myPosts}</b><span>Posts</span></div></div>
    <button class="btn ghost" id="edit" style="margin-top:14px">Editar perfil</button></div>

    ${me.role === 'coach' ? `<div class="card"><h2>Painel do Coach</h2>
      <button class="btn" id="edit-wod">Publicar WOD do dia</button>
      <button class="btn ghost" id="capacity" style="margin-top:8px">Limite de vagas por aula</button>
      <button class="btn ghost" id="roster" style="margin-top:8px">Lista de alunos por turma</button></div>` : ''}

    <div class="card"><h2>Configurações</h2>
      <label class="toggle"><span>Lembrete 2h antes da aula</span><input type="checkbox" class="switch" data-s="remind" ${s.remind ? 'checked' : ''}></label>
      <label class="toggle"><span>Avisos de curtidas e comentários</span><input type="checkbox" class="switch" data-s="feedNotif" ${s.feedNotif ? 'checked' : ''}></label>
      ${installPrompt ? '<button class="btn ghost" id="install" style="margin-top:8px">📲 Instalar app no celular</button>' : ''}
      <button class="btn ghost" id="export" style="margin-top:8px">Exportar meus dados (LGPD)</button>
    </div>

    <div class="card"><a class="ig" href="${GYM.instagram}" target="_blank" rel="noopener"><div class="ig-ico">📷</div><div class="grow"><b>@crossvenomworkout</b><div class="muted small">${esc(GYM.name)}</div></div><span class="venom">↗</span></a></div>
    <button class="btn danger" id="logout">Sair da conta</button>
    <p class="hint">Venom Workout · versão 0.1 (rascunho)</p>`;

  $('#av', v).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; me.photo = await compressImage(f, 256, 0.8); saveUser(me); route(); };
  $$('[data-s]', v).forEach((i) => i.onchange = () => { s[i.dataset.s] = i.checked; db.set('settings_' + me.id, s); if (i.dataset.s === 'remind' && i.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); });
  $('#logout', v).onclick = logout;
  $('#install', v)?.addEventListener('click', async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; route(); });
  $('#export', v).onclick = () => {
    const data = { perfil: { ...me, pass: undefined }, agendamentos: bookings().filter((b) => b.userId === me.id), prs: myPRs(), posts: db.get('posts', []).filter((p) => p.userId === me.id) };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'venom-workout-meus-dados.json'; a.click();
  };
  $('#edit', v).onclick = () => openModal(`<h2>Editar perfil</h2>
    <label class="field"><span>Nome</span><input class="input" id="e-name" value="${esc(me.name)}"></label>
    <label class="field"><span>WhatsApp</span><input class="input" id="e-phone" value="${esc(me.phone || '')}" type="tel"></label>
    <label class="field"><span>Nível</span><select class="input" id="e-level">${['Iniciante', 'Intermediário', 'RX', 'Elite', 'Coach'].map((l) => `<option ${l === me.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="row"><label class="field"><span>Peso corporal (kg)</span><input class="input" id="e-bw" type="number" step="0.1" value="${esc(me.bodyweight || '')}"></label><label class="field"><span>Altura (cm)</span><input class="input" id="e-h" type="number" value="${esc(me.height || '')}"></label></div>
    <button class="btn" id="e-save">Salvar</button>`, (sh) => {
    $('#e-save', sh).onclick = () => { me.name = $('#e-name', sh).value.trim() || me.name; me.phone = $('#e-phone', sh).value.trim(); me.level = $('#e-level', sh).value; me.bodyweight = $('#e-bw', sh).value; me.height = $('#e-h', sh).value; saveUser(me); closeModal(); toast('Perfil atualizado.'); route(); };
  });
  if (me.role === 'coach') {
    $('#edit-wod', v).onclick = () => { const w = db.get('wod', { title: 'WOD do dia', text: '' }); openModal(`<h2>WOD do dia</h2>
      <label class="field"><span>Título</span><input class="input" id="w-title" value="${esc(w.title)}"></label>
      <label class="field"><span>Treino</span><textarea class="input" id="w-text" style="min-height:180px">${esc(w.text)}</textarea></label>
      <button class="btn" id="w-save">Publicar</button>`, (sh) => {
      $('#w-save', sh).onclick = () => { db.set('wod', { date: today(), title: $('#w-title', sh).value.trim() || 'WOD do dia', text: $('#w-text', sh).value }); closeModal(); toast('WOD publicado para a equipe!'); };
    }); };
    $('#capacity', v).onclick = () => {
      const c = capSettings();
      const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => (GYM.schedule[d] || []).length);
      openModal(`<h2>Limite de vagas</h2><p class="muted">Quem agendar primeiro garante a vaga. Passou do limite, o aluno entra na fila de espera.</p>
        <label class="field"><span>Limite padrão (todas as aulas)</span><input class="input" id="cap-def" type="number" min="1" max="200" value="${c.default}" inputmode="numeric"></label>
        <h3 class="group-title">Exceções por horário <span class="muted small">(vazio = padrão)</span></h3>
        ${days.map((d) => `<div class="card" style="padding:10px 14px"><b>${WEEK_FULL[d]}</b><div class="row" style="flex-wrap:wrap;margin-top:8px">${GYM.schedule[d].map((t) => `<label class="field" style="flex:0 0 calc(33% - 8px);margin:0 0 6px"><span>${t}</span><input class="input" data-ov="${d}|${t}" type="number" min="0" max="200" value="${c.overrides[d + '|' + t] ?? ''}" placeholder="${c.default}" inputmode="numeric" style="padding:9px 8px"></label>`).join('')}</div></div>`).join('')}
        <button class="btn" id="cap-save">Salvar limites</button>`, (sh) => {
        $('#cap-save', sh).onclick = () => {
          const def = parseInt($('#cap-def', sh).value, 10);
          if (!(def > 0)) return toast('Informe um limite válido.');
          const overrides = {};
          $$('[data-ov]', sh).forEach((i) => { if (i.value !== '') overrides[i.dataset.ov] = Math.max(0, parseInt(i.value, 10)); });
          // guarda quem estava confirmado para avisar quem subir da fila
          const upcoming = [...new Set(bookings().filter((b) => b.status !== 'cancelled' && classDateTime(b.date, b.time) > Date.now()).map((b) => b.date + '|' + b.time))];
          const before = new Map(upcoming.map((k) => { const [d, t] = k.split('|'); return [k, confirmedIds(d, t)]; }));
          db.set('capacity', { default: def, overrides });
          upcoming.forEach((k) => { const [d, t] = k.split('|'); notifyPromoted(d, t, before.get(k)); });
          closeModal(); toast('Limites de vagas atualizados.');
        };
      });
    };
    $('#roster', v).onclick = () => {
      const renderRoster = (sh, d) => {
        $('#roster-list', sh).innerHTML = slotsFor(d).map((t) => {
          const q = queueAt(d, t); const cap = capacityFor(d, t);
          return `<div class="card"><div class="card-head"><b>${t} · ${esc(classType(t, d))}</b><span class="chip gray">${Math.min(q.length, cap)}/${cap}${q.length > cap ? ` · fila ${q.length - cap}` : ''}</span></div>${q.length ? `<ul class="list">${q.map((b, i) => { const st = statusOf(b); return `<li><b class="venom" style="min-width:24px">${i + 1}º</b><div class="grow">${esc((userById(b.userId) || { name: '?' }).name)}<div class="muted small">agendou ${new Date(b.created).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div><span class="chip ${st === 'waitlist' ? 'warn' : ''}">${st === 'waitlist' ? 'Fila' : st === 'checkin' ? 'Presente' : 'Confirmado'}</span></li>`; }).join('')}</ul>` : '<p class="muted small" style="margin:0">Ninguém agendado ainda.</p>'}</div>`;
        }).join('') || emptyState('😴', closureFor(d) || 'Sem aulas nesse dia.');
      };
      openModal(`<h2>Alunos por turma</h2><p class="muted" style="margin-top:0">Em ordem de agendamento.</p>
        <label class="field"><span>Dia</span><input class="input" type="date" id="roster-day" value="${today()}"></label><div id="roster-list"></div>`, (sh) => {
        renderRoster(sh, today());
        $('#roster-day', sh).onchange = (e) => e.target.value && renderRoster(sh, e.target.value);
      });
    };
  }
}

// =====================================================================
// AVISOS
// =====================================================================
function notifications() {
  const out = db.get('inbox_' + me.id, []).filter((n) => Date.now() - n.ts < 3 * 864e5).map((n) => n.text);
  const next = myUpcoming()[0];
  if (next) {
    const mins = (classDateTime(next.date, next.time) - Date.now()) / 60e3;
    if (mins > 0 && mins < 24 * 60) out.push(`⏰ Sua aula é ${next.date === today() ? 'hoje' : 'amanhã'} às ${next.time}.`);
  }
  const wod = db.get('wod', null);
  if (wod && wod.date === today()) out.push('📋 O WOD de hoje já foi publicado pelo coach.');
  upcomingClosures().forEach(([d, msg]) => out.push(`📢 ${fmtDate(d)}: ${msg}`));
  const mineIds = new Set(db.get('posts', []).filter((p) => p.userId === me.id).map((p) => p.id));
  const newComments = db.get('posts', []).filter((p) => mineIds.has(p.id)).flatMap((p) => p.comments.filter((c) => c.userId !== me.id && Date.now() - c.ts < 864e5));
  if (newComments.length) out.push(`💬 ${newComments.length} novo(s) comentário(s) nos seus treinos.`);
  return out;
}
function showNotifications() {
  const n = notifications();
  openModal(`<h2>Avisos</h2>${n.length ? `<ul class="list">${n.map((t) => `<li>${t}</li>`).join('')}</ul>` : emptyState('🔕', 'Nenhum aviso por enquanto.')}`);
}

boot();
})();
