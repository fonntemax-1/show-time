/* Logika mode jadwal Sholat.
   Prioritas:
   1. ?ujiRamadan=1 -> paksa mode Ramadan untuk pengujian.
   2. ?ujiRamadan=0 -> paksa mode biasa untuk pengujian.
   3. Tanpa parameter -> MODE_SHOLAT:
      'auto'    mengikuti bulan Hijriah dari data API,
      'ramadan' selalu Ramadan,
      'biasa'   selalu mode biasa.
*/
(function () {
  'use strict';

  const MODE_SHOLAT = 'auto';

  function isRamadan(data) {
    const testMode = new URLSearchParams(window.location.search).get('ujiRamadan');

    if (testMode === '1') return true;
    if (testMode === '0') return false;

    if (MODE_SHOLAT === 'ramadan') return true;
    if (MODE_SHOLAT === 'biasa') return false;

    const hijriMonth = Number(data && data.date && data.date.hijri &&
      data.date.hijri.month && data.date.hijri.month.number);

    return hijriMonth === 9;
  }

  window.ShowTimeMode = { isRamadan };
})();
