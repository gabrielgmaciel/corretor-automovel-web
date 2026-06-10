import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import styles from "./MultiSelectChips.module.css";
export default function MultiSelectChips({ options, selected, onChange, placeholder = "Selecione uma opção", emptyText = "Nenhum item selecionado" }) {
    const availableOptions = useMemo(() => options.filter(option => !selected.some(selectedItem => selectedItem.codigo === option.codigo)), [options, selected]);
    const addItem = (codigo) => {
        const item = options.find(option => option.codigo === codigo);
        if (!item)
            return;
        onChange([
            ...selected,
            item
        ]);
    };
    const removeItem = (codigo) => {
        onChange(selected.filter(item => item.codigo !== codigo));
    };
    return (_jsxs("div", { className: styles.container, children: [_jsxs("select", { className: styles.select, defaultValue: "", onChange: e => {
                    if (!e.target.value)
                        return;
                    addItem(e.target.value);
                    e.target.value = "";
                }, children: [_jsx("option", { value: "", children: placeholder }), availableOptions.map(option => (_jsx("option", { value: option.codigo, children: option.descricao }, option.codigo)))] }), selected.length === 0 ? (_jsx("div", { className: styles.empty, children: emptyText })) : (_jsx("div", { className: styles.chips, children: selected.map(item => (_jsxs("button", { type: "button", className: styles.chip, onClick: () => removeItem(item.codigo), title: "Remover", children: [_jsx("span", { children: item.descricao }), _jsx("strong", { children: "\u00D7" })] }, item.codigo))) }))] }));
}
