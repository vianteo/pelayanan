function sendOtpEmail_(email, code, purpose) {
  const label = purpose === 'ADMIN' ? 'akses admin' : (purpose === 'PENGGANTI' ? 'konfirmasi petugas pengganti' : 'pengajuan pertukaran');
  MailApp.sendEmail({
    to: email,
    subject: code + ' — Kode verifikasi ' + APP.NAME,
    htmlBody: '<p>Shalom,</p><p>Kode verifikasi untuk <b>' + label + '</b> adalah:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">' + code + '</p><p>Kode berlaku 10 menit. Abaikan email ini bila Anda tidak memintanya.</p><p>' + APP.CHURCH + '</p>',
    name: APP.NAME
  });
}

function sendReplacementRequestEmail_(swap, schedule) {
  MailApp.sendEmail({
    to: swap.emailPengganti,
    subject: 'Permintaan Tukar Jadwal Pelayanan',
    htmlBody: '<p>Shalom ' + escapeHtml_(swap.namaPengganti) + ',</p><p>' + escapeHtml_(swap.namaAsal) + ' meminta Anda menggantikan pelayanan:</p>' + scheduleEmailTable_(schedule) + '<p>Alasan: ' + escapeHtml_(swap.alasan) + '</p><p>Buka <a href="' + escapeHtml_(getRequiredProperty_('APP_BASE_URL')) + '">' + APP.NAME + '</a>, pilih menu <b>Tukar Jadwal</b>, lalu verifikasi email ini untuk menerima atau menolak.</p>',
    name: APP.NAME
  });
}

function sendSwapStatusEmail_(swap, schedule) {
  const recipients = [swap.emailAsal, swap.emailPengganti, getAdminEmail_()].filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;}).join(',');
  MailApp.sendEmail({
    to: recipients,
    subject: 'Status Tukar Jadwal: ' + String(swap.status).replace(/_/g, ' '),
    htmlBody: '<p>Status pengajuan pertukaran jadwal berubah menjadi <b>' + escapeHtml_(String(swap.status).replace(/_/g, ' ')) + '</b>.</p>' + scheduleEmailTable_(schedule) + '<p>Silakan buka <a href="' + escapeHtml_(getRequiredProperty_('APP_BASE_URL')) + '">' + APP.NAME + '</a> untuk melihat detail.</p>',
    name: APP.NAME
  });
}

function scheduleEmailTable_(schedule) {
  if (!schedule) return '';
  return '<table cellpadding="6" style="border-collapse:collapse"><tr><td>Tanggal</td><td><b>' + escapeHtml_(formatDate_(schedule.tanggal,'dd MMMM yyyy')) + '</b></td></tr><tr><td>Jam</td><td>' + escapeHtml_(schedule.jam) + ' WIB</td></tr><tr><td>Ibadah</td><td>' + escapeHtml_(schedule.ibadah) + '</td></tr><tr><td>Tugas</td><td>' + escapeHtml_(schedule.tugas) + '</td></tr></table>';
}

function escapeHtml_(value) { return String(value || '').replace(/[&<>'"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
