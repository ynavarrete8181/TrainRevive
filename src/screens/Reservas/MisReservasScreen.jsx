// src/screens/Reservas/MisReservasScreen.jsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../services/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import QRCode from "react-native-qrcode-svg";
import { useTheme, useThemeColors } from "../../context/ThemeContext";

const PRIMARY_COLOR = "#144985";

const MisReservasScreen = () => {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);

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

      if (Array.isArray(data)) {
        const ordenadas = data.sort((a, b) => {
          const fechaA = new Date(a.tg_fecha);
          const fechaB = new Date(b.tg_fecha);
          if (fechaA.getTime() !== fechaB.getTime()) return fechaB - fechaA;
          const horaA = a.tg_hora ? a.tg_hora.slice(0, 5) : "00:00";
          const horaB = b.tg_hora ? b.tg_hora.slice(0, 5) : "00:00";
          return horaA.localeCompare(horaB);
        });
        setReservas(ordenadas);
      } else setReservas([]);
    } catch (error) {
      console.error("❌ Error al obtener reservas:", error);
      Alert.alert("Error", "No se pudieron cargar tus reservas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReservas();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservas(true);
  };

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

  const handleShowQR = async (turno) => {
    const usuario_id = await AsyncStorage.getItem("USER_ID");
    const urlQR = `https://dbanu.uleam.edu.ec/bienestar/confirmar-asistencia?id_turno=${turno.tg_id}&usuario_id=${usuario_id}&fecha=${turno.tg_fecha}`;
    setQrData(urlQR);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const estadoNombre = item.estado_nombre || "Pendiente";
    const estado = estadoNombre.toLowerCase();
    const color =
      estado.includes("atendido")
        ? "#2e7d32"
        : estado.includes("reservado")
        ? "#f9a825"
        : estado.includes("cancelado")
        ? "#d32f2f"
        : colors.accent;

    const cardContent = (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: color,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Icon
              name="dumbbell"
              size={18}
              color={isDark ? "#9ad1ff" : colors.accent}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {item.ts_nombre || "Servicio"}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{estadoNombre}</Text>
          </View>
        </View>

        {item.ts_descripcion && (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {item.ts_descripcion}
          </Text>
        )}

        <View style={styles.infoRow}>
          <Icon
            name="calendar-outline"
            size={17}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {" "}
            {formatFecha(item.tg_fecha)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={17} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {" "}
            {item.tg_hora || "—"}
          </Text>
        </View>
      </View>
    );

    return estado.includes("reservado") ? (
      <TouchableOpacity onPress={() => handleShowQR(item)}>
        {cardContent}
      </TouchableOpacity>
    ) : (
      cardContent
    );
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando tus reservas...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

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
              name="calendar-check-outline"
              size={18}
              color={isDark ? "#9ad1ff" : colors.accent}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Mis Reservas
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Consulta tus turnos registrados y su estado.
        </Text>
      </View>

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
              colors={[colors.accent]}
              tintColor={colors.accent}
              title="Actualizando..."
              titleColor={colors.textSecondary}
            />
          }
        />
      ) : (
        <View style={styles.emptyBox}>
          <Icon name="calendar-remove-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No tienes reservas registradas.
          </Text>
        </View>
      )}

      {/* 📱 Modal QR */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.accent }]}>
              Código de Asistencia
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Muestra este código al ingresar para registrar tu asistencia
            </Text>
            {qrData && (
              <View style={{ marginVertical: 20 }}>
                <QRCode
                  value={JSON.stringify(qrData)}
                  size={220}
                  color={colors.accent}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MisReservasScreen;

/* 🎨 Estilos */
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
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { marginTop: 4, marginBottom: 10, fontSize: 13.5, lineHeight: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  infoText: { fontSize: 13.5, marginLeft: 5 },
  badge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    width: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalSubtitle: { fontSize: 14, textAlign: "center", marginTop: 5 },
  closeBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeText: { color: "#fff", fontWeight: "bold" },
});
