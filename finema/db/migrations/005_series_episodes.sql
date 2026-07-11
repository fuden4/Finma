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
