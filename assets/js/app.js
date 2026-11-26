/* ============================================================
   Quản lý khoa VLTL – app.js (ArchitectUI shell)
   Giữ nguyên logic nghiệp vụ + API call; chỉ đổi lớp CSS
   ============================================================ */

/* ========== CẤU HÌNH API ========== */
/* Dán link /exec của Apps Script vào đây (sau khi Deploy với quyền Anyone) */
const API_URL = 'https://script.google.com/macros/s/AKfycbz1iD18hCu4NySf6-9RsHQV79R2cmHUsw4trWKZHL9B0Vebq2xiw6FcfNiAjOxYYMYV3g/exec';

/* Bật mock khi chưa có API / lỗi mạng */
const USE_MOCK = true;

const F2 = [
  { k: 'Phòng 201-202', a: 'a201', l: 'P.201 - 202' },
  { k: 'Phòng 204-206', a: 'a204', l: 'P.204 · 206' },
  { k: 'Phòng 200', a: 'a200', l: 'P.200' },
  { k: 'Phòng 208-209', a: 'a208', l: 'P.208 - 209' },
  { k: 'Phòng 207A', a: 'a207a', l: 'P.207A' },
  { k: 'Phòng 207B', a: 'a207b', l: 'P.207B' }
];
const F6 = [
  { k: 'Phòng 6.213-6.216', sub: '6.216', l: 'P.6.216' },
  { k: 'Phòng 6.215', l: 'P.6.215' },
  { k: 'Phòng 6.214', l: 'P.6.214' },
  { k: 'Phòng 6.213-6.216', sub: '6.213', l: 'P.6.213', noStaff: true }
];
const ORD = { BS: 0, 'ĐD': 1, CN: 2 };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- API ---------- */
async function call(action, payload) {
  payload = payload || {};
  if (USE_MOCK) return mockCall(action, payload);
  const body = Object.assign({ action: action }, payload);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow'
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error('Phản hồi không phải JSON. Kiểm tra Deploy Apps Script (Who has access = Anyone).');
  }
  if (!json.ok) throw new Error(json.error || 'Lỗi server');
  return json.data;
}

/* ---------- Mock data (xem trước UI) ---------- */
function mockBase() {
  const today = todayIso();
  return {
    staff: [
      { code: 'NV01', name: 'Nguyễn Văn A', title: 'Bác sĩ', room: 'Phòng 201-202', note: '', phone: '0901234567', leave: 12 },
      { code: 'NV02', name: 'Trần Thị B', title: 'Cử nhân', room: 'Phòng 200', note: '', phone: '0912345678', leave: 10 },
      { code: 'NV03', name: 'Lê Văn C', title: 'Điều dưỡng', room: 'Phòng 207A', note: '', phone: '', leave: 8 },
      { code: 'NV04', name: 'Phạm Thị D', title: 'KTV VLTL', room: 'Phòng 6.214', note: '', phone: '0923456789', leave: 10 },
      { code: 'NV05', name: 'Hoàng Văn E', title: 'Cử nhân', room: 'Phòng 6.215', note: '', phone: '', leave: 12 },
      { code: 'NV06', name: 'Võ Thị F', title: 'Bác sĩ', room: 'Phòng 204-206', note: '', phone: '0934567890', leave: 15 }
    ],
    moves: [
      { from: today, to: today, session: 'Cả ngày', code: 'NV03', type: 'Nghỉ phép', roomTo: '', note: 'Nghỉ việc riêng', days: '' },
      { from: today, to: '', session: 'Sáng', code: 'NV05', type: 'Luân chuyển', roomTo: 'Phòng 200', note: '', days: '' }
    ],
    machines: [
      { code: 'M-001', name: 'Siêu âm 1', group: 'SA', room: 'Phòng 6.214', qty: 1, status: 'Hoạt động', warn: '', note: '', sub: '' },
      { code: 'M-002', name: 'Laser', group: 'LS', room: 'Phòng 6.215', qty: 2, status: 'Đang bảo trì', warn: '', note: '', sub: '' },
      { code: 'M-003', name: 'Điện xung', group: 'ĐX', room: 'Phòng 201-202', qty: 1, status: 'Hoạt động', warn: 'Sắp hết vật tư', note: '', sub: '' },
      { code: 'M-004', name: 'Siêu âm 2', group: 'SA', room: 'Phòng 6.213-6.216', qty: 1, status: 'Hỏng', warn: '', note: '6.213', sub: '6.213' }
    ],
    bedByDate: {
      [today]: {
        found: true,
        sang: { phieu: 12, bn: 8, code: 'NV04' },
        chieu: { phieu: 10, bn: 6, code: 'NV02' }
      }
    },
    hasBed: true,
    late: [
      { iso: today, code: 'NV02', kind: 'Vào trễ 1h sáng', note: '' },
      { iso: today, code: 'NV01', kind: 'Ra sớm 1h chiều', note: '' }
    ],
    lateLimit: 3,
    hasLate: true,
    rooms: ['Phòng 200', 'Phòng 201-202', 'Phòng 204-206', 'Phòng 207A', 'Phòng 207B', 'Phòng 208-209', 'Phòng 6.213-6.216', 'Phòng 6.214', 'Phòng 6.215'],
    statuses: ['Có mặt', 'Nghỉ phép', 'Công tác', 'Nghỉ ốm', 'Luân chuyển', 'Nghỉ bù'],
    holidays: [],
    target: {
      quy: 4,
      nam: 2026,
      monthLabel: 'Tháng 11',
      cur: 2,
      months: [
        { label: 'T10', start: '2026-10-01', end: '2026-10-31', days: 22, weeks: 4.4, l100: 40000, l120: 48000, d100: 1200000000, d120: 1440000000, luot: 38000, dt: 1100000000 },
        { label: 'T11', start: '2026-11-01', end: '2026-11-30', days: 21, weeks: 4.2, l100: 38000, l120: 45600, d100: 1140000000, d120: 1368000000, luot: 15000, dt: 450000000 },
        { label: 'T12', start: '2026-12-01', end: '2026-12-31', days: 23, weeks: 4.6, l100: 42000, l120: 50400, d100: 1260000000, d120: 1512000000, luot: 0, dt: 0 }
      ],
      q: {
        days: 66, weeks: 13.2, l100: 120000, l120: 144000, d100: 3600000000, d120: 4320000000,
        daysLeft: 40, weeksLeft: 8, luot: 53000, pl100: 0.44, pl120: 0.37, lr100: 67000, lrd100: 3036, lr120: 91000, lrd120: 4125,
        dt: 1550000000, pd100: 0.43, pd120: 0.36, dr100: 2050000000, drw100: 256250000, dr120: 2770000000, drw120: 346250000
      },
      m: {
        days: 21, weeks: 4.2, l100: 38000, l120: 45600, d100: 1140000000, d120: 1368000000,
        daysLeft: 12, weeksLeft: 2.4, luot: 15000, pl100: 0.39, pl120: 0.33, lr100: 23000, lrd100: 1917, lr120: 30600, lrd120: 2550,
        dt: 450000000, pd100: 0.39, pd120: 0.33, dr100: 690000000, drw100: 287500000, dr120: 918000000, drw120: 382500000
      }
    },
    updated: '08:30 26/11'
  };
}

function mockCall(action, payload) {
  if (action === 'getBaseData') return Promise.resolve(mockBase());
  if (action === 'webVerifyPin') {
    if (String(payload.pin) === '1234') return Promise.resolve(true);
    return Promise.reject(new Error('Sai mã PIN (mock: dùng 1234).'));
  }
  if (action === 'webParse') {
    return Promise.resolve({
      questions: [],
      errors: [],
      actions: [{ nhan: 'Xem trước (mock)', mo_ta: 'Lệnh: ' + (payload.text || ''), nguy_hiem: false }]
    });
  }
  if (action === 'webCommit') return Promise.resolve({ n: 1, messages: ['(Mock) Đã ghi thành công'] });
  if (action === 'webUndo') return Promise.resolve({ n: 1 });
  return Promise.reject(new Error('Action mock không hỗ trợ: ' + action));
}

/* ---------- Helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const todayIso = () => {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};
const dmy = i => i.split('-').reverse().join('/');
const nf = n => Math.round(Number(n) || 0).toLocaleString('vi-VN');
const pc = x => ((Number(x) || 0) * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

let D = null,
  pin = '',
  ai = false,
  pending = null,
  view = { iso: todayIso(), s: new Date().getHours() < 12 ? 'Sáng' : 'Chiều' };
let BASE = null;

function toast(t) {
  const e = $('toast');
  e.textContent = t;
  e.style.display = 'block';
  setTimeout(() => (e.style.display = 'none'), 2800);
}
function modal(html) {
  $('md').innerHTML = html;
  $('ov').classList.add('on');
}
function closeModal() {
  $('ov').classList.remove('on');
}

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const TT = { 'Bác sĩ': 'BS', 'Cử nhân': 'CN', 'Điều dưỡng': 'ĐD', 'KTV VLTL': 'KTV', 'Hộ lý': 'HL' };

function qOf(iso) {
  return 'Q' + Math.ceil(+iso.slice(5, 7) / 3) + '/' + iso.slice(0, 4);
}

function lateInfo(B, iso) {
  if (!B.hasLate) return null;
  const lim = B.lateLimit || 3,
    cnt = {},
    out = [];
  B.late
    .map((x, i) => ({ x: x, i: i }))
    .sort((a, b) => (a.x.iso < b.x.iso ? -1 : a.x.iso > b.x.iso ? 1 : a.i - b.i))
    .forEach(o => {
      const x = o.x,
        k = x.code + '|' + qOf(x.iso);
      cnt[k] = (cnt[k] || 0) + 1;
      if (x.iso === iso) out.push({ code: x.code, kind: x.kind, note: x.note, q: qOf(x.iso), n: cnt[k], lim: lim, over: cnt[k] > lim });
    });
  return out;
}

function compute(B, iso, session) {
  const wd = WD[new Date(iso + 'T00:00:00Z').getUTCDay()];
  const bed = B.hasBed ? B.bedByDate[iso] || { found: false } : null;
  const tgCode = bed && bed.found ? (session === 'Sáng' ? bed.sang : bed.chieu).code : '';
  const people = B.staff.map(p => {
    let hit = null;
    B.moves.forEach(m => {
      if (m.code !== p.code || m.from > iso || (m.to && m.to < iso)) return;
      if (m.session !== 'Cả ngày' && m.session !== session) return;
      if (m.days && m.days.indexOf(wd) < 0) return;
      hit = m;
    });
    const o = {
      code: p.code,
      name: p.name,
      title: TT[p.title] || '',
      home: p.room,
      room: p.room,
      status: 'Có mặt',
      reason: '',
      note: p.note,
      tg: !!tgCode && p.code === tgCode
    };
    if (hit) {
      o.reason = hit.note;
      if (hit.type === 'Luân chuyển' && hit.roomTo) {
        o.room = hit.roomTo;
        o.status = 'Luân chuyển';
      } else if (hit.type) {
        o.room = null;
        o.status = hit.type;
      }
    }
    return o;
  });
  return {
    iso: iso,
    session: session,
    rooms: B.rooms,
    statuses: B.statuses,
    people: people,
    machines: B.machines,
    bed: bed,
    late: lateInfo(B, iso),
    target: B.target,
    updated: B.updated
  };
}

function build() {
  D = compute(BASE, view.iso, view.s);
  render();
  $('st').textContent = 'Cập nhật lúc ' + BASE.updated + ' · tự làm mới mỗi 5 phút';
}

async function load(force) {
  $('st').textContent = 'Đang tải…';
  document.body.classList.add('is-loading');
  try {
    BASE = await call('getBaseData', { force: !!force });
    build();
  } catch (e) {
    $('st').textContent = 'Lỗi tải dữ liệu: ' + e.message;
    toast('Lỗi: ' + e.message);
  } finally {
    document.body.classList.remove('is-loading');
  }
}

const fmtD = n => String(n).replace('.', ',');

function leaveUsed(B, code, year) {
  const hol = new Set(B.holidays || []),
    mv = B.moves.filter(m => m.code === code),
    today = todayIso();
  let total = 0,
    past = 0;
  for (let t = Date.UTC(year, 0, 1), end = Date.UTC(year, 11, 31); t <= end; t += 864e5) {
    const d = new Date(t),
      wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const iso = d.toISOString().slice(0, 10);
    if (hol.has(iso)) continue;
    for (const s of ['Sáng', 'Chiều']) {
      let hit = null;
      mv.forEach(m => {
        const to = m.to || (m.type === 'Luân chuyển' ? '9999-12-31' : m.from);
        if (m.from > iso || to < iso) return;
        if (m.session !== 'Cả ngày' && m.session !== s) return;
        if (m.days && m.days.indexOf(WD[wd]) < 0) return;
        hit = m;
      });
      if (hit && hit.type === 'Nghỉ phép') {
        total += 0.5;
        if (iso <= today) past += 0.5;
      }
    }
  }
  return { total: total, past: past };
}

function showPerson(code) {
  const p = BASE.staff.find(s => s.code === code),
    dp = D.people.find(s => s.code === code);
  const year = +view.iso.slice(0, 4),
    lv = leaveUsed(BASE, code, year),
    fixed = p && p.leave != null ? p.leave : null,
    over = fixed != null && lv.total > fixed;
  const q = qOf(view.iso),
    lim = BASE.lateLimit || 3,
    lateN = BASE.hasLate ? BASE.late.filter(x => x.code === code && qOf(x.iso) === q).length : null,
    lateOver = lateN != null && lateN > lim;
  const tel =
    p && p.phone
      ? `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${esc(p.phone)}</a>`
      : '<span class="none">Chưa có số điện thoại</span>';
  modal(`<div class="pm">
    <h3>${esc((dp && dp.title ? dp.title + ' ' : '') + (p ? p.name : code))}</h3>
    <div class="sub">${esc(code)}${dp ? ' · ' + esc(dp.home) : ''}</div>
    <div class="it"><div class="k">1. Số điện thoại</div><div class="v">${tel}</div></div>
    <div class="it"><div class="k">2. Nghỉ phép năm ${year} (đã dùng / cố định)</div>
      <div class="v${over ? ' bad' : ''}">${fmtD(lv.total)} / ${fixed != null ? fmtD(fixed) : '—'} ngày${over ? ' ⚠' : ''}</div>
      <div class="s">${fixed == null ? 'Chưa nhập số ngày phép cố định ở sheet NHÂN SỰ. ' : ''}Đã qua ${fmtD(lv.past)} · sắp tới ${fmtD(lv.total - lv.past)}${fixed != null ? ' · còn lại ' + fmtD(Math.max(0, fixed - lv.total)) : ''} (nghỉ sáng hoặc chiều = 0,5 ngày)</div>
    </div>
    <div class="it"><div class="k">3. Vào trễ / ra sớm 1h trong quý ${esc(q)}</div>
      <div class="v${lateOver ? ' bad' : ''}">${lateN == null ? '—' : lateN + ' / ' + lim + ' lần'}${lateOver ? ' ⚠' : ''}</div>
      ${lateN == null ? '<div class="s">Chưa có sheet VÀO TRỄ RA SỚM.</div>' : ''}
    </div>
    <div class="row"><button class="btn-app btn-primary" onclick="closeModal()">Đóng</button></div>
  </div>`);
}

function sync() {
  $('d').value = view.iso;
  if ($('d-m')) $('d-m').value = view.iso;
  $('bs').className = view.s === 'Sáng' ? 'on' : '';
  $('bc').className = view.s === 'Chiều' ? 'on' : '';
  if ($('bs-m')) {
    $('bs-m').className = view.s === 'Sáng' ? 'on' : '';
    $('bc-m').className = view.s === 'Chiều' ? 'on' : '';
  }
  $('ab').classList.toggle('active', ai);
}

/* ---------- Render helpers (class mới, data-* giữ) ---------- */
function cls(p, g) {
  return (
    'badge-pill-role ' +
    (g ? 'ghost' : ORD[p.title] !== undefined ? p.title : p.title ? 'ot' : '') +
    (p.status === 'Luân chuyển' && !g ? ' in' : '')
  );
}
function chip(p, g) {
  const tag = g
    ? `<i>${p.room ? '→ ' + esc(p.room.replace('Phòng ', 'P.')) : esc(p.status.toLowerCase())}</i>`
    : p.tg
      ? ' <span title="Đi tại giường">🛏</span>'
      : '';
  const tip = p.status === 'Luân chuyển' ? 'Luân chuyển từ ' + p.home : p.reason || p.note || '';
  return `<span class="${cls(p, g)}" data-code="${esc(p.code)}" data-q="${esc((p.title + ' ' + p.name).toLowerCase())}" title="${esc(tip)}">${esc((p.title ? p.title + ' ' : '') + p.name)}${tag}</span>`;
}

function card(def) {
  const key = def.k;
  const inRoom = key && !def.noStaff ? D.people.filter(p => p.room === key) : [];
  const ghosts = key && !def.noStaff ? D.people.filter(p => p.home === key && p.room !== key) : [];
  const ms = key
    ? D.machines.filter(m => m.room === key && (!def.sub || (def.sub === '6.213' ? m.sub === '6.213' : m.sub !== '6.213')))
    : [];
  const sort = (a, b) => (ORD[a.title] ?? 3) - (ORD[b.title] ?? 3) || a.name.localeCompare(b.name, 'vi');
  const mch = m => {
    const w = m.warn && /quá|sắp/i.test(m.warn);
    const c = m.status === 'Hoạt động' ? (w ? 'warn' : '') : m.status === 'Đang bảo trì' ? 'warn' : m.status === 'Hỏng' ? 'bad' : 'off';
    return `<span class="m1 ${c}" data-q="${esc(m.name.toLowerCase())}" title="${esc([m.status, m.warn, m.note].filter(Boolean).join(' · '))}">${esc(m.name)}${m.qty > 1 ? ' ×' + m.qty : ''}${w ? ' ⚠' : ''}</span>`;
  };
  const total = ms.reduce((s, m) => s + m.qty, 0);
  const staffHtml = def.noStaff
    ? '<span class="none">Nhân sự dùng chung với P.6.216 (xem bên cạnh)</span>'
    : inRoom.sort(sort).map(p => chip(p)).join('') + ghosts.sort(sort).map(p => chip(p, 1)).join('') ||
      '<span class="none">Không có ai</span>';
  const head = def.noStaff ? '' : `${inRoom.length} người`;
  return `<div class="room-card room" ${def.a ? `style="grid-area:${def.a}"` : ''}>
    <div class="rh"><b>${esc(def.l)}</b><span>${head}${head && total ? ' · ' : ''}${total ? total + ' máy' : ''}</span></div>
    <div class="rb">${staffHtml}</div>
    ${ms.length ? `<div class="rb m">${ms.map(mch).join('')}</div>` : ''}
  </div>`;
}

const bar = p => `<div class="bar"><i style="width:${Math.min(100, (Number(p) || 0) * 100)}%"></i><span>${pc(p)}</span></div>`;

function ctBlock(title, b, extra) {
  if (!b) return '';
  return `<div class="cb mb-3">
    <div class="ctt"><h4 class="mb-0">${esc(title)}</h4></div>
    <table class="table table-sm table-borderless mb-0" style="font-size:0.8rem">
      <tr><td>Ngày làm việc</td><td class="text-right">${nf(b.days)}</td></tr>
      <tr><td>Lượt (100%)</td><td class="text-right">${nf(b.l100)}</td></tr>
      <tr><td>Lượt (120%)</td><td class="text-right">${nf(b.l120)}</td></tr>
      <tr><td>Đã thực hiện</td><td class="text-right font-weight-bold">${nf(b.luot)}</td></tr>
      <tr><td colspan="2">${bar(b.pl100)}</td></tr>
      <tr><td>Doanh thu 100%</td><td class="text-right">${nf(b.d100)}</td></tr>
      <tr><td>Đã thu</td><td class="text-right font-weight-bold">${nf(b.dt)}</td></tr>
      <tr><td colspan="2">${bar(b.pd100)}</td></tr>
    </table>
    ${extra || ''}
  </div>`;
}

function renderTarget() {
  const t = D.target;
  if (!t) {
    $('ct').innerHTML =
      '<div class="card-app"><div class="card-body"><span class="none">Chưa có sheet CHỈ TIÊU. Trong Google Sheets chọn menu Trợ lý AI &gt; Cập nhật tính năng mới.</span></div></div>';
    return;
  }
  const right = ctBlock(t.monthLabel || 'Tháng hiện tại', t.m);
  $('ct').innerHTML = `<div class="card-app"><div class="card-header"><span class="card-title">Chỉ tiêu quý ${esc(t.quy)}/${esc(t.nam)}</span></div>
    <div class="card-body"><div class="row"><div class="col-md-6">${ctBlock('QUÝ ' + t.quy, t.q)}</div><div class="col-md-6">${right}</div></div></div></div>`;
}

function renderLate() {
  const L = D.late;
  if (L === null) {
    $('late').innerHTML =
      '<span class="none">Chưa có sheet VÀO TRỄ RA SỚM. Trong Google Sheets chọn menu Trợ lý AI &gt; Cập nhật tính năng mới.</span>';
    return;
  }
  $('late').innerHTML = L.length
    ? L.map(x => {
        const p = BASE.staff.find(s => s.code === x.code);
        const nm = p ? (p.title ? TT[p.title] + ' ' : '') + p.name : x.code;
        const badge = x.over ? 'bad' : x.n >= x.lim ? 'warn' : 'ok';
        return `<span class="badge-pill-role ${x.over ? 'ghost' : ''}" data-code="${esc(x.code)}" data-q="${esc((p ? p.title + ' ' + p.name : x.code).toLowerCase())}" title="${esc(x.note || '')}">
          ${esc(nm)} · ${esc(x.kind)}
          <span class="badge-count ${badge}">${x.n}/${x.lim}</span>
          ${x.over ? ' <b class="text-danger">⚠ vượt</b>' : ''}
        </span>`;
      }).join('')
    : '<span class="none">Không có ai xin vào trễ / ra sớm trong ngày này</span>';
}

function renderBed() {
  const b = D.bed;
  if (b === null) {
    $('bed').innerHTML =
      '<span class="none">Chưa có sheet TẠI GIƯỜNG. Trong Google Sheets chọn menu Trợ lý AI &gt; Cập nhật tính năng mới.</span>';
    return;
  }
  if (!b.found) {
    $('bed').innerHTML =
      '<span class="none">Chưa có phân công tại giường ngày ' +
      dmy(D.iso) +
      '. Bấm "Trợ lý AI" và dán tin nhắn của Trưởng khoa.</span>';
    return;
  }
  const rows = [
    ['Sáng', b.sang],
    ['Chiều', b.chieu]
  ];
  $('bd').textContent = dmy(D.iso);
  $('bed').innerHTML = rows
    .map(a => {
      const x = a[1];
      const p = D.people.find(pp => pp.code === x.code);
      const cnt = (x.phieu != null ? x.phieu + ' phiếu' : '') + (x.bn != null ? ' · ' + x.bn + ' BN' : '');
      const who = p
        ? `<span class="${cls(p)}" data-code="${esc(p.code)}" data-q="${esc((p.title + ' ' + p.name).toLowerCase())}">${esc((p.title ? p.title + ' ' : '') + p.name)}<i>${esc(p.home.replace('Phòng ', 'P.'))}</i></span>`
        : x.code
          ? esc(x.code)
          : '<span class="none">Chưa phân công người</span>';
      return `<div class="room-card room${a[0] === D.session ? ' cur' : ''}"><div class="rh"><b>${a[0]}</b><span>${cnt}</span></div><div class="rb">${who}</div></div>`;
    })
    .join('');
}

function render() {
  const here = D.people.filter(p => p.status === 'Có mặt' || p.status === 'Luân chuyển');
  const gone = D.people.filter(p => p.status !== 'Có mặt' && p.status !== 'Luân chuyển');
  const mOk = D.machines.filter(m => m.status === 'Hoạt động').reduce((s, m) => s + m.qty, 0);
  const mBad = D.machines.filter(m => m.status !== 'Hoạt động').reduce((s, m) => s + m.qty, 0);
  const bedCode = D.bed && D.bed.found ? (view.s === 'Sáng' ? D.bed.sang : D.bed.chieu).code : '';
  const lateN = D.late ? D.late.length : 0;

  $('kpi').innerHTML = [
    { c: 'success', icon: 'fa-user-check', n: here.length, l: 'Có mặt' },
    { c: 'danger', icon: 'fa-user-times', n: gone.length, l: 'Vắng' },
    { c: 'info', icon: 'fa-bed', n: bedCode ? 1 : 0, l: 'Tại giường' },
    { c: 'success', icon: 'fa-cogs', n: mOk, l: 'Máy hoạt động' },
    { c: 'warning', icon: 'fa-tools', n: mBad, l: 'Bảo trì / hỏng' },
    { c: lateN > 2 ? 'danger' : 'primary', icon: 'fa-clock', n: lateN, l: 'Trễ / sớm hôm nay' }
  ]
    .map(
      k => `<div class="card-app mb-0"><div class="widget-chart">
      <div class="widget-icon bg-${k.c}-light"><i class="fas ${k.icon}"></i></div>
      <div class="widget-numbers">${k.n}</div>
      <div class="widget-subheading">${k.l}</div>
    </div></div>`
    )
    .join('');

  $('abs').innerHTML = gone.length
    ? gone
        .map(
          p =>
            `<span class="badge-pill-role" data-code="${esc(p.code)}" data-q="${esc((p.title + ' ' + p.name).toLowerCase())}">${esc((p.title ? p.title + ' ' : '') + p.name)} · ${esc(p.status)}${p.reason ? ' (' + esc(p.reason) + ')' : ''}</span>`
        )
        .join('')
    : '<span class="none">Không ai vắng</span>';

  renderLate();
  renderTarget();
  renderBed();

  $('f2').innerHTML = F2.map(card).join('') + '<div class="hall">HÀNH LANG</div>';
  $('f6').innerHTML = F6.map(card).join('');

  const known = new Set([...F2, ...F6].map(x => x.k));
  const extra = (D.rooms || []).filter(r => !known.has(r));
  $('fx').innerHTML = extra.length
    ? '<h5 class="mt-3 mb-2 text-muted text-uppercase" style="font-size:0.8rem;letter-spacing:.04em">Phòng khác</h5><div class="fx">' +
      extra.map(r => card({ k: r, l: r.replace('Phòng ', 'P.') })).join('') +
      '</div>'
    : '';

  search();
  sync();
}

function search() {
  const q = ($('q').value || '').trim().toLowerCase();
  let first = null;
  document.querySelectorAll('.badge-pill-role, .m1').forEach(e => {
    const h = q && (e.dataset.q || '').includes(q);
    e.classList.toggle('hit', !!h);
    if (h && !first) first = e;
  });
  document.querySelectorAll('.room-card').forEach(r => r.classList.toggle('hit', !!r.querySelector('.hit')));
  if (first && q.length > 1) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ---------- AI ---------- */
function openAI() {
  ai = true;
  $('cmdbar').classList.add('show');
  sync();
  $('cmd').focus();
}
function pinModal(then) {
  modal(`<h3>Nhập mã PIN để dùng Trợ lý AI</h3>
    <input type="password" id="f_pin" autocomplete="off" aria-label="Mã PIN">
    <div id="merr"></div>
    <div class="row">
      <button class="btn-app btn-outline-secondary" onclick="closeModal()">Hủy</button>
      <button class="btn-app btn-primary" id="ok">Vào</button>
    </div>`);
  $('f_pin').focus();
  const go = () => {
    const v = $('f_pin').value;
    $('ok').disabled = true;
    call('webVerifyPin', { pin: v })
      .then(() => {
        pin = v;
        closeModal();
        then();
      })
      .catch(e => {
        $('ok').disabled = false;
        $('merr').textContent = e.message;
        $('merr').className = 'msg e';
      });
  };
  $('ok').onclick = go;
  $('f_pin').onkeydown = e => {
    if (e.key === 'Enter') go();
  };
}

function box(c, t) {
  const d = document.createElement('div');
  d.className = 'msg ' + c;
  d.textContent = t;
  $('res').appendChild(d);
}

/* ---------- Shell UI (sidebar, theme, mobile) ---------- */
function initShell() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  document.getElementById('btnToggleSidebar').addEventListener('click', () => {
    if (window.innerWidth < 1200) {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('show');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });
  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
  });

  // Theme
  const saved = localStorage.getItem('vltl-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btnTheme = document.getElementById('btnTheme');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vltl-theme', next);
    });
  }

  // Nav active (scroll sections)
  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const id = el.getAttribute('data-scroll');
      const t = document.getElementById(id);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.nav-link-app').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      if (window.innerWidth < 1200) {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('show');
      }
    });
  });

  // Shortcut /
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      $('q').focus();
    }
  });

  // Example chips
  document.querySelectorAll('.chip-ex').forEach(c => {
    c.addEventListener('click', () => {
      $('cmd').value = c.dataset.cmd || c.textContent;
      $('cmd').focus();
    });
  });
}

/* ---------- Events ---------- */
function bindEvents() {
  $('ov').addEventListener('mousedown', e => {
    if (e.target === $('ov')) closeModal();
  });

  $('ab').onclick = () => {
    if (ai) {
      ai = false;
      $('cmdbar').classList.remove('show');
      sync();
      return;
    }
    if (pin) openAI();
    else pinModal(openAI);
  };
  if ($('fabAi')) {
    $('fabAi').onclick = () => $('ab').click();
  }

  $('parse').onclick = () => {
    const t = $('cmd').value.trim();
    $('res').innerHTML = '';
    pending = null;
    if (!t) return;
    $('parse').disabled = true;
    $('parse').textContent = 'Đang xử lý…';
    box('a', 'Đang phân tích lệnh…');
    call('webParse', { pin: pin, text: t })
      .then(r => {
        $('res').innerHTML = '';
        r.questions.forEach(q => box('a', 'Cần làm rõ: ' + q));
        r.errors.forEach(e => box('e', e));
        if (r.actions.length) {
          const tb = document.createElement('div');
          tb.className = 'msg';
          tb.style.background = 'rgba(63,106,216,0.06)';
          tb.style.border = '1px solid rgba(63,106,216,0.25)';
          tb.innerHTML = r.actions
            .map(a => `<b${a.nguy_hiem ? ' style="color:#d92550"' : ''}>${esc(a.nhan)}</b>: ${esc(a.mo_ta)}`)
            .join('<hr style="border:0;border-top:1px solid var(--border)">');
          $('res').appendChild(tb);
          if (!r.errors.length && !r.questions.length) {
            pending = r.actions;
            const b = document.createElement('button');
            b.className = 'btn-app btn-primary';
            b.textContent = 'Xác nhận thực hiện';
            b.style.marginTop = '8px';
            b.onclick = () => {
              b.disabled = true;
              b.textContent = 'Đang ghi…';
              call('webCommit', { pin: pin, actions: pending })
                .then(x => {
                  $('res').innerHTML = '';
                  $('cmd').value = '';
                  box('o', 'Đã thực hiện ' + x.n + ' thao tác:\n- ' + x.messages.join('\n- '));
                  load(true);
                  toast('Đã ghi ' + x.n + ' thao tác');
                })
                .catch(e => {
                  b.disabled = false;
                  b.textContent = 'Xác nhận thực hiện';
                  box('e', e.message);
                });
            };
            $('res').appendChild(b);
          }
        } else if (!r.questions.length && !r.errors.length) box('e', 'Không tạo được thao tác nào. Hãy viết lại lệnh.');
      })
      .catch(e => {
        $('res').innerHTML = '';
        box('e', e.message);
      })
      .finally(() => {
        $('parse').disabled = false;
        $('parse').textContent = 'Phân tích';
      });
  };

  $('undo').onclick = () => {
    $('res').innerHTML = '';
    call('webUndo', { pin: pin })
      .then(r => {
        box('o', 'Đã hoàn tác ' + r.n + ' dòng vừa ghi (điều động / vào trễ - ra sớm).');
        load(true);
        toast('Đã hoàn tác');
      })
      .catch(e => box('e', e.message));
  };

  const setDate = v => {
    if (v) {
      view.iso = v;
      build();
    }
  };
  $('d').onchange = e => setDate(e.target.value);
  if ($('d-m')) $('d-m').onchange = e => setDate(e.target.value);

  const setSession = s => {
    view.s = s;
    build();
  };
  $('bs').onclick = () => setSession('Sáng');
  $('bc').onclick = () => setSession('Chiều');
  if ($('bs-m')) {
    $('bs-m').onclick = () => setSession('Sáng');
    $('bc-m').onclick = () => setSession('Chiều');
  }

  $('today').onclick = () => {
    view.iso = todayIso();
    view.s = new Date().getHours() < 12 ? 'Sáng' : 'Chiều';
    build();
  };
  if ($('today-m')) $('today-m').onclick = () => $('today').click();

  $('q').oninput = search;

  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-code]');
    if (t && BASE && D) showPerson(t.getAttribute('data-code'));
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initShell();
  bindEvents();
  sync();
  load();
  setInterval(() => {
    if (!document.hidden && !$('ov').classList.contains('on')) load();
  }, 300000);
});
