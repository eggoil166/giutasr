import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export const ModeSelectScreen: React.FC = () => {
  const { setScreen, setMode } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const modes = useMemo(() => [
    { 
      id: 'solo', 
      label: 'SINGLE PLAYER', 
      description: 'Practice your rhythm skills solo',
      action: () => {
        setMode('solo');
        setScreen('SONG_SELECT');
      }
    },
    { 
      id: 'multiplayer', 
      label: 'MULTIPLAYER', 
      description: 'Battle against another player',
      action: () => {
        setMode('multiplayer');
        setScreen('SONG_SELECT');
      }
    },
    { 
      id: 'howto', 
      label: 'HOW TO PLAY', 
      description: 'Learn the game controls',
      action: () => setScreen('HOW_TO_PLAY')
    },
    { 
      id: 'settings', 
      label: 'SETTINGS', 
      description: 'Adjust game options',
      action: () => setScreen('SETTINGS')
    },
  ], [setMode, setScreen]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = (prev - 1 + modes.length) % modes.length;
            return next;
          });
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = (prev + 1) % modes.length;
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          modes[selectedIndex].action();
          break;
        case 'Escape':
          event.preventDefault();
          setScreen('TITLE');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, modes, setScreen]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      
      <div className="game-container">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="retro-title text-5xl mb-4 pixel-glow-pink">
            SELECT MODE
          </h1>
          <p className="text-lg pixel-glow-purple">
            CHOOSE YOUR GAME TYPE
          </p>
        </div>
        
        {/* Mode Selection */}
        <div className="space-y-6 max-w-md mx-auto">
          {modes.map((mode, index) => (
            <div
              key={mode.id}
              className={`pixel-menu-item transition-all duration-200 ${
                selectedIndex === index ? 'selected scale-105' : ''
              }`}
              onClick={() => mode.action()}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="text-center">
                <h3 className={`text-xl arcade-text mb-2 ${
                  selectedIndex === index ? 'pixel-glow-pink' : 'text-pixel-white'
                }`}>
                  {mode.label}
                </h3>
                <p className="text-pixel-gray text-sm">
                  {mode.description}
                </p>
                
                {selectedIndex === index && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <div className="pixel-arrow left"></div>
                    <span className="pixel-glow-pink text-xs">SELECT</span>
                    <div className="pixel-arrow right"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mt-12 text-pixel-gray text-sm">
          <div>
            <div>UP DOWN TO NAVIGATE</div>
            <div>ENTER TO SELECT</div>
          </div>
          <div>
            <div>ESC TO GO BACK</div>
          </div>
        </div>
      </div>
    </div>
  );
};
