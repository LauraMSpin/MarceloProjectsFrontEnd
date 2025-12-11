'use client';

import { Servico } from '../types';

interface TotaisProps {
  servicos: Servico[];
}

export default function Totais({ servicos }: TotaisProps) {
  if (servicos.length === 0) {
    return null;
  }

  const totalServicos = servicos.length;
  
  const valorTotalGeral = servicos.reduce(
    (sum, servico) => sum + servico.valorTotal,
    0
  );

  let totalPrevisto = 0;
  let totalRealizado = 0;

  servicos.forEach((servico) => {
    servico.medicoes.forEach((medicao) => {
      totalPrevisto += medicao.previsto;
      totalRealizado += medicao.realizado;
    });
  });

  const percentualRealizado =
    totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;

  return (
    <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transform hover:scale-105 transition">
        <h4 className="text-xs sm:text-sm font-semibold opacity-90 mb-1 sm:mb-2">
          Total de Serviços
        </h4>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{totalServicos}</div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transform hover:scale-105 transition">
        <h4 className="text-xs sm:text-sm font-semibold opacity-90 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
          <span>📊</span> <span className="hidden sm:inline">Total</span> Previsto
        </h4>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
          R$ {totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transform hover:scale-105 transition">
        <h4 className="text-xs sm:text-sm font-semibold opacity-90 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
          <span>✅</span> <span className="hidden sm:inline">Total</span> Realizado
        </h4>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
          R$ {totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] sm:text-xs mt-1 sm:mt-2 opacity-90">
          {percentualRealizado.toFixed(1)}% do previsto
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transform hover:scale-105 transition">
        <h4 className="text-xs sm:text-sm font-semibold opacity-90 mb-1 sm:mb-2">Valor Total</h4>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
          R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
