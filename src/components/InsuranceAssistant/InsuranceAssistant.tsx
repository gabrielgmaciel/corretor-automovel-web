import {
    FormEvent,
    KeyboardEvent,
    useEffect,
    useRef,
    useState
} from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";

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
    action?: FillSuggestionAction;
};

type SuggestedCoverage = {
    codigo: string;
    descricao: string;
    valor?: number | null;
    frequencia: number;
};

type SuggestedFranchise = {
    codigo: string;
    descricao: string;
    frequencia: number;
};

type FillSuggestionAction = {
    tipo:
        | "PREENCHER_COBERTURAS"
        | "PREENCHER_FRANQUIA";
    mensagem: string;
    coberturas?: SuggestedCoverage[];
    franquia?: SuggestedFranchise | null;
};

const STORAGE_KEY =
    "corretor-auto-assistant-messages";

const OPEN_STORAGE_KEY =
    "corretor-auto-assistant-open";

const CONTEXT_STORAGE_KEY =
    "corretor-auto-assistant-context";

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

const extrairAcao = (data: unknown): FillSuggestionAction | undefined => {
    if (!data || typeof data !== "object") return undefined;

    const action =
        (data as Record<string, unknown>).acaoPreenchimento;

    if (!action || typeof action !== "object") return undefined;

    const typed =
        action as Partial<FillSuggestionAction>;

    if (
        typed.tipo === "PREENCHER_COBERTURAS" &&
        Array.isArray(typed.coberturas)
    ) {
        return typed as FillSuggestionAction;
    }

    if (
        typed.tipo === "PREENCHER_FRANQUIA" &&
        typed.franquia &&
        typeof typed.franquia.codigo === "string"
    ) {
        return typed as FillSuggestionAction;
    }

    return undefined;
};

const extrairErro = (error: unknown) => {
    if (!error || typeof error !== "object") {
        return null;
    }

    const response =
        (error as {
            response?: {
                data?: unknown;
            };
        }).response;

    if (!response?.data || typeof response.data !== "object") {
        return null;
    }

    const data =
        response.data as Record<string, unknown>;

    return typeof data.erro === "string"
        ? data.erro
        : typeof data.message === "string"
            ? data.message
            : null;
};

type AssistantContext = {
    localidade?: {
        cidade?: string;
        estado?: string;
        cep?: string;
    };
    perfil?: {
        fabricante?: string;
        modelo?: string;
        anoModelo?: number;
        respostasQuestionario?: Record<string, string>;
    };
};

const carregarContexto = (): AssistantContext => {
    try {
        const stored =
            localStorage.getItem(CONTEXT_STORAGE_KEY);

        return stored
            ? JSON.parse(stored)
            : {};
    } catch {
        return {};
    }
};

export default function InsuranceAssistant() {

    const location =
        useLocation();
    const navigate =
        useNavigate();

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
            const routeState =
                location.state as {
                    formState?: {
                        cep?: string;
                        endereco?: {
                            cidade?: string;
                            estado?: string;
                        };
                        veiculoSelecionado?: {
                            marca?: string;
                            modelo?: string;
                        };
                        anoModelo?: string;
                        respostasQuestionario?: Record<string, string>;
                    };
                } | null;
            const storedContext =
                carregarContexto();
            const localidade =
                routeState?.formState?.endereco
                    ? {
                        cidade:
                            routeState.formState.endereco.cidade,
                        estado:
                            routeState.formState.endereco.estado,
                        cep:
                            routeState.formState.cep
                    }
                    : storedContext.localidade;
            const perfil =
                routeState?.formState
                    ? {
                        fabricante:
                            routeState.formState.veiculoSelecionado?.marca,
                        modelo:
                            routeState.formState.veiculoSelecionado?.modelo,
                        anoModelo:
                            routeState.formState.anoModelo
                                ? Number(routeState.formState.anoModelo)
                                : undefined,
                        respostasQuestionario:
                            routeState.formState.respostasQuestionario
                    }
                    : storedContext.perfil;

            const response =
                await api.post(
                    "/assistente",
                    {
                        mensagem: content,
                        localidade,
                        perfil,
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
            const action =
                extrairAcao(response.data);

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
                        action,
                        createdAt:
                            new Date().toISOString()
                    }
                ]
            );
        } catch (error) {
            const errorMessage =
                extrairErro(error);

            setMessages(
                current => [
                    ...current,
                    {
                        id: criarId(),
                        role: "assistant",
                        content:
                            errorMessage ||
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

    const aplicarSugestoes = (message: Message) => {
        if (!message.action) return;

        if (location.pathname === "/") {
            if (message.action.tipo === "PREENCHER_FRANQUIA") {
                window.dispatchEvent(
                    new CustomEvent(
                        "assistente:preencher-franquia",
                        {
                            detail: message.action.franquia
                        }
                    )
                );
            } else {
                window.dispatchEvent(
                    new CustomEvent(
                        "assistente:preencher-coberturas",
                        {
                            detail: message.action.coberturas || []
                        }
                    )
                );
            }
        } else {
            const routeState =
                location.state as {
                    formState?: unknown;
                } | null;

            navigate("/", {
                state: {
                    formState:
                        routeState?.formState,
                    assistantCoverageSuggestions:
                        message.action.tipo === "PREENCHER_COBERTURAS"
                            ? message.action.coberturas
                            : undefined,
                    assistantFranchiseSuggestion:
                        message.action.tipo === "PREENCHER_FRANQUIA"
                            ? message.action.franquia
                            : undefined
                }
            });
        }

        setMessages(current =>
            current.map(item =>
                item.id === message.id
                    ? {
                        ...item,
                        action: undefined,
                        content:
                            `${item.content}\n\nSugestão aplicada ao formulário. Revise a seleção antes de continuar.`
                    }
                    : item
            )
        );
    };

    const recusarPreenchimento = (messageId: string) => {
        setMessages(current =>
            current.map(item =>
                item.id === messageId
                    ? {
                        ...item,
                        action: undefined
                    }
                    : item
            )
        );
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

                                {message.action && (
                                    <div className={styles.actionCard}>
                                        <strong>
                                            {message.action.mensagem}
                                        </strong>

                                        <div className={styles.actionButtons}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    aplicarSugestoes(message)
                                                }
                                            >
                                                Aplicar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    recusarPreenchimento(message.id)
                                                }
                                            >
                                                Agora não
                                            </button>
                                        </div>
                                    </div>
                                )}
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
