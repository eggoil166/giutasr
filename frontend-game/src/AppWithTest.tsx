import React from 'react';
import { useGameStore } from './store/gameStore';
import { TitleScreen } from './screens/TitleScreen';
import { ModeSelectScreen } from './screens/ModeSelectScreen';
import { SongSelectScreen } from './screens/SongSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { SettingsScreen } from './screens/SettingsScreen';
function AppWithTest() {
  const { currentScreen } = useGameStore();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'TITLE': return <TitleScreen />;
      case 'MODE_SELECT': return <ModeSelectScreen />;
      case 'SONG_SELECT': return <SongSelectScreen />;
      case 'GAME': return <GameScreen />;
      case 'RESULTS': return <ResultsScreen />;
      case 'HOW_TO_PLAY': return <HowToPlayScreen />;
      case 'SETTINGS': return <SettingsScreen />;
      default: return <TitleScreen />;
    }
  };

  return (
    <div>
      {renderScreen()}
    </div>
  );
}

export default AppWithTest;
