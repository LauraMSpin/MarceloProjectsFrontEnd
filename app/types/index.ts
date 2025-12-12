export interface Medicao {
  mes: string; // ex: "Jan/2024", "Fev/2024", etc
  previsto: number;
  realizado: number;
  pago: number;
}

export interface Servico {
  id: string;
  item: string;
  servico: string;
  medicoes: Medicao[];
  valorTotal: number;
}

export interface ServicoFormData {
  item: string;
  servico: string;
  medicoes: Medicao[];
}

export interface CurvaSData {
  mes: string;
  previsto: number;
  realizado: number;
  pago: number;
  previstoAcumulado: number;
  realizadoAcumulado: number;
  pagoAcumulado: number;
}

export interface PeriodoReferencia {
  mesInicial: number; // 1-12
  anoInicial: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa?: string;
  dataCriacao: string;
}

export interface Contrato {
  id: string;
  nome: string;
  descricao: string;
  numeroMeses: number;
  mesInicial: number;
  anoInicial: number;
  servicos: Servico[];
  dataCriacao: string;
  usuarioId: string;
  nomeProprietario?: string;
  isProprietario: boolean;
  podeEditar: boolean;
}

export interface ContratoCompartilhado {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  podeEditar: boolean;
  dataCompartilhamento: string;
}
