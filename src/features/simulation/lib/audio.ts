export interface SimulationAudio {
  playBeep: (freq: number, duration: number) => void;
  playSuccessChime: () => void;
}

/**
 * Short synthesised tones. `isMuted` is read through a callback so the running
 * physics loop always sees the current mute setting without being rebuilt.
 */
export const createAudio = (isMuted: () => boolean): SimulationAudio => {
  const playBeep = (freq: number, duration: number) => {
    if (isMuted()) return;
    try {
      const AudioCtor =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const audioCtx = new AudioCtor();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio Context failed:', e);
    }
  };

  const playSuccessChime = () => {
    playBeep(880, 0.1);
    setTimeout(() => playBeep(1320, 0.15), 100);
  };

  return { playBeep, playSuccessChime };
};
