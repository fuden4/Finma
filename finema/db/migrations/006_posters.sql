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
