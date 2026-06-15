import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersPage from "@/app/admin/users/page";
import { useAuth } from "@/lib/auth-context";
import type { AdminUserEntry } from "@/lib/admin";

vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/admin", () => ({ listAllUsers: vi.fn() }));
vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: { uid: "admin-1" } }),
}));

import { listAllUsers } from "@/lib/admin";

const listAllUsersMock = vi.mocked(listAllUsers);

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

function adminAuth(): AuthValue {
  return makeAuthValue({
    user: { uid: "admin-1" } as AuthValue["user"],
    profile: {
      uid: "admin-1",
      role: "admin",
      displayName: "Boss",
    } as AuthValue["profile"],
    loading: false,
    profileLoading: false,
  });
}

const sampleUser: AdminUserEntry = {
  uid: "u1",
  email: "max@example.com",
  displayName: "Max Mustermann",
  authProviderName: null,
  role: "user",
  createdAt: undefined,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminUsersPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminUsersPage", () => {
  it("shows a loading skeleton while users are pending", () => {
    useAuthMock.mockReturnValue(adminAuth());
    listAllUsersMock.mockReturnValue(new Promise<never[]>(() => {}));

    const { container } = renderPage();

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders a loaded user", async () => {
    useAuthMock.mockReturnValue(adminAuth());
    listAllUsersMock.mockResolvedValue([sampleUser]);

    renderPage();

    expect(await screen.findByText("Max Mustermann")).toBeInTheDocument();
  });

  it("shows the empty-state when there are no users", async () => {
    useAuthMock.mockReturnValue(adminAuth());
    listAllUsersMock.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("Noch keine Nutzer registriert."),
    ).toBeInTheDocument();
  });

  it("shows an error state and retries on demand", async () => {
    useAuthMock.mockReturnValue(adminAuth());
    listAllUsersMock.mockRejectedValue(new Error("kein Zugriff"));

    renderPage();

    expect(
      await screen.findByText("Nutzer konnten nicht geladen werden"),
    ).toBeInTheDocument();
    expect(listAllUsersMock).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("Erneut versuchen"));

    expect(listAllUsersMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
