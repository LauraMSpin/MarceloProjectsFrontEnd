'use client';

import { useState, useEffect, useMemo } from 'react';
import { Servico } from '../types';

interface CaminhoCriticoProps {
  servicos: Servico[];
  numMeses: number;
  nomeContrato?: string;
}

interface AtividadeComDependencia {
  id: string;
  item: string;
  servico: string;
  predecessores: string[]; // IDs das atividades predecessoras
  inicio: number; // Mês de início (0-indexed)
  duracao: number; // Duração em meses
  fim: number; // Mês de fim (0-indexed)
  es: number; // Early Start
  ef: number; // Early Finish
  ls: number; // Late Start
  lf: number; // Late Finish
  folga: number; // Folga total
  critico: boolean; // Se está no caminho crítico
}

export default function CaminhoCritico({ servicos, numMeses, nomeContrato = '' }: CaminhoCriticoProps) {
  // Carregar dependências do localStorage
  const [dependencias, setDependencias] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dependencias_${nomeContrato}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const [editandoDependencia, setEditandoDependencia] = useState<string | null>(null);
  const [predecessoresSelecionados, setPredecessoresSelecionados] = useState<string[]>([]);

  // Salvar dependências no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined' && nomeContrato) {
      localStorage.setItem(`dependencias_${nomeContrato}`, JSON.stringify(dependencias));
    }
  }, [dependencias, nomeContrato]);

  // Ordenar serviços por item
  const servicosOrdenados = useMemo(() => {
    return [...servicos].sort((a, b) => {
      const numA = parseFloat(a.item.replace(/[^\d.]/g, '')) || 0;
      const numB = parseFloat(b.item.replace(/[^\d.]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.item.localeCompare(b.item, 'pt-BR', { numeric: true });
    });
  }, [servicos]);

  // Calcular início e duração de cada serviço baseado nas medições
  const atividadesBase = useMemo(() => {
    return servicosOrdenados.map(servico => {
      let primeiroMes = -1;
      let ultimoMes = -1;
      
      servico.medicoes.forEach((medicao, index) => {
        if (medicao.previsto > 0) {
          if (primeiroMes === -1) primeiroMes = index;
          ultimoMes = index;
        }
      });
      
      const inicio = primeiroMes === -1 ? 0 : primeiroMes;
      const fim = ultimoMes === -1 ? 0 : ultimoMes;
      const duracao = fim - inicio + 1;
      
      return {
        id: servico.id,
        item: servico.item,
        servico: servico.servico,
        inicio,
        fim,
        duracao: duracao > 0 ? duracao : 1,
        predecessores: dependencias[servico.id] || [],
      };
    });
  }, [servicosOrdenados, dependencias]);

  // Calcular caminho crítico
  const atividadesComCritico = useMemo((): AtividadeComDependencia[] => {
    if (atividadesBase.length === 0) return [];

    // Criar mapa de atividades
    const mapaAtividades = new Map<string, AtividadeComDependencia>();
    
    atividadesBase.forEach(ativ => {
      mapaAtividades.set(ativ.id, {
        ...ativ,
        es: 0,
        ef: 0,
        ls: 0,
        lf: 0,
        folga: 0,
        critico: false,
      });
    });

    // Forward Pass - Calcular ES e EF
    const calcularForward = (id: string, visitados: Set<string>): number => {
      if (visitados.has(id)) return mapaAtividades.get(id)?.ef || 0;
      visitados.add(id);
      
      const ativ = mapaAtividades.get(id);
      if (!ativ) return 0;

      let maxEfPredecessor = 0;
      if (ativ.predecessores.length > 0) {
        ativ.predecessores.forEach(predId => {
          const efPred = calcularForward(predId, visitados);
          maxEfPredecessor = Math.max(maxEfPredecessor, efPred);
        });
      }

      // ES é o maior EF dos predecessores ou o início planejado
      ativ.es = Math.max(maxEfPredecessor, ativ.inicio);
      ativ.ef = ativ.es + ativ.duracao;
      
      return ativ.ef;
    };

    // Executar forward pass para todas as atividades
    const visitados = new Set<string>();
    atividadesBase.forEach(ativ => calcularForward(ativ.id, visitados));

    // Encontrar o maior EF (fim do projeto)
    let fimProjeto = 0;
    mapaAtividades.forEach(ativ => {
      fimProjeto = Math.max(fimProjeto, ativ.ef);
    });

    // Backward Pass - Calcular LS e LF
    // Primeiro, criar mapa de sucessores
    const sucessores = new Map<string, string[]>();
    atividadesBase.forEach(ativ => {
      ativ.predecessores.forEach(predId => {
        if (!sucessores.has(predId)) {
          sucessores.set(predId, []);
        }
        sucessores.get(predId)!.push(ativ.id);
      });
    });

    const calcularBackward = (id: string, visitados: Set<string>): number => {
      if (visitados.has(id)) return mapaAtividades.get(id)?.ls || fimProjeto;
      visitados.add(id);
      
      const ativ = mapaAtividades.get(id);
      if (!ativ) return fimProjeto;

      const sucList = sucessores.get(id) || [];
      
      if (sucList.length === 0) {
        // Atividade final - LF é o fim do projeto
        ativ.lf = fimProjeto;
      } else {
        // LF é o menor LS dos sucessores
        let minLsSuccessor = fimProjeto;
        sucList.forEach(sucId => {
          const lsSuc = calcularBackward(sucId, visitados);
          minLsSuccessor = Math.min(minLsSuccessor, lsSuc);
        });
        ativ.lf = minLsSuccessor;
      }

      ativ.ls = ativ.lf - ativ.duracao;
      ativ.folga = ativ.ls - ativ.es;
      ativ.critico = ativ.folga === 0;
      
      return ativ.ls;
    };

    // Executar backward pass para todas as atividades
    const visitadosBack = new Set<string>();
    atividadesBase.forEach(ativ => calcularBackward(ativ.id, visitadosBack));

    return Array.from(mapaAtividades.values());
  }, [atividadesBase]);

  // Gerar nomes dos meses
  const nomesMeses = Array.from({ length: numMeses }, (_, i) => `M${i + 1}`);

  const handleIniciarEdicao = (id: string, predecessoresAtuais: string[]) => {
    setEditandoDependencia(id);
    setPredecessoresSelecionados([...predecessoresAtuais]);
  };

  const handleSalvarDependencia = () => {
    if (editandoDependencia) {
      setDependencias(prev => ({
        ...prev,
        [editandoDependencia]: predecessoresSelecionados,
      }));
      setEditandoDependencia(null);
      setPredecessoresSelecionados([]);
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoDependencia(null);
    setPredecessoresSelecionados([]);
  };

  const togglePredecessor = (id: string) => {
    setPredecessoresSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleLimparDependencias = () => {
    if (confirm('Tem certeza que deseja limpar todas as dependências?')) {
      setDependencias({});
    }
  };

  if (servicos.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-12 rounded-xl shadow-lg text-center">
        <p className="text-xl sm:text-2xl text-gray-400 mb-2">🔗 Sem dados para exibir</p>
        <p className="text-gray-500 text-sm sm:text-base">
          Adicione serviços para visualizar o Caminho Crítico
        </p>
      </div>
    );
  }

  // Identificar atividades no caminho crítico
  const atividadesCriticas = atividadesComCritico.filter(a => a.critico);
  const temCaminhoCritico = atividadesCriticas.length > 0 && Object.keys(dependencias).length > 0;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        🔗 Caminho Crítico {nomeContrato ? `- ${nomeContrato}` : ''}
      </h3>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Como usar:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Clique em "Editar" para definir predecessores de cada atividade</li>
          <li>2. Selecione as atividades que devem ser concluídas antes</li>
          <li>3. O caminho crítico será calculado automaticamente</li>
          <li>4. Atividades em <span className="text-red-600 font-bold">vermelho</span> estão no caminho crítico (folga = 0)</li>
        </ul>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
          <span className="text-sm text-gray-700">Período da Atividade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Caminho Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span className="text-sm text-gray-700">Folga Disponível</span>
        </div>
        <button
          onClick={handleLimparDependencias}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition"
        >
          🗑️ Limpar Dependências
        </button>
      </div>

      {/* Resumo do Caminho Crítico */}
      {temCaminhoCritico && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Caminho Crítico Identificado:</h4>
          <div className="text-sm text-red-700">
            <p className="mb-2">
              <strong>Atividades críticas ({atividadesCriticas.length}):</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {atividadesCriticas.map(a => (
                <span key={a.id} className="bg-red-200 px-2 py-1 rounded text-xs">
                  {a.item}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs">
              Qualquer atraso nestas atividades impactará diretamente o prazo do projeto.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Cabeçalho */}
          <div className="flex border-b-2 border-gray-300 pb-2 mb-2">
            <div className="w-40 flex-shrink-0 font-semibold text-gray-700 text-sm px-2">
              Atividade
            </div>
            <div className="w-28 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              Predecessores
            </div>
            <div className="w-16 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              Duração
            </div>
            <div className="w-12 flex-shrink-0 font-semibold text-gray-700 text-sm text-center" title="Early Start">
              ES
            </div>
            <div className="w-12 flex-shrink-0 font-semibold text-gray-700 text-sm text-center" title="Early Finish">
              EF
            </div>
            <div className="w-12 flex-shrink-0 font-semibold text-gray-700 text-sm text-center" title="Late Start">
              LS
            </div>
            <div className="w-12 flex-shrink-0 font-semibold text-gray-700 text-sm text-center" title="Late Finish">
              LF
            </div>
            <div className="w-12 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              Folga
            </div>
            <div className="w-16 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              Ação
            </div>
            <div className="flex-1 flex">
              {nomesMeses.map((mes, index) => (
                <div 
                  key={index} 
                  className="flex-1 text-center text-xs font-semibold text-gray-600 min-w-[25px]"
                >
                  {mes}
                </div>
              ))}
            </div>
          </div>

          {/* Atividades */}
          {atividadesComCritico.map((ativ, index) => {
            const bgColor = ativ.critico ? 'bg-red-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
            const predecessoresNomes = ativ.predecessores
              .map(id => servicosOrdenados.find(s => s.id === id)?.item)
              .filter(Boolean)
              .join(', ');
            
            return (
              <div key={ativ.id} className={`flex items-center py-2 ${bgColor} hover:bg-gray-100 transition border-b border-gray-200`}>
                {/* Nome */}
                <div className="w-40 flex-shrink-0 px-2">
                  <div className={`text-xs font-bold ${ativ.critico ? 'text-red-700' : 'text-gray-800'}`}>
                    {ativ.item}
                  </div>
                  <div className="text-xs text-gray-600 truncate" title={ativ.servico}>
                    {ativ.servico.length > 20 ? ativ.servico.substring(0, 20) + '...' : ativ.servico}
                  </div>
                </div>
                
                {/* Predecessores */}
                <div className="w-28 flex-shrink-0 text-center">
                  {editandoDependencia === ativ.id ? (
                    <div className="text-xs text-blue-600">Selecionando...</div>
                  ) : (
                    <span className="text-xs text-gray-600">
                      {predecessoresNomes || '-'}
                    </span>
                  )}
                </div>
                
                {/* Duração */}
                <div className="w-16 flex-shrink-0 text-center">
                  <span className="text-xs font-bold text-gray-700">{ativ.duracao}m</span>
                </div>
                
                {/* ES */}
                <div className="w-12 flex-shrink-0 text-center">
                  <span className={`text-xs ${ativ.critico ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    {ativ.es + 1}
                  </span>
                </div>
                
                {/* EF */}
                <div className="w-12 flex-shrink-0 text-center">
                  <span className={`text-xs ${ativ.critico ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    {ativ.ef}
                  </span>
                </div>
                
                {/* LS */}
                <div className="w-12 flex-shrink-0 text-center">
                  <span className={`text-xs ${ativ.critico ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    {ativ.ls + 1}
                  </span>
                </div>
                
                {/* LF */}
                <div className="w-12 flex-shrink-0 text-center">
                  <span className={`text-xs ${ativ.critico ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    {ativ.lf}
                  </span>
                </div>
                
                {/* Folga */}
                <div className="w-12 flex-shrink-0 text-center">
                  <span className={`text-xs font-bold ${ativ.folga === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {ativ.folga}
                  </span>
                </div>
                
                {/* Ação */}
                <div className="w-16 flex-shrink-0 text-center">
                  {editandoDependencia === ativ.id ? (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={handleSalvarDependencia}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelarEdicao}
                        className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleIniciarEdicao(ativ.id, ativ.predecessores)}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Editar
                    </button>
                  )}
                </div>
                
                {/* Diagrama de Gantt */}
                <div className="flex-1 flex relative h-6">
                  {nomesMeses.map((_, mesIndex) => {
                    const noPeríodo = mesIndex >= ativ.es && mesIndex < ativ.ef;
                    const naFolga = mesIndex >= ativ.ef && mesIndex < ativ.lf;
                    const selecionavel = editandoDependencia && editandoDependencia !== ativ.id;
                    const selecionado = predecessoresSelecionados.includes(ativ.id);
                    
                    return (
                      <div 
                        key={mesIndex} 
                        className={`flex-1 border-l border-gray-200 min-w-[25px] relative ${
                          selecionavel ? 'cursor-pointer hover:bg-blue-100' : ''
                        } ${selecionado ? 'bg-blue-200' : ''}`}
                        onClick={() => selecionavel && togglePredecessor(ativ.id)}
                      >
                        {/* Barra da atividade */}
                        {noPeríodo && (
                          <div 
                            className={`absolute top-1 left-0 right-0 h-4 ${
                              ativ.critico ? 'bg-red-500' : 'bg-blue-400'
                            } border ${ativ.critico ? 'border-red-600' : 'border-blue-500'}`}
                            style={{ margin: '0 1px' }}
                          />
                        )}
                        
                        {/* Folga */}
                        {naFolga && (
                          <div 
                            className="absolute top-1 left-0 right-0 h-4 bg-green-300 border border-green-400 opacity-50"
                            style={{ margin: '0 1px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel de seleção de predecessores */}
      {editandoDependencia && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            🔗 Selecione os predecessores para: {servicosOrdenados.find(s => s.id === editandoDependencia)?.item}
          </h4>
          <p className="text-xs text-blue-600 mb-3">
            Clique nas atividades acima ou use os botões abaixo para selecionar/desselecionar predecessores.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {servicosOrdenados
              .filter(s => s.id !== editandoDependencia)
              .map(s => {
                const selecionado = predecessoresSelecionados.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => togglePredecessor(s.id)}
                    className={`text-xs px-3 py-1 rounded transition ${
                      selecionado 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {s.item}
                  </button>
                );
              })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSalvarDependencia}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              ✓ Salvar
            </button>
            <button
              onClick={handleCancelarEdicao}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela de resumo */}
      <div className="mt-6 overflow-x-auto">
        <h4 className="text-md font-bold text-gray-700 mb-3">📋 Análise do Caminho Crítico</h4>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Item</th>
              <th className="border px-3 py-2 text-left">Atividade</th>
              <th className="border px-3 py-2 text-center">Predecessores</th>
              <th className="border px-3 py-2 text-center">Duração</th>
              <th className="border px-3 py-2 text-center">Início + Cedo (ES)</th>
              <th className="border px-3 py-2 text-center">Fim + Cedo (EF)</th>
              <th className="border px-3 py-2 text-center">Início + Tarde (LS)</th>
              <th className="border px-3 py-2 text-center">Fim + Tarde (LF)</th>
              <th className="border px-3 py-2 text-center">Folga</th>
              <th className="border px-3 py-2 text-center">Crítico?</th>
            </tr>
          </thead>
          <tbody>
            {atividadesComCritico.map((ativ, index) => {
              const predecessoresNomes = ativ.predecessores
                .map(id => servicosOrdenados.find(s => s.id === id)?.item)
                .filter(Boolean)
                .join(', ');
              
              return (
                <tr key={ativ.id} className={ativ.critico ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`border px-3 py-2 font-semibold ${ativ.critico ? 'text-red-700' : ''}`}>
                    {ativ.item}
                  </td>
                  <td className="border px-3 py-2">{ativ.servico}</td>
                  <td className="border px-3 py-2 text-center text-gray-600">
                    {predecessoresNomes || '-'}
                  </td>
                  <td className="border px-3 py-2 text-center font-bold">{ativ.duracao} mês(es)</td>
                  <td className="border px-3 py-2 text-center">Mês {ativ.es + 1}</td>
                  <td className="border px-3 py-2 text-center">Mês {ativ.ef}</td>
                  <td className="border px-3 py-2 text-center">Mês {ativ.ls + 1}</td>
                  <td className="border px-3 py-2 text-center">Mês {ativ.lf}</td>
                  <td className={`border px-3 py-2 text-center font-bold ${ativ.folga === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {ativ.folga} mês(es)
                  </td>
                  <td className={`border px-3 py-2 text-center font-bold ${ativ.critico ? 'text-red-600' : 'text-green-600'}`}>
                    {ativ.critico ? '⚠️ SIM' : '✓ NÃO'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
