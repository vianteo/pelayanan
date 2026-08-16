function createSwap_(payload, sessionToken) {
  const session = requireSession_(sessionToken, ['PETUGAS']);
  payload = payload || {};
  const schedule = findById_(APP.SHEETS.SCHEDULES, payload.jadwalId);
  if (!schedule || String(schedule.status) !== 'AKTIF') throw new Error('Jadwal tidak ditemukan.');
  if (normalizeEmail_(schedule.emailPetugas) !== normalizeEmail_(session.email)) throw new Error('Anda tidak berhak menukar jadwal ini.');
  const replacementEmail = normalizeEmail_(payload.emailPengganti);
  if (!isEmail_(replacementEmail) || replacementEmail === normalizeEmail_(session.email)) throw new Error('Email petugas pengganti tidak valid.');
  const active = sheetRows_(APP.SHEETS.SWAPS).find(function (x) { return String(x.jadwalId) === String(schedule.id) && ['MENUNGGU_PENGGANTI','MENUNGGU_ADMIN'].indexOf(String(x.status)) >= 0; });
  if (active) throw new Error('Pengajuan aktif untuk jadwal ini sudah ada.');
  const item = {
    id: uuid_(), jadwalId: schedule.id, emailAsal: normalizeEmail_(session.email), namaAsal: String(schedule.namaPetugas),
    emailPengganti: replacementEmail, namaPengganti: cleanText_(payload.namaPengganti, 100), alasan: cleanText_(payload.alasan, 500),
    status: 'MENUNGGU_PENGGANTI', tokenPengganti: uuid_(), createdAt: nowIso_(), respondedAt: '', decidedAt: '', decidedBy: '', updatedAt: nowIso_()
  };
  if (!item.namaPengganti || !item.alasan) throw new Error('Nama pengganti dan alasan wajib diisi.');
  appendRow_(APP.SHEETS.SWAPS, item);
  sendReplacementRequestEmail_(item, schedule);
  audit_(session.email, 'SWAP_CREATED', 'Swap', item.id, { scheduleId: schedule.id, replacement: replacementEmail });
  return swapView_(item, schedule);
}

function respondSwap_(payload, sessionToken) {
  const session = requireSession_(sessionToken, ['PENGGANTI']);
  const swap = findById_(APP.SHEETS.SWAPS, payload.id);
  if (!swap || String(swap.status) !== 'MENUNGGU_PENGGANTI') throw new Error('Pengajuan tidak ditemukan atau sudah diproses.');
  if (normalizeEmail_(swap.emailPengganti) !== normalizeEmail_(session.email)) throw new Error('Anda tidak berhak merespons pengajuan ini.');
  const accept = String(payload.decision).toUpperCase() === 'ACCEPT';
  const status = accept ? 'MENUNGGU_ADMIN' : 'DITOLAK_PENGGANTI';
  updateRow_(APP.SHEETS.SWAPS, swap._row, { status: status, respondedAt: nowIso_(), updatedAt: nowIso_() });
  const schedule = findById_(APP.SHEETS.SCHEDULES, swap.jadwalId);
  sendSwapStatusEmail_(Object.assign({}, swap, {status: status}), schedule);
  audit_(session.email, accept ? 'SWAP_ACCEPTED_BY_REPLACEMENT' : 'SWAP_REJECTED_BY_REPLACEMENT', 'Swap', swap.id, {});
  return { id: swap.id, status: status };
}

function adminDecideSwap_(id, decision, actor) {
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const swap = findById_(APP.SHEETS.SWAPS, id);
    if (!swap || String(swap.status) !== 'MENUNGGU_ADMIN') throw new Error('Pengajuan belum diterima pengganti atau sudah diproses.');
    const schedule = findById_(APP.SHEETS.SCHEDULES, swap.jadwalId);
    if (!schedule || String(schedule.status) !== 'AKTIF') throw new Error('Jadwal tidak ditemukan.');
    const approve = String(decision).toUpperCase() === 'APPROVE';
    const status = approve ? 'DISETUJUI' : 'DITOLAK_ADMIN';
    if (approve) updateRow_(APP.SHEETS.SCHEDULES, schedule._row, { namaPetugas: swap.namaPengganti, emailPetugas: swap.emailPengganti, updatedAt: nowIso_() });
    updateRow_(APP.SHEETS.SWAPS, swap._row, { status: status, decidedAt: nowIso_(), decidedBy: actor, updatedAt: nowIso_() });
    sendSwapStatusEmail_(Object.assign({}, swap, {status: status}), schedule);
    audit_(actor, approve ? 'SWAP_APPROVED' : 'SWAP_REJECTED_BY_ADMIN', 'Swap', swap.id, { scheduleId: schedule.id });
    return { id: swap.id, status: status };
  } finally { lock.releaseLock(); }
}

function listMySwaps_(token) {
  const session = requireSession_(token, ['PETUGAS','PENGGANTI']);
  return sheetRows_(APP.SHEETS.SWAPS).filter(function (x) { return [normalizeEmail_(x.emailAsal), normalizeEmail_(x.emailPengganti)].indexOf(normalizeEmail_(session.email)) >= 0; }).map(function (x) { return swapView_(x, findById_(APP.SHEETS.SCHEDULES, x.jadwalId)); });
}

function swapView_(x, schedule) { return { id: String(x.id), schedule: schedule ? publicSchedule_(schedule) : null, namaAsal: String(x.namaAsal), namaPengganti: String(x.namaPengganti), alasan: String(x.alasan), status: String(x.status), createdAt: String(x.createdAt) }; }

function adminDashboard_() {
  return { schedule: sheetRows_(APP.SHEETS.SCHEDULES).filter(function(x){ return String(x.status) === 'AKTIF'; }).map(function(x){ const v=publicSchedule_(x); v.emailPetugas=String(x.emailPetugas); return v; }), swaps: sheetRows_(APP.SHEETS.SWAPS).filter(function(x){ return ['MENUNGGU_PENGGANTI','MENUNGGU_ADMIN'].indexOf(String(x.status)) >= 0; }).map(function(x){ return swapView_(x, findById_(APP.SHEETS.SCHEDULES, x.jadwalId)); }) };
}
