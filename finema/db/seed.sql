-- Dev seed data for Finema (safe to re-run via migrate.ts truncate logic)

INSERT INTO genres (id, name) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Action'),
  ('a1000000-0000-4000-8000-000000000002', 'Drama'),
  ('a1000000-0000-4000-8000-000000000003', 'Comedy'),
  ('a1000000-0000-4000-8000-000000000004', 'Sci-Fi');

INSERT INTO movies (id, title, description, release_year, duration_seconds, poster_url, backdrop_url, match_score) VALUES
  (
    'b2000000-0000-4000-8000-000000000001',
    'Neon Horizon',
    'A rogue pilot races against time to save a megacity on the brink of collapse.',
    2024,
    7320,
    '/posters/neon-horizon.jpg',
    '/backdrops/neon-horizon.jpg',
    98.00
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'The Last Letter',
    'Two estranged siblings reunite when a mysterious letter surfaces decades later.',
    2022,
    6540,
    '/posters/the-last-letter.jpg',
    '/backdrops/the-last-letter.jpg',
    91.50
  ),
  (
    'b2000000-0000-4000-8000-000000000003',
    'Midnight Circuit',
    'A stand-up comedian moonlighting as a hacker stumbles into a global conspiracy.',
    2023,
    5880,
    '/posters/midnight-circuit.jpg',
    '/backdrops/midnight-circuit.jpg',
    87.25
  ),
  (
    'b2000000-0000-4000-8000-000000000004',
    'Starfall Protocol',
    'An astronaut crew must choose between mission success and saving Earth.',
    2025,
    8100,
    '/posters/starfall-protocol.jpg',
    '/backdrops/starfall-protocol.jpg',
    95.75
  );

INSERT INTO movie_genres (movie_id, genre_id) VALUES
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004'),
  ('b2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003'),
  ('b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001'),
  ('b2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004'),
  ('b2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002');

INSERT INTO movie_streams (movie_id, hls_playlist_url, quality_label) VALUES
  ('b2000000-0000-4000-8000-000000000001', '/videos/neon-horizon/index.m3u8', '1080p'),
  ('b2000000-0000-4000-8000-000000000002', '/videos/the-last-letter/index.m3u8', '1080p'),
  ('b2000000-0000-4000-8000-000000000003', '/videos/midnight-circuit/index.m3u8', '720p'),
  ('b2000000-0000-4000-8000-000000000004', '/videos/starfall-protocol/index.m3u8', '1080p');

-- Demo user: demo@finema.local / password123 (dev-only)
INSERT INTO users (id, email, password_hash, display_name, role) VALUES
  (
    'c3000000-0000-4000-8000-000000000001',
    'demo@finema.local',
    crypt('password123', gen_salt('bf')),
    'Demo User',
    'user'
  );

-- Super admin (dev-only)
INSERT INTO users (id, email, password_hash, display_name, role) VALUES
  (
    'c3000000-0000-4000-8000-000000000002',
    'mohammeninj@gmail.com',
    crypt('1q2w3e2048', gen_salt('bf')),
    'Super Admin',
    'admin'
  );

INSERT INTO movie_comments (movie_id, user_id, body, created_at) VALUES
  (
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'The visuals in this one are absolutely stunning. Worth every minute.',
    NOW() - INTERVAL '3 days'
  ),
  (
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'Added this to my must-watch list. Great pacing throughout.',
    NOW() - INTERVAL '1 day'
  );

INSERT INTO watch_progress (user_id, movie_id, progress_seconds, completed, last_watched_at) VALUES
  (
    'c3000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    2145,
    FALSE,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'c3000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000002',
    6540,
    TRUE,
    NOW() - INTERVAL '1 day'
  );
