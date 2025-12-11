'use client';

import React from 'react';
import { Servico } from '../types';
import { useState } from 'react';

interface ServicosTableProps {
  servicos: Servico[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onUpdateMedicao: (servicoIndex: number, medicaoIndex: number, field: 'previsto' | 'realizado' | 'pago', valor: number) => void;
  numMeses?: number;
  modoVisualizacao: 'percentual' | 'real';
  onModoVisualizacaoChange: (modo: 'percentual' | 'real') => void;
}

export default function ServicosTable({
  servicos,
  onEdit,
  onDelete,
  onUpdateMedicao,
  numMeses = 12,
  modoVisualizacao,
  onModoVisualizacaoChange,
}: ServicosTableProps) {
  const [editandoCelula, setEditandoCelula] = useState<{
    servicoIndex: number;
    medicaoIndex: number;
    field: 'previsto' | 'realizado' | 'pago';
  } | null>(null);
  const [valorTemp, setValorTemp] = useState<string>('');

  const handleIniciarEdicao = (
    servicoIndex: number,
    medicaoIndex: number,
    field: 'previsto' | 'realizado' | 'pago',
    valorAtual: number
  ) => {
    setEditandoCelula({ servicoIndex, medicaoIndex, field });
    setValorTemp(valorAtual.toString());
  };

  const handleSalvarEdicao = () => {
    if (editandoCelula) {
      const valor = parseFloat(valorTemp);
      if (!isNaN(valor) && valor >= 0) {
        onUpdateMedicao(
          editandoCelula.servicoIndex,
          editandoCelula.medicaoIndex,
          editandoCelula.field,
          valor
        );
      }
      setEditandoCelula(null);
      setValorTemp('');
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoCelula(null);
    setValorTemp('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSalvarEdicao();
    } else if (e.key === 'Escape') {
      handleCancelarEdicao();
    }
  };
  if (servicos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <p className="text-2xl text-gray-400 mb-2">📋 Nenhum serviço cadastrado</p>
        <p className="text-gray-500">
          Use o formulário acima para adicionar serviços
        </p>
      </div>
    );
  }

  // Calcular valor total geral de todos os serviços
  const valorTotalGeral = servicos.reduce((sum, servico) => sum + servico.valorTotal, 0);

  // Ordenar serviços por item (ordem numérica considerando formatos como "1", "1.1", "2", etc.)
  const servicosOrdenados = [...servicos].sort((a, b) => {
    const parseItem = (item: string) => {
      return item.split('.').map(part => {
        const num = parseFloat(part);
        return isNaN(num) ? 0 : num;
      });
    };
    
    const partsA = parseItem(a.item);
    const partsB = parseItem(b.item);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Botão de alternância de visualização */}
      <div className="p-3 sm:p-4 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <span className="text-xs sm:text-sm font-medium text-gray-700">Visualização dos valores mensais:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onModoVisualizacaoChange('percentual')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              modoVisualizacao === 'percentual'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 <span className="hidden sm:inline">Percentual</span> (%)
          </button>
          <button
            onClick={() => onModoVisualizacaoChange('real')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              modoVisualizacao === 'real'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💰 <span className="hidden sm:inline">Valor</span> (R$)
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-center border border-purple-500">ITEM</th>
              <th className="px-4 py-3 text-xs font-bold text-left border border-purple-500">SERVIÇO</th>
              <th className="px-4 py-3 text-xs font-bold text-center border border-purple-500">
                % PARTICIPAÇÃO
              </th>
              <th className="px-2 py-3 text-xs font-bold text-center border border-purple-500"></th>
              
              {Array.from({ length: numMeses }, (_, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-xs font-bold text-center border border-purple-500"
                >
                  Mês {i + 1}
                </th>
              ))}
              
              <th className="px-4 py-3 text-xs font-bold text-center border border-purple-500">
                VALOR TOTAL
              </th>
              <th className="px-4 py-3 text-xs font-bold text-center border border-purple-500">AÇÕES</th>
            </tr>
          </thead>
          
          <tbody>
            {servicosOrdenados.map((servico, displayIndex) => {
              // Encontrar o índice original para as funções de callback
              const originalIndex = servicos.findIndex(s => s.id === servico.id);
              const percentualParticipacao = valorTotalGeral > 0 
                ? (servico.valorTotal / valorTotalGeral) * 100 
                : 0;
              
              const bgColor = displayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
              
              return (
                <React.Fragment key={servico.id}>
                  {/* Linha PREVISTO */}
                  <tr
                    className={`hover:bg-blue-50 transition ${bgColor}`}
                  >
                    <td className={`px-4 py-2 text-sm text-center font-medium border ${bgColor}`} rowSpan={3}>
                      {servico.item}
                    </td>
                    <td className={`px-4 py-2 text-sm font-medium text-left border ${bgColor}`} rowSpan={3}>
                      {servico.servico}
                    </td>
                    <td className={`px-4 py-2 text-sm text-center border ${bgColor}`} rowSpan={3}>
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-lg ${
                          percentualParticipacao >= 20 ? 'text-red-600' :
                          percentualParticipacao >= 10 ? 'text-orange-600' :
                          percentualParticipacao >= 5 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {percentualParticipacao.toFixed(2)}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              percentualParticipacao >= 20 ? 'bg-red-600' :
                              percentualParticipacao >= 10 ? 'bg-orange-600' :
                              percentualParticipacao >= 5 ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min(percentualParticipacao, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-900 text-center border">
                      📊 P
                    </td>
                    
                    {servico.medicoes.map((medicao, mIndex) => {
                      const editandoPrevisto = editandoCelula?.servicoIndex === originalIndex && 
                                              editandoCelula?.medicaoIndex === mIndex && 
                                              editandoCelula?.field === 'previsto';
                      
                      // Calcular percentual do valor total do serviço
                      const percentualPrevisto = servico.valorTotal > 0 
                        ? (medicao.previsto / servico.valorTotal) * 100 
                        : 0;
                      
                      return (
                        <td
                          key={`p-${mIndex}`}
                          className="px-2 py-1 text-sm text-center bg-blue-50 font-semibold text-blue-800 cursor-pointer hover:bg-blue-100 transition border"
                          onClick={() => !editandoCelula && handleIniciarEdicao(originalIndex, mIndex, 'previsto', medicao.previsto)}
                        >
                          {editandoPrevisto ? (
                            <input
                              type="number"
                              value={valorTemp}
                              onChange={(e) => setValorTemp(e.target.value)}
                              onBlur={handleSalvarEdicao}
                              onKeyDown={handleKeyDown}
                              className="w-full px-1 py-1 text-center border-2 border-blue-500 rounded focus:outline-none"
                              autoFocus
                              step="0.01"
                              min="0"
                            />
                          ) : (
                            <span title={modoVisualizacao === 'real' 
                              ? `${percentualPrevisto.toFixed(2)}% - Clique para editar`
                              : `R$ ${medicao.previsto.toFixed(2)} - Clique para editar`
                            }>
                              {modoVisualizacao === 'real'
                                ? (medicao.previsto > 0 ? `R$ ${medicao.previsto.toFixed(2)}` : '')
                                : (percentualPrevisto > 0 ? `${percentualPrevisto.toFixed(2)}%` : '')
                              }
                            </span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className={`px-4 py-2 text-sm text-center font-bold text-purple-700 border ${bgColor}`} rowSpan={3}>
                      R$ {servico.valorTotal.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-center border ${bgColor}`} rowSpan={3}>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onEdit(originalIndex)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold transition transform hover:scale-105"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(originalIndex)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition transform hover:scale-105"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Linha REALIZADO */}
                  <tr
                    key={`${servico.id}-realizado`}
                    className={`hover:bg-green-50 transition ${bgColor}`}
                  >
                    <td className="px-2 py-1 text-xs font-bold bg-green-100 text-green-900 text-center border">
                      ✅ R
                    </td>
                    
                    {servico.medicoes.map((medicao, mIndex) => {
                      const editandoRealizado = editandoCelula?.servicoIndex === originalIndex && 
                                               editandoCelula?.medicaoIndex === mIndex && 
                                               editandoCelula?.field === 'realizado';
                      
                      // Calcular percentual do valor total do serviço
                      const percentualRealizado = servico.valorTotal > 0 
                        ? (medicao.realizado / servico.valorTotal) * 100 
                        : 0;
                      
                      return (
                        <td
                          key={`r-${mIndex}`}
                          className="px-2 py-1 text-sm text-center bg-green-50 font-semibold text-green-800 cursor-pointer hover:bg-green-100 transition border"
                          onClick={() => !editandoCelula && handleIniciarEdicao(originalIndex, mIndex, 'realizado', medicao.realizado)}
                        >
                          {editandoRealizado ? (
                            <input
                              type="number"
                              value={valorTemp}
                              onChange={(e) => setValorTemp(e.target.value)}
                              onBlur={handleSalvarEdicao}
                              onKeyDown={handleKeyDown}
                              className="w-full px-1 py-1 text-center border-2 border-green-500 rounded focus:outline-none"
                              autoFocus
                              step="0.01"
                              min="0"
                            />
                          ) : (
                            <span title={modoVisualizacao === 'real'
                              ? `${percentualRealizado.toFixed(2)}% - Clique para editar`
                              : `R$ ${medicao.realizado.toFixed(2)} - Clique para editar`
                            }>
                              {modoVisualizacao === 'real'
                                ? (medicao.realizado > 0 ? `R$ ${medicao.realizado.toFixed(2)}` : '')
                                : (percentualRealizado > 0 ? `${percentualRealizado.toFixed(2)}%` : '')
                              }
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linha PAGO */}
                  <tr
                    key={`${servico.id}-pago`}
                    className={`hover:bg-orange-50 transition ${bgColor}`}
                  >
                    <td className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-900 text-center border">
                      💰 $
                    </td>
                    
                    {servico.medicoes.map((medicao, mIndex) => {
                      const editandoPago = editandoCelula?.servicoIndex === originalIndex && 
                                          editandoCelula?.medicaoIndex === mIndex && 
                                          editandoCelula?.field === 'pago';
                      
                      // Calcular percentual do valor total do serviço
                      const percentualPago = servico.valorTotal > 0 
                        ? ((medicao.pago || 0) / servico.valorTotal) * 100 
                        : 0;
                      
                      return (
                        <td
                          key={`pg-${mIndex}`}
                          className="px-2 py-1 text-sm text-center bg-orange-50 font-semibold text-orange-800 cursor-pointer hover:bg-orange-100 transition border"
                          onClick={() => !editandoCelula && handleIniciarEdicao(originalIndex, mIndex, 'pago', medicao.pago || 0)}
                        >
                          {editandoPago ? (
                            <input
                              type="number"
                              value={valorTemp}
                              onChange={(e) => setValorTemp(e.target.value)}
                              onBlur={handleSalvarEdicao}
                              onKeyDown={handleKeyDown}
                              className="w-full px-1 py-1 text-center border-2 border-orange-500 rounded focus:outline-none"
                              autoFocus
                              step="0.01"
                              min="0"
                            />
                          ) : (
                            <span title={modoVisualizacao === 'real'
                              ? `${percentualPago.toFixed(2)}% - Clique para editar`
                              : `R$ ${(medicao.pago || 0).toFixed(2)} - Clique para editar`
                            }>
                              {modoVisualizacao === 'real'
                                ? ((medicao.pago || 0) > 0 ? `R$ ${(medicao.pago || 0).toFixed(2)}` : '')
                                : (percentualPago > 0 ? `${percentualPago.toFixed(2)}%` : '')
                              }
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
