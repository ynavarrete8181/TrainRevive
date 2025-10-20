// services/apiClient.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * 🌐 Base URL dinámica:
 * Lee desde app.json → extra.apiUrl o .env → EXPO_PUBLIC_API_URL
 */
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://servicesdbanu.uleam.edu.ec/dbanuproduccion";

console.log("API_BASE_URL:", API_BASE_URL);

/**
 * 🧩 Cliente Axios principal
 */
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * 🧠 Interceptor de solicitud:
 * Inserta el token de acceso en cada request si existe.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("ACCESS_TOKEN");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🔁 Interceptor de respuesta:
 * Si hay un 401, intenta renovar el token usando el refresh_token.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detectar 401 sin reintento previo
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("REFRESH_TOKEN");
        if (!refreshToken) {
          console.warn("⚠️ No hay refresh token, cerrando sesión...");
          await AsyncStorage.multiRemove(["ACCESS_TOKEN", "REFRESH_TOKEN"]);
          throw error;
        }

        console.log("♻️ Renovando token automáticamente...");

        const { data } = await axios.post(
          `${API_BASE_URL}/api/refresh-token`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const newAccessToken =
          data?.access_token || data?.token || data?.accessToken;
        if (!newAccessToken) {
          console.warn("⚠️ Respuesta inválida al renovar token:", data);
          throw error;
        }

        // Guardar nuevos tokens
        await AsyncStorage.setItem("ACCESS_TOKEN", newAccessToken);
        if (data.refresh_token) {
          await AsyncStorage.setItem("REFRESH_TOKEN", data.refresh_token);
        }

        console.log("✅ Token renovado correctamente");

        // Reintentar la solicitud original
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("❌ Error al renovar token:", refreshError);
        await AsyncStorage.multiRemove(["ACCESS_TOKEN", "REFRESH_TOKEN"]);
        throw refreshError;
      }
    }

    // Manejo general de errores
    if (!error.response) {
      console.error("🚫 Error de conexión o timeout:", error.message);
    } else {
      console.warn(
        `⚠️ Error ${error.response.status}:`,
        error.response.data || "Sin detalles"
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
