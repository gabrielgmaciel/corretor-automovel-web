import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from "./ResultadoCotacao.module.css";
export default function ResultadoCotacao() {
    const location = useLocation();
    const payload = location.state;
    const [cotacoes, setCotacoes] = useState([]);
    const [finished, setFinished] = useState(false);
    const started = useRef(false);
    useEffect(() => {
        if (!payload)
            return;
        if (started.current)
            return;
        started.current = true;
        const connect = async () => {
            const response = await fetch("http://localhost:8080/api/cotacao/simular", {
                method: "POST",
                headers: {
                    Accept: "text/event-stream",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.body)
                return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer +=
                    decoder.decode(value, {
                        stream: true
                    });
                const events = buffer.split("\n\n");
                buffer =
                    events.pop() ||
                        "";
                for (const event of events) {
                    let eventName = "";
                    let data = "";
                    const lines = event.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("event:")) {
                            eventName =
                                line
                                    .replace("event:", "")
                                    .trim();
                        }
                        if (line.startsWith("data:")) {
                            data =
                                line
                                    .replace("data:", "")
                                    .trim();
                        }
                    }
                    if (eventName ===
                        "cotacao") {
                        const cotacao = JSON.parse(data);
                        setCotacoes(prev => {
                            const exists = prev.some(c => c.id ===
                                cotacao.id);
                            if (exists)
                                return prev;
                            return [
                                ...prev,
                                cotacao
                            ];
                        });
                    }
                    if (eventName ===
                        "finalizado") {
                        setFinished(true);
                    }
                }
            }
        };
        connect();
    }, [payload]);
    const ordenadas = [...cotacoes].sort((a, b) => a.resumoFinanceiro
        .premioTotal -
        b.resumoFinanceiro
            .premioTotal);
    return (_jsxs("div", { className: styles.page, children: [_jsxs("div", { className: styles.header, children: [_jsx("h1", { children: "Cota\u00E7\u00F5es" }), _jsx("span", { children: finished
                            ? "Finalizado"
                            : "Processando..." })] }), _jsx("div", { className: styles.grid, children: ordenadas.map(cotacao => (_jsxs("div", { className: styles.card, children: [_jsx("h2", { children: cotacao
                                .grupoCotacao
                                ?.parceiro
                                ?.seguradora }), _jsx("h4", { children: cotacao
                                .grupoCotacao
                                ?.parceiro
                                ?.produto }), _jsxs("div", { children: ["Valor:", _jsxs("strong", { children: [" ", "R$", " ", cotacao
                                            .resumoFinanceiro
                                            ?.premioTotal
                                            ?.toLocaleString("pt-BR")] })] }), _jsxs("div", { children: ["Score:", " ", cotacao
                                    .scoreRisco
                                    ?.nivel] })] }, cotacao.id))) })] }));
}
