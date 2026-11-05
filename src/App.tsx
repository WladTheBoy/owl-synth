import { useCallback, useEffect, useRef, useState } from "react";
import { SynthEngine } from "./audio/SynthEngine";
import { DEFAULT_PARAMS, type SynthParams, type Waveform } from "./audio/types";
import { keyCodeToMidi, midiToName } from "./audio/notes";
import { Scope } from "./Scope";

const WAVEFORMS: Waveform[] = ["sawtooth", "square", "triangle", "sine"];
const BLACK_KEYS: Record<number, number> = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 }; // Halbton -> Grenze zw. weißen Tasten
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11, 12];

interface SliderDef {
  key: keyof SynthParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: "detune", label: "Detune (Cent)", min: 0, max: 40, step: 1 },
  { key: "cutoff", label: "Filter (Hz)", min: 200, max: 8000, step: 10 },
  { key: "resonance", label: "Resonanz", min: 0.1, max: 12, step: 0.1 },
  { key: "attack", label: "Attack (s)", min: 0.005, max: 2, step: 0.005 },
  { key: "release", label: "Release (s)", min: 0.05, max: 4, step: 0.05 },
  { key: "delayMix", label: "Delay-Anteil", min: 0, max: 1, step: 0.01 },
  { key: "delayFeedback", label: "Delay-Feedback", min: 0, max: 0.9, step: 0.01 },
];

export function App() {
  const engine = useRef(new SynthEngine());
  const [started, setStarted] = useState(false);
  const [octave, setOctave] = useState(4);
  const [params, setParams] = useState<SynthParams>(DEFAULT_PARAMS);
  const [active, setActive] = useState<Set<number>>(new Set());
  const octaveRef = useRef(octave);
  octaveRef.current = octave;

  const press = useCallback((note: number) => {
    engine.current.noteOn(note);
    setActive((s) => new Set(s).add(note));
  }, []);

  const lift = useCallback((note: number) => {
    engine.current.noteOff(note);
    setActive((s) => {
      const next = new Set(s);
      next.delete(note);
      return next;
    });
  }, []);

  const start = async () => {
    await engine.current.start();
    setStarted(true);
  };

  // Computertastatur
  useEffect(() => {
    if (!started) return;
    // Merkt sich, welche Note zu welcher Taste gehört (falls die Oktave während des Haltens wechselt)
    const held = new Map<string, number>();

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "ArrowLeft") return setOctave((o) => Math.max(1, o - 1));
      if (e.code === "ArrowRight") return setOctave((o) => Math.min(7, o + 1));
      const note = keyCodeToMidi(e.code, octaveRef.current);
      if (note === null) return;
      held.set(e.code, note);
      press(note);
    };
    const up = (e: KeyboardEvent) => {
      const note = held.get(e.code);
      if (note === undefined) return;
      held.delete(e.code);
      lift(note);
    };
    const blur = () => {
      engine.current.allNotesOff();
      held.clear();
      setActive(new Set());
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [started, press, lift]);

  const update = <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
    engine.current.setParams({ [key]: value });
  };

  const base = (octave + 1) * 12;
  const getAnalyser = useCallback(() => engine.current.getAnalyser(), []);

  const keyHandlers = (note: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      press(note);
    },
    onPointerUp: () => lift(note),
    onPointerCancel: () => lift(note),
  });

  return (
    <main className="app">
      <header>
        <h1>Owl Synth</h1>
        <p>Ein Web-Synthesizer für schwebende Klänge.</p>
      </header>

      {!started ? (
        <button className="start" onClick={start}>
          Klang starten
        </button>
      ) : (
        <>
          <Scope getAnalyser={getAnalyser} />

          <section className="panel">
            <div className="control">
              <span>Wellenform</span>
              <div className="segmented">
                {WAVEFORMS.map((w) => (
                  <button
                    key={w}
                    className={params.waveform === w ? "on" : ""}
                    onClick={() => update("waveform", w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            {SLIDERS.map((s) => (
              <label key={s.key} className="control">
                <span>
                  {s.label}: {Number(params[s.key]).toFixed(s.step < 0.1 ? 2 : s.step < 1 ? 1 : 0)}
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={params[s.key] as number}
                  onChange={(e) => update(s.key, Number(e.target.value) as never)}
                />
              </label>
            ))}
          </section>

          <section className="keyboard" aria-label="Klaviatur">
            {WHITE_KEYS.map((semi) => (
              <button
                key={semi}
                className={`white ${active.has(base + semi) ? "on" : ""}`}
                {...keyHandlers(base + semi)}
              >
                {midiToName(base + semi)}
              </button>
            ))}
            {Object.entries(BLACK_KEYS).map(([semi, boundary]) => (
              <button
                key={semi}
                className={`black ${active.has(base + Number(semi)) ? "on" : ""}`}
                style={{ left: `calc(${(boundary / WHITE_KEYS.length) * 100}% - 3.5%)` }}
                aria-label={midiToName(base + Number(semi))}
                {...keyHandlers(base + Number(semi))}
              />
            ))}
          </section>

          <p className="hint">
            Spielen mit A W S E D F T G Y H U J K O L &nbsp;·&nbsp; Oktave {octave} (←/→ wechselt)
          </p>
        </>
      )}
    </main>
  );
}
