import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
// import { microsoftConfig } from "../config/ConfigMicrosoft";
import { config as microsoftConfig } from "../config/ConfigMicrosoft";
import axiosClient from "../../screens/services/apiClient";

const LoginMicrosoft = ({ navigation, setIsLoggedIn }) => {
  const [loading, setLoading] = useState(false);

  // Descubrimiento automático de endpoints de Microsoft
  const discovery = AuthSession.useAutoDiscovery(microsoftConfig.authority);

  // Configurar solicitud OAuth2
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: microsoftConfig.clientId,
      scopes: microsoftConfig.scopes,
      redirectUri: microsoftConfig.redirectUri,
    },
    discovery
  );

  // Manejo de respuesta
  useEffect(() => {
  const handleAuth = async () => {
    if (response?.type === "success") {
      setLoading(true);
      const { access_token } = response.params;

      try {
        await AsyncStorage.setItem("MS_ACCESS_TOKEN", access_token);

        // 1️⃣ Obtener datos del usuario desde Graph API
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const userInfo = await graphResponse.json();

        const email = userInfo.mail || userInfo.userPrincipalName || "";
        const name = userInfo.displayName || "Usuario ULEAM";

        console.log("✅ Usuario Microsoft:", userInfo);

        // 2️⃣ Determinar tipo de autenticación (desde route.params)
        const tipo = route?.params?.type || "personal";
        let identificador = "";

        if (tipo === "estudiante") {
          // Extraer la parte numérica después de la 'e' y antes del '@'
          const match = email.match(/^e(\d+)@/i);
          if (match && match[1]) {
            identificador = match[1];
          } else {
            Alert.alert(
              "Error de formato",
              "El correo del estudiante no tiene el formato esperado (e + cédula)."
            );
            setLoading(false);
            return;
          }
        } else {
          // Para personal, usar el correo directamente
          identificador = email;
        }

        // 3️⃣ Llamar a tu API Laravel
        console.log("📡 Enviando a API:", { identificador, tipo });
        const { data } = await axiosClient.post("/login-gym", {
          cedula: identificador,
          tipo,
        });

        if (!data?.success) {
          Alert.alert(
            "Acceso denegado",
            data.message || "No se encontró el usuario en el sistema."
          );
          setLoading(false);
          return;
        }

        // 4️⃣ Guardar sesión local
        await AsyncStorage.multiSet([
          ["ACCESS_TOKEN", data.token],
          ["REFRESH_TOKEN", data.refresh_token],
          ["USER_ID", String(data.user.id)],
          ["USER_NAME", data.user.name],
          ["USER_EMAIL", email],
          ["USER_ROL", data.rol],
        ]);

        // 5️⃣ Continuar
        Alert.alert("Bienvenido", `${name}\n(${data.rol.toUpperCase()})`, [
          {
            text: "Continuar",
            onPress: () => {
              if (typeof setIsLoggedIn === "function") setIsLoggedIn(true);
              else navigation.replace("MainTabs");
            },
          },
        ]);
      } catch (error) {
        console.error("❌ Error autenticación:", error.response?.data || error.message);
        Alert.alert(
          "Error",
          "No se pudo completar el inicio de sesión. Intenta nuevamente."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  handleAuth();
}, [response]);


  return (
    <View style={styles.container}>
      <Image source={require("../../../assets/uleam-ico.png")} style={styles.logo} />
      <Text style={styles.title}>Acceso con Microsoft</Text>
      <Text style={styles.subtitle}>
        Usa tu cuenta institucional ULEAM para continuar
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        disabled={!request || loading}
        onPress={() => promptAsync()}
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

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back-outline" size={18} color="#144985" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        © Universidad Laica Eloy Alfaro de Manabí
      </Text>
    </View>
  );
};

export default LoginMicrosoft;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 25 },
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
  footer: { position: "absolute", bottom: 40, fontSize: 13, color: "#777", textAlign: "center" },
});
