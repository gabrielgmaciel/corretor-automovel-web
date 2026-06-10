import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import NovaCotacao from "./pages/NovaCotacao/NovaCotacao";
import ResultadoCotacao from "./pages/ResultadoCotacao/ResultadoCotacao";
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(NovaCotacao, {}) }), _jsx(Route, { path: "/resultado", element: _jsx(ResultadoCotacao, {}) })] }));
}
