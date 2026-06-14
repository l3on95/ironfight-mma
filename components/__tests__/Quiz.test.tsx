import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Quiz } from "@/components/Quiz";
import type { QuizQuestion } from "@/lib/quiz-data";

const questions: QuizQuestion[] = [
  {
    question: "Welche Technik ist im MMA erlaubt?",
    options: ["Kopfstoß", "Armbar aus der Guard", "Tritt in die Leiste"],
    correct: 1,
    explanation: "Der Armbar aus der Guard ist eine erlaubte Submission.",
  },
  {
    question: "Wie viele Punkte gibt ein BJJ-Takedown?",
    options: ["1 Punkt", "2 Punkte", "4 Punkte"],
    correct: 1,
    explanation: "Ein Takedown gibt im BJJ 2 Punkte.",
  },
];

describe("Quiz", () => {
  it("enables submit after all questions are answered, shows results, and resets", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={questions} />);

    const submit = screen.getByRole("button", { name: "Quiz auswerten" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Armbar aus der Guard/ }));
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /1 Punkt/ }));
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText(/✓ Richtig!/)).toBeInTheDocument();
    expect(screen.getByText(/✗ Falsch\./)).toBeInTheDocument();
    expect(
      screen.getByText("Der Armbar aus der Guard ist eine erlaubte Submission."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ein Takedown gibt im BJJ 2 Punkte.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nochmal versuchen" }));

    expect(screen.getByRole("button", { name: "Quiz auswerten" })).toBeDisabled();
    expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
    expect(screen.queryByText(/✓ Richtig!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/✗ Falsch\./)).not.toBeInTheDocument();
  });
});
