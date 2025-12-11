'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UsuarioLogado {
  id: string;
  login: string;
  nome: string;
  email: string;
  empresa?: string;
  role: string;
  ativo: boolean;
}

interface AuthContextType {
  usuario: UsuarioLogado | null;
  token: string | null;
  loading: boolean;
  login: (loginUsuario: string, senha: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe token salvo
    const tokenSalvo = localStorage.getItem('auth_token');
    const usuarioSalvo = localStorage.getItem('auth_usuario');
    
    if (tokenSalvo && usuarioSalvo) {
      setToken(tokenSalvo);
      setUsuario(JSON.parse(usuarioSalvo));
      
      // Validar token com o backend
      validarToken(tokenSalvo).then(valido => {
        if (!valido) {
          logout();
        }
      });
    }
    
    setLoading(false);
  }, []);

  const validarToken = async (tokenStr: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenStr}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const login = async (loginUsuario: string, senha: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ login: loginUsuario, senha })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fazer login');
    }

    const data = await response.json();
    
    setToken(data.token);
    setUsuario(data.usuario);
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_usuario', JSON.stringify(data.usuario));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
  };

  const isAdmin = usuario?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Função auxiliar para fazer requisições autenticadas
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// API de Autenticação para gerenciar usuários (admin)
export const authApi = {
  async listarUsuarios(): Promise<UsuarioLogado[]> {
    const response = await fetch(`${API_BASE_URL}/auth/usuarios`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Erro ao listar usuários');
    return response.json();
  },

  async criarUsuario(dados: {
    login: string;
    senha: string;
    nome: string;
    email: string;
    empresa?: string;
    role: string;
  }): Promise<UsuarioLogado> {
    const response = await fetch(`${API_BASE_URL}/auth/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar usuário');
    }
    return response.json();
  },

  async atualizarUsuario(id: string, dados: {
    nome: string;
    email: string;
    empresa?: string;
    role: string;
    ativo: boolean;
    novaSenha?: string;
  }): Promise<UsuarioLogado> {
    const response = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar usuário');
    }
    return response.json();
  },

  async deletarUsuario(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar usuário');
    }
  }
};
