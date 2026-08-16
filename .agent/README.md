# Agent Context

Mulai dengan membaca `spec/app-spec.md`, `README.md`, dan `app.config.json`.

Aturan proyek:

- GitHub adalah sumber kode utama; jangan mengedit produksi langsung di Apps Script.
- Jangan commit `.clasp.json`, `.clasprc.json`, `.firebaserc`, token, Script ID, atau kredensial.
- Pertahankan alur pertukaran: petugas asal → petugas pengganti → admin.
- Semua otorisasi harus diperiksa kembali di server Apps Script.
- Jalankan `npm test` dan `npm run validate` sebelum mengusulkan perubahan.
- UI harus tetap mobile-first, berbahasa Indonesia, dan mudah digunakan pengguna awam.
