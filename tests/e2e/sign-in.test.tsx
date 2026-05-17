import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({
  signInAction: vi.fn(async () => ({ ok: true })),
}));

import SignInPage from "@/app/(auth)/sign-in/page";
import { signInAction } from "@/lib/actions/auth";

describe("SignInPage", () => {
  it("renderiza form solo con email", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre/i)).toBeNull();
  });

  // TODO: mismo issue happy-dom v15 + React 19 form actions que en sign-up.test.tsx
  it.skip("envía signInAction y muestra confirmación", async () => {
    render(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@dovo.app" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
    expect(signInAction).toHaveBeenCalledOnce();
  });
});
