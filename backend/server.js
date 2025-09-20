const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
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

// Serve the web interface
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper functions to extract information from AI analysis
function extractArtistFromAnalysis(analysis) {
  const artistMatch = analysis.match(/artist[:\s]+([^,\n]+)/i);
  return artistMatch ? artistMatch[1].trim() : null;
}

function extractGenreFromAnalysis(analysis) {
  const genreMatch = analysis.match(/genre[:\s]+([^,\n]+)/i);
  return genreMatch ? genreMatch[1].trim() : null;
}

function extractBPMFromAnalysis(analysis) {
  const bpmMatch = analysis.match(/bpm[:\s]+(\d+)/i) || analysis.match(/tempo[:\s]+(\d+)/i);
  return bpmMatch ? parseInt(bpmMatch[1]) : null;
}

function extractDifficultyFromAnalysis(analysis) {
  const difficultyMatch = analysis.match(/difficulty[:\s]+(\d+)/i);
  return difficultyMatch ? parseInt(difficultyMatch[1]) : null;
}

function extractSongLengthFromAnalysis(analysis) {
  const lengthMatch = analysis.match(/length[:\s]+(\d+)/i) || analysis.match(/duration[:\s]+(\d+)/i);
  return lengthMatch ? parseInt(lengthMatch[1]) : null;
}

// Chart generation function that searches for song information automatically
async function generateChartFromSongName(songName) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate chart from song name only - Gemini will search for all information
    const prompt = `You are a Clone Hero chart creator. Search for information about the song "${songName}" and create a complete, playable Clone Hero .chart file.

CRITICAL REQUIREMENTS:
1. Output ONLY the .chart file content - no explanations, comments, or additional text
2. Generate COMPLETE charts with actual notes spanning the ENTIRE song duration
3. NO placeholder comments like "// ... continue pattern" or "// Fill in the gaps"
4. NO incomplete sections - every difficulty level must have actual notes
5. NO shortcuts or "concise" responses - generate the FULL chart even if repetitive
6. NO comments about repetitive nature or keeping response concise
7. Generate EVERY note from start to finish of the song

Search for:
- Artist name
- BPM (beats per minute) 
- Genre
- Song duration/length in seconds
- Song structure with actual timings

Create a complete .chart file with this exact format:

[Song]
Name = ${songName}
Artist = [artist name]
Charter = Gemini
Offset = 0
Resolution = 192
Player2 = bass
Genre = [genre]
MediaType = CD
MusicStream = ${songName}.mp3

[SyncTrack]
{
  B [BPM].000
}

[Events]
{
  E 0 "intro"
  E [actual verse start time in milliseconds] "verse"
  E [actual chorus start time in milliseconds] "chorus"
  E [actual verse 2 start time in milliseconds] "verse"
  E [actual chorus 2 start time in milliseconds] "chorus"
  E [actual bridge start time in milliseconds] "bridge"
  E [actual outro start time in milliseconds] "outro"
}

[ExpertSingle]
{
  N 0 0
  N 192 1
  N 384 2
  N 576 3
  N 768 0
  N 960 1
  N 1152 2
  N 1344 3
  N 1536 0
  N 1536 1
  N 1728 2
  N 1728 3
  N 1920 0
  N 2112 1
  N 2304 2
  N 2496 3
  N 2688 0
  N 2880 1
  N 3072 2
  N 3264 3
  N 3456 0
  N 3456 1
  N 3456 2
  N 3456 3
  N 3648 0
  N 3840 1
  N 4032 2
  N 4224 3
  N 4416 0
  N 4608 1
  N 4800 2
  N 4992 3
  N 5184 0
  N 5376 1
  N 5568 2
  N 5760 3
  N 5952 0
  N 6144 1
  N 6336 2
  N 6528 3
  N 6720 0
  N 6912 1
  N 7104 2
  N 7296 3
  N 7488 0
  N 7680 1
  N 7872 2
  N 8064 3
  N 8256 0
  N 8448 1
  N 8640 2
  N 8832 3
  N 9024 0
  N 9216 1
  N 9408 2
  N 9600 3
  N 9792 0
  N 9984 1
  N 10176 2
  N 10368 3
  N 10560 0
  N 10752 1
  N 10944 2
  N 11136 3
  N 11328 0
  N 11520 1
  N 11712 2
  N 11904 3
  N 12096 0
  N 12288 1
  N 12480 2
  N 12672 3
  N 12864 0
  N 13056 1
  N 13248 2
  N 13440 3
  N 13632 0
  N 13824 1
  N 14016 2
  N 14208 3
  N 14400 0
  N 14592 1
  N 14784 2
  N 14976 3
  N 15168 0
  N 15360 1
  N 15552 2
  N 15744 3
  N 15936 0
  N 16128 1
  N 16320 2
  N 16512 3
  N 16704 0
  N 16896 1
  N 17088 2
  N 17280 3
  N 17472 0
  N 17664 1
  N 17856 2
  N 18048 3
  N 18240 0
  N 18432 1
  N 18624 2
  N 18816 3
  N 19008 0
  N 19200 1
  N 19392 2
  N 19584 3
  N 19776 0
  N 19968 1
  N 20160 2
  N 20352 3
  N 20544 0
  N 20736 1
  N 20928 2
  N 21120 3
  N 21312 0
  N 21504 1
  N 21696 2
  N 21888 3
  N 22080 0
  N 22272 1
  N 22464 2
  N 22656 3
  N 22848 0
  N 23040 1
  N 23232 2
  N 23424 3
  N 23616 0
  N 23808 1
  N 24000 2
  N 24192 3
  N 24384 0
  N 24576 1
  N 24768 2
  N 24960 3
  N 25152 0
  N 25344 1
  N 25536 2
  N 25728 3
  N 25920 0
  N 26112 1
  N 26304 2
  N 26496 3
  N 26688 0
  N 26880 1
  N 27072 2
  N 27264 3
  N 27456 0
  N 27648 1
  N 27840 2
  N 28032 3
  N 28224 0
  N 28416 1
  N 28608 2
  N 28800 3
  N 28992 0
  N 29184 1
  N 29376 2
  N 29568 3
  N 29760 0
  N 29952 1
  N 30144 2
  N 30336 3
  N 30528 0
  N 30720 1
  N 30912 2
  N 31104 3
  N 31296 0
  N 31488 1
  N 31680 2
  N 31872 3
  N 32064 0
  N 32256 1
  N 32448 2
  N 32640 3
  N 32832 0
  N 33024 1
  N 33216 2
  N 33408 3
  N 33600 0
  N 33792 1
  N 33984 2
  N 34176 3
  N 34368 0
  N 34560 1
  N 34752 2
  N 34944 3
  N 35136 0
  N 35328 1
  N 35520 2
  N 35712 3
  N 35904 0
  N 36096 1
  N 36288 2
  N 36480 3
  N 36672 0
  N 36864 1
  N 37056 2
  N 37248 3
  N 37440 0
  N 37632 1
  N 37824 2
  N 38016 3
  N 38208 0
  N 38400 1
  N 38592 2
  N 38784 3
  N 38976 0
  N 39168 1
  N 39360 2
  N 39552 3
  N 39744 0
  N 39936 1
  N 40128 2
  N 40320 3
  N 40512 0
  N 40704 1
  N 40896 2
  N 41088 3
  N 41280 0
  N 41472 1
  N 41664 2
  N 41856 3
  N 42048 0
  N 42240 1
  N 42432 2
  N 42624 3
  N 42816 0
  N 43008 1
  N 43200 2
  N 43392 3
  N 43584 0
  N 43776 1
  N 43968 2
  N 44160 3
  N 44352 0
  N 44544 1
  N 44736 2
  N 44928 3
  N 45120 0
  N 45312 1
  N 45504 2
  N 45696 3
  N 45888 0
  N 46080 1
  N 46272 2
  N 46464 3
  N 46656 0
  N 46848 1
  N 47040 2
  N 47232 3
  N 47424 0
  N 47616 1
  N 47808 2
  N 48000 3
}

[ExpertDoubleBass]
{
  N 0 0
  N 768 1
  N 1536 0
  N 2304 1
  N 3072 0
  N 3840 1
  N 4608 0
  N 5376 1
  N 6144 0
  N 6912 1
  N 7680 0
  N 8448 1
  N 9216 0
  N 9984 1
  N 10752 0
  N 11520 1
  N 12288 0
  N 13056 1
  N 13824 0
  N 14592 1
  N 15360 0
  N 16128 1
  N 16896 0
  N 17664 1
  N 18432 0
  N 19200 1
  N 19968 0
  N 20736 1
  N 21504 0
  N 22272 1
  N 23040 0
  N 23808 1
  N 24576 0
  N 25344 1
  N 26112 0
  N 26880 1
  N 27648 0
  N 28416 1
  N 29184 0
  N 29952 1
  N 30720 0
  N 31488 1
  N 32256 0
  N 33024 1
  N 33792 0
  N 34560 1
  N 35328 0
  N 36096 1
  N 36864 0
  N 37632 1
  N 38400 0
  N 39168 1
  N 39936 0
  N 40704 1
  N 41472 0
  N 42240 1
  N 43008 0
  N 43776 1
  N 44544 0
  N 45312 1
  N 46080 0
  N 46848 1
  N 47616 0
  N 48384 1
}

[HardSingle]
{
  N 0 0
  N 768 1
  N 1536 2
  N 2304 3
  N 3072 0
  N 3840 1
  N 4608 2
  N 5376 3
  N 6144 0
  N 6912 1
  N 7680 2
  N 8448 3
  N 9216 0
  N 9984 1
  N 10752 2
  N 11520 3
  N 12288 0
  N 13056 1
  N 13824 2
  N 14592 3
  N 15360 0
  N 16128 1
  N 16896 2
  N 17664 3
  N 18432 0
  N 19200 1
  N 19968 2
  N 20736 3
  N 21504 0
  N 22272 1
  N 23040 2
  N 23808 3
  N 24576 0
  N 25344 1
  N 26112 2
  N 26880 3
  N 27648 0
  N 28416 1
  N 29184 2
  N 29952 3
  N 30720 0
  N 31488 1
  N 32256 2
  N 33024 3
  N 33792 0
  N 34560 1
  N 35328 2
  N 36096 3
  N 36864 0
  N 37632 1
  N 38400 2
  N 39168 3
  N 39936 0
  N 40704 1
  N 41472 2
  N 42240 3
  N 43008 0
  N 43776 1
  N 44544 2
  N 45312 3
  N 46080 0
  N 46848 1
  N 47616 2
  N 48384 3
}

[MediumSingle]
{
  N 0 0
  N 1536 1
  N 3072 0
  N 4608 1
  N 6144 0
  N 7680 1
  N 9216 0
  N 10752 1
  N 12288 0
  N 13824 1
  N 15360 0
  N 16896 1
  N 18432 0
  N 19968 1
  N 21504 0
  N 23040 1
  N 24576 0
  N 26112 1
  N 27648 0
  N 29184 1
  N 30720 0
  N 32256 1
  N 33792 0
  N 35328 1
  N 36864 0
  N 38400 1
  N 39936 0
  N 41472 1
  N 43008 0
  N 44544 1
  N 46080 0
  N 47616 1
}

[EasySingle]
{
  N 0 0
  N 3072 1
  N 6144 0
  N 9216 1
  N 12288 0
  N 15360 1
  N 18432 0
  N 21504 1
  N 24576 0
  N 27648 1
  N 30720 0
  N 33792 1
  N 36864 0
  N 39936 1
  N 43008 0
  N 46080 1
  N 49152 0
  N 52224 1
}

CRITICAL FORMAT REQUIREMENTS - EXACT Clone Hero Format:
1. [Song] section: Use curly braces { } and quote all string values
   Example: [Song] { Offset = 0, Resolution = 192, Player2 = bass, Difficulty = 0, PreviewStart = 0, PreviewEnd = 0, Genre = "rock", MediaType = "cd", MusicStream = "song.ogg" }
2. [SyncTrack] section: Include TS (time signature) entries and BPM changes
   Example: [SyncTrack] { 0 = TS 4, 0 = B 120000, 1152 = TS 6, 1152 = B 130000 }
3. Note format: Use "tick = N fret length" where length is 0 for normal notes, >0 for sustained notes
   Example: "768 = N 2 0" (normal note), "768 = N 2 192" (sustained note)
4. Generate DENSE charts with notes EVERY 192 ticks (every beat) for the ENTIRE song duration
5. Create realistic guitar patterns that match the song's rhythm and structure
6. NO COMMENTS: Do NOT use ANY comments whatsoever - no "//" or "#" comments at all
7. NO PLACEHOLDERS: Do NOT use phrases like "Continue this pattern", "Example", "Ensure you cover"
8. Generate complete charts for ExpertSingle, HardSingle, MediumSingle, EasySingle`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let chartContent = response.text();
    
    // Clean up any remaining placeholder comments - remove ALL comments
    chartContent = chartContent.replace(/\/\/.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?$/gm, '');
    chartContent = chartContent.replace(/\/\/.*?Continue.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?Example.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?Ensure.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?pattern.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?throughout.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?adapting.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?rhythm.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?sections.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?Start.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?End.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?ACTUAL.*?\n/g, '');
    chartContent = chartContent.replace(/\/\/.*?cover.*?\n/g, '');
    
    // Remove # comments (hash comments)
    chartContent = chartContent.replace(/#.*?\n/g, '');
    chartContent = chartContent.replace(/#.*?$/gm, '');
    chartContent = chartContent.replace(/#.*?Continue.*?\n/g, '');
    chartContent = chartContent.replace(/#.*?Chart data.*?\n/g, '');
    chartContent = chartContent.replace(/#.*?following.*?\n/g, '');
    chartContent = chartContent.replace(/#.*?same rules.*?\n/g, '');
    chartContent = chartContent.replace(/#.*?similar patterns.*?\n/g, '');
    
    // Fix format issues - convert "N tick fret" to "tick = N fret length"
    chartContent = chartContent.replace(/N (\d+) (\d+)/g, '$1 = N $2 0');
    
    // Clean up any double curly braces first
    chartContent = chartContent.replace(/\{\s*\{/g, '{');
    chartContent = chartContent.replace(/\}\s*\}/g, '}');
    
    // Clean up any remaining formatting issues
    chartContent = chartContent.replace(/\}\s*\[/g, '}\n[');
    chartContent = chartContent.replace(/\}\s*\{/g, '}\n{');
    
    // Fix existing SyncTrack format - convert "B 120.000" to "0 = B 500000"
    chartContent = chartContent.replace(/B\s+([\d.]+)/g, (match, bpm) => {
      const microseconds = Math.round(60000000 / parseFloat(bpm));
      return `0 = B ${microseconds}`;
    });
    
    // Fix existing Events format - convert "E tick "event"" to "tick = E "event""
    chartContent = chartContent.replace(/E\s+(\d+)\s+"([^"]+)"/g, '$1 = E "$2"');
    
    // Add missing newlines between } and next [Section]
    chartContent = chartContent.replace(/\}\s*\[/g, '}\n[');
    
    // Add TS 4 before BPM line in SyncTrack if not present
    chartContent = chartContent.replace(/(\[SyncTrack\]\s*\{\s*)(0 = B \d+)/g, '$1  0 = TS 4\n  $2');
    
    // Fix TS 4 formatting - ensure proper indentation
    chartContent = chartContent.replace(/\[SyncTrack\]\s*\{\s*0 = TS 4\s*\n\s*0 = B \d+/g, (match) => {
      return match.replace(/0 = TS 4\s*\n\s*0 = B/, '  0 = TS 4\n  0 = B');
    });
    
    // Remove duplicate events at the same tick
    chartContent = chartContent.replace(/\[Events\]\s*\{([^}]*)\}/gs, (match, content) => {
      const lines = content.split('\n').filter(line => line.trim());
      const eventMap = new Map();
      
      lines.forEach(line => {
        const eventMatch = line.match(/(\d+)\s*=\s*E\s+"([^"]+)"/);
        if (eventMatch) {
          const tick = eventMatch[1];
          const event = eventMatch[2];
          if (!eventMap.has(tick)) {
            eventMap.set(tick, event);
          }
        }
      });
      
      const uniqueEvents = Array.from(eventMap.entries())
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([tick, event]) => `  ${tick} = E "${event}"`)
        .join('\n');
      
      return `[Events]\n{\n${uniqueEvents}\n}`;
    });
    
    // Remove unnecessary blank lines inside sections
    chartContent = chartContent.replace(/\{\s*\n\s*\n/g, '{\n');
    chartContent = chartContent.replace(/\n\s*\n\s*\}/g, '\n}');
    
    // Clean up multiple consecutive blank lines
    chartContent = chartContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove blank lines between note entries
    chartContent = chartContent.replace(/(\d+ = N \d+ \d+)\s*\n\s*\n(\d+ = N \d+ \d+)/g, '$1\n$2');
    
    // Verify and fix balanced braces
    chartContent = chartContent.replace(/\{\s*\n\s*\}/g, '{\n}');
    
    // Final cleanup - ensure proper spacing between sections
    chartContent = chartContent.replace(/\}\s*\n\s*\[/g, '}\n\n[');
    chartContent = chartContent.replace(/\}\s*\[/g, '}\n\n[');
    
    // Add newline before [SyncTrack] - handle both with and without existing newlines
    chartContent = chartContent.replace(/(\[Song\]\s*\{[^}]*\})\s*(\[SyncTrack\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[Song\]\s*\{[^}]*\})\n(\[SyncTrack\])/g, '$1\n\n$2');
    
    // Ensure newlines between all major sections
    chartContent = chartContent.replace(/(\[SyncTrack\]\s*\{[^}]*\})\s*(\[Events\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[Events\]\s*\{[^}]*\})\s*(\[ExpertSingle\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[ExpertSingle\]\s*\{[^}]*\})\s*(\[ExpertDoubleBass\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[ExpertDoubleBass\]\s*\{[^}]*\})\s*(\[HardSingle\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[HardSingle\]\s*\{[^}]*\})\s*(\[MediumSingle\])/g, '$1\n\n$2');
    chartContent = chartContent.replace(/(\[MediumSingle\]\s*\{[^}]*\})\s*(\[EasySingle\])/g, '$1\n\n$2');
    
    // Fix SyncTrack formatting - ensure proper indentation
    chartContent = chartContent.replace(/\[SyncTrack\]\s*\{\s*0 = TS 4\s*\n\s*0 = B \d+/g, (match) => {
      return match.replace(/0 = TS 4\s*\n\s*0 = B/, '  0 = TS 4\n  0 = B');
    });
    
    // Change event names to use underscores
    chartContent = chartContent.replace(/E\s+"([^"]*)\s+(\d+)"/g, 'E "$1_$2"');
    chartContent = chartContent.replace(/E\s+"([^"]*)\s+(\d+)\s+([^"]*)"/g, 'E "$1_$2_$3"');
    
    // Sort notes strictly ascending by tick in all difficulty sections
    chartContent = chartContent.replace(/\[(ExpertSingle|HardSingle|MediumSingle|EasySingle|ExpertDoubleBass)\]\s*\{([^}]*)\}/gs, (match, sectionName, content) => {
      const lines = content.split('\n').filter(line => line.trim());
      const noteLines = [];
      const otherLines = [];
      
      lines.forEach(line => {
        if (line.match(/\d+\s*=\s*N\s+\d+\s+\d+/)) {
          noteLines.push(line);
        } else {
          otherLines.push(line);
        }
      });
      
      // Sort notes by tick value (extract first number from each line)
      noteLines.sort((a, b) => {
        const matchA = a.match(/^(\d+)/);
        const matchB = b.match(/^(\d+)/);
        if (!matchA || !matchB) return 0;
        const tickA = parseInt(matchA[1]);
        const tickB = parseInt(matchB[1]);
        return tickA - tickB;
      });
      
      const sortedContent = [...otherLines, ...noteLines].join('\n');
      return `[${sectionName}]\n{\n${sortedContent}\n}`;
    });
    
    // Add some sustain notes with nonzero length (every 10th note gets sustain)
    chartContent = chartContent.replace(/(\d+ = N \d+) 0/g, (match, notePart, offset) => {
      const noteNumber = parseInt(notePart.match(/(\d+)/)[1]);
      if (noteNumber % 10 === 0) {
        return `${notePart} 192`;
      }
      return match;
    });
    
    // Clean up any remaining formatting issues
    chartContent = chartContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Final fix: ensure newlines between all sections (run this last)
    chartContent = chartContent.replace(/\}\s*\[/g, '}\n\n[');
    chartContent = chartContent.replace(/\}\[([A-Z])/g, '}\n\n[$1');
    
    // Fix [Song] section format - add curly braces and quote string values
    chartContent = chartContent.replace(/\[Song\]\s*\n([^[]*?)(?=\[|$)/gs, (match, content) => {
      // Skip if already has curly braces
      if (content.includes('{') && content.includes('}')) {
        return match;
      }
      const lines = content.trim().split('\n').filter(line => line.trim());
      const formattedLines = lines.map(line => {
        if (line.includes('=')) {
          const [key, value] = line.split('=').map(s => s.trim());
          if (key === 'Name' || key === 'Artist' || key === 'Charter' || key === 'Genre' || key === 'MediaType' || key === 'MusicStream') {
            return `  ${key} = "${value}"`;
          } else {
            return `  ${key} = ${value}`;
          }
        }
        return line;
      });
      return `[Song]\n{\n${formattedLines.join('\n')}\n}`;
    });
    
    // Fix [SyncTrack] section format - add curly braces and proper BPM format
    chartContent = chartContent.replace(/\[SyncTrack\]\s*\n([^[]*?)(?=\[|$)/gs, (match, content) => {
      // Skip if already has curly braces
      if (content.includes('{') && content.includes('}')) {
        return match;
      }
      const lines = content.trim().split('\n').filter(line => line.trim());
      const formattedLines = lines.map(line => {
        if (line.includes('B ')) {
          // Convert BPM to microseconds per quarter note: 60000000 / BPM
          const bpmMatch = line.match(/B\s+([\d.]+)/);
          if (bpmMatch) {
            const bpm = parseFloat(bpmMatch[1]);
            const microseconds = Math.round(60000000 / bpm);
            return `  0 = B ${microseconds}`;
          }
        }
        if (line.includes('=')) {
          return `  ${line}`;
        }
        return line;
      });
      // Add TS entry if not present
      if (!content.includes('TS')) {
        formattedLines.unshift('  0 = TS 4');
      }
      return `[SyncTrack]\n{\n${formattedLines.join('\n')}\n}`;
    });
    
    // Fix [Events] section format - add curly braces and proper tick format
    chartContent = chartContent.replace(/\[Events\]\s*\n([^[]*?)(?=\[|$)/gs, (match, content) => {
      // Skip if already has curly braces
      if (content.includes('{') && content.includes('}')) {
        return match;
      }
      const lines = content.trim().split('\n').filter(line => line.trim());
      const formattedLines = lines.map(line => {
        if (line.includes('E ')) {
          // Convert "E tick "event"" to "tick = E "event""
          const eventMatch = line.match(/E\s+(\d+)\s+"([^"]+)"/);
          if (eventMatch) {
            const tick = eventMatch[1];
            const event = eventMatch[2];
            return `  ${tick} = E "${event}"`;
          }
        }
        if (line.includes('=')) {
          return `  ${line}`;
        }
        return line;
      });
      return `[Events]\n{\n${formattedLines.join('\n')}\n}`;
    });
    
    // Fix difficulty sections format - add curly braces
    chartContent = chartContent.replace(/\[(ExpertSingle|HardSingle|MediumSingle|EasySingle|ExpertDoubleBass)\]\s*\n([^[]*?)(?=\[|$)/gs, (match, sectionName, content) => {
      // Skip if already has curly braces
      if (content.includes('{') && content.includes('}')) {
        return match;
      }
      const lines = content.trim().split('\n').filter(line => line.trim());
      const formattedLines = lines.map(line => {
        if (line.includes('=')) {
          return `  ${line}`;
        }
        return line;
      });
      return `[${sectionName}]\n{\n${formattedLines.join('\n')}\n}`;
    });
    
    // Final newline fix - ensure proper spacing between all sections
    chartContent = chartContent.replace(/\}\[([A-Z])/g, '}\n\n[$1');
    
    console.log('Generated chart for', songName);
    
    // Return the cleaned chart content
    return chartContent;
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
  res.status(200).send("received");
});

app.post('/', (req, res) => {
  res.json({message: "a"});
});

// Generate chart from song name only
app.post('/api/generate-chart', async (req, res) => {
  try {
    const { songName } = req.body;

    if (!songName || !songName.trim()) {
      return res.status(400).json({ error: 'Song name is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log(`Generating chart for: ${songName}`);

    // Generate chart data using Gemini AI
    const chartData = await generateChartFromSongName(songName.trim());

    // Save chart data to file
    const chartFilename = `${songName}.chart`.replace(/[^a-zA-Z0-9\s\-\.]/g, '');
    const chartPath = path.join(uploadsDir, chartFilename);
    
    await fs.writeFile(chartPath, chartData, 'utf8');

    res.json({
      success: true,
      message: 'Chart generated successfully with Clone Hero format',
      chartFile: chartFilename,
      chartContent: chartData
    });

  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({ 
      error: 'Failed to generate chart',
      details: error.message 
    });
  }
});

// Helper function to parse Clone Hero chart metadata
function parseChartMetadata(chartContent) {
  const metadata = {
    songName: 'Unknown Song',
    artist: 'Unknown Artist',
    difficulty: 3,
    length: 180, // default 3 minutes
    genre: 'Unknown',
    aiGenerated: true
  };

  try {
    // Extract song name
    const nameMatch = chartContent.match(/Name\s*=\s*(.+)/);
    if (nameMatch) metadata.songName = nameMatch[1].trim();

    // Extract artist
    const artistMatch = chartContent.match(/Artist\s*=\s*(.+)/);
    if (artistMatch) metadata.artist = artistMatch[1].trim();

    // Extract genre
    const genreMatch = chartContent.match(/Genre\s*=\s*(.+)/);
    if (genreMatch) metadata.genre = genreMatch[1].trim();

    // Extract charter to determine if AI generated
    const charterMatch = chartContent.match(/Charter\s*=\s*(.+)/);
    if (charterMatch) metadata.aiGenerated = charterMatch[1].trim() === "Gemini";

    // Estimate difficulty based on note density in ExpertSingle section
    const expertSection = chartContent.match(/\[ExpertSingle\][\s\S]*?\n\}/);
    if (expertSection) {
      const noteLines = expertSection[0].match(/\|\s*N\s+\d+/g);
      if (noteLines) {
        const noteCount = noteLines.length;
        if (noteCount < 50) metadata.difficulty = 1;
        else if (noteCount < 100) metadata.difficulty = 2;
        else if (noteCount < 200) metadata.difficulty = 3;
        else if (noteCount < 300) metadata.difficulty = 4;
        else metadata.difficulty = 5;
      }
    }

    // Extract BPM from SyncTrack
    const bpmMatch = chartContent.match(/B\s+(\d+\.?\d*)/);
    const bpm = bpmMatch ? parseFloat(bpmMatch[1]) : 120;
    
    // Estimate length based on last tick in ExpertSingle
    const noteMatches = chartContent.match(/N\s+(\d+)\s+\d+/g);
    if (noteMatches && noteMatches.length > 0) {
      // Find the highest tick value
      let maxTick = 0;
      noteMatches.forEach(match => {
        const tickMatch = match.match(/N\s+(\d+)/);
        if (tickMatch) {
          const tick = parseInt(tickMatch[1]);
          if (tick > maxTick) maxTick = tick;
        }
      });
      
      if (maxTick > 0) {
        // Calculate length using actual BPM: length = (maxTick / resolution) * (60 / BPM)
        metadata.length = Math.floor((maxTick / 192) * (60 / bpm));
      }
    }
  } catch (error) {
    console.log('Error parsing chart metadata:', error.message);
  }

  return metadata;
}

// Get generated charts
app.get('/api/charts', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const chartFiles = files.filter(file => file.endsWith('.chart'));
    
    const charts = await Promise.all(
      chartFiles.map(async (file) => {
        const chartPath = path.join(uploadsDir, file);
        const chartContent = await fs.readFile(chartPath, 'utf8');
        const metadata = parseChartMetadata(chartContent);
        
        return {
          filename: file,
          songName: metadata.songName,
          artist: metadata.artist,
          difficulty: metadata.difficulty,
          length: metadata.length,
          genre: metadata.genre,
          aiGenerated: metadata.aiGenerated
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
  console.log(`Chart generation endpoint: http://localhost:${PORT}/api/generate-chart`);
  console.log(`Using Gemini Pro API: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});
