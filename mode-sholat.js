
/* Pengaturan mode jadwal Sholat.
   'auto'    = mengikuti bulan Hijriah
   'ramadan' = selalu menggunakan jadwal Ramadan
   'biasa'   = selalu menggunakan jadwal biasa
*/
(function () {
  'use strict';

  const MODE_SHOLAT = 'ramadan';

  function isRamadan(data) {
    if (MODE_SHOLAT === 'ramadan') return true;
    if (MODE_SHOLAT === 'biasa') return false;

    const hijri = data && data.date && data.date.hijri;
    const month = Number(hijri && hijri.month && hijri.month.number);

    return month === 9;
  }

  window.ShowTimeMode = { isRamadan };
})();
