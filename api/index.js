const express = require('express');
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// /yt endpoint to return JSON with streaming links
app.get('/yt', async (req, res) => {
  const { link } = req.query;
  if (!link || !ytdl.validateURL(link)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(link);
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, '');
    const author = info.videoDetails.author.name;

    // Generate streaming URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      author,
      video: {
        high: `${baseUrl}/video?link=${encodeURIComponent(link)}&quality=high&title=${encodeURIComponent(title)}`,
        low: `${baseUrl}/video?link=${encodeURIComponent(link)}&quality=low&title=${encodeURIComponent(title)}`
      },
      audio: {
        high: `${baseUrl}/audio?link=${encodeURIComponent(link)}&quality=high&title=${encodeURIComponent(title)}`,
        low: `${baseUrl}/audio?link=${encodeURIComponent(link)}&quality=low&title=${encodeURIComponent(title)}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// Audio streaming endpoint
app.get('/audio', async (req, res) => {
  const { link, quality = 'high', title = 'audio' } = req.query;
  if (!link || !ytdl.validateURL(link)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const audioQuality = quality === 'low' ? 'lowestaudio' : 'highestaudio';
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    ytdl(link, { filter: 'audioonly', quality: audioQuality })
      .pipe(res)
      .on('error', (err) => {
        res.status(500).send('Audio streaming failed');
      });
  } catch (err) {
    res.status(500).send('Failed to fetch video info');
  }
});

// Video streaming endpoint
app.get('/video', async (req, res) => {
  const { link, quality = 'high', title = 'video' } = req.query;
  if (!link || !ytdl.validateURL(link)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const videoQuality = quality === 'low' ? 'lowest' : 'highest';
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    ytdl(link, { filter: 'audioandvideo', quality: videoQuality })
      .pipe(res)
      .on('error', (err) => {
        res.status(500).send('Video streaming failed');
      });
  } catch (err) {
    res.status(500).send('Failed to fetch video info');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
