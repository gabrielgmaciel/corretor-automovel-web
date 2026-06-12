import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import styles from "./InsuranceAssistant.module.css";
const STORAGE_KEY = "corretor-auto-assistant-messages";
const OPEN_STORAGE_KEY = "corretor-auto-assistant-open";
const CONTEXT_STORAGE_KEY = "corretor-auto-assistant-context";
const INITIAL_MESSAGE = {
    id: "welcome",
    role: "assistant",
    content: "Olá! Sou seu assistente de seguro auto. Posso ajudar com coberturas, franquia, questionário e comparação das ofertas.",
    createdAt: new Date().toISOString()
};
const criarId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const carregarMensagens = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored)
            return [INITIAL_MESSAGE];
        const messages = JSON.parse(stored);
        return Array.isArray(messages) && messages.length
            ? messages
            : [INITIAL_MESSAGE];
    }
    catch {
        return [INITIAL_MESSAGE];
    }
};
const extrairResposta = (data) => {
    if (typeof data === "string")
        return data;
    if (!data || typeof data !== "object")
        return "";
    const response = data;
    const candidates = [
        response.mensagem,
        response.resposta,
        response.message,
        response.content
    ];
    return candidates.find(candidate => typeof candidate === "string");
};
const extrairAcao = (data) => {
    if (!data || typeof data !== "object")
        return undefined;
    const action = data.acaoPreenchimento;
    if (!action || typeof action !== "object")
        return undefined;
    const typed = action;
    if (typed.tipo === "PREENCHER_COBERTURAS" &&
        Array.isArray(typed.coberturas)) {
        return typed;
    }
    if (typed.tipo === "PREENCHER_FRANQUIA" &&
        typed.franquia &&
        typeof typed.franquia.codigo === "string") {
        return typed;
    }
    return undefined;
};
const extrairErro = (error) => {
    if (!error || typeof error !== "object") {
        return null;
    }
    const response = error.response;
    if (!response?.data || typeof response.data !== "object") {
        return null;
    }
    const data = response.data;
    return typeof data.erro === "string"
        ? data.erro
        : typeof data.message === "string"
            ? data.message
            : null;
};
const carregarContexto = () => {
    try {
        const stored = localStorage.getItem(CONTEXT_STORAGE_KEY);
        return stored
            ? JSON.parse(stored)
            : {};
    }
    catch {
        return {};
    }
};
export default function InsuranceAssistant() {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(() => localStorage.getItem(OPEN_STORAGE_KEY) === "true");
    const [messages, setMessages] = useState(carregarMensagens);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);
    useEffect(() => {
        localStorage.setItem(OPEN_STORAGE_KEY, String(open));
        if (open) {
            window.setTimeout(() => inputRef.current?.focus(), 180);
        }
    }, [open]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, sending, open]);
    const enviarMensagem = async (event) => {
        event?.preventDefault();
        const content = input.trim();
        if (!content || sending)
            return;
        const userMessage = {
            id: criarId(),
            role: "user",
            content,
            createdAt: new Date().toISOString()
        };
        const conversation = [
            ...messages,
            userMessage
        ];
        setMessages(conversation);
        setInput("");
        setSending(true);
        try {
            const routeState = location.state;
            const storedContext = carregarContexto();
            const localidade = routeState?.formState?.endereco
                ? {
                    cidade: routeState.formState.endereco.cidade,
                    estado: routeState.formState.endereco.estado,
                    cep: routeState.formState.cep
                }
                : storedContext.localidade;
            const perfil = routeState?.formState
                ? {
                    fabricante: routeState.formState.veiculoSelecionado?.marca,
                    modelo: routeState.formState.veiculoSelecionado?.modelo,
                    anoModelo: routeState.formState.anoModelo
                        ? Number(routeState.formState.anoModelo)
                        : undefined,
                    respostasQuestionario: routeState.formState.respostasQuestionario
                }
                : storedContext.perfil;
            const response = await api.post("/assistente", {
                mensagem: content,
                localidade,
                perfil,
                pagina: location.pathname,
                historico: conversation.map(message => ({
                    papel: message.role,
                    conteudo: message.content
                }))
            });
            const answer = extrairResposta(response.data);
            const action = extrairAcao(response.data);
            if (!answer) {
                throw new Error("Resposta do assistente vazia.");
            }
            setMessages(current => [
                ...current,
                {
                    id: criarId(),
                    role: "assistant",
                    content: answer,
                    action,
                    createdAt: new Date().toISOString()
                }
            ]);
        }
        catch (error) {
            const errorMessage = extrairErro(error);
            setMessages(current => [
                ...current,
                {
                    id: criarId(),
                    role: "assistant",
                    content: errorMessage ||
                        "Não consegui acessar o assistente agora. Verifique se o endpoint de IA está disponível e tente novamente.",
                    createdAt: new Date().toISOString()
                }
            ]);
        }
        finally {
            setSending(false);
        }
    };
    const handleKeyDown = (event) => {
        if (event.key === "Enter" &&
            !event.shiftKey) {
            event.preventDefault();
            enviarMensagem();
        }
    };
    const limparConversa = () => {
        setMessages([INITIAL_MESSAGE]);
    };
    const aplicarSugestoes = (message) => {
        if (!message.action)
            return;
        if (location.pathname === "/") {
            if (message.action.tipo === "PREENCHER_FRANQUIA") {
                window.dispatchEvent(new CustomEvent("assistente:preencher-franquia", {
                    detail: message.action.franquia
                }));
            }
            else {
                window.dispatchEvent(new CustomEvent("assistente:preencher-coberturas", {
                    detail: message.action.coberturas || []
                }));
            }
        }
        else {
            const routeState = location.state;
            navigate("/", {
                state: {
                    formState: routeState?.formState,
                    assistantCoverageSuggestions: message.action.tipo === "PREENCHER_COBERTURAS"
                        ? message.action.coberturas
                        : undefined,
                    assistantFranchiseSuggestion: message.action.tipo === "PREENCHER_FRANQUIA"
                        ? message.action.franquia
                        : undefined
                }
            });
        }
        setMessages(current => current.map(item => item.id === message.id
            ? {
                ...item,
                action: undefined,
                content: `${item.content}\n\nSugestão aplicada ao formulário. Revise a seleção antes de continuar.`
            }
            : item));
    };
    const recusarPreenchimento = (messageId) => {
        setMessages(current => current.map(item => item.id === messageId
            ? {
                ...item,
                action: undefined
            }
            : item));
    };
    return (_jsxs("aside", { className: styles.assistant, children: [_jsxs("section", { className: `${styles.panel} ${open
                    ? styles.panelOpen
                    : ""}`, "aria-hidden": !open, "aria-label": "Assistente de seguro auto", children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.identity, children: [_jsx("span", { className: styles.avatar, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" }), _jsx("path", { d: "m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" })] }) }), _jsxs("div", { children: [_jsx("strong", { children: "Assistente Auto" }), _jsxs("span", { children: [_jsx("i", {}), "Online para ajudar"] })] })] }), _jsxs("div", { className: styles.headerActions, children: [_jsx("button", { type: "button", className: styles.clearButton, onClick: limparConversa, title: "Limpar conversa", "aria-label": "Limpar conversa", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" }) }) }), _jsx("button", { type: "button", className: styles.closeButton, onClick: () => setOpen(false), "aria-label": "Fechar assistente", children: _jsx("span", {}) })] })] }), _jsxs("div", { className: styles.messages, "aria-live": "polite", children: [messages.map(message => (_jsx("div", { className: `${styles.messageRow} ${message.role === "user"
                                    ? styles.messageRowUser
                                    : ""}`, children: _jsxs("div", { className: `${styles.message} ${message.role === "user"
                                        ? styles.userMessage
                                        : styles.assistantMessage}`, children: [message.content, message.action && (_jsxs("div", { className: styles.actionCard, children: [_jsx("strong", { children: message.action.mensagem }), _jsxs("div", { className: styles.actionButtons, children: [_jsx("button", { type: "button", onClick: () => aplicarSugestoes(message), children: "Aplicar" }), _jsx("button", { type: "button", onClick: () => recusarPreenchimento(message.id), children: "Agora n\u00E3o" })] })] }))] }) }, message.id))), sending && (_jsx("div", { className: styles.messageRow, children: _jsxs("div", { className: styles.typing, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { className: styles.composer, onSubmit: enviarMensagem, children: [_jsx("textarea", { ref: inputRef, rows: 1, value: input, placeholder: "Digite sua d\u00FAvida...", onChange: event => setInput(event.target.value), onKeyDown: handleKeyDown, disabled: sending }), _jsx("button", { type: "submit", disabled: !input.trim() ||
                                    sending, "aria-label": "Enviar mensagem", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m4 4 17 8-17 8 3-8-3-8Zm3 8h14" }) }) })] }), _jsx("footer", { className: styles.disclaimer, children: "Confirme condi\u00E7\u00F5es e valores antes da contrata\u00E7\u00E3o." })] }), _jsxs("button", { type: "button", className: `${styles.launcher} ${open
                    ? styles.launcherOpen
                    : ""}`, onClick: () => setOpen(current => !current), "aria-label": open
                    ? "Fechar assistente"
                    : "Abrir assistente", "aria-expanded": open, children: [_jsx("span", { className: styles.launcherPulse }), _jsxs("svg", { className: styles.launcherIcon, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" }), _jsx("path", { d: "m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" })] }), _jsx("span", { className: styles.closeIcon })] })] }));
}
