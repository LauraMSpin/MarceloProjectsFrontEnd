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
  const [medicoes, setMedicoes] = useState<Medicao[]>(() => {
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    return Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
      pago: 0,
    }));
  });

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (editingServico) {
      setItem(editingServico.item);
      setServico(editingServico.servico);
      setMedicoes(editingServico.medicoes);
    } else {
      // Limpar quando não estiver editando
      setItem('');
      setServico('');
      const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
      setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
        mes: mesesGerados[i],
        previsto: 0,
        realizado: 0,
        pago: 0,
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
        pago: 0,
      };
    });
    setMedicoes(novasMedicoes);
  }, [numMeses, mesInicial, anoInicial]);

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
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
      pago: 0,
    })));
  };

  const handleMedicaoChange = (
    index: number,
    field: 'previsto' | 'realizado' | 'pago',
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
    const mesesGerados = gerarMesesSequenciais(mesInicial, anoInicial, numMeses);
    setMedicoes(Array.from({ length: numMeses }, (_, i) => ({
      mes: mesesGerados[i],
      previsto: 0,
      realizado: 0,
      pago: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
        </div>

        {/* Medições Mensais */}
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-purple-600 mb-3 sm:mb-4">
          Medições Mensais em R$
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
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-blue-700 mb-1">
                    📊 PREVISTO
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={medicao.previsto}
                    onChange={(e) =>
                      handleMedicaoChange(index, 'previsto', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:outline-none font-semibold text-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-green-700 mb-1">
                    ✅ REALIZADO
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={medicao.realizado}
                    onChange={(e) =>
                      handleMedicaoChange(index, 'realizado', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-green-300 bg-green-50 rounded focus:border-green-500 focus:outline-none font-semibold text-green-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-orange-700 mb-1">
                    💰 PAGO
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={medicao.pago}
                    onChange={(e) =>
                      handleMedicaoChange(index, 'pago', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-orange-300 bg-orange-50 rounded focus:border-orange-500 focus:outline-none font-semibold text-orange-800"
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
