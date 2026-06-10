export interface Cotacao {
    id: string;

    grupoCotacao: {
        codigo: string;
        versao: number;
        parceiro: {
            seguradora: string;
            produto: string;
        };
    };

    resumoFinanceiro: {
        valorVeiculo: number;
        premioTotal: number;
    };

    scoreRisco: {
        pontuacao: number;
        nivel: string;
    };

    beneficios: {
        codigo: string;
        descricao: string;
    }[];

    pagamentos: Pagamento[];

    status: string;
}

export interface Pagamento {
    formaPagamento: {
        descricao: string;
    };

    parcelas: Parcela[];
}

export interface Parcela {
    numero: number;
    valor: number;
}