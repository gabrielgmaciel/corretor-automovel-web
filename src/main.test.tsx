import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRoot, render } = vi.hoisted(() => ({
    createRoot: vi.fn(),
    render: vi.fn()
}));

vi.mock("react-dom/client", () => ({
    default: { createRoot },
    createRoot
}));

vi.mock("./App", () => ({
    default: () => <main>Aplicação</main>
}));

describe("main", () => {
    beforeEach(() => {
        vi.resetModules();
        createRoot.mockReset();
        render.mockReset();
        document.body.innerHTML = '<div id="root"></div>';
        createRoot.mockReturnValue({ render });
    });

    it("cria a raiz React e renderiza a aplicação dentro do BrowserRouter", async () => {
        await import("./main");

        expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
        expect(render).toHaveBeenCalledOnce();
        expect(render.mock.calls[0][0]).toMatchObject({
            type: expect.anything()
        });
    });
});
