/* Logika tunggal mode jadwal Sholat.
   Pengujian URL:
   ?ujiRamadan=0 -> mode biasa
   ?ujiRamadan=1 -> mode Ramadan
   Tanpa parameter -> MODE_SHOLAT (auto / ramadan / biasa).
*/
(function () {
  'use strict';

  const MODE_SHOLAT = 'ramadan';

  function readTestMode() {
    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('ujiRamadan');
      if (value === '0' || value === '1') return value;
    } catch (error) {
      console.warn('[ShowTimeMode] Parameter pengujian tidak dapat dibaca.', error);
    }
    return null;
  }

  function isRamadan(data) {
    const testMode = readTestMode();

    if (testMode !== null) {
      const result = testMode === '1';
      console.info('[ShowTimeMode] Mode pengujian aktif:', result ? 'RAMADAN' : 'BIASA');
      return result;
    }

    if (MODE_SHOLAT === 'ramadan') return true;
    if (MODE_SHOLAT === 'biasa') return false;

    const month = Number(data?.date?.hijri?.month?.number);
    const result = month === 9;
    console.info('[ShowTimeMode] Mode otomatis:', { hijriMonth: month, mode: result ? 'RAMADAN' : 'BIASA' });
    return result;
  }

  window.ShowTimeMode = Object.freeze({ isRamadan });
})();
