'use client';

import { Servico, PagamentoMensal } from '../types';
import { calcularCurvaS } from '../utils/curvaS';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CurvaSChartProps {
  servicos: Servico[];
  numMeses?: number;
  modoVisualizacao: 'percentual' | 'real';
  pagamentosMensais?: PagamentoMensal[];
  mesInicial?: number;
  anoInicial?: number;
}

export default function CurvaSChart({ 
  servicos, 
  numMeses = 12, 
  modoVisualizacao, 
  pagamentosMensais = [],
  mesInicial = 1,
  anoInicial = new Date().getFullYear()
}: CurvaSChartProps) {
  if (servicos.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-12 rounded-xl shadow-lg text-center">
        <p className="text-xl sm:text-2xl text-gray-400 mb-2">📊 Sem dados para exibir</p>
        <p className="text-gray-500 text-sm sm:text-base">
          Adicione serviços para visualizar a Curva S
        </p>
      </div>
    );
  }

  const dadosOriginais = calcularCurvaS(servicos, numMeses, pagamentosMensais, mesInicial, anoInicial);
  
  // Calcular o mês de referência atual (quantos meses se passaram desde o início)
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1; // 1-12
  const anoAtual = agora.getFullYear();
  
  // Calcular quantos meses se passaram desde o início do contrato
  const mesesDesdeInicio = (anoAtual - anoInicial) * 12 + (mesAtual - mesInicial) + 1;
  const mesReferenciaAtual = Math.max(1, Math.min(mesesDesdeInicio, numMeses));
  
  // Encontrar o último mês com realizado preenchido (para quebrar a regra se houver dados futuros)
  let ultimoMesComRealizado = 0;
  dadosOriginais.forEach((dado, index) => {
    if (dado.realizado > 0) {
      ultimoMesComRealizado = index + 1;
    }
  });
  
  // O limite é o maior entre: mês de referência atual OU último mês com realizado
  const limiteExibicao = Math.max(mesReferenciaAtual, ultimoMesComRealizado);
  
  // Calcular valor total previsto para percentuais
  const valorTotalPrevisto = dadosOriginais.length > 0 
    ? dadosOriginais[dadosOriginais.length - 1].previstoAcumulado 
    : 0;

  // Transformar dados para modo percentual e aplicar limite de exibição para realizado/pago
  const dados = dadosOriginais.map((dado, index) => {
    const mesNumero = index + 1;
    const dentroDoLimite = mesNumero <= limiteExibicao;
    
    return {
      ...dado,
      // Realizado e pago são zerados após o limite
      realizado: dentroDoLimite ? dado.realizado : 0,
      pago: dentroDoLimite ? dado.pago : 0,
      realizadoAcumulado: dentroDoLimite ? dado.realizadoAcumulado : (index > 0 ? dadosOriginais[limiteExibicao - 1]?.realizadoAcumulado || 0 : 0),
      pagoAcumulado: dentroDoLimite ? dado.pagoAcumulado : (index > 0 ? dadosOriginais[limiteExibicao - 1]?.pagoAcumulado || 0 : 0),
      previstoPercentual: valorTotalPrevisto > 0 ? (dado.previsto / valorTotalPrevisto) * 100 : 0,
      realizadoPercentual: valorTotalPrevisto > 0 ? ((dentroDoLimite ? dado.realizado : 0) / valorTotalPrevisto) * 100 : 0,
      pagoPercentual: valorTotalPrevisto > 0 ? ((dentroDoLimite ? dado.pago : 0) / valorTotalPrevisto) * 100 : 0,
      previstoAcumuladoPercentual: valorTotalPrevisto > 0 ? (dado.previstoAcumulado / valorTotalPrevisto) * 100 : 0,
      realizadoAcumuladoPercentual: valorTotalPrevisto > 0 ? ((dentroDoLimite ? dado.realizadoAcumulado : (dadosOriginais[limiteExibicao - 1]?.realizadoAcumulado || 0)) / valorTotalPrevisto) * 100 : 0,
      pagoAcumuladoPercentual: valorTotalPrevisto > 0 ? ((dentroDoLimite ? dado.pagoAcumulado : (dadosOriginais[limiteExibicao - 1]?.pagoAcumulado || 0)) / valorTotalPrevisto) * 100 : 0,
      // Flag para indicar se está além do limite (para ocultar na linha do gráfico)
      aposLimite: !dentroDoLimite,
    };
  });

  // Para o gráfico, criar dados que param no limite (linha não continua após o mês de referência)
  const dadosGrafico = dados.map((dado, index) => {
    const mesNumero = index + 1;
    if (mesNumero > limiteExibicao) {
      return {
        ...dado,
        realizadoAcumulado: null,
        pagoAcumulado: null,
        realizadoAcumuladoPercentual: null,
        pagoAcumuladoPercentual: null,
      };
    }
    return dado;
  });

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarValorCurto = (valor: number) => {
    if (valor >= 1000000) {
      return `R$ ${(valor / 1000000).toFixed(1)}M`;
    } else if (valor >= 1000) {
      return `R$ ${(valor / 1000).toFixed(0)}k`;
    }
    return `R$ ${valor.toFixed(0)}`;
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  // Configurações baseadas no modo
  const dataKeyPrevisto = modoVisualizacao === 'percentual' ? 'previstoAcumuladoPercentual' : 'previstoAcumulado';
  const dataKeyRealizado = modoVisualizacao === 'percentual' ? 'realizadoAcumuladoPercentual' : 'realizadoAcumulado';
  const dataKeyPago = modoVisualizacao === 'percentual' ? 'pagoAcumuladoPercentual' : 'pagoAcumulado';
  
  const formatador = modoVisualizacao === 'percentual' ? formatarPercentual : formatarValor;

  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        Curva S - Acumulado {modoVisualizacao === 'percentual' ? '(%)' : '(R$)'}
      </h2>
      
      <ResponsiveContainer width="100%" height={300} className="sm:hidden">
        <LineChart
          data={dadosGrafico}
          margin={{
            top: 5,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="mes" 
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => modoVisualizacao === 'percentual' ? `${value.toFixed(0)}%` : formatarValorCurto(value)}
            width={50}
            domain={modoVisualizacao === 'percentual' ? [0, 100] : undefined}
          />
          <Tooltip 
            formatter={(value: number) => formatador(value)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12px',
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey={dataKeyPrevisto}
            stroke="#3b82f6"
            strokeWidth={2}
            name="📊 Previsto"
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey={dataKeyRealizado}
            stroke="#10b981"
            strokeWidth={2}
            name="✅ Realizado"
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey={dataKeyPago}
            stroke="#f97316"
            strokeWidth={2}
            name="💰 Pago"
            dot={{ r: 3, fill: '#f97316' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={500} className="hidden sm:block">
        <LineChart
          data={dadosGrafico}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="mes" 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => modoVisualizacao === 'percentual' ? `${value.toFixed(0)}%` : `R$ ${(value / 1000).toFixed(0)}k`}
            domain={modoVisualizacao === 'percentual' ? [0, 100] : undefined}
          />
          <Tooltip 
            formatter={(value: number) => formatador(value)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey={dataKeyPrevisto}
            stroke="#3b82f6"
            strokeWidth={3}
            name="📊 Previsto Acumulado"
            dot={{ r: 5, fill: '#3b82f6' }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey={dataKeyRealizado}
            stroke="#10b981"
            strokeWidth={3}
            name="✅ Realizado Acumulado"
            dot={{ r: 5, fill: '#10b981' }}
            activeDot={{ r: 8 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey={dataKeyPago}
            stroke="#f97316"
            strokeWidth={3}
            name="💰 Pago Acumulado"
            dot={{ r: 5, fill: '#f97316' }}
            activeDot={{ r: 8 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Tabela de dados */}
      <div className="mt-6 sm:mt-8 overflow-x-auto">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Dados Mensais</h3>
        <table className="min-w-full border-collapse border border-gray-300 text-xs sm:text-sm">
          <thead className="bg-gradient-to-r from-blue-500 via-green-500 to-orange-500 text-white">
            <tr>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-left">Mês</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-blue-600">📊 <span className="hidden sm:inline">Previsto</span> Mensal</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-green-600">✅ <span className="hidden sm:inline">Realizado</span> Mensal</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-orange-600">💰 <span className="hidden sm:inline">Pago</span> Mensal</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-blue-700">📊 <span className="hidden sm:inline">Previsto</span> Acum.</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-green-700">✅ <span className="hidden sm:inline">Realizado</span> Acum.</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right bg-orange-700">💰 <span className="hidden sm:inline">Pago</span> Acum.</th>
              <th className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right">% Exec.</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((dado, index) => {
              const percentualExecucao = dado.previstoAcumulado > 0 
                ? (dado.realizadoAcumulado / dado.previstoAcumulado) * 100 
                : 0;
              
              return (
                <tr 
                  key={index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 font-semibold">
                    {dado.mes}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right text-blue-600">
                    {modoVisualizacao === 'percentual' ? (
                      <>
                        <span className="hidden sm:inline">{formatarPercentual(dado.previstoPercentual)}</span>
                        <span className="sm:hidden">{dado.previstoPercentual.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{formatarValor(dado.previsto)}</span>
                        <span className="sm:hidden">{formatarValorCurto(dado.previsto)}</span>
                      </>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right text-green-600">
                    {modoVisualizacao === 'percentual' ? (
                      <>
                        <span className="hidden sm:inline">{formatarPercentual(dado.realizadoPercentual)}</span>
                        <span className="sm:hidden">{dado.realizadoPercentual.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{formatarValor(dado.realizado)}</span>
                        <span className="sm:hidden">{formatarValorCurto(dado.realizado)}</span>
                      </>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right font-bold text-blue-700">
                    {modoVisualizacao === 'percentual' ? (
                      <>
                        <span className="hidden sm:inline">{formatarPercentual(dado.previstoAcumuladoPercentual)}</span>
                        <span className="sm:hidden">{dado.previstoAcumuladoPercentual.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{formatarValor(dado.previstoAcumulado)}</span>
                        <span className="sm:hidden">{formatarValorCurto(dado.previstoAcumulado)}</span>
                      </>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right font-bold text-green-700">
                    {modoVisualizacao === 'percentual' ? (
                      <>
                        <span className="hidden sm:inline">{formatarPercentual(dado.realizadoAcumuladoPercentual)}</span>
                        <span className="sm:hidden">{dado.realizadoAcumuladoPercentual.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{formatarValor(dado.realizadoAcumulado)}</span>
                        <span className="sm:hidden">{formatarValorCurto(dado.realizadoAcumulado)}</span>
                      </>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-right font-bold">
                    <span className={percentualExecucao >= 100 ? 'text-green-600' : percentualExecucao >= 75 ? 'text-yellow-600' : 'text-red-600'}>
                      {percentualExecucao.toFixed(1)}%
                    </span>
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
