'use client';

import { useState } from 'react';
import { Servico } from '../types';

interface GraficoGanttProps {
  servicos: Servico[];
  numMeses: number;
  nomeContrato?: string;
}

export default function GraficoGantt({ servicos, numMeses, nomeContrato = '' }: GraficoGanttProps) {
  const [medicaoReferencia, setMedicaoReferencia] = useState<number>(1);

  if (servicos.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-12 rounded-xl shadow-lg text-center">
        <p className="text-xl sm:text-2xl text-gray-400 mb-2">📊 Sem dados para exibir</p>
        <p className="text-gray-500 text-sm sm:text-base">
          Adicione serviços para visualizar o Gráfico de Gantt
        </p>
      </div>
    );
  }

  // Ordenar serviços por item (ordem numérica/alfabética natural)
  const servicosOrdenados = [...servicos].sort((a, b) => {
    // Tenta extrair números do item para ordenação numérica
    const numA = parseFloat(a.item.replace(/[^\d.]/g, '')) || 0;
    const numB = parseFloat(b.item.replace(/[^\d.]/g, '')) || 0;
    
    if (numA !== numB) {
      return numA - numB;
    }
    // Se os números forem iguais, ordena alfabeticamente
    return a.item.localeCompare(b.item, 'pt-BR', { numeric: true });
  });

  // Calcular dados de cada serviço
  const dadosServicos = servicosOrdenados.map(servico => {
    const valorTotal = servico.valorTotal;
    
    // Encontrar primeiro e último mês com previsto > 0
    let primeiroMesPrevisto = -1;
    let ultimoMesPrevisto = -1;
    let primeiroMesRealizado = -1;
    let ultimoMesRealizado = -1;
    
    let totalPrevisto = 0;
    let totalRealizado = 0;
    
    // Calcular previsto acumulado até a medição de referência
    let previstoAteMedicao = 0;
    
    servico.medicoes.forEach((medicao, index) => {
      if (medicao.previsto > 0) {
        if (primeiroMesPrevisto === -1) primeiroMesPrevisto = index;
        ultimoMesPrevisto = index;
        totalPrevisto += medicao.previsto;
      }
      if (medicao.realizado > 0) {
        if (primeiroMesRealizado === -1) primeiroMesRealizado = index;
        ultimoMesRealizado = index;
        totalRealizado += medicao.realizado;
      }
      // Acumular previsto até a medição de referência
      if (index < medicaoReferencia) {
        previstoAteMedicao += medicao.previsto;
      }
    });
    
    const percentualPrevisto = valorTotal > 0 ? (totalPrevisto / valorTotal) * 100 : 0;
    const percentualRealizado = valorTotal > 0 ? (totalRealizado / valorTotal) * 100 : 0;
    const percentualPrevistoAteMedicao = valorTotal > 0 ? (previstoAteMedicao / valorTotal) * 100 : 0;
    
    return {
      id: servico.id,
      item: servico.item,
      servico: servico.servico,
      valorTotal,
      primeiroMesPrevisto,
      ultimoMesPrevisto,
      primeiroMesRealizado,
      ultimoMesRealizado,
      totalPrevisto,
      totalRealizado,
      percentualPrevisto,
      percentualRealizado,
      previstoAteMedicao,
      percentualPrevistoAteMedicao,
    };
  });

  // Gerar nomes dos meses
  const nomesMeses = Array.from({ length: numMeses }, (_, i) => `M${i + 1}`);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        📊 Gráfico de Gantt {nomeContrato ? `- ${nomeContrato}` : ''}
      </h3>

      {/* Seletor de Medição de Referência */}
      <div className="flex flex-wrap gap-4 justify-center items-center mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <label className="font-semibold text-gray-700 text-sm">
          📅 Medição de Referência:
        </label>
        <select
          value={medicaoReferencia}
          onChange={(e) => setMedicaoReferencia(parseInt(e.target.value))}
          className="px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm bg-white"
        >
          {Array.from({ length: numMeses }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Medição {i + 1}
            </option>
          ))}
        </select>
        <span className="text-xs text-purple-600">
          (A linha vermelha indica o previsto até esta medição)
        </span>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
          <span className="text-sm text-gray-700">Período Previsto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Realizado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-600 rounded"></div>
          <span className="text-sm text-gray-700">Meta até Medição {medicaoReferencia}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Cabeçalho com meses */}
          <div className="flex border-b-2 border-gray-300 pb-2 mb-2">
            <div className="w-48 flex-shrink-0 font-semibold text-gray-700 text-sm px-2">
              Serviço
            </div>
            <div className="w-16 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              % Prev.
            </div>
            <div className="w-16 flex-shrink-0 font-semibold text-red-600 text-sm text-center" title={`Meta até Medição ${medicaoReferencia}`}>
              % Meta
            </div>
            <div className="w-16 flex-shrink-0 font-semibold text-gray-700 text-sm text-center">
              % Real.
            </div>
            <div className="flex-1 flex">
              {nomesMeses.map((mes, index) => (
                <div 
                  key={index} 
                  className={`flex-1 text-center text-xs font-semibold min-w-[30px] ${
                    index === medicaoReferencia - 1 ? 'text-red-600 font-bold' : 'text-gray-600'
                  }`}
                >
                  {mes}
                </div>
              ))}
            </div>
          </div>

          {/* Serviços */}
          {dadosServicos.map((dado, index) => {
            const bgColor = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
            
            // Calcular quantos meses tem o período previsto
            const mesesPrevisto = dado.primeiroMesPrevisto !== -1 
              ? dado.ultimoMesPrevisto - dado.primeiroMesPrevisto + 1 
              : 0;
            
            // Calcular quantos "meses" a barra de realizado deve ocupar baseado no percentual
            const mesesRealizadoFracao = mesesPrevisto * (dado.percentualRealizado / 100);
            
            // Calcular posição da linha de meta (percentual previsto até a medição de referência)
            const mesesMetaFracao = mesesPrevisto * (dado.percentualPrevistoAteMedicao / 100);
            
            return (
              <div key={dado.id} className={`flex items-center py-2 ${bgColor} hover:bg-gray-100 transition border-b border-gray-200`}>
                {/* Nome do serviço */}
                <div className="w-48 flex-shrink-0 px-2">
                  <div className="text-xs font-bold text-gray-800">{dado.item}</div>
                  <div className="text-xs text-gray-600 truncate" title={dado.servico}>
                    {dado.servico.length > 25 ? dado.servico.substring(0, 25) + '...' : dado.servico}
                  </div>
                </div>
                
                {/* Percentual Previsto Total */}
                <div className="w-16 flex-shrink-0 text-center">
                  <span className={`text-xs font-bold ${dado.percentualPrevisto >= 100 ? 'text-blue-600' : 'text-blue-500'}`}>
                    {dado.percentualPrevisto.toFixed(1)}%
                  </span>
                </div>
                
                {/* Percentual Meta (Previsto até a medição de referência) */}
                <div className="w-16 flex-shrink-0 text-center">
                  <span className="text-xs font-bold text-red-600">
                    {dado.percentualPrevistoAteMedicao.toFixed(1)}%
                  </span>
                </div>
                
                {/* Percentual Realizado */}
                <div className="w-16 flex-shrink-0 text-center">
                  <span className={`text-xs font-bold ${
                    dado.percentualRealizado >= dado.percentualPrevistoAteMedicao 
                      ? 'text-green-600' 
                      : 'text-orange-500'
                  }`}>
                    {dado.percentualRealizado.toFixed(1)}%
                  </span>
                </div>
                
                {/* Barras de Gantt */}
                <div className="flex-1 flex relative h-8">
                  {/* Grid de meses */}
                  {nomesMeses.map((_, mesIndex) => {
                    // Verificar se este mês está no período previsto
                    const noPeríodoPrevisto = dado.primeiroMesPrevisto !== -1 && 
                      mesIndex >= dado.primeiroMesPrevisto && 
                      mesIndex <= dado.ultimoMesPrevisto;
                    
                    // Calcular se a barra de realizado deve aparecer neste mês
                    let preenchimentoRealizado = 0;
                    if (noPeríodoPrevisto && dado.percentualRealizado > 0) {
                      const posicaoNoIntervalo = mesIndex - dado.primeiroMesPrevisto;
                      
                      if (posicaoNoIntervalo < Math.floor(mesesRealizadoFracao)) {
                        preenchimentoRealizado = 100;
                      } else if (posicaoNoIntervalo < mesesRealizadoFracao) {
                        preenchimentoRealizado = (mesesRealizadoFracao - posicaoNoIntervalo) * 100;
                      }
                    }
                    
                    // Calcular a posição da linha de meta neste mês
                    let posicaoLinhaMeta: number | null = null;
                    if (noPeríodoPrevisto && dado.percentualPrevistoAteMedicao > 0) {
                      const posicaoNoIntervalo = mesIndex - dado.primeiroMesPrevisto;
                      
                      // A linha deve aparecer no mês onde termina a meta
                      if (posicaoNoIntervalo < mesesMetaFracao && posicaoNoIntervalo + 1 >= mesesMetaFracao) {
                        // Este é o mês onde a linha de meta deve aparecer
                        posicaoLinhaMeta = (mesesMetaFracao - posicaoNoIntervalo) * 100;
                      }
                    }
                    
                    return (
                      <div 
                        key={mesIndex} 
                        className={`flex-1 border-l min-w-[30px] relative ${
                          mesIndex === medicaoReferencia - 1 ? 'border-l-2 border-red-400' : 'border-gray-200'
                        }`}
                      >
                        {/* Barra de Previsto (fundo azul claro) */}
                        {noPeríodoPrevisto && (
                          <div 
                            className="absolute top-1 left-0 right-0 h-6 bg-blue-200 border border-blue-300"
                            style={{ margin: '0 1px' }}
                          />
                        )}
                        
                        {/* Barra de Realizado (preenchimento verde proporcional) */}
                        {preenchimentoRealizado > 0 && (
                          <div 
                            className={`absolute top-1 left-0 h-6 ${
                              dado.percentualRealizado >= dado.percentualPrevistoAteMedicao 
                                ? 'bg-green-500' 
                                : 'bg-orange-400'
                            }`}
                            style={{ 
                              margin: '0 1px',
                              width: `calc(${preenchimentoRealizado}% - 2px)`,
                            }}
                          />
                        )}
                        
                        {/* Linha de Meta (vermelha) */}
                        {posicaoLinhaMeta !== null && (
                          <div 
                            className="absolute top-0 h-8 w-1 bg-red-600 z-10"
                            style={{ 
                              left: `calc(${posicaoLinhaMeta}% - 2px)`,
                            }}
                            title={`Meta: ${dado.percentualPrevistoAteMedicao.toFixed(1)}%`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Resumo Total */}
          <div className="flex items-center py-3 bg-gray-200 font-bold border-t-2 border-gray-400 mt-2">
            <div className="w-48 flex-shrink-0 px-2 text-sm text-gray-800">
              TOTAL GERAL
            </div>
            <div className="w-16 flex-shrink-0 text-center">
              <span className="text-sm text-blue-700">
                {(() => {
                  const totalPrev = dadosServicos.reduce((sum, d) => sum + d.totalPrevisto, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalPrev / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </span>
            </div>
            <div className="w-16 flex-shrink-0 text-center">
              <span className="text-sm text-red-600">
                {(() => {
                  const totalMeta = dadosServicos.reduce((sum, d) => sum + d.previstoAteMedicao, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalMeta / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </span>
            </div>
            <div className="w-16 flex-shrink-0 text-center">
              <span className={`text-sm ${(() => {
                const totalReal = dadosServicos.reduce((sum, d) => sum + d.totalRealizado, 0);
                const totalMeta = dadosServicos.reduce((sum, d) => sum + d.previstoAteMedicao, 0);
                return totalReal >= totalMeta ? 'text-green-700' : 'text-orange-600';
              })()}`}>
                {(() => {
                  const totalReal = dadosServicos.reduce((sum, d) => sum + d.totalRealizado, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalReal / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </span>
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
      </div>

      {/* Tabela de valores */}
      <div className="mt-6 overflow-x-auto">
        <h4 className="text-md font-bold text-gray-700 mb-3">📋 Detalhamento por Serviço</h4>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Item</th>
              <th className="border px-3 py-2 text-left">Serviço</th>
              <th className="border px-3 py-2 text-right">Valor Total</th>
              <th className="border px-3 py-2 text-right">Previsto</th>
              <th className="border px-3 py-2 text-center">% Prev.</th>
              <th className="border px-3 py-2 text-right text-red-600">Meta M{medicaoReferencia}</th>
              <th className="border px-3 py-2 text-center text-red-600">% Meta</th>
              <th className="border px-3 py-2 text-right">Realizado</th>
              <th className="border px-3 py-2 text-center">% Real.</th>
              <th className="border px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {dadosServicos.map((dado, index) => {
              const status = dado.percentualRealizado >= dado.percentualPrevistoAteMedicao 
                ? { texto: 'Em dia', cor: 'text-green-600 bg-green-50' }
                : dado.percentualRealizado > 0 
                  ? { texto: 'Atrasado', cor: 'text-orange-600 bg-orange-50' }
                  : dado.percentualPrevistoAteMedicao > 0
                    ? { texto: 'Atrasado', cor: 'text-orange-600 bg-orange-50' }
                    : { texto: 'Não iniciado', cor: 'text-gray-500 bg-gray-50' };
              
              return (
                <tr key={dado.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2 font-semibold">{dado.item}</td>
                  <td className="border px-3 py-2">{dado.servico}</td>
                  <td className="border px-3 py-2 text-right">
                    R$ {dado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border px-3 py-2 text-right text-blue-600">
                    R$ {dado.totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border px-3 py-2 text-center font-bold text-blue-600">
                    {dado.percentualPrevisto.toFixed(1)}%
                  </td>
                  <td className="border px-3 py-2 text-right text-red-600">
                    R$ {dado.previstoAteMedicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border px-3 py-2 text-center font-bold text-red-600">
                    {dado.percentualPrevistoAteMedicao.toFixed(1)}%
                  </td>
                  <td className="border px-3 py-2 text-right text-green-600">
                    R$ {dado.totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`border px-3 py-2 text-center font-bold ${
                    dado.percentualRealizado >= dado.percentualPrevistoAteMedicao 
                      ? 'text-green-600' 
                      : 'text-orange-500'
                  }`}>
                    {dado.percentualRealizado.toFixed(1)}%
                  </td>
                  <td className={`border px-3 py-2 text-center text-xs font-semibold ${status.cor}`}>
                    {status.texto}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td className="border px-3 py-2" colSpan={2}>TOTAL</td>
              <td className="border px-3 py-2 text-right">
                R$ {dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="border px-3 py-2 text-right text-blue-700">
                R$ {dadosServicos.reduce((sum, d) => sum + d.totalPrevisto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="border px-3 py-2 text-center text-blue-700">
                {(() => {
                  const totalPrev = dadosServicos.reduce((sum, d) => sum + d.totalPrevisto, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalPrev / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </td>
              <td className="border px-3 py-2 text-right text-red-600">
                R$ {dadosServicos.reduce((sum, d) => sum + d.previstoAteMedicao, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="border px-3 py-2 text-center text-red-600">
                {(() => {
                  const totalMeta = dadosServicos.reduce((sum, d) => sum + d.previstoAteMedicao, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalMeta / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </td>
              <td className="border px-3 py-2 text-right text-green-700">
                R$ {dadosServicos.reduce((sum, d) => sum + d.totalRealizado, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className={`border px-3 py-2 text-center ${(() => {
                const totalReal = dadosServicos.reduce((sum, d) => sum + d.totalRealizado, 0);
                const totalMeta = dadosServicos.reduce((sum, d) => sum + d.previstoAteMedicao, 0);
                return totalReal >= totalMeta ? 'text-green-700' : 'text-orange-600';
              })()}`}>
                {(() => {
                  const totalReal = dadosServicos.reduce((sum, d) => sum + d.totalRealizado, 0);
                  const totalValor = dadosServicos.reduce((sum, d) => sum + d.valorTotal, 0);
                  return totalValor > 0 ? ((totalReal / totalValor) * 100).toFixed(1) : '0.0';
                })()}%
              </td>
              <td className="border px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
