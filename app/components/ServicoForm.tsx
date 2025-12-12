'use client';

import { useState, useEffect } from 'react';
import { ServicoFormData, Medicao, Servico } from '../types';
import { gerarMesesSequenciais } from '../utils/datas';

interface ServicoFormProps {
  onAddServico: (servico: ServicoFormData) => void;
  editingServico?: Servico | null;
  numMeses?: number;
  mesInicial?: number;
  anoInicial?: number;
  onCancelarEdicao?: () => void;
}

export default function ServicoForm({ 
  onAddServico, 
  editingServico, 
  numMeses = 12,
  mesInicial = new Date().getMonth() + 1,
  anoInicial = new Date().getFullYear(),
  onCancelarEdicao
}: ServicoFormProps) {
  const [item, setItem] = useState('');
  const [servico, setServico] = useState('');
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [percentuais, setPercentuais] = useState<number[]>(() => Array(numMeses).fill(0));
  const [medicoes, setMedicoes] = useState<Medicao[]>(() => {
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    return Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
    }));
  });

  // Calcular soma dos percentuais
  const somaPercentuais = percentuais.reduce((sum, p) => sum + p, 0);

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (editingServico) {
      setItem(editingServico.item);
      setServico(editingServico.servico);
      setValorTotal(editingServico.valorTotal);
      setMedicoes(editingServico.medicoes);
      // Calcular percentuais a partir das medições existentes
      if (editingServico.valorTotal > 0) {
        setPercentuais(editingServico.medicoes.map(m => 
          (m.previsto / editingServico.valorTotal) * 100
        ));
      } else {
        setPercentuais(editingServico.medicoes.map(() => 0));
      }
    } else {
      // Limpar quando não estiver editando
      setItem('');
      setServico('');
      setValorTotal(0);
      setPercentuais(Array(numMeses).fill(0));
      const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
      setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
        mes: mesesGerados[i],
        previsto: 0,
        realizado: 0,
      })));
    }
  }, [editingServico]);

  // Atualizar medições quando numMeses, mesInicial ou anoInicial mudarem
  useEffect(() => {
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    const novasMedicoes = Array.from({ length: numMeses }, (_, i) => {
      // Manter valores existentes se possível (comparando pelo mês)
      const medicaoExistente = medicoes.find(m => m.mes === mesesGerados[i]);
      if (medicaoExistente) {
        return medicaoExistente;
      }
      // Caso contrário, criar nova medição
      return {
        mes: mesesGerados[i],
        previsto: 0,
        realizado: 0,
      };
    });
    setMedicoes(novasMedicoes);
    // Ajustar array de percentuais
    setPercentuais(prev => {
      const novos = Array(numMeses).fill(0);
      prev.forEach((p, i) => {
        if (i < numMeses) novos[i] = p;
      });
      return novos;
    });
  }, [numMeses, mesInicial, anoInicial]);

  // Atualizar valores previstos quando valor total ou percentuais mudarem
  useEffect(() => {
    if (valorTotal > 0) {
      const novasMedicoes = medicoes.map((m, i) => ({
        ...m,
        previsto: (valorTotal * (percentuais[i] || 0)) / 100,
      }));
      setMedicoes(novasMedicoes);
    }
  }, [valorTotal, percentuais]);

  const handlePercentualChange = (index: number, value: string) => {
    const novoPercentual = parseFloat(value) || 0;
    const novosPercentuais = [...percentuais];
    novosPercentuais[index] = novoPercentual;
    setPercentuais(novosPercentuais);
  };

  const distribuirIgualmente = () => {
    const percentualPorMes = 100 / numMeses;
    setPercentuais(Array(numMeses).fill(percentualPorMes));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAddServico({
      item,
      servico,
      medicoes,
    });

    // Limpar formulário
    setItem('');
    setServico('');
    setValorTotal(0);
    setPercentuais(Array(numMeses).fill(0));
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
    })));
  };

  const handleMedicaoChange = (
    index: number,
    field: 'previsto' | 'realizado',
    value: string
  ) => {
    const newMedicoes = [...medicoes];
    newMedicoes[index] = {
      ...newMedicoes[index],
      [field]: parseFloat(value) || 0,
    };
    setMedicoes(newMedicoes);
  };

  const limparFormulario = () => {
    setItem('');
    setServico('');
    setValorTotal(0);
    setPercentuais(Array(numMeses).fill(0));
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
    })));
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700 mb-4 sm:mb-6">
        Cadastrar Novo Serviço
      </h2>
      
      {editingServico && (
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 sm:p-4 mb-4">
          <p className="text-yellow-800 font-semibold text-sm sm:text-base">
            ✏️ Editando serviço: {editingServico.item} - {editingServico.servico}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              ITEM
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition text-sm sm:text-base"
              placeholder="Ex: 01.01.01"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              SERVIÇO
            </label>
            <input
              type="text"
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition text-sm sm:text-base"
              placeholder="Descrição do serviço"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              💰 VALOR TOTAL (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorTotal || ''}
              onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 sm:px-4 py-2 border-2 border-purple-300 bg-purple-50 rounded-lg focus:border-purple-500 focus:outline-none transition text-sm sm:text-base font-bold text-purple-700"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Distribuição por Percentual */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-purple-600">
              📊 Distribuição Prevista por Mês (%)
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${Math.abs(somaPercentuais - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                Total: {somaPercentuais.toFixed(2)}%
                {Math.abs(somaPercentuais - 100) < 0.01 ? ' ✅' : ' ⚠️'}
              </span>
              <button
                type="button"
                onClick={distribuirIgualmente}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-semibold transition"
              >
                Distribuir Igual
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {medicoes.map((medicao, index) => (
              <div key={index} className="bg-white p-2 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition">
                <label className="block text-[10px] sm:text-xs font-bold text-blue-600 mb-1 text-center truncate">
                  {medicao.mes}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentuais[index] || ''}
                  onChange={(e) => handlePercentualChange(index, e.target.value)}
                  className="w-full px-1 py-1 text-xs sm:text-sm border-2 border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:outline-none font-semibold text-blue-800 text-center"
                  placeholder="0"
                />
                <div className="text-[9px] sm:text-[10px] text-center text-gray-500 mt-1 truncate">
                  R$ {((valorTotal * (percentuais[index] || 0)) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medições Mensais - Realizado e Pago */}
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-purple-600 mb-3 sm:mb-4">
          Medições Mensais - Realizado (R$)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          {medicoes.map((medicao, index) => (
            <div
              key={index}
              className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition"
            >
              <label className="block text-xs sm:text-sm font-bold text-purple-600 mb-2 sm:mb-3 text-center truncate">
                {medicao.mes}
              </label>
              <div className="text-[10px] sm:text-xs text-center text-blue-600 font-semibold mb-2">
                📊 Previsto: R$ {medicao.previsto.toFixed(2)}
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-green-700 mb-1">
                    ✅ REALIZADO
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={medicao.realizado || ''}
                    onChange={(e) =>
                      handleMedicaoChange(index, 'realizado', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-green-300 bg-green-50 rounded focus:border-green-500 focus:outline-none font-semibold text-green-800"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition shadow-lg text-sm sm:text-base"
          >
            {editingServico ? '💾 Salvar Alterações' : '✅ Adicionar Serviço'}
          </button>
          
          {editingServico ? (
            <button
              type="button"
              onClick={onCancelarEdicao}
              className="bg-red-500 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-red-600 transform hover:scale-105 transition shadow-lg text-sm sm:text-base"
            >
              ❌ Cancelar Edição
            </button>
          ) : (
            <button
              type="button"
              onClick={limparFormulario}
              className="bg-gray-500 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-600 transform hover:scale-105 transition shadow-lg text-sm sm:text-base"
            >
              🔄 Limpar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
