import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App.jsx";

test("ルートでホームページをレンダリング", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByAltText("10人で人狼")).toBeInTheDocument();
});