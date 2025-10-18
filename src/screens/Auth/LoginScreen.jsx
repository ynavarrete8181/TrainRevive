import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import axiosClient from "../services/apiClient";

const LoginScreen = ({ navigation, setIsLoggedIn }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.post("/login", credentials);

      if (response.data.message === "El usuario no está activo.") {
        Alert.alert("Usuario inactivo", "Comuníquese con el administrador.");
        return;
      }

      await AsyncStorage.setItem("ACCESS_TOKEN", response.data.token);
      await AsyncStorage.setItem("USER_ID", String(response.data.id));
      await AsyncStorage.setItem("foto_perfil", String(response.data.foto_perfil));
      await AsyncStorage.setItem("name", String(response.data.name));

      console.log("Login exitoso:", response.data);
      setIsLoggedIn(true);
    } catch (error) {
      console.log("Error completo:", error);
      let errorMsg = "Inténtalo de nuevo";
      if (error.response) {
        errorMsg = `Backend: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg = `Red/Network: ${error.message}`;
      }
      Alert.alert("Error al iniciar sesión", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Logo institucional */}
      <Image
        source={require("../../../assets/uleam-ico.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Inicio de Sesión</Text>
      <Text style={styles.subtitle}>Ingresa tus credenciales institucionales</Text>

      {/* Campo de correo */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-circle-outline" size={22} color="#888" style={styles.iconLeft} />
        <TextInput
          style={styles.input}
          placeholder="Correo institucional"
          autoCapitalize="none"
          keyboardType="email-address"
          value={credentials.email}
          onChangeText={(text) =>
            setCredentials({ ...credentials, email: text })
          }
        />
      </View>

      {/* Campo de contraseña */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.iconLeft} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={credentials.password}
          onChangeText={(text) =>
            setCredentials({ ...credentials, password: text })
          }
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.iconRightBtn}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={22}
            color="#144985"
          />
        </TouchableOpacity>
      </View>

      {/* Botón principal */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {/* Pie institucional */}
      <Text style={styles.footer}>
        © Universidad Laica Eloy Alfaro de Manabí
      </Text>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: "contain",
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#144985",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  iconLeft: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  iconRightBtn: {
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: "#144985",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 25,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
});
