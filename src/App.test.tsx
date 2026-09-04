import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("./pages/NovaCotacao/NovaCotacao", () => ({ default: () => <h1>Nova cotação</h1> }));
vi.mock("./pages/ResultadoCotacao/ResultadoCotacao", () => ({ default: () => <h1>Resultado</h1> }));
vi.mock("./components/InsuranceAssistant/InsuranceAssistant", () => ({ default: () => <aside>Assistente</aside> }));

import App from "./App";

describe("App", () => {
    it.each([
        ["/", "Nova cotação"],
        ["/resultado", "Resultado"]
    ])("routes %s to %s and keeps the assistant", (path, title) => {
        render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
        expect(screen.getByText("Assistente")).toBeInTheDocument();
    });
});
