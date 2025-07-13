// src/index.ts
import express from "express";
import dotenv from "dotenv";
import spotifyRoutes from "./routes/spotifyRoute";
import authRoutes from "./routes/authRoutes";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Mount all Spotify-related routes at /spotify
app.use("/spotify", spotifyRoutes);

app.use("/auth", authRoutes);

// Root test route
app.get("/", (_req, res) => {
  res.send("Spotify API is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
