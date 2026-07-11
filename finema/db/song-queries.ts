import { getPool } from "./pool";
import { uniqueSlug } from "@/lib/slug";
import type { PoolClient } from "pg";
import type {
  AdminSong,
  AdminSongBlock,
  Playlist,
  PlaylistWithSongs,
  Song,
  SongBlock,
  SongBlockLayout,
  SongBlockWithSongs,
  SongCategory,
  SongWithStats,
} from "./types";

async function reserveSongSlug(
  client: PoolClient,
  title: string,
  excludeId?: string
): Promise<string> {
  const base = uniqueSlug(title, new Set());
  let candidate = base;
  let suffix = 2;
  while (true) {
    const result = await client.query(
      `SELECT 1 FROM songs
       WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2)
       LIMIT 1`,
      [candidate, excludeId ?? null]
    );
    if (result.rows.length === 0) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

const SONG_SELECT = `
  s.id,
  s.slug,
  s.title,
  s.description,
  s.artist,
  s.cover_url,
  s.audio_url,
  s.download_url,
  s.duration_seconds,
  s.category_id,
  sc.name AS category_name,
  s.created_at,
  s.updated_at
`;

function toSong(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  artist: string | null;
  cover_url: string;
  audio_url: string;
  download_url: string;
  duration_seconds: number;
  category_id: string | null;
  category_name?: string | null;
  created_at: Date;
  updated_at: Date;
}): Song {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    artist: row.artist,
    cover_url: row.cover_url,
    audio_url: row.audio_url,
    download_url: row.download_url,
    duration_seconds: row.duration_seconds,
    category_id: row.category_id,
    category_name: row.category_name ?? null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

function toSongWithStats(
  row: Parameters<typeof toSong>[0] & {
    like_count: number;
    liked_by_me: boolean;
  }
): SongWithStats {
  return {
    ...toSong(row),
    like_count: row.like_count,
    liked_by_me: row.liked_by_me,
  };
}

function toSongCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
}): SongCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    created_at: row.created_at.toISOString(),
  };
}

function toSongBlock(row: {
  id: string;
  title: string;
  description: string | null;
  layout: SongBlockLayout;
  sort_order: number;
  created_at: Date;
}): SongBlock {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    layout: row.layout,
    sort_order: row.sort_order,
    created_at: row.created_at.toISOString(),
  };
}

async function getSongBlockLikeStats(
  blockId: string,
  userId?: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM song_block_likes WHERE block_id = $1) AS like_count,
       CASE
         WHEN $2::uuid IS NULL THEN FALSE
         ELSE EXISTS(
           SELECT 1 FROM song_block_likes
           WHERE block_id = $1 AND user_id = $2::uuid
         )
       END AS liked_by_me`,
    [blockId, userId ?? null]
  );
  return {
    like_count: result.rows[0]?.like_count ?? 0,
    liked_by_me: result.rows[0]?.liked_by_me ?? false,
  };
}

async function loadSongBlockWithSongs(
  blockRow: {
    id: string;
    title: string;
    description: string | null;
    layout: SongBlockLayout;
    sort_order: number;
    created_at: Date;
  },
  userId: string | undefined,
  options?: { previewLimit?: number }
): Promise<SongBlockWithSongs> {
  const pool = getPool();
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS song_count FROM song_block_items WHERE block_id = $1`,
    [blockRow.id]
  );
  const song_count = countResult.rows[0]?.song_count ?? 0;
  const limitClause =
    options?.previewLimit !== undefined ? `LIMIT ${options.previewLimit}` : "";

  const songsResult = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl.user_id)::int AS like_count,
       CASE
         WHEN $2::uuid IS NULL THEN FALSE
         ELSE BOOL_OR(sl.user_id = $2::uuid)
       END AS liked_by_me
     FROM song_block_items sbi
     JOIN songs s ON s.id = sbi.song_id
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl ON sl.song_id = s.id
     WHERE sbi.block_id = $1
     GROUP BY s.id, sc.name, sbi.sort_order
     ORDER BY sbi.sort_order ASC, s.created_at DESC
     ${limitClause}`,
    [blockRow.id, userId ?? null]
  );

  const likeStats = await getSongBlockLikeStats(blockRow.id, userId);

  return {
    ...toSongBlock(blockRow),
    song_count,
    ...likeStats,
    songs: songsResult.rows.map((row) => toSongWithStats(row)),
  };
}

export async function listSongs(
  userId?: string,
  options?: { categoryId?: string; query?: string; limit?: number }
): Promise<SongWithStats[]> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [userId ?? null];
  let paramIndex = 2;

  if (options?.categoryId) {
    conditions.push(`s.category_id = $${paramIndex++}`);
    params.push(options.categoryId);
  }

  if (options?.query?.trim()) {
    conditions.push(
      `(s.title ILIKE $${paramIndex} OR s.artist ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`
    );
    params.push(`%${options.query.trim()}%`);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ? `LIMIT ${options.limit}` : "";

  const result = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl.user_id)::int AS like_count,
       CASE
         WHEN $1::uuid IS NULL THEN FALSE
         ELSE BOOL_OR(sl.user_id = $1::uuid)
       END AS liked_by_me
     FROM songs s
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl ON sl.song_id = s.id
     ${where}
     GROUP BY s.id, sc.name
     ORDER BY s.created_at DESC
     ${limit}`,
    params
  );

  return result.rows.map((row) => toSongWithStats(row));
}

export async function listSongsByCategory(
  categoryId: string,
  userId?: string
): Promise<SongWithStats[]> {
  return listSongs(userId, { categoryId });
}

export async function searchSongs(
  query: string,
  userId?: string
): Promise<SongWithStats[]> {
  return listSongs(userId, { query });
}

export async function getSongById(
  id: string,
  userId?: string
): Promise<SongWithStats | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl.user_id)::int AS like_count,
       CASE
         WHEN $2::uuid IS NULL THEN FALSE
         ELSE BOOL_OR(sl.user_id = $2::uuid)
       END AS liked_by_me
     FROM songs s
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl ON sl.song_id = s.id
     WHERE s.id::text = $1 OR s.slug = $1
     GROUP BY s.id, sc.name`,
    [id, userId ?? null]
  );
  if (result.rows.length === 0) return null;
  return toSongWithStats(result.rows[0]);
}

export async function listAdminSongs(): Promise<AdminSong[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl.user_id)::int AS like_count
     FROM songs s
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl ON sl.song_id = s.id
     GROUP BY s.id, sc.name
     ORDER BY s.created_at DESC`
  );
  return result.rows.map((row) => ({
    ...toSong(row),
    like_count: row.like_count,
  }));
}

export interface CreateSongInput {
  title: string;
  description: string | null;
  artist: string | null;
  cover_url: string;
  audio_url: string;
  download_url: string;
  duration_seconds: number;
  category_id: string | null;
}

export async function createSong(input: CreateSongInput): Promise<Song> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const slug = await reserveSongSlug(client, input.title);
    const result = await client.query(
      `INSERT INTO songs (
         title, slug, description, artist, cover_url, audio_url, download_url,
         duration_seconds, category_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, slug, title, description, artist, cover_url, audio_url, download_url,
         duration_seconds, category_id, created_at, updated_at`,
      [
        input.title,
        slug,
        input.description,
        input.artist,
        input.cover_url,
        input.audio_url,
        input.download_url,
        input.duration_seconds,
        input.category_id,
      ]
    );
    return toSong({ ...result.rows[0], category_name: null });
  } finally {
    client.release();
  }
}

export interface UpdateSongInput extends CreateSongInput {}

export async function updateSong(
  id: string,
  input: UpdateSongInput
): Promise<Song | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const slug = await reserveSongSlug(client, input.title, id);
    const result = await client.query(
      `UPDATE songs SET
         title = $2, slug = $3, description = $4, artist = $5, cover_url = $6,
         audio_url = $7, download_url = $8, duration_seconds = $9, category_id = $10
       WHERE id = $1
       RETURNING id, slug, title, description, artist, cover_url, audio_url, download_url,
         duration_seconds, category_id, created_at, updated_at`,
      [
        id,
        input.title,
        slug,
        input.description,
        input.artist,
        input.cover_url,
        input.audio_url,
        input.download_url,
        input.duration_seconds,
        input.category_id,
      ]
    );
    if (result.rows.length === 0) return null;
    return toSong({ ...result.rows[0], category_name: null });
  } finally {
    client.release();
  }
}

export async function deleteSong(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM songs WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function songExists(songId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 1 FROM songs WHERE id::text = $1 OR slug = $1`,
    [songId]
  );
  return result.rows.length > 0;
}

export async function likeSong(
  userId: string,
  songId: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO song_likes (user_id, song_id) VALUES ($1, $2)
     ON CONFLICT (user_id, song_id) DO NOTHING`,
    [userId, songId]
  );
  const result = await pool.query(
    `SELECT COUNT(*)::int AS like_count FROM song_likes WHERE song_id = $1`,
    [songId]
  );
  return { like_count: result.rows[0].like_count, liked_by_me: true };
}

export async function unlikeSong(
  userId: string,
  songId: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM song_likes WHERE user_id = $1 AND song_id = $2`,
    [userId, songId]
  );
  const result = await pool.query(
    `SELECT COUNT(*)::int AS like_count FROM song_likes WHERE song_id = $1`,
    [songId]
  );
  return { like_count: result.rows[0].like_count, liked_by_me: false };
}

export async function listLikedSongs(userId: string): Promise<SongWithStats[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl2.user_id)::int AS like_count,
       TRUE AS liked_by_me,
       sl.created_at AS liked_at
     FROM song_likes sl
     JOIN songs s ON s.id = sl.song_id
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl2 ON sl2.song_id = s.id
     WHERE sl.user_id = $1
     GROUP BY s.id, sc.name, sl.created_at
     ORDER BY sl.created_at DESC`,
    [userId]
  );
  return result.rows.map((row) => toSongWithStats(row));
}

export async function songBlockExists(blockId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`SELECT 1 FROM song_blocks WHERE id = $1`, [
    blockId,
  ]);
  return result.rows.length > 0;
}

export async function likeSongBlock(
  userId: string,
  blockId: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO song_block_likes (user_id, block_id) VALUES ($1, $2)
     ON CONFLICT (user_id, block_id) DO NOTHING`,
    [userId, blockId]
  );
  return getSongBlockLikeStats(blockId, userId);
}

export async function unlikeSongBlock(
  userId: string,
  blockId: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM song_block_likes WHERE user_id = $1 AND block_id = $2`,
    [userId, blockId]
  );
  return getSongBlockLikeStats(blockId, userId);
}

export async function listLikedSongBlocks(
  userId: string
): Promise<SongBlockWithSongs[]> {
  const pool = getPool();
  const blocksResult = await pool.query(
    `SELECT b.id, b.title, b.description, b.layout, b.sort_order, b.created_at
     FROM song_block_likes sbl
     JOIN song_blocks b ON b.id = sbl.block_id
     WHERE sbl.user_id = $1
     ORDER BY sbl.created_at DESC`,
    [userId]
  );

  const blocks: SongBlockWithSongs[] = [];
  for (const blockRow of blocksResult.rows) {
    blocks.push(await loadSongBlockWithSongs(blockRow, userId, { previewLimit: 4 }));
  }
  return blocks;
}

export async function listSongCategories(): Promise<SongCategory[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, slug, description, created_at
     FROM song_categories ORDER BY name ASC`
  );
  return result.rows.map(toSongCategory);
}

export async function getSongCategoryById(
  id: string
): Promise<SongCategory | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, slug, description, created_at
     FROM song_categories WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return toSongCategory(result.rows[0]);
}

export async function createSongCategory(input: {
  name: string;
  slug: string;
  description: string | null;
}): Promise<SongCategory> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO song_categories (name, slug, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, slug, description, created_at`,
    [input.name, input.slug, input.description]
  );
  return toSongCategory(result.rows[0]);
}

export async function updateSongCategory(
  id: string,
  input: { name: string; slug: string; description: string | null }
): Promise<SongCategory | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE song_categories SET name = $2, slug = $3, description = $4
     WHERE id = $1
     RETURNING id, name, slug, description, created_at`,
    [id, input.name, input.slug, input.description]
  );
  if (result.rows.length === 0) return null;
  return toSongCategory(result.rows[0]);
}

export async function deleteSongCategory(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM song_categories WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listSongBlocks(
  userId?: string
): Promise<SongBlockWithSongs[]> {
  const pool = getPool();
  const blocksResult = await pool.query(
    `SELECT id, title, description, layout, sort_order, created_at
     FROM song_blocks ORDER BY sort_order ASC, created_at ASC`
  );

  const blocks: SongBlockWithSongs[] = [];
  for (const blockRow of blocksResult.rows) {
    blocks.push(await loadSongBlockWithSongs(blockRow, userId, { previewLimit: 4 }));
  }
  return blocks;
}

export async function getSongBlockWithSongs(
  id: string,
  userId?: string
): Promise<SongBlockWithSongs | null> {
  const pool = getPool();
  const blockResult = await pool.query(
    `SELECT id, title, description, layout, sort_order, created_at
     FROM song_blocks WHERE id = $1`,
    [id]
  );
  if (blockResult.rows.length === 0) return null;

  return loadSongBlockWithSongs(blockResult.rows[0], userId);
}

export async function listAdminSongBlocks(): Promise<AdminSongBlock[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT b.id, b.title, b.description, b.layout, b.sort_order, b.created_at,
            COUNT(sbi.song_id)::int AS song_count,
            COALESCE(
              array_agg(sbi.song_id ORDER BY sbi.sort_order)
                FILTER (WHERE sbi.song_id IS NOT NULL),
              '{}'
            ) AS song_ids
     FROM song_blocks b
     LEFT JOIN song_block_items sbi ON sbi.block_id = b.id
     GROUP BY b.id
     ORDER BY b.sort_order ASC, b.created_at ASC`
  );

  const blocks: AdminSongBlock[] = [];
  for (const row of result.rows) {
    const previewResult = await pool.query(
      `SELECT s.id, s.cover_url, s.title
       FROM song_block_items sbi
       JOIN songs s ON s.id = sbi.song_id
       WHERE sbi.block_id = $1
       ORDER BY sbi.sort_order ASC
       LIMIT 4`,
      [row.id]
    );

    blocks.push({
      ...toSongBlock(row),
      song_count: row.song_count ?? 0,
      song_ids: row.song_ids ?? [],
      preview_songs: previewResult.rows.map((song) => ({
        id: song.id,
        cover_url: song.cover_url,
        title: song.title,
      })),
    });
  }
  return blocks;
}

export async function createSongBlock(input: {
  title: string;
  description: string | null;
  layout: SongBlockLayout;
  sort_order: number;
  song_ids: string[];
}): Promise<SongBlockWithSongs> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const blockResult = await client.query(
      `INSERT INTO song_blocks (title, description, layout, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, layout, sort_order, created_at`,
      [input.title, input.description, input.layout, input.sort_order]
    );
    const block = toSongBlock(blockResult.rows[0]);

    for (let i = 0; i < input.song_ids.length; i++) {
      await client.query(
        `INSERT INTO song_block_items (block_id, song_id, sort_order)
         VALUES ($1, $2, $3)`,
        [block.id, input.song_ids[i], i]
      );
    }
    await client.query("COMMIT");
    const full = await getSongBlockWithSongs(block.id);
    return full ?? { ...block, songs: [], like_count: 0, liked_by_me: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSongBlock(
  id: string,
  input: {
    title: string;
    description: string | null;
    layout: SongBlockLayout;
    sort_order: number;
    song_ids: string[];
  }
): Promise<SongBlockWithSongs | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const blockResult = await client.query(
      `UPDATE song_blocks SET title = $2, description = $3, layout = $4, sort_order = $5
       WHERE id = $1
       RETURNING id, title, description, layout, sort_order, created_at`,
      [id, input.title, input.description, input.layout, input.sort_order]
    );
    if (blockResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`DELETE FROM song_block_items WHERE block_id = $1`, [id]);
    for (let i = 0; i < input.song_ids.length; i++) {
      await client.query(
        `INSERT INTO song_block_items (block_id, song_id, sort_order)
         VALUES ($1, $2, $3)`,
        [id, input.song_ids[i], i]
      );
    }
    await client.query("COMMIT");
    return getSongBlockWithSongs(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSongBlock(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM song_blocks WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listUserPlaylists(userId: string): Promise<Playlist[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.id, p.user_id, p.name, p.description, p.created_at, p.updated_at,
            COUNT(ps.song_id)::int AS song_count
     FROM playlists p
     LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    song_count: row.song_count,
  }));
}

export async function getPlaylistWithSongs(
  playlistId: string,
  userId: string
): Promise<PlaylistWithSongs | null> {
  const pool = getPool();
  const playlistResult = await pool.query(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM playlists WHERE id = $1 AND user_id = $2`,
    [playlistId, userId]
  );
  if (playlistResult.rows.length === 0) return null;

  const row = playlistResult.rows[0];
  const songsResult = await pool.query(
    `SELECT
       s.id, s.title, s.description, s.artist, s.cover_url, s.audio_url,
       s.download_url, s.duration_seconds, s.category_id, sc.name AS category_name,
       s.created_at, s.updated_at
     FROM playlist_songs ps
     JOIN songs s ON s.id = ps.song_id
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     WHERE ps.playlist_id = $1
     ORDER BY ps.position ASC, ps.added_at ASC`,
    [playlistId]
  );

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    songs: songsResult.rows.map((songRow) => toSong(songRow)),
  };
}

export async function createPlaylist(
  userId: string,
  input: { name: string; description: string | null }
): Promise<Playlist> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO playlists (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, description, created_at, updated_at`,
    [userId, input.name, input.description]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    song_count: 0,
  };
}

export async function updatePlaylist(
  playlistId: string,
  userId: string,
  input: { name: string; description: string | null }
): Promise<Playlist | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE playlists SET name = $3, description = $4
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, name, description, created_at, updated_at`,
    [playlistId, userId, input.name, input.description]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function deletePlaylist(
  playlistId: string,
  userId: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM playlists WHERE id = $1 AND user_id = $2`,
    [playlistId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function addSongToPlaylist(
  playlistId: string,
  userId: string,
  songId: string
): Promise<boolean> {
  const pool = getPool();
  const owner = await pool.query(
    `SELECT 1 FROM playlists WHERE id = $1 AND user_id = $2`,
    [playlistId, userId]
  );
  if (owner.rows.length === 0) return false;

  const posResult = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
     FROM playlist_songs WHERE playlist_id = $1`,
    [playlistId]
  );
  const position = posResult.rows[0].next_pos;

  await pool.query(
    `INSERT INTO playlist_songs (playlist_id, song_id, position)
     VALUES ($1, $2, $3)
     ON CONFLICT (playlist_id, song_id) DO NOTHING`,
    [playlistId, songId, position]
  );
  return true;
}

export async function removeSongFromPlaylist(
  playlistId: string,
  userId: string,
  songId: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM playlist_songs ps
     USING playlists p
     WHERE ps.playlist_id = p.id AND p.id = $1 AND p.user_id = $2 AND ps.song_id = $3`,
    [playlistId, userId, songId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listRelatedSongs(
  songId: string,
  categoryId: string | null,
  userId?: string,
  limit = 8
): Promise<SongWithStats[]> {
  if (!categoryId) return [];
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ${SONG_SELECT},
       COUNT(sl.user_id)::int AS like_count,
       CASE
         WHEN $3::uuid IS NULL THEN FALSE
         ELSE BOOL_OR(sl.user_id = $3::uuid)
       END AS liked_by_me
     FROM songs s
     LEFT JOIN song_categories sc ON sc.id = s.category_id
     LEFT JOIN song_likes sl ON sl.song_id = s.id
     WHERE s.category_id = $1 AND s.id != $2
     GROUP BY s.id, sc.name
     ORDER BY s.created_at DESC
     LIMIT $4`,
    [categoryId, songId, userId ?? null, limit]
  );
  return result.rows.map((row) => toSongWithStats(row));
}
