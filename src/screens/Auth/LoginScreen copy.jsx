import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../services/apiClient";

const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.post("/login", credentials);

      if (response.data.message === "El usuario no está activo.") {
        Alert.alert("Usuario inactivo", "Comuníquese con el administrador.");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("ACCESS_TOKEN", response.data.token);
      await AsyncStorage.setItem("authToken", response.data.token);
      Alert.alert("Éxito", "Inicio de sesión exitoso");
      navigation.replace("Home");
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Inténtalo de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={credentials.email}
        onChangeText={(text) =>
          setCredentials({ ...credentials, email: text })
        }
      />

      <View style={styles.passwordContainer}>
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
          style={styles.showBtn}
        >
          <Text style={{ color: "#144985" }}>
            {showPassword ? "Ocultar" : "Ver"}
          </Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, fontWeight: "bold", color: "#144985", textAlign: "center", marginBottom: 40 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15, backgroundColor: "#fff" },
  passwordContainer: { flexDirection: "row", alignItems: "center" },
  showBtn: { marginLeft: 10 },
  button: { backgroundColor: "#144985", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
