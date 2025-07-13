// src/routes/spotifyRoutes.ts
import { Router, Request, Response } from "express";
import { getAccessToken } from "../utils/spotifyClient";

const router = Router();

/**
 * GET /spotify
 * Returns now playing song and top 10 tracks
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const spotifyApi = await getAccessToken();

    const [nowPlayingRes, topTracksRes] = await Promise.all([
      spotifyApi.getMyCurrentPlayingTrack(),
      spotifyApi.getMyTopTracks({ limit: 10 }),
    ]);

    const nowPlaying = nowPlayingRes.body?.item ?? null;
    const topTracks = topTracksRes.body.items.map((track) => ({
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      uri: track.uri,
    }));

    res.json({ nowPlaying, topTracks });
  } catch (err) {
    console.error("Error fetching Spotify data:", err);
    res.status(500).json({ error: "Failed to fetch Spotify data" });
  }
});

router.post("/play", async (req: Request, res: Response) => {
  const { uri } = req.body;

  if (!uri) {
    return res.status(400).json({ error: "Track URI is required" });
  }

  try {
    const spotifyApi = await getAccessToken();
    await spotifyApi.play({ uris: [uri] });
    return res.json({ status: "Playing track", uri });
  } catch (error) {
    const err = error as any; //explicitly cast to any
    console.error("Error starting playback:", err);

    if (
      err?.body?.error?.reason === "NO_ACTIVE_DEVICE" ||
      err?.body?.error?.message?.includes("NO_ACTIVE_DEVICE")
    ) {
      return res.status(400).json({
        error:
          "No active Spotify device. Open Spotify on your phone or computer and play a song once.",
      });
    }

    return res.status(500).json({ error: "Failed to start playback" });
  }
});

router.post("/pause", async (_req: Request, res: Response) => {
  try {
    const spotifyApi = await getAccessToken();
    await spotifyApi.pause();
    res.json({ status: "Playback paused" });
  } catch (err) {
    console.error("Error pausing playback:", err);
    res.status(500).json({ error: "Failed to pause playback" });
  }
});

export default router;
