// Audio and Haptic feedback service for FocusGuard

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.error('AudioContext initialization error:', e);
  }
  return audioCtx;
}

// Ambient Noise Generator State
interface AmbientState {
  type: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves';
  nodes: (AudioNode | number)[];
  gainNode: GainNode | null;
  isPlaying: boolean;
  intervalIds: number[];
}

let activeAmbient: AmbientState = {
  type: 'none',
  nodes: [],
  gainNode: null,
  isPlaying: false,
  intervalIds: [],
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
      if (ctx.state === 'suspended') ctx.resume();
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
      if (ctx.state === 'suspended') ctx.resume();
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
      if (ctx.state === 'suspended') ctx.resume();
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
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
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
      if (ctx.state === 'suspended') ctx.resume();
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
      if (ctx.state === 'suspended') ctx.resume();
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

  // Ambient focus soundscapes (Synthesized Zero-Bandwidth Audio)
  startAmbient(type: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves', volume: number = 0.5): void {
    this.stopAmbient();
    if (type === 'none') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const masterGain = ctx.createGain();
      // Scaled for comfortable listening on mobile speakers and headphones
      const safeVolume = Math.max(0.05, Math.min(1, volume)) * 0.75;
      masterGain.gain.setValueAtTime(safeVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      activeAmbient = {
        type,
        nodes: [],
        gainNode: masterGain,
        isPlaying: true,
        intervalIds: [],
      };

      if (type === 'binaural') {
        // 40Hz Gamma Wave Focus: 432Hz Fundamental Carrier + 472Hz Gamma (40Hz differential) + Warm Sub-harmonic
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(432, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(472, ctx.currentTime);

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(216, ctx.currentTime);

        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const subGain = ctx.createGain();

        gain1.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        subGain.gain.setValueAtTime(0.2, ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        osc1.connect(gain1);
        gain1.connect(merger, 0, 0);

        osc2.connect(gain2);
        gain2.connect(merger, 0, 1);

        subOsc.connect(subGain);
        subGain.connect(masterGain);
        merger.connect(masterGain);

        osc1.start();
        osc2.start();
        subOsc.start();

        activeAmbient.nodes.push(osc1, osc2, subOsc, gain1, gain2, subGain, merger);
      } else if (type === 'lofi') {
        // Lo-Fi Study Chords Progression (Dm9 -> G13 -> Cmaj9 -> Am9)
        const chordProgressions = [
          [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9 (D4, F4, A4, C5, E5)
          [392.0, 493.88, 587.33, 659.25, 783.99], // G13 (G4, B4, D5, E5, G5)
          [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9 (C4, E4, G4, B4, D5)
          [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9 (A3, C4, E4, G4, B4)
        ];

        let chordIndex = 0;

        const playChord = () => {
          if (!activeAmbient.isPlaying || activeAmbient.type !== 'lofi' || !audioCtx) return;
          const currentCtx = audioCtx;
          const chord = chordProgressions[chordIndex % chordProgressions.length];
          chordIndex++;

          chord.forEach((freq, idx) => {
            const osc = currentCtx.createOscillator();
            const noteGain = currentCtx.createGain();
            const filter = currentCtx.createBiquadFilter();

            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, currentCtx.currentTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, currentCtx.currentTime);

            noteGain.gain.setValueAtTime(0.001, currentCtx.currentTime);
            noteGain.gain.linearRampToValueAtTime(0.06, currentCtx.currentTime + 0.4);
            noteGain.gain.exponentialRampToValueAtTime(0.001, currentCtx.currentTime + 3.8);

            osc.connect(filter);
            filter.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(currentCtx.currentTime);
            osc.stop(currentCtx.currentTime + 3.9);
          });
        };

        // Vinyl Warm Crackle/Noise
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.015;
          if (Math.random() < 0.0008) {
            data[i] += (Math.random() * 2 - 1) * 0.35; // Vinyl pop
          }
        }
        const vinylNoise = ctx.createBufferSource();
        vinylNoise.buffer = buffer;
        vinylNoise.loop = true;
        const vinylFilter = ctx.createBiquadFilter();
        vinylFilter.type = 'bandpass';
        vinylFilter.frequency.setValueAtTime(1400, ctx.currentTime);
        vinylNoise.connect(vinylFilter);
        vinylFilter.connect(masterGain);
        vinylNoise.start();

        activeAmbient.nodes.push(vinylNoise, vinylFilter);

        // Start first chord immediately & loop every 4s
        playChord();
        const chordTimer = window.setInterval(playChord, 4000);
        activeAmbient.intervalIds.push(chordTimer);
      } else if (type === 'rain') {
        // Soothing Rain (Multi-layer Pink noise + High resonance drop generator)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
          b6 = white * 0.115926;
        }

        const rainNoise = ctx.createBufferSource();
        rainNoise.buffer = buffer;
        rainNoise.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);

        rainNoise.connect(rainFilter);
        rainFilter.connect(masterGain);
        rainNoise.start();

        activeAmbient.nodes.push(rainNoise, rainFilter);
      } else if (type === 'waves') {
        // Rhythmic Ocean Surf (Dual LFO Modulated Pink Noise)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 2.8;
        }

        const surfSource = ctx.createBufferSource();
        surfSource.buffer = buffer;
        surfSource.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.setValueAtTime(450, ctx.currentTime);
        waveFilter.Q.setValueAtTime(2.0, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3s wave swell cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(380, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(waveFilter.frequency);

        surfSource.connect(waveFilter);
        waveFilter.connect(masterGain);

        surfSource.start();
        lfo.start();

        activeAmbient.nodes.push(surfSource, waveFilter, lfo, lfoGain);
      } else if (type === 'whitenoise') {
        // Smooth White / Pink Noise Bed
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(0.6, ctx.currentTime);

        noise.connect(noiseFilter);
        noiseFilter.connect(masterGain);
        noise.start();

        activeAmbient.nodes.push(noise, noiseFilter);
      } else if (type === 'space') {
        // Celestial Deep Space Drone (Warm Detuned Layered Chords)
        const notes = [130.81, 196.0, 261.63, 329.63]; // C3, G3, C4, E4
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq + (idx * 0.3), ctx.currentTime); // Subtle chorus detune

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, ctx.currentTime);

          gain.gain.setValueAtTime(0.25, ctx.currentTime);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          osc.start();

          activeAmbient.nodes.push(osc, filter, gain);
        });
      } else if (type === 'stream') {
        // Mountain Stream / Babbling Brook
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.4;
        }

        const streamSource = ctx.createBufferSource();
        streamSource.buffer = buffer;
        streamSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);
        filter.Q.setValueAtTime(2.2, ctx.currentTime);

        streamSource.connect(filter);
        filter.connect(masterGain);
        streamSource.start();

        activeAmbient.nodes.push(streamSource, filter);
      }
    } catch (e) {
      console.error('Ambient audio startup error:', e);
    }
  },

  setAmbientVolume(volume: number): void {
    if (activeAmbient.gainNode && audioCtx) {
      const safeVolume = Math.max(0, Math.min(1, volume)) * 0.75;
      activeAmbient.gainNode.gain.setValueAtTime(safeVolume, audioCtx.currentTime);
    }
  },

  isAmbientPlaying(): boolean {
    return activeAmbient.isPlaying && activeAmbient.type !== 'none';
  },

  getActiveAmbientType(): string {
    return activeAmbient.type;
  },

  stopAmbient(): void {
    if (activeAmbient.isPlaying || activeAmbient.nodes.length > 0) {
      // Clear any chord timers
      activeAmbient.intervalIds.forEach((id) => clearInterval(id));

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
        intervalIds: [],
      };
    }
  },
};
