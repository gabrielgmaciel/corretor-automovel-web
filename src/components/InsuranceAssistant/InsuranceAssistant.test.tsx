import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("../../services/api", () => ({
    api: { post }
}));

import InsuranceAssistant from "./InsuranceAssistant";

const renderAssistant = (path = "/") => render(
    <MemoryRouter initialEntries={[path]}>
        <InsuranceAssistant />
    </MemoryRouter>
);

describe("InsuranceAssistant", () => {
    beforeEach(() => {
        localStorage.clear();
        post.mockReset();
    });

    it("sends the current conversation and displays the assistant answer", async () => {
        post.mockResolvedValueOnce({ data: { resposta: "A franquia reduz sua participação no sinistro." } });
        renderAssistant();

        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), {
            target: { value: "O que é franquia?" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

        await waitFor(() => expect(screen.getByText("A franquia reduz sua participação no sinistro.")).toBeInTheDocument());
        expect(post).toHaveBeenCalledWith("/assistente", expect.objectContaining({
            mensagem: "O que é franquia?",
            pagina: "/",
            historico: expect.arrayContaining([
                expect.objectContaining({ papel: "user", conteudo: "O que é franquia?" })
            ])
        }));
    });

    it("applies a coverage suggestion on the quote page", async () => {
        const listener = vi.fn();
        window.addEventListener("assistente:preencher-coberturas", listener);
        post.mockResolvedValueOnce({
            data: {
                mensagem: "Sugiro incluir proteção para vidros.",
                acaoPreenchimento: {
                    tipo: "PREENCHER_COBERTURAS",
                    mensagem: "Aplicar cobertura sugerida",
                    coberturas: [{ codigo: "vidros", descricao: "Proteção para vidros", frequencia: 1 }]
                }
            }
        });
        renderAssistant();

        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), {
            target: { value: "Quais coberturas você recomenda?" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

        await screen.findByText("Aplicar cobertura sugerida");
        fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            detail: [{ codigo: "vidros", descricao: "Proteção para vidros", frequencia: 1 }]
        }));
        expect(screen.getByText(/Sugestão aplicada ao formulário/)).toBeInTheDocument();
        window.removeEventListener("assistente:preencher-coberturas", listener);
    });

    it("shows the API error, clears the conversation and closes the panel", async () => {
        post.mockRejectedValueOnce({ response: { data: { erro: "Serviço indisponível" } } });
        renderAssistant();

        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), {
            target: { value: "Preciso de ajuda" }
        });
        fireEvent.keyDown(screen.getByPlaceholderText("Digite sua dúvida..."), { key: "Enter" });

        expect(await screen.findByText("Serviço indisponível")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Limpar conversa" }));
        expect(screen.queryByText("Preciso de ajuda")).not.toBeInTheDocument();
        fireEvent.click(screen.getAllByRole("button", { name: "Fechar assistente" })[0]);
        expect(screen.getByRole("button", { name: "Abrir assistente" })).toBeInTheDocument();
    });

    it("uses the fallback message when the assistant returns no text", async () => {
        post.mockResolvedValueOnce({ data: {} });
        renderAssistant();
        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), { target: { value: "Teste" } });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
        expect(await screen.findByText(/Não consegui acessar o assistente agora/)).toBeInTheDocument();
    });

    it("applies and dismisses a franchise suggestion", async () => {
        const listener = vi.fn();
        window.addEventListener("assistente:preencher-franquia", listener);
        post.mockResolvedValueOnce({
            data: {
                message: "A franquia reduzida é uma boa opção.",
                acaoPreenchimento: {
                    tipo: "PREENCHER_FRANQUIA",
                    mensagem: "Aplicar franquia reduzida",
                    franquia: { codigo: "reduzida", descricao: "Reduzida", frequencia: 1 }
                }
            }
        });
        renderAssistant();

        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), { target: { value: "Qual franquia?" } });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
        await screen.findByText("Aplicar franquia reduzida");
        fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
        expect(screen.queryByText("Aplicar franquia reduzida")).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), { target: { value: "Qual franquia agora?" } });
        post.mockResolvedValueOnce({ data: { resposta: "Use a reduzida.", acaoPreenchimento: {
            tipo: "PREENCHER_FRANQUIA", mensagem: "Aplicar", franquia: { codigo: "reduzida", descricao: "Reduzida", frequencia: 1 }
        } } });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
        await screen.findByRole("button", { name: "Aplicar" });
        fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.objectContaining({ codigo: "reduzida" }) }));
        window.removeEventListener("assistente:preencher-franquia", listener);
    });

    it("takes a suggestion back to the quote form when opened from another page", async () => {
        post.mockResolvedValueOnce({ data: { content: "Inclua vidros.", acaoPreenchimento: {
            tipo: "PREENCHER_COBERTURAS", mensagem: "Voltar e aplicar", coberturas: [{ codigo: "vidros", descricao: "Vidros", frequencia: 1 }]
        } } });
        const Location = () => <output>{useLocation().pathname}</output>;
        render(
            <MemoryRouter initialEntries={[{ pathname: "/resultado", state: { formState: { cep: "70000-000" } }}]}>
                <Routes>
                    <Route path="/resultado" element={<InsuranceAssistant />} />
                    <Route path="/" element={<Location />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: "Abrir assistente" }));
        fireEvent.change(screen.getByPlaceholderText("Digite sua dúvida..."), { target: { value: "O que recomenda?" } });
        fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
        fireEvent.click(await screen.findByRole("button", { name: "Aplicar" }));
        expect(await screen.findByText("/")).toBeInTheDocument();
    });
});
