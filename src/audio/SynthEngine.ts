import { Voice } from "./Voice";
import { DEFAULT_PARAMS, type SynthParams } from "./types";

const MAX_VOICES = 16;

/**
 * Signalfluss:
 *   Voices -> voiceBus -> dry ----------------> master -> analyser -> out
 *                      \-> delay (+feedback) -> wet -/
 *
 * Die Engine kennt kein React; die UI ruft nur noteOn/noteOff/setParams auf.
 */
export class SynthEngine {
  private ctx: AudioContext | null = null;
  private voices = new Map<number, Voice>();
  private params: SynthParams = { ...DEFAULT_PARAMS };

  private voiceBus!: GainNode;
  private delay!: DelayNode;
  private feedback!: GainNode;
  private wet!: GainNode;
  private dry!: GainNode;
  private master!: GainNode;
  private analyser!: AnalyserNode;

  /** Muss aus einer Nutzeraktion (Klick/Tastendruck) aufgerufen werden. */
  async start(): Promise<void> {
    if (!this.ctx) this.build();
    if (this.ctx!.state === "suspended") await this.ctx!.resume();
  }

  private build(): void {
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.voiceBus = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.delay = ctx.createDelay(2);
    this.feedback = ctx.createGain();
    this.master = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    // Feedback-Schleife mit Tiefpass, damit Echos weicher werden
    const fbFilter = ctx.createBiquadFilter();
    fbFilter.type = "lowpass";
    fbFilter.frequency.value = 3500;

    this.voiceBus.connect(this.dry).connect(this.master);
    this.voiceBus.connect(this.delay);
    this.delay.connect(fbFilter).connect(this.feedback).connect(this.delay);
    this.delay.connect(this.wet).connect(this.master);
    this.master.connect(this.analyser).connect(ctx.destination);

    this.applyGlobalParams(true);
  }

  private applyGlobalParams(immediate = false): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const p = this.params;
    const set = (param: AudioParam, value: number) =>
      immediate ? (param.value = value) : param.setTargetAtTime(value, t, 0.02);
    set(this.delay.delayTime, p.delayTime);
    set(this.feedback.gain, p.delayFeedback);
    set(this.wet.gain, p.delayMix);
    set(this.dry.gain, 1 - p.delayMix * 0.5);
    set(this.master.gain, p.masterGain);
  }

  setParams(patch: Partial<SynthParams>): void {
    this.params = { ...this.params, ...patch };
    this.applyGlobalParams();
    if (patch.cutoff !== undefined || patch.resonance !== undefined) {
      this.voices.forEach((v) => v.setFilter(this.params.cutoff, this.params.resonance));
    }
  }

  getParams(): SynthParams {
    return { ...this.params };
  }

  noteOn(note: number, velocity = 1): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    this.voices.get(note)?.release(this.params.release); // Retrigger

    if (this.voices.size >= MAX_VOICES) this.stealOldest();
    this.voices.set(note, new Voice(this.ctx, this.voiceBus, note, this.params, velocity));
  }

  noteOff(note: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    voice.release(this.params.release);
    this.voices.delete(note);
  }

  allNotesOff(): void {
    [...this.voices.keys()].forEach((n) => this.noteOff(n));
  }

  private stealOldest(): void {
    let oldest: Voice | null = null;
    for (const v of this.voices.values()) {
      if (!oldest || v.startedAt < oldest.startedAt) oldest = v;
    }
    if (oldest) this.noteOff(oldest.note);
  }

  getAnalyser(): AnalyserNode | null {
    return this.ctx ? this.analyser : null;
  }
}
