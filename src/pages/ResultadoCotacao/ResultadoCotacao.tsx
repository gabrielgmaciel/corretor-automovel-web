import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";

import { API_URL } from "../../api/http";
import { api } from "../../services/api";

import styles from "./ResultadoCotacao.module.css";

type Seguradora = {
    nome: string;
    seguradora: string;
    codigoProduto: string;
    logo?: string;
};

type Parcela = {
    numero: number;
    valor: number;
};

type Pagamento = {
    formaPagamento?: {
        descricao?: string;
    };
    parcelas?: Parcela[];
};

type Cotacao = {
    id: string;
    grupoCotacao?: {
        codigo?: string;
        parceiro?: {
            seguradora?: string;
            produto?: string;
        };
    };
    resumoFinanceiro?: {
        valorVeiculo?: number;
        premioTotal?: number;
        comissao?: number;
    };
    scoreRisco?: {
        nivel?: string;
    };
    franquia?: {
        descricao?: string;
    };
    beneficios?: {
        codigo?: string;
        descricao?: string;
    }[];
    pagamentos?: Pagamento[];
    status?: string;
};

const normalizar = (value?: string) =>
    (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const formatarMoeda = (value?: number) =>
    Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

const formatarCpf = (value?: string) =>
    (value || "")
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");

const obterLogo = (logo: string) =>
    logo.startsWith("data:")
        ? logo
        : `data:image/png;base64,${logo}`;

const obterParcelamento = (cotacao?: Cotacao) => {

    const opcoes =
        cotacao?.pagamentos
            ?.flatMap(
                pagamento =>
                    pagamento.parcelas || []
            ) || [];

    return opcoes.reduce<Parcela | undefined>(
        (melhor, parcela) =>
            !melhor || parcela.numero > melhor.numero
                ? parcela
                : melhor,
        undefined
    );
};

const cotacaoPertenceSeguradora = (
    cotacao: Cotacao,
    seguradora: Seguradora,
    permitirAssociacaoPorSeguradora: boolean
) => {

    const parceiro =
        cotacao.grupoCotacao?.parceiro;

    const candidatosCotacao = [
        cotacao.grupoCotacao?.codigo,
        parceiro?.produto
    ].map(normalizar);

    const candidatosSeguradora = [
        seguradora.codigoProduto,
        seguradora.nome
    ].map(normalizar);

    const produtoEncontrado =
        candidatosCotacao.some(
            candidato =>
                candidato &&
                candidatosSeguradora.some(
                    esperado =>
                        esperado &&
                        (
                            candidato === esperado ||
                            candidato.includes(esperado) ||
                            esperado.includes(candidato)
                        )
                )
        );

    if (produtoEncontrado) return true;

    return permitirAssociacaoPorSeguradora &&
        normalizar(parceiro?.seguradora) ===
        normalizar(seguradora.seguradora);
};

export default function ResultadoCotacao() {

    const location =
        useLocation();

    const navigate =
        useNavigate();

    const navigationState =
        location.state || {};

    const payload =
        navigationState.payload;

    const formState =
        navigationState.formState;

    const [seguradoras, setSeguradoras] =
        useState<Seguradora[]>([]);

    const [cotacoes, setCotacoes] =
        useState<Cotacao[]>([]);

    const [cotacaoSelecionadaId, setCotacaoSelecionadaId] =
        useState("");

    const [finished, setFinished] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const started =
        useRef(false);

    useEffect(() => {

        const carregarSeguradoras = async () => {

            try {
                const response =
                    await api.get("/seguradora");

                setSeguradoras(response.data);
            } catch (error) {
                setErro(
                    "Não foi possível carregar as seguradoras."
                );
            }
        };

        carregarSeguradoras();
    }, []);

    useEffect(() => {

        if (!payload || started.current) return;

        started.current = true;

        const connect = async () => {

            try {
                const response =
                    await fetch(
                        `${API_URL}/cotacao/simular`,
                        {
                            method: "POST",
                            headers: {
                                Accept: "text/event-stream",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(payload)
                        }
                    );

                if (!response.ok || !response.body) {
                    throw new Error("Falha ao iniciar a simulação.");
                }

                const reader =
                    response.body.getReader();

                const decoder =
                    new TextDecoder();

                let buffer = "";

                while (true) {
                    const { value, done } =
                        await reader.read();

                    if (done) break;

                    buffer += decoder.decode(
                        value,
                        { stream: true }
                    );

                    const events =
                        buffer.split("\n\n");

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
                            const cotacao: Cotacao =
                                JSON.parse(data);

                            setCotacoes(
                                current => {
                                    const index =
                                        current.findIndex(
                                            item =>
                                                item.id === cotacao.id
                                        );

                                    if (index < 0) {
                                        return [
                                            ...current,
                                            cotacao
                                        ];
                                    }

                                    return current.map(
                                        item =>
                                            item.id === cotacao.id
                                                ? cotacao
                                                : item
                                    );
                                }
                            );
                        }

                        if (eventName === "finalizado") {
                            setFinished(true);
                        }
                    }
                }
            } catch (error) {
                setErro(
                    "Não foi possível concluir a simulação das cotações."
                );
            }
        };

        connect();
    }, [payload]);

    const ofertas =
        useMemo(
            () =>
                seguradoras.map(
                    seguradora => {

                        const produtosDaSeguradora =
                            seguradoras.filter(
                                item =>
                                    normalizar(item.seguradora) ===
                                    normalizar(seguradora.seguradora)
                            ).length;

                        return {
                            seguradora,
                            cotacao:
                                cotacoes.find(
                                    cotacao =>
                                        cotacaoPertenceSeguradora(
                                            cotacao,
                                            seguradora,
                                            produtosDaSeguradora === 1
                                        )
                                )
                        };
                    }
                ).sort(
                    (a, b) => {
                        if (a.cotacao && !b.cotacao) return -1;
                        if (!a.cotacao && b.cotacao) return 1;

                        if (!a.cotacao || !b.cotacao) {
                            return a.seguradora.nome.localeCompare(
                                b.seguradora.nome,
                                "pt-BR"
                            );
                        }

                        return (
                            Number(
                                a.cotacao.resumoFinanceiro?.premioTotal ||
                                Infinity
                            ) -
                            Number(
                                b.cotacao.resumoFinanceiro?.premioTotal ||
                                Infinity
                            )
                        );
                    }
                ),
            [seguradoras, cotacoes]
        );

    const cotacaoSelecionada =
        cotacoes.find(
            cotacao =>
                cotacao.id === cotacaoSelecionadaId
        );

    const codigoCotacao =
        cotacaoSelecionada?.grupoCotacao?.codigo ||
        cotacoes[0]?.grupoCotacao?.codigo ||
        "Em processamento";

    const voltar = () => {
        navigate(
            "/",
            {
                state: {
                    formState
                }
            }
        );
    };

    if (!payload) {
        return (
            <main className={styles.page}>
                <div className={styles.emptyState}>
                    <span>Cotação não encontrada</span>
                    <h1>Inicie uma nova simulação</h1>
                    <p>
                        Não há dados de cotação disponíveis nesta página.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                    >
                        Nova cotação
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <section className={styles.summary}>
                    <div className={styles.summaryIntro}>
                        <span className={styles.eyebrow}>
                            Resultado da cotação
                        </span>

                        <h1>
                            Escolha a melhor proteção
                        </h1>

                        <p>
                            Compare as ofertas e selecione a opção ideal para o seu veículo.
                        </p>
                    </div>

                    <div className={styles.customerGrid}>
                        <div className={styles.customerItem}>
                            <span>Segurado</span>
                            <strong>
                                {payload.segurado?.nome || "-"}
                            </strong>
                        </div>

                        <div className={styles.customerItem}>
                            <span>CPF</span>
                            <strong>
                                {formatarCpf(
                                    payload.segurado?.documento
                                )}
                            </strong>
                        </div>

                        <div className={styles.customerItem}>
                            <span>Veículo</span>
                            <strong>
                                {payload.veiculo?.fabricante}{" "}
                                {payload.veiculo?.modelo}
                            </strong>
                        </div>

                        <div className={styles.customerItem}>
                            <span>Placa</span>
                            <strong>
                                {payload.veiculo?.placa || "-"}
                            </strong>
                        </div>

                        <div className={`${styles.customerItem} ${styles.quoteCode}`}>
                            <span>Código da cotação</span>
                            <strong title={codigoCotacao}>
                                {codigoCotacao}
                            </strong>
                        </div>
                    </div>
                </section>

                <div className={styles.offersHeader}>
                    <div>
                        <span className={styles.sectionLabel}>
                            Ofertas disponíveis
                        </span>
                        <h2>Compare as seguradoras</h2>
                    </div>

                    <div
                        className={`${styles.status} ${
                            finished
                                ? styles.statusFinished
                                : ""
                        }`}
                    >
                        <span />
                        {finished
                            ? "Cálculo finalizado"
                            : "Calculando ofertas"}
                    </div>
                </div>

                {erro && (
                    <div className={styles.alert}>
                        {erro}
                    </div>
                )}

                <section className={styles.grid}>
                    {ofertas.map(
                        ({ seguradora, cotacao }) => {

                            const selecionada =
                                cotacao?.id ===
                                cotacaoSelecionadaId;

                            const parcelamento =
                                obterParcelamento(cotacao);

                            return (
                                <article
                                    key={seguradora.codigoProduto}
                                    className={`${styles.offerCard} ${
                                        selecionada
                                            ? styles.offerCardSelected
                                            : ""
                                    } ${
                                        !cotacao
                                            ? styles.offerCardLoading
                                            : ""
                                    }`}
                                    onClick={() =>
                                        cotacao &&
                                        setCotacaoSelecionadaId(
                                            cotacao.id
                                        )
                                    }
                                >
                                    <div className={styles.offerTop}>
                                        <div className={styles.brand}>
                                            <div className={styles.logoBox}>
                                                {seguradora.logo ? (
                                                    <img
                                                        src={obterLogo(
                                                            seguradora.logo
                                                        )}
                                                        alt={`Logo ${seguradora.seguradora}`}
                                                    />
                                                ) : (
                                                    <span>
                                                        {seguradora.seguradora
                                                            .slice(0, 1)}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <strong>
                                                    {seguradora.seguradora}
                                                </strong>
                                                <span>
                                                    {seguradora.nome}
                                                </span>
                                            </div>
                                        </div>

                                        {cotacao && (
                                            <span className={styles.radio}>
                                                <span />
                                            </span>
                                        )}
                                    </div>

                                    {!cotacao ? (
                                        <div className={styles.calculating}>
                                            <div className={styles.dots}>
                                                <span />
                                                <span />
                                                <span />
                                            </div>
                                            <strong>
                                                Calculando sua oferta
                                            </strong>
                                            <p>
                                                A seguradora está analisando os dados.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.priceBlock}>
                                                <span>Valor à vista</span>
                                                <strong>
                                                    {formatarMoeda(
                                                        cotacao.resumoFinanceiro
                                                            ?.premioTotal
                                                    )}
                                                </strong>

                                                <p>
                                                    {parcelamento
                                                        ? `Em ${parcelamento.numero}x de ${formatarMoeda(parcelamento.valor)}`
                                                        : "Consulte as formas de pagamento"}
                                                </p>
                                            </div>

                                            <div className={styles.details}>
                                                <div>
                                                    <span>Franquia</span>
                                                    <strong>
                                                        {cotacao.franquia
                                                            ?.descricao ||
                                                            payload.franquia
                                                                ?.descricao ||
                                                            "-"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Nível de risco</span>
                                                    <strong>
                                                        {cotacao.scoreRisco
                                                            ?.nivel || "-"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Benefícios</span>
                                                    <strong>
                                                        {cotacao.beneficios
                                                            ?.length || 0}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className={styles.selectHint}>
                                                {selecionada
                                                    ? "Oferta selecionada"
                                                    : "Clique para selecionar"}
                                            </div>
                                        </>
                                    )}
                                </article>
                            );
                        }
                    )}
                </section>

                <section className={styles.actionsCard}>
                    <div>
                        <span>Próximo passo</span>
                        <strong>
                            {cotacaoSelecionada
                                ? "Oferta pronta para efetivação"
                                : "Selecione uma oferta para continuar"}
                        </strong>
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={voltar}
                        >
                            Voltar
                        </button>

                        <button
                            type="button"
                            className={styles.nextButton}
                            disabled={!cotacaoSelecionada}
                        >
                            <span>Avançar</span>
                            <span className={styles.arrow}>→</span>
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
