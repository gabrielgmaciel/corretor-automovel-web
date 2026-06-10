import { useCotacaoSSE } from "../../hooks/useCotacaoSSE";

import CotacaoCard from "../../components/CotacaoCard/CotacaoCard";

import styles from "./StepResultado.module.css";

interface Props {
  payload: any;
}

export default function StepResultado({
  payload
}: Props) {

  const {
    cotacoes,
    finished,
    loading
  } = useCotacaoSSE(payload);

  return (
    <div className={styles.container}>

      <h2>
        Resultado das Cotações
      </h2>

      {loading && (
        <div className={styles.loading}>
          Consultando seguradoras...
        </div>
      )}

      <div className={styles.grid}>

        {cotacoes.map((cotacao) => (
          <CotacaoCard
            key={cotacao.id}
            cotacao={cotacao}
          />
        ))}

      </div>

      {finished && (
        <div className={styles.finished}>
          Todas as seguradoras responderam.
        </div>
      )}

    </div>
  );
}