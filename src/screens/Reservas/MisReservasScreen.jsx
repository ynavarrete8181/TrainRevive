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

const MisReservasScreen = () => {
  const [DataTurnosReservados, setDataTurnosReservados] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTurnosReservados = async () => {
    setLoading(true);
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");

      if (!usuario_id) {
        Alert.alert("Error", "No se encontró el usuario. Inicia sesión nuevamente.");
        return;
      }

      const { data } = await axiosClient.get(`/get-turno-gym-user-id/${usuario_id}`);
      console.log("✅ Mis reservas:", data);
      setDataTurnosReservados(data);
    } catch (error) {
      Alert.alert("¡Error!", "Error al cargar información: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnosReservados();
  }, []);

  // 🔹 Formato bonito de fecha
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

  const renderItem = ({ item }) => {
    const estadoColor =
      item.estado_nombre === "Atendido"
        ? "#2e7d32"
        : item.estado_nombre === "Separado"
        ? "#f9a825"
        : "#1976d2";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.titulo}>{item.ts_nombre}</Text>
          {item.estado_nombre && (
            <View style={[styles.badge, { backgroundColor: estadoColor }]}>
              <Text style={styles.badgeText}>{item.estado_nombre}</Text>
            </View>
          )}
        </View>

        {item.ts_descripcion && (
          <Text style={styles.descripcion}>{item.ts_descripcion}</Text>
        )}

        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={18} color="#444" />
          <Text style={styles.detalle}> {formatFecha(item.tg_fecha)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={18} color="#444" />
          <Text style={styles.detalle}>
            {" "}
            {item.tg_hora_apertura || "—"}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="rgba(20,73,133,1)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Turnos</Text>

      {DataTurnosReservados.length > 0 ? (
        <FlatList
          data={DataTurnosReservados}
          renderItem={renderItem}
          keyExtractor={(item) => item.tg_id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noData}>No tienes reservas registradas.</Text>
      )}
    </View>
  );
};

export default MisReservasScreen;

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
    color: "rgba(20,73,133,1)",
    marginBottom: 16,
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
    borderLeftColor: "rgba(20,73,133,1)",
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
    marginTop: 20,
  },
});
