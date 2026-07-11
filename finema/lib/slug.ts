export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function uniqueSlug(baseTitle: string, taken: Set<string>): string {
  const root = slugifyTitle(baseTitle) || "item";
  let candidate = root;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  taken.add(candidate);
  return candidate;
}
