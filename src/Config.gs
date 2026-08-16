const APP = Object.freeze({
  NAME: 'Jadwal Pelayanan',
  CHURCH: 'GPdI PNiel Deltamas',
  TZ: 'Asia/Jakarta',
  OTP_TTL_SECONDS: 600,
  OTP_MAX_ATTEMPTS: 5,
  SESSION_TTL_SECONDS: 21600,
  SWAP_EXPIRY_HOURS: 72,
  SHEETS: Object.freeze({
    SCHEDULES: 'Jadwal',
    SERVANTS: 'Petugas',
    SWAPS: 'Pertukaran',
    VERIFICATIONS: 'Verifikasi',
    AUDIT: 'AuditLog',
    CONFIG: 'Config'
  })
});

const HEADERS = Object.freeze({
  Jadwal: ['id','tanggal','jam','ibadah','tugas','namaPetugas','emailPetugas','status','createdAt','updatedAt'],
  Petugas: ['id','nama','email','aktif','createdAt','updatedAt'],
  Pertukaran: ['id','jadwalId','emailAsal','namaAsal','emailPengganti','namaPengganti','alasan','status','tokenPengganti','createdAt','respondedAt','decidedAt','decidedBy','updatedAt'],
  Verifikasi: ['id','email','purpose','codeHash','attempts','expiresAt','usedAt','createdAt'],
  AuditLog: ['id','actor','action','entity','entityId','detail','createdAt'],
  Config: ['key','value','updatedAt']
});

function getRequiredProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Konfigurasi belum lengkap: ' + name);
  return value;
}

function getAdminEmail_() {
  return (PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || 'vianteomail@gmail.com').toLowerCase();
}

function nowIso_() { return new Date().toISOString(); }
function uuid_() { return Utilities.getUuid(); }
function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function cleanText_(value, max) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, max || 250); }
function formatDate_(value, pattern) { return Utilities.formatDate(new Date(value), APP.TZ, pattern || 'yyyy-MM-dd'); }
