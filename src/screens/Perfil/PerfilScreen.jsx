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
import { useTheme, useThemeColors } from "../../context/ThemeContext"; // ✅ Tema global

const PRIMARY_COLOR = "#144985";

const PerfilScreen = ({ setIsLoggedIn }) => {
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();

  const [dataUser, setDataUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha caducado. Inicia sesión nuevamente."
        );
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
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  /** ⏳ Pantalla de carga */
  if (loading) {
    return (
      <View
        style={[
          styles.loader,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Cargando perfil...
        </Text>
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
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.heroRow}>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: isDark ? "#132235" : "#eaf2ff" },
            ]}
          >
            <Icon
              name="account-circle-outline"
              size={20}
              color={isDark ? "#9ad1ff" : PRIMARY_COLOR}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Mi Perfil
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Información de tu cuenta y preferencias.
        </Text>
      </View>

      {/* Contenido */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
      >
        {/* Grupo: Datos personales */}
        <View
          style={[
            styles.group,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri:
                  persona?.imagen ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={[styles.profileImage, { borderColor: colors.accent }]}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[styles.profileName, { color: colors.textPrimary }]}
              >
                {user?.name || persona?.nombres || "Usuario"}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
              >
                {correo}
              </Text>
              <Text
                style={[
                  styles.profileRole,
                  { color: isDark ? "#81c784" : "#2e7d32" },
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
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.groupHeader}>
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: isDark ? "#132235" : "#eaf2ff" },
              ]}
            >
              <Icon
                name="information-outline"
                size={16}
                color={isDark ? "#9ad1ff" : colors.accent}
              />
            </View>
            <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>
              Información adicional
            </Text>
          </View>

          {persona?.ciudad && (
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
              🏙️ Ciudad: {persona.ciudad}
            </Text>
          )}
          {detalles?.carrera && (
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
              🎓 Carrera: {detalles.carrera}
            </Text>
          )}
          {detalles?.facultad && (
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>
              🏛️ Facultad: {detalles.facultad}
            </Text>
          )}
        </View>

        {/* Grupo: Preferencias */}
        <View
          style={[
            styles.group,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.groupHeader}>
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: isDark ? "#132235" : "#eaf2ff" },
              ]}
            >
              <Icon
                name="cog-outline"
                size={16}
                color={isDark ? "#9ad1ff" : colors.accent}
              />
            </View>
            <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>
              Preferencias
            </Text>
          </View>

          <TouchableOpacity style={styles.settingCard} onPress={toggleTheme}>
            <Icon
              name="weather-night"
              size={18}
              color={isDark ? "#81c784" : colors.accent}
            />
            <Text
              style={[styles.settingLabel, { color: colors.textPrimary }]}
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
          style={[
            styles.logoutButton,
            { backgroundColor: colors.accent },
          ]}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  hero: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 13 },
  container: { padding: 16 },
  group: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  groupHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  groupIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  groupTitle: { fontSize: 16, fontWeight: "800" },
  infoItem: { fontSize: 14, marginVertical: 2 },
  profileHeader: { flexDirection: "row", alignItems: "center" },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
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
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
