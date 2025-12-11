'use client';

import React, { useState, useEffect } from 'react';
import { UsuarioLogado, authApi } from '../contexts/AuthContext';

interface ModalUsuarioAdminProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: () => void;
  usuarioEdicao?: UsuarioLogado | null;
}

function ModalUsuarioAdmin({ isOpen, onClose, onSalvar, usuarioEdicao }: ModalUsuarioAdminProps) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [role, setRole] = useState('Usuario');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuarioEdicao) {
      setLogin(usuarioEdicao.login);
      setSenha('');
      setNome(usuarioEdicao.nome);
      setEmail(usuarioEdicao.email);
      setEmpresa(usuarioEdicao.empresa || '');
      setRole(usuarioEdicao.role);
      setAtivo(usuarioEdicao.ativo);
    } else {
      setLogin('');
      setSenha('');
      setNome('');
      setEmail('');
      setEmpresa('');
      setRole('Usuario');
      setAtivo(true);
    }
    setErro('');
  }, [usuarioEdicao, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      if (usuarioEdicao) {
        await authApi.atualizarUsuario(usuarioEdicao.id, {
          nome,
          email,
          empresa: empresa || undefined,
          role,
          ativo,
          novaSenha: senha || undefined
        });
      } else {
        if (!senha) {
          setErro('Senha é obrigatória para novo usuário');
          setSalvando(false);
          return;
        }
        await authApi.criarUsuario({
          login,
          senha,
          nome,
          email,
          empresa: empresa || undefined,
          role
        });
      }
      onSalvar();
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {usuarioEdicao ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              required
              disabled={!!usuarioEdicao || salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {usuarioEdicao ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={!usuarioEdicao}
              disabled={salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Usuário
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={salvando}
            >
              <option value="Usuario">Usuário</option>
              <option value="Admin">Administrador</option>
            </select>
          </div>

          {usuarioEdicao && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                disabled={salvando}
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                Usuário ativo
              </label>
            </div>
          )}

          {erro && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GerenciamentoUsuariosProps {
  onVoltar: () => void;
}

export default function GerenciamentoUsuarios({ onVoltar }: GerenciamentoUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioLogado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioLogado | null>(null);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const dados = await authApi.listarUsuarios();
      setUsuarios(dados);
      setErro('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar usuários');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleNovoUsuario = () => {
    setUsuarioEdicao(null);
    setModalAberto(true);
  };

  const handleEditarUsuario = (usuario: UsuarioLogado) => {
    setUsuarioEdicao(usuario);
    setModalAberto(true);
  };

  const handleDeletarUsuario = async (usuario: UsuarioLogado) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?`)) {
      return;
    }

    try {
      await authApi.deletarUsuario(usuario.id);
      await carregarUsuarios();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao deletar usuário');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        </div>
        <button
          onClick={handleNovoUsuario}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usuario.login}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.empresa || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.role === 'Admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {usuario.role === 'Admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditarUsuario(usuario)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletarUsuario(usuario)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalUsuarioAdmin
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSalvar={carregarUsuarios}
        usuarioEdicao={usuarioEdicao}
      />
    </div>
  );
}
