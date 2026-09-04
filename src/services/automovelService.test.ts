import { vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./api", () => ({
    api: { get }
}));

import { buscarVeiculos } from "./automovelService";

describe("buscarVeiculos", () => {
    it("uses the vehicle search endpoint and returns its payload", async () => {
        const vehicles = [{ codigoFipe: "001", modelo: "Civic" }];
        get.mockResolvedValueOnce({ data: vehicles });

        await expect(buscarVeiculos("Civic")).resolves.toEqual(vehicles);
        expect(get).toHaveBeenCalledWith("/automovel/buscar/modelo", {
            params: { descricao: "Civic" }
        });
    });
});
