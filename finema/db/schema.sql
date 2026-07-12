CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS song_likes CASCADE;
DROP TABLE IF EXISTS song_block_likes CASCADE;
DROP TABLE IF EXISTS song_block_items CASCADE;
DROP TABLE IF EXISTS song_blocks CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS song_categories CASCADE;
DROP TABLE IF EXISTS poster_likes CASCADE;
DROP TABLE IF EXISTS posters CASCADE;
DROP TABLE IF EXISTS episode_watch_progress CASCADE;
DROP TABLE IF EXISTS series_comments CASCADE;
DROP TABLE IF EXISTS series_views CASCADE;
DROP TABLE IF EXISTS series_watchlist CASCADE;
DROP TABLE IF EXISTS series_ratings CASCADE;
DROP TABLE IF EXISTS episode_streams CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS series_genres CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS comment_reports CASCADE;
DROP TABLE IF EXISTS movie_comments CASCADE;
DROP TABLE IF EXISTS movie_ratings CASCADE;
DROP TABLE IF EXISTS movie_searches CASCADE;
DROP TABLE IF EXISTS watch_events CASCADE;
DROP TABLE IF EXISTS movie_views CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS watch_progress CASCADE;
DROP TABLE IF EXISTS movie_streams CASCADE;
DROP TABLE IF EXISTS movie_genres CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status  VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE movies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL UNIQUE,
  description      TEXT,
  release_year     SMALLINT,
  duration_seconds INTEGER NOT NULL,
  poster_url       TEXT,
  backdrop_url     TEXT,
  match_score      NUMERIC(5, 2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE genres (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE movie_genres (
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE movie_streams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id         UUID NOT NULL UNIQUE REFERENCES movies(id) ON DELETE CASCADE,
  hls_playlist_url TEXT NOT NULL,
  quality_label    VARCHAR(20)
);

CREATE TABLE watch_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id         UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE INDEX idx_watch_progress_user_last_watched
  ON watch_progress (user_id, last_watched_at DESC);

CREATE TABLE movie_views (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id   UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_movie_views_user ON movie_views (user_id, viewed_at DESC);

CREATE TABLE movie_searches (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id    UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_movie_searches_user ON movie_searches (user_id, searched_at DESC);

CREATE TABLE watch_events (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id   UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_watch_events_user ON watch_events (user_id, watched_at DESC);

CREATE TABLE watchlist (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id  UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_watchlist_user_added
  ON watchlist (user_id, added_at DESC);

CREATE TABLE movie_ratings (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id   UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_movie_ratings_movie_id ON movie_ratings (movie_id);
CREATE INDEX idx_movie_ratings_user_rated ON movie_ratings (user_id, rated_at DESC);

CREATE TABLE movie_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id   UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES movie_comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL DEFAULT '',
  media_type VARCHAR(10) CHECK (media_type IN ('gif', 'sticker')),
  media_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(body) <= 2000),
  CHECK (char_length(body) >= 1 OR media_url IS NOT NULL),
  CHECK (
    (media_type IS NULL AND media_url IS NULL)
    OR (media_type IS NOT NULL AND media_url IS NOT NULL)
  )
);

CREATE INDEX idx_movie_comments_movie_created
  ON movie_comments (movie_id, created_at DESC);

CREATE INDEX idx_movie_comments_parent_created
  ON movie_comments (parent_id, created_at ASC);

CREATE TABLE comment_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id   UUID NOT NULL REFERENCES movie_comments(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 1000),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (comment_id, reporter_id)
);

CREATE INDEX idx_comment_reports_status_created
  ON comment_reports (status, created_at DESC);

CREATE TABLE user_uploaded_stickers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT 'Uploaded sticker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_uploaded_stickers_user_created
  ON user_uploaded_stickers (user_id, created_at DESC);

CREATE TABLE user_comment_media_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type  VARCHAR(10) NOT NULL CHECK (media_type IN ('gif', 'sticker')),
  media_url   TEXT NOT NULL,
  preview_url TEXT,
  giphy_id    VARCHAR(64),
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, media_type, media_url)
);

CREATE INDEX idx_user_comment_media_favorites_user_type
  ON user_comment_media_favorites (user_id, media_type, created_at DESC);

CREATE TABLE user_comment_media_recent (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type  VARCHAR(10) NOT NULL CHECK (media_type IN ('gif', 'sticker')),
  media_url   TEXT NOT NULL,
  preview_url TEXT,
  giphy_id    VARCHAR(64),
  label       TEXT,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, media_type, media_url)
);

CREATE INDEX idx_user_comment_media_recent_user_type
  ON user_comment_media_recent (user_id, media_type, used_at DESC);

CREATE TABLE series (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  release_year  SMALLINT,
  poster_url    TEXT,
  backdrop_url  TEXT,
  match_score   NUMERIC(5, 2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE series_genres (
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  genre_id  UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, genre_id)
);

CREATE TABLE episodes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id        UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_number    SMALLINT NOT NULL DEFAULT 1 CHECK (season_number >= 1),
  episode_number   SMALLINT NOT NULL CHECK (episode_number >= 1),
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  duration_seconds INTEGER NOT NULL,
  thumbnail_url    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (series_id, season_number, episode_number)
);

CREATE INDEX idx_episodes_series_order
  ON episodes (series_id, season_number, episode_number);

CREATE TABLE episode_streams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id       UUID NOT NULL UNIQUE REFERENCES episodes(id) ON DELETE CASCADE,
  hls_playlist_url TEXT NOT NULL,
  quality_label    VARCHAR(20)
);

CREATE TABLE series_ratings (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX idx_series_ratings_series_id ON series_ratings (series_id);
CREATE INDEX idx_series_ratings_user_rated ON series_ratings (user_id, rated_at DESC);

CREATE TABLE series_watchlist (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX idx_series_watchlist_user_added
  ON series_watchlist (user_id, added_at DESC);

CREATE TABLE series_views (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX idx_series_views_user ON series_views (user_id, viewed_at DESC);

CREATE TABLE series_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES series_comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL DEFAULT '',
  media_type VARCHAR(10) CHECK (media_type IN ('gif', 'sticker')),
  media_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(body) <= 2000),
  CHECK (char_length(body) >= 1 OR media_url IS NOT NULL),
  CHECK (
    (media_type IS NULL AND media_url IS NULL)
    OR (media_type IS NOT NULL AND media_url IS NOT NULL)
  )
);

CREATE INDEX idx_series_comments_series_created
  ON series_comments (series_id, created_at DESC);

CREATE INDEX idx_series_comments_parent_created
  ON series_comments (parent_id, created_at ASC);

CREATE TABLE episode_watch_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id       UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, episode_id)
);

CREATE INDEX idx_episode_watch_progress_user_last_watched
  ON episode_watch_progress (user_id, last_watched_at DESC);

CREATE TABLE posters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER posters_updated_at
  BEFORE UPDATE ON posters
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE poster_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poster_id  UUID NOT NULL REFERENCES posters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, poster_id)
);

CREATE INDEX idx_poster_likes_poster ON poster_likes (poster_id);

CREATE TABLE song_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE songs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL UNIQUE,
  description      TEXT,
  artist           VARCHAR(255),
  cover_url        TEXT NOT NULL,
  audio_url        TEXT NOT NULL,
  download_url     TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  source_lufs      REAL,
  category_id      UUID REFERENCES song_categories(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE song_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  layout      VARCHAR(20) NOT NULL DEFAULT 'row'
              CHECK (layout IN ('row', 'grid')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE song_block_items (
  block_id   UUID NOT NULL REFERENCES song_blocks(id) ON DELETE CASCADE,
  song_id    UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (block_id, song_id)
);

CREATE INDEX idx_song_block_items_block ON song_block_items (block_id, sort_order);

CREATE TABLE song_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id    UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

CREATE INDEX idx_song_likes_song ON song_likes (song_id);
CREATE INDEX idx_song_likes_user ON song_likes (user_id, created_at DESC);

CREATE TABLE song_block_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_id   UUID NOT NULL REFERENCES song_blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, block_id)
);

CREATE INDEX idx_song_block_likes_block ON song_block_likes (block_id);
CREATE INDEX idx_song_block_likes_user ON song_block_likes (user_id, created_at DESC);

CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_playlists_user ON playlists (user_id, created_at DESC);

CREATE TABLE playlist_songs (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, song_id)
);

CREATE INDEX idx_playlist_songs_playlist ON playlist_songs (playlist_id, position);
