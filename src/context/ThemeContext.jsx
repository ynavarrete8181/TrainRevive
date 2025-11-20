// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // 🧠 Leer tema guardado en el almacenamiento al iniciar la app
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("APP_THEME");
      if (saved) setIsDark(saved === "dark");
    })();
  }, []);

  // 🌓 Alternar tema globalmente
  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem("APP_THEME", newTheme ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 👇 Hook para usarlo fácilmente en cualquier pantalla
export const useTheme = () => useContext(ThemeContext);

// Dentro de ThemeContext.jsx, después de export const useTheme...
export const useThemeColors = () => {
  const { isDark } = useTheme();
  return {
    background: isDark ? "#0f1115" : "#f5f7fb",
    card: isDark ? "#0f131a" : "#ffffff",
    border: isDark ? "#1a2230" : "#eef1f4",
    textPrimary: isDark ? "#ffffff" : "#1f3a5f",
    textSecondary: isDark ? "#a0aec0" : "#6b7a90",
    accent: "#144985",
    chartLine: isDark ? "rgba(150,200,255,1)" : "#144985",
  };
};
