/* ============================================================
   COOL I GUESS CREW — collection data
   ------------------------------------------------------------
   Collection of 2000 works "CIGC #1 ... CIGC #2000".
   Originals (2000x2000 PNG, ~9.5 GB) live in the local
   "Cool I Guess Crew" folder and are NOT published (gitignored).
   The site uses light 480px JPEG previews in /images,
   built by scripts/build-images.sh -> images/<N>.jpg.

   Votes in localStorage are keyed by id (= work number),
   so ids must stay stable.
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
