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

export interface MovieComment {
  id: string;
  movie_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
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
  comment_author_id: string;
  comment_author_name: string | null;
  comment_author_email: string;
  reporter_name: string | null;
  reporter_email: string;
  movie_id: string;
  movie_title: string;
}

export interface UserCommentItem {
  id: string;
  movie_id: string;
  movie_title: string;
  movie_poster_url: string | null;
  body: string;
  created_at: string;
  user_rating: number | null;
}

export interface AdminMovie extends MovieDetail {}

export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
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
