import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LoginSelectorScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logo ULEAM */}
      <Image
        source={require("../../../assets/uleam-ico.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>
        Selecciona tu tipo de usuario para continuar
      </Text>

      {/* Íconos minimalistas */}
      <View style={styles.iconRow}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() =>
            navigation.navigate("LoginMicrosoft", { type: "estudiante" })
          }
        >
          <Ionicons name="school-outline" size={50} color="#144985" />
          <Text style={styles.iconLabel}>Estudiante</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() =>
            navigation.navigate("LoginMicrosoft", { type: "personal" })
          }
        >
          <Ionicons name="people-outline" size={50} color="#c62828" />
          <Text style={styles.iconLabel}>Comunidad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
    fontSize: 15,
    color: "#555",
    marginBottom: 50,
    textAlign: "center",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    alignItems: "center",
  },
  iconLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginTop: 8,
  },
});
