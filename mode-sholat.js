/* Pengaturan mode jadwal Sholat.
   Pilihan: 'auto' (mengikuti bulan Hijriah), 'ramadan', atau 'biasa'.
   Parameter ?ujiRamadan=1 / ?ujiRamadan=0 tetap bisa dipakai untuk pengujian. */
(function () {
  'use strict';

  const MODE_SHOLAT = 'ramadan';

  function isRamadan(data) {
    const testMode = new URLSearchParams(window.location.search).get('ujiRamadan');
    if (testMode === '1') return true;
    if (testMode === '0') return false;

    if (MODE_SHOLAT === 'ramadan') return true;
    if (MODE_SHOLAT === 'biasa') return false;

    const hijri = data && data.date && data.date.hijri;
    return Number(hijri && hijri.month && hijri.month.number) === 9;
  }

  window.ShowTimeMode = { isRamadan: isRamadan };
})();
