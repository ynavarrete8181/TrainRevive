import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../services/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY_COLOR = "rgba(20,73,133,1)";

const MisReservasScreen = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  /** 📦 Cargar reservas del usuario */
  const fetchReservas = async () => {
    setLoading(true);
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

      setReservas(data || []);
    } catch (error) {
      console.error("❌ Error al obtener reservas:", error);
      Alert.alert("Error", "No se pudieron cargar tus reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

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

  /** 🔹 Renderizar tarjeta de reserva */
  const renderItem = ({ item }) => {
    const estadoColor =
      item.estado_nombre?.toLowerCase().includes("atendido")
        ? "#2e7d32"
        : item.estado_nombre?.toLowerCase().includes("separado")
        ? "#f9a825"
        : item.estado_nombre?.toLowerCase().includes("cancelado")
        ? "#d32f2f"
        : PRIMARY_COLOR;

    return (
      <View style={styles.card}>
        {/* Encabezado */}
        <View style={styles.cardHeader}>
          <Text style={styles.titulo}>{item.ts_nombre || "Servicio"}</Text>
          {item.estado_nombre && (
            <View style={[styles.badge, { backgroundColor: estadoColor }]}>
              <Text style={styles.badgeText}>{item.estado_nombre}</Text>
            </View>
          )}
        </View>

        {/* Descripción */}
        {item.ts_descripcion && (
          <Text style={styles.descripcion}>{item.ts_descripcion}</Text>
        )}

        {/* Fecha */}
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={18} color="#444" />
          <Text style={styles.detalle}> {formatFecha(item.tg_fecha)}</Text>
        </View>

        {/* Hora */}
        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={18} color="#444" />
          <Text style={styles.detalle}>
            {" "}
            {item.tg_hora
              ? `${item.tg_hora.slice(0, 5)}`
              : item.tg_hora_apertura || "—"}
          </Text>
        </View>

        {/* Servicio */}
        <View style={styles.infoRow}>
          <Icon name="dumbbell" size={18} color="#444" />
          <Text style={styles.detalle}> {item.ts_descripcion || "—"}</Text>
        </View>
      </View>
    );
  };

  /** 🔹 Cargando */
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  /** 🔹 Render principal */
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏋️‍♂️ Historial de Reservas</Text>

      {reservas.length > 0 ? (
        <FlatList
          data={reservas}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.tg_id}-${index}`}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      ) : (
        <Text style={styles.noData}>No tienes reservas registradas.</Text>
      )}
    </View>
  );
};

export default MisReservasScreen;

/* 🎨 Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: PRIMARY_COLOR,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  descripcion: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  detalle: {
    fontSize: 14,
    color: "#444",
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  noData: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
    fontSize: 16,
  },
});
