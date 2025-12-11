import { Usuario, Contrato, Servico, Medicao } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  pago: number;
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
  servicos: ServicoDto[];
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
    pago: dto.pago,
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
    servicos: dto.servicos.map(convertServicoFromDto),
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
    servicos: [],
  };
}

// API de Usuários
export const usuariosApi = {
  async listar(): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) throw new Error('Erro ao listar usuários');
    const data: UsuarioDto[] = await response.json();
    return data.map(convertUsuarioFromDto);
  },

  async buscar(id: string): Promise<Usuario> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
    if (!response.ok) throw new Error('Usuário não encontrado');
    const data: UsuarioDto = await response.json();
    return convertUsuarioFromDto(data);
  },

  async criar(usuario: { nome: string; email: string; empresa?: string }): Promise<Usuario> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error('Erro ao criar usuário');
    const data: UsuarioDto = await response.json();
    return convertUsuarioFromDto(data);
  },

  async atualizar(id: string, usuario: { nome: string; email: string; empresa?: string }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error('Erro ao atualizar usuário');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar usuário');
  },
};

// API de Contratos
export const contratosApi = {
  async listar(usuarioId?: string): Promise<Contrato[]> {
    const url = usuarioId 
      ? `${API_BASE_URL}/contratos?usuarioId=${usuarioId}`
      : `${API_BASE_URL}/contratos`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar contratos');
    const data: ContratoResumoDto[] = await response.json();
    return data.map(convertContratoResumoFromDto);
  },

  async buscar(id: string): Promise<Contrato> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`);
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
    usuarioId: string;
  }): Promise<Contrato> {
    const response = await fetch(`${API_BASE_URL}/contratos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contrato),
    });
    if (!response.ok) throw new Error('Erro ao atualizar contrato');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contratos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar contrato');
  },
};

// API de Serviços
export const servicosApi = {
  async listar(contratoId?: string): Promise<Servico[]> {
    const url = contratoId 
      ? `${API_BASE_URL}/servicos?contratoId=${contratoId}`
      : `${API_BASE_URL}/servicos`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar serviços');
    const data: ServicoDto[] = await response.json();
    return data.map(convertServicoFromDto);
  },

  async buscar(id: string): Promise<Servico> {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`);
    if (!response.ok) throw new Error('Serviço não encontrado');
    const data: ServicoDto = await response.json();
    return convertServicoFromDto(data);
  },

  async criar(servico: {
    item: string;
    servico: string;
    contratoId: string;
    medicoes: { mes: string; previsto: number; realizado: number; pago: number }[];
  }): Promise<Servico> {
    // Adicionar ordem às medições
    const servicoComOrdem = {
      ...servico,
      medicoes: servico.medicoes.map((m, index) => ({ ...m, ordem: index })),
    };
    const response = await fetch(`${API_BASE_URL}/servicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao criar serviço');
    const data: ServicoDto = await response.json();
    return convertServicoFromDto(data);
  },

  async atualizar(id: string, servico: {
    item: string;
    servico: string;
    medicoes: { mes: string; previsto: number; realizado: number; pago: number }[];
  }): Promise<void> {
    // Adicionar ordem às medições
    const servicoComOrdem = {
      ...servico,
      medicoes: servico.medicoes.map((m, index) => ({ ...m, ordem: index })),
    };
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao atualizar serviço');
  },

  async atualizarMedicao(servicoId: string, medicaoIndex: number, medicao: {
    mes: string;
    previsto: number;
    realizado: number;
    pago: number;
  }): Promise<void> {
    // Adicionar ordem à medição
    const medicaoComOrdem = { ...medicao, ordem: medicaoIndex };
    const response = await fetch(`${API_BASE_URL}/servicos/${servicoId}/medicoes/${medicaoIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicaoComOrdem),
    });
    if (!response.ok) throw new Error('Erro ao atualizar medição');
  },

  async deletar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar serviço');
  },
};
