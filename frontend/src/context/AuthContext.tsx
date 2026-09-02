import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';

interface RegisterResponse {
  requires_verification?: boolean;
  email?: string;
  message?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<RegisterResponse>;
  googleLogin: (idToken: string) => Promise<User>;
  verifyEmail: (uid: string, token: string) => Promise<User>;
  resendVerification: (email: string) => Promise<{ status: string; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: Record<string, unknown>): Promise<RegisterResponse> => {
    const res = await authApi.register(data);
    if (res.data.tokens?.access && res.data.user) {
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return {
      requires_verification: res.data.requires_verification ?? false,
      email: res.data.email || (data.email as string),
      message: res.data.message,
      user: res.data.user,
    };
  };

  const googleLogin = async (idToken: string): Promise<User> => {
    const res = await authApi.googleAuth({ id_token: idToken });
    localStorage.setItem('access_token', res.data.tokens.access);
    localStorage.setItem('refresh_token', res.data.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const verifyEmail = async (uid: string, token: string): Promise<User> => {
    const res = await authApi.verifyEmail({ uid, token });
    localStorage.setItem('access_token', res.data.tokens.access);
    localStorage.setItem('refresh_token', res.data.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const resendVerification = async (email: string) => {
    const res = await authApi.resendVerification({ email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        verifyEmail,
        resendVerification,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
