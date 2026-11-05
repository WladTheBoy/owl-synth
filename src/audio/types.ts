export type Waveform = Exclude<OscillatorType, "custom">;

export interface SynthParams {
  waveform: Waveform;
  /** Verstimmung der beiden Oszillatoren gegeneinander, in Cent */
  detune: number;
  /** Hüllkurve in Sekunden (sustain: 0..1) */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /** Tiefpassfilter */
  cutoff: number;
  resonance: number;
  /** Delay */
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  masterGain: number;
}

export const DEFAULT_PARAMS: SynthParams = {
  waveform: "sawtooth",
  detune: 8,
  attack: 0.02,
  decay: 0.25,
  sustain: 0.6,
  release: 0.8,
  cutoff: 2400,
  resonance: 1.5,
  delayTime: 0.375,
  delayFeedback: 0.4,
  delayMix: 0.3,
  masterGain: 0.7,
};
