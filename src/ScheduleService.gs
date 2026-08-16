function listSchedules_(filters) {
  filters = filters || {};
  const from = filters.from ? new Date(filters.from) : new Date(new Date().setHours(0,0,0,0));
  const to = filters.to ? new Date(filters.to) : new Date(Date.now() + 90 * 86400000);
  const search = cleanText_(filters.search, 80).toLowerCase();
  return sheetRows_(APP.SHEETS.SCHEDULES).filter(function (x) {
    const date = new Date(x.tanggal);
    const haystack = [x.ibadah,x.tugas,x.namaPetugas].join(' ').toLowerCase();
    return String(x.status || 'AKTIF') === 'AKTIF' && date >= from && date <= to && (!search || haystack.indexOf(search) >= 0);
  }).sort(function (a,b) { return new Date(a.tanggal + ' ' + a.jam) - new Date(b.tanggal + ' ' + b.jam); }).map(publicSchedule_);
}

function publicSchedule_(x) {
  return { id: String(x.id), tanggal: formatDate_(x.tanggal), tanggalLabel: formatDate_(x.tanggal, 'EEEE, dd MMMM yyyy'), jam: String(x.jam), ibadah: String(x.ibadah), tugas: String(x.tugas), namaPetugas: String(x.namaPetugas) };
}

function saveSchedule_(payload, actor) {
  payload = payload || {};
  const item = {
    tanggal: cleanText_(payload.tanggal, 10), jam: cleanText_(payload.jam, 5),
    ibadah: cleanText_(payload.ibadah, 100), tugas: cleanText_(payload.tugas, 100),
    namaPetugas: cleanText_(payload.namaPetugas, 100), emailPetugas: normalizeEmail_(payload.emailPetugas)
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.tanggal) || !/^\d{2}:\d{2}$/.test(item.jam)) throw new Error('Tanggal atau jam tidak valid.');
  if (!item.ibadah || !item.tugas || !item.namaPetugas || !isEmail_(item.emailPetugas)) throw new Error('Semua data jadwal wajib diisi dengan benar.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    if (payload.id) {
      const existing = findById_(APP.SHEETS.SCHEDULES, payload.id);
      if (!existing) throw new Error('Jadwal tidak ditemukan.');
      item.updatedAt = nowIso_(); item.status = 'AKTIF';
      updateRow_(APP.SHEETS.SCHEDULES, existing._row, item);
      audit_(actor, 'SCHEDULE_UPDATED', 'Schedule', payload.id, item);
      return publicSchedule_(Object.assign({}, existing, item));
    }
    item.id = uuid_(); item.status = 'AKTIF'; item.createdAt = nowIso_(); item.updatedAt = item.createdAt;
    appendRow_(APP.SHEETS.SCHEDULES, item);
    audit_(actor, 'SCHEDULE_CREATED', 'Schedule', item.id, item);
    return publicSchedule_(item);
  } finally { lock.releaseLock(); }
}

function deleteSchedule_(id, actor) {
  const existing = findById_(APP.SHEETS.SCHEDULES, id);
  if (!existing) throw new Error('Jadwal tidak ditemukan.');
  updateRow_(APP.SHEETS.SCHEDULES, existing._row, { status: 'NONAKTIF', updatedAt: nowIso_() });
  audit_(actor, 'SCHEDULE_DELETED', 'Schedule', id, {});
  return { id: id, deleted: true };
}
