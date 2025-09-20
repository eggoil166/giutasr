import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameEngine, Note, Judgment } from '../game/gameEngine';
import { InputHandler, InputEvent } from '../game/inputHandler';
import { CharacterSpriteManager } from '../game/characterSprites';
import { NeonButton } from '../components/ui/NeonButton';

declare global {
  interface Window {
    gameAudioContext?: AudioContext;
    gameGainNode?: GainNode;
  }
}

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const characterManagerRef = useRef<CharacterSpriteManager | null>(null);
  
  const { 
    song,
    players, 
    lobby, 
    gameplay, 
  updateGameplay, 
  settings,
  setScreen
  } = useGameStore();
  
  const [isPaused, setIsPaused] = useState(false);
  // Keep latest health values to avoid stale closures in callbacks
  const healthP1Ref = useRef(gameplay.healthP1);
  const healthP2Ref = useRef(gameplay.healthP2);
  // Keep latest scoring values
  const scoreP1Ref = useRef(gameplay.scoreP1);
  const scoreP2Ref = useRef(gameplay.scoreP2);
  const comboP1Ref = useRef(gameplay.comboP1);
  const comboP2Ref = useRef(gameplay.comboP2);
  const [songProgress, setSongProgress] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { healthP1Ref.current = gameplay.healthP1; }, [gameplay.healthP1]);
  useEffect(() => { healthP2Ref.current = gameplay.healthP2; }, [gameplay.healthP2]);
  useEffect(() => { scoreP1Ref.current = gameplay.scoreP1; }, [gameplay.scoreP1]);
  useEffect(() => { scoreP2Ref.current = gameplay.scoreP2; }, [gameplay.scoreP2]);
  useEffect(() => { comboP1Ref.current = gameplay.comboP1; }, [gameplay.comboP1]);
  useEffect(() => { comboP2Ref.current = gameplay.comboP2; }, [gameplay.comboP2]);

  // Stable callbacks
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        console.log('MatchPaused');
        gameEngineRef.current?.pause();
      } else {
        console.log('MatchResumed');
        gameEngineRef.current?.resume();
      }
      return next;
    });
  }, []);

  const handleNoteResult = useCallback((result: { judgment: Judgment; note: Note; player: number; accuracy: number }) => {
    const player = result.player;
    const currentScore = player === 1 ? scoreP1Ref.current : scoreP2Ref.current;
    const currentCombo = player === 1 ? comboP1Ref.current : comboP2Ref.current;

    const newScore = currentScore + result.judgment.score;
    const newCombo = result.judgment.type !== 'Miss' ? currentCombo + 1 : 0;

    updateGameplay({
      [`scoreP${player}`]: newScore,
      [`comboP${player}`]: newCombo,
      [`accuracyP${player}`]: result.accuracy,
    });
  }, [updateGameplay]);

  const handleHealthUpdate = useCallback((player: number, healthChange: number, gameOver: boolean) => {
    // Read latest health from refs to ensure multiple rapid updates apply correctly
    const currentHealth = player === 1 ? healthP1Ref.current : healthP2Ref.current;
    const newHealth = Math.max(0, Math.min(100, currentHealth + healthChange));

    updateGameplay({
      [`healthP${player}`]: newHealth,
      gameOver: newHealth <= 0 || gameOver,
    });

    // If game over, stop engine and audio immediately to avoid replay
    if (newHealth <= 0 || gameOver) {
      gameEngineRef.current?.stop?.();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [updateGameplay]);

  const handleInput = useCallback((inputEvent: InputEvent) => {
    if (isPaused || !gameEngineRef.current || !characterManagerRef.current) return;

    const result = gameEngineRef.current.handleInput(inputEvent.lane, inputEvent.type, inputEvent.player);

    if (result.judgment) {
      console.log('NoteHit', {
        player: inputEvent.player,
        lane: inputEvent.lane,
        type: inputEvent.type,
        noteType: result.note?.type || 'none',
        judgment: result.judgment.type,
        score: result.judgment.score,
      });
    }

    // Trigger character animation
    characterManagerRef.current.triggerAction(inputEvent.player, inputEvent.action);
  }, [isPaused]);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Get or create audio context and gain node
    const audioContext = window.gameAudioContext || new AudioContext();
    const gainNode = window.gameGainNode || audioContext.createGain();
    
    if (!window.gameAudioContext) {
      window.gameAudioContext = audioContext;
      window.gameGainNode = gainNode;
      gainNode.connect(audioContext.destination);
    }
  // Apply initial volume from settings
  const initialVolume = Math.max(0, Math.min(1, settings.volume ?? 1));
  gainNode.gain.value = initialVolume;
    
    // Initialize game systems
    gameEngineRef.current = new GameEngine(canvasRef.current, audioContext, gainNode);
    inputHandlerRef.current = new InputHandler();
    characterManagerRef.current = new CharacterSpriteManager();
    
    // Set up note result callback
    gameEngineRef.current.setNoteResultCallback(handleNoteResult);
    
    // Set up health update callback
    gameEngineRef.current.setHealthUpdateCallback(handleHealthUpdate);

    // Setup character sprites
    if (players.p1.characterId) {
      characterManagerRef.current.setCharacter(1, players.p1.characterId);
    }
    if (players.p2.characterId && lobby.connectedP2) {
      characterManagerRef.current.setCharacter(2, players.p2.characterId);
    }
    
  // Setup input handling
  const cleanup = inputHandlerRef.current.onInput(handleInput);
    
    // Setup progress tracking
    progressIntervalRef.current = setInterval(() => {
      if (gameEngineRef.current) {
        const currentTime = gameEngineRef.current.getCurrentTime();
        const stats = gameEngineRef.current.getStats();
        const totalNotes = stats.totalNotes || 1;
        const completedNotes = stats.perfectHits + stats.greatHits + stats.goodHits + stats.missedHits;
        const progress = Math.min(100, (completedNotes / totalNotes) * 100);
        setSongProgress(progress);
        
        // Estimate duration based on note completion
        if (completedNotes > 0 && progress > 0) {
          const estimatedDuration = (currentTime / progress) * 100;
          setSongDuration(estimatedDuration);
        }
      }
    }, 100);
    
    // Setup pause handling
    const handlePause = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        togglePause();
      }
    };
    
  document.addEventListener('keydown', handlePause);
    
    // Start game
  gameEngineRef.current.start(song?.id);
    
    return () => {
  // Stop engine/audio on unmount
  gameEngineRef.current?.stop?.();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      cleanup();
      document.removeEventListener('keydown', handlePause);
      inputHandlerRef.current?.destroy();
    };
  }, [
    players.p1.characterId,
    players.p2.characterId,
    lobby.connectedP2,
    song?.id,
  settings.volume,
    handleInput,
    handleNoteResult,
    handleHealthUpdate,
    togglePause,
  ]);

  // React to volume changes in settings
  useEffect(() => {
    const vol = Math.max(0, Math.min(1, settings.volume ?? 1));
    // Update engine gain
    gameEngineRef.current?.setVolume(vol);
    // Also set the shared gain node in case engine is not yet created or for menu sounds
    if (window.gameGainNode) {
      window.gameGainNode.gain.value = vol;
    }
  }, [settings.volume]);
  
  const restartSong = () => {
  // Ensure previous run is fully stopped
  gameEngineRef.current?.stop?.();
    // Reset gameplay state
    updateGameplay({
      started: true,
      paused: false,
      scoreP1: 0,
      scoreP2: 0,
      comboP1: 0,
      comboP2: 0,
      accuracyP1: 100,
      accuracyP2: 100,
      healthP1: 100,
      healthP2: 100,
      gameOver: false,
    });
    
    // Restart the game engine
    if (gameEngineRef.current && song) {
      gameEngineRef.current = new GameEngine(canvasRef.current!, window.gameAudioContext!, window.gameGainNode!);
      gameEngineRef.current.setNoteResultCallback(handleNoteResult);
      gameEngineRef.current.setHealthUpdateCallback(handleHealthUpdate);
      gameEngineRef.current.start(song.id);
    }
  };

  
  
  const CharacterPanel: React.FC<{ player: 1 | 2 }> = ({ player }) => {
    const character = player === 1 ? players.p1 : players.p2;
    const score = player === 1 ? gameplay.scoreP1 : gameplay.scoreP2;
    const combo = player === 1 ? gameplay.comboP1 : gameplay.comboP2;
    const accuracy = player === 1 ? gameplay.accuracyP1 : gameplay.accuracyP2;
    const health = player === 1 ? gameplay.healthP1 : gameplay.healthP2;
    
    if (!character.characterId) return null;
    
    const pose = characterManagerRef.current?.getCurrentPose(player) || 'idle';
    const colorClass = player === 1 ? 'lane-green' : 'lane-red';
    
    return (
      <div className="pixel-panel p-6 max-w-xs">
        <div className="text-center mb-4">
          <h3 className="pixel-glow-pink text-lg">P{player}</h3>
          <div className="text-pixel-gray text-xs">{character.characterId?.toUpperCase()}</div>
        </div>
        
        {/* Character Display */}
        <div className={`w-24 h-32 mx-auto mb-4 ${colorClass} flex items-center justify-center relative overflow-hidden`}>
          <div className="text-6xl">👤</div>
          {pose !== 'idle' && (
            <div className="absolute inset-0 bg-white opacity-20 pixel-blink"></div>
          )}
          {/* Status indicator */}
          <div className="absolute -bottom-1 -right-1 lane-yellow text-black text-xs px-1 py-0.5">
            {pose.toUpperCase()}
          </div>
        </div>
        
        {/* Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-pixel-gray">HP</span>
            <span className={`${health > 50 ? 'text-green-400' : health > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
              {health}%
            </span>
          </div>
          {/* Health Bar */}
          <div className="pixel-health-bar mb-2">
            <div
              className={`pixel-health-fill ${
                health > 50 ? 'high' : health > 25 ? 'medium' : 'low'
              }`}
              style={{ width: `${health}%` }}
            ></div>
          </div>
          <div className="flex justify-between">
            <span className="text-pixel-gray">SCORE</span>
            <span className="pixel-glow-purple">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pixel-gray">COMBO</span>
            <span className="pixel-glow-pink">{combo}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pixel-gray">ACC</span>
            <span className="pixel-glow-pink">{accuracy.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Control hints */}
        <div className="mt-4 text-xs text-pixel-gray text-center">
          {player === 1 ? 'V C X Z' : 'S L ; \''}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 text-xs text-pixel-gray text-center">
          {player === 1 ? 'V C X Z' : 'S L ; \''}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen retro-bg scanlines relative">
      {/* Retro grid overlay */}
      <div className="absolute inset-0 pixel-bg opacity-10"></div>
      
      {/* Progress Bar - Centered at bottom */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="pixel-panel bg-pixel-darker p-2" style={{ width: '400px' }}>
          <div className="pixel-health-bar mb-1" style={{ height: '16px' }}>
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${songProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-xs pixel-glow-purple">
            {songProgress.toFixed(0)}% COMPLETE
          </div>
        </div>
      </div>
      
      {/* HUD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 game-container">
        <div className="flex items-center space-x-6 pixel-score">
          <div className="text-center">
            <div className="pixel-glow-purple text-xs">SCORE</div>
            <div className="pixel-glow-pink text-sm">
              {(gameplay.scoreP1 + gameplay.scoreP2).toLocaleString()}
            </div>
          </div>
          <div className="w-1 h-6 bg-pixel-gray"></div>
          <div className="text-center">
            <div className="pixel-glow-purple text-xs">COMBO</div>
            <div className="pixel-glow-pink text-sm">
              {Math.max(gameplay.comboP1, gameplay.comboP2)}x
            </div>
          </div>
          <div className="w-1 h-6 bg-pixel-gray"></div>
          <div className="text-center">
            <div className="pixel-glow-purple text-xs">ACCURACY</div>
            <div className="pixel-glow-pink text-sm">
              {((gameplay.accuracyP1 + gameplay.accuracyP2) / 2).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Layout */}
      <div className="flex items-center justify-center min-h-screen px-8 game-container">
        {/* Player 1 Character Area */}
        <div className="flex-1 flex justify-center">
          <CharacterPanel player={1} />
        </div>
        
        {/* Game Canvas - Retro styled */}
        <div className="flex-shrink-0">
          <canvas
            ref={canvasRef}
            width={480}
            height={500}
            className="pixel-panel bg-pixel-darker border-4 border-pixel-pink"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Lane labels below canvas */}
          <div className="flex justify-center mt-2 space-x-8">
            <div className="text-xs lane-green px-2 py-1">G</div>
            <div className="text-xs lane-red px-2 py-1">R</div>
            <div className="text-xs lane-yellow px-2 py-1">Y</div>
            <div className="text-xs lane-blue px-2 py-1">B</div>
          </div>
        </div>
        
        {/* Player 2 Character Area */}
        <div className="flex-1 flex justify-center">
          {lobby.connectedP2 && <CharacterPanel player={2} />}
        </div>
      </div>
      
      {/* Pause Menu */}
      {isPaused && (
        <div className="absolute inset-0 bg-pixel-darker bg-opacity-90 flex items-center justify-center z-50">
          <div className="pixel-panel p-8 text-center">
            <h2 className="retro-title text-3xl mb-6 pixel-glow-pink">PAUSED</h2>
            <div className="space-y-4">
              <button className="pixel-button w-full" onClick={togglePause}>
                RESUME
              </button>
              <button className="pixel-button w-full" onClick={() => setScreen('HOME')}>
                QUIT TO HOME
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Over Menu */}
      {gameplay.gameOver && (
        <div className="absolute inset-0 bg-pixel-darker bg-opacity-90 flex items-center justify-center z-50">
          <div className="pixel-panel p-8 text-center border-4 border-red-500">
            <h2 className="retro-title text-4xl mb-4 text-red-500">STAGE CLEAR</h2>
            <p className="pixel-glow-pink text-lg mb-6 pixel-blink">BEAR SAVED</p>
            <div className="space-y-4">
              <button className="pixel-button w-full text-lg py-4" onClick={() => setScreen('RESULTS')}>
                VIEW RESULTS
              </button>
              <button className="pixel-button w-full" onClick={restartSong}>
                RETRY STAGE
              </button>
              <button className="pixel-button w-full" onClick={() => setScreen('HOME')}>
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute top-4 right-4 text-right pixel-glow-purple text-xs">
        <div>ESC = PAUSE</div>
        <div>P1: V C X Z</div>
        {lobby.connectedP2 && <div>P2: S L ; '</div>}
      </div>
    </div>
  );
};
