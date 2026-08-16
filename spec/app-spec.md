# Spesifikasi Aplikasi Jadwal Pelayanan

Status: disetujui pengguna pada 16 Agustus 2026.

## Tujuan dan pengguna

Web app/PWA untuk menampilkan dan mengelola jadwal pelayanan GPdI PNiel Deltamas, mengajukan pertukaran, memperoleh persetujuan dua tahap, dan menerima pengingat email H-1. Pengunjung dapat melihat jadwal. Petugas terverifikasi dapat mengajukan/merespons. Admin utama adalah `vianteomail@gmail.com`.

## Arsitektur

- Google Apps Script V8 sebagai backend dan UI aplikasi.
- Google Sheets sebagai penyimpanan terpilih.
- MailApp untuk OTP, status pertukaran, dan pengingat.
- Firebase Hosting sebagai shell PWA dan URL gratis `web.app`.
- Web app dijalankan sebagai pemilik dan dapat dibuka tanpa login Google.

## Kontrol akses

Email petugas diverifikasi dengan OTP 6 digit, berlaku 10 menit dan maksimum 5 percobaan. Session token ditandatangani di server. Peran, email pemilik jadwal, dan status selalu diperiksa di server. Email tidak ditampilkan pada jadwal publik.

## Alur pertukaran

1. Petugas asal memverifikasi email dan memilih jadwal miliknya.
2. Petugas menentukan nama/email pengganti dan alasan.
3. Pengganti memverifikasi email lalu menerima/menolak.
4. Jika diterima, admin memverifikasi email lalu menyetujui/menolak.
5. Persetujuan admin memperbarui jadwal dengan LockService dan menulis AuditLog.

Status: `MENUNGGU_PENGGANTI`, `MENUNGGU_ADMIN`, `DISETUJUI`, `DITOLAK_PENGGANTI`, `DITOLAK_ADMIN`, `DIBATALKAN`, `KEDALUWARSA`.

## Data

Sheets: `Jadwal`, `Petugas`, `Pertukaran`, `Verifikasi`, `AuditLog`, dan `Config`. Jadwal menyimpan tanggal, jam, ibadah, tugas, nama petugas, email petugas, status, dan audit timestamp.

## Otomatisasi

Trigger harian pukul 19.00 WIB mengirim pengingat untuk pelayanan esok hari. Trigger enam-jam mengakhiri permintaan pengganti yang lebih dari 72 jam. Pengajuan aktif ganda untuk jadwal yang sama ditolak.

## UI

Mobile-first, aksesibel, kontras jelas, tombol besar, pencarian, tampilan kosong/loading/error, portal admin, dan instalasi PWA. PWA tidak menyediakan perubahan data saat offline.

## OAuth dan konfigurasi

Scopes: Sheets, pengiriman email, dan pengelolaan trigger. Script Properties: `PRIMARY_SPREADSHEET_ID`, `ADMIN_EMAIL`, `APP_BASE_URL`, `OTP_SIGNING_SECRET`. Tidak menggunakan Admin SDK.

## Penerimaan

- Input invalid ditolak tanpa menulis data.
- Pengguna tanpa sesi yang benar tidak dapat mengubah jadwal.
- Pengajuan ganda ditolak.
- Pengganti harus menerima sebelum admin menyetujui.
- Kegagalan menjaga status konsisten dan dicatat secara aman.
- CI memvalidasi manifest, sintaks, konfigurasi, bootstrap, serta kebocoran rahasia.
- Deployment versioned mempertahankan URL Apps Script dan dapat di-rollback.

## Di luar v1

WhatsApp API, offline editing, domain berbayar, multi-admin, APK/Play Store, dan Google Calendar.
