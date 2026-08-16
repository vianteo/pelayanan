function requestOtp_(email, purpose) {
  email = normalizeEmail_(email);
  purpose = cleanText_(purpose, 30);
  if (!isEmail_(email)) throw new Error('Email tidak valid.');
  if (['PETUGAS','PENGGANTI','ADMIN'].indexOf(purpose) < 0) throw new Error('Tujuan verifikasi tidak valid.');
  if (purpose === 'ADMIN' && email !== getAdminEmail_()) throw new Error('Email tidak berhak sebagai admin.');

  const recentKey = 'otp-rate:' + digest_(email + ':' + purpose);
  const cache = CacheService.getScriptCache();
  if (cache.get(recentKey)) throw new Error('Permintaan kode terlalu banyak. Tunggu satu menit.');

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record = {
    id: uuid_(), email: email, purpose: purpose,
    codeHash: digest_(email + ':' + purpose + ':' + code), attempts: 0,
    expiresAt: new Date(Date.now() + APP.OTP_TTL_SECONDS * 1000).toISOString(), usedAt: '', createdAt: nowIso_()
  };
  appendRow_(APP.SHEETS.VERIFICATIONS, record);
  sendOtpEmail_(email, code, purpose);
  cache.put(recentKey, '1', 60);
  audit_(email, 'OTP_REQUESTED', 'Verification', record.id, { purpose: purpose });
  return { sent: true, maskedEmail: maskEmail_(email), expiresInSeconds: APP.OTP_TTL_SECONDS };
}

function verifyOtp_(email, purpose, code) {
  email = normalizeEmail_(email);
  purpose = cleanText_(purpose, 30);
  code = String(code || '').trim();
  const candidates = sheetRows_(APP.SHEETS.VERIFICATIONS).filter(function (x) {
    return normalizeEmail_(x.email) === email && String(x.purpose) === purpose && !x.usedAt;
  }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  const record = candidates[0];
  if (!record) throw new Error('Kode verifikasi tidak ditemukan.');
  if (new Date(record.expiresAt) < new Date()) throw new Error('Kode verifikasi sudah kedaluwarsa.');
  if (Number(record.attempts) >= APP.OTP_MAX_ATTEMPTS) throw new Error('Percobaan verifikasi terlalu banyak.');
  if (record.codeHash !== digest_(email + ':' + purpose + ':' + code)) {
    updateRow_(APP.SHEETS.VERIFICATIONS, record._row, { attempts: Number(record.attempts) + 1 });
    throw new Error('Kode verifikasi tidak valid.');
  }
  updateRow_(APP.SHEETS.VERIFICATIONS, record._row, { usedAt: nowIso_() });
  const token = createSession_(email, purpose);
  audit_(email, 'OTP_VERIFIED', 'Verification', record.id, { purpose: purpose });
  return { token: token, email: email, purpose: purpose, expiresInSeconds: APP.SESSION_TTL_SECONDS };
}

function createSession_(email, purpose) {
  const payload = { email: email, purpose: purpose, exp: Date.now() + APP.SESSION_TTL_SECONDS * 1000, nonce: uuid_() };
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  return body + '.' + digest_(body);
}

function requireSession_(token, purposes) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || digest_(parts[0]) !== parts[1]) throw new Error('Sesi tidak valid.');
  let payload;
  try { payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (e) { throw new Error('Sesi tidak valid.'); }
  if (Number(payload.exp) < Date.now()) throw new Error('Sesi sudah kedaluwarsa.');
  if (purposes && purposes.indexOf(payload.purpose) < 0) throw new Error('Sesi tidak berhak melakukan tindakan ini.');
  return payload;
}

function requireAdmin_(token) {
  const session = requireSession_(token, ['ADMIN']);
  if (normalizeEmail_(session.email) !== getAdminEmail_()) throw new Error('Sesi tidak berhak sebagai admin.');
  return session;
}

function digest_(value) {
  const secret = getRequiredProperty_('OTP_SIGNING_SECRET');
  const bytes = Utilities.computeHmacSha256Signature(String(value), secret);
  return Utilities.base64EncodeWebSafe(bytes);
}

function isEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')); }
function maskEmail_(email) { const p = String(email).split('@'); return p[0].slice(0, 2) + '***@' + (p[1] || ''); }
