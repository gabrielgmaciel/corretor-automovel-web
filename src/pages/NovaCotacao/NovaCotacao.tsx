import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../../services/api";

import SectionCard from "../../components/SectionCard/SectionCard";
import MultiSelectChips from "../../components/MultiSelectChips/MultiSelectChips";

import styles from "./NovaCotacao.module.css";

type RespostaQuestionario = {
    codigo: string;
    descricao: string;
};

type PerguntaQuestionario = {
    codigo: string;
    descricao: string;
    explicacao?: string;
    id?: string;
    respostas: RespostaQuestionario[];
};

type Franquia = {
    codigo: string;
    descricao: string;
    explicacao?: string;
    id?: string;
};

type Cobertura = {
    tipoCobertura?: string;
    codigo: string;
    descricao: string;
    explicacao?: string;
    id?: string;
};

type Endereco = {
    logradouro?: string;
    bairro?: string;
    estado?: string;
    cidade?: string;
    cep?: string;
};

type Veiculo = {
    valor: number;
    marca: string;
    modelo: string;
    anoModelo: string[];
    anoFabricacao: string[];
    combustivel: string;
    codigoFipe: string;
};

const somenteNumeros = (value: string) =>
    value.replace(/\D/g, "");

const formatarCpf = (value: string) =>
    somenteNumeros(value)
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");

const formatarTelefone = (value: string) => {

    const numeros =
        somenteNumeros(value).slice(0, 11);

    if (numeros.length <= 2) {
        return numeros
            ? `(${numeros}`
            : "";
    }

    const ddd =
        numeros.slice(0, 2);

    const numero =
        numeros.slice(2);

    if (numero.length <= 4) {
        return `(${ddd}) ${numero}`;
    }

    const tamanhoPrefixo =
        numeros.length === 11
            ? 5
            : 4;

    return `(${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
};

const formatarCep = (value: string) =>
    somenteNumeros(value)
        .slice(0, 8)
        .replace(/^(\d{5})(\d)/, "$1-$2");

const ASSISTANT_CONTEXT_KEY =
    "corretor-auto-assistant-context";

export default function NovaCotacao() {

    const navigate = useNavigate();
    const location = useLocation();
    const formState =
        location.state?.formState;
    const assistantCoverageSuggestions =
        location.state?.assistantCoverageSuggestions as
            Array<{
                codigo: string;
                valor?: number | null;
            }> | undefined;
    const assistantFranchiseSuggestion =
        location.state?.assistantFranchiseSuggestion as
            {
                codigo: string;
                descricao?: string;
            } | undefined;

    const [cpf, setCpf] =
        useState(formState?.cpf || "");

    const [nome, setNome] =
        useState(formState?.nome || "");

    const [email, setEmail] =
        useState(formState?.email || "");

    const [telefone, setTelefone] =
        useState(formState?.telefone || "");

    const [dataNascimento, setDataNascimento] =
        useState(formState?.dataNascimento || "");

    const [sexo, setSexo] =
        useState(formState?.sexo || "MASCULINO");

    const [estadoCivil, setEstadoCivil] =
        useState(formState?.estadoCivil || "");

    const [cep, setCep] =
        useState(formState?.cep || "");

    const [endereco, setEndereco] =
        useState<Endereco>(formState?.endereco || {});

    const [numero, setNumero] =
        useState(formState?.numero || "");

    const [complemento, setComplemento] =
        useState(formState?.complemento || "");

    const [modeloBusca, setModeloBusca] =
        useState(formState?.modeloBusca || "");

    const [veiculos, setVeiculos] =
        useState<Veiculo[]>([]);

    const [veiculoSelecionado, setVeiculoSelecionado] =
        useState<Veiculo | undefined>(formState?.veiculoSelecionado);

    const [anoFabricacao, setAnoFabricacao] =
        useState(formState?.anoFabricacao || "");

    const [anoModelo, setAnoModelo] =
        useState(formState?.anoModelo || "");

    const ordenarAnosDecrescente = (anos: string[]) =>
        [...new Set(anos)].sort(
            (anoA, anoB) => Number(anoB) - Number(anoA)
        );

    const anosFabricacaoOrdenados =
        veiculoSelecionado
            ? ordenarAnosDecrescente(
                veiculoSelecionado.anoFabricacao
            )
            : [];

    const anosModeloOrdenados =
        veiculoSelecionado
            ? ordenarAnosDecrescente(
                veiculoSelecionado.anoModelo
            )
            : [];

    const anosFabricacaoDisponiveis =
        anoModelo
            ? anosFabricacaoOrdenados.filter(ano =>
                Number(ano) === Number(anoModelo)
                || Number(ano) === Number(anoModelo) - 1
            )
            : anosFabricacaoOrdenados;

    const anosModeloDisponiveis =
        anoFabricacao
            ? anosModeloOrdenados.filter(ano =>
                Number(ano) === Number(anoFabricacao)
                || Number(ano) === Number(anoFabricacao) + 1
            )
            : anosModeloOrdenados;

    const alterarAnoFabricacao = (ano: string) => {
        setAnoFabricacao(ano);

        if (
            anoModelo
            && Number(anoModelo) !== Number(ano)
            && Number(anoModelo) !== Number(ano) + 1
        ) {
            setAnoModelo("");
        }
    };

    const alterarAnoModelo = (ano: string) => {
        setAnoModelo(ano);

        if (
            anoFabricacao
            && Number(anoFabricacao) !== Number(ano)
            && Number(anoFabricacao) !== Number(ano) - 1
        ) {
            setAnoFabricacao("");
        }
    };

    const [placa, setPlaca] =
        useState(formState?.placa || "");

    const [chassi, setChassi] =
        useState(formState?.chassi || "");

    const [questionario, setQuestionario] =
        useState<PerguntaQuestionario[]>([]);

    const [respostasQuestionario, setRespostasQuestionario] =
        useState<Record<string, string>>(
            formState?.respostasQuestionario || {}
        );

    useEffect(() => {
        const cidade =
            endereco.cidade?.trim();
        const estado =
            endereco.estado?.trim();

        if (!cidade || !estado) {
            localStorage.removeItem(
                ASSISTANT_CONTEXT_KEY
            );
            return;
        }

        localStorage.setItem(
            ASSISTANT_CONTEXT_KEY,
            JSON.stringify({
                localidade: {
                    cidade,
                    estado,
                    cep: somenteNumeros(cep)
                },
                perfil: {
                    fabricante:
                        veiculoSelecionado?.marca,
                    modelo:
                        veiculoSelecionado?.modelo,
                    anoModelo:
                        anoModelo
                            ? Number(anoModelo)
                            : undefined,
                    respostasQuestionario
                }
            })
        );
    }, [
        cep,
        endereco.cidade,
        endereco.estado,
        veiculoSelecionado,
        anoModelo,
        respostasQuestionario
    ]);

    const [franquias, setFranquias] =
        useState<Franquia[]>([]);

    const [franquiaSelecionada, setFranquiaSelecionada] =
        useState(formState?.franquiaSelecionada || "");

    const [coberturas, setCoberturas] =
        useState<Cobertura[]>([]);

    const [valoresCoberturasPrincipais, setValoresCoberturasPrincipais] =
        useState<Record<string, string>>(
            formState?.valoresCoberturasPrincipais || {}
        );

    const [valoresProtecoes, setValoresProtecoes] =
        useState<Record<string, string>>(
            formState?.valoresProtecoes || {}
        );

    const [coberturasAdicionaisSelecionadas, setCoberturasAdicionaisSelecionadas] =
        useState<Cobertura[]>(
            formState?.coberturasAdicionaisSelecionadas || []
        );

    const [acessoriosSelecionados, setAcessoriosSelecionados] =
        useState<Cobertura[]>(
            formState?.acessoriosSelecionados || []
        );

    const [loadingDominios, setLoadingDominios] =
        useState(false);

    const [loadingVeiculos, setLoadingVeiculos] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const buscaVeiculoId =
        useRef(0);

    useEffect(() => {
        carregarDominios();
    }, []);

    useEffect(() => {
        if (!formState) return;

        navigate(
            location.pathname,
            {
                replace: true,
                state: null
            }
        );
    }, []);

    const coberturasPrincipais =
        useMemo(
            () =>
                coberturas.filter(
                    cobertura =>
                        cobertura.tipoCobertura === "coberturas_principais" ||
                        cobertura.codigo === "casco"
                ),
            [coberturas]
        );

    const coberturasAdicionais =
        useMemo(
            () =>
                coberturas.filter(
                    cobertura =>
                        cobertura.tipoCobertura === "coberturas_adicionais"
                ),
            [coberturas]
        );

    const acessorios =
        useMemo(
            () =>
                coberturas.filter(
                    cobertura =>
                        cobertura.tipoCobertura === "acessorios"
                ),
            [coberturas]
        );

    const protecoes =
        useMemo(
            () =>
                coberturas.filter(
                    cobertura =>
                        cobertura.tipoCobertura === "protecoes"
                ),
            [coberturas]
        );

    useEffect(() => {
        const aplicarSugestoes = (event: Event) => {
            const sugestoes =
                (event as CustomEvent<Array<{
                    codigo: string;
                    valor?: number | null;
                }>>).detail || [];

            setValoresCoberturasPrincipais(current => {
                const next = { ...current };
                sugestoes.forEach(sugestao => {
                    if (
                        sugestao.valor != null &&
                        coberturasPrincipais.some(
                            item =>
                                item.codigo === sugestao.codigo &&
                                item.codigo !== "casco"
                        )
                    ) {
                        next[sugestao.codigo] =
                            sugestao.valor.toLocaleString(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL"
                                }
                            );
                    }
                });
                return next;
            });

            setValoresProtecoes(current => {
                const next = { ...current };
                sugestoes.forEach(sugestao => {
                    if (
                        sugestao.valor != null &&
                        protecoes.some(item => item.codigo === sugestao.codigo)
                    ) {
                        next[sugestao.codigo] =
                            sugestao.valor.toLocaleString(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL"
                                }
                            );
                    }
                });
                return next;
            });

            setCoberturasAdicionaisSelecionadas(current => {
                const codigos = new Set(current.map(item => item.codigo));
                return [
                    ...current,
                    ...coberturasAdicionais.filter(item =>
                        sugestoes.some(sugestao =>
                            sugestao.codigo === item.codigo &&
                            !codigos.has(item.codigo)
                        )
                    )
                ];
            });
        };

        window.addEventListener(
            "assistente:preencher-coberturas",
            aplicarSugestoes
        );
        return () =>
            window.removeEventListener(
                "assistente:preencher-coberturas",
                aplicarSugestoes
            );
    }, [
        coberturasPrincipais,
        coberturasAdicionais,
        protecoes
    ]);

    useEffect(() => {
        if (
            !assistantCoverageSuggestions?.length ||
            coberturas.length === 0
        ) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent(
                "assistente:preencher-coberturas",
                {
                    detail:
                        assistantCoverageSuggestions
                }
            )
        );
    }, [
        assistantCoverageSuggestions,
        coberturas.length
    ]);

    useEffect(() => {
        const aplicarFranquia = (event: Event) => {
            const sugestao =
                (event as CustomEvent<{
                    codigo?: string;
                }>).detail;

            if (
                sugestao?.codigo &&
                franquias.some(
                    franquia =>
                        franquia.codigo === sugestao.codigo
                )
            ) {
                setFranquiaSelecionada(sugestao.codigo);
            }
        };

        window.addEventListener(
            "assistente:preencher-franquia",
            aplicarFranquia
        );
        return () =>
            window.removeEventListener(
                "assistente:preencher-franquia",
                aplicarFranquia
            );
    }, [franquias]);

    useEffect(() => {
        if (
            !assistantFranchiseSuggestion?.codigo ||
            franquias.length === 0
        ) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent(
                "assistente:preencher-franquia",
                {
                    detail:
                        assistantFranchiseSuggestion
                }
            )
        );
    }, [
        assistantFranchiseSuggestion,
        franquias.length
    ]);

    const carregarDominios = async () => {

        try {
            setLoadingDominios(true);
            setErro("");

            const [
                perguntas,
                franquiasResp,
                coberturasResp
            ] = await Promise.all([
                api.get("/dominios/questionario"),
                api.get("/dominios/franquias"),
                api.get("/dominios/coberturas")
            ]);

            setQuestionario(perguntas.data);
            setFranquias(franquiasResp.data);
            setCoberturas(coberturasResp.data);
        } catch (error) {
            setErro(
                "Não foi possível carregar os domínios da cotação."
            );
        } finally {
            setLoadingDominios(false);
        }
    };

    const buscarCep = async (cepValue: string) => {

        const cepNumerico =
            somenteNumeros(cepValue);

        if (cepNumerico.length !== 8) return;

        try {
            const response =
                await api.get(
                    `/enderecos/buscar/cep?cep=${cepNumerico}`
                );

            setEndereco(response.data);
        } catch (error) {
            setErro(
                "Não foi possível buscar o endereço pelo CEP."
            );
        }
    };

    const buscarVeiculo = async (descricao: string) => {

        const buscaAtual =
            ++buscaVeiculoId.current;

        if (!descricao.trim()) {
            setVeiculos([]);
            setLoadingVeiculos(false);
            return;
        }

        try {
            setLoadingVeiculos(true);
            setErro("");

            const response =
                await api.get(
                    `/automovel/buscar/modelo?descricao=${encodeURIComponent(descricao)}`
                );

            if (buscaAtual !== buscaVeiculoId.current) return;

            setVeiculos(response.data);
        } catch (error) {
            if (buscaAtual !== buscaVeiculoId.current) return;

            setErro(
                "Não foi possível buscar os veículos."
            );
        } finally {
            if (buscaAtual === buscaVeiculoId.current) {
                setLoadingVeiculos(false);
            }
        }
    };

    const alterarModeloBusca = (value: string) => {

        setModeloBusca(value);
        setVeiculoSelecionado(undefined);
        setValoresCoberturasPrincipais(
            current => ({
                ...current,
                casco: ""
            })
        );
        setAnoFabricacao("");
        setAnoModelo("");
        setPlaca("");
        setChassi("");

        buscarVeiculo(value);
    };

    const selecionarVeiculo = (veiculo: Veiculo) => {

        setVeiculoSelecionado(veiculo);
        setModeloBusca(
            `${veiculo.marca} - ${veiculo.modelo}`
        );
        setValoresCoberturasPrincipais(
            current => ({
                ...current,
                casco: veiculo.valor.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                )
            })
        );

        setAnoFabricacao("");
        setAnoModelo("");
        setPlaca("");
        setChassi("");
    };

    const formatarMoedaInput = (value: string) => {

        const onlyNumbers =
            value.replace(/\D/g, "");

        if (!onlyNumbers) return "";

        return (
            Number(onlyNumbers) / 100
        ).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    };

    const moedaParaNumero = (value: string) => {

        const onlyNumbers =
            value.replace(/\D/g, "");

        if (!onlyNumbers) return 0;

        return Number(onlyNumbers) / 100;
    };

    const alterarValorCoberturaPrincipal = (
        codigo: string,
        valor: string
    ) => {

        setValoresCoberturasPrincipais(
            current => ({
                ...current,
                [codigo]: formatarMoedaInput(valor)
            })
        );
    };

    const alterarValorProtecao = (
        codigo: string,
        valor: string
    ) => {

        setValoresProtecoes(
            current => ({
                ...current,
                [codigo]: formatarMoedaInput(valor)
            })
        );
    };

    const validarFormulario = () => {

        if (!cpf || !nome || !email || !telefone || !dataNascimento) {
            return "Preencha os dados obrigatórios do segurado.";
        }

        if (!estadoCivil) {
            return "Informe o estado civil.";
        }

        if (!cep || !endereco.logradouro || !numero) {
            return "Preencha o endereço obrigatório.";
        }

        const perguntasSemResposta =
            questionario.filter(
                pergunta =>
                    !respostasQuestionario[pergunta.codigo]
            );

        if (perguntasSemResposta.length > 0) {
            return "Responda todas as perguntas do questionário.";
        }

        if (!veiculoSelecionado) {
            return "Selecione um veículo.";
        }

        if (!anoFabricacao || !anoModelo || !placa || !chassi) {
            return "Preencha ano de fabricação, ano modelo, placa e chassi.";
        }

        const coberturaPrincipalSemValor =
            coberturasPrincipais.filter(
                cobertura =>
                    !valoresCoberturasPrincipais[cobertura.codigo]
            );

        if (coberturaPrincipalSemValor.length > 0) {
            return "Informe o valor de todas as coberturas principais.";
        }

        if (!franquiaSelecionada) {
            return "Selecione uma franquia.";
        }

        return "";
    };

    const realizarCotacao = () => {

        const erroValidacao =
            validarFormulario();

        if (erroValidacao) {
            setErro(erroValidacao);
            return;
        }

        const franquia =
            franquias.find(
                item =>
                    item.codigo === franquiaSelecionada
            );

        const coberturasPrincipaisPayload =
            coberturasPrincipais.map(
                cobertura => ({
                    codigo: cobertura.codigo,
                    descricao: cobertura.descricao,
                    valor: moedaParaNumero(
                        valoresCoberturasPrincipais[
                            cobertura.codigo
                        ]
                    )
                })
            );

        const protecoesPayload =
            protecoes
                .filter(
                    protecao =>
                        valoresProtecoes[protecao.codigo]
                )
                .map(
                    protecao => ({
                        codigo: protecao.codigo,
                        descricao: protecao.descricao,
                        valor: moedaParaNumero(
                            valoresProtecoes[
                                protecao.codigo
                            ]
                        )
                    })
                );

        const coberturasAdicionaisPayload =
            coberturasAdicionaisSelecionadas.map(
                cobertura => ({
                    codigo: cobertura.codigo,
                    descricao: cobertura.descricao
                })
            );

        const acessoriosPayload =
            acessoriosSelecionados.map(
                acessorio => ({
                    codigo: acessorio.codigo,
                    descricao: acessorio.descricao
                })
            );

        const questionarioPayload =
            questionario.map(
                pergunta => {

                    const respostaCodigo =
                        respostasQuestionario[
                            pergunta.codigo
                        ];

                    const respostaSelecionada =
                        pergunta.respostas.find(
                            resposta =>
                                resposta.codigo === respostaCodigo
                        );

                    return {
                        codigo: pergunta.codigo,
                        descricao: pergunta.descricao,
                        resposta:
                            respostaSelecionada?.codigo ||
                            respostaCodigo
                    };
                }
            );

        const payload = {

            tipoSeguro: {
                codigo: "NOVO",
                descricao: "Seguro Novo",
                resposta: "SIM"
            },

            segurado: {
                documento: somenteNumeros(cpf),
                nome,
                email,
                telefone: somenteNumeros(telefone),
                dataNascimento,
                sexo,
                estadoCivil: {
                    codigo: estadoCivil,
                    descricao: estadoCivil,
                    resposta: estadoCivil
                },
                endereco: {
                    logradouro:
                        endereco.logradouro,
                    numero,
                    complemento,
                    bairro:
                        endereco.bairro,
                    estado:
                        endereco.estado,
                    cidade:
                        endereco.cidade,
                    cep: somenteNumeros(cep)
                }
            },

            questionario:
                questionarioPayload,

            veiculo: {
                placa,
                chassi,
                fabricante:
                    veiculoSelecionado?.marca,
                modelo:
                    veiculoSelecionado?.modelo,
                anoFabricacao:
                    Number(anoFabricacao),
                anoModelo:
                    Number(anoModelo),
                codigoFipe:
                    veiculoSelecionado?.codigoFipe
            },

            franquia: {
                codigo:
                    franquia?.codigo,
                descricao:
                    franquia?.descricao,
                resposta:
                    franquia?.codigo
            },

            coberturas: [
                ...coberturasPrincipaisPayload,
                ...coberturasAdicionaisPayload,
                ...acessoriosPayload,
                ...protecoesPayload
            ]
        };

        navigate(
            "/resultado",
            {
                state: {
                    payload,
                    formState: {
                        cpf,
                        nome,
                        email,
                        telefone,
                        dataNascimento,
                        sexo,
                        estadoCivil,
                        cep,
                        endereco,
                        numero,
                        complemento,
                        modeloBusca,
                        veiculoSelecionado,
                        anoFabricacao,
                        anoModelo,
                        placa,
                        chassi,
                        respostasQuestionario,
                        franquiaSelecionada,
                        valoresCoberturasPrincipais,
                        valoresProtecoes,
                        coberturasAdicionaisSelecionadas,
                        acessoriosSelecionados
                    }
                }
            }
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>

                <div className={styles.hero}>
                    <div>
                        <span className={styles.eyebrow}>
                            Seguro Auto
                        </span>

                        <h1 className={styles.title}>
                            Nova Cotação
                        </h1>

                        <p className={styles.subtitle}>
                            Preencha os dados abaixo para montar uma cotação personalizada.
                        </p>
                    </div>

                    <div className={styles.heroAside}>
                        <div className={styles.heroBadge}>
                            <span className={styles.statusDot} />
                            Cotação inteligente
                        </div>

                        <div className={styles.heroMetric}>
                            <strong>Seguro sob medida</strong>
                            <span>
                                Uma jornada simples, segura e personalizada.
                            </span>
                        </div>
                    </div>
                </div>

                {erro && (
                    <div className={styles.alert}>
                        {erro}
                    </div>
                )}

                {loadingDominios && (
                    <div className={styles.loading}>
                        Carregando dados da cotação...
                    </div>
                )}

                <div className={styles.sections}>

                    <SectionCard
                        title="Segurado"
                        defaultOpen
                        hasPendingFields={
                            !cpf ||
                            !nome ||
                            !email ||
                            !telefone ||
                            !dataNascimento ||
                            !estadoCivil
                        }
                    >
                        <div className={styles.grid3}>
                            <div className={styles.field}>
                                <label>CPF *</label>
                                <input
                                    className={styles.input}
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={e =>
                                        setCpf(formatarCpf(e.target.value))
                                    }
                                    inputMode="numeric"
                                    maxLength={14}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Nome *</label>
                                <input
                                    className={styles.input}
                                    placeholder="Nome completo"
                                    value={nome}
                                    onChange={e =>
                                        setNome(e.target.value)
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Email *</label>
                                <input
                                    className={styles.input}
                                    placeholder="email@dominio.com"
                                    value={email}
                                    onChange={e =>
                                        setEmail(e.target.value)
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Telefone *</label>
                                <input
                                    className={styles.input}
                                    placeholder="(61) 99999-8888"
                                    value={telefone}
                                    onChange={e =>
                                        setTelefone(
                                            formatarTelefone(e.target.value)
                                        )
                                    }
                                    inputMode="tel"
                                    maxLength={15}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Data de nascimento *</label>
                                <input
                                    className={styles.input}
                                    type="date"
                                    value={dataNascimento}
                                    onChange={e =>
                                        setDataNascimento(e.target.value)
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Sexo *</label>
                                <select
                                    className={styles.select}
                                    value={sexo}
                                    onChange={e =>
                                        setSexo(e.target.value)
                                    }
                                >
                                    <option value="MASCULINO">
                                        Masculino
                                    </option>

                                    <option value="FEMININO">
                                        Feminino
                                    </option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Estado civil *</label>
                                <select
                                    className={styles.select}
                                    value={estadoCivil}
                                    onChange={e =>
                                        setEstadoCivil(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Selecione
                                    </option>

                                    <option value="SOLTEIRO">
                                        Solteiro
                                    </option>

                                    <option value="CASADO">
                                        Casado
                                    </option>

                                    <option value="DIVORCIADO">
                                        Divorciado
                                    </option>

                                    <option value="VIUVO">
                                        Viúvo
                                    </option>
                                </select>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Endereço"
                        hasPendingFields={
                            !cep ||
                            !endereco.logradouro ||
                            !numero
                        }
                    >
                        <div className={styles.grid3}>
                            <div className={styles.field}>
                                <label>CEP *</label>
                                <input
                                    className={styles.input}
                                    placeholder="00000-000"
                                    value={cep}
                                    onChange={e => {
                                        const value =
                                            formatarCep(e.target.value);

                                        setCep(value);
                                        buscarCep(value);
                                    }}
                                    inputMode="numeric"
                                    maxLength={9}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Logradouro *</label>
                                <input
                                    className={styles.input}
                                    value={endereco.logradouro || ""}
                                    placeholder="Logradouro"
                                    onChange={e =>
                                        setEndereco({
                                            ...endereco,
                                            logradouro:
                                                e.target.value
                                        })
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Número *</label>
                                <input
                                    className={styles.input}
                                    placeholder="Número"
                                    value={numero}
                                    onChange={e =>
                                        setNumero(e.target.value)
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Complemento</label>
                                <input
                                    className={styles.input}
                                    placeholder="Complemento"
                                    value={complemento}
                                    onChange={e =>
                                        setComplemento(e.target.value)
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Bairro</label>
                                <input
                                    className={styles.input}
                                    value={endereco.bairro || ""}
                                    placeholder="Bairro"
                                    onChange={e =>
                                        setEndereco({
                                            ...endereco,
                                            bairro:
                                                e.target.value
                                        })
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Cidade</label>
                                <input
                                    className={styles.input}
                                    value={endereco.cidade || ""}
                                    placeholder="Cidade"
                                    onChange={e =>
                                        setEndereco({
                                            ...endereco,
                                            cidade:
                                                e.target.value
                                        })
                                    }
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Estado</label>
                                <input
                                    className={styles.input}
                                    value={endereco.estado || ""}
                                    placeholder="UF"
                                    onChange={e =>
                                        setEndereco({
                                            ...endereco,
                                            estado:
                                                e.target.value
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Questionário"
                        hasPendingFields={
                            questionario.length > 0 &&
                            questionario.some(
                                pergunta =>
                                    !respostasQuestionario[
                                        pergunta.codigo
                                    ]
                            )
                        }
                    >
                        <div className={styles.grid3}>
                            {questionario.map(pergunta => (
                                <div
                                    key={pergunta.codigo}
                                    className={styles.field}
                                >
                                    <label
                                        title={pergunta.explicacao}
                                    >
                                        {pergunta.descricao} *
                                    </label>

                                    <select
                                        className={styles.select}
                                        value={
                                            respostasQuestionario[
                                                pergunta.codigo
                                            ] || ""
                                        }
                                        onChange={e =>
                                            setRespostasQuestionario(
                                                current => ({
                                                    ...current,
                                                    [pergunta.codigo]:
                                                        e.target.value
                                                })
                                            )
                                        }
                                    >
                                        <option value="">
                                            Selecione
                                        </option>

                                        {pergunta.respostas.map(resposta => (
                                            <option
                                                key={resposta.codigo}
                                                value={resposta.codigo}
                                            >
                                                {resposta.descricao}
                                            </option>
                                        ))}
                                    </select>

                                    {pergunta.explicacao && (
                                        <small className={styles.hint}>
                                            {pergunta.explicacao}
                                        </small>
                                    )}
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Veículo"
                        allowOverflow
                        hasPendingFields={
                            !veiculoSelecionado ||
                            !anoFabricacao ||
                            !anoModelo ||
                            !placa ||
                            !chassi
                        }
                    >
                        <div className={styles.vehicleSearch}>
                            <div className={styles.searchField}>
                                <label>Modelo do veículo *</label>

                                <input
                                    className={styles.input}
                                    placeholder="Digite o modelo. Ex: Civic"
                                    value={modeloBusca}
                                    onChange={e =>
                                        alterarModeloBusca(e.target.value)
                                    }
                                />

                                {modeloBusca.trim() &&
                                    !veiculoSelecionado && (
                                        <div className={styles.vehicleResults}>
                                            {loadingVeiculos && (
                                                <div className={styles.vehicleResultMessage}>
                                                    Buscando veículos...
                                                </div>
                                            )}

                                            {!loadingVeiculos &&
                                                veiculos.length === 0 && (
                                                    <div className={styles.vehicleResultMessage}>
                                                        Nenhum veículo encontrado
                                                    </div>
                                                )}

                                            {!loadingVeiculos &&
                                                veiculos.map(veiculo => (
                                                    <button
                                                        key={veiculo.codigoFipe}
                                                        type="button"
                                                        className={styles.vehicleResult}
                                                        onClick={() =>
                                                            selecionarVeiculo(veiculo)
                                                        }
                                                    >
                                                        {veiculo.marca} - {veiculo.modelo}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                            </div>
                        </div>

                        {veiculoSelecionado && (
                            <div className={styles.vehicleDetails}>
                                <div className={styles.selectedVehicle}>
                                    <span>
                                        Veículo selecionado
                                    </span>

                                    <strong>
                                        {veiculoSelecionado.modelo}
                                    </strong>
                                </div>

                                <div className={styles.grid4}>
                                    <div className={styles.field}>
                                        <label>Ano fabricação *</label>
                                        <select
                                            className={styles.select}
                                            value={anoFabricacao}
                                            onChange={e =>
                                                alterarAnoFabricacao(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            {anosFabricacaoDisponiveis.map(ano => (
                                                <option
                                                    key={ano}
                                                    value={ano}
                                                >
                                                    {ano}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label>Ano modelo *</label>
                                        <select
                                            className={styles.select}
                                            value={anoModelo}
                                            onChange={e =>
                                                alterarAnoModelo(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            {anosModeloDisponiveis.map(ano => (
                                                <option
                                                    key={ano}
                                                    value={ano}
                                                >
                                                    {ano}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label>Placa *</label>
                                        <input
                                            className={styles.input}
                                            placeholder="ABC1D23"
                                            value={placa}
                                            onChange={e =>
                                                setPlaca(
                                                    e.target.value.toUpperCase()
                                                )
                                            }
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>Chassi *</label>
                                        <input
                                            className={styles.input}
                                            placeholder="9BWZZZ377VT004251"
                                            value={chassi}
                                            onChange={e =>
                                                setChassi(
                                                    e.target.value.toUpperCase()
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Coberturas Principais"
                        hasPendingFields={
                            coberturasPrincipais.length > 0 &&
                            coberturasPrincipais.some(
                                cobertura =>
                                    !valoresCoberturasPrincipais[
                                        cobertura.codigo
                                    ]
                            )
                        }
                    >
                        <div className={styles.coverageGrid}>
                            {coberturasPrincipais.map(cobertura => (
                                <div
                                    key={cobertura.codigo}
                                    className={styles.coverageCard}
                                >
                                    <div>
                                        <strong>
                                            {cobertura.descricao}
                                        </strong>

                                        {cobertura.explicacao && (
                                            <p>
                                                {cobertura.explicacao}
                                            </p>
                                        )}
                                    </div>

                                    <input
                                        className={`${styles.moneyInput} ${
                                            cobertura.codigo === "casco"
                                                ? styles.moneyInputLocked
                                                : ""
                                        }`}
                                        placeholder="R$ 0,00"
                                        value={
                                            valoresCoberturasPrincipais[
                                                cobertura.codigo
                                            ] || ""
                                        }
                                        readOnly={
                                            cobertura.codigo === "casco"
                                        }
                                        onChange={e =>
                                            cobertura.codigo !== "casco" &&
                                            alterarValorCoberturaPrincipal(
                                                cobertura.codigo,
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Franquia"
                        hasPendingFields={!franquiaSelecionada}
                    >
                        <div className={styles.field}>
                            <label>Selecione a franquia *</label>

                            <select
                                className={styles.select}
                                value={franquiaSelecionada}
                                onChange={e =>
                                    setFranquiaSelecionada(e.target.value)
                                }
                            >
                                <option value="">
                                    Selecione
                                </option>

                                {franquias.map(franquia => (
                                    <option
                                        key={franquia.codigo}
                                        value={franquia.codigo}
                                    >
                                        {franquia.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {franquiaSelecionada && (
                            <div className={styles.infoBox}>
                                {
                                    franquias.find(
                                        item =>
                                            item.codigo ===
                                            franquiaSelecionada
                                    )?.explicacao
                                }
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Coberturas Adicionais">
                        <MultiSelectChips
                            options={coberturasAdicionais}
                            selected={coberturasAdicionaisSelecionadas}
                            onChange={setCoberturasAdicionaisSelecionadas}
                            placeholder="Adicionar cobertura"
                            emptyText="Nenhuma cobertura adicional selecionada"
                        />
                    </SectionCard>

                    <SectionCard title="Acessórios">
                        <MultiSelectChips
                            options={acessorios}
                            selected={acessoriosSelecionados}
                            onChange={setAcessoriosSelecionados}
                            placeholder="Adicionar acessório"
                            emptyText="Nenhum acessório selecionado"
                        />
                    </SectionCard>

                    <SectionCard title="Proteções">
                        <div className={styles.coverageGrid}>
                            {protecoes.map(protecao => (
                                <div
                                    key={protecao.codigo}
                                    className={styles.coverageCard}
                                >
                                    <div>
                                        <strong>
                                            {protecao.descricao}
                                        </strong>

                                        {protecao.explicacao && (
                                            <p>
                                                {protecao.explicacao}
                                            </p>
                                        )}
                                    </div>

                                    <input
                                        className={styles.moneyInput}
                                        placeholder="R$ 0,00 opcional"
                                        value={
                                            valoresProtecoes[
                                                protecao.codigo
                                            ] || ""
                                        }
                                        onChange={e =>
                                            alterarValorProtecao(
                                                protecao.codigo,
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                </div>

                <div className={styles.footer}>
                    <div className={styles.footerMessage}>
                        <span>Pronto para comparar?</span>
                        <strong>
                            Solicite agora as melhores ofertas para o seu veículo
                        </strong>
                    </div>

                    <button
                        type="button"
                        className={styles.submitButton}
                        onClick={realizarCotacao}
                    >
                        <span>Solicitar cotação</span>
                        <span className={styles.submitArrow}>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
