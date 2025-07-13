// src/routes/authRoutes.ts
import { Router, Request, Response } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import querystring from "querystring";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-top-read",
];

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://127.0.0.1:3000/auth/callback"; // Changed to 127.0.0.1

const spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri,
});

// Generate random string for state parameter
const generateRandomString = (length: number): string => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Step 1: Redirect user to Spotify login (with manual URL for testing)
router.get("/login", (_req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope = scopes.join(" ");

  const authorizeURL =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });

  console.log("Generated authorization URL:", authorizeURL);
  console.log("Redirect URI configured:", redirect_uri);
  console.log("Client ID:", client_id);

  // Show the URL instead of redirecting automatically for debugging
  res.send(`
    <h2>🔍 Debug OAuth Flow</h2>
    <p><strong>Click this link manually:</strong></p>
    <a href="${authorizeURL}" target="_blank">${authorizeURL}</a>
    <br><br>
    <p><strong>After clicking the link above:</strong></p>
    <ol>
      <li>You'll be taken to Spotify's authorization page</li>
      <li>Log in and authorize the app</li>
      <li>You should be redirected back to: ${redirect_uri}</li>
      <li>Check what happens in that redirect</li>
    </ol>
    <br>
    <p><strong>Debug Info:</strong></p>
    <ul>
      <li>Client ID: ${client_id}</li>
      <li>Redirect URI: ${redirect_uri}</li>
      <li>State: ${state}</li>
    </ul>
    <br>
    <p><strong>If you want automatic redirect:</strong> <a href="/auth/login-auto">Click here</a></p>
  `);
});

// Automatic redirect version
router.get("/login-auto", (_req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope = scopes.join(" ");

  const authorizeURL =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });

  console.log("Auto-redirecting to:", authorizeURL);
  res.redirect(authorizeURL);
});

// Step 2: Handle callback from Spotify with authorization code
router.get("/callback", async (req: Request, res: Response) => {
  console.log("Callback received with query params:", req.query);

  const code = req.query.code as string;
  const error = req.query.error as string;
  const state = req.query.state as string;

  // Check if Spotify returned an error
  if (error) {
    console.error("Spotify OAuth error:", error);
    return res.status(400).send(`
      <h2>❌ Authentication Error</h2>
      <p>Error: ${error}</p>
      <p>Description: ${
        req.query.error_description || "No description provided"
      }</p>
      <a href="/auth/login">Try again</a>
    `);
  }

  // Check if code is missing
  if (!code) {
    console.error("No authorization code received");
    return res.status(400).send(`
      <h2>❌ Missing Authorization Code</h2>
      <p>No authorization code was received from Spotify.</p>
      <p>Query params received: ${JSON.stringify(req.query)}</p>
      <a href="/auth/login">Try again</a>
    `);
  }

  try {
    console.log("Exchanging code for tokens...");
    const data = await spotifyApi.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    console.log("Successfully received tokens");

    res.send(`
      <h2>🎉 Success! Copy your refresh token below:</h2>
      <textarea rows="10" cols="80">${refreshToken}</textarea>
      <p>Now save this in your <code>.env</code> file as <strong>SPOTIFY_REFRESH_TOKEN</strong>.</p>
      <br>
      <h3>Access Token (for testing):</h3>
      <textarea rows="5" cols="80">${accessToken}</textarea>
    `);
  } catch (err) {
    console.error("Error exchanging code for tokens:", err);

    // More detailed error response
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    res.status(500).send(`
      <h2>❌ Token Exchange Failed</h2>
      <p>Error: ${errorMessage}</p>
      <p>Make sure your Spotify app settings are correct:</p>
      <ul>
        <li>Client ID and Client Secret are set in .env</li>
        <li>Redirect URI matches exactly: http://localhost:3000/auth/callback</li>
        <li>App is not in development mode restrictions</li>
      </ul>
      <a href="/auth/login">Try again</a>
    `);
  }
});

// Refresh token endpoint (based on Spotify docs)
router.get("/refresh_token", function (req: Request, res: Response) {
  const refresh_token = req.query.refresh_token as string;

  if (!refresh_token) {
    return res.status(400).send("Missing refresh_token parameter");
  }

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  // Note: You'll need to install 'request' package or use fetch/axios
  // This is just the structure from the docs
  res.send(`
    <h2>🔄 Refresh Token Endpoint</h2>
    <p>This endpoint structure is ready, but you need to:</p>
    <ol>
      <li>Install a HTTP client library (request, axios, or use fetch)</li>
      <li>Implement the actual token refresh logic</li>
    </ol>
    <p>Refresh token received: ${refresh_token}</p>
    <p>Auth header would be: Basic ${Buffer.from(
      client_id + ":" + client_secret
    ).toString("base64")}</p>
  `);
});

// Test route to verify server setup
router.get("/test", (req: Request, res: Response) => {
  res.send(`
    <h2>🔧 Server Test</h2>
    <p>Server is running correctly!</p>
    <p>Current URL: ${req.protocol}://${req.get("host")}${req.originalUrl}</p>
    <p>Expected callback URL: http://127.0.0.1:3000/auth/callback</p>
    <p>Environment variables check:</p>
    <ul>
      <li>SPOTIFY_CLIENT_ID: ${client_id ? "✅ Set" : "❌ Missing"}</li>
      <li>SPOTIFY_CLIENT_SECRET: ${client_secret ? "✅ Set" : "❌ Missing"}</li>
    </ul>
    <p><a href="/auth/login">Start OAuth Flow (Manual)</a></p>
    <p><a href="/auth/login-auto">Start OAuth Flow (Auto)</a></p>
  `);
});

export default router;
