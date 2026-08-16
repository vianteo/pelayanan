function setupTriggers() {
  ScriptApp.getProjectTriggers().filter(function(t){ return ['sendTomorrowReminders','expirePendingSwaps'].indexOf(t.getHandlerFunction()) >= 0; }).forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('sendTomorrowReminders').timeBased().everyDays(1).atHour(19).inTimezone(APP.TZ).create();
  ScriptApp.newTrigger('expirePendingSwaps').timeBased().everyHours(6).create();
  return { created: true };
}

function sendTomorrowReminders() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const target = formatDate_(tomorrow);
    sheetRows_(APP.SHEETS.SCHEDULES).filter(function(x){ return String(x.status) === 'AKTIF' && formatDate_(x.tanggal) === target && isEmail_(x.emailPetugas); }).forEach(function(x){
      MailApp.sendEmail({ to: x.emailPetugas, subject: 'Pengingat Pelayanan Besok', htmlBody: '<p>Shalom ' + escapeHtml_(x.namaPetugas) + ',</p><p>Besok Anda dijadwalkan melayani:</p>' + scheduleEmailTable_(x) + '<p>Tuhan memberkati pelayanan Anda.</p>', name: APP.NAME });
      audit_('system', 'REMINDER_SENT', 'Schedule', x.id, { to: maskEmail_(x.emailPetugas) });
    });
  } finally { lock.releaseLock(); }
}

function expirePendingSwaps() {
  const cutoff = Date.now() - APP.SWAP_EXPIRY_HOURS * 3600000;
  sheetRows_(APP.SHEETS.SWAPS).filter(function(x){ return String(x.status) === 'MENUNGGU_PENGGANTI' && new Date(x.createdAt).getTime() < cutoff; }).forEach(function(x){ updateRow_(APP.SHEETS.SWAPS, x._row, { status: 'KEDALUWARSA', updatedAt: nowIso_() }); audit_('system','SWAP_EXPIRED','Swap',x.id,{}); });
}
