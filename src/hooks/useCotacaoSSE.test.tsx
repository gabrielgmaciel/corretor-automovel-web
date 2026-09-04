import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { API_URL } from "../api/http";
import { useCotacaoSSE } from "./useCotacaoSSE";

const encoder = new TextEncoder();

const responseWithEvents = (events: string[]) => ({
    body: new ReadableStream({
        start(controller) {
            events.forEach(event => controller.enqueue(encoder.encode(event)));
            controller.close();
        }
    })
});

describe("useCotacaoSSE", () => {
    it("posts the payload, consumes SSE events, ignores duplicated quotes and finishes", async () => {
        const quote = {
            id: "quote-1",
            grupoCotacao: { parceiro: { seguradora: "Seguradora", produto: "Auto" } },
            resumoFinanceiro: { premioTotal: 1200, comissao: 100 }
        };
        const fetchMock = vi.fn().mockResolvedValue(responseWithEvents([
            `event: cotacao\ndata: ${JSON.stringify(quote)}\n\n`,
            `event: cotacao\ndata: ${JSON.stringify(quote)}\n\n`,
            "event: finalizado\ndata: ok\n\n"
        ]));
        vi.stubGlobal("fetch", fetchMock);

        const payload = { veiculo: { modelo: "Civic" } };
        const { result } = renderHook(() => useCotacaoSSE(payload));

        await waitFor(() => expect(result.current.finished).toBe(true));

        expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/cotacao/simular`, expect.objectContaining({
            method: "POST",
            body: JSON.stringify(payload)
        }));
        expect(result.current.loading).toBe(false);
        expect(result.current.cotacoes).toEqual([quote]);
    });

    it("does not make a request without a payload", () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useCotacaoSSE(null));

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
