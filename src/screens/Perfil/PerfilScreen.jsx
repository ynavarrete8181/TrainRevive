// src/screens/perfil/PerfilScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../../screens/services/apiClient";

const PRIMARY_COLOR = "#144985";

const PerfilScreen = ({ setIsLoggedIn }) => {
  const [dataUser, setDataUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false); // 🌙 modo oscuro local

  // 🔹 Cargar datos del usuario
  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem("ACCESS_TOKEN");
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        const response = await axiosClient.get("/gym/user-info", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.success) {
          setDataUser(response.data);
        } else {
          throw new Error("No se pudieron cargar los datos del usuario.");
        }
      } catch (error) {
        console.error("❌ Error cargando datos del usuario:", error);
        Alert.alert("Sesión expirada", "Tu sesión ha caducado. Inicia sesión nuevamente.");
        await AsyncStorage.clear();
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatosUsuario();
  }, []);

  /** 🚪 Cerrar sesión */
  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, salir",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "ACCESS_TOKEN",
            "REFRESH_TOKEN",
            "USER_ID",
            "name",
            "foto_perfil",
          ]);
          setIsLoggedIn(false); // 👈 Aquí se hace el cambio global
        },
      },
    ]);
  };

  /** ⏳ Pantalla de carga */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ color: "#777", marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  /** 🧩 Datos principales */
  const user = dataUser?.user || {};
  const persona = dataUser?.persona || {};
  const detalles = dataUser?.detalles || {};

  const correo =
    user?.email || dataUser?.email || persona?.correo || "Sin correo";

  return (
    <View
      style={[
        styles.safeArea,
        isDark && { backgroundColor: "#0f1115" },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f1115" : "#ffffff"}
      />

      {/* Header */}
      <View style={[styles.hero, isDark ? styles.heroDark : styles.heroLight]}>
        <View style={styles.heroRow}>
          <View
            style={[styles.heroBadge, isDark && styles.heroBadgeDark]}
          >
            <Icon
              name="account-circle-outline"
              size={20}
              color={isDark ? "#9ad1ff" : "#144985"}
            />
          </View>
          <Text
            style={[styles.title, isDark ? styles.textWhite : styles.textDarkInk]}
          >
            Mi Perfil
          </Text>
        </View>
        <Text
          style={[styles.subtitle, isDark ? styles.textSoftDark : styles.textSoft]}
        >
          Información de tu cuenta y preferencias.
        </Text>
      </View>

      {/* Contenido */}
      <ScrollView
        style={[styles.scroll, isDark && { backgroundColor: "#0f1115" }]}
        contentContainerStyle={styles.container}
      >
        {/* Grupo: Datos personales */}
        <View
          style={[
            styles.group,
            isDark ? styles.groupDark : styles.groupLight,
          ]}
        >
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri:
                  persona?.imagen ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={styles.profileImage}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[
                  styles.profileName,
                  isDark ? styles.textWhite : styles.textDarkInk,
                ]}
              >
                {user?.name || persona?.nombres || "Usuario"}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  isDark ? styles.textSoftDark : styles.textSoft,
                ]}
              >
                {correo}
              </Text>
              <Text
                style={[
                  styles.profileRole,
                  { color: isDark ? "#a5d6a7" : "#2e7d32" },
                ]}
              >
                {dataUser?.tipo_usuario || "Rol desconocido"}
              </Text>
            </View>
          </View>
        </View>

        {/* Grupo: Información adicional */}
        <View
          style={[
            styles.group,
            isDark ? styles.groupDark : styles.groupLight,
          ]}
        >
          <View style={styles.groupHeader}>
            <View style={[styles.groupIcon, isDark && styles.groupIconDark]}>
              <Icon
                name="information-outline"
                size={16}
                color={isDark ? "#9ad1ff" : "#144985"}
              />
            </View>
            <Text
              style={[
                styles.groupTitle,
                isDark ? styles.textWhite : styles.textDarkInk,
              ]}
            >
              Información adicional
            </Text>
          </View>

          {persona?.ciudad && (
            <Text
              style={[
                styles.infoItem,
                isDark ? styles.textSoftDark : styles.textSoft,
              ]}
            >
              🏙️ Ciudad: {persona.ciudad}
            </Text>
          )}
          {detalles?.carrera && (
            <Text
              style={[
                styles.infoItem,
                isDark ? styles.textSoftDark : styles.textSoft,
              ]}
            >
              🎓 Carrera: {detalles.carrera}
            </Text>
          )}
          {detalles?.facultad && (
            <Text
              style={[
                styles.infoItem,
                isDark ? styles.textSoftDark : styles.textSoft,
              ]}
            >
              🏛️ Facultad: {detalles.facultad}
            </Text>
          )}
        </View>

        {/* Grupo: Preferencias */}
        <View
          style={[
            styles.group,
            isDark ? styles.groupDark : styles.groupLight,
          ]}
        >
          <View style={styles.groupHeader}>
            <View style={[styles.groupIcon, isDark && styles.groupIconDark]}>
              <Icon
                name="cog-outline"
                size={16}
                color={isDark ? "#9ad1ff" : "#144985"}
              />
            </View>
            <Text
              style={[
                styles.groupTitle,
                isDark ? styles.textWhite : styles.textDarkInk,
              ]}
            >
              Preferencias
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setIsDark(!isDark)}
          >
            <Icon
              name="weather-night"
              size={18}
              color={isDark ? "#81c784" : "#1f6feb"}
            />
            <Text
              style={[
                styles.settingLabel,
                isDark ? styles.textWhite : styles.textDarkInk,
              ]}
            >
              Modo oscuro
            </Text>
            <Icon
              name={isDark ? "toggle-switch" : "toggle-switch-off-outline"}
              size={30}
              color={isDark ? "#52b788" : "#ccc"}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* Botón Cerrar sesión */}
        <TouchableOpacity
          style={[styles.logoutButton, isDark && styles.logoutButtonDark]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default PerfilScreen;

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  hero: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  heroLight: { backgroundColor: "#ffffff", borderColor: "#eef1f4" },
  heroDark: { backgroundColor: "#0f1115", borderColor: "#171a21" },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(39, 174, 96, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(39, 174, 96, 0.25)",
    marginRight: 10,
  },
  heroBadgeDark: {
    backgroundColor: "rgba(165, 214, 167, 0.12)",
    borderColor: "rgba(165, 214, 167, 0.25)",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#1f3a5f" },
  subtitle: { marginTop: 6, fontSize: 13 },
  scroll: { flex: 1 },
  container: { padding: 16 },

  group: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  groupLight: { backgroundColor: "#ffffff", borderColor: "#eef1f4" },
  groupDark: { backgroundColor: "#0f131a", borderColor: "#1a2230" },
  groupHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  groupIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eaf2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  groupIconDark: { backgroundColor: "#132235" },
  groupTitle: { fontSize: 16, fontWeight: "800" },
  infoItem: { fontSize: 14, marginVertical: 2 },

  profileHeader: { flexDirection: "row", alignItems: "center" },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 3 },
  profileRole: { fontSize: 13, marginTop: 5, fontWeight: "600" },

  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  settingLabel: { fontSize: 15, fontWeight: "600", marginLeft: 10 },

  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutButtonDark: { backgroundColor: "#1f6feb" },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
  textWhite: { color: "#ffffff" },
  textDarkInk: { color: "#1f3a5f" },
  textSoft: { color: "#6b7a90" },
  textSoftDark: { color: "#a0aec0" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
