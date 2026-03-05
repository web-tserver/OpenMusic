const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const youtubedl = require('yt-dlp-exec');

const app = express();
const PORT = 3000;

// ========== Configuration ==========
const DOWNLOAD_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Clean up old temp files every 5 minutes
setInterval(() => {
    const now = Date.now();
    fs.readdir(DOWNLOAD_DIR, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(DOWNLOAD_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                // Delete files older than 10 minutes
                if (now - stats.mtimeMs > 10 * 60 * 1000) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(`Failed to delete ${filePath}:`, err);
                        else console.log(`Cleaned up old file: ${file}`);
                    });
                }
            });
        }
    });
}, 5 * 60 * 1000); // every 5 minutes

// ========== Middleware ==========
app.use(express.json()); // to parse JSON bodies
app.use(express.static('public')); // serve static files (HTML, audio, etc.)
app.use('/downloads', express.static(DOWNLOAD_DIR)); // serve temp audio files

// ========== API Endpoints ==========

// 1. Get static song list (you can replace this with a database later)
app.get('/api/songs', (req, res) => {
    const songs = [
        {
            id: 1,
            title: 'Song One',
            artist: 'Artist A',
            cover: 'https://via.placeholder.com/180/1db954/ffffff?text=Cover+1',
            audioUrl: '/audio/song1.mp3' // make sure file exists in public/audio/
        },
        {
            id: 2,
            title: 'Song Two',
            artist: 'Artist B',
            cover: 'https://via.placeholder.com/180/1db954/ffffff?text=Cover+2',
            audioUrl: '/audio/song2.mp3'
        }
    ];
    res.json(songs);
});

// 2. Fetch audio from YouTube (or any supported site)
app.post('/api/fetch-audio', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Fetching audio from: ${url}`);

        // Generate a unique filename
        const fileId = crypto.randomBytes(8).toString('hex');
        const outputTemplate = path.join(DOWNLOAD_DIR, `${fileId}.%(ext)s`);

        // Use yt-dlp to download the best audio as mp3
        const output = await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputTemplate,
            noCheckCertificates: true,
            preferFreeFormats: true,
            // If you have a cookies.txt file (to avoid YouTube blocking), uncomment:
            // cookies: path.join(__dirname, 'cookies.txt')
        });

        // Find the actual file that was created
        const files = fs.readdirSync(DOWNLOAD_DIR);
        const downloadedFile = files.find(f => f.startsWith(fileId));
        
        if (!downloadedFile) {
            throw new Error('File was not created successfully');
        }

        const filePath = path.join(DOWNLOAD_DIR, downloadedFile);
        const stat = fs.statSync(filePath);

        // Respond with metadata and the download URL
        res.json({
            success: true,
            fileId: fileId,
            title: output.title || 'Fetched Audio',
            uploader: output.uploader || 'Unknown',
            duration: output.duration,
            thumbnail: output.thumbnail,
            download_url: `/downloads/${downloadedFile}`,
            expires_in: '10 minutes'
        });

    } catch (error) {
        console.error('Error fetching audio:', error);
        res.status(500).json({ error: error.stderr || error.message });
    }
});

// ========== Start Server ==========
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});