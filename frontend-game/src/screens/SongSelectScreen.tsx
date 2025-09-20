import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore, Song } from '../store/gameStore';

interface Character {
  id: string;
  name: string;
  color: string;
}

const CHARACTERS: Character[] = [
  { id: 'bear', name: 'BEAR', color: 'from-red-500 to-orange-500' },
  { id: 'man', name: 'MAN', color: 'from-blue-500 to-cyan-500' },
];

type AppWindow = Window & { gameAudioContext?: AudioContext; gameGainNode?: GainNode };

export const SongSelectScreen: React.FC = () => {
  const { song, players, lobby, selectSong, selectCharacter, toggleReady, startMatch, setScreen, hostLobby, joinLobby, netConnected, netError } = useGameStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [focusMode, setFocusMode] = useState<'song' | 'character'>('song');
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const currentSongRef = useRef<string>('');
  const [lobbyJoinCode, setLobbyJoinCode] = useState('');

  const playPreview = useCallback((songItem: Song) => {
    // Stop current preview if playing
    if (previewAudio && currentSongRef.current !== songItem.id) {
      previewAudio.pause();
      console.log('MusicPreviewStop', { songId: currentSongRef.current });
    }

    // Don't restart if same song
    if (currentSongRef.current === songItem.id && previewAudio && !previewAudio.paused) {
      return;
    }

  const basePath = `/songs/${songItem.id}/song`;
 
  const chosenSrc = `${basePath}.ogg`;
  const audio = new Audio(chosenSrc);
    audio.volume = 0; 
    audio.loop = true; // Loop the preview
    const tried: Record<string, boolean> = { ogg: true };
    const tryAlt = () => {
      if (!audio.src.endsWith('.mp4') && !tried.mp4) {
        tried.mp4 = true;
        audio.src = `${basePath}.mp4`;
        audio.load();
        audio.play().catch(err => console.warn('Preview mp4 failed', err));
      }
    };
    audio.addEventListener('error', tryAlt, { once: true });

    const w = window as AppWindow;
    const audioContext = w.gameAudioContext;
    const gainNode = w.gameGainNode;

    if (audioContext && gainNode) {
      const source = audioContext.createMediaElementSource(audio);
      source.connect(gainNode);
    }

    audio
      .play()
      .then(() => {
        setPreviewAudio(audio);
        currentSongRef.current = songItem.id;
        console.log('MusicPreviewStart', { songId: songItem.id });
      })
      .catch((err) => {
        console.warn('Preview playback failed:', err);
      });
  }, [previewAudio]);

  useEffect(() => {
    // Load song manifest from public folder
    const loadSongs = async () => {
      try {
        const res = await fetch('/songs/index.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Song[] = await res.json();
        setSongs(data);
        if (data.length > 0 && !song) {
          setSelectedSongIndex(0);
          selectSong(data[0]);
          playPreview(data[0]);
        }
      } catch (e) {
        console.warn('Failed to load songs manifest', e);
        setSongs([]);
      }
    };
    loadSongs();
  }, [playPreview, selectSong, song]);

  useEffect(() => {
    // Initialize audio context and gain node if not exists
    const w = window as AppWindow;
    if (!w.gameAudioContext) {
      w.gameAudioContext = new AudioContext();
      w.gameGainNode = w.gameAudioContext.createGain();
      w.gameGainNode.connect(w.gameAudioContext.destination);

      // Apply saved volume
      const savedVolume = localStorage.getItem('save-the-bear-volume');
      if (savedVolume && w.gameGainNode) {
        w.gameGainNode.gain.value = parseFloat(savedVolume);
      }
    }

    // Auto-select first song and start preview if none selected
    if (songs.length > 0 && !song) {
      selectSong(songs[0]);
      playPreview(songs[0]);
    }

    // Auto-select first character for P1
    if (!players.p1.characterId) {
      selectCharacter(1, CHARACTERS[0].id);
    }

    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
    };
  }, [song, players.p1.characterId, selectSong, selectCharacter, songs, playPreview, previewAudio]);

  const canStart = useCallback(() => {
    if (lobby.mode === 'solo') {
      return Boolean(song && players.p1.characterId);
    } else {
      return Boolean(
        song &&
          players.p1.characterId &&
          lobby.connectedP2 &&
          players.p2.characterId &&
          lobby.p1Ready &&
          lobby.p2Ready
      );
    }
  }, [lobby.connectedP2, lobby.mode, lobby.p1Ready, lobby.p2Ready, players.p1.characterId, players.p2.characterId, song]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          if (focusMode === 'song' && songs.length > 0) {
            const newIndex = (selectedSongIndex - 1 + songs.length) % songs.length;
            setSelectedSongIndex(newIndex);
            selectSong(songs[newIndex]);
            playPreview(songs[newIndex]);
          } else {
            const newIndex = (selectedCharIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
            setSelectedCharIndex(newIndex);
            selectCharacter(1, CHARACTERS[newIndex].id);
          }
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          if (focusMode === 'song' && songs.length > 0) {
            const newIndex = (selectedSongIndex + 1) % songs.length;
            setSelectedSongIndex(newIndex);
            selectSong(songs[newIndex]);
            playPreview(songs[newIndex]);
          } else {
            const newIndex = (selectedCharIndex + 1) % CHARACTERS.length;
            setSelectedCharIndex(newIndex);
            selectCharacter(1, CHARACTERS[newIndex].id);
          }
          break;
        }
        case 'Tab': {
          event.preventDefault();
          setFocusMode(focusMode === 'song' ? 'character' : 'song');
          break;
        }
        case 'Enter': {
          event.preventDefault();
          if (focusMode === 'song' || focusMode === 'character') {
            if (lobby.mode !== 'solo') {
              toggleReady(1);
            } else if (canStart()) {
              startMatch();
            }
          } else if (canStart()) {
            startMatch();
          }
          break;
        }
        case ' ': {
          event.preventDefault();
          if (lobby.mode !== 'solo') {
            toggleReady(1);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setScreen('MODE_SELECT');
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSongIndex, selectedCharIndex, focusMode, selectSong, selectCharacter, startMatch, setScreen, songs, lobby.mode, toggleReady, canStart, playPreview]);

  const getDifficultyColor = (difficulty: Song['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/20';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'audio/mp3' || file.type === 'audio/wav' || file.type === 'audio/mpeg')) {
      setUploadFile(file);
    } else {
      alert('Please upload an MP3 or WAV file');
    }
  };

  const generateChart = async () => {
    if (!uploadFile) return;
    
    setIsGenerating(true);
    
    // Simulate chart generation process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create a new song entry
    const newSong: Song = {
      id: uploadFile.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      title: uploadFile.name.replace(/\.[^/.]+$/, "").toUpperCase(),
      bpm: 120, // Default BPM
      difficulty: 'Medium' as const
    };
    
    // Add to songs list
    setSongs(prev => [...prev, newSong]);
    
    // Select the new song
    setSelectedSongIndex(songs.length);
    selectSong(newSong);
    
    // Reset upload state
    setUploadFile(null);
    setShowUpload(false);
    setIsGenerating(false);
    
    console.log('ChartGenerated', { songId: newSong.id, title: newSong.title });
  };
  
  return (
    <div className="min-h-screen p-8 relative">
      
      <div className="game-container">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="retro-title text-4xl mb-2 pixel-glow-pink">SONG SELECT</h1>
          <p className="pixel-glow-purple">Choose your song</p>
        </div>
        
        {/* Main Content */}
        <div className="flex gap-8 mb-8 relative z-10 justify-center items-start">
          {/* Character Selection - Left Side */}
          <div className="flex-shrink-0 w-80">
            <div className={`pixel-panel p-6 ${focusMode === 'character' ? 'highlighted' : ''}`}>
              <h2 className="text-lg pixel-glow-purple mb-6">
                Character {focusMode === 'character' && <span className="pixel-glow-pink">[ACTIVE]</span>}
              </h2>
              
              {/* Player 1 Character */}
              <div className="mb-6">
                <h3 className="text-sm pixel-glow-pink mb-4">PLAYER 1</h3>
                <div className="space-y-3">
                  {CHARACTERS.map((char, index) => (
                    <div
                      key={char.id}
                      className={`p-3 pixel-panel transition-all cursor-pointer ${
                        selectedCharIndex === index && focusMode === 'character'
                          ? 'highlighted scale-105'
                          : players.p1.characterId === char.id
                          ? 'outlined'
                          : 'hover:border-pixel-purple'
                      }`}
                      onClick={() => {
                        setSelectedCharIndex(index);
                        selectCharacter(1, char.id);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${char.color === 'from-red-500 to-orange-500' ? 'lane-red' : 'lane-blue'} flex items-center justify-center`}>
                          <span className="text-xl">👤</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-pixel-white text-xs">{char.name}</div>
                          <div className="text-xs text-pixel-gray">FIGHT ON!</div>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedCharIndex === index && focusMode === 'character' && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="pixel-arrow left mr-2 pixel-blink"></div>
                          <span className="pixel-glow-pink text-xs">SELECT</span>
                          <div className="pixel-arrow right ml-2 pixel-blink"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Player 2 Character (if multiplayer) */}
              {lobby.mode !== 'solo' && (
                <div>
                  <h3 className="text-sm pixel-glow-purple mb-4">PLAYER 2</h3>
                  <div className="p-3 pixel-panel outlined">
                    {lobby.connectedP2 && players.p2.characterId ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 lane-blue flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <div className="text-pixel-white text-xs">
                            {CHARACTERS.find(c => c.id === players.p2.characterId)?.name || 'UNKNOWN'}
                          </div>
                          <div className={`text-xs ${lobby.p2Ready ? 'text-green-400' : 'text-yellow-400'}`}>
                            {lobby.p2Ready ? 'READY' : 'NOT READY'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-pixel-gray">
                        <div className="text-xs">{lobby.code ? 'WAITING FOR PLAYER 2' : 'CREATE OR JOIN LOBBY'}</div>
                        {!lobby.connectedP2 && lobby.code && <div className="pixel-blink text-xs mt-1">…</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Song Selection - Center */}
          <div className="flex-1 max-w-2xl">
            <div className={`pixel-panel p-6 ${focusMode === 'song' ? 'highlighted' : ''}`}>
              <h2 className="text-lg pixel-glow-purple mb-6">
                TRACKS {focusMode === 'song' && <span className="pixel-glow-pink">[ACTIVE]</span>}
              </h2>
              
              {/* Upload Button */}
              <div className="mb-4 text-center">
                <button
                  onClick={() => setShowUpload(!showUpload)}
                >
                  {showUpload ? 'CLOSE UPLOAD' : '+ UPLOAD SONG'}
                </button>
              </div>
              
              {/* Upload Panel */}
              {showUpload && (
                <div className="pixel-panel outlined p-4 mb-4">
                  <h3 className="text-sm pixel-glow-pink mb-4 text-center">UPLOAD & GENERATE</h3>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept=".mp3,.wav"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="song-upload"
                      />
                      <label
                        htmlFor="song-upload"
                        className="pixel-button w-full text-center cursor-pointer block py-3"
                      >
                        {uploadFile ? uploadFile.name : 'SELECT MP3/WAV FILE'}
                      </label>
                    </div>
                    
                    {uploadFile && (
                      <div className="text-center">
                        <button
                          className={`pixel-button px-6 py-3 ${isGenerating ? 'selected' : ''}`}
                          onClick={generateChart}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <span className="pixel-blink">GENERATING CHART...</span>
                          ) : (
                            'GENERATE CHART'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {songs.map((songItem, index) => (
                  <div
                    key={songItem.id}
                    className={`p-4 pixel-panel transition-all cursor-pointer ${
                      selectedSongIndex === index && focusMode === 'song'
                        ? 'highlighted scale-103'
                        : song?.id === songItem.id
                        ? 'outlined'
                        : 'hover:border-pixel-purple'
                    }`}
                    onClick={() => {
                      setSelectedSongIndex(index);
                      selectSong(songItem);
                      playPreview(songItem);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm text-pixel-white">{songItem.title}</h3>
                        <div className="pixel-glow-purple text-xs">{songItem.bpm} BPM</div>
                      </div>
                      <div className={`px-2 py-1 pixel-panel text-xs ${getDifficultyColor(songItem.difficulty)}`}>
                        {songItem.difficulty}
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedSongIndex === index && focusMode === 'song' && (
                      <div className="flex items-center justify-center mt-2">
                        <div className="pixel-arrow left mr-2 pixel-blink"></div>
                        <span className="pixel-glow-pink text-xs">SELECT</span>
                        <div className="pixel-arrow right ml-2 pixel-blink"></div>
                      </div>
                    )}
                  </div>
                ))}
                {songs.length === 0 && (
                  <div className="p-4 pixel-panel text-pixel-gray text-center">
                    <div className="text-xs">NO TRACKS FOUND</div>
                    <div className="text-xs mt-2 pixel-blink">Insert game cartridge</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Ready Status Panel - Right Side (Multiplayer Only) */}
          {lobby.mode !== 'solo' && (
            <div className="flex-shrink-0 w-80">
              <div className="pixel-panel p-6 border-4 border-yellow-400">
                <h3 className="text-lg pixel-glow-pink mb-4">STATUS</h3>
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-sm pixel-glow-pink mb-2">PLAYER 1</h4>
                    <div className={`text-lg ${lobby.p1Ready ? 'text-green-400' : 'text-yellow-400'}`}>
                      {lobby.p1Ready ? '✓ READY' : '⏳ NOT READY'}
                    </div>
                    <button
                      onClick={() => toggleReady(1)}
                      className={`mt-2 pixel-button text-xs ${
                        lobby.p1Ready 
                          ? 'border-4 border-red-500 text-red-400' 
                          : 'border-4 border-green-500 text-green-400'
                      }`}
                    >
                      {lobby.p1Ready ? 'UNREADY' : 'READY UP'}
                    </button>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm pixel-glow-purple mb-2">PLAYER 2</h4>
                    <div className={`text-lg ${lobby.p2Ready ? 'text-green-400' : 'text-yellow-400'}`}>
                      {lobby.p2Ready ? '✓ READY' : '⏳ NOT READY'}
                    </div>
                    {/* Only show toggle for player 2 if this client IS player 2 */}
                    {lobby.side === 'blue' && (
                      <button
                        onClick={() => toggleReady(2)}
                        disabled={!lobby.connectedP2}
                        className={`mt-2 pixel-button text-xs ${
                          lobby.p2Ready 
                            ? 'border-4 border-red-500 text-red-400' 
                            : 'border-4 border-green-500 text-green-400'
                        } ${!lobby.connectedP2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {lobby.p2Ready ? 'UNREADY' : 'READY UP'}
                      </button>
                    )}
                  </div>
                </div>
                {lobby.p1Ready && lobby.p2Ready && (
                  <div className="mt-4 text-green-400 text-sm pixel-blink text-center">
                    ALL PLAYERS READY!
                  </div>
                )}
                <div className="mt-4 text-xs text-center text-pixel-gray">
                  {netConnected ? <span className="text-green-400">NET OK</span> : <span className="text-yellow-400">CONNECTING…</span>}
                  {netError && <div className="text-red-400 mt-1">{netError}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Lobby Actions */}
        {lobby.mode !== 'solo' && (
        <div className="pixel-panel p-4 mb-8">
          <h3 className="text-sm text-pixel-white mb-3">MULTIPLAYER LOBBY</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <button
                className="pixel-button px-6 py-3 w-full"
                onClick={hostLobby}
              >
                CREATE LOBBY CODE
              </button>
              {lobby.code && (
                <div className="mt-2 text-pixel-gray text-xs">CODE: {lobby.code} {lobby.redPresent && '(P1)'} {lobby.bluePresent && '(P2)'}
                </div>
              )}
            </div>
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER LOBBY CODE"
                  value={lobbyJoinCode}
                  onChange={(e) => setLobbyJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 px-3 py-2 pixel-panel text-pixel-white text-center"
                />
                <button
                  className="pixel-button px-4"
                  disabled={lobbyJoinCode.length !== 6}
                  onClick={() => joinLobby(lobbyJoinCode)}
                >
                  JOIN
                </button>
              </div>
              <div className="mt-1 text-pixel-gray text-xs">Codes are 6 characters</div>
            </div>
          </div>
        </div>
        )}

        {/* Start Button */}
        <div className="text-center mb-8">
          <button
            className={`pixel-button px-8 py-4 text-lg ${canStart() ? 'selected' : ''}`}
            disabled={!canStart()}
            onClick={() => { if (canStart()) { startMatch(); } }}
          >
            {lobby.mode === 'solo' ? (canStart() ? 'START MATCH' : 'SELECT SONG & CHARACTER') : (canStart() ? (lobby.side === 'red' ? 'START MATCH' : 'WAIT FOR HOST') : 'BOTH PLAYERS MUST BE READY')}
          </button>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center text-pixel-gray text-sm mt-8">
          <div>
            <div>UP DOWN NAVIGATE</div>
            <div>TAB SWITCH</div>
            {lobby.mode !== 'solo' && <div>SPACE READY</div>}
          </div>
          <div>
            <div>{lobby.mode === 'solo' ? 'ENTER START' : 'READY TO START'}</div>
            <div>ESC BACK</div>
          </div>
        </div>
        
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            className="pixel-button"
           onClick={() => setScreen('MODE_SELECT')}
          >
            ← BACK
          </button>
        </div>
      </div>
    </div>
  );
};
