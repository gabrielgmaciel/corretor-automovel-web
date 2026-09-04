import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("../../services/api", () => ({
    api: { get, post }
}));

import NovaCotacao from "./NovaCotacao";

const domains = {
    "/dominios/questionario": [{
        codigo: "garagem",
        descricao: "Possui garagem",
        explicacao: "Informe onde o veículo fica guardado.",
        respostas: [{ codigo: "SIM", descricao: "Sim" }]
    }],
    "/dominios/franquias": [{ codigo: "normal", descricao: "Franquia normal", explicacao: "Participação padrão." }],
    "/dominios/coberturas": [
        { codigo: "casco", descricao: "Casco", tipoCobertura: "coberturas_principais", explicacao: "Valor do veículo." },
        { codigo: "terceiros", descricao: "Danos a terceiros", tipoCobertura: "coberturas_principais", explicacao: "Responsabilidade civil." },
        { codigo: "vidros", descricao: "Vidros", tipoCobertura: "coberturas_adicionais" },
        { codigo: "som", descricao: "Som", tipoCobertura: "acessorios" },
        { codigo: "protege", descricao: "Proteção extra", tipoCobertura: "protecoes", explicacao: "Proteção opcional." }
    ]
};

const vehicle = {
    valor: 95000,
    marca: "Honda",
    modelo: "Civic",
    anoModelo: ["2025", "2024"],
    anoFabricacao: ["2024", "2023"],
    combustivel: "Flex",
    codigoFipe: "001"
};

const openSections = () => {
    ["Endereço", "Questionário", "Veículo", "Coberturas Principais", "Franquia", "Coberturas Adicionais", "Acessórios", "Proteções"]
        .forEach(title => fireEvent.click(screen.getByRole("button", { name: title })));
};

const selectFor = (label: string) => {
    const select = screen.getByText(label).parentElement?.querySelector("select");
    if (!select) throw new Error(`Select for ${label} not found`);
    return select;
};

const inputFor = (label: string) => {
    const input = screen.getByText(label).parentElement?.querySelector("input");
    if (!input) throw new Error(`Input for ${label} not found`);
    return input;
};

describe("NovaCotacao", () => {
    beforeEach(() => {
        localStorage.clear();
        get.mockReset();
        post.mockReset();
        get.mockImplementation((url: keyof typeof domains) => Promise.resolve({ data: domains[url] || [] }));
    });

    it("loads quote domains and keeps the vehicle value read-only", async () => {
        render(
            <MemoryRouter>
                <NovaCotacao />
            </MemoryRouter>
        );

        await waitFor(() => expect(get).toHaveBeenCalledWith("/dominios/coberturas"));
        fireEvent.click(screen.getByRole("button", { name: "Coberturas Principais" }));

        const [casco] = await screen.findAllByPlaceholderText("R$ 0,00");
        expect(casco).toHaveAttribute("readonly");
        expect(screen.getByText("Casco")).toBeInTheDocument();
    });

    it("shows a clear error when domain loading fails", async () => {
        get.mockRejectedValueOnce(new Error("offline"));
        render(
            <MemoryRouter>
                <NovaCotacao />
            </MemoryRouter>
        );

        expect(await screen.findByText("Não foi possível carregar os domínios da cotação.")).toBeInTheDocument();
    });

    it("searches address and vehicle, accepts every form section and builds the quote payload", async () => {
        get.mockImplementation((url: string) => {
            if (url.startsWith("/enderecos/")) {
                return Promise.resolve({ data: { logradouro: "Rua A", bairro: "Centro", cidade: "Brasília", estado: "DF" } });
            }
            if (url.startsWith("/automovel/")) return Promise.resolve({ data: [vehicle] });
            return Promise.resolve({ data: domains[url as keyof typeof domains] || [] });
        });

        render(<MemoryRouter><NovaCotacao /></MemoryRouter>);
        await waitFor(() => expect(get).toHaveBeenCalledWith("/dominios/coberturas"));
        openSections();
        await screen.findByText("Danos a terceiros");

        fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "12345678901" } });
        fireEvent.change(screen.getByPlaceholderText("Nome completo"), { target: { value: "Ana Silva" } });
        fireEvent.change(screen.getByPlaceholderText("email@dominio.com"), { target: { value: "ana@email.com" } });
        fireEvent.change(screen.getByPlaceholderText("(61) 99999-8888"), { target: { value: "61999998888" } });
        fireEvent.change(inputFor("Data de nascimento *"), { target: { value: "1990-01-01" } });
        fireEvent.change(selectFor("Estado civil *"), { target: { value: "CASADO" } });
        fireEvent.change(screen.getByPlaceholderText("00000-000"), { target: { value: "70000000" } });
        await waitFor(() => expect(screen.getByDisplayValue("Rua A")).toBeInTheDocument());
        fireEvent.change(screen.getByPlaceholderText("Número"), { target: { value: "10" } });
        fireEvent.change(selectFor("Possui garagem *"), { target: { value: "SIM" } });

        fireEvent.change(screen.getByPlaceholderText("Digite o modelo. Ex: Civic"), { target: { value: "Civic" } });
        expect(await screen.findByRole("button", { name: "Honda - Civic" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Honda - Civic" }));
        fireEvent.change(selectFor("Ano fabricação *"), { target: { value: "2024" } });
        fireEvent.change(selectFor("Ano modelo *"), { target: { value: "2025" } });
        fireEvent.change(screen.getByPlaceholderText("ABC1D23"), { target: { value: "abc1d23" } });
        fireEvent.change(screen.getByPlaceholderText("9BWZZZ377VT004251"), { target: { value: "9bw" } });
        fireEvent.change(screen.getAllByPlaceholderText("R$ 0,00")[1], { target: { value: "100000" } });
        fireEvent.change(screen.getByPlaceholderText("R$ 0,00 opcional"), { target: { value: "5000" } });
        fireEvent.change(selectFor("Selecione a franquia *"), { target: { value: "normal" } });

        fireEvent.change(screen.getByRole("option", { name: "Vidros" }).parentElement!, { target: { value: "vidros" } });
        fireEvent.change(screen.getByRole("option", { name: "Som" }).parentElement!, { target: { value: "som" } });
        fireEvent.click(screen.getByRole("button", { name: /solicitar cotação/i }));

        await waitFor(() => expect(screen.queryByText("Preencha os dados obrigatórios do segurado.")).not.toBeInTheDocument());
        expect(screen.getByDisplayValue("ABC1D23")).toBeInTheDocument();
        expect(localStorage.getItem("corretor-auto-assistant-context")).toContain("Brasília");
    });

    it("imports policy data, including FIPE fallback, selections and import warnings", async () => {
        get.mockImplementation((url: string) => {
            if (url === "/automovel/buscar/fipe") return Promise.reject(new Error("not found"));
            if (url === "/automovel/buscar/modelo") return Promise.resolve({ data: [vehicle] });
            return Promise.resolve({ data: domains[url as keyof typeof domains] || [] });
        });
        post.mockResolvedValue({ data: {
            segurado: { cpf: "12345678901", nome: "Ana", telefone: "61999998888", sexo: "feminino", estadoCivil: "casado" },
            endereco: { cep: "70000000", logradouro: "Rua A", cidade: "Brasília", estado: "DF", numero: "10" },
            veiculo: { codigoFipe: "001", fabricante: "Honda", modelo: "Civic", anoFabricacao: 2024, anoModelo: 2025, placa: "abc1d23", chassi: "abc" },
            franquia: { descricao: "Franquia normal" },
            coberturas: [{ descricao: "Danos a terceiros", valor: 1000 }, { descricao: "Vidros" }, { descricao: "Som" }, { descricao: "Proteção extra", valor: 50 }, { descricao: "Inexistente" }],
            avisos: ["Campo não identificado"]
        } });
        render(<MemoryRouter><NovaCotacao /></MemoryRouter>);
        await waitFor(() => expect(get).toHaveBeenCalledWith("/dominios/coberturas"));
        const file = new File(["pdf"], "apolice.pdf", { type: "application/pdf" });
        fireEvent.change(screen.getByLabelText("Selecionar PDF"), { target: { files: [file] } });

        expect(await screen.findByText(/Não foi possível buscar pelo código FIPE/)).toBeInTheDocument();
        expect(screen.getByText("Cobertura não associada: Inexistente.")).toBeInTheDocument();
        expect(screen.getByDisplayValue("123.456.789-01")).toBeInTheDocument();
        expect(post).toHaveBeenCalledWith("/assistente/apolice", expect.any(FormData), expect.any(Object));
    });
});
