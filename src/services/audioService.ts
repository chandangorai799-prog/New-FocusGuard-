// Audio and Haptic feedback service for FocusGuard

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ambient Noise Generator State
interface AmbientState {
  type: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves';
  nodes: (AudioNode | number)[];
  gainNode: GainNode | null;
  isPlaying: boolean;
}

let activeAmbient: AmbientState = {
  type: 'none',
  nodes: [],
  gainNode: null,
  isPlaying: false,
};

export const AudioService = {
  // Haptic feedback (Android vibration or subtle click)
  triggerHaptic(pattern: number | number[] = 15): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignored if unsupported
    }
  },

  // Subtle tap sound for buttons
  playTap(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // ignore
    }
  },

  // Success sound (pleasant high octave chime)
  playSuccess(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
      this.triggerHaptic([30, 60]);
    } catch (e) {
      // ignore
    }
  },

  // Focus session start chime (uplifting harmonic chime)
  playFocusStart(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.9);
      });
      this.triggerHaptic([30, 40, 50]);
    } catch (e) {
      console.error(e);
    }
  },

  // Pomodoro Completion / Gong Chime
  playCompletionChime(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Rich Tibetan singing bowl / crystal bell emulation
      const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.0);
      });
      this.triggerHaptic([100, 50, 100, 50, 200]);
    } catch (e) {
      console.error(e);
    }
  },

  // Short break chime
  playBreakChime(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freqs = [440, 554.37, 659.25]; // A major
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.1, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 1.2);
      });
      this.triggerHaptic([50, 30, 80]);
    } catch (e) {
      console.error(e);
    }
  },

  // Alert chime for blocked application access attempts
  playAlert(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      this.triggerHaptic([80, 50, 80]);
    } catch (e) {
      // ignore
    }
  },

  // Notification chime
  playNotification(): void {
    this.playAlert();
  },

  // Ambient focus soundscapes
  startAmbient(type: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves', volume: number = 0.4): void {
    this.stopAmbient();
    if (type === 'none') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.3)), ctx.currentTime);
      masterGain.connect(ctx.destination);

      activeAmbient = {
        type,
        nodes: [],
        gainNode: masterGain,
        isPlaying: true,
      };

      if (type === 'binaural') {
        // 40Hz Gamma Beat (Deep Focus): 200Hz Left, 240Hz Right
        const merger = ctx.createChannelMerger(2);
        
        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);
        
        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(240, ctx.currentTime);

        const gainL = ctx.createGain();
        const gainR = ctx.createGain();
        gainL.gain.value = 0.5;
        gainR.gain.value = 0.5;

        oscL.connect(gainL);
        oscR.connect(gainR);
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);

        merger.connect(masterGain);
        oscL.start();
        oscR.start();

        activeAmbient.nodes.push(oscL, oscR, gainL, gainR, merger);
      } else if (type === 'whitenoise' || type === 'rain' || type === 'stream') {
        // Buffer-based noise generator with filter
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          if (type === 'rain' || type === 'stream') {
            // Pink/brown noise
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else {
            // White noise
            output[i] = Math.random() * 2 - 1;
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : type === 'stream' ? 'bandpass' : 'bandpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : type === 'stream' ? 1000 : 1200, ctx.currentTime);
        filter.Q.setValueAtTime(type === 'stream' ? 1.5 : 1, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        activeAmbient.nodes.push(whiteNoise, filter);
      } else if (type === 'space' || type === 'lofi') {
        // Deep space drone / warm lofi chords
        const baseFreq = type === 'space' ? 65.41 : 130.81; // C2 or C3
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime); // Perfect fifth
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'space' ? 180 : 320, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();

        activeAmbient.nodes.push(osc1, osc2, filter);
      } else if (type === 'waves') {
        // Ocean swell: modulated noise with LFO
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 10s wave cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(masterGain);

        noise.start();
        lfo.start();

        activeAmbient.nodes.push(noise, filter, lfo, lfoGain);
      }
    } catch (e) {
      console.error('Ambient audio error:', e);
    }
  },

  setAmbientVolume(volume: number): void {
    if (activeAmbient.gainNode && audioCtx) {
      const safeVol = Math.max(0, Math.min(1, volume * 0.3));
      activeAmbient.gainNode.gain.setValueAtTime(safeVol, audioCtx.currentTime);
    }
  },

  stopAmbient(): void {
    if (activeAmbient.isPlaying) {
      activeAmbient.nodes.forEach((node) => {
        try {
          if (typeof node === 'number') {
            clearInterval(node);
          } else if (node && typeof node === 'object') {
            if ('stop' in node && typeof (node as any).stop === 'function') {
              (node as any).stop();
            }
            if ('disconnect' in node && typeof (node as any).disconnect === 'function') {
              (node as any).disconnect();
            }
          }
        } catch {
          // ignore
        }
      });
      activeAmbient = {
        type: 'none',
        nodes: [],
        gainNode: null,
        isPlaying: false,
      };
    }
  },
};
