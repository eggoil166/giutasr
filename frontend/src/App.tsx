import { useState } from 'react'
import './App.css'

interface Chart {
  filename: string;
  songName: string;
  artist: string;
  difficulty: number;
  length: number;
}

function App() {
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [charts, setCharts] = useState<Chart[]>([]);
  const [showCharts, setShowCharts] = useState(false);
  const [songName, setSongName] = useState('');

  const handleGenerateChart = async () => {
    if (!songName.trim()) {
      setStatus('Please enter a song name');
      return;
    }

    setGenerating(true);
    setStatus('Searching for song information and generating chart...');

    try {
      const response = await fetch('http://localhost:3001/api/generate-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songName: songName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus(`Success! Chart generated: ${result.chartFile}`);
        // Refresh charts list
        fetchCharts();
        // Reset form
        setSongName('');
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Generation failed: ${error}`);
    } finally {
      setGenerating(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/charts');
      const chartsData = await response.json();
      setCharts(chartsData);
    } catch (error) {
      console.error('Failed to fetch charts:', error);
    }
  };

  const downloadChart = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/charts/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Guitar Super Power</h1>
        <p>Generate guitar charts from song information using AI</p>
      </header>

      <main className="app-main">
        <div className="song-form-section">
          <h2>Generate Guitar Chart</h2>
          <div className="form-container">
            <div className="form-group">
              <label htmlFor="songName">Song Name</label>
              <input
                id="songName"
                type="text"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                placeholder="Enter song name (e.g., 'Bohemian Rhapsody', 'Sweet Child O Mine')"
                disabled={generating}
              />
              <p className="form-help">Our AI will automatically find the artist, lyrics, and BPM for you!</p>
            </div>
            
            <button
              className="generate-button"
              onClick={handleGenerateChart}
              disabled={generating}
            >
              {generating ? 'Searching & Generating Chart...' : 'Generate Chart'}
            </button>
            
            {status && (
              <div className={`status ${status.includes('Error') || status.includes('failed') ? 'error' : 'success'}`}>
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="charts-section">
          <div className="charts-header">
            <h2>Generated Charts</h2>
            <button
              className="refresh-button"
              onClick={() => {
                fetchCharts();
                setShowCharts(!showCharts);
              }}
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>

          {showCharts && (
            <div className="charts-list">
              {charts.length === 0 ? (
                <p className="no-charts">No charts generated yet. Enter song information above to get started!</p>
              ) : (
                <div className="charts-grid">
                  {charts.map((chart, index) => (
                    <div key={index} className="chart-card">
                      <h3>{chart.songName}</h3>
                      <p className="artist">{chart.artist}</p>
                      <div className="chart-info">
                        <span className="difficulty">Difficulty: {chart.difficulty}/5</span>
                        <span className="length">Length: {Math.floor(chart.length / 60)}:{(chart.length % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <button
                        className="download-button"
                        onClick={() => downloadChart(chart.filename)}
                      >
                        Download Chart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>How it works</h2>
          <ol>
            <li>Enter just the song name above</li>
            <li>Our AI searches for the artist, lyrics, and BPM automatically</li>
            <li>AI generates a complete Clone Hero chart with multiple difficulty levels</li>
            <li>Download the generated .chart file for use in Clone Hero</li>
            <li>Use gesture controls to play along with the generated chart</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

export default App
