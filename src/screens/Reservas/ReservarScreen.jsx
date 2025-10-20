import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Card, Menu } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axiosClient from "../services/apiClient";
import { useFocusEffect } from "@react-navigation/native";

const PRIMARY_COLOR = "#144985";

const diasSemana = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** ✅ Fecha local YYYY-MM-DD (sin UTC) */
const toLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ReservarScreen = () => {
  const [turnos, setTurnos] = useState([]);
  const [categoriaServicios, setCategoriaServicios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date());
  const [reservandoId, setReservandoId] = useState(null);
  const [loading, setLoading] = useState({
    categoria: false,
    servicio: false,
    turnos: false,
  });
  const [menuCategoriaVisible, setMenuCategoriaVisible] = useState(false);
  const [menuServicioVisible, setMenuServicioVisible] = useState(false);

  /** ♻️ Refrescar token antes de cargar categorías */
  const refreshToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem("REFRESH_TOKEN");
      if (!refresh) return;

      const { data } = await axiosClient.post(
        "/refresh-token",
        {},
        { headers: { Authorization: `Bearer ${refresh}` } }
      );

      const newAccessToken = data?.access_token || data?.token || data?.accessToken;
      if (newAccessToken) {
        await AsyncStorage.setItem("ACCESS_TOKEN", newAccessToken);
        if (data.refresh_token) {
          await AsyncStorage.setItem("REFRESH_TOKEN", data.refresh_token);
        }
      }
    } catch (error) {
      console.error("❌ Error al renovar token:", error);
    }
  };

  /** 🧭 Cada vez que la pantalla gana foco, actualiza tokens y datos */
  useFocusEffect(
    useCallback(() => {
      const refreshAndFetch = async () => {
        await refreshToken();
        await fetchCategorias();
      };
      refreshAndFetch();
    }, [])
  );

  const formatFechaLegible = (fecha) => {
    const d = new Date(fecha);
    const dia = diasSemana[d.getDay()];
    const num = d.getDate();
    const mes = meses[d.getMonth()];
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${num} de ${
      mes.charAt(0).toUpperCase() + mes.slice(1)
    } de ${d.getFullYear()}`;
  };

  /** 📦 Cargar categorías */
  const fetchCategorias = async () => {
    setLoading((p) => ({ ...p, categoria: true }));
    try {
      const token = await AsyncStorage.getItem("ACCESS_TOKEN");
      const { data } = await axiosClient.get("/gym/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategoriaServicios(data);
      if (data.length > 0) {
        const primera = data[0];
        setSelectedCategoria(primera);
        await fetchServicios(primera.cat_id, token);
      }
    } catch (e) {
      console.error("❌ Error al cargar categorías:", e.response?.data || e);
    } finally {
      setLoading((p) => ({ ...p, categoria: false }));
    }
  };

  /** ⚙️ Cargar servicios de una categoría */
  const fetchServicios = async (categoriaId, tokenParam = null) => {
    setLoading((p) => ({ ...p, servicio: true }));
    try {
      const token = tokenParam || (await AsyncStorage.getItem("ACCESS_TOKEN"));
      const { data } = await axiosClient.get(`/gym/servicios/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setServicios(data);
      if (data.length > 0) {
        const servicioInicial = data[0];
        setSelectedService(servicioInicial);
        await fetchTurnos(new Date(), servicioInicial.ts_id, token);
      }
    } catch (e) {
      console.error("❌ Error al cargar servicios:", e.response?.data || e);
    } finally {
      setLoading((p) => ({ ...p, servicio: false }));
    }
  };

  /** 🕒 Cargar turnos disponibles */
  const fetchTurnos = async (fecha, servicioId, tokenParam = null) => {
    if (!servicioId) return;
    setLoading((p) => ({ ...p, turnos: true }));

    try {
      const token = tokenParam || (await AsyncStorage.getItem("ACCESS_TOKEN"));
      const fechaYMD = toLocalYMD(fecha); // ✅ LOCAL
      const { data } = await axiosClient.get("/gym/turnos", {
        params: { fecha: fechaYMD, servicio_id: servicioId },
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🔹 Si la fecha es hoy, filtrar turnos pasados
      const ahora = new Date();
      const esHoy = toLocalYMD(fecha) === toLocalYMD(ahora);

      const turnosFiltrados = esHoy
        ? data.filter((t) => {
            const [hora, minuto] = t.hora_inicio.split(":").map(Number);
            const horaTurno = new Date(fecha);
            horaTurno.setHours(hora, minuto, 0, 0);
            return horaTurno >= ahora;
          })
        : data;

      setTurnos(turnosFiltrados);
    } catch (e) {
      console.error("❌ Error al cargar turnos:", e.response?.data || e);
    } finally {
      setLoading((p) => ({ ...p, turnos: false }));
    }
  };

  /** 💾 Confirmar reserva */
  const confirmarReserva = (turno) =>
    Alert.alert(
      "Confirmar reserva",
      `¿Deseas reservar este turno?\n\n🏋️‍♀️ ${turno.servicio_nombre}\n📅 ${turno.fecha}\n🕒 ${turno.hora_inicio} - ${turno.hora_fin}`,
      [
        { text: "Cancelar" },
        { text: "Reservar", onPress: () => handleReservar(turno) },
      ]
    );

  const handleReservar = async (turno) => {
    setReservandoId(turno.tg_id_horario_gym);
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const payload = {
        p_usuario_id: Number(usuario_id),
        p_servicio_id: turno.servicio_id,
        p_horario_gym_id: turno.tg_id_horario_gym,
        p_fecha: turno.fecha,
        p_hora: turno.hora_inicio,
      };

      const { data } = await axiosClient.post("/gym/reservar-turno", payload);

      if (data.success) {
        Alert.alert("✅ Turno reservado correctamente");
        fetchTurnos(date, selectedService?.ts_id);
      } else {
        const detalle = data?.detalle || data?.message;
        if (detalle?.includes("uq_usuario_slot")) {
          Alert.alert(
            "⚠️ Ya tienes una reserva",
            "No puedes reservar el mismo turno más de una vez."
          );
        } else {
          Alert.alert("Error", detalle || "No se pudo reservar el turno.");
        }
      }
    } catch (e) {
      const detalle = e?.response?.data?.detalle || e?.message;
      if (detalle?.includes("uq_usuario_slot")) {
        Alert.alert("⚠️ Ya tienes una reserva", "Ya existe una reserva activa para ese horario.");
      } else if (e.response?.status === 500) {
        Alert.alert("Error interno", "Hubo un problema al procesar la reserva. Inténtalo más tarde.");
      } else {
        Alert.alert("Error", detalle || "No se pudo completar la reserva.");
      }
      console.warn("⚠️ Error al reservar turno:", detalle);
    } finally {
      setReservandoId(null);
    }
  };

  /** ⏪⏩ Navegación de fechas con bloqueo de días anteriores */
  const handleChangeFecha = (dias) => {
    const nuevaFecha = new Date(date);
    nuevaFecha.setDate(date.getDate() + dias);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (nuevaFecha < hoy) {
      Alert.alert("⚠️ Fecha inválida", "No puedes seleccionar días anteriores a hoy.");
      return;
    }

    setDate(nuevaFecha);
    if (selectedService) fetchTurnos(nuevaFecha, selectedService.ts_id);
  };

  // ============================================================
  // 📱 INTERFAZ
  // ============================================================
  const esHoy = toLocalYMD(date) === toLocalYMD(new Date());

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>🎯 Turnos Disponibles</Text>

        {/* Categorías */}
        <Card style={styles.selectorCard}>
          <Text style={styles.label}>Categoría</Text>
          <Menu
            visible={menuCategoriaVisible}
            onDismiss={() => setMenuCategoriaVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setMenuCategoriaVisible(true)}
              >
                <Text style={styles.selectorText}>
                  {selectedCategoria?.cat_nombre || "Seleccionar categoría"}
                </Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            }
          >
            {loading.categoria ? (
              <ActivityIndicator color={PRIMARY_COLOR} style={{ margin: 10 }} />
            ) : (
              categoriaServicios.map((cat, index) => (
                <Menu.Item
                  key={`${cat.cat_id}-${index}`}
                  onPress={() => {
                    setSelectedCategoria(cat);
                    setMenuCategoriaVisible(false);
                    fetchServicios(cat.cat_id);
                  }}
                  title={cat.cat_nombre}
                />
              ))
            )}
          </Menu>
        </Card>

        {/* Servicios */}
        <Card style={styles.selectorCard}>
          <Text style={styles.label}>Servicio</Text>
          <Menu
            visible={menuServicioVisible}
            onDismiss={() => setMenuServicioVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() =>
                  servicios.length > 0 && setMenuServicioVisible(true)
                }
              >
                <Text style={styles.selectorText}>
                  {selectedService?.ts_nombre || "Seleccionar servicio"}
                </Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            }
          >
            {loading.servicio ? (
              <ActivityIndicator color={PRIMARY_COLOR} style={{ margin: 10 }} />
            ) : (
              servicios.map((s, index) => (
                <Menu.Item
                  key={`${s.ts_id}-${index}`}
                  onPress={() => {
                    setSelectedService(s);
                    setMenuServicioVisible(false);
                    fetchTurnos(date, s.ts_id);
                  }}
                  title={s.ts_nombre}
                />
              ))
            )}
          </Menu>
        </Card>

        {/* Fecha */}
        <Card style={styles.selectorCard}>
          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateNav}>
            <TouchableOpacity
              disabled={esHoy}
              onPress={() => !esHoy && handleChangeFecha(-1)}
            >
              <Icon
                name="chevron-left"
                size={28}
                color={esHoy ? "#ccc" : PRIMARY_COLOR}
              />
            </TouchableOpacity>
            {/* ✅ Mostrar fecha local consistente */}
            <Text style={styles.dateText}>{toLocalYMD(date)}</Text>
            <TouchableOpacity onPress={() => handleChangeFecha(1)}>
              <Icon name="chevron-right" size={28} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fechaLegible}>📅 {formatFechaLegible(date)}</Text>
        </Card>

        {/* Turnos */}
        {loading.turnos ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        ) : turnos.length === 0 ? (
          <Text style={styles.noTurnos}>No hay turnos disponibles.</Text>
        ) : (
          turnos.map((t, index) => (
            <Card key={`${t.tg_id_horario_gym || index}-${index}`} style={styles.turnoCard}>
              <Card.Content>
                <View style={styles.turnoHeader}>
                  <Text style={styles.turnoTitle}>{t.servicio_nombre}</Text>
                  <Icon
                    name={t.disponible ? "check-circle" : "close-circle"}
                    size={22}
                    color={t.disponible ? "#2e7d32" : "#d32f2f"}
                  />
                </View>
                <Text style={styles.turnoInfo}>
                  📅 {t.fecha} | 🕒 {t.hora_inicio} - {t.hora_fin}
                </Text>
                <Text
                  style={[
                    styles.turnoDisponibilidad,
                    { color: t.disponible ? "#2e7d32" : "#d32f2f" },
                  ]}
                >
                  {t.disponible
                    ? `${t.turnos_disponibles} cupos disponibles`
                    : "No disponible"}
                </Text>
                <Button
                  mode="outlined"
                  icon="calendar-check"
                  onPress={() => confirmarReserva(t)}
                  disabled={!t.disponible || reservandoId === t.tg_id_horario_gym}
                  style={styles.reservarButton}
                  textColor="#2e7d32"
                >
                  {reservandoId === t.tg_id_horario_gym
                    ? "Reservando..."
                    : "Reservar Turno"}
                </Button>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ReservarScreen;

/* 🎨 Estilos */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 20,
  },
  selectorCard: {
    marginBottom: 15,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", color: PRIMARY_COLOR, marginBottom: 6 },
  selectorButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: { fontSize: 15, color: "#333" },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateText: { color: "#333", fontSize: 15, fontWeight: "500" },
  fechaLegible: { textAlign: "center", marginTop: 8, fontSize: 14, color: "#444" },
  noTurnos: { textAlign: "center", color: "#555", marginTop: 10, fontSize: 14 },
  turnoCard: {
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 3,
    paddingHorizontal: 10,
  },
  turnoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  turnoTitle: { fontWeight: "700", fontSize: 16, color: PRIMARY_COLOR },
  turnoInfo: { color: "#444", marginVertical: 6, fontSize: 13 },
  turnoDisponibilidad: { fontWeight: "600", marginBottom: 8, fontSize: 13 },
  reservarButton: { borderRadius: 8, borderColor: "#2e7d32" },
});
