import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "./CotacaoCard.module.css";
export default function CotacaoCard({ cotacao }) {
    return (_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.header, children: cotacao.grupoCotacao.parceiro.seguradora }), _jsxs("div", { className: styles.content, children: [_jsxs("div", { children: [_jsx("span", { children: "Produto" }), _jsx("strong", { children: cotacao.grupoCotacao.parceiro.produto })] }), _jsxs("div", { children: [_jsx("span", { children: "Pr\u00EAmio" }), _jsxs("strong", { children: ["R$ ", cotacao.resumoFinanceiro.premioTotal] })] }), _jsxs("div", { children: [_jsx("span", { children: "Comiss\u00E3o" }), _jsxs("strong", { children: ["R$ ", cotacao.resumoFinanceiro.comissao] })] }), _jsxs("div", { children: [_jsx("span", { children: "Risco" }), _jsx("strong", { children: cotacao.scoreRisco?.nivel })] })] })] }));
}
