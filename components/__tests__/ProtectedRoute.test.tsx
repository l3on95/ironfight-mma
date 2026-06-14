import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));

const replaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

type AuthValue = ReturnType<typeof useAuth>;

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

const useAuthMock = vi.mocked(useAuth);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProtectedRoute", () => {
  it("renders the skeleton while auth is loading and hides children", () => {
    useAuthMock.mockReturnValue(makeAuthValue({ loading: true }));

    const { container } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders login-required UI without children when no user is present", () => {
    useAuthMock.mockReturnValue(makeAuthValue({ user: null, loading: false }));

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Login erforderlich")).toBeInTheDocument();
    expect(screen.getByText("Zum Login")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("renders children when a user is present", () => {
    useAuthMock.mockReturnValue(
      makeAuthValue({
        user: { uid: "user-1" } as AuthValue["user"],
        loading: false,
      }),
    );

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Login erforderlich")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
