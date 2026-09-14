// Enhanced Ergonomic Web Audio System
// Provides warm, ear-friendly, non-fatiguing synthesized audio with multiple profiles and volume control.

export type SoundProfile = 'organic' | 'modern' | 'tactile';

interface StoredSoundSettings {
  enabled: boolean;
  volume: number;
  profile: SoundProfile;
}

const SETTINGS_KEY = 'pioneering_sound_settings';

function loadSettings(): StoredSoundSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.55,
        profile: ['organic', 'modern', 'tactile'].includes(parsed.profile) ? parsed.profile : 'organic',
      };
    }
  } catch {
    // ignore
  }
  return {
    enabled: true,
    volume: 0.55,
    profile: 'organic',
  };
}

const currentSettings = loadSettings();

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  } catch {
    // ignore
  }
}

function initAudio(): AudioContext | null {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(currentSettings.volume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getMasterOutput(): GainNode | null {
  initAudio();
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(currentSettings.volume, audioCtx.currentTime);
  }
  return masterGain;
}

// Helper: Generate soft pink-ish noise buffer (warm, smooth, no harsh white screech)
let cachedNoiseBuffer: AudioBuffer | null = null;
function getSmoothNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 0.3; // 300ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise filter approximation (Paul Kellet's filter)
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    const pink = (b0 + b1 + b2 + white * 0.5362) * 0.2;
    data[i] = pink;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

export const Sounds = {
  setEnabled(enabled: boolean) {
    currentSettings.enabled = enabled;
    saveSettings();
  },

  getEnabled(): boolean {
    return currentSettings.enabled;
  },

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    currentSettings.volume = clamped;
    if (audioCtx && masterGain) {
      masterGain.gain.setTargetAtTime(clamped, audioCtx.currentTime, 0.015);
    }
    saveSettings();
  },

  getVolume(): number {
    return currentSettings.volume;
  },

  setProfile(profile: SoundProfile) {
    currentSettings.profile = profile;
    saveSettings();
  },

  getProfile(): SoundProfile {
    return currentSettings.profile;
  },

  /**
   * Sound 1: Wood Tap / Placement (formerly playThud)
   * Was: 140Hz -> 30Hz heavy muddy sub-bass boom (uncomfortable).
   * Now: Warm acoustic wooden dowel tap / tactile wood snap. Light, organic, zero ear pressure.
   */
  playThud() {
    this.playWoodTap();
  },

  playWoodTap() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const profile = currentSettings.profile;

    if (profile === 'organic') {
      // Warm marimba / acoustic wood dowel knock
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1900, t);

      // Fundamental warm body
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.06);

      // Subtle hollow wood overtone
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(880, t);
      harmonic.frequency.exponentialRampToValueAtTime(640, t + 0.04);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(filter);
      harmonic.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 0.07);
      harmonic.stop(t + 0.07);
    } else if (profile === 'modern') {
      // Clean modern tactile pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.045);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.055);
    } else {
      // Tactile mechanical key settle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.035);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.045);
    }
  },

  /**
   * Sound 2: Rope / Lashing Tying (playLash)
   * Was: White noise into high resonance Q=4 bandpass (screeching static).
   * Now: Smooth fibrous hemp cord cinch / sliding rope tension.
   */
  playLash() {
    this.playRope();
  },

  playRope() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const profile = currentSettings.profile;

    if (profile === 'organic') {
      // Silky pink noise cord cinch + gentle micro-harmonic tightening
      const noise = ctx.createBufferSource();
      noise.buffer = getSmoothNoiseBuffer(ctx);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.4, t);
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(1350, t + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      // Dual tone cord tension stretch
      const tone = ctx.createOscillator();
      const toneGain = ctx.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(340, t);
      tone.frequency.exponentialRampToValueAtTime(460, t + 0.08);
      toneGain.gain.setValueAtTime(0.035, t);
      toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      tone.connect(toneGain);
      toneGain.connect(dest);

      noise.start(t);
      tone.start(t);
      noise.stop(t + 0.1);
      tone.stop(t + 0.1);
    } else if (profile === 'modern') {
      // Soft airy zip / micro-swoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.07);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.08);
    } else {
      // Subtle ratchet / strap cinch click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.055);
    }
  },

  /**
   * Sound 3: Smart Snap / Alignment (playSnap)
   * Was: 300Hz -> 150Hz dull sine drop.
   * Now: Crisp magnetic micro-chime / lock. Instant clarity, zero heaviness.
   */
  playSnap() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const profile = currentSettings.profile;

    if (profile === 'organic') {
      // Delicate wooden notch snap (crisp peg into hole)
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.035);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(1110, t);
      harmonic.frequency.exponentialRampToValueAtTime(1380, t + 0.03);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(dest);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 0.05);
      harmonic.stop(t + 0.05);
    } else if (profile === 'modern') {
      // Figma / Apple style airy magnetic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(988, t); // B5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318, t + 0.015); // E6

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t + 0.015);
      osc1.stop(t + 0.06);
      osc2.stop(t + 0.06);
    } else {
      // Tactile latch tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.025);

      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.035);
    }
  },

  /**
   * Sound 4: UI Micro Click (playClick)
   * Was: 700Hz sine beep (microwave button).
   * Now: Soft modern haptic micro-pop / gentle tactile tap.
   */
  playClick() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const profile = currentSettings.profile;

    if (profile === 'organic') {
      // Soft woodblock micro-tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.018);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.022);
    } else if (profile === 'modern') {
      // Ultra-refined soft haptic tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.014);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.016);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.018);
    } else {
      // Crisp mechanical key tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.017);
    }
  },

  /**
   * Sound 5: Physical Structure Collapse (playCollapse)
   * Was: 6 rapid oscillators down to 25Hz sub-bass (earthquake drone).
   * Now: Cascading gentle wooden dowel clatters. Realistic and soft on ears.
   */
  playCollapse() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    let t = ctx.currentTime;
    const pitches = [340, 420, 290, 480, 360];

    for (let i = 0; i < pitches.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitches[i], t);
      osc.frequency.exponentialRampToValueAtTime(pitches[i] * 0.7, t + 0.05);

      gain.gain.setValueAtTime(0.14 - i * 0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.065);

      t += 0.05 + Math.random() * 0.04;
    }
  },

  /**
   * Sound 6: Success / Action Complete (playSuccess)
   * Uplifting harmonic micro-arpeggio.
   */
  playSuccess() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.08, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  },

  /**
   * Sound 7: Delete / Dissolve (playDelete)
   * Soft descending dissolve.
   */
  playDelete() {
    if (!currentSettings.enabled) return;
    const ctx = initAudio();
    const dest = getMasterOutput();
    if (!ctx || !dest) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.07);
  },

  /**
   * Preview a specific sound by key
   */
  preview(soundKey: 'click' | 'wood' | 'rope' | 'snap' | 'collapse' | 'success') {
    initAudio();
    switch (soundKey) {
      case 'click':
        this.playClick();
        break;
      case 'wood':
        this.playWoodTap();
        break;
      case 'rope':
        this.playRope();
        break;
      case 'snap':
        this.playSnap();
        break;
      case 'collapse':
        this.playCollapse();
        break;
      case 'success':
        this.playSuccess();
        break;
    }
  }
};
