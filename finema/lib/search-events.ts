export const OPEN_SEARCH_EVENT = "finema:open-search";

export function openSearchModal(): void {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}
