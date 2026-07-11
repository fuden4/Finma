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
  description      TEXT,
  artist           VARCHAR(255),
  cover_url        TEXT NOT NULL,
  audio_url        TEXT NOT NULL,
  download_url     TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
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
