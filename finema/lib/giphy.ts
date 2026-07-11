export interface GifResult {
  id: string;
  previewUrl: string;
  url: string;
}

export class GiphyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GiphyConfigError";
  }
}

export class GiphyRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "GiphyRequestError";
  }
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
  meta?: {
    status?: number;
    msg?: string;
  };
}

function mapGif(gif: GiphyGif): GifResult {
  return {
    id: gif.id,
    previewUrl: gif.images.fixed_height_small.url,
    url: gif.images.fixed_height.url,
  };
}

function getApiKey(): string {
  const key = process.env.GIPHY_API_KEY?.trim();
  if (!key || key === "your-giphy-api-key-here") {
    throw new GiphyConfigError("GIPHY_API_KEY is not configured");
  }
  return key;
}

async function fetchGiphy(
  path: string,
  params: Record<string, string>
): Promise<GifResult[]> {
  const searchParams = new URLSearchParams({
    api_key: getApiKey(),
    limit: "20",
    rating: "pg-13",
    ...params,
  });

  let response: Response;
  try {
    response = await fetch(
      `https://api.giphy.com/v1/gifs/${path}?${searchParams}`
    );
  } catch {
    throw new GiphyRequestError(
      "Could not reach Giphy. Check server internet access.",
      502
    );
  }

  const data = (await response.json().catch(() => null)) as GiphyResponse | null;

  if (!response.ok) {
    const message =
      data?.meta?.msg?.trim() ||
      (response.status === 401 || response.status === 403
        ? "Invalid GIPHY_API_KEY"
        : "Failed to fetch GIFs from Giphy");
    throw new GiphyRequestError(message, response.status);
  }

  if (!data?.data) {
    throw new GiphyRequestError("Unexpected response from Giphy", 502);
  }

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
