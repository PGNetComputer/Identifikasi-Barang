/**
 * Service worker Identifikasi Barang.
 *
 * Tugasnya cuma satu: menyimpan tampilan aplikasi (HTML, manifest, ikon)
 * supaya tetap bisa dibuka walau tanpa sinyal. Datanya sendiri disimpan
 * terpisah oleh halaman di localStorage, bukan di sini.
 *
 * Strategi: coba ambil versi terbaru dari internet dulu; kalau gagal
 * (tanpa sinyal), pakai salinan terakhir. Jadi setiap kali tampilan
 * diperbarui di GitHub, HP langsung ikut tanpa perlu mengubah berkas ini.
 *
 * Panggilan ke Apps Script (domain lain) sengaja TIDAK disentuh.
 */
var CACHE = 'identifikasi-v1';
var ASET = [
  './',
  './index.html',
  './manifest.json',
  './ikon-192.png',
  './ikon-512.png',
  './ikon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASET); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (kunci) {
        return Promise.all(kunci
          .filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   // Apps Script: lewat saja

  e.respondWith(
    fetch(req)
      .then(function (resp) {
        if (resp && resp.ok) {
          var salinan = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, salinan); });
        }
        return resp;
      })
      .catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('./index.html');
        });
      })
  );
});
