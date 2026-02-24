import React, { createContext, useState, useEffect } from "react";
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
  getAccessToken,
} from "../Services/authService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const token = localStorage.getItem("accessToken");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Check token on app load
  useEffect(() => {
    const token = getAccessToken();
    if (token) setIsAuthenticated(true);
  }, []);

  const register = async (credentials) => {
    const result = await registerService(credentials);
    setIsAuthenticated(true);
    return result;
  };

  const login = async (credentials) => {
    const result = await loginService(credentials);
    setIsAuthenticated(true);
    return result;
  };

  const logout = async () => {
    await logoutService();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
import { useContext } from "react";

export const useAuth = () => useContext(AuthContext);
