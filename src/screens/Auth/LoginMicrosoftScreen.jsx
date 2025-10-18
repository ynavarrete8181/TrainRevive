import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import { config } from "../config/ConfigMicrosoft";

export default function LoginMicrosoftScreen({ navigation, route }) {

  const { type } = route.params;

  /* const handleMicrosoftLogin = async () => {
    try {
      const authUrl = `${config.authority}/oauth2/v2.0/authorize?client_id=${config.appId}&response_type=token&redirect_uri=${config.redirectUri}&scope=${config.scopes.join(" ")}`;
      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === "success") {
        Alert.alert(
          "Inicio de sesión exitoso",
          `Bienvenido a GYM ULEAM (${type})`
        );
      } else {
        Alert.alert("Cancelado", "Inicio de sesión cancelado.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo iniciar sesión con Microsoft.");
    }
  }; */

  const handleMicrosoftLogin = () => {
  navigation.navigate("Login"); // lleva a la vista de LoginScreen
};


  return (
    <View style={styles.container}>
      {/* Logo ULEAM */}
      <Image
        source={require("../../../assets/uleam-ico.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>
        Acceso {type === "estudiante" ? "Estudiantes" : "Personal ULEAM"}
      </Text>

      <Text style={styles.subtitle}>
        Autentícate con tu cuenta institucional de Microsoft
      </Text>

      {/* Botón Microsoft */}
      <TouchableOpacity style={styles.msButton} onPress={handleMicrosoftLogin}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
          }}
          style={styles.msIcon}
        />
        <Text style={styles.msText}>Iniciar sesión con Microsoft</Text>
      </TouchableOpacity>

      {/* Pie de página */}
      <Text style={styles.footer}>© Universidad Laica Eloy Alfaro de Manabí</Text>
    </View>
  );
}

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
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 40,
    textAlign: "center",
    maxWidth: 300,
  },
  msButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  msIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  msText: {
    color: "#144985",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
});
