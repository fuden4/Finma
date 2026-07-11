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
