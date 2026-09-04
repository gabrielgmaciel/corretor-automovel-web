import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../services/api", () => ({
    api: { get }
}));

import ResultadoCotacao from "./ResultadoCotacao";

const LocationDisplay = () => <output>{useLocation().pathname}</output>;

describe("ResultadoCotacao", () => {
    beforeEach(() => {
        get.mockReset();
        get.mockResolvedValue({ data: [] });
    });

    it("shows a recovery state when navigation has no quote payload", async () => {
        render(
            <MemoryRouter initialEntries={["/resultado"]}>
                <Routes>
                    <Route path="/resultado" element={<ResultadoCotacao />} />
                    <Route path="/" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Cotação não encontrada")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Nova cotação" }));

        await waitFor(() => expect(screen.getByText("/")).toBeInTheDocument());
        expect(get).toHaveBeenCalledWith("/seguradora");
    });

    it("consumes offers from SSE, matches them to insurers and enables selection", async () => {
        const quote = {
            id: "quote-1",
            grupoCotacao: { codigo: "COT-1", parceiro: { seguradora: "Azul", produto: "Auto Completo" } },
            resumoFinanceiro: { premioTotal: 1200 },
            franquia: { descricao: "Normal" },
            scoreRisco: { nivel: "Baixo" },
            beneficios: [{ codigo: "guincho", descricao: "Guincho" }],
            pagamentos: [{ parcelas: [{ numero: 12, valor: 100 }] }]
        };
        const encoder = new TextEncoder();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`event: cotacao\ndata: ${JSON.stringify(quote)}\n\nevent: finalizado\ndata: ok\n\n`));
                    controller.close();
                }
            })
        }));
        get.mockResolvedValueOnce({ data: [
            { nome: "Auto Completo", seguradora: "Azul", codigoProduto: "auto-completo" },
            { nome: "Outro", seguradora: "Outra", codigoProduto: "outro" }
        ] });
        const payload = { segurado: { nome: "Ana", documento: "12345678901" }, veiculo: { fabricante: "Honda", modelo: "Civic", placa: "ABC1D23" } };

        render(
            <MemoryRouter initialEntries={[{ pathname: "/resultado", state: { payload } }]}>
                <Routes><Route path="/resultado" element={<ResultadoCotacao />} /></Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("Cálculo finalizado")).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*1\.200,00/)).toBeInTheDocument();
        expect(screen.getByText(/Em 12x de R\$\s*100,00/)).toBeInTheDocument();
        expect(screen.getByText("Calculando sua oferta")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Auto Completo"));
        expect(screen.getByRole("button", { name: /avançar/i })).toBeEnabled();
        expect(screen.getByText("Oferta selecionada")).toBeInTheDocument();
    });
});
