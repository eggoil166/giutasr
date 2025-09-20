import { useState, useRef } from 'react'
import './App.css'

interface Chart {
  filename: string;
  songName: string;
  artist: string;
  difficulty: number;
  length: number;
}

function App() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [charts, setCharts] = useState<Chart[]>([]);
  const [showCharts, setShowCharts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3')) {
      setUploadStatus('Please select an MP3 file');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading and processing MP3...');

    const formData = new FormData();
    formData.append('mp3', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload-mp3', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`Success! Chart generated: ${result.chartFile}`);
        // Refresh charts list
        fetchCharts();
      } else {
        setUploadStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error}`);
    } finally {
      setUploading(false);
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
        <p>Upload MP3 files to generate guitar charts using AI</p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <h2>Upload MP3 File</h2>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing...' : 'Choose MP3 File'}
            </button>
            {uploadStatus && (
              <div className={`status ${uploadStatus.includes('Error') || uploadStatus.includes('failed') ? 'error' : 'success'}`}>
                {uploadStatus}
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
                <p className="no-charts">No charts generated yet. Upload an MP3 file to get started!</p>
              ) : (
                <div className="charts-grid">
                  {charts.map((chart, index) => (
                    <div key={index} className="chart-card">
                      <h3>{chart.songName}</h3>
                      <p className="artist">{chart.artist}</p>
                      <div className="chart-info">
                        <span className="difficulty">Difficulty: {chart.difficulty}/5</span>
                        <span className="length">{Math.floor(chart.length / 60)}:{(chart.length % 60).toString().padStart(2, '0')}</span>
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
            <li>Upload an MP3 file using the button above</li>
            <li>Our AI analyzes the audio and generates a guitar chart</li>
            <li>Download the generated .chart file for use in your guitar game</li>
            <li>Use gesture controls to play along with the generated chart</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

export default App
