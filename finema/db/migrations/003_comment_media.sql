-- Add optional GIF/sticker media to movie comments
ALTER TABLE movie_comments
  DROP CONSTRAINT IF EXISTS movie_comments_body_check;

ALTER TABLE movie_comments
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) CHECK (media_type IN ('gif', 'sticker')),
  ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE movie_comments
  ALTER COLUMN body SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movie_comments_body_length_check'
  ) THEN
    ALTER TABLE movie_comments
      ADD CONSTRAINT movie_comments_body_length_check
      CHECK (char_length(body) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movie_comments_content_check'
  ) THEN
    ALTER TABLE movie_comments
      ADD CONSTRAINT movie_comments_content_check
      CHECK (char_length(body) >= 1 OR media_url IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movie_comments_media_pair_check'
  ) THEN
    ALTER TABLE movie_comments
      ADD CONSTRAINT movie_comments_media_pair_check
      CHECK (
        (media_type IS NULL AND media_url IS NULL)
        OR (media_type IS NOT NULL AND media_url IS NOT NULL)
      );
  END IF;
END $$;
