import { getPool } from "./pool";
import type { PoolClient } from "pg";
import type {
  AdminMovie,
  AccountStatus,
  AdminSeries,
  CommentMediaLibrary,
  CommentMediaLibraryItem,
  CommentMediaType,
  CommentReportDetail,
  ContinueWatchingItem,
  Episode,
  EpisodeDetail,
  EpisodeWatchProgress,
  Genre,
  Movie,
  MovieComment,
  MovieDetail,
  MovieRatingStats,
  PublicUser,
  RatedMovieItem,
  ReportResolveAction,
  Series,
  SeriesComment,
  SeriesDetail,
  SeriesWatchlistItem,
  UserCommentItem,
  UserRole,
  UserUploadedSticker,
  WatchlistItem,
  WatchHistoryItem,
  WatchProgress,
} from "./types";

function toPublicUser(row: {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url?: string | null;
  role: UserRole;
  account_status?: AccountStatus;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url ?? null,
    role: row.role,
    account_status: row.account_status ?? "active",
  };
}

function toMovie(row: {
  id: string;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: string | number | null;
  genres: string[] | null;
  avg_rating?: string | number | null;
  rating_count?: string | number | null;
}): Movie {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    release_year: row.release_year,
    duration_seconds: row.duration_seconds,
    poster_url: row.poster_url,
    backdrop_url: row.backdrop_url,
    match_score: row.match_score !== null ? Number(row.match_score) : null,
    genres: row.genres ?? [],
    avg_rating:
      row.avg_rating !== undefined && row.avg_rating !== null
        ? Number(row.avg_rating)
        : null,
    rating_count:
      row.rating_count !== undefined && row.rating_count !== null
        ? Number(row.rating_count)
        : 0,
  };
}

const MOVIE_RATING_JOIN = `
  LEFT JOIN (
    SELECT movie_id,
           ROUND(AVG(rating)::numeric, 1) AS avg_rating,
           COUNT(*)::int AS rating_count
    FROM movie_ratings
    GROUP BY movie_id
  ) mr ON mr.movie_id = m.id`;

const SERIES_RATING_JOIN = `
  LEFT JOIN (
    SELECT series_id,
           ROUND(AVG(rating)::numeric, 1) AS avg_rating,
           COUNT(*)::int AS rating_count
    FROM series_ratings
    GROUP BY series_id
  ) sr ON sr.series_id = s.id`;

function toSeries(row: {
  id: string;
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: string | number | null;
  genres: string[] | null;
  avg_rating?: string | number | null;
  rating_count?: string | number | null;
  episode_count?: string | number | null;
}): Series {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    release_year: row.release_year,
    poster_url: row.poster_url,
    backdrop_url: row.backdrop_url,
    match_score: row.match_score !== null ? Number(row.match_score) : null,
    genres: row.genres ?? [],
    avg_rating:
      row.avg_rating !== undefined && row.avg_rating !== null
        ? Number(row.avg_rating)
        : null,
    rating_count:
      row.rating_count !== undefined && row.rating_count !== null
        ? Number(row.rating_count)
        : 0,
    episode_count:
      row.episode_count !== undefined && row.episode_count !== null
        ? Number(row.episode_count)
        : 0,
  };
}

function toEpisode(row: {
  id: string;
  series_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  hls_playlist_url?: string | null;
  quality_label?: string | null;
}): Episode {
  return {
    id: row.id,
    series_id: row.series_id,
    season_number: row.season_number,
    episode_number: row.episode_number,
    title: row.title,
    description: row.description,
    duration_seconds: row.duration_seconds,
    thumbnail_url: row.thumbnail_url,
    hls_playlist_url: row.hls_playlist_url ?? null,
    quality_label: row.quality_label ?? null,
  };
}

export async function findUserByCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, display_name, avatar_url, role, account_status
     FROM users
     WHERE email = $1 AND password_hash = crypt($2, password_hash)`,
    [email, password]
  );
  if (result.rows.length === 0) return null;
  return toPublicUser(result.rows[0]);
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, display_name, avatar_url, role, account_status FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return toPublicUser(result.rows[0]);
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already in use");
    this.name = "DuplicateEmailError";
  }
}

export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<PublicUser> {
  const pool = getPool();
  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, 'user')
       RETURNING id, email, display_name, avatar_url, role, account_status`,
      [email, password, displayName]
    );
    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}

export async function listMovies(): Promise<Movie[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       mr.avg_rating,
       mr.rating_count,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
     FROM movies m
     ${MOVIE_RATING_JOIN}
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     GROUP BY m.id, mr.avg_rating, mr.rating_count
     ORDER BY m.title`
  );
  return result.rows.map(toMovie);
}

export async function searchMoviesByTitle(
  query: string,
  limit = 10
): Promise<Movie[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       mr.avg_rating,
       mr.rating_count,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
     FROM movies m
     ${MOVIE_RATING_JOIN}
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     WHERE m.title ILIKE '%' || $1 || '%'
     GROUP BY m.id, mr.avg_rating, mr.rating_count
     ORDER BY m.title
     LIMIT $2`,
    [trimmed, limit]
  );
  return result.rows.map(toMovie);
}

export async function listAdminMovies(): Promise<AdminMovie[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       ms.hls_playlist_url,
       ms.quality_label
     FROM movies m
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     LEFT JOIN movie_streams ms ON ms.movie_id = m.id
     GROUP BY m.id, ms.hls_playlist_url, ms.quality_label
     ORDER BY m.title`
  );
  return result.rows.map((row) => ({
    ...toMovie(row),
    hls_playlist_url: row.hls_playlist_url,
    quality_label: row.quality_label,
  }));
}

export async function getMovieById(id: string): Promise<MovieDetail | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       mr.avg_rating,
       mr.rating_count,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       ms.hls_playlist_url,
       ms.quality_label
     FROM movies m
     ${MOVIE_RATING_JOIN}
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     LEFT JOIN movie_streams ms ON ms.movie_id = m.id
     WHERE m.id = $1
     GROUP BY m.id, ms.hls_playlist_url, ms.quality_label, mr.avg_rating, mr.rating_count`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...toMovie(row),
    hls_playlist_url: row.hls_playlist_url,
    quality_label: row.quality_label,
  };
}

export async function getContinueWatching(
  userId: string
): Promise<ContinueWatchingItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       wp.progress_seconds,
       wp.last_watched_at
     FROM watch_progress wp
     JOIN movies m ON m.id = wp.movie_id
     WHERE wp.user_id = $1 AND wp.completed = FALSE
     ORDER BY wp.last_watched_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    release_year: row.release_year,
    duration_seconds: row.duration_seconds,
    poster_url: row.poster_url,
    backdrop_url: row.backdrop_url,
    match_score: row.match_score !== null ? Number(row.match_score) : null,
    progress_seconds: row.progress_seconds,
    last_watched_at: row.last_watched_at.toISOString(),
  }));
}

export async function getWatchHistory(
  userId: string
): Promise<WatchHistoryItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       stats.avg_rating,
       stats.rating_count,
       wp.progress_seconds,
       wp.completed,
       wp.last_watched_at
     FROM watch_progress wp
     JOIN movies m ON m.id = wp.movie_id
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     LEFT JOIN (
       SELECT movie_id,
              ROUND(AVG(rating)::numeric, 1) AS avg_rating,
              COUNT(*)::int AS rating_count
       FROM movie_ratings
       GROUP BY movie_id
     ) stats ON stats.movie_id = m.id
     WHERE wp.user_id = $1
     GROUP BY m.id, wp.progress_seconds, wp.completed, wp.last_watched_at, stats.avg_rating, stats.rating_count
     ORDER BY wp.last_watched_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    ...toMovie(row),
    avg_rating: row.avg_rating !== null ? Number(row.avg_rating) : null,
    rating_count: Number(row.rating_count ?? 0),
    progress_seconds: row.progress_seconds,
    completed: row.completed,
    last_watched_at: row.last_watched_at.toISOString(),
  }));
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       w.added_at
     FROM watchlist w
     JOIN movies m ON m.id = w.movie_id
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     WHERE w.user_id = $1
     GROUP BY m.id, w.added_at
     ORDER BY w.added_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    ...toMovie(row),
    added_at: row.added_at.toISOString(),
  }));
}

export async function isInWatchlist(
  userId: string,
  movieId: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 1 FROM watchlist WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
  return result.rows.length > 0;
}

export async function getWatchlistMovieIds(userId: string): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT movie_id FROM watchlist WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.movie_id as string);
}

export async function addToWatchlist(
  userId: string,
  movieId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO watchlist (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, movie_id) DO NOTHING`,
    [userId, movieId]
  );
}

export async function removeFromWatchlist(
  userId: string,
  movieId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
}

export async function getMovieRatingStats(
  movieId: string
): Promise<MovieRatingStats> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(*)::int AS rating_count
     FROM movie_ratings
     WHERE movie_id = $1`,
    [movieId]
  );
  const row = result.rows[0];
  const count = Number(row.rating_count);
  return {
    avg_rating: count > 0 ? Number(row.avg_rating) : null,
    rating_count: count,
  };
}

export async function getUserMovieRating(
  userId: string,
  movieId: string
): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT rating FROM movie_ratings WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
  if (result.rows.length === 0) return null;
  return Number(result.rows[0].rating);
}

export async function upsertMovieRating(
  userId: string,
  movieId: string,
  rating: number
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO movie_ratings (user_id, movie_id, rating, rated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, movie_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       rated_at = NOW()`,
    [userId, movieId, rating]
  );
}

export async function deleteMovieRating(
  userId: string,
  movieId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM movie_ratings WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
}

export async function getRatedMovies(
  userId: string
): Promise<RatedMovieItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       m.id,
       m.title,
       m.description,
       m.release_year,
       m.duration_seconds,
       m.poster_url,
       m.backdrop_url,
       m.match_score,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       r.rating AS user_rating,
       r.rated_at,
       stats.avg_rating,
       stats.rating_count
     FROM movie_ratings r
     JOIN movies m ON m.id = r.movie_id
     LEFT JOIN movie_genres mg ON mg.movie_id = m.id
     LEFT JOIN genres g ON g.id = mg.genre_id
     LEFT JOIN (
       SELECT movie_id,
              ROUND(AVG(rating)::numeric, 1) AS avg_rating,
              COUNT(*)::int AS rating_count
       FROM movie_ratings
       GROUP BY movie_id
     ) stats ON stats.movie_id = m.id
     WHERE r.user_id = $1
     GROUP BY m.id, r.rating, r.rated_at, stats.avg_rating, stats.rating_count
     ORDER BY r.rated_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    ...toMovie(row),
    user_rating: Number(row.user_rating),
    rated_at: row.rated_at.toISOString(),
    avg_rating: row.avg_rating !== null ? Number(row.avg_rating) : null,
    rating_count: Number(row.rating_count),
  }));
}

export async function upsertWatchProgress(
  userId: string,
  movieId: string,
  progressSeconds: number
): Promise<WatchProgress | null> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO watch_progress (user_id, movie_id, progress_seconds, completed, last_watched_at)
     SELECT $1, $2, $3, $3 >= m.duration_seconds, NOW()
     FROM movies m
     WHERE m.id = $2
     ON CONFLICT (user_id, movie_id) DO UPDATE SET
       progress_seconds = EXCLUDED.progress_seconds,
       completed = EXCLUDED.progress_seconds >= (
         SELECT duration_seconds FROM movies WHERE id = watch_progress.movie_id
       ),
       last_watched_at = NOW()
     RETURNING watch_progress.*, (
       SELECT duration_seconds FROM movies WHERE id = $2
     ) AS duration_seconds`,
    [userId, movieId, progressSeconds]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  const durationSeconds = Number(row.duration_seconds);
  const qualifies =
    row.completed ||
    (durationSeconds > 0 && row.progress_seconds >= durationSeconds * 0.7);

  if (qualifies) {
    await pool.query(
      `INSERT INTO watch_events (user_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO UPDATE SET watched_at = NOW()`,
      [userId, movieId]
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    movie_id: row.movie_id,
    progress_seconds: row.progress_seconds,
    completed: row.completed,
    last_watched_at: row.last_watched_at.toISOString(),
  };
}

export async function recordMovieView(
  userId: string,
  movieId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO movie_views (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, movie_id) DO UPDATE SET viewed_at = NOW()`,
    [userId, movieId]
  );
}

export async function recordMovieSearch(
  userId: string,
  movieId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO movie_searches (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, movie_id) DO UPDATE SET searched_at = NOW()`,
    [userId, movieId]
  );
}

const RECOMMENDATION_SIGNAL_THRESHOLD = 3;

const USER_SIGNALS_CTE = `
  user_movie_signals AS (
    SELECT movie_id AS content_id, viewed_at AS occurred_at, 0.5 AS weight
    FROM movie_views WHERE user_id = $1
    UNION ALL
    SELECT movie_id, watched_at, 2.0
    FROM watch_events WHERE user_id = $1
    UNION ALL
    SELECT movie_id, rated_at, 3.0
    FROM movie_ratings WHERE user_id = $1 AND rating >= 4
    UNION ALL
    SELECT movie_id, searched_at, 0.5
    FROM movie_searches WHERE user_id = $1
  ),
  user_series_signals AS (
    SELECT series_id AS content_id, viewed_at AS occurred_at, 0.5 AS weight
    FROM series_views WHERE user_id = $1
    UNION ALL
    SELECT series_id, rated_at, 3.0
    FROM series_ratings WHERE user_id = $1 AND rating >= 4
    UNION ALL
    SELECT e.series_id, ewp.last_watched_at, 2.0
    FROM episode_watch_progress ewp
    JOIN episodes e ON e.id = ewp.episode_id
    WHERE ewp.user_id = $1
      AND (
        ewp.completed
        OR ewp.progress_seconds >= (e.duration_seconds * 0.7)
      )
  ),
  genre_affinity AS (
    SELECT genre_id,
           SUM(
             weight * EXP(-EXTRACT(EPOCH FROM (NOW() - occurred_at)) / (86400 * 30))
           ) AS weight
    FROM (
      SELECT mg.genre_id, s.weight, s.occurred_at
      FROM user_movie_signals s
      JOIN movie_genres mg ON mg.movie_id = s.content_id
      UNION ALL
      SELECT sg.genre_id, s.weight, s.occurred_at
      FROM user_series_signals s
      JOIN series_genres sg ON sg.series_id = s.content_id
    ) combined
    GROUP BY genre_id
  )`;

export interface UserRecommendations {
  movies: Movie[];
  series: Series[];
}

export async function getRecommendationsForUser(
  userId: string,
  limit = 12
): Promise<UserRecommendations> {
  const pool = getPool();

  const countResult = await pool.query(
    `WITH ${USER_SIGNALS_CTE}
     SELECT
       (SELECT COUNT(DISTINCT content_id) FROM user_movie_signals)::int
       + (SELECT COUNT(DISTINCT content_id) FROM user_series_signals)::int
       AS total`,
    [userId]
  );

  if (countResult.rows[0].total < RECOMMENDATION_SIGNAL_THRESHOLD) {
    return { movies: [], series: [] };
  }

  const [moviesResult, seriesResult] = await Promise.all([
    pool.query(
      `WITH ${USER_SIGNALS_CTE},
       scored AS (
         SELECT m.id,
                SUM(ga.weight) / NULLIF(COUNT(mg.genre_id), 0) AS score
         FROM movies m
         JOIN movie_genres mg ON mg.movie_id = m.id
         JOIN genre_affinity ga ON ga.genre_id = mg.genre_id
         WHERE m.id NOT IN (SELECT DISTINCT content_id FROM user_movie_signals)
         GROUP BY m.id
       )
       SELECT
         m.id, m.title, m.description, m.release_year,
         m.duration_seconds, m.poster_url, m.backdrop_url, m.match_score,
         mr.avg_rating, mr.rating_count,
         COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
       FROM scored s
       JOIN movies m ON m.id = s.id
       ${MOVIE_RATING_JOIN}
       LEFT JOIN movie_genres mg ON mg.movie_id = m.id
       LEFT JOIN genres g ON g.id = mg.genre_id
       GROUP BY m.id, s.score, mr.avg_rating, mr.rating_count
       ORDER BY s.score DESC, m.match_score DESC NULLS LAST
       LIMIT $2`,
      [userId, limit]
    ),
    pool.query(
      `WITH ${USER_SIGNALS_CTE},
       scored AS (
         SELECT s.id,
                SUM(ga.weight) / NULLIF(COUNT(sg.genre_id), 0) AS score
         FROM series s
         JOIN series_genres sg ON sg.series_id = s.id
         JOIN genre_affinity ga ON ga.genre_id = sg.genre_id
         WHERE s.id NOT IN (SELECT DISTINCT content_id FROM user_series_signals)
         GROUP BY s.id
       )
       SELECT
         s.id, s.title, s.description, s.release_year,
         s.poster_url, s.backdrop_url, s.match_score,
         sr.avg_rating, sr.rating_count,
         COUNT(e.id)::int AS episode_count,
         COALESCE(array_agg(DISTINCT g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
       FROM scored sc
       JOIN series s ON s.id = sc.id
       ${SERIES_RATING_JOIN}
       LEFT JOIN series_genres sg ON sg.series_id = s.id
       LEFT JOIN genres g ON g.id = sg.genre_id
       LEFT JOIN episodes e ON e.series_id = s.id
       GROUP BY s.id, sc.score, sr.avg_rating, sr.rating_count
       ORDER BY sc.score DESC, s.match_score DESC NULLS LAST
       LIMIT $2`,
      [userId, limit]
    ),
  ]);

  return {
    movies: moviesResult.rows.map(toMovie),
    series: seriesResult.rows.map(toSeries),
  };
}

export async function getWatchProgress(
  userId: string,
  movieId: string
): Promise<WatchProgress | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, user_id, movie_id, progress_seconds, completed, last_watched_at
     FROM watch_progress
     WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    movie_id: row.movie_id,
    progress_seconds: row.progress_seconds,
    completed: row.completed,
    last_watched_at: row.last_watched_at.toISOString(),
  };
}

export async function listGenres(): Promise<Genre[]> {
  const pool = getPool();
  const result = await pool.query(`SELECT id, name FROM genres ORDER BY name`);
  return result.rows;
}

async function ensureGenreWithClient(
  client: PoolClient,
  name: string
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Genre name is required");
  const existing = await client.query(`SELECT id FROM genres WHERE name = $1`, [
    trimmed,
  ]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  const inserted = await client.query(
    `INSERT INTO genres (name) VALUES ($1) RETURNING id`,
    [trimmed]
  );
  return inserted.rows[0].id;
}

export interface CreateMovieInput {
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  hls_playlist_url: string;
  quality_label: string | null;
  genres: string[];
}

export async function createMovieWithStream(
  input: CreateMovieInput
): Promise<AdminMovie> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const movieResult = await client.query(
      `INSERT INTO movies (title, description, release_year, duration_seconds, poster_url, backdrop_url, match_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.title,
        input.description,
        input.release_year,
        input.duration_seconds,
        input.poster_url,
        input.backdrop_url,
        input.match_score,
      ]
    );
    const movieId = movieResult.rows[0].id as string;

    for (const genreName of input.genres) {
      const genreId = await ensureGenreWithClient(client, genreName);
      await client.query(
        `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)`,
        [movieId, genreId]
      );
    }

    await client.query(
      `INSERT INTO movie_streams (movie_id, hls_playlist_url, quality_label)
       VALUES ($1, $2, $3)`,
      [movieId, input.hls_playlist_url, input.quality_label]
    );

    await client.query("COMMIT");
    const movie = await getMovieById(movieId);
    if (!movie) throw new Error("Failed to load created movie");
    return movie;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface UpdateMovieInput {
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  quality_label: string | null;
  genres: string[];
  hls_playlist_url?: string;
}

export async function updateMovieWithStream(
  movieId: string,
  input: UpdateMovieInput
): Promise<AdminMovie | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE movies SET
         title = $2,
         description = $3,
         release_year = $4,
         duration_seconds = $5,
         poster_url = $6,
         backdrop_url = $7,
         match_score = $8
       WHERE id = $1
       RETURNING id`,
      [
        movieId,
        input.title,
        input.description,
        input.release_year,
        input.duration_seconds,
        input.poster_url,
        input.backdrop_url,
        input.match_score,
      ]
    );
    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`DELETE FROM movie_genres WHERE movie_id = $1`, [movieId]);
    for (const genreName of input.genres) {
      const genreId = await ensureGenreWithClient(client, genreName);
      await client.query(
        `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)`,
        [movieId, genreId]
      );
    }

    if (input.hls_playlist_url) {
      await client.query(
        `INSERT INTO movie_streams (movie_id, hls_playlist_url, quality_label)
         VALUES ($1, $2, $3)
         ON CONFLICT (movie_id) DO UPDATE SET
           hls_playlist_url = EXCLUDED.hls_playlist_url,
           quality_label = EXCLUDED.quality_label`,
        [movieId, input.hls_playlist_url, input.quality_label]
      );
    } else {
      await client.query(
        `UPDATE movie_streams SET quality_label = $2 WHERE movie_id = $1`,
        [movieId, input.quality_label]
      );
    }

    await client.query("COMMIT");
    return getMovieById(movieId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMovie(movieId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM movies WHERE id = $1`, [movieId]);
  return (result.rowCount ?? 0) > 0;
}

export async function countMovies(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM movies`);
  return result.rows[0].count;
}

export async function countGenres(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM genres`);
  return result.rows[0].count;
}

export async function updateUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<PublicUser | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET avatar_url = $2 WHERE id = $1
     RETURNING id, email, display_name, avatar_url, role, account_status`,
    [userId, avatarUrl]
  );
  if (result.rows.length === 0) return null;
  return toPublicUser(result.rows[0]);
}

export async function updateUserDisplayName(
  userId: string,
  displayName: string
): Promise<PublicUser | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET display_name = $2 WHERE id = $1
     RETURNING id, email, display_name, avatar_url, role, account_status`,
    [userId, displayName]
  );
  if (result.rows.length === 0) return null;
  return toPublicUser(result.rows[0]);
}

export async function listCommentsByMovieId(
  movieId: string
): Promise<MovieComment[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       mc.id,
       mc.movie_id,
       mc.user_id,
       mc.parent_id,
       mc.body,
       mc.media_type,
       mc.media_url,
       mc.created_at,
       u.display_name,
       u.avatar_url,
       mr.rating AS user_rating
     FROM movie_comments mc
     JOIN users u ON u.id = mc.user_id
     LEFT JOIN movie_ratings mr
       ON mr.user_id = mc.user_id AND mr.movie_id = mc.movie_id
     WHERE mc.movie_id = $1
     ORDER BY mc.created_at ASC`,
    [movieId]
  );

  const rows = result.rows.map((row) => ({
    id: row.id,
    movie_id: row.movie_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    media_type: row.media_type ?? null,
    media_url: row.media_url ?? null,
    created_at: row.created_at.toISOString(),
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
    replies: [] as MovieComment[],
  }));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const topLevel: MovieComment[] = [];

  for (const row of rows) {
    if (row.parent_id) {
      const parent = byId.get(row.parent_id);
      if (parent) {
        parent.replies!.push(row);
      }
    } else {
      topLevel.push(row);
    }
  }

  topLevel.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return topLevel;
}

export async function listCommentsByUserId(
  userId: string
): Promise<UserCommentItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       mc.id,
       mc.movie_id,
       m.title AS movie_title,
       m.poster_url AS movie_poster_url,
       mc.body,
       mc.media_type,
       mc.media_url,
       mc.created_at,
       mr.rating AS user_rating
     FROM movie_comments mc
     JOIN movies m ON m.id = mc.movie_id
     LEFT JOIN movie_ratings mr
       ON mr.user_id = mc.user_id AND mr.movie_id = mc.movie_id
     WHERE mc.user_id = $1
     ORDER BY mc.created_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    movie_id: row.movie_id,
    movie_title: row.movie_title,
    movie_poster_url: row.movie_poster_url,
    body: row.body,
    media_type: row.media_type ?? null,
    media_url: row.media_url ?? null,
    created_at: row.created_at.toISOString(),
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
  }));
}

export async function deleteCommentByIdForUser(
  commentId: string,
  userId: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM movie_comments
     WHERE id = $1 AND user_id = $2`,
    [commentId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createComment(
  movieId: string,
  userId: string,
  body: string,
  parentId?: string | null,
  media?: { type: "gif" | "sticker"; url: string } | null
): Promise<MovieComment | null> {
  const pool = getPool();
  const movieExists = await pool.query(`SELECT id FROM movies WHERE id = $1`, [
    movieId,
  ]);
  if (movieExists.rows.length === 0) return null;

  if (parentId) {
    const parentResult = await pool.query(
      `SELECT id, movie_id, parent_id FROM movie_comments WHERE id = $1`,
      [parentId]
    );
    if (parentResult.rows.length === 0) return null;
    const parent = parentResult.rows[0];
    if (parent.movie_id !== movieId) return null;
    if (parent.parent_id !== null) return null;
  }

  const result = await pool.query(
    `INSERT INTO movie_comments (movie_id, user_id, body, parent_id, media_type, media_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, movie_id, user_id, parent_id, body, media_type, media_url, created_at`,
    [
      movieId,
      userId,
      body,
      parentId ?? null,
      media?.type ?? null,
      media?.url ?? null,
    ]
  );
  if (result.rows.length === 0) return null;

  const user = await findUserById(userId);
  const userRating = await getUserMovieRating(userId, movieId);
  const row = result.rows[0];
  return {
    id: row.id,
    movie_id: row.movie_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    media_type: row.media_type ?? null,
    media_url: row.media_url ?? null,
    created_at: row.created_at.toISOString(),
    display_name: user?.display_name ?? null,
    avatar_url: user?.avatar_url ?? null,
    user_rating: userRating,
    replies: [],
  };
}

export class DuplicateReportError extends Error {
  constructor() {
    super("You have already reported this comment");
    this.name = "DuplicateReportError";
  }
}

export class SelfReportError extends Error {
  constructor() {
    super("You cannot report your own comment");
    this.name = "SelfReportError";
  }
}

export async function createCommentReport(
  commentId: string,
  reporterId: string,
  reason: string
): Promise<{ id: string }> {
  const pool = getPool();

  const commentResult = await pool.query(
    `SELECT user_id FROM movie_comments WHERE id = $1`,
    [commentId]
  );
  if (commentResult.rows.length === 0) {
    throw new Error("Comment not found");
  }
  if (commentResult.rows[0].user_id === reporterId) {
    throw new SelfReportError();
  }

  try {
    const result = await pool.query(
      `INSERT INTO comment_reports (comment_id, reporter_id, reason)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [commentId, reporterId, reason]
    );
    return { id: result.rows[0].id };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new DuplicateReportError();
    }
    throw error;
  }
}

export async function listPendingReports(): Promise<CommentReportDetail[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       cr.id,
       cr.comment_id,
       cr.reporter_id,
       cr.reason,
       cr.status,
       cr.created_at,
       mc.body AS comment_body,
       mc.media_type AS comment_media_type,
       mc.media_url AS comment_media_url,
       mc.user_id AS comment_author_id,
       author.display_name AS comment_author_name,
       author.email AS comment_author_email,
       reporter.display_name AS reporter_name,
       reporter.email AS reporter_email,
       m.id AS movie_id,
       m.title AS movie_title
     FROM comment_reports cr
     JOIN movie_comments mc ON mc.id = cr.comment_id
     JOIN users author ON author.id = mc.user_id
     JOIN users reporter ON reporter.id = cr.reporter_id
     JOIN movies m ON m.id = mc.movie_id
     WHERE cr.status = 'pending'
     ORDER BY cr.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    comment_id: row.comment_id,
    reporter_id: row.reporter_id,
    reason: row.reason,
    status: row.status,
    created_at: row.created_at.toISOString(),
    comment_body: row.comment_body,
    comment_media_type: row.comment_media_type ?? null,
    comment_media_url: row.comment_media_url ?? null,
    comment_author_id: row.comment_author_id,
    comment_author_name: row.comment_author_name,
    comment_author_email: row.comment_author_email,
    reporter_name: row.reporter_name,
    reporter_email: row.reporter_email,
    movie_id: row.movie_id,
    movie_title: row.movie_title,
  }));
}

export async function countPendingReports(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM comment_reports WHERE status = 'pending'`
  );
  return result.rows[0].count;
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  action: ReportResolveAction
): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reportResult = await client.query(
      `SELECT cr.id, cr.comment_id, mc.user_id AS comment_author_id
       FROM comment_reports cr
       JOIN movie_comments mc ON mc.id = cr.comment_id
       WHERE cr.id = $1 AND cr.status = 'pending'
       FOR UPDATE`,
      [reportId]
    );
    if (reportResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    const report = reportResult.rows[0];

    if (action === "delete_comment") {
      await client.query(`DELETE FROM movie_comments WHERE id = $1`, [
        report.comment_id,
      ]);
    } else if (action === "suspend_user") {
      await client.query(
        `UPDATE users SET account_status = 'suspended' WHERE id = $1`,
        [report.comment_author_id]
      );
    } else if (action === "ban_user") {
      await client.query(`DELETE FROM users WHERE id = $1`, [
        report.comment_author_id,
      ]);
    }

    const status = action === "dismiss" ? "dismissed" : "resolved";
    await client.query(
      `UPDATE comment_reports
       SET status = $2, resolved_at = NOW(), resolved_by = $3
       WHERE id = $1`,
      [reportId, status, adminId]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCommentById(commentId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM movie_comments WHERE id = $1`,
    [commentId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function suspendUser(userId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET account_status = 'suspended' WHERE id = $1 AND role = 'user'`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function unsuspendUser(userId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET account_status = 'active' WHERE id = $1`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteUserById(userId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'user'`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

function mapLibraryRow(row: {
  media_type: CommentMediaType;
  media_url: string;
  preview_url: string | null;
  giphy_id: string | null;
  label: string | null;
  used_at?: Date;
  created_at?: Date;
}): CommentMediaLibraryItem {
  return {
    media_type: row.media_type,
    media_url: row.media_url,
    preview_url: row.preview_url,
    giphy_id: row.giphy_id,
    label: row.label,
    used_at: row.used_at?.toISOString(),
    created_at: row.created_at?.toISOString(),
  };
}

export async function listUserMediaFavorites(
  userId: string,
  mediaType: CommentMediaType
): Promise<CommentMediaLibraryItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT media_type, media_url, preview_url, giphy_id, label, created_at
     FROM user_comment_media_favorites
     WHERE user_id = $1 AND media_type = $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId, mediaType]
  );
  return result.rows.map((row) => mapLibraryRow(row));
}

export async function listUserMediaRecent(
  userId: string,
  mediaType: CommentMediaType,
  limit = 20
): Promise<CommentMediaLibraryItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT media_type, media_url, preview_url, giphy_id, label, used_at
     FROM user_comment_media_recent
     WHERE user_id = $1 AND media_type = $2
     ORDER BY used_at DESC
     LIMIT $3`,
    [userId, mediaType, limit]
  );
  return result.rows.map((row) => mapLibraryRow(row));
}

export async function listUserUploadedStickers(
  userId: string
): Promise<UserUploadedSticker[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, url, label, created_at
     FROM user_uploaded_stickers
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    url: row.url,
    label: row.label,
    created_at: row.created_at.toISOString(),
  }));
}

export async function getCommentMediaLibrary(
  userId: string
): Promise<CommentMediaLibrary> {
  const [gifFavorites, gifRecent, stickerFavorites, stickerRecent, uploadedStickers] =
    await Promise.all([
      listUserMediaFavorites(userId, "gif"),
      listUserMediaRecent(userId, "gif"),
      listUserMediaFavorites(userId, "sticker"),
      listUserMediaRecent(userId, "sticker"),
      listUserUploadedStickers(userId),
    ]);

  return {
    gifFavorites,
    gifRecent,
    stickerFavorites,
    stickerRecent,
    uploadedStickers,
  };
}

export async function addUserMediaFavorite(
  userId: string,
  item: {
    mediaType: CommentMediaType;
    mediaUrl: string;
    previewUrl?: string | null;
    giphyId?: string | null;
    label?: string | null;
  }
): Promise<CommentMediaLibraryItem> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO user_comment_media_favorites
       (user_id, media_type, media_url, preview_url, giphy_id, label)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, media_type, media_url) DO UPDATE
       SET preview_url = EXCLUDED.preview_url,
           giphy_id = EXCLUDED.giphy_id,
           label = EXCLUDED.label
     RETURNING media_type, media_url, preview_url, giphy_id, label, created_at`,
    [
      userId,
      item.mediaType,
      item.mediaUrl,
      item.previewUrl ?? null,
      item.giphyId ?? null,
      item.label ?? null,
    ]
  );
  return mapLibraryRow(result.rows[0]);
}

export async function removeUserMediaFavorite(
  userId: string,
  mediaType: CommentMediaType,
  mediaUrl: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM user_comment_media_favorites
     WHERE user_id = $1 AND media_type = $2 AND media_url = $3`,
    [userId, mediaType, mediaUrl]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function recordUserMediaRecent(
  userId: string,
  item: {
    mediaType: CommentMediaType;
    mediaUrl: string;
    previewUrl?: string | null;
    giphyId?: string | null;
    label?: string | null;
  }
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_comment_media_recent
       (user_id, media_type, media_url, preview_url, giphy_id, label, used_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id, media_type, media_url) DO UPDATE
       SET preview_url = EXCLUDED.preview_url,
           giphy_id = EXCLUDED.giphy_id,
           label = EXCLUDED.label,
           used_at = NOW()`,
    [
      userId,
      item.mediaType,
      item.mediaUrl,
      item.previewUrl ?? null,
      item.giphyId ?? null,
      item.label ?? null,
    ]
  );
}

export async function createUserUploadedSticker(
  userId: string,
  url: string,
  label: string
): Promise<UserUploadedSticker> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO user_uploaded_stickers (user_id, url, label)
     VALUES ($1, $2, $3)
     RETURNING id, url, label, created_at`,
    [userId, url, label]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    url: row.url,
    label: row.label,
    created_at: row.created_at.toISOString(),
  };
}

export async function userOwnsUploadedStickerUrl(
  userId: string,
  url: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM user_uploaded_stickers WHERE user_id = $1 AND url = $2`,
    [userId, url]
  );
  return result.rows.length > 0;
}

// ─── Series ───────────────────────────────────────────────────────────────────

export async function listSeries(): Promise<Series[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       s.id,
       s.title,
       s.description,
       s.release_year,
       s.poster_url,
       s.backdrop_url,
       s.match_score,
       sr.avg_rating,
       sr.rating_count,
       COUNT(e.id)::int AS episode_count,
       COALESCE(array_agg(DISTINCT g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
     FROM series s
     ${SERIES_RATING_JOIN}
     LEFT JOIN series_genres sg ON sg.series_id = s.id
     LEFT JOIN genres g ON g.id = sg.genre_id
     LEFT JOIN episodes e ON e.series_id = s.id
     GROUP BY s.id, sr.avg_rating, sr.rating_count
     ORDER BY s.title`
  );
  return result.rows.map(toSeries);
}

export async function getSeriesById(id: string): Promise<SeriesDetail | null> {
  const pool = getPool();
  const seriesResult = await pool.query(
    `SELECT
       s.id,
       s.title,
       s.description,
       s.release_year,
       s.poster_url,
       s.backdrop_url,
       s.match_score,
       sr.avg_rating,
       sr.rating_count,
       COUNT(e.id)::int AS episode_count,
       COALESCE(array_agg(DISTINCT g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
     FROM series s
     ${SERIES_RATING_JOIN}
     LEFT JOIN series_genres sg ON sg.series_id = s.id
     LEFT JOIN genres g ON g.id = sg.genre_id
     LEFT JOIN episodes e ON e.series_id = s.id
     WHERE s.id = $1
     GROUP BY s.id, sr.avg_rating, sr.rating_count`,
    [id]
  );
  if (seriesResult.rows.length === 0) return null;

  const episodesResult = await pool.query(
    `SELECT
       e.id,
       e.series_id,
       e.season_number,
       e.episode_number,
       e.title,
       e.description,
       e.duration_seconds,
       e.thumbnail_url,
       es.hls_playlist_url,
       es.quality_label
     FROM episodes e
     LEFT JOIN episode_streams es ON es.episode_id = e.id
     WHERE e.series_id = $1
     ORDER BY e.season_number, e.episode_number`,
    [id]
  );

  return {
    ...toSeries(seriesResult.rows[0]),
    episodes: episodesResult.rows.map(toEpisode),
  };
}

export async function listAdminSeries(): Promise<AdminSeries[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       s.id,
       s.title,
       s.description,
       s.release_year,
       s.poster_url,
       s.backdrop_url,
       s.match_score,
       COUNT(e.id)::int AS episode_count,
       COALESCE(array_agg(DISTINCT g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
     FROM series s
     LEFT JOIN series_genres sg ON sg.series_id = s.id
     LEFT JOIN genres g ON g.id = sg.genre_id
     LEFT JOIN episodes e ON e.series_id = s.id
     GROUP BY s.id
     ORDER BY s.title`
  );
  return result.rows.map(toSeries);
}

export interface CreateSeriesInput {
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  genres: string[];
}

export async function createSeries(input: CreateSeriesInput): Promise<AdminSeries> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const seriesResult = await client.query(
      `INSERT INTO series (title, description, release_year, poster_url, backdrop_url, match_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        input.title,
        input.description,
        input.release_year,
        input.poster_url,
        input.backdrop_url,
        input.match_score,
      ]
    );
    const seriesId = seriesResult.rows[0].id as string;

    for (const genreName of input.genres) {
      const genreId = await ensureGenreWithClient(client, genreName);
      await client.query(
        `INSERT INTO series_genres (series_id, genre_id) VALUES ($1, $2)`,
        [seriesId, genreId]
      );
    }

    await client.query("COMMIT");
    const series = await getSeriesById(seriesId);
    if (!series) throw new Error("Failed to load created series");
    return series;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface UpdateSeriesInput {
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  genres: string[];
}

export async function updateSeries(
  seriesId: string,
  input: UpdateSeriesInput
): Promise<AdminSeries | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE series SET
         title = $2,
         description = $3,
         release_year = $4,
         poster_url = $5,
         backdrop_url = $6,
         match_score = $7
       WHERE id = $1
       RETURNING id`,
      [
        seriesId,
        input.title,
        input.description,
        input.release_year,
        input.poster_url,
        input.backdrop_url,
        input.match_score,
      ]
    );
    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`DELETE FROM series_genres WHERE series_id = $1`, [seriesId]);
    for (const genreName of input.genres) {
      const genreId = await ensureGenreWithClient(client, genreName);
      await client.query(
        `INSERT INTO series_genres (series_id, genre_id) VALUES ($1, $2)`,
        [seriesId, genreId]
      );
    }

    await client.query("COMMIT");
    return getSeriesById(seriesId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSeries(seriesId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM series WHERE id = $1`, [seriesId]);
  return (result.rowCount ?? 0) > 0;
}

export interface CreateEpisodeInput {
  series_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  hls_playlist_url: string;
  quality_label: string | null;
}

export async function createEpisodeWithStream(
  input: CreateEpisodeInput
): Promise<Episode> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const episodeResult = await client.query(
      `INSERT INTO episodes (series_id, season_number, episode_number, title, description, duration_seconds, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.series_id,
        input.season_number,
        input.episode_number,
        input.title,
        input.description,
        input.duration_seconds,
        input.thumbnail_url,
      ]
    );
    const episodeId = episodeResult.rows[0].id as string;

    await client.query(
      `INSERT INTO episode_streams (episode_id, hls_playlist_url, quality_label)
       VALUES ($1, $2, $3)`,
      [episodeId, input.hls_playlist_url, input.quality_label]
    );

    await client.query("COMMIT");
    const episode = await getEpisodeById(episodeId);
    if (!episode) throw new Error("Failed to load created episode");
    return episode;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface UpdateEpisodeInput {
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  quality_label: string | null;
  hls_playlist_url?: string;
}

export async function updateEpisodeWithStream(
  episodeId: string,
  input: UpdateEpisodeInput
): Promise<Episode | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE episodes SET
         season_number = $2,
         episode_number = $3,
         title = $4,
         description = $5,
         duration_seconds = $6,
         thumbnail_url = $7
       WHERE id = $1
       RETURNING id`,
      [
        episodeId,
        input.season_number,
        input.episode_number,
        input.title,
        input.description,
        input.duration_seconds,
        input.thumbnail_url,
      ]
    );
    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    if (input.hls_playlist_url) {
      await client.query(
        `INSERT INTO episode_streams (episode_id, hls_playlist_url, quality_label)
         VALUES ($1, $2, $3)
         ON CONFLICT (episode_id) DO UPDATE SET
           hls_playlist_url = EXCLUDED.hls_playlist_url,
           quality_label = EXCLUDED.quality_label`,
        [episodeId, input.hls_playlist_url, input.quality_label]
      );
    } else {
      await client.query(
        `UPDATE episode_streams SET quality_label = $2 WHERE episode_id = $1`,
        [episodeId, input.quality_label]
      );
    }

    await client.query("COMMIT");
    return getEpisodeById(episodeId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteEpisode(episodeId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM episodes WHERE id = $1`, [episodeId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getEpisodeById(id: string): Promise<EpisodeDetail | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       e.id,
       e.series_id,
       e.season_number,
       e.episode_number,
       e.title,
       e.description,
       e.duration_seconds,
       e.thumbnail_url,
       es.hls_playlist_url,
       es.quality_label,
       s.title AS series_title
     FROM episodes e
     JOIN series s ON s.id = e.series_id
     LEFT JOIN episode_streams es ON es.episode_id = e.id
     WHERE e.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...toEpisode(row),
    hls_playlist_url: row.hls_playlist_url,
    quality_label: row.quality_label,
    series_title: row.series_title,
  };
}

export async function recordSeriesView(
  userId: string,
  seriesId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO series_views (user_id, series_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, series_id) DO UPDATE SET viewed_at = NOW()`,
    [userId, seriesId]
  );
}

export async function isSeriesInWatchlist(
  userId: string,
  seriesId: string
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 1 FROM series_watchlist WHERE user_id = $1 AND series_id = $2`,
    [userId, seriesId]
  );
  return result.rows.length > 0;
}

export async function getSeriesWatchlistIds(userId: string): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT series_id FROM series_watchlist WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.series_id as string);
}

export async function getSeriesWatchlist(
  userId: string
): Promise<SeriesWatchlistItem[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       s.id,
       s.title,
       s.description,
       s.release_year,
       s.poster_url,
       s.backdrop_url,
       s.match_score,
       COALESCE(array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres,
       w.added_at,
       COUNT(e.id)::int AS episode_count
     FROM series_watchlist w
     JOIN series s ON s.id = w.series_id
     LEFT JOIN series_genres sg ON sg.series_id = s.id
     LEFT JOIN genres g ON g.id = sg.genre_id
     LEFT JOIN episodes e ON e.series_id = s.id
     WHERE w.user_id = $1
     GROUP BY s.id, w.added_at
     ORDER BY w.added_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    ...toSeries(row),
    added_at: row.added_at.toISOString(),
  }));
}

export async function addSeriesToWatchlist(
  userId: string,
  seriesId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO series_watchlist (user_id, series_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, series_id) DO NOTHING`,
    [userId, seriesId]
  );
}

export async function removeSeriesFromWatchlist(
  userId: string,
  seriesId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM series_watchlist WHERE user_id = $1 AND series_id = $2`,
    [userId, seriesId]
  );
}

export async function getSeriesRatingStats(
  seriesId: string
): Promise<MovieRatingStats> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(*)::int AS rating_count
     FROM series_ratings
     WHERE series_id = $1`,
    [seriesId]
  );
  const row = result.rows[0];
  const count = Number(row.rating_count);
  return {
    avg_rating: count > 0 ? Number(row.avg_rating) : null,
    rating_count: count,
  };
}

export async function getUserSeriesRating(
  userId: string,
  seriesId: string
): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT rating FROM series_ratings WHERE user_id = $1 AND series_id = $2`,
    [userId, seriesId]
  );
  if (result.rows.length === 0) return null;
  return Number(result.rows[0].rating);
}

export async function upsertSeriesRating(
  userId: string,
  seriesId: string,
  rating: number
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO series_ratings (user_id, series_id, rating, rated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, series_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       rated_at = NOW()`,
    [userId, seriesId, rating]
  );
}

export async function deleteSeriesRating(
  userId: string,
  seriesId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM series_ratings WHERE user_id = $1 AND series_id = $2`,
    [userId, seriesId]
  );
}

export async function listCommentsBySeriesId(
  seriesId: string
): Promise<SeriesComment[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       sc.id,
       sc.series_id,
       sc.user_id,
       sc.parent_id,
       sc.body,
       sc.media_type,
       sc.media_url,
       sc.created_at,
       u.display_name,
       u.avatar_url,
       sr.rating AS user_rating
     FROM series_comments sc
     JOIN users u ON u.id = sc.user_id
     LEFT JOIN series_ratings sr
       ON sr.user_id = sc.user_id AND sr.series_id = sc.series_id
     WHERE sc.series_id = $1
     ORDER BY sc.created_at ASC`,
    [seriesId]
  );

  const rows = result.rows.map((row) => ({
    id: row.id,
    series_id: row.series_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    media_type: row.media_type ?? null,
    media_url: row.media_url ?? null,
    created_at: row.created_at.toISOString(),
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
    replies: [] as SeriesComment[],
  }));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const topLevel: SeriesComment[] = [];

  for (const row of rows) {
    if (row.parent_id) {
      const parent = byId.get(row.parent_id);
      if (parent) {
        parent.replies!.push(row);
      }
    } else {
      topLevel.push(row);
    }
  }

  topLevel.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return topLevel;
}

export async function createSeriesComment(
  seriesId: string,
  userId: string,
  body: string,
  parentId?: string | null,
  media?: { type: "gif" | "sticker"; url: string } | null
): Promise<SeriesComment | null> {
  const pool = getPool();
  const seriesExists = await pool.query(`SELECT id FROM series WHERE id = $1`, [
    seriesId,
  ]);
  if (seriesExists.rows.length === 0) return null;

  if (parentId) {
    const parentResult = await pool.query(
      `SELECT id, series_id, parent_id FROM series_comments WHERE id = $1`,
      [parentId]
    );
    if (parentResult.rows.length === 0) return null;
    const parent = parentResult.rows[0];
    if (parent.series_id !== seriesId) return null;
    if (parent.parent_id !== null) return null;
  }

  const result = await pool.query(
    `INSERT INTO series_comments (series_id, user_id, body, parent_id, media_type, media_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, series_id, user_id, parent_id, body, media_type, media_url, created_at`,
    [
      seriesId,
      userId,
      body,
      parentId ?? null,
      media?.type ?? null,
      media?.url ?? null,
    ]
  );
  if (result.rows.length === 0) return null;

  const user = await findUserById(userId);
  const userRating = await getUserSeriesRating(userId, seriesId);
  const row = result.rows[0];
  return {
    id: row.id,
    series_id: row.series_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    media_type: row.media_type ?? null,
    media_url: row.media_url ?? null,
    created_at: row.created_at.toISOString(),
    display_name: user?.display_name ?? null,
    avatar_url: user?.avatar_url ?? null,
    user_rating: userRating,
    replies: [],
  };
}

export async function getEpisodeWatchProgress(
  userId: string,
  episodeId: string
): Promise<EpisodeWatchProgress | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, user_id, episode_id, progress_seconds, completed, last_watched_at
     FROM episode_watch_progress
     WHERE user_id = $1 AND episode_id = $2`,
    [userId, episodeId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    episode_id: row.episode_id,
    progress_seconds: row.progress_seconds,
    completed: row.completed,
    last_watched_at: row.last_watched_at.toISOString(),
  };
}

export async function saveEpisodeWatchProgress(
  userId: string,
  episodeId: string,
  progressSeconds: number,
  durationSeconds: number
): Promise<EpisodeWatchProgress> {
  const pool = getPool();
  const completed = progressSeconds >= durationSeconds * 0.9;
  const result = await pool.query(
    `INSERT INTO episode_watch_progress (user_id, episode_id, progress_seconds, completed, last_watched_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, episode_id) DO UPDATE SET
       progress_seconds = EXCLUDED.progress_seconds,
       completed = EXCLUDED.completed,
       last_watched_at = NOW()
     RETURNING id, user_id, episode_id, progress_seconds, completed, last_watched_at`,
    [userId, episodeId, progressSeconds, completed]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    episode_id: row.episode_id,
    progress_seconds: row.progress_seconds,
    completed: row.completed,
    last_watched_at: row.last_watched_at.toISOString(),
  };
}
