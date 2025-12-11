'use client';

import { useState, useEffect } from 'react';
import ServicoForm from './components/ServicoForm';
import ServicosTable from './components/ServicosTable';
import Totais from './components/Totais';
import CurvaSChart from './components/CurvaSChart';
import ModalContrato from './components/ModalContrato';
import ModalUsuario from './components/ModalUsuario';
import { Servico, ServicoFormData, Contrato, Usuario } from './types';

export default function Home() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioAtualId, setUsuarioAtualId] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoAtualId, setContratoAtualId] = useState<string | null>(null);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'percentual' | 'real'>('percentual');
  
  // Carregar usuários do localStorage
  useEffect(() => {
    const usuariosArmazenados = localStorage.getItem('usuarios');
    if (usuariosArmazenados) {
      const usuariosCarregados = JSON.parse(usuariosArmazenados);
      setUsuarios(usuariosCarregados);
    }
    
    const usuarioAtualArmazenado = localStorage.getItem('usuarioAtualId');
    if (usuarioAtualArmazenado) {
      setUsuarioAtualId(usuarioAtualArmazenado);
    } else if (!usuariosArmazenados || JSON.parse(usuariosArmazenados).length === 0) {
      // Se não tem usuário, mostrar modal
      setMostrarModalUsuario(true);
    }
  }, []);

  // Salvar usuários no localStorage
  useEffect(() => {
    if (usuarios.length > 0) {
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
  }, [usuarios]);

  // Salvar usuário atual
  useEffect(() => {
    if (usuarioAtualId) {
      localStorage.setItem('usuarioAtualId', usuarioAtualId);
    }
  }, [usuarioAtualId]);

  // Carregar contratos do localStorage
  useEffect(() => {
    const contratosArmazenados = localStorage.getItem('contratos');
    if (contratosArmazenados) {
      const contratosCarregados = JSON.parse(contratosArmazenados);
      setContratos(contratosCarregados);
      // Carregar primeiro contrato do usuário atual
      if (usuarioAtualId) {
        const contratoUsuario = contratosCarregados.find((c: Contrato) => c.usuarioId === usuarioAtualId);
        if (contratoUsuario) {
          setContratoAtualId(contratoUsuario.id);
        }
      }
    }
  }, [usuarioAtualId]);

  // Salvar contratos no localStorage
  useEffect(() => {
    if (contratos.length > 0) {
      localStorage.setItem('contratos', JSON.stringify(contratos));
    }
  }, [contratos]);

  const usuarioAtual = usuarios.find(u => u.id === usuarioAtualId);
  const contratosDoUsuario = contratos.filter(c => c.usuarioId === usuarioAtualId);
  const contratoAtual = contratosDoUsuario.find(c => c.id === contratoAtualId);
  const servicos = contratoAtual?.servicos || [];
  const numeroMeses = contratoAtual?.numeroMeses || 12;
  const mesInicial = contratoAtual?.mesInicial || new Date().getMonth() + 1;
  const anoInicial = contratoAtual?.anoInicial || new Date().getFullYear();

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
            pago: 0,
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
    if (contratoAtual && contratoAtual.servicos.length > 0) {
      const precisaAjustar = contratoAtual.servicos.some(
        servico => servico.medicoes.length !== contratoAtual.numeroMeses
      );
      
      if (precisaAjustar) {
        const servicosAjustados = ajustarMedicoesServicos(contratoAtual.servicos, contratoAtual.numeroMeses);
        setContratos(contratos.map(c => 
          c.id === contratoAtual.id ? { ...c, servicos: servicosAjustados } : c
        ));
      }
    }
  }, [contratoAtualId, contratoAtual?.numeroMeses]);

  const atualizarServicosContrato = (novosServicos: Servico[]) => {
    if (!contratoAtualId) return;
    setContratos(contratos.map(c => 
      c.id === contratoAtualId ? { ...c, servicos: novosServicos } : c
    ));
  };

  const handleAddServico = (servicoData: ServicoFormData) => {
    if (!contratoAtualId) {
      alert('Por favor, crie ou selecione um contrato primeiro!');
      return;
    }

    const valorTotal = servicoData.medicoes.reduce((sum, medicao) => sum + medicao.previsto, 0);
    
    if (editandoIndex !== null) {
      const servicosAtualizados = [...servicos];
      servicosAtualizados[editandoIndex] = {
        id: servicos[editandoIndex].id,
        ...servicoData,
        valorTotal,
      };
      atualizarServicosContrato(servicosAtualizados);
      setEditandoIndex(null);
    } else {
      const novoServico: Servico = {
        id: Date.now().toString(),
        ...servicoData,
        valorTotal,
      };
      atualizarServicosContrato([...servicos, novoServico]);
    }
  };

  const handleEdit = (index: number) => {
    setEditandoIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicao = () => {
    setEditandoIndex(null);
  };

  const handleDelete = (index: number) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      const novosServicos = servicos.filter((_, i) => i !== index);
      atualizarServicosContrato(novosServicos);
    }
  };

  const handleUpdateMedicao = (servicoIndex: number, medicaoIndex: number, field: 'previsto' | 'realizado' | 'pago', valor: number) => {
    const servicosAtualizados = [...servicos];
    const servico = { ...servicosAtualizados[servicoIndex] };
    const medicoes = [...servico.medicoes];
    
    medicoes[medicaoIndex] = {
      ...medicoes[medicaoIndex],
      [field]: valor,
    };
    
    servico.medicoes = medicoes;
    // Recalcular valor total baseado nos valores previstos
    servico.valorTotal = medicoes.reduce((sum, medicao) => sum + medicao.previsto, 0);
    
    servicosAtualizados[servicoIndex] = servico;
    atualizarServicosContrato(servicosAtualizados);
  };

  const handleCriarContrato = (nome: string, descricao: string, numeroMeses: number, mesInicial: number, anoInicial: number) => {
    if (!usuarioAtualId) {
      alert('Selecione um usuário primeiro!');
      return;
    }

    if (contratoEditando) {
      // Editar contrato existente
      const contratoAtualizado = contratos.find(c => c.id === contratoEditando.id);
      const servicosAjustados = contratoAtualizado ? ajustarMedicoesServicos(contratoAtualizado.servicos, numeroMeses) : [];
      
      setContratos(contratos.map(c => 
        c.id === contratoEditando.id 
          ? { ...c, nome, descricao, numeroMeses, mesInicial, anoInicial, servicos: servicosAjustados }
          : c
      ));
      setContratoEditando(null);
    } else {
      // Criar novo contrato
      const novoContrato: Contrato = {
        id: Date.now().toString(),
        nome,
        descricao,
        numeroMeses,
        mesInicial,
        anoInicial,
        servicos: [],
        dataCriacao: new Date().toISOString(),
        usuarioId: usuarioAtualId,
      };
      setContratos([...contratos, novoContrato]);
      setContratoAtualId(novoContrato.id);
    }
    setMostrarModalContrato(false);
  };

  const handleCriarUsuario = (nome: string, email: string, empresa: string) => {
    const novoUsuario: Usuario = {
      id: Date.now().toString(),
      nome,
      email,
      empresa: empresa || undefined,
      dataCriacao: new Date().toISOString(),
    };
    setUsuarios([...usuarios, novoUsuario]);
    setUsuarioAtualId(novoUsuario.id);
    setMostrarModalUsuario(false);
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

  const handleDeletarContrato = (contratoId: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato? Todos os serviços serão perdidos!')) {
      const novosContratos = contratos.filter(c => c.id !== contratoId);
      setContratos(novosContratos);
      if (contratoAtualId === contratoId) {
        setContratoAtualId(novosContratos.length > 0 ? novosContratos[0].id : null);
      }
    }
  };

  const atualizarConfiguracoesContrato = (numeroMeses: number, mesInicial: number, anoInicial: number) => {
    if (!contratoAtualId) return;
    setContratos(contratos.map(c =>
      c.id === contratoAtualId ? { ...c, numeroMeses, mesInicial, anoInicial } : c
    ));
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

  const handleImportarJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const contratoImportado = JSON.parse(e.target?.result as string);
          contratoImportado.id = Date.now().toString();
          setContratos([...contratos, contratoImportado]);
          setContratoAtualId(contratoImportado.id);
        } catch (error) {
          alert('Erro ao importar arquivo JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">📊 Cronograma de Atividades</h1>
              <p className="text-purple-100 mt-1 sm:mt-2 text-sm sm:text-base">Sistema de Gestão com Curva S</p>
            </div>
            {usuarioAtual && (
              <div className="bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg w-full sm:w-auto">
                <div className="text-xs sm:text-sm text-purple-100">Usuário:</div>
                <div className="font-semibold text-base sm:text-lg">{usuarioAtual.nome}</div>
                {usuarioAtual.empresa && (
                  <div className="text-xs sm:text-sm text-purple-100">🏢 {usuarioAtual.empresa}</div>
                )}
                <button
                  onClick={() => setMostrarModalUsuario(true)}
                  className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
                >
                  Trocar Usuário
                </button>
              </div>
            )}
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
                      {contrato.nome}
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
                    >
                      ✏️ <span className="hidden sm:inline">Editar</span>
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
            numMeses={numeroMeses}
            modoVisualizacao={modoVisualizacao}
            onModoVisualizacaoChange={setModoVisualizacao}
          />
        </div>

        {/* Curva S */}
        <div className="mt-6 sm:mt-8">
          <CurvaSChart servicos={servicos} numMeses={numeroMeses} modoVisualizacao={modoVisualizacao} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 sm:py-6 mt-8 sm:mt-12">
        <p className="text-sm sm:text-base">&copy; 2024 Sistema de Cronograma. Desenvolvido com Next.js</p>
      </footer>
    </div>
  );
}
