// src/screens/Reservas/ReservarScreen.jsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { Card, Menu } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../services/apiClient";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme, useThemeColors } from "../../context/ThemeContext";

const PRIMARY_COLOR = "#144985";
const SUCCESS_COLOR = "#2e7d32";
const ERROR_COLOR = "#d32f2f";

const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const toLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ReservarScreen = () => {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const [turnos, setTurnos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [date, setDate] = useState(new Date());
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [menuCatVisible, setMenuCatVisible] = useState(false);
  const [menuServVisible, setMenuServVisible] = useState(false);
  const [reservandoId, setReservandoId] = useState(null);
  const [mensajeBloqueo, setMensajeBloqueo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [TipoUsuario, setTipoUsuario] = useState(null);

  const spinValue = new Animated.Value(0);
  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  useFocusEffect(
    useCallback(() => {
      const loadInit = async () => {
        try {
          const tipo = await AsyncStorage.getItem("USER_ROL");
          setTipoUsuario(tipo);
          await fetchCategorias();
        } catch (e) {
          console.log("Error cargando tipo usuario:", e);
        } finally {
          setLoadingGlobal(false);
        }
      };
      loadInit();
    }, [])
  );

  const fetchCategorias = async () => {
    try {
      const token = await AsyncStorage.getItem("ACCESS_TOKEN");
      const { data } = await axiosClient.get("/gym/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategorias(data);
      if (data.length > 0) {
        setSelectedCategoria(data[0]);
        fetchServicios(data[0].cat_id, token);
      }
    } catch (e) {
      console.log("Error categorías:", e);
    }
  };

  const fetchServicios = async (categoriaId, tokenParam = null) => {
    try {
      const token = tokenParam || (await AsyncStorage.getItem("ACCESS_TOKEN"));
      const { data } = await axiosClient.get(`/gym/servicios/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServicios(data);
      if (data.length > 0) {
        setSelectedServicio(data[0]);
        fetchTurnosDisponibles(date, data[0].ts_id, token);
      }
    } catch (e) {
      console.log("Error servicios:", e);
    }
  };

  const fetchTurnosDisponibles = async (fecha, servicioId, tokenParam = null) => {
    setLoadingTurnos(true);
    try {
      const token = tokenParam || (await AsyncStorage.getItem("ACCESS_TOKEN"));
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const usr_tipo = TipoUsuario || (await AsyncStorage.getItem("USER_ROL"));
      const { data } = await axiosClient.get("/gym/turnos", {
        params: {
          fecha: toLocalYMD(fecha),
          servicio_id: servicioId,
          tipo_usuario: usr_tipo,
          usuario_id,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.length > 0 && data[0].mensaje) {
        setMensajeBloqueo(data[0].mensaje);
        setTurnos([]);
        return;
      }

      setMensajeBloqueo(null);
      const ahora = new Date();
      const filtrados = data.filter((t) => new Date(`${t.fecha}T${t.hora_inicio}`) >= ahora);
      setTurnos(filtrados);
    } catch (e) {
      Alert.alert("Error", "No se pudieron obtener los turnos disponibles.");
    } finally {
      setLoadingTurnos(false);
    }
  };

  const handleChangeFecha = (dias) => {
    const nueva = new Date(date);
    nueva.setDate(date.getDate() + dias);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (nueva < hoy) {
      Alert.alert("⚠️ No permitido", "No puedes seleccionar fechas anteriores a hoy.");
      return;
    }
    setDate(nueva);
    if (selectedServicio) fetchTurnosDisponibles(nueva, selectedServicio.ts_id);
  };

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
        Alert.alert("✅ Éxito", "Turno reservado correctamente.");
        fetchTurnosDisponibles(date, selectedServicio?.ts_id);
      } else {
        Alert.alert("⚠️ No se pudo reservar", data.message || "Intenta nuevamente.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setReservandoId(null);
    }
  };

  const formatFecha = (fecha) => {
    const d = new Date(fecha);
    return `${diasSemana[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  };

  if (loadingGlobal) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Icon name="dumbbell" size={70} color={colors.accent} />
        </Animated.View>
        <Text style={[styles.loaderText, { color: colors.accent }]}>
          Cargando datos del gimnasio...
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View
              style={[
                styles.heroBadge,
                { backgroundColor: isDark ? "#132235" : "#eaf2ff" },
              ]}
            >
              <Icon name="calendar-check" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Reservar Turno
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Selecciona categoría, servicio y fecha.
          </Text>
        </View>

        {/* Categorías */}
        <View
          style={[
            styles.group,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.accent }]}>Categoría</Text>
          <Menu
            visible={menuCatVisible}
            onDismiss={() => setMenuCatVisible(false)}
            anchor={
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
                onPress={() => setMenuCatVisible(true)}
              >
                <Text style={[styles.selectorText, { color: colors.textPrimary }]}>
                  {selectedCategoria?.cat_nombre || "Seleccionar categoría"}
                </Text>
                <Icon name="chevron-down" size={22} color={colors.accent} />
              </TouchableOpacity>
            }
          >
            {categorias.map((cat) => (
              <Menu.Item
                key={`cat-${cat.cat_id}`}
                onPress={() => {
                  setSelectedCategoria(cat);
                  setMenuCatVisible(false);
                  fetchServicios(cat.cat_id);
                }}
                title={cat.cat_nombre}
              />
            ))}
          </Menu>

          {/* Servicios */}
          <Text style={[styles.label, { color: colors.accent, marginTop: 15 }]}>
            Servicio
          </Text>
          <Menu
            visible={menuServVisible}
            onDismiss={() => setMenuServVisible(false)}
            anchor={
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
                onPress={() => setMenuServVisible(true)}
              >
                <Text style={[styles.selectorText, { color: colors.textPrimary }]}>
                  {selectedServicio?.ts_nombre || "Seleccionar servicio"}
                </Text>
                <Icon name="chevron-down" size={22} color={colors.accent} />
              </TouchableOpacity>
            }
          >
            {servicios.map((srv) => (
              <Menu.Item
                key={`srv-${srv.ts_id}`}
                onPress={() => {
                  setSelectedServicio(srv);
                  setMenuServVisible(false);
                  fetchTurnosDisponibles(date, srv.ts_id);
                }}
                title={srv.ts_nombre}
              />
            ))}
          </Menu>
        </View>

        {/* Fecha */}
        <View
          style={[
            styles.group,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.accent }]}>Fecha</Text>
          <View
            style={[
              styles.dateNav,
              { borderColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <TouchableOpacity onPress={() => handleChangeFecha(-1)}>
              <Icon name="chevron-left" size={26} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>
              {formatFecha(date)}
            </Text>
            <TouchableOpacity onPress={() => handleChangeFecha(1)}>
              <Icon name="chevron-right" size={26} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Turnos */}
        {loadingTurnos ? (
          <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 20 }} />
        ) : mensajeBloqueo ? (
          <Text style={[styles.mensajeBloqueo, { color: colors.textSecondary }]}>
            ⚠️ {mensajeBloqueo}
          </Text>
        ) : turnos.length === 0 ? (
          <Text style={[styles.noTurnos, { color: colors.textSecondary }]}>
            No hay turnos disponibles.
          </Text>
        ) : (
          turnos.map((t, i) => (
            <Card
              key={`turno-${t.tg_id_horario_gym}-${i}`}
              style={[styles.turnoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Card.Content>
                <View style={styles.turnoHeader}>
                  <Text style={[styles.turnoTitle, { color: colors.textPrimary }]}>
                    {t.servicio_nombre}
                  </Text>
                  <Icon
                    name={t.disponible ? "check-circle" : "close-circle"}
                    color={t.disponible ? SUCCESS_COLOR : ERROR_COLOR}
                    size={20}
                  />
                </View>
                <Text style={[styles.turnoInfo, { color: colors.textSecondary }]}>
                  🕒 {t.hora_inicio} - {t.hora_fin}
                </Text>
                <Text
                  style={[
                    styles.turnoDisponibilidad,
                    { color: t.disponible ? SUCCESS_COLOR : ERROR_COLOR },
                  ]}
                >
                  {t.turnos_disponibles} cupos disponibles
                </Text>
                <TouchableOpacity
                  style={[
                    styles.reservarBtn,
                    {
                      backgroundColor: t.disponible ? colors.accent : "#ccc",
                    },
                  ]}
                  disabled={!t.disponible || reservandoId === t.tg_id_horario_gym}
                  onPress={() => {
                    setTurnoSeleccionado(t);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.reservarText}>
                    {reservandoId === t.tg_id_horario_gym ? "Reservando..." : "Reservar"}
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal confirmación */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Icon name="calendar-check" size={40} color={colors.accent} style={{ alignSelf: "center" }} />
            <Text style={[styles.modalTitle, { color: colors.accent }]}>
              Confirmar Reserva
            </Text>
            {turnoSeleccionado && (
              <>
                <Text style={[styles.modalInfo, { color: colors.textPrimary }]}>
                  Servicio: <Text style={{ fontWeight: "bold" }}>{turnoSeleccionado.servicio_nombre}</Text>
                </Text>
                <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                  Fecha: {formatFecha(turnoSeleccionado.fecha)}
                </Text>
                <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                  Hora: {turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin}
                </Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setModalVisible(false);
                  if (turnoSeleccionado) handleReservar(turnoSeleccionado);
                }}
              >
                <Text style={styles.modalBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ReservarScreen;

/* 🎨 Estilos base (sin colores fijos) */
const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { padding: 16, paddingBottom: 100 },
  hero: { marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 4, fontSize: 13 },
  group: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  selectorButton: {
    borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  selectorText: { fontSize: 15 },
  dateNav: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderRadius: 10, padding: 10,
  },
  dateText: { fontSize: 15, fontWeight: "500" },
  turnoCard: { borderRadius: 14, borderWidth: 1, marginBottom: 14, paddingVertical: 4 },
  turnoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  turnoTitle: { fontSize: 16, fontWeight: "700" },
  turnoInfo: { marginTop: 4, fontSize: 13 },
  turnoDisponibilidad: { marginTop: 2, fontSize: 13, fontWeight: "600" },
  reservarBtn: {
    alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginTop: 8,
  },
  reservarText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  noTurnos: { textAlign: "center", marginTop: 30, fontSize: 15 },
  mensajeBloqueo: { textAlign: "center", fontWeight: "600", fontSize: 15, marginTop: 20, paddingHorizontal: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 14, fontSize: 16, fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { borderRadius: 16, padding: 20, width: "80%", elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  modalInfo: { fontSize: 14, marginTop: 6, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
