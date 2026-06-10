import styles from "./CotacaoCard.module.css";

interface Props {
  cotacao: any;
}

export default function CotacaoCard({
  cotacao
}: Props) {
  return (
    <div className={styles.card}>

      <div className={styles.header}>
        {cotacao.grupoCotacao.parceiro.seguradora}
      </div>

      <div className={styles.content}>

        <div>
          <span>Produto</span>
          <strong>
            {cotacao.grupoCotacao.parceiro.produto}
          </strong>
        </div>

        <div>
          <span>Prêmio</span>
          <strong>
            R$ {cotacao.resumoFinanceiro.premioTotal}
          </strong>
        </div>

        <div>
          <span>Comissão</span>
          <strong>
            R$ {cotacao.resumoFinanceiro.comissao}
          </strong>
        </div>

        <div>
          <span>Risco</span>
          <strong>
            {cotacao.scoreRisco?.nivel}
          </strong>
        </div>

      </div>

    </div>
  );
}