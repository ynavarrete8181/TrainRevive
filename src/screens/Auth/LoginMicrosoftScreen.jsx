import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../../screens/services/apiClient";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY_COLOR = "#144985";

export default function LoginMicrosoftScreen({ navigation, route, setIsLoggedIn }) {
  const { type } = route.params;


  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!cedula.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tu número de cédula.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Enviando datos:", { cedula, tipo: type });

      const { data } = await axiosClient.post("/login-gym", {
        cedula,
        tipo: type,
      });

      // ⚠️ Si no tiene éxito, mostrar alerta clara
      if (!data.success) {
        Alert.alert(
          "Acceso denegado",
          data.message || "Solo estudiantes matriculados pueden acceder"
        );
        return;
      }

      // ✅ Guardar tokens y datos
      await AsyncStorage.multiSet([
        ["ACCESS_TOKEN", data.token],
        ["REFRESH_TOKEN", data.refresh_token],
        ["USER_ID", String(data.user.id)],
        ["USER_NAME", data.user.name],
        ["USER_EMAIL", data.user.email],
        ["USER_ROL", data.rol],
      ]);

      console.log("✅ Login correcto:", data.user);

      Alert.alert(
        "Bienvenido",
        `${data.user.name}\n(${data.rol.toUpperCase()})`,
        [
          {
            text: "Continuar",
            onPress: () => {
              if (typeof setIsLoggedIn === "function") {
                setIsLoggedIn(true); // 🔥 activa sesión directamente
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "LoginSelector" }],
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error login:", error.response?.data || error.message);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "No se pudo conectar al servidor.";

      Alert.alert("Error al iniciar sesión", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Logo institucional */}
      <Image
        source={require("../../../assets/uleam-ico.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>
        {type === "estudiante"
          ? "Acceso Estudiantes"
          : "Acceso Personal ULEAM"}
      </Text>

      <Text style={styles.subtitle}>
        Ingresa tu número de cédula para validar tu identidad
      </Text>

      {/* Campo de cédula */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="card-outline"
          size={22}
          color="#888"
          style={styles.iconLeft}
        />
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 0923256645"
          keyboardType="numeric"
          maxLength={15}
          value={cedula}
          onChangeText={setCedula}
        />
      </View>

      {/* Botón de login */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {type === "estudiante"
                ? "Ingresar como Estudiante"
                : "Ingresar como Personal"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Botón volver */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back-outline" size={18} color={PRIMARY_COLOR} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        © Universidad Laica Eloy Alfaro de Manabí
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 35,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
    paddingHorizontal: 10,
    width: "100%",
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    gap: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  backText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
});
