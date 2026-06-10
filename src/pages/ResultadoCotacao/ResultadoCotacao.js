import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import styles from "./ResultadoCotacao.module.css";
const normalizar = (value) => (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const formatarMoeda = (value) => Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const formatarCpf = (value) => (value || "")
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
const obterLogo = (logo) => logo.startsWith("data:")
    ? logo
    : `data:image/png;base64,${logo}`;
const obterParcelamento = (cotacao) => {
    const opcoes = cotacao?.pagamentos
        ?.flatMap(pagamento => pagamento.parcelas || []) || [];
    return opcoes.reduce((melhor, parcela) => !melhor || parcela.numero > melhor.numero
        ? parcela
        : melhor, undefined);
};
const cotacaoPertenceSeguradora = (cotacao, seguradora, permitirAssociacaoPorSeguradora) => {
    const parceiro = cotacao.grupoCotacao?.parceiro;
    const candidatosCotacao = [
        cotacao.grupoCotacao?.codigo,
        parceiro?.produto
    ].map(normalizar);
    const candidatosSeguradora = [
        seguradora.codigoProduto,
        seguradora.nome
    ].map(normalizar);
    const produtoEncontrado = candidatosCotacao.some(candidato => candidato &&
        candidatosSeguradora.some(esperado => esperado &&
            (candidato === esperado ||
                candidato.includes(esperado) ||
                esperado.includes(candidato))));
    if (produtoEncontrado)
        return true;
    return permitirAssociacaoPorSeguradora &&
        normalizar(parceiro?.seguradora) ===
            normalizar(seguradora.seguradora);
};
export default function ResultadoCotacao() {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationState = location.state || {};
    const payload = navigationState.payload;
    const formState = navigationState.formState;
    const [seguradoras, setSeguradoras] = useState([]);
    const [cotacoes, setCotacoes] = useState([]);
    const [cotacaoSelecionadaId, setCotacaoSelecionadaId] = useState("");
    const [finished, setFinished] = useState(false);
    const [erro, setErro] = useState("");
    const started = useRef(false);
    useEffect(() => {
        const carregarSeguradoras = async () => {
            try {
                const response = await api.get("/seguradora");
                setSeguradoras(response.data);
            }
            catch (error) {
                setErro("Não foi possível carregar as seguradoras.");
            }
        };
        carregarSeguradoras();
    }, []);
    useEffect(() => {
        if (!payload || started.current)
            return;
        started.current = true;
        const connect = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/cotacao/simular", {
                    method: "POST",
                    headers: {
                        Accept: "text/event-stream",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok || !response.body) {
                    throw new Error("Falha ao iniciar a simulação.");
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                while (true) {
                    const { value, done } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split("\n\n");
                    buffer =
                        events.pop() || "";
                    for (const event of events) {
                        let eventName = "";
                        let data = "";
                        for (const line of event.split("\n")) {
                            if (line.startsWith("event:")) {
                                eventName =
                                    line.slice(6).trim();
                            }
                            if (line.startsWith("data:")) {
                                data +=
                                    line.slice(5).trim();
                            }
                        }
                        if (eventName === "cotacao" && data) {
                            const cotacao = JSON.parse(data);
                            setCotacoes(current => {
                                const index = current.findIndex(item => item.id === cotacao.id);
                                if (index < 0) {
                                    return [
                                        ...current,
                                        cotacao
                                    ];
                                }
                                return current.map(item => item.id === cotacao.id
                                    ? cotacao
                                    : item);
                            });
                        }
                        if (eventName === "finalizado") {
                            setFinished(true);
                        }
                    }
                }
            }
            catch (error) {
                setErro("Não foi possível concluir a simulação das cotações.");
            }
        };
        connect();
    }, [payload]);
    const ofertas = useMemo(() => seguradoras.map(seguradora => {
        const produtosDaSeguradora = seguradoras.filter(item => normalizar(item.seguradora) ===
            normalizar(seguradora.seguradora)).length;
        return {
            seguradora,
            cotacao: cotacoes.find(cotacao => cotacaoPertenceSeguradora(cotacao, seguradora, produtosDaSeguradora === 1))
        };
    }), [seguradoras, cotacoes]);
    const cotacaoSelecionada = cotacoes.find(cotacao => cotacao.id === cotacaoSelecionadaId);
    const codigoCotacao = cotacaoSelecionada?.id ||
        cotacoes[0]?.id ||
        "Em processamento";
    const voltar = () => {
        navigate("/", {
            state: {
                formState
            }
        });
    };
    if (!payload) {
        return (_jsx("main", { className: styles.page, children: _jsxs("div", { className: styles.emptyState, children: [_jsx("span", { children: "Cota\u00E7\u00E3o n\u00E3o encontrada" }), _jsx("h1", { children: "Inicie uma nova simula\u00E7\u00E3o" }), _jsx("p", { children: "N\u00E3o h\u00E1 dados de cota\u00E7\u00E3o dispon\u00EDveis nesta p\u00E1gina." }), _jsx("button", { type: "button", onClick: () => navigate("/"), children: "Nova cota\u00E7\u00E3o" })] }) }));
    }
    return (_jsx("main", { className: styles.page, children: _jsxs("div", { className: styles.container, children: [_jsxs("section", { className: styles.summary, children: [_jsxs("div", { className: styles.summaryIntro, children: [_jsx("span", { className: styles.eyebrow, children: "Resultado da cota\u00E7\u00E3o" }), _jsx("h1", { children: "Escolha a melhor prote\u00E7\u00E3o" }), _jsx("p", { children: "Compare as ofertas e selecione a op\u00E7\u00E3o ideal para o seu ve\u00EDculo." })] }), _jsxs("div", { className: styles.customerGrid, children: [_jsxs("div", { className: styles.customerItem, children: [_jsx("span", { children: "Segurado" }), _jsx("strong", { children: payload.segurado?.nome || "-" })] }), _jsxs("div", { className: styles.customerItem, children: [_jsx("span", { children: "CPF" }), _jsx("strong", { children: formatarCpf(payload.segurado?.documento) })] }), _jsxs("div", { className: styles.customerItem, children: [_jsx("span", { children: "Ve\u00EDculo" }), _jsxs("strong", { children: [payload.veiculo?.fabricante, " ", payload.veiculo?.modelo] })] }), _jsxs("div", { className: styles.customerItem, children: [_jsx("span", { children: "Placa" }), _jsx("strong", { children: payload.veiculo?.placa || "-" })] }), _jsxs("div", { className: `${styles.customerItem} ${styles.quoteCode}`, children: [_jsx("span", { children: "C\u00F3digo da cota\u00E7\u00E3o" }), _jsx("strong", { title: codigoCotacao, children: codigoCotacao })] })] })] }), _jsxs("div", { className: styles.offersHeader, children: [_jsxs("div", { children: [_jsx("span", { className: styles.sectionLabel, children: "Ofertas dispon\u00EDveis" }), _jsx("h2", { children: "Compare as seguradoras" })] }), _jsxs("div", { className: `${styles.status} ${finished
                                ? styles.statusFinished
                                : ""}`, children: [_jsx("span", {}), finished
                                    ? "Cálculo finalizado"
                                    : "Calculando ofertas"] })] }), erro && (_jsx("div", { className: styles.alert, children: erro })), _jsx("section", { className: styles.grid, children: ofertas.map(({ seguradora, cotacao }) => {
                        const selecionada = cotacao?.id ===
                            cotacaoSelecionadaId;
                        const parcelamento = obterParcelamento(cotacao);
                        return (_jsxs("article", { className: `${styles.offerCard} ${selecionada
                                ? styles.offerCardSelected
                                : ""} ${!cotacao
                                ? styles.offerCardLoading
                                : ""}`, onClick: () => cotacao &&
                                setCotacaoSelecionadaId(cotacao.id), children: [_jsxs("div", { className: styles.offerTop, children: [_jsxs("div", { className: styles.brand, children: [_jsx("div", { className: styles.logoBox, children: seguradora.logo ? (_jsx("img", { src: obterLogo(seguradora.logo), alt: `Logo ${seguradora.seguradora}` })) : (_jsx("span", { children: seguradora.seguradora
                                                            .slice(0, 1) })) }), _jsxs("div", { children: [_jsx("strong", { children: seguradora.seguradora }), _jsx("span", { children: seguradora.nome })] })] }), cotacao && (_jsx("span", { className: styles.radio, children: _jsx("span", {}) }))] }), !cotacao ? (_jsxs("div", { className: styles.calculating, children: [_jsxs("div", { className: styles.dots, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }), _jsx("strong", { children: "Calculando sua oferta" }), _jsx("p", { children: "A seguradora est\u00E1 analisando os dados." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.priceBlock, children: [_jsx("span", { children: "Valor \u00E0 vista" }), _jsx("strong", { children: formatarMoeda(cotacao.resumoFinanceiro
                                                        ?.premioTotal) }), _jsx("p", { children: parcelamento
                                                        ? `${parcelamento.numero}x de ${formatarMoeda(parcelamento.valor)}`
                                                        : "Consulte as formas de pagamento" })] }), _jsxs("div", { className: styles.details, children: [_jsxs("div", { children: [_jsx("span", { children: "Produto" }), _jsx("strong", { children: cotacao.grupoCotacao
                                                                ?.parceiro
                                                                ?.produto ||
                                                                seguradora.nome })] }), _jsxs("div", { children: [_jsx("span", { children: "Franquia" }), _jsx("strong", { children: cotacao.franquia
                                                                ?.descricao ||
                                                                payload.franquia
                                                                    ?.descricao ||
                                                                "-" })] }), _jsxs("div", { children: [_jsx("span", { children: "N\u00EDvel de risco" }), _jsx("strong", { children: cotacao.scoreRisco
                                                                ?.nivel || "-" })] }), _jsxs("div", { children: [_jsx("span", { children: "Benef\u00EDcios" }), _jsx("strong", { children: cotacao.beneficios
                                                                ?.length || 0 })] })] }), _jsx("div", { className: styles.selectHint, children: selecionada
                                                ? "Oferta selecionada"
                                                : "Clique para selecionar" })] }))] }, seguradora.codigoProduto));
                    }) }), _jsxs("section", { className: styles.actionsCard, children: [_jsxs("div", { children: [_jsx("span", { children: "Pr\u00F3ximo passo" }), _jsx("strong", { children: cotacaoSelecionada
                                        ? "Oferta pronta para efetivação"
                                        : "Selecione uma oferta para continuar" })] }), _jsxs("div", { className: styles.actions, children: [_jsx("button", { type: "button", className: styles.backButton, onClick: voltar, children: "Voltar" }), _jsxs("button", { type: "button", className: styles.nextButton, disabled: !cotacaoSelecionada, children: [_jsx("span", { children: "Avan\u00E7ar" }), _jsx("span", { className: styles.arrow, children: "\u2192" })] })] })] })] }) }));
}
