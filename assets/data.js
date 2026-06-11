/* ============================================================
   COOL I GUESS CREW — collection data
   ------------------------------------------------------------
   Коллекция: 2000 работ "CIGC #1 ... CIGC #2000".
   Оригиналы (2000x2000 PNG, ~9.5 ГБ) лежат в папке
   "Cool I Guess Crew" и НЕ публикуются (в .gitignore).
   Для сайта генерятся лёгкие превью 480px JPEG в /images
   скриптом scripts/build-images.sh — файлы images/<N>.jpg.

   Голоса в localStorage привязаны к id (= номеру работы),
   поэтому id менять нельзя.
   ============================================================ */

const COLLECTION_SIZE = 2000;

const COLLECTION = Array.from({ length: COLLECTION_SIZE }, (_, i) => {
  const n = i + 1;
  return {
    id: String(n),
    title: `CIGC #${n}`,
    src: `images/${n}.jpg`,
    votes: 0,
  };
});
