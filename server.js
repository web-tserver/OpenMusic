const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const youtubedl = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

// Temporary download folder
const DOWNLOAD_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Clean up old temp files every 10 minutes
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
}, 10 * 60 * 1000);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/downloads', express.static(DOWNLOAD_DIR));

// Static song list (you can replace with a database later)
app.get('/api/songs', (req, res) => {
    const songs = [
        {
            id: 1,
            title: 'Song One',
            artist: 'Artist A',
            cover: 'https://via.placeholder.com/180/1db954/ffffff?text=Cover+1',
            audioUrl: '/audio/song1.mp3'
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

// Fetch audio from YouTube (or any supported site)
app.post('/api/fetch-audio', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Fetching audio from: ${url}`);

        const fileId = crypto.randomBytes(8).toString('hex');
        const outputTemplate = path.join(DOWNLOAD_DIR, `${fileId}.%(ext)s`);

        const output = await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputTemplate,
            noCheckCertificates: true,
            preferFreeFormats: true,
            // If you have a cookies.txt file (to avoid YouTube blocking), uncomment:
            // cookies: path.join(__dirname, 'cookies.txt')
        });

        const files = fs.readdirSync(DOWNLOAD_DIR);
        const downloadedFile = files.find(f => f.startsWith(fileId));
        
        if (!downloadedFile) {
            throw new Error('File was not created successfully');
        }

        const filePath = path.join(DOWNLOAD_DIR, downloadedFile);
        const stat = fs.statSync(filePath);

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});