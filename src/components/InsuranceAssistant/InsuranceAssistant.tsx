import {
    FormEvent,
    KeyboardEvent,
    useEffect,
    useRef,
    useState
} from "react";
import { useLocation } from "react-router-dom";

import { api } from "../../services/api";

import styles from "./InsuranceAssistant.module.css";

type MessageRole =
    | "assistant"
    | "user";

type Message = {
    id: string;
    role: MessageRole;
    content: string;
    createdAt: string;
};

const STORAGE_KEY =
    "corretor-auto-assistant-messages";

const OPEN_STORAGE_KEY =
    "corretor-auto-assistant-open";

const INITIAL_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content:
        "Olá! Sou seu assistente de seguro auto. Posso ajudar com coberturas, franquia, questionário e comparação das ofertas.",
    createdAt: new Date().toISOString()
};

const criarId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const carregarMensagens = (): Message[] => {

    try {
        const stored =
            localStorage.getItem(STORAGE_KEY);

        if (!stored) return [INITIAL_MESSAGE];

        const messages =
            JSON.parse(stored);

        return Array.isArray(messages) && messages.length
            ? messages
            : [INITIAL_MESSAGE];
    } catch {
        return [INITIAL_MESSAGE];
    }
};

const extrairResposta = (data: unknown) => {

    if (typeof data === "string") return data;

    if (!data || typeof data !== "object") return "";

    const response =
        data as Record<string, unknown>;

    const candidates = [
        response.mensagem,
        response.resposta,
        response.message,
        response.content
    ];

    return candidates.find(
        candidate =>
            typeof candidate === "string"
    ) as string | undefined;
};

export default function InsuranceAssistant() {

    const location =
        useLocation();

    const [open, setOpen] =
        useState(
            () =>
                localStorage.getItem(
                    OPEN_STORAGE_KEY
                ) === "true"
        );

    const [messages, setMessages] =
        useState<Message[]>(carregarMensagens);

    const [input, setInput] =
        useState("");

    const [sending, setSending] =
        useState(false);

    const messagesEndRef =
        useRef<HTMLDivElement>(null);

    const inputRef =
        useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(messages)
        );
    }, [messages]);

    useEffect(() => {
        localStorage.setItem(
            OPEN_STORAGE_KEY,
            String(open)
        );

        if (open) {
            window.setTimeout(
                () => inputRef.current?.focus(),
                180
            );
        }
    }, [open]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, sending, open]);

    const enviarMensagem = async (
        event?: FormEvent
    ) => {

        event?.preventDefault();

        const content =
            input.trim();

        if (!content || sending) return;

        const userMessage: Message = {
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
            const response =
                await api.post(
                    "/assistente/chat",
                    {
                        mensagem: content,
                        pagina: location.pathname,
                        historico: conversation.map(
                            message => ({
                                papel: message.role,
                                conteudo: message.content
                            })
                        )
                    }
                );

            const answer =
                extrairResposta(response.data);

            if (!answer) {
                throw new Error(
                    "Resposta do assistente vazia."
                );
            }

            setMessages(
                current => [
                    ...current,
                    {
                        id: criarId(),
                        role: "assistant",
                        content: answer,
                        createdAt:
                            new Date().toISOString()
                    }
                ]
            );
        } catch {
            setMessages(
                current => [
                    ...current,
                    {
                        id: criarId(),
                        role: "assistant",
                        content:
                            "Não consegui acessar o assistente agora. Verifique se o endpoint de IA está disponível e tente novamente.",
                        createdAt:
                            new Date().toISOString()
                    }
                ]
            );
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            enviarMensagem();
        }
    };

    const limparConversa = () => {
        setMessages([INITIAL_MESSAGE]);
    };

    return (
        <aside className={styles.assistant}>
            <section
                className={`${styles.panel} ${
                    open
                        ? styles.panelOpen
                        : ""
                }`}
                aria-hidden={!open}
                aria-label="Assistente de seguro auto"
            >
                <header className={styles.header}>
                    <div className={styles.identity}>
                        <span className={styles.avatar}>
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" />
                                <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
                            </svg>
                        </span>

                        <div>
                            <strong>Assistente Auto</strong>
                            <span>
                                <i />
                                Online para ajudar
                            </span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.clearButton}
                            onClick={limparConversa}
                            title="Limpar conversa"
                            aria-label="Limpar conversa"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={() => setOpen(false)}
                            aria-label="Fechar assistente"
                        >
                            <span />
                        </button>
                    </div>
                </header>

                <div
                    className={styles.messages}
                    aria-live="polite"
                >
                    {messages.map(message => (
                        <div
                            key={message.id}
                            className={`${styles.messageRow} ${
                                message.role === "user"
                                    ? styles.messageRowUser
                                    : ""
                            }`}
                        >
                            <div
                                className={`${styles.message} ${
                                    message.role === "user"
                                        ? styles.userMessage
                                        : styles.assistantMessage
                                }`}
                            >
                                {message.content}
                            </div>
                        </div>
                    ))}

                    {sending && (
                        <div className={styles.messageRow}>
                            <div className={styles.typing}>
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <form
                    className={styles.composer}
                    onSubmit={enviarMensagem}
                >
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        placeholder="Digite sua dúvida..."
                        onChange={
                            event =>
                                setInput(
                                    event.target.value
                                )
                        }
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                    />

                    <button
                        type="submit"
                        disabled={
                            !input.trim() ||
                            sending
                        }
                        aria-label="Enviar mensagem"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14" />
                        </svg>
                    </button>
                </form>

                <footer className={styles.disclaimer}>
                    Confirme condições e valores antes da contratação.
                </footer>
            </section>

            <button
                type="button"
                className={`${styles.launcher} ${
                    open
                        ? styles.launcherOpen
                        : ""
                }`}
                onClick={() => setOpen(current => !current)}
                aria-label={
                    open
                        ? "Fechar assistente"
                        : "Abrir assistente"
                }
                aria-expanded={open}
            >
                <span className={styles.launcherPulse} />

                <svg
                    className={styles.launcherIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" />
                    <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
                </svg>

                <span className={styles.closeIcon} />
            </button>
        </aside>
    );
}
