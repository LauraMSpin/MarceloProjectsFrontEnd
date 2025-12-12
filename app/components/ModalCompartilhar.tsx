'use client';

import { useState, useEffect } from 'react';
import { Usuario, ContratoCompartilhado, Contrato } from '../types';
import { contratosApi, usuariosApi } from '../services/api';

interface ModalCompartilharProps {
  contrato: Contrato;
  usuarioLogadoId: string;
  onFechar: () => void;
  onAtualizar: () => void;
}

export default function ModalCompartilhar({ contrato, usuarioLogadoId, onFechar, onAtualizar }: ModalCompartilharProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [compartilhamentos, setCompartilhamentos] = useState<ContratoCompartilhado[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>('');
  const [podeEditar, setPodeEditar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar usuários e compartilhamentos
  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const [usuariosData, compartilhamentosData] = await Promise.all([
          usuariosApi.listar(),
          contratosApi.listarCompartilhamentos(contrato.id),
        ]);
        setUsuarios(usuariosData);
        setCompartilhamentos(compartilhamentosData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [contrato.id]);

  // Usuários disponíveis para compartilhar (exclui proprietário e já compartilhados)
  const usuariosDisponiveis = usuarios.filter(u => 
    u.id !== contrato.usuarioId && 
    !compartilhamentos.some(c => c.usuarioId === u.id)
  );

  const handleCompartilhar = async () => {
    if (!usuarioSelecionado) {
      setErro('Selecione um usuário');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await contratosApi.compartilhar(contrato.id, usuarioSelecionado, podeEditar);
      // Recarregar compartilhamentos
      const novosCompartilhamentos = await contratosApi.listarCompartilhamentos(contrato.id);
      setCompartilhamentos(novosCompartilhamentos);
      setUsuarioSelecionado('');
      setPodeEditar(false);
      onAtualizar();
    } catch (err: any) {
      console.error('Erro ao compartilhar:', err);
      setErro(err.message || 'Erro ao compartilhar contrato');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverCompartilhamento = async (usuarioId: string) => {
    if (!confirm('Tem certeza que deseja remover este compartilhamento?')) return;

    setSalvando(true);
    try {
      await contratosApi.removerCompartilhamento(contrato.id, usuarioId);
      const novosCompartilhamentos = await contratosApi.listarCompartilhamentos(contrato.id);
      setCompartilhamentos(novosCompartilhamentos);
      onAtualizar();
    } catch (err) {
      console.error('Erro ao remover compartilhamento:', err);
      setErro('Erro ao remover compartilhamento');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 sm:p-6 rounded-t-xl">
          <h2 className="text-xl sm:text-2xl font-bold">🔗 Compartilhar Contrato</h2>
          <p className="text-green-100 text-sm mt-1">{contrato.nome}</p>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : (
            <>
              {erro && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {erro}
                </div>
              )}

              {/* Formulário para adicionar compartilhamento */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Adicionar Compartilhamento</h3>
                
                {usuariosDisponiveis.length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selecionar Usuário
                      </label>
                      <select
                        value={usuarioSelecionado}
                        onChange={(e) => setUsuarioSelecionado(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        disabled={salvando}
                      >
                        <option value="">-- Selecione um usuário --</option>
                        {usuariosDisponiveis.map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nome} ({usuario.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="podeEditar"
                        checked={podeEditar}
                        onChange={(e) => setPodeEditar(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        disabled={salvando}
                      />
                      <label htmlFor="podeEditar" className="text-sm text-gray-700">
                        Permitir edição (o usuário poderá modificar serviços e medições)
                      </label>
                    </div>

                    <button
                      onClick={handleCompartilhar}
                      disabled={salvando || !usuarioSelecionado}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {salvando ? 'Compartilhando...' : '➕ Compartilhar'}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    Não há mais usuários disponíveis para compartilhar.
                  </p>
                )}
              </div>

              {/* Lista de compartilhamentos atuais */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Compartilhado com ({compartilhamentos.length})
                </h3>
                
                {compartilhamentos.length > 0 ? (
                  <div className="space-y-2">
                    {compartilhamentos.map(comp => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{comp.nomeUsuario}</div>
                          <div className="text-sm text-gray-500">{comp.emailUsuario}</div>
                          <div className="text-xs mt-1">
                            {comp.podeEditar ? (
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ✏️ Pode editar
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                👁️ Somente visualização
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoverCompartilhamento(comp.usuarioId)}
                          disabled={salvando}
                          className="ml-3 text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded transition"
                          title="Remover compartilhamento"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic text-center py-4">
                    Este contrato ainda não foi compartilhado com ninguém.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Botões */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onFechar}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
