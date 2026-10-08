import type { LevelConfig } from "../content/levels";

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private muted = false;
  private breathing = false;

  async start() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.24, this.context.currentTime, 0.08);
    }
  }

  isMuted() {
    return this.muted;
  }

  setLevel(config: LevelConfig) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    if (this.ambience) {
      this.ambience.gain.setTargetAtTime(0, now, 0.45);
    }
    for (const oscillator of this.oscillators) {
      try {
        oscillator.stop(now + 1);
      } catch {
        // Already stopped.
      }
    }

    const ambience = this.context.createGain();
    ambience.gain.value = 0;
    ambience.connect(this.master);
    ambience.gain.setTargetAtTime(0.075, now, 1.4);
    this.ambience = ambience;
    this.oscillators = [];

    [0.5, 1, 1.502].forEach((ratio, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const filter = this.context!.createBiquadFilter();
      oscillator.type = index === 2 ? "sine" : "triangle";
      oscillator.frequency.value = config.frequency * ratio;
      oscillator.detune.value = index * 3.4 - 2;
      gain.gain.value = index === 0 ? 0.36 : 0.15;
      filter.type = "lowpass";
      filter.frequency.value = 620 + index * 230;
      oscillator.connect(filter).connect(gain).connect(ambience);
      oscillator.start();
      this.oscillators.push(oscillator);
    });
  }

  setBreathing(inhaling: boolean) {
    if (inhaling === this.breathing) return;
    this.breathing = inhaling;
    if (!this.context || !this.ambience) return;
    this.ambience.gain.setTargetAtTime(inhaling ? 0.11 : 0.075, this.context.currentTime, 0.5);
  }

  chime(kind: "capture" | "release" | "pulse" | "complete", frequency = 440) {
    if (!this.context || !this.master || this.muted) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (kind === "release") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 1.1);
    if (kind === "pulse") oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.8);
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "complete" ? 0.18 : 0.1, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "complete" ? 2.1 : 1.15));
    oscillator.connect(filter).connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + (kind === "complete" ? 2.2 : 1.2));
  }
}
