import { describe, expect, it } from "vitest";
import { keyCodeToMidi, midiToFreq, midiToName } from "./notes";

describe("notes", () => {
  it("A4 ist 440 Hz", () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  it("mittleres C ist ca. 261.63 Hz", () => {
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });

  it("eine Oktave verdoppelt die Frequenz", () => {
    expect(midiToFreq(72) / midiToFreq(60)).toBeCloseTo(2, 10);
  });

  it("Notennamen", () => {
    expect(midiToName(60)).toBe("C4");
    expect(midiToName(61)).toBe("C#4");
  });

  it("Tastatur -> MIDI abhängig von der Oktave", () => {
    expect(keyCodeToMidi("KeyA", 4)).toBe(60);
    expect(keyCodeToMidi("KeyK", 4)).toBe(72);
    expect(keyCodeToMidi("KeyA", 5)).toBe(72);
    expect(keyCodeToMidi("Digit1", 4)).toBeNull();
  });
});
