import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TrainerHint from "@/components/TrainerHint";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile, UserRole } from "@/lib/types";
import { useTrainerHint } from "@/lib/use-trainer-hints";

vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/use-trainer-hints", () => ({ useTrainerHint: vi.fn() }));

type AuthValue = ReturnType<typeof useAuth>;

const dismissMock = vi.fn();
const useAuthMock = vi.mocked(useAuth);
const useTrainerHintMock = vi.mocked(useTrainerHint);

function makeProfile(role: UserRole): UserProfile {
  return {
    uid: "user-1",
    email: "coach@example.com",
    authProviderName: null,
    displayName: "Coach",
    role,
    settings: {
      soundOn: true,
      vibrate: true,
      wakeLock: true,
      defaultEquipment: [],
    },
    onboarded: true,
  };
}

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

function renderHint() {
  return render(
    <TrainerHint id="schedule-overview" title="Stundenplan">
      Klicke auf einen Kurs, um Techniken hinzuzufügen.
    </TrainerHint>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useTrainerHintMock.mockReturnValue({ seen: false, dismiss: dismissMock });
});

describe("TrainerHint", () => {
  it("renders nothing for a non-trainer role", () => {
    useAuthMock.mockReturnValue(
      makeAuthValue({ profile: makeProfile("user") }),
    );

    const { container } = renderHint();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, children, and the dismiss button for a trainer when unseen", () => {
    useAuthMock.mockReturnValue(
      makeAuthValue({ profile: makeProfile("trainer") }),
    );

    renderHint();

    expect(screen.getByText("Trainer-Tipp · Stundenplan")).toBeInTheDocument();
    expect(
      screen.getByText("Klicke auf einen Kurs, um Techniken hinzuzufügen."),
    ).toBeInTheDocument();
    expect(screen.getByText("Verstanden")).toBeInTheDocument();
  });

  it("renders title, children, and the dismiss button for an admin when unseen", () => {
    useAuthMock.mockReturnValue(
      makeAuthValue({ profile: makeProfile("admin") }),
    );

    renderHint();

    expect(screen.getByText("Trainer-Tipp · Stundenplan")).toBeInTheDocument();
    expect(
      screen.getByText("Klicke auf einen Kurs, um Techniken hinzuzufügen."),
    ).toBeInTheDocument();
    expect(screen.getByText("Verstanden")).toBeInTheDocument();
  });

  it("renders nothing for a trainer when the hint was already seen", () => {
    useAuthMock.mockReturnValue(
      makeAuthValue({ profile: makeProfile("trainer") }),
    );
    useTrainerHintMock.mockReturnValue({ seen: true, dismiss: dismissMock });

    const { container } = renderHint();

    expect(container).toBeEmptyDOMElement();
  });

  it("calls dismiss when Verstanden is clicked", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(
      makeAuthValue({ profile: makeProfile("trainer") }),
    );

    renderHint();

    await user.click(screen.getByText("Verstanden"));

    expect(dismissMock).toHaveBeenCalledTimes(1);
  });
});
