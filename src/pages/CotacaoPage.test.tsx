import { render, screen } from "@testing-library/react";

import CotacaoPage from "./CotacaoPage";

describe("CotacaoPage", () => {
    it("renders the initial quote action", () => {
        render(<CotacaoPage />);

        expect(screen.getByRole("heading", { name: "Corretor Automóvel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gerar Cotação" })).toBeInTheDocument();
    });
});
