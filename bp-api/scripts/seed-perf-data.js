/**
 * Perf-test seeder: vloží minimální data potřebná pro k6 testy:
 *   - 1 artist user + role + ArtistProfile
 *   - 1 Genre
 *   - 5 Track záznamů s vazbou na artist (primary) a genre
 *
 * Idempotentní: pokud řádky existují (po e-mailu, po názvech), nepřidá je.
 *
 * Spuštění:
 *     node scripts/seed-perf-data.js
 *
 * Výstup vypíše id prvního tracku — to pak použiješ jako PERF_TRACK_ID
 * v k6 (defaultně skript ho nastaví na 1).
 */
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const ARTIST_EMAIL = "perf-artist@willosphere.test";
const ARTIST_PASSWORD = "PerfArtist1!";
const GENRE_NAME = "PerfGenre";
const TRACK_TITLES = [
  "Perf Track One",
  "Perf Track Two",
  "Perf Track Three",
  "Perf Track Four",
  "Perf Track Five",
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3307),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
  });

  console.log("Connected to MySQL");

  // 1. Artist user
  const passwordHash = await bcrypt.hash(ARTIST_PASSWORD, 4);
  let [rows] = await conn.execute(
    "SELECT id FROM users WHERE email = ?",
    [ARTIST_EMAIL],
  );
  let artistId;
  if (rows.length > 0) {
    artistId = rows[0].id;
    console.log(`Artist already exists, id=${artistId}`);
  } else {
    const [res] = await conn.execute(
      "INSERT INTO users (email, password_hash, display_name, timezone, language) VALUES (?, ?, ?, 'UTC', 'en')",
      [ARTIST_EMAIL, passwordHash, "Perf Artist"],
    );
    artistId = res.insertId;
    console.log(`Artist created, id=${artistId}`);
  }

  // 2. Roles (LISTENER + ARTIST)
  for (const role of ["listener", "artist"]) {
    await conn.execute(
      "INSERT IGNORE INTO user_role (user_id, role) VALUES (?, ?)",
      [artistId, role],
    );
  }

  // 3. ArtistProfile
  await conn.execute(
    "INSERT IGNORE INTO ArtistProfile (user_id, bio) VALUES (?, ?)",
    [artistId, "Auto-generated for perf tests"],
  );

  // 4. Genre
  let [grows] = await conn.execute("SELECT id FROM Genre WHERE name = ?", [
    GENRE_NAME,
  ]);
  let genreId;
  if (grows.length > 0) {
    genreId = grows[0].id;
    console.log(`Genre already exists, id=${genreId}`);
  } else {
    const [res] = await conn.execute(
      "INSERT INTO Genre (name) VALUES (?)",
      [GENRE_NAME],
    );
    genreId = res.insertId;
    console.log(`Genre created, id=${genreId}`);
  }

  // 5. Tracks
  const trackIds = [];
  for (const title of TRACK_TITLES) {
    let [trows] = await conn.execute(
      "SELECT id FROM Track WHERE title = ?",
      [title],
    );
    let trackId;
    if (trows.length > 0) {
      trackId = trows[0].id;
    } else {
      const [res] = await conn.execute(
        "INSERT INTO Track (title, duration_seconds, audio_url) VALUES (?, ?, ?)",
        [title, 200, `s3://perf/${title.replace(/\s+/g, "_").toLowerCase()}.mp3`],
      );
      trackId = res.insertId;
    }
    trackIds.push(trackId);

    await conn.execute(
      "INSERT IGNORE INTO Track_Artist (track_id, artist_id, role) VALUES (?, ?, 'primary')",
      [trackId, artistId],
    );
    await conn.execute(
      "INSERT IGNORE INTO Track_Genre (track_id, genre_id) VALUES (?, ?)",
      [trackId, genreId],
    );
  }

  console.log("Tracks ready, ids:", trackIds);
  console.log(
    `\nTo run k6 against the first track:\n` +
      `   k6 run -e PERF_TRACK_ID=${trackIds[0]} perf/load.js\n`,
  );

  await conn.end();
})().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
