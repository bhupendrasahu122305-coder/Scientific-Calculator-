// Tactile audio feedback for calculator keypresses
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playKeyClick(type: 'num' | 'op' | 'func' | 'action' = 'num') {
  if (!soundEnabled) return;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const now = audioCtx.currentTime;

    // Different subtle frequencies for different key types, simulating physical calculator membrane
    let freq = 1200;
    let duration = 0.015;
    let volume = 0.05;

    if (type === 'action') {
      freq = 750;
      duration = 0.022;
      volume = 0.07;
    } else if (type === 'func') {
      freq = 1500;
      duration = 0.012;
      volume = 0.04;
    } else if (type === 'op') {
      freq = 1000;
      duration = 0.018;
      volume = 0.06;
    }

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}
