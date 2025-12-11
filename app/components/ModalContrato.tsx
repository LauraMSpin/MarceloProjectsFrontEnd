'use client';

import { useState, useEffect } from 'react';
import { Contrato } from '../types';

interface ModalContratoProps {
  onCriar: (nome: string, descricao: string, numeroMeses: number, mesInicial: number, anoInicial: number) => void;
  onFechar: () => void;
  contratoEditando?: Contrato | null;
}

export default function ModalContrato({ onCriar, onFechar, contratoEditando }: ModalContratoProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroMeses, setNumeroMeses] = useState(12);
  const [mesInicial, setMesInicial] = useState(new Date().getMonth() + 1);
  const [anoInicial, setAnoInicial] = useState(new Date().getFullYear());

  useEffect(() => {
    if (contratoEditando) {
      setNome(contratoEditando.nome);
      setDescricao(contratoEditando.descricao);
      setNumeroMeses(contratoEditando.numeroMeses);
      setMesInicial(contratoEditando.mesInicial);
      setAnoInicial(contratoEditando.anoInicial);
    }
  }, [contratoEditando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Por favor, informe o nome do contrato');
      return;
    }
    onCriar(nome, descricao, numeroMeses, mesInicial, anoInicial);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6 rounded-t-xl">
          <h2 className="text-xl sm:text-2xl font-bold">
            {contratoEditando ? '✏️ Editar Contrato' : '📋 Novo Contrato'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Nome do Contrato *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                placeholder="Ex: Obra Centro Comercial"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                placeholder="Descrição opcional do contrato..."
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Mês Inicial
                </label>
                <select
                  value={mesInicial}
                  onChange={(e) => setMesInicial(parseInt(e.target.value))}
                  className="w-full px-2 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-xs sm:text-base"
                >
                  <option value={1}>Jan</option>
                  <option value={2}>Fev</option>
                  <option value={3}>Mar</option>
                  <option value={4}>Abr</option>
                  <option value={5}>Mai</option>
                  <option value={6}>Jun</option>
                  <option value={7}>Jul</option>
                  <option value={8}>Ago</option>
                  <option value={9}>Set</option>
                  <option value={10}>Out</option>
                  <option value={11}>Nov</option>
                  <option value={12}>Dez</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={anoInicial}
                  onChange={(e) => setAnoInicial(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-2 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-xs sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Nº Meses
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={numeroMeses}
                  onChange={(e) => setNumeroMeses(parseInt(e.target.value) || 12)}
                  className="w-full px-2 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-xs sm:text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition text-sm sm:text-base"
            >
              {contratoEditando ? '💾 Salvar Alterações' : '✅ Criar Contrato'}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="bg-gray-500 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
            >
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
