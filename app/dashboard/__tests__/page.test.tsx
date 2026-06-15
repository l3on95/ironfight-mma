import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// Keep the real computeStats; stub only the Firestore fetch.
vi.mock("@/lib/workouts", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/workouts")>();
  return { ...actual, getRecentWorkouts: vi.fn() };
});
vi.mock("@/lib/technique-analytics", () => ({ getTopTechniques: vi.fn() }));
vi.mock("@/lib/training-sessions", () => ({ getSessionCountForWeek: vi.fn() }));

import { getRecentWorkouts } from "@/lib/workouts";
import { getTopTechniques } from "@/lib/technique-analytics";
import { getSessionCountForWeek } from "@/lib/training-sessions";

const getRecentWorkoutsMock = vi.mocked(getRecentWorkouts);
const getTopTechniquesMock = vi.mocked(getTopTechniques);
const getSessionCountForWeekMock = vi.mocked(getSessionCountForWeek);

type AuthValue = ReturnType<typeof useAuth>;
const useAuthMock = vi.mocked(useAuth);

function makeAuthValue(overrides: Partial<AuthValue>): AuthValue {
  return {
    user: null,
    profile: null,
    loading: false,
    profileLoading: false,
    redirectError: null,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPassword: vi.fn(),
    logOut: vi.fn(),
    updateDisplayName: vi.fn(),
    finishOnboarding: vi.fn(),
    finishTrainerOnboarding: vi.fn(),
    refreshProfile: vi.fn(),
    refreshRole: vi.fn(),
    ...overrides,
  } as AuthValue;
}

function authFor(role: "user" | "trainer" | "admin"): AuthValue {
  return makeAuthValue({
    user: { uid: "user-1" } as AuthValue["user"],
    profile: {
      uid: "user-1",
      role,
      displayName: "Test",
    } as AuthValue["profile"],
    loading: false,
    profileLoading: false,
  });
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage — athlete view", () => {
  it("shows a loading skeleton while workouts are pending", () => {
    useAuthMock.mockReturnValue(authFor("user"));
    getRecentWorkoutsMock.mockReturnValue(new Promise<never[]>(() => {}));

    const { container } = renderPage();

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(
      screen.queryByText("Daten konnten nicht geladen werden"),
    ).not.toBeInTheDocument();
  });

  it("renders the empty-state when there are no sessions", async () => {
    useAuthMock.mockReturnValue(authFor("user"));
    getRecentWorkoutsMock.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Noch keine Sessions.")).toBeInTheDocument();
  });

  it("shows an error state and retries the fetch on demand", async () => {
    useAuthMock.mockReturnValue(authFor("user"));
    getRecentWorkoutsMock.mockRejectedValue(new Error("Firestore weg"));

    renderPage();

    expect(
      await screen.findByText("Daten konnten nicht geladen werden"),
    ).toBeInTheDocument();
    expect(getRecentWorkoutsMock).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("Erneut versuchen"));

    expect(getRecentWorkoutsMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("DashboardPage — trainer view", () => {
  it("renders the technique empty-state on success", async () => {
    useAuthMock.mockReturnValue(authFor("trainer"));
    getTopTechniquesMock.mockResolvedValue([]);
    getSessionCountForWeekMock.mockResolvedValue(0);

    renderPage();

    expect(
      await screen.findByText("Noch keine Aufrufdaten vorhanden."),
    ).toBeInTheDocument();
  });

  it("shows an error state when the trainer data fails to load", async () => {
    useAuthMock.mockReturnValue(authFor("trainer"));
    getTopTechniquesMock.mockRejectedValue(new Error("nope"));
    getSessionCountForWeekMock.mockResolvedValue(0);

    renderPage();

    expect(
      await screen.findByText("Daten konnten nicht geladen werden"),
    ).toBeInTheDocument();
  });
});
