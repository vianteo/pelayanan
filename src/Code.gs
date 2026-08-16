function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialRoute = cleanText_((e && e.parameter && e.parameter.route) || 'jadwal', 30);
  return template.evaluate()
    .setTitle(APP.NAME + ' — ' + APP.CHURCH)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function bootstrapApp() {
  return safeApi_(function () {
    return {
      app: { name: APP.NAME, church: APP.CHURCH, adminEmail: maskEmail_(getAdminEmail_()) },
      schedule: listSchedules_({}),
      serverTime: nowIso_()
    };
  });
}

function apiListSchedules(filters) { return safeApi_(function () { return listSchedules_(filters || {}); }); }
function apiRequestOtp(email, purpose) { return safeApi_(function () { return requestOtp_(email, purpose); }); }
function apiVerifyOtp(email, purpose, code) { return safeApi_(function () { return verifyOtp_(email, purpose, code); }); }
function apiCreateSwap(payload, sessionToken) { return safeApi_(function () { return createSwap_(payload, sessionToken); }); }
function apiRespondSwap(payload, sessionToken) { return safeApi_(function () { return respondSwap_(payload, sessionToken); }); }
function apiListMySwaps(sessionToken) { return safeApi_(function () { return listMySwaps_(sessionToken); }); }
function apiAdminDashboard(sessionToken) { return safeApi_(function () { requireAdmin_(sessionToken); return adminDashboard_(); }); }
function apiSaveSchedule(payload, sessionToken) { return safeApi_(function () { requireAdmin_(sessionToken); return saveSchedule_(payload, getAdminEmail_()); }); }
function apiDeleteSchedule(id, sessionToken) { return safeApi_(function () { requireAdmin_(sessionToken); return deleteSchedule_(id, getAdminEmail_()); }); }
function apiAdminDecideSwap(id, decision, sessionToken) { return safeApi_(function () { requireAdmin_(sessionToken); return adminDecideSwap_(id, decision, getAdminEmail_()); }); }

function safeApi_(work) {
  try { return { ok: true, data: work() }; }
  catch (error) {
    console.error(JSON.stringify({ severity: 'ERROR', message: error.message, stack: error.stack }));
    return { ok: false, error: userError_(error) };
  }
}

function userError_(error) {
  const message = String(error && error.message || 'Terjadi kesalahan.');
  if (/Konfigurasi belum lengkap|tidak valid|tidak ditemukan|tidak berhak|kedaluwarsa|terlalu banyak|sudah ada|wajib|ditolak|belum diterima/.test(message)) return message;
  return 'Layanan sedang mengalami kendala. Silakan coba kembali.';
}

function healthCheck() {
  const required = ['PRIMARY_SPREADSHEET_ID','ADMIN_EMAIL','APP_BASE_URL','OTP_SIGNING_SECRET'];
  const props = PropertiesService.getScriptProperties();
  return { ok: required.every(function (n) { return Boolean(props.getProperty(n)); }), missing: required.filter(function (n) { return !props.getProperty(n); }), checkedAt: nowIso_() };
}

function setupApplication() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_EMAIL')) props.setProperty('ADMIN_EMAIL', 'vianteomail@gmail.com');
  if (!props.getProperty('OTP_SIGNING_SECRET')) props.setProperty('OTP_SIGNING_SECRET', Utilities.getUuid() + Utilities.getUuid());
  ensureSheets_();
  setupTriggers();
  return healthCheck();
}
