import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { resetAllTrainerHints, useTrainerHint } from "@/lib/use-trainer-hints";

beforeEach(() => {
  localStorage.clear();
});

describe("useTrainerHint", () => {
  it("settles to unseen for a fresh id", () => {
    const { result } = renderHook(() => useTrainerHint("x"));

    expect(result.current.seen).toBe(false);
  });

  it("settles to seen when the hint marker is stored", () => {
    localStorage.setItem("ta:trainer-hint:x", "1");

    const { result } = renderHook(() => useTrainerHint("x"));

    expect(result.current.seen).toBe(true);
  });

  it("dismisses the hint and stores the seen marker", () => {
    const { result } = renderHook(() => useTrainerHint("x"));

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem("ta:trainer-hint:x")).toBe("1");
    expect(result.current.seen).toBe(true);
  });

  it("resets only trainer hint markers", () => {
    localStorage.setItem("ta:trainer-hint:x", "1");
    localStorage.setItem("ta:trainer-hint:y", "1");
    localStorage.setItem("unrelated", "1");

    resetAllTrainerHints();

    expect(localStorage.getItem("ta:trainer-hint:x")).toBeNull();
    expect(localStorage.getItem("ta:trainer-hint:y")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("1");
  });
});
