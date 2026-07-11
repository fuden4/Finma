export interface GifResult {
  id: string;
  previewUrl: string;
  url: string;
}

interface GiphyImage {
  url: string;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_height_small: GiphyImage;
    fixed_height: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyGif[];
}

function mapGif(gif: GiphyGif): GifResult {
  return {
    id: gif.id,
    previewUrl: gif.images.fixed_height_small.url,
    url: gif.images.fixed_height.url,
  };
}

function getApiKey(): string {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    throw new Error("GIPHY_API_KEY is not configured");
  }
  return key;
}

async function fetchGiphy(path: string, params: Record<string, string>): Promise<GifResult[]> {
  const searchParams = new URLSearchParams({
    api_key: getApiKey(),
    limit: "20",
    rating: "pg-13",
    ...params,
  });

  const response = await fetch(`https://api.giphy.com/v1/gifs/${path}?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch GIFs from Giphy");
  }

  const data = (await response.json()) as GiphyResponse;
  return data.data.map(mapGif);
}

export async function searchGifs(query: string, offset = 0): Promise<GifResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return fetchGiphy("trending", { offset: String(offset) });
  }

  return fetchGiphy("search", {
    q: trimmed,
    offset: String(offset),
  });
}
