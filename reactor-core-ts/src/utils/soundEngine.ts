import { SoundType, SoundEffects } from '../types/game.types';

let audioCtx: AudioContext | null = null;
let musicAudio: HTMLAudioElement | null = null;
let musicVolume = 0.3;
let sfxEnabled = true;
let musicEnabled = true;

export const SoundEngine = {
  init: (): void => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  },

  play: (frequency: number, duration: number, type: SoundType = 'sine', vol: number = 0.3): void => {
    if (!sfxEnabled) return;
    
    try {
      SoundEngine.init();
      if (!audioCtx) return;

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
      
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (e) {
      console.error(e);
    }
  },

  // Music controls
  playMusic: (src: string): void => {
    if (!musicEnabled) return;

    try {
      if (!musicAudio) {
        musicAudio = new Audio(src);
        musicAudio.loop = true;
        musicAudio.volume = musicVolume;
      }
      
      // Reset to beginning if already loaded
      musicAudio.currentTime = 0;
      musicAudio.play().catch((error) => {
        console.error('Failed to play music:', error);
      });
    } catch (e) {
      console.error('Music playback error:', e);
    }
  },

  stopMusic: (): void => {
    if (musicAudio) {
      musicAudio.pause();
      musicAudio.currentTime = 0;
    }
  },

  pauseMusic: (): void => {
    if (musicAudio) {
      musicAudio.pause();
    }
  },

  resumeMusic: (): void => {
    if (musicAudio && musicEnabled) {
      musicAudio.play().catch((error) => {
        console.error('Failed to resume music:', error);
      });
    }
  },

  setMusicVolume: (volume: number): void => {
    musicVolume = Math.max(0, Math.min(1, volume));
    if (musicAudio) {
      musicAudio.volume = musicVolume;
    }
  },

  setSfxEnabled: (enabled: boolean): void => {
    sfxEnabled = enabled;
  },

  setMusicEnabled: (enabled: boolean): void => {
    musicEnabled = enabled;
    if (!enabled && musicAudio) {
      musicAudio.pause();
    } else if (enabled && musicAudio && musicAudio.paused) {
      musicAudio.play().catch((error) => {
        console.error('Failed to enable music:', error);
      });
    }
  },

  isMusicPlaying: (): boolean => {
    return musicAudio !== null && !musicAudio.paused;
  },

  effects: {
    cardTap: (): void => {
      SoundEngine.play(600, 0.1, 'sine');
      setTimeout(() => SoundEngine.play(800, 0.1, 'sine'), 50);
    },
    
    stream: (): void => {
      SoundEngine.play(300, 0.15, 'sine', 0.1);
    },
    
    antimatterHit: (): void => {
      SoundEngine.play(150, 0.2, 'sawtooth', 0.2);
    },
    
    matterHit: (): void => {
      SoundEngine.play(500, 0.2, 'sine', 0.2);
    },
    
    balance: (): void => {
      [261, 329, 392, 523, 659].forEach((f, i) => 
        setTimeout(() => SoundEngine.play(f, 0.8, 'sine'), i * 100)
      );
    },
    
    victory: (): void => {
      [523, 659, 783, 1046].forEach((f, i) => 
        setTimeout(() => SoundEngine.play(f, 0.4, 'triangle'), i * 150)
      );
    },
    
    undo: (): void => {
      SoundEngine.play(400, 0.15, 'triangle');
      setTimeout(() => SoundEngine.play(300, 0.15, 'triangle'), 100);
    }
  } as SoundEffects
};
