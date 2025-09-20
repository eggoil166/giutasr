import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { TitleScreen } from './screens/TitleScreen';
import { ModeSelectScreen } from './screens/ModeSelectScreen';
import { SongSelectScreen } from './screens/SongSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import sound from '../../assets/botanicpanic.mp3';

function AppWithTest() {
  const { currentScreen } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    const audio = new Audio(sound);
    audio.loop = true;
    audioRef.current = audio;

    // Setup Web Audio API for fading
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const track = audioContext.createMediaElementSource(audio);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1; // start at full volume
    track.connect(gainNode).connect(audioContext.destination);

    audioContextRef.current = audioContext;
    gainRef.current = gainNode;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioContext.close();
    };
  }, []);

  // Start music after user interaction (required by browsers)
  const handleUserInteraction = () => {
    if (!musicStarted && audioRef.current && audioContextRef.current) {
      audioContextRef.current.resume().then(() => {
        audioRef.current!.play().catch(err => console.warn('Autoplay blocked:', err));
        setMusicStarted(true);
      });
    }
  };

  // Fade in/out based on current screen
  useEffect(() => {
    if (!gainRef.current || !musicStarted) return;

    const gain = gainRef.current;
    const fadeTime = 1.0; // seconds

    if (currentScreen === 'GAME') {
      // Fade out
      gain.gain.cancelScheduledValues(gainRef.current.gain.value);
      gain.gain.linearRampToValueAtTime(0, audioContextRef.current!.currentTime + fadeTime);
    } else {
      // Fade in
      gain.gain.cancelScheduledValues(gainRef.current.gain.value);
      gain.gain.linearRampToValueAtTime(1, audioContextRef.current!.currentTime + fadeTime);
    }
  }, [currentScreen, musicStarted]);

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

  return <div onClick={handleUserInteraction}>{renderScreen()}</div>;
}

export default AppWithTest;
