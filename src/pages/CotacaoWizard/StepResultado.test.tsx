import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const { useCotacaoSSE } = vi.hoisted(() => ({ useCotacaoSSE: vi.fn() }));

vi.mock("../../hooks/useCotacaoSSE", () => ({ useCotacaoSSE }));

import StepResultado from "./StepResultado";

describe("StepResultado", () => {
    it("shows loading, quotes and completion state", () => {
        useCotacaoSSE.mockReturnValue({
            loading: true,
            finished: true,
            cotacoes: [{
                id: "1",
                grupoCotacao: { parceiro: { seguradora: "Azul", produto: "Auto" } },
                resumoFinanceiro: { premioTotal: 1000, comissao: 100 },
                scoreRisco: { nivel: "BAIXO" }
            }]
        });

        render(<StepResultado payload={{ id: "payload" }} />);

        expect(useCotacaoSSE).toHaveBeenCalledWith({ id: "payload" });
        expect(screen.getByText("Consultando seguradoras...")).toBeInTheDocument();
        expect(screen.getByText("Azul")).toBeInTheDocument();
        expect(screen.getByText("Todas as seguradoras responderam.")).toBeInTheDocument();
    });
});
