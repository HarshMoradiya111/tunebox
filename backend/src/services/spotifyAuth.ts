import config from "../config";

interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: SpotifyToken | null = null;

/**
 * Obtain a Spotify access token using the Client Credentials flow.
 * Tokens are cached in memory and refreshed automatically when expired.
 */
export async function getSpotifyAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = config.spotify;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment variables"
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Spotify token request failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  console.log("✅ Spotify access token obtained / refreshed");
  return cachedToken.accessToken;
}

/**
 * Helper to make authenticated GET requests to the Spotify Web API.
 */
export async function spotifyFetch<T>(endpoint: string): Promise<T> {
  const token = await getSpotifyAccessToken();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.spotify.com/v1${endpoint}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Spotify API error (${response.status}) for ${endpoint}: ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}
