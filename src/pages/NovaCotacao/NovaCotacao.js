import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import SectionCard from "../../components/SectionCard/SectionCard";
import MultiSelectChips from "../../components/MultiSelectChips/MultiSelectChips";
import styles from "./NovaCotacao.module.css";
const somenteNumeros = (value) => value.replace(/\D/g, "");
const formatarCpf = (value) => somenteNumeros(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
const formatarTelefone = (value) => {
    const numeros = somenteNumeros(value).slice(0, 11);
    if (numeros.length <= 2) {
        return numeros
            ? `(${numeros}`
            : "";
    }
    const ddd = numeros.slice(0, 2);
    const numero = numeros.slice(2);
    if (numero.length <= 4) {
        return `(${ddd}) ${numero}`;
    }
    const tamanhoPrefixo = numeros.length === 11
        ? 5
        : 4;
    return `(${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
};
const formatarCep = (value) => somenteNumeros(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
const ASSISTANT_CONTEXT_KEY = "corretor-auto-assistant-context";
export default function NovaCotacao() {
    const navigate = useNavigate();
    const location = useLocation();
    const formState = location.state?.formState;
    const assistantCoverageSuggestions = location.state?.assistantCoverageSuggestions;
    const assistantFranchiseSuggestion = location.state?.assistantFranchiseSuggestion;
    const [cpf, setCpf] = useState(formState?.cpf || "");
    const [nome, setNome] = useState(formState?.nome || "");
    const [email, setEmail] = useState(formState?.email || "");
    const [telefone, setTelefone] = useState(formState?.telefone || "");
    const [dataNascimento, setDataNascimento] = useState(formState?.dataNascimento || "");
    const [sexo, setSexo] = useState(formState?.sexo || "MASCULINO");
    const [estadoCivil, setEstadoCivil] = useState(formState?.estadoCivil || "");
    const [cep, setCep] = useState(formState?.cep || "");
    const [endereco, setEndereco] = useState(formState?.endereco || {});
    const [numero, setNumero] = useState(formState?.numero || "");
    const [complemento, setComplemento] = useState(formState?.complemento || "");
    const [modeloBusca, setModeloBusca] = useState(formState?.modeloBusca || "");
    const [veiculos, setVeiculos] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(formState?.veiculoSelecionado);
    const [anoFabricacao, setAnoFabricacao] = useState(formState?.anoFabricacao || "");
    const [anoModelo, setAnoModelo] = useState(formState?.anoModelo || "");
    const ordenarAnosDecrescente = (anos) => [...new Set(anos)].sort((anoA, anoB) => Number(anoB) - Number(anoA));
    const anosFabricacaoOrdenados = veiculoSelecionado
        ? ordenarAnosDecrescente(veiculoSelecionado.anoFabricacao)
        : [];
    const anosModeloOrdenados = veiculoSelecionado
        ? ordenarAnosDecrescente(veiculoSelecionado.anoModelo)
        : [];
    const anosFabricacaoDisponiveis = anoModelo
        ? anosFabricacaoOrdenados.filter(ano => Number(ano) === Number(anoModelo)
            || Number(ano) === Number(anoModelo) - 1)
        : anosFabricacaoOrdenados;
    const anosModeloDisponiveis = anoFabricacao
        ? anosModeloOrdenados.filter(ano => Number(ano) === Number(anoFabricacao)
            || Number(ano) === Number(anoFabricacao) + 1)
        : anosModeloOrdenados;
    const alterarAnoFabricacao = (ano) => {
        setAnoFabricacao(ano);
        if (anoModelo
            && Number(anoModelo) !== Number(ano)
            && Number(anoModelo) !== Number(ano) + 1) {
            setAnoModelo("");
        }
    };
    const alterarAnoModelo = (ano) => {
        setAnoModelo(ano);
        if (anoFabricacao
            && Number(anoFabricacao) !== Number(ano)
            && Number(anoFabricacao) !== Number(ano) - 1) {
            setAnoFabricacao("");
        }
    };
    const [placa, setPlaca] = useState(formState?.placa || "");
    const [chassi, setChassi] = useState(formState?.chassi || "");
    const [questionario, setQuestionario] = useState([]);
    const [respostasQuestionario, setRespostasQuestionario] = useState(formState?.respostasQuestionario || {});
    useEffect(() => {
        const cidade = endereco.cidade?.trim();
        const estado = endereco.estado?.trim();
        if (!cidade || !estado) {
            localStorage.removeItem(ASSISTANT_CONTEXT_KEY);
            return;
        }
        localStorage.setItem(ASSISTANT_CONTEXT_KEY, JSON.stringify({
            localidade: {
                cidade,
                estado,
                cep: somenteNumeros(cep)
            },
            perfil: {
                fabricante: veiculoSelecionado?.marca,
                modelo: veiculoSelecionado?.modelo,
                anoModelo: anoModelo
                    ? Number(anoModelo)
                    : undefined,
                respostasQuestionario
            }
        }));
    }, [
        cep,
        endereco.cidade,
        endereco.estado,
        veiculoSelecionado,
        anoModelo,
        respostasQuestionario
    ]);
    const [franquias, setFranquias] = useState([]);
    const [franquiaSelecionada, setFranquiaSelecionada] = useState(formState?.franquiaSelecionada || "");
    const [coberturas, setCoberturas] = useState([]);
    const [valoresCoberturasPrincipais, setValoresCoberturasPrincipais] = useState(formState?.valoresCoberturasPrincipais || {});
    const [valoresProtecoes, setValoresProtecoes] = useState(formState?.valoresProtecoes || {});
    const [coberturasAdicionaisSelecionadas, setCoberturasAdicionaisSelecionadas] = useState(formState?.coberturasAdicionaisSelecionadas || []);
    const [acessoriosSelecionados, setAcessoriosSelecionados] = useState(formState?.acessoriosSelecionados || []);
    const [loadingDominios, setLoadingDominios] = useState(false);
    const [loadingVeiculos, setLoadingVeiculos] = useState(false);
    const [erro, setErro] = useState("");
    const buscaVeiculoId = useRef(0);
    useEffect(() => {
        carregarDominios();
    }, []);
    useEffect(() => {
        if (!formState)
            return;
        navigate(location.pathname, {
            replace: true,
            state: null
        });
    }, []);
    const coberturasPrincipais = useMemo(() => coberturas.filter(cobertura => cobertura.tipoCobertura === "coberturas_principais" ||
        cobertura.codigo === "casco"), [coberturas]);
    const coberturasAdicionais = useMemo(() => coberturas.filter(cobertura => cobertura.tipoCobertura === "coberturas_adicionais"), [coberturas]);
    const acessorios = useMemo(() => coberturas.filter(cobertura => cobertura.tipoCobertura === "acessorios"), [coberturas]);
    const protecoes = useMemo(() => coberturas.filter(cobertura => cobertura.tipoCobertura === "protecoes"), [coberturas]);
    useEffect(() => {
        const aplicarSugestoes = (event) => {
            const sugestoes = event.detail || [];
            setValoresCoberturasPrincipais(current => {
                const next = { ...current };
                sugestoes.forEach(sugestao => {
                    if (sugestao.valor != null &&
                        coberturasPrincipais.some(item => item.codigo === sugestao.codigo &&
                            item.codigo !== "casco")) {
                        next[sugestao.codigo] =
                            sugestao.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                            });
                    }
                });
                return next;
            });
            setValoresProtecoes(current => {
                const next = { ...current };
                sugestoes.forEach(sugestao => {
                    if (sugestao.valor != null &&
                        protecoes.some(item => item.codigo === sugestao.codigo)) {
                        next[sugestao.codigo] =
                            sugestao.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                            });
                    }
                });
                return next;
            });
            setCoberturasAdicionaisSelecionadas(current => {
                const codigos = new Set(current.map(item => item.codigo));
                return [
                    ...current,
                    ...coberturasAdicionais.filter(item => sugestoes.some(sugestao => sugestao.codigo === item.codigo &&
                        !codigos.has(item.codigo)))
                ];
            });
        };
        window.addEventListener("assistente:preencher-coberturas", aplicarSugestoes);
        return () => window.removeEventListener("assistente:preencher-coberturas", aplicarSugestoes);
    }, [
        coberturasPrincipais,
        coberturasAdicionais,
        protecoes
    ]);
    useEffect(() => {
        if (!assistantCoverageSuggestions?.length ||
            coberturas.length === 0) {
            return;
        }
        window.dispatchEvent(new CustomEvent("assistente:preencher-coberturas", {
            detail: assistantCoverageSuggestions
        }));
    }, [
        assistantCoverageSuggestions,
        coberturas.length
    ]);
    useEffect(() => {
        const aplicarFranquia = (event) => {
            const sugestao = event.detail;
            if (sugestao?.codigo &&
                franquias.some(franquia => franquia.codigo === sugestao.codigo)) {
                setFranquiaSelecionada(sugestao.codigo);
            }
        };
        window.addEventListener("assistente:preencher-franquia", aplicarFranquia);
        return () => window.removeEventListener("assistente:preencher-franquia", aplicarFranquia);
    }, [franquias]);
    useEffect(() => {
        if (!assistantFranchiseSuggestion?.codigo ||
            franquias.length === 0) {
            return;
        }
        window.dispatchEvent(new CustomEvent("assistente:preencher-franquia", {
            detail: assistantFranchiseSuggestion
        }));
    }, [
        assistantFranchiseSuggestion,
        franquias.length
    ]);
    const carregarDominios = async () => {
        try {
            setLoadingDominios(true);
            setErro("");
            const [perguntas, franquiasResp, coberturasResp] = await Promise.all([
                api.get("/dominios/questionario"),
                api.get("/dominios/franquias"),
                api.get("/dominios/coberturas")
            ]);
            setQuestionario(perguntas.data);
            setFranquias(franquiasResp.data);
            setCoberturas(coberturasResp.data);
        }
        catch (error) {
            setErro("Não foi possível carregar os domínios da cotação.");
        }
        finally {
            setLoadingDominios(false);
        }
    };
    const buscarCep = async (cepValue) => {
        const cepNumerico = somenteNumeros(cepValue);
        if (cepNumerico.length !== 8)
            return;
        try {
            const response = await api.get(`/enderecos/buscar/cep?cep=${cepNumerico}`);
            setEndereco(response.data);
        }
        catch (error) {
            setErro("Não foi possível buscar o endereço pelo CEP.");
        }
    };
    const buscarVeiculo = async (descricao) => {
        const buscaAtual = ++buscaVeiculoId.current;
        if (!descricao.trim()) {
            setVeiculos([]);
            setLoadingVeiculos(false);
            return;
        }
        try {
            setLoadingVeiculos(true);
            setErro("");
            const response = await api.get(`/automovel/buscar/modelo?descricao=${encodeURIComponent(descricao)}`);
            if (buscaAtual !== buscaVeiculoId.current)
                return;
            setVeiculos(response.data);
        }
        catch (error) {
            if (buscaAtual !== buscaVeiculoId.current)
                return;
            setErro("Não foi possível buscar os veículos.");
        }
        finally {
            if (buscaAtual === buscaVeiculoId.current) {
                setLoadingVeiculos(false);
            }
        }
    };
    const alterarModeloBusca = (value) => {
        setModeloBusca(value);
        setVeiculoSelecionado(undefined);
        setValoresCoberturasPrincipais(current => ({
            ...current,
            casco: ""
        }));
        setAnoFabricacao("");
        setAnoModelo("");
        setPlaca("");
        setChassi("");
        buscarVeiculo(value);
    };
    const selecionarVeiculo = (veiculo) => {
        setVeiculoSelecionado(veiculo);
        setModeloBusca(`${veiculo.marca} - ${veiculo.modelo}`);
        setValoresCoberturasPrincipais(current => ({
            ...current,
            casco: veiculo.valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            })
        }));
        setAnoFabricacao("");
        setAnoModelo("");
        setPlaca("");
        setChassi("");
    };
    const formatarMoedaInput = (value) => {
        const onlyNumbers = value.replace(/\D/g, "");
        if (!onlyNumbers)
            return "";
        return (Number(onlyNumbers) / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    };
    const moedaParaNumero = (value) => {
        const onlyNumbers = value.replace(/\D/g, "");
        if (!onlyNumbers)
            return 0;
        return Number(onlyNumbers) / 100;
    };
    const alterarValorCoberturaPrincipal = (codigo, valor) => {
        setValoresCoberturasPrincipais(current => ({
            ...current,
            [codigo]: formatarMoedaInput(valor)
        }));
    };
    const alterarValorProtecao = (codigo, valor) => {
        setValoresProtecoes(current => ({
            ...current,
            [codigo]: formatarMoedaInput(valor)
        }));
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
        const perguntasSemResposta = questionario.filter(pergunta => !respostasQuestionario[pergunta.codigo]);
        if (perguntasSemResposta.length > 0) {
            return "Responda todas as perguntas do questionário.";
        }
        if (!veiculoSelecionado) {
            return "Selecione um veículo.";
        }
        if (!anoFabricacao || !anoModelo || !placa || !chassi) {
            return "Preencha ano de fabricação, ano modelo, placa e chassi.";
        }
        const coberturaPrincipalSemValor = coberturasPrincipais.filter(cobertura => !valoresCoberturasPrincipais[cobertura.codigo]);
        if (coberturaPrincipalSemValor.length > 0) {
            return "Informe o valor de todas as coberturas principais.";
        }
        if (!franquiaSelecionada) {
            return "Selecione uma franquia.";
        }
        return "";
    };
    const realizarCotacao = () => {
        const erroValidacao = validarFormulario();
        if (erroValidacao) {
            setErro(erroValidacao);
            return;
        }
        const franquia = franquias.find(item => item.codigo === franquiaSelecionada);
        const coberturasPrincipaisPayload = coberturasPrincipais.map(cobertura => ({
            codigo: cobertura.codigo,
            descricao: cobertura.descricao,
            valor: moedaParaNumero(valoresCoberturasPrincipais[cobertura.codigo])
        }));
        const protecoesPayload = protecoes
            .filter(protecao => valoresProtecoes[protecao.codigo])
            .map(protecao => ({
            codigo: protecao.codigo,
            descricao: protecao.descricao,
            valor: moedaParaNumero(valoresProtecoes[protecao.codigo])
        }));
        const coberturasAdicionaisPayload = coberturasAdicionaisSelecionadas.map(cobertura => ({
            codigo: cobertura.codigo,
            descricao: cobertura.descricao
        }));
        const acessoriosPayload = acessoriosSelecionados.map(acessorio => ({
            codigo: acessorio.codigo,
            descricao: acessorio.descricao
        }));
        const questionarioPayload = questionario.map(pergunta => {
            const respostaCodigo = respostasQuestionario[pergunta.codigo];
            const respostaSelecionada = pergunta.respostas.find(resposta => resposta.codigo === respostaCodigo);
            return {
                codigo: pergunta.codigo,
                descricao: pergunta.descricao,
                resposta: respostaSelecionada?.codigo ||
                    respostaCodigo
            };
        });
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
                    logradouro: endereco.logradouro,
                    numero,
                    complemento,
                    bairro: endereco.bairro,
                    estado: endereco.estado,
                    cidade: endereco.cidade,
                    cep: somenteNumeros(cep)
                }
            },
            questionario: questionarioPayload,
            veiculo: {
                placa,
                chassi,
                fabricante: veiculoSelecionado?.marca,
                modelo: veiculoSelecionado?.modelo,
                anoFabricacao: Number(anoFabricacao),
                anoModelo: Number(anoModelo),
                codigoFipe: veiculoSelecionado?.codigoFipe
            },
            franquia: {
                codigo: franquia?.codigo,
                descricao: franquia?.descricao,
                resposta: franquia?.codigo
            },
            coberturas: [
                ...coberturasPrincipaisPayload,
                ...coberturasAdicionaisPayload,
                ...acessoriosPayload,
                ...protecoesPayload
            ]
        };
        navigate("/resultado", {
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
        });
    };
    return (_jsx("div", { className: styles.page, children: _jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.hero, children: [_jsxs("div", { children: [_jsx("span", { className: styles.eyebrow, children: "Seguro Auto" }), _jsx("h1", { className: styles.title, children: "Nova Cota\u00E7\u00E3o" }), _jsx("p", { className: styles.subtitle, children: "Preencha os dados abaixo para montar uma cota\u00E7\u00E3o personalizada." })] }), _jsxs("div", { className: styles.heroAside, children: [_jsxs("div", { className: styles.heroBadge, children: [_jsx("span", { className: styles.statusDot }), "Cota\u00E7\u00E3o inteligente"] }), _jsxs("div", { className: styles.heroMetric, children: [_jsx("strong", { children: "Seguro sob medida" }), _jsx("span", { children: "Uma jornada simples, segura e personalizada." })] })] })] }), erro && (_jsx("div", { className: styles.alert, children: erro })), loadingDominios && (_jsx("div", { className: styles.loading, children: "Carregando dados da cota\u00E7\u00E3o..." })), _jsxs("div", { className: styles.sections, children: [_jsx(SectionCard, { title: "Segurado", defaultOpen: true, hasPendingFields: !cpf ||
                                !nome ||
                                !email ||
                                !telefone ||
                                !dataNascimento ||
                                !estadoCivil, children: _jsxs("div", { className: styles.grid3, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { children: "CPF *" }), _jsx("input", { className: styles.input, placeholder: "000.000.000-00", value: cpf, onChange: e => setCpf(formatarCpf(e.target.value)), inputMode: "numeric", maxLength: 14 })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Nome *" }), _jsx("input", { className: styles.input, placeholder: "Nome completo", value: nome, onChange: e => setNome(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Email *" }), _jsx("input", { className: styles.input, placeholder: "email@dominio.com", value: email, onChange: e => setEmail(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Telefone *" }), _jsx("input", { className: styles.input, placeholder: "(61) 99999-8888", value: telefone, onChange: e => setTelefone(formatarTelefone(e.target.value)), inputMode: "tel", maxLength: 15 })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Data de nascimento *" }), _jsx("input", { className: styles.input, type: "date", value: dataNascimento, onChange: e => setDataNascimento(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Sexo *" }), _jsxs("select", { className: styles.select, value: sexo, onChange: e => setSexo(e.target.value), children: [_jsx("option", { value: "MASCULINO", children: "Masculino" }), _jsx("option", { value: "FEMININO", children: "Feminino" })] })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Estado civil *" }), _jsxs("select", { className: styles.select, value: estadoCivil, onChange: e => setEstadoCivil(e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), _jsx("option", { value: "SOLTEIRO", children: "Solteiro" }), _jsx("option", { value: "CASADO", children: "Casado" }), _jsx("option", { value: "DIVORCIADO", children: "Divorciado" }), _jsx("option", { value: "VIUVO", children: "Vi\u00FAvo" })] })] })] }) }), _jsx(SectionCard, { title: "Endere\u00E7o", hasPendingFields: !cep ||
                                !endereco.logradouro ||
                                !numero, children: _jsxs("div", { className: styles.grid3, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { children: "CEP *" }), _jsx("input", { className: styles.input, placeholder: "00000-000", value: cep, onChange: e => {
                                                    const value = formatarCep(e.target.value);
                                                    setCep(value);
                                                    buscarCep(value);
                                                }, inputMode: "numeric", maxLength: 9 })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Logradouro *" }), _jsx("input", { className: styles.input, value: endereco.logradouro || "", placeholder: "Logradouro", onChange: e => setEndereco({
                                                    ...endereco,
                                                    logradouro: e.target.value
                                                }) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "N\u00FAmero *" }), _jsx("input", { className: styles.input, placeholder: "N\u00FAmero", value: numero, onChange: e => setNumero(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Complemento" }), _jsx("input", { className: styles.input, placeholder: "Complemento", value: complemento, onChange: e => setComplemento(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Bairro" }), _jsx("input", { className: styles.input, value: endereco.bairro || "", placeholder: "Bairro", onChange: e => setEndereco({
                                                    ...endereco,
                                                    bairro: e.target.value
                                                }) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Cidade" }), _jsx("input", { className: styles.input, value: endereco.cidade || "", placeholder: "Cidade", onChange: e => setEndereco({
                                                    ...endereco,
                                                    cidade: e.target.value
                                                }) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Estado" }), _jsx("input", { className: styles.input, value: endereco.estado || "", placeholder: "UF", onChange: e => setEndereco({
                                                    ...endereco,
                                                    estado: e.target.value
                                                }) })] })] }) }), _jsx(SectionCard, { title: "Question\u00E1rio", hasPendingFields: questionario.length > 0 &&
                                questionario.some(pergunta => !respostasQuestionario[pergunta.codigo]), children: _jsx("div", { className: styles.grid3, children: questionario.map(pergunta => (_jsxs("div", { className: styles.field, children: [_jsxs("label", { title: pergunta.explicacao, children: [pergunta.descricao, " *"] }), _jsxs("select", { className: styles.select, value: respostasQuestionario[pergunta.codigo] || "", onChange: e => setRespostasQuestionario(current => ({
                                                ...current,
                                                [pergunta.codigo]: e.target.value
                                            })), children: [_jsx("option", { value: "", children: "Selecione" }), pergunta.respostas.map(resposta => (_jsx("option", { value: resposta.codigo, children: resposta.descricao }, resposta.codigo)))] }), pergunta.explicacao && (_jsx("small", { className: styles.hint, children: pergunta.explicacao }))] }, pergunta.codigo))) }) }), _jsxs(SectionCard, { title: "Ve\u00EDculo", allowOverflow: true, hasPendingFields: !veiculoSelecionado ||
                                !anoFabricacao ||
                                !anoModelo ||
                                !placa ||
                                !chassi, children: [_jsx("div", { className: styles.vehicleSearch, children: _jsxs("div", { className: styles.searchField, children: [_jsx("label", { children: "Modelo do ve\u00EDculo *" }), _jsx("input", { className: styles.input, placeholder: "Digite o modelo. Ex: Civic", value: modeloBusca, onChange: e => alterarModeloBusca(e.target.value) }), modeloBusca.trim() &&
                                                !veiculoSelecionado && (_jsxs("div", { className: styles.vehicleResults, children: [loadingVeiculos && (_jsx("div", { className: styles.vehicleResultMessage, children: "Buscando ve\u00EDculos..." })), !loadingVeiculos &&
                                                        veiculos.length === 0 && (_jsx("div", { className: styles.vehicleResultMessage, children: "Nenhum ve\u00EDculo encontrado" })), !loadingVeiculos &&
                                                        veiculos.map(veiculo => (_jsxs("button", { type: "button", className: styles.vehicleResult, onClick: () => selecionarVeiculo(veiculo), children: [veiculo.marca, " - ", veiculo.modelo] }, veiculo.codigoFipe)))] }))] }) }), veiculoSelecionado && (_jsxs("div", { className: styles.vehicleDetails, children: [_jsxs("div", { className: styles.selectedVehicle, children: [_jsx("span", { children: "Ve\u00EDculo selecionado" }), _jsx("strong", { children: veiculoSelecionado.modelo })] }), _jsxs("div", { className: styles.grid4, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Ano fabrica\u00E7\u00E3o *" }), _jsxs("select", { className: styles.select, value: anoFabricacao, onChange: e => alterarAnoFabricacao(e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), anosFabricacaoDisponiveis.map(ano => (_jsx("option", { value: ano, children: ano }, ano)))] })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Ano modelo *" }), _jsxs("select", { className: styles.select, value: anoModelo, onChange: e => alterarAnoModelo(e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), anosModeloDisponiveis.map(ano => (_jsx("option", { value: ano, children: ano }, ano)))] })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Placa *" }), _jsx("input", { className: styles.input, placeholder: "ABC1D23", value: placa, onChange: e => setPlaca(e.target.value.toUpperCase()) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Chassi *" }), _jsx("input", { className: styles.input, placeholder: "9BWZZZ377VT004251", value: chassi, onChange: e => setChassi(e.target.value.toUpperCase()) })] })] })] }))] }), _jsx(SectionCard, { title: "Coberturas Principais", hasPendingFields: coberturasPrincipais.length > 0 &&
                                coberturasPrincipais.some(cobertura => !valoresCoberturasPrincipais[cobertura.codigo]), children: _jsx("div", { className: styles.coverageGrid, children: coberturasPrincipais.map(cobertura => (_jsxs("div", { className: styles.coverageCard, children: [_jsxs("div", { children: [_jsx("strong", { children: cobertura.descricao }), cobertura.explicacao && (_jsx("p", { children: cobertura.explicacao }))] }), _jsx("input", { className: `${styles.moneyInput} ${cobertura.codigo === "casco"
                                                ? styles.moneyInputLocked
                                                : ""}`, placeholder: "R$ 0,00", value: valoresCoberturasPrincipais[cobertura.codigo] || "", readOnly: cobertura.codigo === "casco", onChange: e => cobertura.codigo !== "casco" &&
                                                alterarValorCoberturaPrincipal(cobertura.codigo, e.target.value) })] }, cobertura.codigo))) }) }), _jsxs(SectionCard, { title: "Franquia", hasPendingFields: !franquiaSelecionada, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Selecione a franquia *" }), _jsxs("select", { className: styles.select, value: franquiaSelecionada, onChange: e => setFranquiaSelecionada(e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), franquias.map(franquia => (_jsx("option", { value: franquia.codigo, children: franquia.descricao }, franquia.codigo)))] })] }), franquiaSelecionada && (_jsx("div", { className: styles.infoBox, children: franquias.find(item => item.codigo ===
                                        franquiaSelecionada)?.explicacao }))] }), _jsx(SectionCard, { title: "Coberturas Adicionais", children: _jsx(MultiSelectChips, { options: coberturasAdicionais, selected: coberturasAdicionaisSelecionadas, onChange: setCoberturasAdicionaisSelecionadas, placeholder: "Adicionar cobertura", emptyText: "Nenhuma cobertura adicional selecionada" }) }), _jsx(SectionCard, { title: "Acess\u00F3rios", children: _jsx(MultiSelectChips, { options: acessorios, selected: acessoriosSelecionados, onChange: setAcessoriosSelecionados, placeholder: "Adicionar acess\u00F3rio", emptyText: "Nenhum acess\u00F3rio selecionado" }) }), _jsx(SectionCard, { title: "Prote\u00E7\u00F5es", children: _jsx("div", { className: styles.coverageGrid, children: protecoes.map(protecao => (_jsxs("div", { className: styles.coverageCard, children: [_jsxs("div", { children: [_jsx("strong", { children: protecao.descricao }), protecao.explicacao && (_jsx("p", { children: protecao.explicacao }))] }), _jsx("input", { className: styles.moneyInput, placeholder: "R$ 0,00 opcional", value: valoresProtecoes[protecao.codigo] || "", onChange: e => alterarValorProtecao(protecao.codigo, e.target.value) })] }, protecao.codigo))) }) })] }), _jsxs("div", { className: styles.footer, children: [_jsxs("div", { className: styles.footerMessage, children: [_jsx("span", { children: "Pronto para comparar?" }), _jsx("strong", { children: "Solicite agora as melhores ofertas para o seu ve\u00EDculo" })] }), _jsxs("button", { type: "button", className: styles.submitButton, onClick: realizarCotacao, children: [_jsx("span", { children: "Solicitar cota\u00E7\u00E3o" }), _jsx("span", { className: styles.submitArrow, children: "\u2192" })] })] })] }) }));
}
