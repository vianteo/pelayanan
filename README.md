# Jadwal Pelayanan — GPdI PNiel Deltamas

Web app Google Apps Script dengan Google Sheets, OTP email, persetujuan pertukaran dua tahap, pengingat H-1, dan shell PWA Firebase Hosting.

## Fitur

- Jadwal publik yang nyaman di HP.
- Petugas mengajukan pertukaran setelah verifikasi email.
- Pengganti menerima/menolak, kemudian admin memutuskan.
- Admin mengelola jadwal melalui web.
- Email status dan pengingat otomatis H-1 pukul 19.00 WIB.
- Audit log, perlindungan pengajuan ganda, dan LockService.
- PWA yang dapat ditambahkan ke layar utama.

## Struktur

- `src/`: kode Apps Script dan HTML Service.
- `public/`: shell PWA untuk Firebase Hosting.
- `spec/`: requirement yang telah disetujui.
- `.agent/`: konteks iterasi AI/Codex.
- `scripts/`: validasi, onboarding clasp, deploy, dan rollback.

## Setup pertama

1. Aktifkan **Google Apps Script API** pada akun `vianteomail@gmail.com`.
2. Buka Codespace pada branch aplikasi dan jalankan `npm run setup:apps-script`.
3. Ikuti URL OAuth di terminal. Jangan menaruh kode, token, Script ID, atau JSON kredensial di chat/repository.
4. Pastikan terminal hanya mengonfirmasi nama `CLASPRC_JSON` dan `CLASP_JSON`.
5. Buat Google Sheet kosong bernama **Jadwal Pelayanan** di akun yang sama.
6. Setelah deployment pertama, isi Script Properties: `PRIMARY_SPREADSHEET_ID`, `ADMIN_EMAIL`, `APP_BASE_URL`, `OTP_SIGNING_SECRET`.
7. Jalankan `setupApplication()` satu kali dari Apps Script untuk membuat tab dan trigger.

## PWA dan URL ringkas

Firebase Hosting memakai folder `public/`. Buat project Firebase gratis dengan site ID yang tersedia, lalu ganti placeholder `__GAS_WEB_APP_URL__` saat deployment dengan URL production Apps Script. Deploy dengan Firebase CLI. URL menjadi `https://SITE_ID.web.app` dan dapat dipasang melalui **Add to Home Screen**.

PWA hanya menyimpan shell aplikasi. Membaca jadwal terbaru, OTP, dan perubahan data tetap membutuhkan internet.

## Pengembangan

```bash
npm ci --no-audit --no-fund
npm run validate
npm test
```

GitHub adalah sumber kebenaran. Perubahan langsung di editor Apps Script dianggap drift dan harus diimpor kembali sebelum pengembangan dilanjutkan.
