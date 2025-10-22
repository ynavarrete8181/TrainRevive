import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../services/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY_COLOR = "#144985";

const MisReservasScreen = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  /** 📦 Cargar reservas del usuario */
  const fetchReservas = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const token = await AsyncStorage.getItem("ACCESS_TOKEN");

      if (!usuario_id || !token) {
        Alert.alert("Sesión expirada", "Inicia sesión nuevamente.");
        return;
      }

      const { data } = await axiosClient.get(`/gym/turnos-usuario/${usuario_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data && Array.isArray(data)) {
        // 🧩 Ordenar: fecha DESC y hora ASC
        const ordenadas = data.sort((a, b) => {
          const fechaA = new Date(a.tg_fecha);
          const fechaB = new Date(b.tg_fecha);

          if (fechaA.getTime() !== fechaB.getTime()) {
            return fechaB - fechaA; // Fecha descendente
          }

          const horaA = a.tg_hora ? a.tg_hora.slice(0, 5) : "00:00";
          const horaB = b.tg_hora ? b.tg_hora.slice(0, 5) : "00:00";
          return horaA.localeCompare(horaB); // Hora ascendente
        });

        setReservas(ordenadas);
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.error("❌ Error al obtener reservas:", error);
      Alert.alert("Error", "No se pudieron cargar tus reservas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  /** 🔄 Refrescar al deslizar hacia abajo */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservas(true);
  };

  /** 🔹 Formatear fecha */
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const f = new Date(fecha);
    return f.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /** 🎨 Render de tarjeta */
  const renderItem = ({ item }) => {
    const estadoNombre = item.estado_nombre || "Pendiente";
    const estado = estadoNombre.toLowerCase();
    const color =
      estado.includes("atendido")
        ? "#2e7d32"
        : estado.includes("separado")
        ? "#f9a825"
        : estado.includes("cancelado")
        ? "#d32f2f"
        : PRIMARY_COLOR;

    return (
      <View
        style={[
          styles.card,
          isDark ? styles.cardDark : styles.cardLight,
          { borderLeftColor: color },
        ]}
      >
        {/* Cabecera */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Icon
              name="dumbbell"
              size={18}
              color={isDark ? "#9ad1ff" : PRIMARY_COLOR}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.cardTitle,
                isDark ? styles.textWhite : styles.textDarkInk,
              ]}
            >
              {item.ts_nombre || "Servicio"}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{estadoNombre}</Text>
          </View>
        </View>

        {/* Descripción */}
        {item.ts_descripcion && (
          <Text
            style={[
              styles.cardDesc,
              isDark ? styles.textSoftDark : styles.textSoft,
            ]}
          >
            {item.ts_descripcion}
          </Text>
        )}

        {/* Datos */}
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={17} color={isDark ? "#a0aec0" : "#555"} />
          <Text style={[styles.infoText, isDark && styles.textSoftDark]}>
            {" "}
            {formatFecha(item.tg_fecha)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={17} color={isDark ? "#a0aec0" : "#555"} />
          <Text style={[styles.infoText, isDark && styles.textSoftDark]}>
            {" "}
            {item.tg_hora || "—"}
          </Text>
        </View>
      </View>
    );
  };

  /** ⏳ Cargando inicial */
  if (loading) {
    return (
      <View
        style={[
          styles.loaderContainer,
          isDark && { backgroundColor: "#0f1115" },
        ]}
      >
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingText, isDark && styles.textSoftDark]}>
          Cargando tus reservas...
        </Text>
      </View>
    );
  }

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
            style={[
              styles.heroBadge,
              isDark && styles.heroBadgeDark,
            ]}
          >
            <Icon
              name="calendar-check-outline"
              size={18}
              color={isDark ? "#9ad1ff" : PRIMARY_COLOR}
            />
          </View>
          <Text
            style={[styles.title, isDark ? styles.textWhite : styles.textDarkInk]}
          >
            Mis Reservas
          </Text>
        </View>
        <Text
          style={[styles.subtitle, isDark ? styles.textSoftDark : styles.textSoft]}
        >
          Consulta tus turnos registrados y su estado.
        </Text>
      </View>

      {/* Contenido principal con pull-to-refresh */}
      {reservas.length > 0 ? (
        <FlatList
          data={reservas}
          renderItem={renderItem}
          keyExtractor={(item, i) => `${item.tg_id}-${i}`}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
              title="Actualizando..."
              titleColor={isDark ? "#fff" : PRIMARY_COLOR}
            />
          }
        />
      ) : (
        <View style={styles.emptyBox}>
          <Icon
            name="calendar-remove-outline"
            size={64}
            color={isDark ? "#6b7280" : "#9e9e9e"}
          />
          <Text
            style={[
              styles.noDataText,
              isDark ? styles.textSoftDark : styles.textSoft,
            ]}
          >
            No tienes reservas registradas.
          </Text>
        </View>
      )}

      {/* Botón modo oscuro */}
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={() => setIsDark(!isDark)}
      >
        <Icon
          name={isDark ? "weather-sunny" : "weather-night"}
          size={20}
          color={isDark ? "#ffcc80" : "#1f6feb"}
        />
        <Text
          style={[
            styles.themeToggleText,
            isDark ? styles.textSoftDark : styles.textDarkInk,
          ]}
        >
          {isDark ? "Modo claro" : "Modo oscuro"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MisReservasScreen;

/* 🎨 Estilos */
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
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 13 },
  container: { padding: 16 },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderLeftWidth: 5,
  },
  cardLight: { backgroundColor: "#ffffff", borderColor: "#eef1f4" },
  cardDark: { backgroundColor: "#0f131a", borderColor: "#1a2230" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitleWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { marginTop: 4, marginBottom: 10, fontSize: 13.5, lineHeight: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  infoText: { fontSize: 13.5, marginLeft: 5 },
  badge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, fontSize: 14 },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  noDataText: { fontSize: 15, marginTop: 10 },
  themeToggle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 12,
  },
  themeToggleText: { marginLeft: 8, fontSize: 14, fontWeight: "600" },
  textWhite: { color: "#ffffff" },
  textDarkInk: { color: "#1f3a5f" },
  textSoft: { color: "#6b7a90" },
  textSoftDark: { color: "#a0aec0" },
});
