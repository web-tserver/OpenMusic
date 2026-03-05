# 🎵 Spotify-like Music Player with Discord Bot Search

A web app where you can search for any song (just type the name) and it will fetch and play audio from YouTube – like a Discord music bot.

## 🚀 Deploy for FREE on Render

1. Push these files to a GitHub repository.
2. Go to [render.com](https://render.com) and sign up with GitHub.
3. Click **New +** → **Web Service**.
4. Connect your repository.
5. Use these settings:
   - **Name:** `your-app-name`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
6. Click **Create Web Service**.
7. Once deployed, your app is live at `https://your-app-name.onrender.com`.

## ⚙️ Required System Dependency

This app needs **FFmpeg** installed on the server. Render doesn't include it by default, but you can add it with a **build script**:

Create a file called `render-build.sh` in your project root:

```bash
#!/usr/bin/env bash
apt-get update && apt-get install -y ffmpeg
