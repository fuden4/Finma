CREATE TABLE song_block_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_id   UUID NOT NULL REFERENCES song_blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, block_id)
);

CREATE INDEX idx_song_block_likes_block ON song_block_likes (block_id);
CREATE INDEX idx_song_block_likes_user ON song_block_likes (user_id, created_at DESC);
