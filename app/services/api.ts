import { Usuario, Contrato, Servico, Medicao, ContratoCompartilhado, PagamentoMensal } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Função para obter headers com token de autenticação
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Tipos para DTOs do backend
interface UsuarioDto {
  id: string;
  nome: string;
  email: string;
  empresa?: string;
  dataCriacao: string;
}

interface MedicaoDto {
  id: string;
  ordem: number;
  mes: string;
  previsto: number;
  realizado: number;
}

interface PagamentoMensalDto {
  id: string;
  ordem: number;
  mes: string;
  valor: number;
}

interface ServicoDto {
  id: string;
  item: string;
  servico: string;
  valorTotal: number;
  contratoId: string;
  medicoes: MedicaoDto[];
}

interface ContratoDto {
  id: string;
  nome: string;
  descricao: string;
  numeroMeses: number;
  mesInicial: number;
  anoInicial: number;
  dataCriacao: string;
  usuarioId: string;
  nomeProprietario?: string;
  isProprietario: boolean;
  podeEditar: boolean;
  percentualReajuste: number;
  mesInicioReajuste: number | null;
  servicos: ServicoDto[];
  pagamentosMensais: PagamentoMensalDto[];
}

interface ContratoResumoDto {
  id: string;
  nome: string;
  descricao: string;
  numeroMeses: number;
  mesInicial: number;
  anoInicial: number;
  dataCriacao: string;
  usuarioId: string;
  nomeProprietario?: string;
  isProprietario: boolean;
  podeEditar: boolean;
  percentualReajuste: number;
  mesInicioReajuste: number | null;
}

// Conversores DTO -> Frontend
function convertUsuarioFromDto(dto: UsuarioDto): Usuario {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email,
    empresa: dto.empresa,
    dataCriacao: dto.dataCriacao,
  };
}

function convertMedicaoFromDto(dto: MedicaoDto): Medicao {
  return {
    mes: dto.mes,
    previsto: dto.previsto,
    realizado: dto.realizado,
  };
}

function convertPagamentoMensalFromDto(dto: PagamentoMensalDto): PagamentoMensal {
  return {
    id: dto.id,
    ordem: dto.ordem,
    mes: dto.mes,
    valor: dto.valor,
  };
}

function convertServicoFromDto(dto: ServicoDto): Servico {
  return {
    id: dto.id,
    item: dto.item,
    servico: dto.servico,
    valorTotal: dto.valorTotal,
    medicoes: dto.medicoes.map(convertMedicaoFromDto),
  };
}

function convertContratoFromDto(dto: ContratoDto): Contrato {
  return {
    id: dto.id,
    nome: dto.nome,
    descricao: dto.descricao,
    numeroMeses: dto.numeroMeses,
    mesInicial: dto.mesInicial,
    anoInicial: dto.anoInicial,
    dataCriacao: dto.dataCriacao,
    usuarioId: dto.usuarioId,
    nomeProprietario: dto.nomeProprietario,
    isProprietario: dto.isProprietario,
    podeEditar: dto.podeEditar,
    percentualReajuste: dto.percentualReajuste,
    mesInicioReajuste: dto.mesInicioReajuste,
    servicos: dto.servicos.map(convertServicoFromDto),
    pagamentosMensais: dto.pagamentosMensais?.map(convertPagamentoMensalFromDto) || [],
  };
}

function convertContratoResumoFromDto(dto: ContratoResumoDto): Contrato {
  return {
    id: dto.id,
    nome: dto.nome,
    descricao: dto.descricao,
    numeroMeses: dto.numeroMeses,
    mesInicial: dto.mesInicial,
    anoInicial: dto.anoInicial,
    dataCriacao: dto.dataCriacao,
    usuarioId: dto.usuarioId,
    nomeProprietario: dto.nomeProprietario,
    isProprietario: dto.isProprietario,
    podeEditar: dto.podeEditar,
    percentualReajuste: dto.percentualReajuste,
    mesInicioReajuste: dto.mesInicioReajuste,
    servicos: [],
    pagamentosMensais: [],
  };
}

// API de Usuários
export const usuariosApi = {
  async listar(): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao listar usuários');
    const data: UsuarioDto[] = await response.json();
    return data.map(convertUsuarioFromDto);
  },

  async buscar(id: string): Promise<Usuario> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Usuário não encontrado');
    const data: UsuarioDto = await response.json();
    return convertUsuarioFromDto(data);
  },

  async criar(usuario: { nome: string; email: string; empresa?: string }): Promise<Usuario> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error('Erro ao criar usuário');
    const data: UsuarioDto = await response.json();
    return convertUsuarioFromDto(data);
  },

  async atualizar(id: string, usuario: { nome: string; email: string; empresa?: string }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error('Erro ao atualizar usuário');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao deletar usuário');
  },
};

// API de Contratos
export const contratosApi = {
  async listar(): Promise<Contrato[]> {
    const response = await fetch(`${API_BASE_URL}/contratos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao listar contratos');
    const data: ContratoResumoDto[] = await response.json();
    return data.map(convertContratoResumoFromDto);
  },

  async buscar(id: string): Promise<Contrato> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Contrato não encontrado');
    const data: ContratoDto = await response.json();
    return convertContratoFromDto(data);
  },

  async criar(contrato: {
    nome: string;
    descricao: string;
    numeroMeses: number;
    mesInicial: number;
    anoInicial: number;
    percentualReajuste?: number;
    mesInicioReajuste?: number | null;
  }): Promise<Contrato> {
    const response = await fetch(`${API_BASE_URL}/contratos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contrato),
    });
    if (!response.ok) throw new Error('Erro ao criar contrato');
    const data: ContratoDto = await response.json();
    return convertContratoFromDto(data);
  },

  async atualizar(id: string, contrato: {
    nome: string;
    descricao: string;
    numeroMeses: number;
    mesInicial: number;
    anoInicial: number;
    percentualReajuste?: number;
    mesInicioReajuste?: number | null;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(contrato),
    });
    if (!response.ok) throw new Error('Erro ao atualizar contrato');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao deletar contrato');
  },

  async listarCompartilhamentos(contratoId: string): Promise<ContratoCompartilhado[]> {
    const response = await fetch(`${API_BASE_URL}/contratos/${contratoId}/compartilhamentos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao listar compartilhamentos');
    return response.json();
  },

  async compartilhar(contratoId: string, usuarioId: string, podeEditar: boolean): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${contratoId}/compartilhar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ usuarioId, podeEditar }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao compartilhar contrato');
    }
  },

  async removerCompartilhamento(contratoId: string, usuarioId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${contratoId}/compartilhar/${usuarioId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao remover compartilhamento');
  },

  async atualizarPagamento(contratoId: string, ordem: number, mes: string, valor: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${contratoId}/pagamentos/${ordem}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ordem, mes, valor }),
    });
    if (!response.ok) throw new Error('Erro ao atualizar pagamento');
  },
};

// API de Serviços
export const servicosApi = {
  async listar(contratoId?: string): Promise<Servico[]> {
    const url = contratoId 
      ? `${API_BASE_URL}/servicos?contratoId=${contratoId}`
      : `${API_BASE_URL}/servicos`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao listar serviços');
    const data: ServicoDto[] = await response.json();
    return data.map(convertServicoFromDto);
  },

  async buscar(id: string): Promise<Servico> {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Serviço não encontrado');
    const data: ServicoDto = await response.json();
    return convertServicoFromDto(data);
  },

  async criar(servico: {
    item: string;
    servico: string;
    contratoId: string;
    medicoes: { mes: string; previsto: number; realizado: number }[];
  }): Promise<Servico> {
    // Adicionar ordem às medições
    const servicoComOrdem = {
      ...servico,
      medicoes: servico.medicoes.map((m, index) => ({ ...m, ordem: index })),
    };
    const response = await fetch(`${API_BASE_URL}/servicos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(servicoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao criar serviço');
    const data: ServicoDto = await response.json();
    return convertServicoFromDto(data);
  },

  async atualizar(id: string, servico: {
    item: string;
    servico: string;
    medicoes: { mes: string; previsto: number; realizado: number }[];
  }): Promise<void> {
    // Adicionar ordem às medições
    const servicoComOrdem = {
      ...servico,
      medicoes: servico.medicoes.map((m, index) => ({ ...m, ordem: index })),
    };
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(servicoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao atualizar serviço');
  },

  async atualizarMedicao(servicoId: string, medicaoIndex: number, medicao: {
    mes: string;
    previsto: number;
    realizado: number;
  }): Promise<void> {
    // Adicionar ordem à medição
    const medicaoComOrdem = { ...medicao, ordem: medicaoIndex };
    const response = await fetch(`${API_BASE_URL}/servicos/${servicoId}/medicoes/${medicaoIndex}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(medicaoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao atualizar medição');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao deletar serviço');
  },
};
