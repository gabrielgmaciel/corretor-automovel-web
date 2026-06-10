import { useEffect, useRef, useState } from "react";
export function useCotacaoSSE(payload) {
    const [cotacoes, setCotacoes] = useState([]);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const started = useRef(false);
    useEffect(() => {
        if (!payload)
            return;
        if (started.current)
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
                if (!response.body)
                    return;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                while (true) {
                    const { value, done } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, {
                        stream: true
                    });
                    const events = buffer.split("\n\n");
                    buffer = events.pop() || "";
                    for (const event of events) {
                        const lines = event.split("\n");
                        let eventName = "";
                        let data = "";
                        for (const line of lines) {
                            if (line.startsWith("event:")) {
                                eventName = line.replace("event:", "").trim();
                            }
                            if (line.startsWith("data:")) {
                                data = line.replace("data:", "").trim();
                            }
                        }
                        if (eventName === "cotacao") {
                            const cotacao = JSON.parse(data);
                            setLoading(false);
                            setCotacoes((prev) => {
                                const exists = prev.some((c) => c.id === cotacao.id);
                                if (exists)
                                    return prev;
                                return [...prev, cotacao];
                            });
                        }
                        if (eventName === "finalizado") {
                            setFinished(true);
                        }
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        };
        connect();
    }, [payload]);
    return {
        cotacoes,
        finished,
        loading
    };
}
