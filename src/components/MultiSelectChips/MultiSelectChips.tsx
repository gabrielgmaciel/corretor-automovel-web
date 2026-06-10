import { useMemo } from "react";

import styles from "./MultiSelectChips.module.css";

export interface MultiSelectOption {
    codigo: string;
    descricao: string;
    explicacao?: string;
    id?: string;
    tipoCobertura?: string;
}

interface MultiSelectChipsProps {
    options: MultiSelectOption[];
    selected: MultiSelectOption[];
    onChange: (items: MultiSelectOption[]) => void;
    placeholder?: string;
    emptyText?: string;
}

export default function MultiSelectChips({
    options,
    selected,
    onChange,
    placeholder = "Selecione uma opção",
    emptyText = "Nenhum item selecionado"
}: MultiSelectChipsProps) {

    const availableOptions =
        useMemo(
            () =>
                options.filter(
                    option =>
                        !selected.some(
                            selectedItem =>
                                selectedItem.codigo === option.codigo
                        )
                ),
            [options, selected]
        );

    const addItem = (codigo: string) => {

        const item =
            options.find(
                option => option.codigo === codigo
            );

        if (!item) return;

        onChange([
            ...selected,
            item
        ]);
    };

    const removeItem = (codigo: string) => {

        onChange(
            selected.filter(
                item => item.codigo !== codigo
            )
        );
    };

    return (
        <div className={styles.container}>
            <select
                className={styles.select}
                defaultValue=""
                onChange={e => {
                    if (!e.target.value) return;

                    addItem(e.target.value);

                    e.target.value = "";
                }}
            >
                <option value="">
                    {placeholder}
                </option>

                {availableOptions.map(option => (
                    <option
                        key={option.codigo}
                        value={option.codigo}
                    >
                        {option.descricao}
                    </option>
                ))}
            </select>

            {selected.length === 0 ? (
                <div className={styles.empty}>
                    {emptyText}
                </div>
            ) : (
                <div className={styles.chips}>
                    {selected.map(item => (
                        <button
                            key={item.codigo}
                            type="button"
                            className={styles.chip}
                            onClick={() =>
                                removeItem(item.codigo)
                            }
                            title="Remover"
                        >
                            <span>
                                {item.descricao}
                            </span>

                            <strong>
                                ×
                            </strong>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
