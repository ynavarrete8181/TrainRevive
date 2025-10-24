import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { config as microsoftConfig } from "../config/ConfigMicrosoft";
import axiosClient from "../../screens/services/apiClient";

const LoginMicrosoft = ({ navigation, setIsLoggedIn, route }) => {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");

  const discovery =
    AuthSession.useAutoDiscovery(microsoftConfig.authority) ||
    microsoftConfig.fallback;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: microsoftConfig.clientId,
      scopes: microsoftConfig.scopes,
      redirectUri: microsoftConfig.redirectUri,
      usePKCE: true,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    discovery
  );

  /** 🔑 Procesar el código devuelto por Microsoft y continuar el login */
  const handleAuthCode = async (code) => {
    try {
      setLoading(true);
      setPhase("Verificando credenciales...");

      const savedVerifier = await AsyncStorage.getItem("CODE_VERIFIER");
      if (!savedVerifier) {
        Alert.alert("Error", "No se encontró el código de verificación. Intenta nuevamente.");
        setLoading(false);
        return;
      }

      // Intercambiar el código por un token de Microsoft
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: microsoftConfig.clientId,
          code,
          redirectUri: microsoftConfig.redirectUri,
          extraParams: {
            code_verifier: savedVerifier,
            grant_type: "authorization_code",
          },
        },
        discovery
      );

      if (!tokenResult?.accessToken) {
        Alert.alert("Error", "No se obtuvo un token válido de Microsoft.");
        setLoading(false);
        return;
      }

      const access_token = tokenResult.accessToken;
      await AsyncStorage.setItem("MS_ACCESS_TOKEN", access_token);

      // 📡 Consultar datos del usuario en Microsoft Graph
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userInfo = await graphResponse.json();

      const email = userInfo.mail || userInfo.userPrincipalName || "";
      const tipo = route?.params?.type || "personal";

      let identificador = "";
      if (tipo === "estudiante") {
        const match = email.match(/^e(\d+)@/i);
        if (match && match[1]) identificador = match[1];
        else {
          Alert.alert("Error", "El correo institucional no tiene el formato esperado (e + cédula).");
          setLoading(false);
          return;
        }
      } else identificador = email;

      // 🚀 Verificar usuario en Laravel
      const { data } = await axiosClient.post("/login-gym", {
        cedula: identificador,
        tipo,
      });

      if (!data?.success || !data.token) {
        Alert.alert(
          "Error al iniciar sesión",
          "Revisa si seleccionaste correctamente el tipo de usuario (Estudiante o Comunidad Universitaria). Si el problema persiste, contacta al administrador."
        );
        setLoading(false);
        return;
      }

      // Guardar tokens y datos
      await AsyncStorage.multiSet([
        ["ACCESS_TOKEN", data.token],
        ["REFRESH_TOKEN", data.refresh_token || ""],
        ["USER_ID", String(data.user.id)],
        ["USER_NAME", data.user.name],
        ["USER_EMAIL", email],
        ["USER_ROL", data.rol],
      ]);

      // 🟢 Ir directo al Home
      if (typeof setIsLoggedIn === "function") setIsLoggedIn(true);
      else navigation.replace("MainTabs");
    } catch (error) {
      console.error("❌ Error durante autenticación:", error);
      Alert.alert(
        "Error al iniciar sesión",
        "Revisa si seleccionaste correctamente el tipo de usuario (Estudiante o Comunidad Universitaria). Si el problema persiste, contacta al administrador."
      );
    } finally {
      setLoading(false);
      setPhase("");
      await AsyncStorage.removeItem("CODE_VERIFIER");
    }
  };

  /** 🎯 Detectar respuesta cuando la app no se cerró */
  useEffect(() => {
    if (response?.type === "success" && response.params?.code) {
      handleAuthCode(response.params.code);
    }
  }, [response]);

  /** 🧭 Detectar deep link manual (solo si la app fue cerrada) */
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (url?.includes("?code=")) {
        const codeMatch = url.match(/code=([^&]+)/);
        if (codeMatch && codeMatch[1]) handleAuthCode(codeMatch[1]);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  /** 🚀 Iniciar flujo de autenticación */
  const iniciarLogin = async () => {
    try {
      if (!request) return;
      if (request.codeVerifier) {
        await AsyncStorage.setItem("CODE_VERIFIER", request.codeVerifier);
      }
      await promptAsync();
    } catch (error) {
      console.error("❌ Error iniciando login:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../../assets/uleam-ico.png")} style={styles.logo} />
      <Text style={styles.title}>Acceso con Microsoft</Text>
      <Text style={styles.subtitle}>Usa tu cuenta institucional ULEAM para continuar</Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        disabled={!request || loading}
        onPress={iniciarLogin}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-microsoft" size={22} color="#fff" />
            <Text style={styles.buttonText}>Iniciar sesión con Microsoft</Text>
          </>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#144985" />
          <Text style={styles.loadingText}>{phase || "Procesando autenticación..."}</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back-outline" size={18} color="#144985" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© Universidad Laica Eloy Alfaro de Manabí</Text>
    </View>
  );
};

export default LoginMicrosoft;

/** 🎨 Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 25,
  },
  logo: { width: 130, height: 130, resizeMode: "contain", marginBottom: 30 },
  title: { fontSize: 24, fontWeight: "700", color: "#144985", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 40 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#144985",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    gap: 8,
    shadowColor: "#144985",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  back: { flexDirection: "row", alignItems: "center", marginTop: 25 },
  backText: { color: "#144985", fontWeight: "600", fontSize: 14, marginLeft: 5 },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  loadingContainer: { marginTop: 25, alignItems: "center" },
  loadingText: { marginTop: 8, color: "#144985", fontSize: 15, fontWeight: "600" },
});
