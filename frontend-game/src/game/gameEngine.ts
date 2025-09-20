export interface Note {
  id: string;
  lane: 0 | 1 | 2 | 3; // 4 lanes: Green, Red, Yellow, Blue
  type: 'note';
  time: number;
  y: number;
  hit: boolean;
}

export interface Judgment {
  type: 'Perfect' | 'Great' | 'Good' | 'Miss';
  score: number;
}

export class GameEngine {
  private notes: Note[] = [];
  private currentTime = 0;
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private audioElement: HTMLAudioElement | null = null;
  private startTime = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private running = false;
  
  // Game constants
  private readonly NOTE_SPEED = 150; // pixels per second
  private readonly HIT_LINE_Y = 400;
  private readonly LANE_POSITIONS = [120, 200, 280, 360]; // 4 lanes
  private readonly NOTE_SIZE = 25;
  
  // Judgment timing windows (ms) - much tighter
  private readonly PERFECT_WINDOW = 20;
  private readonly GREAT_WINDOW = 40;
  private readonly GOOD_WINDOW = 60;
  
  // Accuracy tracking
  private totalNotes = 0;
  private perfectHits = 0;
  private greatHits = 0;
  private goodHits = 0;
  private missedHits = 0;
  private onNoteResult: ((result: { judgment: Judgment; note: Note; player: number; accuracy: number }) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement, audioContext: AudioContext, gainNode: GainNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audioContext = audioContext;
    this.gainNode = gainNode;
    // Removed procedural chart; notes will be loaded from .chart files
  }
  
  private async generateChartFromFile(songId: string, difficulty: 'expert' | 'hard' | 'normal' | 'easy' = 'expert') {
    try {
      const tryLoadChart = async (path: string) => {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      };

      const candidates = [
        `/songs/${songId}/chart.chart`,
        `/songs/${songId}/waves.chart`,
        `/songs/${songId}/notes.chart`,
      ];

      let text = '';
      for (const url of candidates) {
        try {
          text = await tryLoadChart(url);
          if (text && /\[Song\]/.test(text) && /\[SyncTrack\]/.test(text)) break;
        } catch {
          // try next
        }
      }

      if (!text || !/\[Song\]/.test(text) || !/\[SyncTrack\]/.test(text)) {
        console.warn('ChartValidationFailed', { songId, reason: 'Missing [Song] or [SyncTrack] section' });
        this.notes = [];
        this.totalNotes = 0;
        return;
      }

      const { parse, convertChartToGameNotes } = await import('../lib/chartParser');
      const chart = parse(text);
      const gameNotes = convertChartToGameNotes(chart, difficulty);

      this.notes = gameNotes.map(note => ({
        ...note,
        y: -this.NOTE_SIZE
      }));

      this.totalNotes = gameNotes.length;
      this.notes.sort((a, b) => a.time - b.time);
      
      console.log('ChartLoaded', { 
        songId, 
        difficulty, 
        totalNotes: this.totalNotes,
        firstNoteTime: this.notes[0]?.time || 0,
        lastNoteTime: this.notes[this.notes.length - 1]?.time || 0
      });
    } catch (err) {
      console.error('ChartLoadError', err);
      this.notes = [];
      this.totalNotes = 0;
    }
  }
  
  start(songId?: string) {
  // Ensure only one loop is running
  if (this.running) this.stop();
  this.running = true;
  if (songId) {
      // kick off chart load and audio
      this.generateChartFromFile(songId).catch(err => console.error('ChartLoadError', err));
      this.playMusic(songId);
    }
    this.startTime = performance.now();
    
    // Start game loop
  this.rafId = requestAnimationFrame(this.gameLoop);
  }
  
  private playMusic(songId: string) {
    this.audioElement = new Audio(`/songs/${songId}/song.ogg`);
    this.audioElement.volume = 1; // use gainNode for master volume control
    
    // Connect to Web Audio API
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const source = this.audioContext.createMediaElementSource(this.audioElement);
    source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    this.audioElement.play().then(() => {
      console.log('MusicPlay', { songId, t0: this.audioContext.currentTime });
    }).catch(err => {
      console.warn('Music playback failed:', err);
    });
    
    this.audioElement.addEventListener('ended', () => {
      console.log('MusicEnd', { songId });
    });
  }
  
  setNoteResultCallback(callback: (result: { judgment: Judgment; note: Note; player: number; accuracy: number }) => void) {
    this.onNoteResult = callback;
  }
  

  private gameLoop = () => {
    if (!this.running) return;
    this.update();
    this.render();
    this.rafId = requestAnimationFrame(this.gameLoop);
  };
  
  private update() {
    this.currentTime = performance.now() - this.startTime;
    
    // Update note positions (top to bottom)
    this.notes.forEach(note => {
      if (!note.hit) {
        const timeUntilHit = note.time - this.currentTime;
        note.y = this.HIT_LINE_Y - (timeUntilHit * this.NOTE_SPEED / 1000);
        
        // Mark as missed if too far past hit line and count it
        if (note.y > this.HIT_LINE_Y + 100 && !note.hit) {
          note.hit = true;
          this.missedHits++;
          const accuracy = this.calculateAccuracy();
          
          console.log('NoteMiss', { 
            player: 1, // Default to player 1 for auto-misses
            lane: note.lane, 
            deltaMs: Math.abs(note.y - this.HIT_LINE_Y) * 1000 / this.NOTE_SPEED
          });
          console.log('AccuracyUpdated', { 
            player: 1, 
            accuracy: accuracy 
          });
          
          if (this.onNoteResult) {
            this.onNoteResult({
              judgment: { type: 'Miss', score: 0 },
              note,
              player: 1,
              accuracy
            });
          }
        }
      }
    });
  }
  
  private render() {
    // Clear canvas with dark background
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all 4 lanes
    this.LANE_POSITIONS.forEach(x => this.drawLane(x));
    
    // Draw hit line (horizontal)
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(80, this.HIT_LINE_Y);
    this.ctx.lineTo(400, this.HIT_LINE_Y);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Draw notes
    this.notes.forEach(note => {
      if (!note.hit && note.y > -this.NOTE_SIZE && note.y < this.canvas.height + this.NOTE_SIZE) {
        this.drawNote(note);
      }
    });
    
    // Draw lane indicators with retro colors
    const laneColors = ['#00ff00', '#ff0000', '#ffff00', '#0066ff'];
    const laneLabels = ['G', 'R', 'Y', 'B'];
    
    this.ctx.font = 'bold 14px "Press Start 2P"';
    this.ctx.textAlign = 'center';
    
    this.LANE_POSITIONS.forEach((x, i) => {
      this.ctx.fillStyle = laneColors[i];
      this.ctx.shadowColor = laneColors[i];
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(laneLabels[i], x, 30);
      this.ctx.shadowBlur = 0;
    });
    
    // Draw accuracy info
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.font = '10px "Press Start 2P"';
    this.ctx.fillText(`Accuracy: ${this.calculateAccuracy().toFixed(1)}%`, this.canvas.width / 2, 20);
    this.ctx.fillText(`P:${this.perfectHits} G:${this.greatHits} OK:${this.goodHits} X:${this.missedHits}`, this.canvas.width / 2, 35);
  }
  
  private drawLane(x: number) {
    // Draw lane guide line
    this.ctx.strokeStyle = '#8a2be240';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, 50);
    this.ctx.lineTo(x, this.canvas.height - 50);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  private drawNote(note: Note) {
    const x = this.LANE_POSITIONS[note.lane];
    
    // Retro arcade note colors based on lane
    const laneColors = [
      { primary: '#00ff00', secondary: '#44ff44', glow: '#00ff00' }, // Green
      { primary: '#ff0000', secondary: '#ff4444', glow: '#ff0000' }, // Red  
      { primary: '#ffff00', secondary: '#ffff44', glow: '#ffff00' }, // Yellow
      { primary: '#0066ff', secondary: '#4499ff', glow: '#0066ff' }  // Blue
    ];
    
    const colors = laneColors[note.lane];
    const shape = 'circle'; // All notes are circles
    
    // Enhanced glow effect for retro look
    this.ctx.shadowColor = colors.glow;
    this.ctx.shadowBlur = 8;
    
    // Solid pixel-style fill
    this.ctx.fillStyle = colors.primary;
    
    // Draw shape with retro styling
    this.ctx.beginPath();
    this.ctx.arc(x, note.y, this.NOTE_SIZE * 0.8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Bright retro border
    this.ctx.strokeStyle = colors.secondary;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
  
  handleInput(lane: 0 | 1 | 2 | 3, inputType: 'hit', player: number): { judgment: Judgment | null; note: Note | null; accuracy: number } {
    // Find the closest unhit note in the specified lane that matches the input type
    const laneNotes = this.notes.filter(note => 
      note.lane === lane && 
      !note.hit && 
      Math.abs(note.y - this.HIT_LINE_Y) < 80 // Tighter hit window
    );
    
    if (laneNotes.length === 0) {
      // No hittable note in this lane at the hit window.
      // Check if there's a note in the other lane within the timing window (wrong movement/hand).
      const otherLaneNotes = this.notes.filter(n =>
        n.lane !== lane && !n.hit && Math.abs(n.y - this.HIT_LINE_Y) < 80
      );

      this.missedHits++;
      const accuracy = this.calculateAccuracy();

      // If it's a wrong-lane press near a valid note, don't penalize health.
      if (otherLaneNotes.length === 0 && this.onHealthUpdate) {
        // True whiff - no health system anymore
      }

      if (this.onNoteResult) {
        this.onNoteResult({
          judgment: { type: 'Miss', score: 0 },
          note: null as unknown as Note,
          player,
          accuracy,
        });
      }

      return { judgment: { type: 'Miss', score: 0 }, note: null, accuracy };
    }
    
    // Get the closest note
    const closestNote = laneNotes.reduce((closest, note) => {
      const closestDistance = Math.abs(closest.y - this.HIT_LINE_Y);
      const noteDistance = Math.abs(note.y - this.HIT_LINE_Y);
      return noteDistance < closestDistance ? note : closest;
    });
    
    const timingError = Math.abs(closestNote.y - this.HIT_LINE_Y);
    const deltaMs = (timingError / this.NOTE_SPEED) * 1000; // Convert to milliseconds

    closestNote.hit = true;

    let judgment: Judgment;
    const baseScore = 100;
    
    // Bonus points for matching note type
    const typeMatch = closestNote.type === inputType;
    const typeBonus = typeMatch ? 1.5 : 0.8; // 50% bonus for correct type, 20% penalty for wrong type
    
    if (deltaMs <= this.PERFECT_WINDOW) {
      judgment = { type: 'Perfect', score: Math.floor(baseScore * typeBonus) };
      this.perfectHits++;
    } else if (deltaMs <= this.GREAT_WINDOW) {
      judgment = { type: 'Great', score: Math.floor(70 * typeBonus) };
      this.greatHits++;
    } else if (deltaMs <= this.GOOD_WINDOW) {
      judgment = { type: 'Good', score: Math.floor(40 * typeBonus) };
      this.goodHits++;
    } else {
      judgment = { type: 'Miss', score: 0 };
      this.missedHits++;
      
      console.log('NoteMiss', { player, lane, deltaMs });
    }
    
    const accuracy = this.calculateAccuracy();
    console.log('AccuracyUpdated', { player, accuracy });
    
    if (this.onNoteResult) {
      this.onNoteResult({ judgment, note: closestNote, player, accuracy });
    }
    
    return { judgment, note: closestNote, accuracy };
  }
  
  private calculateAccuracy(): number {
    if (this.totalNotes === 0) return 100;
    const weightedHits = (this.perfectHits * 1.0) + (this.greatHits * 0.9) + (this.goodHits * 0.8);
    return (weightedHits / this.totalNotes) * 100;
  }
  
  getStats() {
    return {
      totalNotes: this.perfectHits + this.greatHits + this.goodHits + this.missedHits,
      perfectHits: this.perfectHits,
      greatHits: this.greatHits,
      goodHits: this.goodHits,
      missedHits: this.missedHits,
      accuracy: this.calculateAccuracy()
    };
  }
  
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      console.log('MusicPause', { currentTime: this.audioElement.currentTime });
    }
  }
  
  resume() {
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  stop() {
    // Stop RAF loop
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Stop and reset audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        console.warn('AudioStopError', e);
      }
    }
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  getActiveNotes(): Note[] {
    return this.notes.filter(note => !note.hit && note.y > -50 && note.y < this.canvas.height + 50);
  }
  
  setVolume(volume: number) {
    this.gainNode.gain.value = volume;
  }
}
