// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar datos de cookies al cargar
    const storedToken = getCookie('token');
    const storedUser = getCookie('usuario');

    if (storedToken && storedUser) {
      setToken(storedToken.toString());
      try {
        setUser(JSON.parse(storedUser.toString()));
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    console.log(newUser)
    setCookie('token', newToken, { maxAge: 60 * 60 * 24 * 7 }); // 1 semana
    setCookie('usuario', JSON.stringify(newUser), { maxAge: 60 * 60 * 24 * 7 });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    deleteCookie('token');
    deleteCookie('usuario');

    // Redirigir al login
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };


  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
