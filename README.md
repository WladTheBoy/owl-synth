# Owl Synth

Web-Synthesizer auf Basis der Web Audio API (React + TypeScript + Vite).

Die Klänge sind von Owl City inspiriert: funkelnde Arpeggios, glockige Plucks und weich schwebende Pads. Alles wird live per Synthese erzeugt, es kommen keine Samples oder Aufnahmen aus Owl-City-Songs zum Einsatz. Owl City hat mit diesem Projekt nichts zu tun, es ist ein Fan-Projekt.

## Start

```bash
bun install
bun run dev      # Entwicklungsserver
bun run test     # Unit-Tests (Vitest)
bun run build    # Typecheck + Produktions-Build
```

## Architektur

- `src/audio/` – Audio-Engine, komplett ohne React
  - `SynthEngine.ts` – Signalfluss, Polyphonie, globale Parameter (Delay, Master)
  - `Voice.ts` – eine Stimme: 2 Oszillatoren → Filter → ADSR
  - `notes.ts` – MIDI/Frequenz/Tastatur-Mapping (getestet)
- `src/App.tsx` – UI (Tastatur, Regler), `src/Scope.tsx` – Oszilloskop

## Signalfluss

```
Voices → voiceBus → dry ─────────────────→ master → analyser → out
                  └→ delay (+ Feedback) → wet ┘
```

## Roadmap

- [ ] Reverb (ConvolverNode mit generiertem Impulse Response)
- [ ] Arpeggiator
- [ ] Presets
- [ ] Web MIDI
- [ ] Mehr Sound-Typen (FM-Glocken, Pad)
# owl-synth
