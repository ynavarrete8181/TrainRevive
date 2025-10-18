import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const TopBar = ({ navigation }) => {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo institucional */}
        <Image
          source={require("../../assets/LOGO-blanco-1024x312.png")}
          style={styles.logo}
        />

        {/* Icono perfil */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Perfil")}
          activeOpacity={0.8}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={44} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#144985", // azul institucional
  },
  container: {
    backgroundColor: "#144985",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 70, // 🔹 altura fija
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === "ios" ? 4 : 0, // 🔹 evita que iOS corte el ícono
  },
  logo: {
    width: 185,
    height: "100%", // 🔹 ajusta al alto de la barra
    resizeMode: "contain",
    marginLeft: -4,
    marginTop: 5, // ✅ sin empuje innecesario
    marginBottom:5,
  },
  profileButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
});
