'use client';

import { useState, useEffect, useCallback } from 'react';
import ServicoForm from './components/ServicoForm';
import ServicosTable from './components/ServicosTable';
import Totais from './components/Totais';
import CurvaSChart from './components/CurvaSChart';
import ModalContrato from './components/ModalContrato';
import ModalUsuario from './components/ModalUsuario';
import ModalCompartilhar from './components/ModalCompartilhar';
import Spinner from './components/Spinner';
import LoginForm from './components/LoginForm';
import GerenciamentoUsuarios from './components/GerenciamentoUsuarios';
import { useAuth } from './contexts/AuthContext';
import { Servico, ServicoFormData, Contrato, Usuario } from './types';
import { usuariosApi, contratosApi, servicosApi } from './services/api';

export default function Home() {
  const { usuario: usuarioLogado, token, loading: authLoading, login, logout, isAdmin } = useAuth();
  const [mostrarGerenciamentoUsuarios, setMostrarGerenciamentoUsuarios] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioAtualId, setUsuarioAtualId] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoAtualId, setContratoAtualId] = useState<string | null>(null);
  const [contratoAtual, setContratoAtual] = useState<Contrato | null>(null);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [mostrarModalCompartilhar, setMostrarModalCompartilhar] = useState(false);
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'percentual' | 'real'>('percentual');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurar usuário atual baseado no login
  useEffect(() => {
    if (usuarioLogado) {
      setUsuarioAtualId(usuarioLogado.id);
    }
  }, [usuarioLogado]);

  // Carregar usuários do backend
  useEffect(() => {
    const carregarUsuarios = async () => {
      if (!usuarioLogado) {
        setLoading(false);
        return;
      }
      
      try {
        const usuariosCarregados = await usuariosApi.listar();
        setUsuarios(usuariosCarregados);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, [usuarioLogado]);

  // Carregar contratos do usuário atual
  useEffect(() => {
    const carregarContratos = async () => {
      if (!usuarioLogado) {
        setContratos([]);
        setContratoAtualId(null);
        return;
      }

      try {
        const contratosCarregados = await contratosApi.listar();
        setContratos(contratosCarregados);
        
        if (contratosCarregados.length > 0 && !contratoAtualId) {
          setContratoAtualId(contratosCarregados[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar contratos:', err);
      }
    };

    carregarContratos();
  }, [usuarioLogado]);

  // Carregar contrato completo (com serviços) quando selecionado
  useEffect(() => {
    const carregarContratoCompleto = async () => {
      if (!contratoAtualId) {
        setContratoAtual(null);
        return;
      }

      try {
        const contrato = await contratosApi.buscar(contratoAtualId);
        setContratoAtual(contrato);
      } catch (err) {
        console.error('Erro ao carregar contrato:', err);
        setContratoAtual(null);
      }
    };

    carregarContratoCompleto();
  }, [contratoAtualId]);

  const usuarioAtual = usuarios.find(u => u.id === usuarioAtualId);
  // Todos os contratos já vêm filtrados pelo backend (próprios + compartilhados)
  const contratosDoUsuario = contratos;
  const servicos = contratoAtual?.servicos || [];
  const numeroMeses = contratoAtual?.numeroMeses || 12;
  const mesInicial = contratoAtual?.mesInicial || new Date().getMonth() + 1;
  const anoInicial = contratoAtual?.anoInicial || new Date().getFullYear();

  // Recarregar contrato atual
  const recarregarContrato = useCallback(async () => {
    if (!contratoAtualId) return;
    try {
      const contrato = await contratosApi.buscar(contratoAtualId);
      setContratoAtual(contrato);
    } catch (err) {
      console.error('Erro ao recarregar contrato:', err);
    }
  }, [contratoAtualId]);

  // Função para ajustar medições (definida antes do useEffect)
  const ajustarMedicoesServicos = (servicos: Servico[], novoNumeroMeses: number): Servico[] => {
    return servicos.map(servico => {
      const medicoesAtuais = servico.medicoes.length;
      let novasMedicoes = [...servico.medicoes];
      
      if (medicoesAtuais < novoNumeroMeses) {
        // Adicionar meses faltantes com valores zerados
        const mesesFaltantes = novoNumeroMeses - medicoesAtuais;
        for (let i = 0; i < mesesFaltantes; i++) {
          novasMedicoes.push({
            mes: `Mês ${medicoesAtuais + i + 1}`,
            previsto: 0,
            realizado: 0,
          });
        }
      } else if (medicoesAtuais > novoNumeroMeses) {
        // Remover meses excedentes
        novasMedicoes = novasMedicoes.slice(0, novoNumeroMeses);
      }
      
      // Recalcular valor total
      const valorTotal = novasMedicoes.reduce((sum, medicao) => sum + medicao.previsto, 0);
      
      return {
        ...servico,
        medicoes: novasMedicoes,
        valorTotal,
      };
    });
  };

  // Sincronizar medições dos serviços com o número de meses do contrato
  useEffect(() => {
    const ajustarMedicoes = async () => {
      if (contratoAtual && contratoAtual.servicos.length > 0) {
        const precisaAjustar = contratoAtual.servicos.some(
          servico => servico.medicoes.length !== contratoAtual.numeroMeses
        );
        
        if (precisaAjustar) {
          // Ajustar cada serviço no backend
          for (const servico of contratoAtual.servicos) {
            if (servico.medicoes.length !== contratoAtual.numeroMeses) {
              const medicoesAjustadas = ajustarMedicoesServicos([servico], contratoAtual.numeroMeses)[0].medicoes;
              try {
                await servicosApi.atualizar(servico.id, {
                  item: servico.item,
                  servico: servico.servico,
                  medicoes: medicoesAjustadas,
                });
              } catch (err) {
                console.error('Erro ao ajustar medições:', err);
              }
            }
          }
          recarregarContrato();
        }
      }
    };
    
    ajustarMedicoes();
  }, [contratoAtualId, contratoAtual?.numeroMeses, recarregarContrato]);

  const handleAddServico = async (servicoData: ServicoFormData) => {
    if (!contratoAtualId) {
      alert('Por favor, crie ou selecione um contrato primeiro!');
      return;
    }

    setSalvando(true);
    try {
      if (editandoIndex !== null) {
        const servicoId = servicos[editandoIndex].id;
        await servicosApi.atualizar(servicoId, {
          item: servicoData.item,
          servico: servicoData.servico,
          medicoes: servicoData.medicoes,
        });
        setEditandoIndex(null);
      } else {
        await servicosApi.criar({
          item: servicoData.item,
          servico: servicoData.servico,
          contratoId: contratoAtualId,
          medicoes: servicoData.medicoes,
        });
      }
      await recarregarContrato();
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Erro ao salvar serviço');
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditandoIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicao = () => {
    setEditandoIndex(null);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      setSalvando(true);
      try {
        const servicoId = servicos[index].id;
        await servicosApi.deletar(servicoId);
        await recarregarContrato();
      } catch (err) {
        console.error('Erro ao deletar serviço:', err);
        alert('Erro ao deletar serviço');
      } finally {
        setSalvando(false);
      }
    }
  };

  const handleUpdateMedicao = async (servicoIndex: number, medicaoIndex: number, field: 'previsto' | 'realizado', valor: number) => {
    const servico = servicos[servicoIndex];
    const medicao = servico.medicoes[medicaoIndex];
    
    const medicaoAtualizada = {
      ...medicao,
      [field]: valor,
    };
    
    setSalvando(true);
    try {
      await servicosApi.atualizarMedicao(servico.id, medicaoIndex, medicaoAtualizada);
      await recarregarContrato();
    } catch (err) {
      console.error('Erro ao atualizar medição:', err);
    } finally {
      setSalvando(false);
    }
  };

  const handleUpdatePagamento = async (ordem: number, mes: string, valor: number) => {
    if (!contratoAtualId) return;
    
    setSalvando(true);
    try {
      await contratosApi.atualizarPagamento(contratoAtualId, ordem, mes, valor);
      await recarregarContrato();
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err);
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarContrato = async (nome: string, descricao: string, numeroMeses: number, mesInicial: number, anoInicial: number, percentualReajuste: number = 0, mesInicioReajuste: number | null = null) => {
    if (!usuarioAtualId) {
      alert('Selecione um usuário primeiro!');
      return;
    }

    setSalvando(true);
    try {
      if (contratoEditando) {
        // Editar contrato existente
        await contratosApi.atualizar(contratoEditando.id, {
          nome,
          descricao,
          numeroMeses,
          mesInicial,
          anoInicial,
          percentualReajuste,
          mesInicioReajuste,
        });
        setContratoEditando(null);
        
        // Recarregar contratos
        const contratosAtualizados = await contratosApi.listar();
        setContratos(contratosAtualizados);
        await recarregarContrato();
      } else {
        // Criar novo contrato
        const novoContrato = await contratosApi.criar({
          nome,
          descricao,
          numeroMeses,
          mesInicial,
          anoInicial,
          percentualReajuste,
          mesInicioReajuste,
        });
        
        setContratos([...contratos, novoContrato]);
        setContratoAtualId(novoContrato.id);
      }
      setMostrarModalContrato(false);
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      alert('Erro ao salvar contrato');
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarUsuario = async (nome: string, email: string, empresa: string) => {
    setSalvando(true);
    try {
      const novoUsuario = await usuariosApi.criar({
        nome,
        email,
        empresa: empresa || undefined,
      });
      setUsuarios([...usuarios, novoUsuario]);
      setUsuarioAtualId(novoUsuario.id);
      setMostrarModalUsuario(false);
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      alert('Erro ao criar usuário');
    } finally {
      setSalvando(false);
    }
  };

  const handleSelecionarUsuario = (usuarioId: string) => {
    setUsuarioAtualId(usuarioId);
    // Limpar contrato selecionado
    setContratoAtualId(null);
  };

  const handleEditarContrato = () => {
    if (!contratoAtual) return;
    setContratoEditando(contratoAtual);
    setMostrarModalContrato(true);
  };

  const handleDeletarContrato = async (contratoId: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato? Todos os serviços serão perdidos!')) {
      setSalvando(true);
      try {
        await contratosApi.deletar(contratoId);
        const novosContratos = contratos.filter(c => c.id !== contratoId);
        setContratos(novosContratos);
        if (contratoAtualId === contratoId) {
          setContratoAtualId(novosContratos.length > 0 ? novosContratos[0].id : null);
        }
      } catch (err) {
        console.error('Erro ao deletar contrato:', err);
        alert('Erro ao deletar contrato');
      } finally {
        setSalvando(false);
      }
    }
  };

  const handleExportarJSON = () => {
    if (!contratoAtual) return;
    const dataStr = JSON.stringify(contratoAtual, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrato_${contratoAtual.nome}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportarJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && usuarioLogado) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const contratoImportado = JSON.parse(e.target?.result as string);
          
          // Criar contrato no backend
          const novoContrato = await contratosApi.criar({
            nome: contratoImportado.nome,
            descricao: contratoImportado.descricao,
            numeroMeses: contratoImportado.numeroMeses,
            mesInicial: contratoImportado.mesInicial,
            anoInicial: contratoImportado.anoInicial,
          });
          
          // Criar serviços do contrato importado
          if (contratoImportado.servicos && Array.isArray(contratoImportado.servicos)) {
            for (const servico of contratoImportado.servicos) {
              await servicosApi.criar({
                item: servico.item,
                servico: servico.servico,
                contratoId: novoContrato.id,
                medicoes: servico.medicoes,
              });
            }
          }
          
          // Recarregar lista de contratos
          const contratosAtualizados = await contratosApi.listar();
          setContratos(contratosAtualizados);
          setContratoAtualId(novoContrato.id);
        } catch (error) {
          console.error('Erro ao importar:', error);
          alert('Erro ao importar arquivo JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!usuarioLogado) {
    return <LoginForm onLogin={login} />;
  }

  if (mostrarGerenciamentoUsuarios && isAdmin) {
    return <GerenciamentoUsuarios onVoltar={() => setMostrarGerenciamentoUsuarios(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <p className="text-red-600 text-lg mb-4">⚠️ {error}</p>
          <p className="text-gray-600 text-sm">Verifique se o backend está rodando em http://localhost:5000</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50">
      {/* Spinner de salvamento */}
      {salvando && <Spinner message="Salvando..." />}
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">📊 Cronograma de Atividades</h1>
              <p className="text-purple-100 mt-1 sm:mt-2 text-sm sm:text-base">Sistema de Gestão com Curva S</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-purple-100">Usuário:</div>
              <div className="font-semibold text-base sm:text-lg">{usuarioLogado.nome}</div>
              {usuarioLogado.empresa && (
                <div className="text-xs sm:text-sm text-purple-100">🏢 {usuarioLogado.empresa}</div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {isAdmin && (
                  <button
                    onClick={() => setMostrarGerenciamentoUsuarios(true)}
                    className="text-xs bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded transition"
                  >
                    👥 Usuários
                  </button>
                )}
                <button
                  onClick={logout}
                  className="text-xs bg-red-500/80 hover:bg-red-600 px-3 py-1 rounded transition"
                >
                  🚪 Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Seletor de Contratos */}
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <label className="font-semibold text-gray-700 text-sm sm:text-base">
                📋 Contrato:
              </label>
              {contratosDoUsuario.length > 0 ? (
                <select
                  value={contratoAtualId || ''}
                  onChange={(e) => setContratoAtualId(e.target.value)}
                  className="px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none w-full sm:min-w-[200px] text-sm sm:text-base"
                >
                  {contratosDoUsuario.map(contrato => (
                    <option key={contrato.id} value={contrato.id}>
                      {contrato.nome} {!contrato.isProprietario ? `(de ${contrato.nomeProprietario})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum contrato criado</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setContratoEditando(null);
                    setMostrarModalContrato(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold text-sm sm:text-base flex-1 sm:flex-none"
                >
                  ➕ <span className="hidden sm:inline">Novo Contrato</span><span className="sm:hidden">Novo</span>
                </button>

                {contratoAtualId && (
                  <>
                    <button
                      onClick={handleEditarContrato}
                      className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm sm:text-base"
                      title="Editar contrato"
                      disabled={!contratoAtual?.podeEditar}
                    >
                      ✏️ <span className="hidden sm:inline">Editar</span>
                    </button>
                    {contratoAtual?.isProprietario && (
                      <>
                        <button
                          onClick={() => setMostrarModalCompartilhar(true)}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
                          title="Compartilhar contrato"
                        >
                          🔗 <span className="hidden sm:inline">Compartilhar</span>
                        </button>
                        <button
                          onClick={() => handleDeletarContrato(contratoAtualId)}
                          className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
                          title="Excluir contrato"
                        >
                          🗑️ <span className="hidden sm:inline">Excluir</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportarJSON}
                disabled={!contratoAtual}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
              >
                📥 <span className="hidden sm:inline">Exportar</span>
              </button>
              
              <label className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer text-sm sm:text-base flex-1 sm:flex-none text-center">
                📤 <span className="hidden sm:inline">Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportarJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {contratoAtual && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-start sm:items-center text-xs sm:text-sm">
                {!contratoAtual.isProprietario && (
                  <div className="w-full mb-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      🔗 Compartilhado por: {contratoAtual.nomeProprietario}
                      {contratoAtual.podeEditar ? ' (pode editar)' : ' (somente visualização)'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">Período:</span>
                  <span className="ml-2 text-gray-600">
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][contratoAtual.mesInicial - 1]}/{contratoAtual.anoInicial}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Duração:</span>
                  <span className="ml-2 text-gray-600">{contratoAtual.numeroMeses} meses</span>
                </div>
                {contratoAtual.percentualReajuste > 0 && contratoAtual.mesInicioReajuste && (
                  <div>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                      📈 Reajuste: {contratoAtual.percentualReajuste}% a partir do mês {contratoAtual.mesInicioReajuste}
                    </span>
                  </div>
                )}
                {contratoAtual.descricao && (
                  <div className="w-full sm:w-auto sm:flex-1">
                    <span className="font-semibold text-gray-700">Descrição:</span>
                    <span className="ml-2 text-gray-600">{contratoAtual.descricao}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {mostrarModalContrato && (
          <ModalContrato
            onCriar={handleCriarContrato}
            onFechar={() => {
              setMostrarModalContrato(false);
              setContratoEditando(null);
            }}
            contratoEditando={contratoEditando}
          />
        )}

        {mostrarModalUsuario && (
          <ModalUsuario
            onCriar={handleCriarUsuario}
            onFechar={() => setMostrarModalUsuario(false)}
            usuarios={usuarios}
            onSelecionarUsuario={handleSelecionarUsuario}
          />
        )}

        {mostrarModalCompartilhar && contratoAtual && usuarioLogado && (
          <ModalCompartilhar
            contrato={contratoAtual}
            usuarioLogadoId={usuarioLogado.id}
            onFechar={() => setMostrarModalCompartilhar(false)}
            onAtualizar={async () => {
              // Recarregar lista de contratos
              const contratosAtualizados = await contratosApi.listar();
              setContratos(contratosAtualizados);
            }}
          />
        )}

        {/* Formulário */}
        {contratoAtual ? (
          <ServicoForm 
            onAddServico={handleAddServico} 
            numMeses={numeroMeses}
            mesInicial={mesInicial}
            anoInicial={anoInicial}
            editingServico={editandoIndex !== null ? servicos[editandoIndex] : null}
            onCancelarEdicao={handleCancelarEdicao}
          />
        ) : (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 sm:p-8 text-center">
            <p className="text-lg sm:text-xl text-yellow-800 font-semibold mb-3 sm:mb-4">
              ⚠️ Nenhum contrato selecionado
            </p>
            <p className="text-yellow-700 mb-3 sm:mb-4 text-sm sm:text-base">
              Crie um novo contrato para começar a adicionar serviços
            </p>
            <button
              onClick={() => setMostrarModalContrato(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold text-sm sm:text-base"
            >
              ➕ Criar Primeiro Contrato
            </button>
          </div>
        )}

        {/* Totais */}
        <Totais servicos={servicos} />

        {/* Tabela */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Serviços Cadastrados</h2>
          <ServicosTable
            servicos={servicos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdateMedicao={handleUpdateMedicao}
            onUpdatePagamento={handleUpdatePagamento}
            pagamentosMensais={contratoAtual?.pagamentosMensais || []}
            numMeses={numeroMeses}
            modoVisualizacao={modoVisualizacao}
            onModoVisualizacaoChange={setModoVisualizacao}
          />
        </div>

        {/* Curva S */}
        <div className="mt-6 sm:mt-8">
          <CurvaSChart 
            servicos={servicos} 
            numMeses={numeroMeses} 
            modoVisualizacao={modoVisualizacao} 
            pagamentosMensais={contratoAtual?.pagamentosMensais || []} 
            mesInicial={mesInicial}
            anoInicial={anoInicial}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 sm:py-6 mt-8 sm:mt-12">
        <p className="text-sm sm:text-base">&copy; 2024 Sistema de Cronograma. Desenvolvido com Next.js</p>
      </footer>
    </div>
  );
}
