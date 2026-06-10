import api from "./api";

export async function buscarVeiculos(
  descricao: string
) {
  const { data } = await api.get(
    "/automovel/buscar/modelo",
    {
      params: {
        descricao
      }
    }
  );

  return data;
}