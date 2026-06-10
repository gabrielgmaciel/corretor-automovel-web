import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCotacaoSSE } from "../../hooks/useCotacaoSSE";
import CotacaoCard from "../../components/CotacaoCard/CotacaoCard";
import styles from "./StepResultado.module.css";
export default function StepResultado({ payload }) {
    const { cotacoes, finished, loading } = useCotacaoSSE(payload);
    return (_jsxs("div", { className: styles.container, children: [_jsx("h2", { children: "Resultado das Cota\u00E7\u00F5es" }), loading && (_jsx("div", { className: styles.loading, children: "Consultando seguradoras..." })), _jsx("div", { className: styles.grid, children: cotacoes.map((cotacao) => (_jsx(CotacaoCard, { cotacao: cotacao }, cotacao.id))) }), finished && (_jsx("div", { className: styles.finished, children: "Todas as seguradoras responderam." }))] }));
}
