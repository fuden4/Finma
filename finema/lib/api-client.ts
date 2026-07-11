import type {
  AdminMovie,
  AdminPoster,
  AdminSeries,
  AdminSong,
  AdminSongBlock,
  CommentMediaLibrary,
  CommentMediaLibraryItem,
  CommentMediaType,
  CommentReportDetail,
  ContinueWatchingItem,
  Episode,
  EpisodeWatchProgress,
  EpisodeWatchHistoryItem,
  Genre,
  Movie,
  MovieComment,
  PosterWithStats,
  Playlist,
  PlaylistWithSongs,
  PublicUser,
  RatedMovieItem,
  ReportResolveAction,
  Series,
  SeriesComment,
  SeriesDetail,
  SeriesWatchlistItem,
  SongBlockWithSongs,
  SongCategory,
  SongWithStats,
  SearchResultItem,
  UserCommentItem,
  UserUploadedSticker,
  WatchlistItem,
  WatchHistoryItem,
  WatchProgress,
} from "@/db/types";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: PublicUser }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  displayName: string,
  password: string,
  avatarFile?: File | null
): Promise<{ user: PublicUser }> {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("displayName", displayName);
  formData.append("password", password);
  if (avatarFile) {
    formData.append("avatar_file", avatarFile);
  }

  const res = await fetch("/api/auth/register", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as { user: PublicUser };
}

export async function logout(): Promise<{ ok: boolean }> {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{ user: PublicUser } | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function updateProfile(
  formData: FormData
): Promise<{ user: PublicUser }> {
  const res = await fetch("/api/auth/profile", {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as { user: PublicUser };
}

export async function getMovieComments(
  movieId: string
): Promise<{ comments: MovieComment[] }> {
  return apiFetch(`/api/movies/${movieId}/comments`);
}

export async function postMovieComment(
  movieId: string,
  body: string,
  parentId?: string | null,
  media?: {
    type: "gif" | "sticker";
    url: string;
    previewUrl?: string;
    giphyId?: string;
    label?: string;
  } | null
): Promise<{ comment: MovieComment }> {
  return apiFetch(`/api/movies/${movieId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body,
      parent_id: parentId ?? null,
      media_type: media?.type ?? null,
      media_url: media?.url ?? null,
      media_preview_url: media?.previewUrl ?? null,
      media_giphy_id: media?.giphyId ?? null,
      media_label: media?.label ?? null,
    }),
  });
}

export async function searchGifs(
  query: string,
  offset = 0
): Promise<{ gifs: { id: string; previewUrl: string; url: string }[] }> {
  const params = new URLSearchParams({
    q: query,
    offset: String(offset),
  });
  return apiFetch(`/api/gifs/search?${params}`);
}

export async function getCommentMediaLibrary(): Promise<{
  library: CommentMediaLibrary;
}> {
  return apiFetch("/api/comment-media/library");
}

export async function addCommentMediaFavorite(item: {
  media_type: CommentMediaType;
  media_url: string;
  preview_url?: string | null;
  giphy_id?: string | null;
  label?: string | null;
}): Promise<{ favorite: CommentMediaLibraryItem }> {
  return apiFetch("/api/comment-media/favorites", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function removeCommentMediaFavorite(item: {
  media_type: CommentMediaType;
  media_url: string;
}): Promise<{ ok: boolean }> {
  return apiFetch("/api/comment-media/favorites", {
    method: "DELETE",
    body: JSON.stringify(item),
  });
}

export async function uploadSticker(
  file: File,
  label?: string
): Promise<{ sticker: UserUploadedSticker }> {
  const formData = new FormData();
  formData.append("sticker_file", file);
  if (label) formData.append("label", label);

  const res = await fetch("/api/stickers/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data as { sticker: UserUploadedSticker };
}

export async function reportComment(
  commentId: string,
  reason: string
): Promise<{ report: { id: string } }> {
  return apiFetch(`/api/comments/${commentId}/report`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getMyComments(): Promise<{ comments: UserCommentItem[] }> {
  return apiFetch("/api/comments/me");
}

export async function deleteMyComment(commentId: string): Promise<{ ok: true }> {
  return apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
}

export async function getContinueWatching(): Promise<{
  items: ContinueWatchingItem[];
}> {
  return apiFetch("/api/movies/continue-watching");
}

export async function getWatchHistory(): Promise<{
  items: WatchHistoryItem[];
}> {
  return apiFetch("/api/movies/watch-history");
}

export async function getEpisodeWatchHistory(): Promise<{
  items: EpisodeWatchHistoryItem[];
}> {
  return apiFetch("/api/series/watch-history");
}

export async function deleteAccount(password: string): Promise<{ ok: boolean }> {
  return apiFetch("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export async function getRecommendations(): Promise<{
  movies: Movie[];
  series: Series[];
}> {
  return apiFetch("/api/movies/recommendations");
}

export async function searchMovies(q: string): Promise<{ movies: Movie[] }> {
  return apiFetch(`/api/movies/search?q=${encodeURIComponent(q)}`);
}

export interface SearchCatalogParams {
  q?: string;
  type?: "all" | "movie" | "series" | "song" | "poster";
  year?: number | null;
  minRating?: number | null;
}

export async function searchCatalog(
  params: SearchCatalogParams
): Promise<{ results: SearchResultItem[] }> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.type && params.type !== "all") {
    searchParams.set("type", params.type);
  }
  if (params.year != null) {
    searchParams.set("year", String(params.year));
  }
  if (params.minRating != null) {
    searchParams.set("min_rating", String(params.minRating));
  }
  return apiFetch(`/api/search?${searchParams}`);
}

export async function recordSearchSelection(
  movieId: string
): Promise<{ ok: true }> {
  return apiFetch("/api/movies/search-events", {
    method: "POST",
    body: JSON.stringify({ movie_id: movieId }),
  });
}

export async function getWatchlist(): Promise<{ items: WatchlistItem[] }> {
  return apiFetch("/api/movies/watchlist");
}

export async function getWatchlistStatus(
  movieId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/movies/${movieId}/watchlist`);
}

export async function addToWatchlist(
  movieId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/movies/${movieId}/watchlist`, { method: "POST" });
}

export async function removeFromWatchlist(
  movieId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/movies/${movieId}/watchlist`, { method: "DELETE" });
}

export interface MovieRatingResponse {
  avg_rating: number | null;
  rating_count: number;
  user_rating: number | null;
}

export async function getMovieRating(
  movieId: string
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/movies/${movieId}/rating`);
}

export async function rateMovie(
  movieId: string,
  rating: number
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/movies/${movieId}/rating`, {
    method: "PUT",
    body: JSON.stringify({ rating }),
  });
}

export async function removeMovieRating(
  movieId: string
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/movies/${movieId}/rating`, { method: "DELETE" });
}

export async function getRatedMovies(): Promise<{ items: RatedMovieItem[] }> {
  return apiFetch("/api/movies/ratings");
}

export async function getWatchProgress(
  movieId: string
): Promise<{ progress: WatchProgress | null }> {
  return apiFetch(`/api/watch/${movieId}/progress`);
}

export async function saveWatchProgress(
  movieId: string,
  progressSeconds: number
): Promise<{ progress: WatchProgress }> {
  return apiFetch(`/api/watch/${movieId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ progress_seconds: progressSeconds }),
  });
}

async function adminFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export async function getAdminMovies(): Promise<{ movies: AdminMovie[] }> {
  return adminFetch("/api/admin/movies");
}

export async function getAdminMovie(
  id: string
): Promise<{ movie: AdminMovie }> {
  return adminFetch(`/api/admin/movies/${id}`);
}

export async function getAdminGenres(): Promise<{ genres: Genre[] }> {
  return adminFetch("/api/admin/genres");
}

export async function createAdminMovie(
  formData: FormData
): Promise<{ movie: AdminMovie }> {
  return adminFetch("/api/admin/movies", {
    method: "POST",
    body: formData,
  });
}

export async function updateAdminMovie(
  id: string,
  formData: FormData
): Promise<{ movie: AdminMovie }> {
  return adminFetch(`/api/admin/movies/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteAdminMovie(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/movies/${id}`, { method: "DELETE" });
}

export async function getAdminStats(): Promise<{
  movieCount: number;
  genreCount: number;
  pendingReportCount: number;
}> {
  const [{ movies }, { genres }, reportsRes] = await Promise.all([
    getAdminMovies(),
    getAdminGenres(),
    adminFetch<{ reports: CommentReportDetail[] }>("/api/admin/reports").catch(
      () => ({ reports: [] })
    ),
  ]);
  return {
    movieCount: movies.length,
    genreCount: genres.length,
    pendingReportCount: reportsRes.reports.length,
  };
}

export async function getAdminReports(): Promise<{
  reports: CommentReportDetail[];
}> {
  return adminFetch("/api/admin/reports");
}

export async function resolveReport(
  reportId: string,
  action: ReportResolveAction
): Promise<{ ok: true }> {
  return adminFetch(`/api/admin/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export async function getSeriesWatchlist(): Promise<{
  items: SeriesWatchlistItem[];
}> {
  return apiFetch("/api/series/watchlist");
}

export async function getSeriesList(): Promise<{ series: Series[] }> {
  return apiFetch("/api/series");
}

export async function getSeries(id: string): Promise<{ series: SeriesDetail }> {
  return apiFetch(`/api/series/${id}`);
}

export async function getSeriesComments(
  seriesId: string
): Promise<{ comments: SeriesComment[] }> {
  return apiFetch(`/api/series/${seriesId}/comments`);
}

export async function postSeriesComment(
  seriesId: string,
  body: string,
  parentId?: string | null,
  media?: {
    type: "gif" | "sticker";
    url: string;
    previewUrl?: string;
    giphyId?: string;
    label?: string;
  } | null
): Promise<{ comment: SeriesComment }> {
  return apiFetch(`/api/series/${seriesId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body,
      parent_id: parentId ?? null,
      media_type: media?.type ?? null,
      media_url: media?.url ?? null,
      media_preview_url: media?.previewUrl ?? null,
      media_giphy_id: media?.giphyId ?? null,
      media_label: media?.label ?? null,
    }),
  });
}

export async function getSeriesWatchlistStatus(
  seriesId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/series/${seriesId}/watchlist`);
}

export async function addSeriesToWatchlist(
  seriesId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/series/${seriesId}/watchlist`, { method: "POST" });
}

export async function removeSeriesFromWatchlist(
  seriesId: string
): Promise<{ inWatchlist: boolean }> {
  return apiFetch(`/api/series/${seriesId}/watchlist`, { method: "DELETE" });
}

export async function getSeriesRating(
  seriesId: string
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/series/${seriesId}/rating`);
}

export async function rateSeries(
  seriesId: string,
  rating: number
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/series/${seriesId}/rating`, {
    method: "PUT",
    body: JSON.stringify({ rating }),
  });
}

export async function removeSeriesRating(
  seriesId: string
): Promise<MovieRatingResponse> {
  return apiFetch(`/api/series/${seriesId}/rating`, { method: "DELETE" });
}

export async function getEpisodeWatchProgress(
  episodeId: string
): Promise<{ progress: EpisodeWatchProgress | null }> {
  return apiFetch(`/api/watch/episode/${episodeId}/progress`);
}

export async function saveEpisodeWatchProgress(
  episodeId: string,
  progressSeconds: number
): Promise<{ progress: EpisodeWatchProgress }> {
  return apiFetch(`/api/watch/episode/${episodeId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ progress_seconds: progressSeconds }),
  });
}

export async function getAdminSeries(): Promise<{ series: AdminSeries[] }> {
  return adminFetch("/api/admin/series");
}

export async function getAdminSeriesById(
  id: string
): Promise<{ series: SeriesDetail }> {
  return adminFetch(`/api/admin/series/${id}`);
}

export async function createAdminSeries(
  formData: FormData
): Promise<{ series: AdminSeries }> {
  return adminFetch("/api/admin/series", {
    method: "POST",
    body: formData,
  });
}

export async function updateAdminSeries(
  id: string,
  formData: FormData
): Promise<{ series: AdminSeries }> {
  return adminFetch(`/api/admin/series/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteAdminSeries(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/series/${id}`, { method: "DELETE" });
}

export async function createAdminEpisode(
  seriesId: string,
  formData: FormData
): Promise<{ episode: Episode }> {
  return adminFetch(`/api/admin/series/${seriesId}/episodes`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteAdminEpisode(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/episodes/${id}`, { method: "DELETE" });
}

export async function getPosters(): Promise<{ posters: PosterWithStats[] }> {
  return apiFetch("/api/posters");
}

export async function likePoster(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/posters/${id}/like`, { method: "POST" });
}

export async function unlikePoster(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/posters/${id}/like`, { method: "DELETE" });
}

export async function getLikedPosters(): Promise<{
  posters: PosterWithStats[];
}> {
  return apiFetch("/api/posters/likes");
}

export async function getAdminPosters(): Promise<{ posters: AdminPoster[] }> {
  return adminFetch("/api/admin/posters");
}

export async function getAdminPoster(
  id: string
): Promise<{ poster: AdminPoster }> {
  return adminFetch(`/api/admin/posters/${id}`);
}

export async function createAdminPoster(
  formData: FormData
): Promise<{ poster: AdminPoster }> {
  return adminFetch("/api/admin/posters", {
    method: "POST",
    body: formData,
  });
}

export async function updateAdminPoster(
  id: string,
  formData: FormData
): Promise<{ poster: AdminPoster }> {
  return adminFetch(`/api/admin/posters/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteAdminPoster(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/posters/${id}`, { method: "DELETE" });
}

export async function getSongs(params?: {
  categoryId?: string;
  q?: string;
}): Promise<{ songs: SongWithStats[] }> {
  const search = new URLSearchParams();
  if (params?.categoryId) search.set("category_id", params.categoryId);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return apiFetch(`/api/songs${qs ? `?${qs}` : ""}`);
}

export async function getSong(id: string): Promise<{ song: SongWithStats }> {
  return apiFetch(`/api/songs/${id}`);
}

export async function getSongCategories(): Promise<{
  categories: SongCategory[];
}> {
  return apiFetch("/api/songs/categories");
}

export async function getSongCategory(
  id: string
): Promise<{ category: SongCategory; songs: SongWithStats[] }> {
  return apiFetch(`/api/songs/categories/${id}`);
}

export async function getSongBlocks(): Promise<{
  blocks: SongBlockWithSongs[];
}> {
  return apiFetch("/api/songs/blocks");
}

export async function getSongBlock(
  id: string
): Promise<{ block: SongBlockWithSongs }> {
  return apiFetch(`/api/songs/blocks/${id}`);
}

export async function likeSong(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/songs/${id}/like`, { method: "POST" });
}

export async function unlikeSong(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/songs/${id}/like`, { method: "DELETE" });
}

export async function likeSongBlock(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/songs/blocks/${id}/like`, { method: "POST" });
}

export async function unlikeSongBlock(
  id: string
): Promise<{ like_count: number; liked_by_me: boolean }> {
  return apiFetch(`/api/songs/blocks/${id}/like`, { method: "DELETE" });
}

export async function getLikedSongs(): Promise<{
  songs: SongWithStats[];
  blocks: SongBlockWithSongs[];
}> {
  return apiFetch("/api/songs/likes");
}

export async function getPlaylists(): Promise<{ playlists: Playlist[] }> {
  return apiFetch("/api/playlists");
}

export async function createPlaylist(input: {
  name: string;
  description?: string | null;
}): Promise<{ playlist: Playlist }> {
  return apiFetch("/api/playlists", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPlaylist(
  id: string
): Promise<{ playlist: PlaylistWithSongs }> {
  return apiFetch(`/api/playlists/${id}`);
}

export async function updatePlaylist(
  id: string,
  input: { name: string; description?: string | null }
): Promise<{ playlist: Playlist }> {
  return apiFetch(`/api/playlists/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePlaylist(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/playlists/${id}`, { method: "DELETE" });
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/playlists/${playlistId}/songs`, {
    method: "POST",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/playlists/${playlistId}/songs`, {
    method: "DELETE",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function getAdminSongs(): Promise<{ songs: AdminSong[] }> {
  return adminFetch("/api/admin/songs");
}

export async function getAdminSong(id: string): Promise<{ song: AdminSong }> {
  return adminFetch(`/api/admin/songs/${id}`);
}

export async function createAdminSong(
  formData: FormData
): Promise<{ song: AdminSong }> {
  return adminFetch("/api/admin/songs", { method: "POST", body: formData });
}

export async function updateAdminSong(
  id: string,
  formData: FormData
): Promise<{ song: AdminSong }> {
  return adminFetch(`/api/admin/songs/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteAdminSong(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/songs/${id}`, { method: "DELETE" });
}

export async function getAdminSongCategories(): Promise<{
  categories: SongCategory[];
}> {
  return adminFetch("/api/admin/song-categories");
}

export async function createAdminSongCategory(input: {
  name: string;
  slug?: string;
  description?: string | null;
}): Promise<{ category: SongCategory }> {
  return adminFetch("/api/admin/song-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateAdminSongCategory(
  id: string,
  input: { name: string; slug?: string; description?: string | null }
): Promise<{ category: SongCategory }> {
  return adminFetch(`/api/admin/song-categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteAdminSongCategory(
  id: string
): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/song-categories/${id}`, { method: "DELETE" });
}

export async function getAdminSongBlocks(): Promise<{
  blocks: AdminSongBlock[];
}> {
  return adminFetch("/api/admin/song-blocks");
}

export async function createAdminSongBlock(input: {
  title: string;
  description?: string | null;
  layout: "row" | "grid";
  sort_order?: number;
  song_ids: string[];
}): Promise<{ block: SongBlockWithSongs }> {
  return adminFetch("/api/admin/song-blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateAdminSongBlock(
  id: string,
  input: {
    title: string;
    description?: string | null;
    layout: "row" | "grid";
    sort_order?: number;
    song_ids: string[];
  }
): Promise<{ block: SongBlockWithSongs }> {
  return adminFetch(`/api/admin/song-blocks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteAdminSongBlock(id: string): Promise<{ ok: boolean }> {
  return adminFetch(`/api/admin/song-blocks/${id}`, { method: "DELETE" });
}
