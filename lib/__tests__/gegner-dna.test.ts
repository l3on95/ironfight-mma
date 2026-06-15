import { describe, expect, it } from "vitest";

import {
  DNA_CATEGORIES,
  DNA_QUESTION_BY_ID,
  DNA_TOTAL_QUESTIONS,
  isAnswered,
  answeredQuestions,
  answeredCount,
  totalAnswered,
  isDnaEmpty,
  pruneAnswers,
  type GegnerDnaAnswers,
} from "@/lib/gegner-dna";

const allQuestionIds = DNA_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => q.id),
);

describe("DNA-Schema-Integrität", () => {
  it("hält alle Frage-IDs global eindeutig", () => {
    // Stabile, eindeutige IDs sind kritisch: Duplikate würden den Lookup-Map
    // und damit bestehende Gegnerprofile zerstören.
    expect(new Set(allQuestionIds).size).toBe(allQuestionIds.length);
  });

  it("zählt DNA_TOTAL_QUESTIONS und die Lookup-Map konsistent", () => {
    expect(DNA_TOTAL_QUESTIONS).toBe(allQuestionIds.length);
    expect(DNA_QUESTION_BY_ID.size).toBe(allQuestionIds.length);
  });

  it("findet jede Frage über ihre ID in der Lookup-Map", () => {
    for (const cat of DNA_CATEGORIES) {
      for (const q of cat.questions) {
        expect(DNA_QUESTION_BY_ID.get(q.id)).toBe(q);
      }
    }
  });
});

describe("isAnswered", () => {
  it("wertet nur nicht-leeren Text als beantwortet", () => {
    expect(isAnswered("Jab")).toBe(true);
    expect(isAnswered("  x  ")).toBe(true);
    expect(isAnswered("")).toBe(false);
    expect(isAnswered("   ")).toBe(false);
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered(null)).toBe(false);
  });
});

describe("answeredQuestions / answeredCount", () => {
  const cat = DNA_CATEGORIES[0];

  it("liefert nur beantwortete Fragen in Kategorie-Reihenfolge und trimmt", () => {
    const answers: GegnerDnaAnswers = {
      [cat.questions[0].id]: "  schneller Konter  ",
      [cat.questions[2].id]: "geht rückwärts",
      // questions[1] absichtlich leer → muss rausfallen
      [cat.questions[1].id]: "   ",
    };

    const result = answeredQuestions(cat, answers);
    expect(result).toEqual([
      { question: cat.questions[0], value: "schneller Konter" },
      { question: cat.questions[2], value: "geht rückwärts" },
    ]);
    expect(answeredCount(cat, answers)).toBe(2);
  });

  it("liefert eine leere Liste, wenn nichts beantwortet ist", () => {
    expect(answeredQuestions(cat, {})).toEqual([]);
    expect(answeredCount(cat, {})).toBe(0);
  });
});

describe("totalAnswered / isDnaEmpty", () => {
  it("summiert beantwortete Fragen über alle Kategorien", () => {
    const answers: GegnerDnaAnswers = {
      [DNA_CATEGORIES[0].questions[0].id]: "a",
      [DNA_CATEGORIES[1].questions[0].id]: "b",
      [DNA_CATEGORIES[1].questions[1].id]: "  ", // zählt nicht
    };
    expect(totalAnswered(answers)).toBe(2);
    expect(isDnaEmpty(answers)).toBe(false);
  });

  it("behandelt fehlende / leere DNA als leer", () => {
    expect(isDnaEmpty(undefined)).toBe(true);
    expect(isDnaEmpty(null)).toBe(true);
    expect(isDnaEmpty({})).toBe(true);
    expect(isDnaEmpty({ x: "  ", y: "" })).toBe(true);
  });
});

describe("pruneAnswers", () => {
  it("entfernt leere Antworten und trimmt die verbleibenden", () => {
    const pruned = pruneAnswers({
      a: "Jab",
      b: "   ",
      c: "  Cross  ",
      d: "",
    });
    expect(pruned).toEqual({ a: "Jab", c: "Cross" });
  });

  it("erzeugt ein neues Objekt (mutiert die Eingabe nicht)", () => {
    const input: GegnerDnaAnswers = { a: "  x  " };
    const pruned = pruneAnswers(input);
    expect(pruned).not.toBe(input);
    expect(input.a).toBe("  x  ");
    expect(pruned.a).toBe("x");
  });
});
