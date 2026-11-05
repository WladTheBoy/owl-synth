import { midiToFreq } from "./notes";
import type { SynthParams } from "./types";

/**
 * Eine Stimme: zwei leicht gegeneinander verstimmte Oszillatoren
 * -> Tiefpassfilter -> ADSR-Gain -> Ausgang.
 */
export class Voice {
  private oscs: OscillatorNode[];
  private filter: BiquadFilterNode;
  private env: GainNode;
  private released = false;
  readonly startedAt: number;

  constructor(
    private ctx: AudioContext,
    output: AudioNode,
    readonly note: number,
    params: SynthParams,
    velocity = 1,
  ) {
    const now = ctx.currentTime;
    this.startedAt = now;
    const freq = midiToFreq(note);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = params.cutoff;
    this.filter.Q.value = params.resonance;

    this.env = ctx.createGain();
    const peak = 0.25 * velocity; // Headroom für mehrere Stimmen
    const attack = Math.max(params.attack, 0.005);
    this.env.gain.setValueAtTime(0, now);
    this.env.gain.linearRampToValueAtTime(peak, now + attack);
    // Decay Richtung Sustain-Pegel (Zeitkonstante ~ decay/3)
    this.env.gain.setTargetAtTime(
      peak * params.sustain,
      now + attack,
      Math.max(params.decay, 0.01) / 3,
    );

    this.oscs = [params.detune, -params.detune].map((cents) => {
      const osc = ctx.createOscillator();
      osc.type = params.waveform;
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(this.filter);
      osc.start(now);
      return osc;
    });

    this.filter.connect(this.env);
    this.env.connect(output);
  }

  setFilter(cutoff: number, resonance: number): void {
    const now = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.02);
    this.filter.Q.setTargetAtTime(resonance, now, 0.02);
  }

  release(releaseTime: number): void {
    if (this.released) return;
    this.released = true;
    const now = this.ctx.currentTime;
    const gain = this.env.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now); // aktuellen Pegel einfrieren
    gain.setTargetAtTime(0, now, Math.max(releaseTime, 0.01) / 3);

    const stopAt = now + releaseTime + 0.1;
    this.oscs.forEach((o) => o.stop(stopAt));
    this.oscs[0].onended = () => {
      this.oscs.forEach((o) => o.disconnect());
      this.filter.disconnect();
      this.env.disconnect();
    };
  }
}
