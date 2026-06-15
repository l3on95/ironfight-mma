import { describe, expect, it } from "vitest";

import {
  greetingKind,
  greetingFor,
  trainerGreetingFor,
} from "@/lib/greeting";

/** Date mit fixer lokaler Stunde/Minute — der einzige Input von greetingKind. */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 0, 1, hour, minute);
}

describe("greetingKind", () => {
  it("ordnet die Tagesfenster korrekt zu", () => {
    expect(greetingKind(at(5))).toBe("morning");
    expect(greetingKind(at(8))).toBe("morning");
    expect(greetingKind(at(12))).toBe("day");
    expect(greetingKind(at(15))).toBe("day");
    expect(greetingKind(at(18))).toBe("evening");
    expect(greetingKind(at(20))).toBe("evening");
    expect(greetingKind(at(22))).toBe("night");
    expect(greetingKind(at(2))).toBe("night");
  });

  it("trifft die Fenstergrenzen exakt", () => {
    expect(greetingKind(at(4, 59))).toBe("night");
    expect(greetingKind(at(5, 0))).toBe("morning");
    expect(greetingKind(at(11, 59))).toBe("morning");
    expect(greetingKind(at(12, 0))).toBe("day");
    expect(greetingKind(at(17, 59))).toBe("day");
    expect(greetingKind(at(18, 0))).toBe("evening");
    expect(greetingKind(at(21, 59))).toBe("evening");
    expect(greetingKind(at(22, 0))).toBe("night");
    expect(greetingKind(at(0, 0))).toBe("night");
  });
});

describe("greetingFor", () => {
  it("baut die zeitabhängige Begrüßung mit Namen", () => {
    expect(greetingFor("Max", at(8))).toBe("Guten Morgen, Max");
    expect(greetingFor("Max", at(14))).toBe("Guten Tag, Max");
    expect(greetingFor("Max", at(19))).toBe("Guten Abend, Max");
    expect(greetingFor("Max", at(23))).toBe("Ready for ur Night Workout, Max?");
  });

  it("fällt ohne Namen auf 'Flex' zurück und trimmt", () => {
    expect(greetingFor(null, at(8))).toBe("Guten Morgen, Flex");
    expect(greetingFor(undefined, at(8))).toBe("Guten Morgen, Flex");
    expect(greetingFor("   ", at(8))).toBe("Guten Morgen, Flex");
    expect(greetingFor("  Max  ", at(8))).toBe("Guten Morgen, Max");
  });
});

describe("trainerGreetingFor", () => {
  it("nutzt den Trainer-Ton je Tagesfenster", () => {
    expect(trainerGreetingFor("Sam", at(8))).toBe(
      "Guten Morgen, Sam — der Tag gehört dir.",
    );
    expect(trainerGreetingFor("Sam", at(14))).toBe("Sam — forme dein Team.");
    expect(trainerGreetingFor("Sam", at(19))).toBe(
      "Sam — was hast du heute bewegt?",
    );
    expect(trainerGreetingFor("Sam", at(23))).toBe(
      "Sam — auch die Besten schlafen.",
    );
  });

  it("fällt ohne Namen auf 'Coach' zurück", () => {
    expect(trainerGreetingFor(null, at(14))).toBe("Coach — forme dein Team.");
    expect(trainerGreetingFor("  ", at(14))).toBe("Coach — forme dein Team.");
  });
});
