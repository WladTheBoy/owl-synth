/** MIDI-Notennummer -> Frequenz in Hz (A4 = MIDI 69 = 440 Hz) */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToName(note: number): string {
  return `${NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

/**
 * Computertastatur -> Halbtöne ab C.
 * Wir nutzen KeyboardEvent.code (physische Taste), damit das Layout
 * auch auf QWERTZ (Y/Z vertauscht) identisch funktioniert.
 */
export const KEY_TO_SEMITONE: Record<string, number> = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6,
  KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14,
};

/** octave: 4 -> mittleres C (MIDI 60) */
export function keyCodeToMidi(code: string, octave: number): number | null {
  const semitone = KEY_TO_SEMITONE[code];
  if (semitone === undefined) return null;
  return (octave + 1) * 12 + semitone;
}
