import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

console.log("🌐 API_BASE_URL:", API_BASE_URL);

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("ACCESS_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    if (response?.status === 401) {
      await AsyncStorage.removeItem("ACCESS_TOKEN");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
