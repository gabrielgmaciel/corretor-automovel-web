export interface Dominio {
    codigo: string;
    descricao: string;
    explicacao?: string;
}

export interface Pergunta {
    codigo: string;
    descricao: string;
    explicacao: string;

    respostas: Dominio[];
}