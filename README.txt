DIHO KASIR KUPANG — PROYEK BARU

Isi:
- index.html: tampilan aplikasi
- app.js: logika kasir, stok, transaksi, laporan, backup/restore, dan scan
- manifest.json: konfigurasi instalasi PWA
- sw.js: cache/offline dasar
- robin-maskot.jpg: gambar maskot dashboard

CARA PUBLISH GITHUB PAGES
1. Buat repository GitHub baru bernama diho-kasir-kupang.
2. Ekstrak ZIP ini.
3. Upload semua 5 file (bukan file ZIP) ke folder root repository.
4. Commit changes.
5. Settings > Pages > Deploy from a branch > main > /(root) > Save.
6. Buka URL GitHub Pages repository tersebut melalui HTTPS.

Catatan:
- Data aplikasi disimpan di perangkat/browser melalui localStorage, bukan database cloud.
- Namespace penyimpanan baru memakai diho_kupang_ agar terpisah dari proyek DIHO lama.
- Kamera memerlukan HTTPS, izin kamera, dan dukungan BarcodeDetector pada browser.
- Bunyi scan aktif saat UPC/barcode cocok dengan produk tersimpan. Pastikan volume media aktif.
- Sebelum mengganti perangkat atau menghapus data situs, lakukan Backup Data.
