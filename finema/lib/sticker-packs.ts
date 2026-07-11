export interface Sticker {
  id: string;
  url: string;
  label: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: Sticker[];
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: "reactions",
    name: "Reactions",
    stickers: [
      { id: "thumbs-up", url: "/stickers/reactions/thumbs-up.svg", label: "Thumbs up" },
      { id: "thumbs-down", url: "/stickers/reactions/thumbs-down.svg", label: "Thumbs down" },
      { id: "heart", url: "/stickers/reactions/heart.svg", label: "Heart" },
      { id: "laugh", url: "/stickers/reactions/laugh.svg", label: "Laugh" },
      { id: "wow", url: "/stickers/reactions/wow.svg", label: "Wow" },
      { id: "sad", url: "/stickers/reactions/sad.svg", label: "Sad" },
      { id: "angry", url: "/stickers/reactions/angry.svg", label: "Angry" },
      { id: "clap", url: "/stickers/reactions/clap.svg", label: "Clap" },
      { id: "fire", url: "/stickers/reactions/fire.svg", label: "Fire" },
      { id: "star", url: "/stickers/reactions/star.svg", label: "Star" },
    ],
  },
];

const ALLOWED_STICKER_URLS = new Set(
  STICKER_PACKS.flatMap((pack) => pack.stickers.map((sticker) => sticker.url))
);

export function isAllowedStickerUrl(url: string, userId?: string): boolean {
  if (ALLOWED_STICKER_URLS.has(url)) return true;
  if (userId && isUserUploadedStickerPath(url, userId)) return true;
  return false;
}

export function isUserUploadedStickerPath(url: string, userId: string): boolean {
  const prefixes = [
    `/images/user-stickers/${userId}/`,
    `/api/uploads/user-stickers/${userId}/`,
  ];
  return prefixes.some((prefix) => url.startsWith(prefix));
}
