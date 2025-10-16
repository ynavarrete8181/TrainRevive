import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkToken();
  }, []);

  const login = async (token) => {
    await AsyncStorage.setItem("authToken", token);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
