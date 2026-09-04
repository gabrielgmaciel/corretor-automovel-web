import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import MultiSelectChips, { type MultiSelectOption } from "./MultiSelectChips";

const options: MultiSelectOption[] = [
    { codigo: "vidros", descricao: "Proteção para vidros" },
    { codigo: "guincho", descricao: "Guincho" }
];

describe("MultiSelectChips", () => {
    it("shows the empty message and adds only available options", () => {
        const onChange = vi.fn();
        render(<MultiSelectChips options={options} selected={[]} onChange={onChange} />);

        expect(screen.getByText("Nenhum item selecionado")).toBeInTheDocument();
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "vidros" } });

        expect(onChange).toHaveBeenCalledWith([options[0]]);
    });

    it("removes a selected item and does not offer it again", () => {
        const onChange = vi.fn();
        render(<MultiSelectChips options={options} selected={[options[0]]} onChange={onChange} />);

        expect(screen.queryByRole("option", { name: "Proteção para vidros" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /proteção para vidros/i }));

        expect(onChange).toHaveBeenCalledWith([]);
    });
});
