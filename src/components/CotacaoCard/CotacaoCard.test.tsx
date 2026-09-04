import { render, screen } from "@testing-library/react";

import CotacaoCard from "./CotacaoCard";

describe("CotacaoCard", () => {
    it("renders the insurer quote summary", () => {
        render(<CotacaoCard cotacao={{
            grupoCotacao: { parceiro: { seguradora: "Azul", produto: "Auto Completo" } },
            resumoFinanceiro: { premioTotal: 1500, comissao: 150 },
            scoreRisco: { nivel: "BAIXO" }
        }} />);

        expect(screen.getByText("Azul")).toBeInTheDocument();
        expect(screen.getByText("Auto Completo")).toBeInTheDocument();
        expect(screen.getByText("R$ 1500")).toBeInTheDocument();
        expect(screen.getByText("R$ 150")).toBeInTheDocument();
        expect(screen.getByText("BAIXO")).toBeInTheDocument();
    });
});
