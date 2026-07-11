import { slugifyTitle } from "@/lib/slug";

type Sluggable = {
  slug?: string | null;
  title: string;
  id: string;
};

export function moviePath(item: Sluggable): string {
  const slug = item.slug ?? slugifyTitle(item.title);
  return slug ? `/movies/${slug}` : `/movies/${item.id}`;
}

export function songPath(item: Sluggable): string {
  const slug = item.slug ?? slugifyTitle(item.title);
  return slug ? `/songs/${slug}` : `/songs/${item.id}`;
}
