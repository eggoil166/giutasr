const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chart generation function
// Chart generation function with real AI analysis
async function generateChartFromMP3(filePath, filename) {
  try {
    const prompt = `Analyze this MP3 file "${filename}" and generate a complete .chart file
    for the provided audio, formatted for rhythm games like Clone Hero. The entire output must be in a
    single code block.

    Please provide:
    - Metadata & Timing: Populate the [Song] section with accurate data, setting Charter = "Gemini"
    and using the correct MusicStream filename. Determine the correct BPM for [SyncTrack] and add section
    markers (intro, chorus, etc.) in [Events].

    Charting Logic:
    -ExpertSingle: Chart the song's main melody (vocal or lead instrument).
    -ExpertBass: Chart the song's bassline.
    -Difficulties: Create progressively simpler, playable versions for Hard, Medium, and Easy.
    -Drums: All drum tracks can be left empty.`;


    const result = await genAI.generateContent(prompt);
    const response = await result.response;
    const aiAnalysis = response.text();
    
    console.log('AI Analysis for', filename, ':', aiAnalysis);
    
    // Parse AI response and create enhanced chart data
    const chartData = {
      song: {
        name: filename.replace('.mp3', ''),
        artist: extractArtistFromAnalysis(aiAnalysis) || "Unknown Artist",
        album: "Unknown Album",
        year: new Date().getFullYear(),
        charter: "AI Generated with Gemini Pro",
        genre: extractGenreFromAnalysis(aiAnalysis) || "Rock",
        preview_start_time: 0,
        song_length: extractSongLengthFromAnalysis(aiAnalysis) || 180,
        difficulty: extractDifficultyFromAnalysis(aiAnalysis) || 3,
        song_id: Date.now()
      },
      // ... rest of the chart structure
      ai_analysis: aiAnalysis // Include the raw AI analysis
    };

    return chartData;
  } catch (error) {
    console.error('Error generating chart:', error);
    throw error;
  }
}

// Generate sample notes for the chart
function generateSampleNotes() {
  const notes = [];
  const startTime = 0;
  const endTime = 180000; // 3 minutes in milliseconds
  const noteInterval = 500; // 500ms between notes
  
  for (let time = startTime; time < endTime; time += noteInterval) {
    // Generate random notes (0-4 frets, 0-5 strings)
    const fret = Math.floor(Math.random() * 5);
    const string = Math.floor(Math.random() * 6);
    
    notes.push({
      time: time,
      fret: fret,
      string: string,
      length: 400,
      hopo: false,
      hammer_on: false,
      pull_off: false,
      tap: false,
      bend: 0,
      slide: 0,
      harmonic: false,
      palm_mute: false,
      tremolo: false,
      accent: false
    });
  }
  
  return notes;
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Guitar Super Power Backend API' });
});

// Upload MP3 and generate chart
app.post('/api/upload-mp3', upload.single('mp3'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No MP3 file uploaded' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const filePath = req.file.path;
    const filename = req.file.originalname;

    console.log(`Processing MP3 file: ${filename}`);

    // Generate chart data using Gemini AI
    const chartData = await generateChartFromMP3(filePath, filename);

    // Save chart data to file
    const chartFilename = filename.replace('.mp3', '.chart');
    const chartPath = path.join(uploadsDir, chartFilename);

    // Save as .chart file instead of JSON
    await fs.writeFile(chartPath, aiAnalysis, 'utf8');
    
    await fs.writeJson(chartPath, chartData, { spaces: 2 });

    // Clean up the MP3 file (optional - you might want to keep it)
    // await fs.remove(filePath);

    res.json({
      success: true,
      message: 'Chart generated successfully with Clone Hero format',
      chartFile: chartFilename,
      chartContent: aiAnalysis
    });

  } catch (error) {
    console.error('Error processing MP3:', error);
    res.status(500).json({ 
      error: 'Failed to process MP3 file',
      details: error.message 
    });
  }
});

// Get generated charts
app.get('/api/charts', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const chartFiles = files.filter(file => file.endsWith('.chart'));
    
    const charts = await Promise.all(
      chartFiles.map(async (file) => {
        const chartPath = path.join(uploadsDir, file);
        const chartData = await fs.readJson(chartPath);
        return {
          filename: file,
          songName: chartData.song.name,
          artist: chartData.song.artist,
          difficulty: chartData.song.difficulty,
          length: chartData.song.song_length
        };
      })
    );

    res.json(charts);
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// Download chart file
app.get('/api/charts/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const chartPath = path.join(uploadsDir, filename);
    
    if (!await fs.pathExists(chartPath)) {
      return res.status(404).json({ error: 'Chart file not found' });
    }

    res.download(chartPath);
  } catch (error) {
    console.error('Error downloading chart:', error);
    res.status(500).json({ error: 'Failed to download chart' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle gesture data from Python script
  socket.on('gesture-data', (data) => {
    // Broadcast gesture data to all connected clients
    socket.broadcast.emit('gesture-update', data);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload-mp3`);
});
