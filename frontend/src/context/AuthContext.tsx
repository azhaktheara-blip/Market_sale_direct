import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';
import { tokenStorage } from '../api/client';

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
  register: (data: Record<string, unknown> | FormData) => Promise<RegisterResponse>;
  googleLogin: (idToken: string) => Promise<User>;
  verifyEmail: (uid: string, token: string) => Promise<User>;
  resendVerification: (email: string) => Promise<{ status: string; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser<User>());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      // Exchange refresh token for fresh in-memory access token
      authApi.refreshToken(refreshToken)
        .then((res) => {
          tokenStorage.setAccessToken(res.data.access);
          if (res.data.refresh) {
            tokenStorage.setRefreshToken(res.data.refresh);
          }
          return authApi.getMe();
        })
        .then((res) => {
          setUser(res.data);
          tokenStorage.setUser(res.data);
        })
        .catch(() => {
          tokenStorage.clearAll();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      tokenStorage.clearAll();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    tokenStorage.setAccessToken(res.data.access);
    tokenStorage.setRefreshToken(res.data.refresh);
    tokenStorage.setUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: Record<string, unknown> | FormData): Promise<RegisterResponse> => {
    const res = await authApi.register(data);
    if (res.data.tokens?.access && res.data.user) {
      tokenStorage.setAccessToken(res.data.tokens.access);
      tokenStorage.setRefreshToken(res.data.tokens.refresh);
      tokenStorage.setUser(res.data.user);
      setUser(res.data.user);
    }
    return {
      requires_verification: res.data.requires_verification ?? false,
      email: res.data.email || (data instanceof FormData ? data.get('email') as string : data.email as string),
      message: res.data.message,
      user: res.data.user,
    };
  };

  const googleLogin = async (idToken: string): Promise<User> => {
    const res = await authApi.googleAuth({ id_token: idToken });
    tokenStorage.setAccessToken(res.data.tokens.access);
    tokenStorage.setRefreshToken(res.data.tokens.refresh);
    tokenStorage.setUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const verifyEmail = async (uid: string, token: string): Promise<User> => {
    const res = await authApi.verifyEmail({ uid, token });
    tokenStorage.setAccessToken(res.data.tokens.access);
    tokenStorage.setRefreshToken(res.data.tokens.refresh);
    tokenStorage.setUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const resendVerification = async (email: string) => {
    const res = await authApi.resendVerification({ email });
    return res.data;
  };

  const logout = () => {
    tokenStorage.clearAll();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    tokenStorage.setUser(updatedUser);
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
