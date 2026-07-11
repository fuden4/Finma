export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportResolveAction =
  | "dismiss"
  | "delete_comment"
  | "suspend_user"
  | "ban_user";

export interface PublicUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
}

export type CommentMediaType = "gif" | "sticker";

export interface CommentMediaLibraryItem {
  media_type: CommentMediaType;
  media_url: string;
  preview_url: string | null;
  giphy_id: string | null;
  label: string | null;
  used_at?: string;
  created_at?: string;
}

export interface UserUploadedSticker {
  id: string;
  url: string;
  label: string;
  created_at: string;
}

export interface CommentMediaLibrary {
  gifFavorites: CommentMediaLibraryItem[];
  gifRecent: CommentMediaLibraryItem[];
  stickerFavorites: CommentMediaLibraryItem[];
  stickerRecent: CommentMediaLibraryItem[];
  uploadedStickers: UserUploadedSticker[];
}

export interface MovieComment {
  id: string;
  movie_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  media_type: CommentMediaType | null;
  media_url: string | null;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  user_rating: number | null;
  replies?: MovieComment[];
}

export interface CommentReportDetail {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  comment_body: string;
  comment_media_type: CommentMediaType | null;
  comment_media_url: string | null;
  comment_author_id: string;
  comment_author_name: string | null;
  comment_author_email: string;
  reporter_name: string | null;
  reporter_email: string;
  movie_id: string;
  movie_slug: string;
  movie_title: string;
}

export interface UserCommentItem {
  id: string;
  movie_id: string;
  movie_slug: string;
  movie_title: string;
  movie_poster_url: string | null;
  body: string;
  media_type: CommentMediaType | null;
  media_url: string | null;
  created_at: string;
  user_rating: number | null;
}

export interface AdminMovie extends MovieDetail {}

export interface Series {
  id: string;
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  genres: string[];
  avg_rating?: number | null;
  rating_count?: number;
  episode_count?: number;
}

export interface Episode {
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
}

export interface SeriesDetail extends Series {
  episodes: Episode[];
}

export interface AdminSeries extends Series {}

export interface SeriesWatchlistItem extends Series {
  added_at: string;
}

export interface SeriesComment {
  id: string;
  series_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  media_type: CommentMediaType | null;
  media_url: string | null;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  user_rating: number | null;
  replies?: SeriesComment[];
}

export interface EpisodeDetail extends Episode {
  hls_playlist_url: string | null;
  quality_label: string | null;
  series_title: string;
}

export interface EpisodeWatchProgress {
  id: string;
  user_id: string;
  episode_id: string;
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  genres: string[];
  avg_rating?: number | null;
  rating_count?: number;
}

export interface MovieDetail extends Movie {
  hls_playlist_url: string | null;
  quality_label: string | null;
}

export interface WatchProgress {
  id: string;
  user_id: string;
  movie_id: string;
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export interface WatchlistItem extends Movie {
  added_at: string;
}

export interface MovieRatingStats {
  avg_rating: number | null;
  rating_count: number;
}

export interface RatedMovieItem extends Movie {
  user_rating: number;
  rated_at: string;
  avg_rating: number | null;
  rating_count: number;
}

export interface ContinueWatchingItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  progress_seconds: number;
  last_watched_at: string;
}

export interface WatchHistoryItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  release_year: number | null;
  duration_seconds: number;
  poster_url: string | null;
  backdrop_url: string | null;
  match_score: number | null;
  genres: string[];
  avg_rating: number | null;
  rating_count: number;
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export interface EpisodeWatchHistoryItem {
  id: string;
  series_id: string;
  series_title: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  poster_url: string | null;
  thumbnail_url: string | null;
  genres: string[];
  avg_rating: number | null;
  rating_count: number;
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export interface Poster {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface PosterWithStats extends Poster {
  like_count: number;
  liked_by_me: boolean;
}

export interface AdminPoster extends Poster {
  like_count: number;
}

export type SongBlockLayout = "row" | "grid";

export interface SongCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Song {
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
  created_at: string;
  updated_at: string;
}

export interface SongWithStats extends Song {
  like_count: number;
  liked_by_me: boolean;
}

export interface AdminSong extends Song {
  like_count: number;
}

export interface SongBlock {
  id: string;
  title: string;
  description: string | null;
  layout: SongBlockLayout;
  sort_order: number;
  created_at: string;
}

export interface SongBlockWithSongs extends SongBlock {
  songs: SongWithStats[];
  song_count?: number;
  like_count: number;
  liked_by_me: boolean;
}

export interface AdminSongBlock extends SongBlock {
  song_count: number;
  song_ids: string[];
  preview_songs: Array<Pick<Song, "id" | "cover_url" | "title">>;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export type SearchContentType = "movie" | "series" | "song" | "poster";

export interface SearchResultItem {
  type: SearchContentType;
  id: string;
  slug?: string;
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  match_score: number | null;
  genres: string[];
  avg_rating: number | null;
  rating_count: number;
  episode_count?: number;
  artist?: string | null;
  like_count?: number;
}
