// src/spotifyClient.ts
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN!);

export async function getAccessToken(): Promise<SpotifyWebApi> {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);
    return spotifyApi;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw new Error("Spotify authentication failed");
  }
}
