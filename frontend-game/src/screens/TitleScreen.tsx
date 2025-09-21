import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import selection from '../../../assets/selection.wav';
import changing from '../../../assets/change.wav';

const playSfx = (file: string, vol: number) => {
  const w = window as Window & { gameAudioContext?: AudioContext };

  // ✅ Create AudioContext if it doesn't exist
  if (!w.gameAudioContext) {
    try {
      w.gameAudioContext = new AudioContext();
    } catch (e) {
      console.warn("Unable to create AudioContext:", e);
      return;
    }
  }

  // Resume context if it was suspended (Chrome requires user interaction first)
  if (w.gameAudioContext.state === "suspended") {
    w.gameAudioContext.resume();
  }

  // Now decode and play
  fetch(file)
    .then(res => res.arrayBuffer())
    .then(buffer => w.gameAudioContext!.decodeAudioData(buffer))
    .then(decoded => {
      const source = w.gameAudioContext!.createBufferSource();

      // Create a gain node just for this sound effect
      const sfxGain = w.gameAudioContext!.createGain();
      sfxGain.gain.value = vol; // make it loud for testing

      source.buffer = decoded;
      source.connect(sfxGain).connect(w.gameAudioContext!.destination);
      source.start(0);
    })
    .catch(err => console.warn("Failed to play sfx:", err));
};

export const TitleScreen: React.FC = () => {
  const { setScreen } = useGameStore();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        playSfx(selection, 20.0);
        setScreen('MODE_SELECT');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setScreen]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      
      <div className="game-container text-center">
        {/* Main Title */}
        <div className="mb-16">
          <h1 className="retro-title text-6xl mb-8 pixel-glow-pink">
            SAVE THE BEAR
          </h1>
          <div className="pixel-glow-purple text-xl mb-4">
            ARCADE EDITION
          </div>
        </div>
        
        {/* Start Prompt */}
          <div className="pixel-blink mb-12">
            <p className="text-2xl pixel-glow-pink mb-8">
              PRESS ENTER TO START
            </p>
            <button className="nes-btn is-primary text-lg px-8">
              ENTER
            </button>
          </div>
        
        {/* Arcade UI Elements */}
        <div className="absolute top-8 left-8 pixel-glow-purple text-sm">
          INSERT COIN
        </div>
        <div className="absolute top-8 right-8 pixel-glow-pink text-sm">
          HIGH SCORE 999999
        </div>
        <div className="absolute bottom-8 left-8 pixel-glow-pink text-sm">
          1 PLAYER
        </div>
        <div className="absolute bottom-8 right-8 pixel-glow-purple text-sm">
          COPYRIGHT 2024 ARCADE
        </div>
      </div>
    </div>
  );
};
