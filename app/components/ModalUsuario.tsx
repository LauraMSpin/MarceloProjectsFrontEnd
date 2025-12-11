'use client';

import { useState } from 'react';
import { Usuario } from '../types';

interface ModalUsuarioProps {
  onCriar: (nome: string, email: string, empresa: string) => void;
  onFechar: () => void;
  usuarios: Usuario[];
  onSelecionarUsuario: (usuarioId: string) => void;
}

export default function ModalUsuario({ onCriar, onFechar, usuarios, onSelecionarUsuario }: ModalUsuarioProps) {
  const [modo, setModo] = useState<'selecionar' | 'criar'>('selecionar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      alert('Por favor, preencha nome e email');
      return;
    }
    onCriar(nome, email, empresa);
  };

  const handleSelecionar = (usuarioId: string) => {
    onSelecionarUsuario(usuarioId);
    onFechar();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 rounded-t-xl">
          <h2 className="text-xl sm:text-2xl font-bold">👤 Gerenciar Usuários</h2>
        </div>

        <div className="p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setModo('selecionar')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold transition text-xs sm:text-base ${
                modo === 'selecionar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Selecionar
            </button>
            <button
              onClick={() => setModo('criar')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold transition text-xs sm:text-base ${
                modo === 'criar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Novo Usuário
            </button>
          </div>

          {/* Conteúdo */}
          {modo === 'selecionar' ? (
            <div>
              {usuarios.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      onClick={() => handleSelecionar(usuario.id)}
                      className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">{usuario.nome}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{usuario.email}</p>
                          {usuario.empresa && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">🏢 {usuario.empresa}</p>
                          )}
                        </div>
                        <div className="text-indigo-600 text-xl sm:text-2xl ml-2">→</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4">Nenhum usuário cadastrado</p>
                  <button
                    onClick={() => setModo('criar')}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm sm:text-base"
                  >
                    ➕ Criar Primeiro Usuário
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm sm:text-base"
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="flex gap-4 mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition text-sm sm:text-base"
                >
                  ✅ Criar e Usar
                </button>
              </div>
            </form>
          )}

          <button
            type="button"
            onClick={onFechar}
            className="w-full mt-3 sm:mt-4 bg-gray-500 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
