import { fireEvent, render, screen } from "@testing-library/react";

import SectionCard from "./SectionCard";

describe("SectionCard", () => {
    it("starts closed by default and toggles its content", () => {
        render(
            <SectionCard title="Segurado">
                <p>Campos do segurado</p>
            </SectionCard>
        );

        const header = screen.getByRole("button", { name: "Segurado" });
        expect(header).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("Campos do segurado")).not.toBeInTheDocument();

        fireEvent.click(header);

        expect(header).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("Campos do segurado")).toBeInTheDocument();
    });

    it("honors defaultOpen and exposes pending state", () => {
        const { container } = render(
            <SectionCard title="Veículo" defaultOpen hasPendingFields allowOverflow>
                <p>Dados do veículo</p>
            </SectionCard>
        );

        expect(screen.getByRole("button", { name: "Veículo" })).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("Dados do veículo")).toBeInTheDocument();
        expect(container.querySelectorAll("section span").length).toBeGreaterThan(0);
    });
});
