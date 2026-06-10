import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../services/api";
import styles from "./InsuranceAssistant.module.css";
const STORAGE_KEY = "corretor-auto-assistant-messages";
const OPEN_STORAGE_KEY = "corretor-auto-assistant-open";
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
export default function InsuranceAssistant() {
    const location = useLocation();
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
            const response = await api.post("/assistente/chat", {
                mensagem: content,
                pagina: location.pathname,
                historico: conversation.map(message => ({
                    papel: message.role,
                    conteudo: message.content
                }))
            });
            const answer = extrairResposta(response.data);
            if (!answer) {
                throw new Error("Resposta do assistente vazia.");
            }
            setMessages(current => [
                ...current,
                {
                    id: criarId(),
                    role: "assistant",
                    content: answer,
                    createdAt: new Date().toISOString()
                }
            ]);
        }
        catch {
            setMessages(current => [
                ...current,
                {
                    id: criarId(),
                    role: "assistant",
                    content: "Não consegui acessar o assistente agora. Verifique se o endpoint de IA está disponível e tente novamente.",
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
    return (_jsxs("aside", { className: styles.assistant, children: [_jsxs("section", { className: `${styles.panel} ${open
                    ? styles.panelOpen
                    : ""}`, "aria-hidden": !open, "aria-label": "Assistente de seguro auto", children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.identity, children: [_jsx("span", { className: styles.avatar, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" }), _jsx("path", { d: "m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" })] }) }), _jsxs("div", { children: [_jsx("strong", { children: "Assistente Auto" }), _jsxs("span", { children: [_jsx("i", {}), "Online para ajudar"] })] })] }), _jsxs("div", { className: styles.headerActions, children: [_jsx("button", { type: "button", className: styles.clearButton, onClick: limparConversa, title: "Limpar conversa", "aria-label": "Limpar conversa", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" }) }) }), _jsx("button", { type: "button", className: styles.closeButton, onClick: () => setOpen(false), "aria-label": "Fechar assistente", children: _jsx("span", {}) })] })] }), _jsxs("div", { className: styles.messages, "aria-live": "polite", children: [messages.map(message => (_jsx("div", { className: `${styles.messageRow} ${message.role === "user"
                                    ? styles.messageRowUser
                                    : ""}`, children: _jsx("div", { className: `${styles.message} ${message.role === "user"
                                        ? styles.userMessage
                                        : styles.assistantMessage}`, children: message.content }) }, message.id))), sending && (_jsx("div", { className: styles.messageRow, children: _jsxs("div", { className: styles.typing, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { className: styles.composer, onSubmit: enviarMensagem, children: [_jsx("textarea", { ref: inputRef, rows: 1, value: input, placeholder: "Digite sua d\u00FAvida...", onChange: event => setInput(event.target.value), onKeyDown: handleKeyDown, disabled: sending }), _jsx("button", { type: "submit", disabled: !input.trim() ||
                                    sending, "aria-label": "Enviar mensagem", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m4 4 17 8-17 8 3-8-3-8Zm3 8h14" }) }) })] }), _jsx("footer", { className: styles.disclaimer, children: "Confirme condi\u00E7\u00F5es e valores antes da contrata\u00E7\u00E3o." })] }), _jsxs("button", { type: "button", className: `${styles.launcher} ${open
                    ? styles.launcherOpen
                    : ""}`, onClick: () => setOpen(current => !current), "aria-label": open
                    ? "Fechar assistente"
                    : "Abrir assistente", "aria-expanded": open, children: [_jsx("span", { className: styles.launcherPulse }), _jsxs("svg", { className: styles.launcherIcon, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" }), _jsx("path", { d: "m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" })] }), _jsx("span", { className: styles.closeIcon })] })] }));
}
