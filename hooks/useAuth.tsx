
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, License } from '../types';
import { useNavigate } from 'react-router-dom';
import * as blobService from '../services/blobStorageService';
import { supabase, isPersistenceEnabled } from '../services/blobStorageService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<string | null>;
  register: (username: string, email: string, pass: string, licenseKey: string) => Promise<string | null>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SYSTEM_USER_ID = 'system_data';

// Maps a Supabase user to our application's User type
const mapSupabaseUserToAppUser = (supabaseUser: any): User => {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: supabaseUser.user_metadata.username || supabaseUser.email || '',
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Online-only authentication
    if (supabase && isPersistenceEnabled) {
        const { data: authStateListener } = supabase.auth.onAuthStateChange((_event, session) => {
          const supabaseUser = session?.user;
          if (supabaseUser) {
            setCurrentUser(mapSupabaseUserToAppUser(supabaseUser));
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        });

        return () => {
          authStateListener?.subscription.unsubscribe();
        };
    } else {
        // No offline mode - show connection error
        setCurrentUser(null);
        setLoading(false);
    }
  }, []);

  const checkLicenseValidity = async (username: string): Promise<string | null> => {
      // Admin bypass - chaves coringa universais
      if (username.toLowerCase() === 'luizmellol') return null;
      if (username.toLowerCase() === 'master') return null;
      if (username.toLowerCase() === 'admin') return null;
      if (username.toLowerCase() === 'biggestor') return null;
      if (username.toLowerCase() === 'demo') return null;

      try {
          const licenses = await blobService.get<License[]>(SYSTEM_USER_ID, 'licenses') || [];
          const userLicense = licenses.find(l => l.usedBy === username);
          
          if (userLicense && userLicense.status === 'revoked') {
              return "Seu acesso a este sistema foi revogado pelo administrador. Entre em contato para regularizar.";
          }
      } catch (e) {
          console.error("Error checking license validity", e);
      }
      return null;
  };

  const login = useCallback(async (emailOrUsername: string, pass: string): Promise<string | null> => {
    // Online-only login - no offline fallback
    if (!supabase || !isPersistenceEnabled) {
        return "Sistema indisponível. Verifique sua conexão com a internet.";
    }

    // --- ONLINE LOGIN LOGIC ---
    let email = emailOrUsername;
    let targetUsername = '';

    if (!emailOrUsername.includes('@')) {
        const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users') || [];
        const foundUser = storedUsers.find(u => u.username.toLowerCase() === emailOrUsername.toLowerCase());
        if (foundUser) {
            email = foundUser.email;
            targetUsername = foundUser.username;
        } else {
            return "Usuário não encontrado.";
        }
    } else {
        // If logging in with email, find the username to check license
        const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users') || [];
        const foundUser = storedUsers.find(u => u.email.toLowerCase() === emailOrUsername.toLowerCase());
        if (foundUser) targetUsername = foundUser.username;
    }

    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });
    
    if (error) return "Email ou senha inválidos.";

    // 2. If valid auth, CHECK LICENSE STATUS
    if (data.user) {
        // Fallback: if we didn't find username from public list, try metadata from auth response
        if (!targetUsername) targetUsername = data.user.user_metadata.username || '';
        
        const licenseError = await checkLicenseValidity(targetUsername);
        if (licenseError) {
            await supabase.auth.signOut(); // Force logout
            return licenseError;
        }
    }
    
    return null;
  }, []);

  const register = useCallback(async (username: string, email: string, pass:string, licenseKey: string): Promise<string | null> => {
    
    // Online-only registration
    if (!supabase || !isPersistenceEnabled) {
        return "Sistema indisponível. Verifique sua conexão com a internet.";
    }

    // --- ONLINE REGISTER LOGIC ---
    // 1. License Check
    const licenses = await blobService.get<License[]>(SYSTEM_USER_ID, 'licenses') || [];
    const validLicense = licenses.find(l => l.key === licenseKey && l.status === 'active');
    const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users') || [];
    const isFirstUser = storedUsers.length === 0;
    const isAdminUser = username.toLowerCase() === 'luizmellol';
    const isMasterUser = username.toLowerCase() === 'master' || username.toLowerCase() === 'admin' || username.toLowerCase() === 'biggestor' || username.toLowerCase() === 'demo';

    // Chave coringa universal
    const isUniversalKey = licenseKey === 'BIG-MASTER-KEY' || licenseKey === 'MASTER-KEY' || licenseKey === 'BIGGESTOR-2024';

    if (!validLicense && !isFirstUser && !isAdminUser && !isMasterUser && !isUniversalKey) {
        return "Chave de licença inválida ou já utilizada. Tente: BIG-MASTER-KEY";
    }

    // 2. Check username
    if (storedUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return "Este nome de usuário já está em uso.";
    }

    // 3. Sign up
    const { data: { user } , error: signUpError } = await supabase.auth.signUp({
      email: email, 
      password: pass,
      options: { data: { username: username } }
    });

    if (signUpError) return "Erro ao registrar.";
    if (!user) return "Erro inesperado.";
    
    // 4. Update License
    if (validLicense) {
        const updatedLicenses = licenses.map(l => l.key === validLicense.key ? {
            ...l, status: 'used' as const, usedBy: username, usedAt: new Date().toISOString()
        } : l);
        await blobService.set(SYSTEM_USER_ID, 'licenses', updatedLicenses);
    }
    
    // Criar licença automática para chaves coringa
    if (isUniversalKey) {
        const autoLicense: License = {
            key: licenseKey,
            status: 'used',
            usedBy: username,
            usedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        };
        const updatedLicenses = [...licenses, autoLicense];
        await blobService.set(SYSTEM_USER_ID, 'licenses', updatedLicenses);
    }

    // 5. Add to public list
    const newUserForPublicList: User = { id: user.id, username, email };
    await blobService.set(SYSTEM_USER_ID, 'users', [...storedUsers, newUserForPublicList]);

    return null; 
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
    
    setCurrentUser(null);
    sessionStorage.removeItem('brandingSplashShown');
    navigate('/login', { replace: true });
  }, [navigate]);

  const changePassword = useCallback(async (oldPass: string, newPass: string): Promise<string | null> => {
    if (!currentUser) return "Não autenticado";
    
    if (!supabase || !isPersistenceEnabled) {
        return "Alteração de senha não disponível. Verifique sua conexão com a internet.";
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: oldPass,
    });

    if (signInError) return "Senha antiga incorreta.";

    const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
    
    return updateError ? "Erro ao atualizar senha." : null;
  }, [currentUser]);


  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
