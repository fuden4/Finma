export const INTRO_STORAGE_KEY = "finema_intro_seen";

export function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(INTRO_STORAGE_KEY) === "1";
}

export function markIntroSeen(): void {
  localStorage.setItem(INTRO_STORAGE_KEY, "1");
}
