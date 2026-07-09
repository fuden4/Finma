export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function movieGradient(title: string): string {
  const h = hashString(title) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h}, 60%, 25%) 0%, hsl(${h2}, 50%, 15%) 100%)`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function groupMoviesByGenre<T extends { genres: string[] }>(
  movies: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const movie of movies) {
    for (const genre of movie.genres) {
      const list = map.get(genre) ?? [];
      list.push(movie);
      map.set(genre, list);
    }
  }
  return map;
}
