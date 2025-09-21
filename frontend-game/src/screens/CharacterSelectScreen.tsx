import React from 'react';
import { NeonButton } from '../components/ui/NeonButton';
import { PixelPanel } from '../components/ui/PixelPanel';
import { useGameStore } from '../store/gameStore';

interface Character {
  id: string;
  name: string;
  power: number;
  speed: number;
  style: number;
  color: string;
}

const CHARACTERS: Character[] = [
  { id: 'bear', name: 'BEAR', power: 85, speed: 70, style: 60, color: 'from-red-500 to-orange-500' },
  { id: 'man', name: 'MAN', power: 60, speed: 85, style: 80, color: 'from-blue-500 to-cyan-500' },
];

export const CharacterSelectScreen: React.FC = () => {
  const { players, selectCharacter, setScreen, lobby } = useGameStore();
  
  const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
  
  const CharacterCard: React.FC<{ player: 1 | 2; character: Character | null }> = ({ player, character }) => {
    const isSelected = player === 1 ? players.p1.characterId : players.p2.characterId;
    const isP2Available = lobby.connectedP2 || player === 1;
    const isMultiplayer = lobby.mode === 'host' || lobby.mode === 'join' || lobby.connectedP2;
    const isPlayer2AutoAssigned = isMultiplayer && player === 2 && players.p1.characterId;
    
    // Determine if this is the local player's card
    const isLocalPlayer = isMultiplayer ? 
      (lobby.side === 'red' && player === 1) || (lobby.side === 'blue' && player === 2) :
      player === 1; // In single player, only player 1 is local
    
    return (
      <PixelPanel variant={isSelected ? 'outlined' : 'default'} className="h-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white mb-2">
            PLAYER {player}
          </h2>
          {!isP2Available && (
            <p className="text-gray-500 text-sm">Waiting for opponent...</p>
          )}
          {isPlayer2AutoAssigned && (
            <p className="text-yellow-400 text-sm font-semibold">Auto-assigned based on Player 1's choice</p>
          )}
        </div>
        
        {isP2Available && (
          <>
            {/* Character Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {CHARACTERS.map((char) => {
                const isDisabled = !isLocalPlayer || (isMultiplayer && player === 2);
                const isAutoSelected = isPlayer2AutoAssigned && isSelected === char.id;
                
                return (
                  <div
                    key={char.id}
                    onClick={() => !isDisabled && selectCharacter(player, char.id)}
                    className={`relative transition-all duration-200 ${
                      isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
                    } ${
                      isSelected === char.id ? 'ring-2 ring-pink-500' : ''
                    } ${
                      isAutoSelected ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    {/* Character Image Placeholder */}
                    <div className={`w-full h-32 bg-gradient-to-br ${char.color} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                      <div className="w-16 h-20 bg-black/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                    </div>
                    <p className="text-center text-white text-sm">{char.name}</p>
                    {isAutoSelected && (
                      <div className="absolute top-1 right-1 bg-yellow-400 text-black text-xs px-1 rounded">
                        AUTO
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Character Stats */}
            {isSelected && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-white mb-4 text-center">
                  {CHARACTERS.find(c => c.id === isSelected)?.name} STATS
                </h3>
                {CHARACTERS.filter(c => c.id === isSelected).map(char => (
                  <div key={char.id}>
                    <StatBar label="POWER" value={char.power} color="from-red-500 to-red-600" />
                    <StatBar label="SPEED" value={char.speed} color="from-blue-500 to-blue-600" />
                    <StatBar label="STYLE" value={char.style} color="from-purple-500 to-purple-600" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PixelPanel>
    );
  };
  
  return (
    <div className="min-h-screen brick-wall p-8 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/50 to-black/70"></div>
      <div className="max-w-6xl mx-auto">
        {/* Character Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-10">
          <CharacterCard player={1} character={CHARACTERS.find(c => c.id === players.p1.characterId) || null} />
          <CharacterCard player={2} character={CHARACTERS.find(c => c.id === players.p2.characterId) || null} />
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <NeonButton
            variant="secondary"
            onClick={() => setScreen('SONG_SELECT')}
          >
            ← BACK
          </NeonButton>
          
          <NeonButton
            variant="primary"
            disabled={!players.p1.characterId || (isMultiplayer && !players.p2.characterId)}
            onClick={() => setScreen('LOBBY')}
          >
            NEXT →
          </NeonButton>
        </div>
      </div>
    </div>
  );
};
