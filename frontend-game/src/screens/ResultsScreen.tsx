import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export const ResultsScreen: React.FC = () => {
  const { gameplay, setScreen, resetGame } = useGameStore();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setScreen('MODE_SELECT');
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          resetGame();
          setScreen('TITLE');
          break;
        case 'Escape':
          event.preventDefault();
          setScreen('TITLE');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setScreen, resetGame]);
  
  const totalScore = gameplay.scoreP1 + gameplay.scoreP2;
  const maxCombo = Math.max(gameplay.comboP1, gameplay.comboP2);
  const avgAccuracy = (gameplay.accuracyP1 + gameplay.accuracyP2) / 2;
  
  const getRank = (accuracy: number) => {
    if (accuracy >= 95) return { rank: 'S', color: 'pixel-glow-pink' };
    if (accuracy >= 90) return { rank: 'A', color: 'text-yellow-400' };
    if (accuracy >= 80) return { rank: 'B', color: 'text-green-400' };
    if (accuracy >= 70) return { rank: 'C', color: 'text-blue-400' };
    return { rank: 'D', color: 'text-red-400' };
  };
  
  const rankInfo = getRank(avgAccuracy);
  
  return (
    <div className="min-h-screen pixel-bg flex flex-col items-center justify-center relative">
      <div className="scanlines"></div>
      
      <div className="game-container">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="retro-title text-5xl mb-4 pixel-glow-pink">
            RESULTS
          </h1>
          <div className={`text-8xl font-black mb-4 ${rankInfo.color}`}>
            {rankInfo.rank}
          </div>
        </div>
        
        {/* Stats */}
        <div className="pixel-panel p-8 mb-8 max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-pixel-white text-lg">SCORE</span>
              <span className="pixel-glow-purple text-xl font-bold">
                {totalScore.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-pixel-white text-lg">MAX COMBO</span>
              <span className="pixel-glow-pink text-xl font-bold">
                {maxCombo}X
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-pixel-white text-lg">ACCURACY</span>
              <span className="pixel-glow-pink text-xl font-bold">
                {avgAccuracy.toFixed(1)}%
              </span>
            </div>
            
            {/* Health Status */}
            <div className="flex justify-between items-center">
              <span className="text-pixel-white text-lg">HEALTH</span>
              <span className={`text-xl font-bold ${
                gameplay.healthP1 > 50 ? 'text-green-400' : 
                gameplay.healthP1 > 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {gameplay.healthP1}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="pixel-button selected text-lg px-8 py-4 pixel-blink">
            ENTER CONTINUE
          </div>
          
          <div className="text-pixel-gray text-sm">
            R RESTART GAME
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mt-12 text-pixel-gray text-sm">
          <div>
            <div>ENTER CONTINUE</div>
            <div>R RESTART</div>
          </div>
          <div>
            <div>ESC QUIT</div>
          </div>
        </div>
      </div>
    </div>
  );
};