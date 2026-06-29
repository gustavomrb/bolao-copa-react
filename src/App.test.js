import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

jest.mock("./firebase", () => ({
  auth: {},
  logarUsuario: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock("react-firebase-hooks/auth", () => ({
  useAuthState: () => [null],
}));

test("renders the login form", () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

  expect(screen.getByRole("button", { name: /fazer login/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
});
