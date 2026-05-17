import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({
  signUpAction: vi.fn(async () => ({ ok: true })),
}));

import SignUpPage from "@/app/(auth)/sign-up/page";
import { signUpAction } from "@/lib/actions/auth";

describe("SignUpPage", () => {
  it("renderiza el form y el wordmark", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  // TODO: happy-dom v15 + React 19 form actions tienen incompatibilidad
  // (Invalid left-hand side in assignment en BrowserFrameNavigator).
  // Workaround: migrar este test a jsdom o esperar a happy-dom v16.
  it.skip("muestra confirmación después de submit exitoso", async () => {
    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@dovo.app" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
    expect(signUpAction).toHaveBeenCalledOnce();
  });
});
