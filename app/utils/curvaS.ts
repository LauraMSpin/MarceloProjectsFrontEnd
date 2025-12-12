import { Servico, CurvaSData, PagamentoMensal } from '../types';
import { gerarMesesSequenciais } from './datas';

export function calcularCurvaS(
  servicos: Servico[], 
  numMeses: number = 12, 
  pagamentosMensais: PagamentoMensal[] = [],
  mesInicial: number = 1,
  anoInicial: number = new Date().getFullYear()
): CurvaSData[] {
  const dados: CurvaSData[] = [];
  
  // Gerar nomes dos meses reais
  const nomesMeses = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
  
  // Inicializar arrays para cada mês
  for (let i = 0; i < numMeses; i++) {
    dados.push({
      mes: nomesMeses[i],
      previsto: 0,
      realizado: 0,
      pago: 0,
      previstoAcumulado: 0,
      realizadoAcumulado: 0,
      pagoAcumulado: 0,
    });
  }

  // Calcular valores mensais (valores já estão em reais)
  servicos.forEach((servico) => {
    servico.medicoes.forEach((medicao, index) => {
      if (index < numMeses) {
        dados[index].previsto += medicao.previsto;
        dados[index].realizado += medicao.realizado;
      }
    });
  });

  // Buscar valores de pagamentos mensais do contrato
  pagamentosMensais.forEach((pagamento) => {
    const index = pagamento.ordem - 1; // ordem é 1-based
    if (index >= 0 && index < numMeses) {
      dados[index].pago = pagamento.valor;
    }
  });

  // Calcular acumulados
  let previstoAcum = 0;
  let realizadoAcum = 0;
  let pagoAcum = 0;
  
  dados.forEach((dado) => {
    previstoAcum += dado.previsto;
    realizadoAcum += dado.realizado;
    pagoAcum += dado.pago;
    dado.previstoAcumulado = previstoAcum;
    dado.realizadoAcumulado = realizadoAcum;
    dado.pagoAcumulado = pagoAcum;
  });

  return dados;
}

export function calcularTotais(servicos: Servico[], pagamentosMensais: PagamentoMensal[] = []) {
  let totalPrevisto = 0;
  let totalRealizado = 0;
  let totalPago = 0;
  let valorTotalGeral = 0;

  servicos.forEach((servico) => {
    valorTotalGeral += servico.valorTotal;
    
    servico.medicoes.forEach((medicao) => {
      totalPrevisto += medicao.previsto;
      totalRealizado += medicao.realizado;
    });
  });

  // Calcular total pago a partir dos pagamentos mensais do contrato
  pagamentosMensais.forEach((pagamento) => {
    totalPago += pagamento.valor;
  });

  return {
    totalPrevisto,
    totalRealizado,
    totalPago,
    valorTotalGeral,
    percentualRealizado: totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0,
    percentualPago: totalRealizado > 0 ? (totalPago / totalRealizado) * 100 : 0,
  };
}
