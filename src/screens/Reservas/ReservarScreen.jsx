// src/screens/ReservarScreen.jsx
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

const PRIMARY_COLOR = "#144985";
const SUCCESS_COLOR = "#2e7d32";
const ERROR_COLOR = "#d32f2f";
const BG_COLOR = "#f5f7fb";

const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const toLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ReservarScreen = () => {
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
  const [tieneTurnoDia, setTieneTurnoDia] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const [TipoUsuario, setTipoUsuario] = useState(null);

  // Animación ícono cargando
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
          console.log("🔹 Tipo de usuario cargado:", tipo);
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

  // useFocusEffect(
  //   useCallback(() => {
  //     const loadInit = async () => {
  //       await fetchCategorias();
  //       setLoadingGlobal(false);
  //     };
  //     loadInit();
  //   }, [])
  // );

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
        verificarTurnoYMostrar(date, data[0].ts_id, token);
      }
    } catch (e) {
      console.log("Error servicios:", e);
    }
  };

  /** 🔍 Verifica si ya tiene turno en la fecha seleccionada antes de cargar turnos */
  const verificarTurnoYMostrar = async (fecha, servicioId, tokenParam = null) => {
    setLoadingTurnos(true);
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const token = tokenParam || (await AsyncStorage.getItem("ACCESS_TOKEN"));
      const { data: misTurnos } = await axiosClient.get(`/gym/turnos-usuario/${usuario_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const yaTiene = misTurnos.some(
        (r) => new Date(r.tg_fecha).toDateString() === new Date(fecha).toDateString()
      );

      setTieneTurnoDia(yaTiene);
      if (yaTiene) {
        setTurnos([]);
        return;
      }

      // Si no tiene turno, mostrar los disponibles
      const fechaYMD = toLocalYMD(fecha);
      const usr_tipo = TipoUsuario || (await AsyncStorage.getItem("USER_ROL"));

      console.log("Tipo usuario:", usr_tipo);

      // if (!usr_tipo) {
      //   console.log("⏳ Esperando tipo_usuario antes de verificar turnos...");
      //   return;
      // }

      const { data } = await axiosClient.get("/gym/turnos", {
        params: {
          fecha: fechaYMD,
          servicio_id: servicioId,
          tipo_usuario: usr_tipo
        },
        headers: { Authorization: `Bearer ${token}` },
      });


      // Filtrar turnos de hora actual hacia adelante
      const ahora = new Date();
      const filtrados = data.filter((t) => {
        const fechaTurno = new Date(`${t.fecha}T${t.hora_inicio}`);
        return fechaTurno >= ahora;
      });

      setTurnos(filtrados);
    } catch (e) {
      console.log("Error al verificar/mostrar turnos:", e);
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
    if (selectedServicio) verificarTurnoYMostrar(nueva, selectedServicio.ts_id);
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
        p_hora: turno.hora_inicio
      };

      console.log("Payload reserva:", payload);
      const { data } = await axiosClient.post("/gym/reservar-turno", payload);
      if (data.success) {
        Alert.alert("Éxito", "Turno reservado correctamente.");
        verificarTurnoYMostrar(date, selectedServicio?.ts_id);
      } else {
        Alert.alert("No se pudo reservar", data.message || "Intenta nuevamente.");
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

  // Loader inicial
  if (loadingGlobal) {
    return (
      <View style={styles.loaderContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Icon name="dumbbell" size={70} color={PRIMARY_COLOR} />
        </Animated.View>
        <Text style={styles.loaderText}>Cargando datos del gimnasio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroBadge}>
              <Icon name="calendar-check" size={18} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.title}>Reservar Turno</Text>
          </View>
          <Text style={styles.subtitle}>Selecciona categoría, servicio y fecha.</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Categoría</Text>
          <Menu
            visible={menuCatVisible}
            onDismiss={() => setMenuCatVisible(false)}
            anchor={
              <TouchableOpacity style={styles.selectorButton} onPress={() => setMenuCatVisible(true)}>
                <Text style={styles.selectorText}>{selectedCategoria?.cat_nombre || "Seleccionar categoría"}</Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
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

          <Text style={[styles.label, { marginTop: 15 }]}>Servicio</Text>
          <Menu
            visible={menuServVisible}
            onDismiss={() => setMenuServVisible(false)}
            anchor={
              <TouchableOpacity style={styles.selectorButton} onPress={() => setMenuServVisible(true)}>
                <Text style={styles.selectorText}>{selectedServicio?.ts_nombre || "Seleccionar servicio"}</Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            }
          >
            {servicios.map((srv) => (
              <Menu.Item
                key={`srv-${srv.ts_id}`}
                onPress={() => {
                  setSelectedServicio(srv);
                  setMenuServVisible(false);
                  verificarTurnoYMostrar(date, srv.ts_id);
                }}
                title={srv.ts_nombre}
              />
            ))}
          </Menu>
        </View>

        {/* Fecha */}
        <View style={styles.group}>
          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => handleChangeFecha(-1)}>
              <Icon name="chevron-left" size={26} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatFecha(date)}</Text>
            <TouchableOpacity onPress={() => handleChangeFecha(1)}>
              <Icon name="chevron-right" size={26} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        {loadingTurnos ? (
          <ActivityIndicator color={PRIMARY_COLOR} size="large" style={{ marginTop: 20 }} />
        ) : tieneTurnoDia ? (
          <Text style={styles.mensajeBloqueo}>
            ⚠️ Ya tienes un turno reservado para este día.
            Podrás reservar nuevamente en fechas posteriores.
          </Text>
        ) : turnos.length === 0 ? (
          <Text style={styles.noTurnos}>No hay turnos disponibles.</Text>
        ) : (
          turnos.map((t, i) => (
            <Card key={`turno-${t.tg_id_horario_gym}-${i}`} style={styles.turnoCard}>
              <Card.Content>
                <View style={styles.turnoHeader}>
                  <Text style={styles.turnoTitle}>{t.servicio_nombre}</Text>
                  <Icon
                    name={t.disponible ? "check-circle" : "close-circle"}
                    color={t.disponible ? SUCCESS_COLOR : ERROR_COLOR}
                    size={20}
                  />
                </View>
                <Text style={styles.turnoInfo}>🕒 {t.hora_inicio} - {t.hora_fin}</Text>
                <Text style={[styles.turnoDisponibilidad, { color: t.disponible ? SUCCESS_COLOR : ERROR_COLOR }]}>
                  {t.turnos_disponibles} cupos disponibles
                </Text>
                <TouchableOpacity
                  style={[styles.reservarBtn, !t.disponible && { backgroundColor: "#ccc" }]}
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
          <View style={styles.modalContainer}>
            <Icon name="calendar-check" size={40} color={PRIMARY_COLOR} style={{ alignSelf: "center" }} />
            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
            {turnoSeleccionado && (
              <>
                <Text style={styles.modalInfo}>
                  Servicio: <Text style={{ fontWeight: "bold" }}>{turnoSeleccionado.servicio_nombre}</Text>
                </Text>
                <Text style={styles.modalInfo}>Fecha: {formatFecha(turnoSeleccionado.fecha)}</Text>
                <Text style={styles.modalInfo}>Hora: {turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin}</Text>
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
                style={[styles.modalBtn, { backgroundColor: PRIMARY_COLOR }]}
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

/* 🎨 Estilos */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { padding: 16, paddingBottom: 100 },
  hero: { marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(20,73,133,0.12)",
    borderWidth: 1,
    borderColor: "rgba(20,73,133,0.25)",
    marginRight: 10,
  },
  title: { fontSize: 22, fontWeight: "800", color: PRIMARY_COLOR },
  subtitle: { marginTop: 4, fontSize: 13, color: "#6b7a90" },
  group: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef1f4",
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "700", color: PRIMARY_COLOR, marginBottom: 6 },
  selectorButton: {
    borderWidth: 1,
    borderColor: "#dcdfe5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fbfcfe",
  },
  selectorText: { fontSize: 15, color: "#333" },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcdfe5",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fbfcfe",
  },
  dateText: { fontSize: 15, color: "#333", fontWeight: "500" },
  turnoCard: {
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eef1f4",
    paddingVertical: 4,
  },
  turnoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  turnoTitle: { fontSize: 16, fontWeight: "700", color: PRIMARY_COLOR },
  turnoInfo: { marginTop: 4, fontSize: 13, color: "#555" },
  turnoDisponibilidad: { marginTop: 2, fontSize: 13, fontWeight: "600" },
  reservarBtn: {
    alignSelf: "flex-end",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  reservarText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  noTurnos: { textAlign: "center", color: "#777", marginTop: 30, fontSize: 15 },
  mensajeBloqueo: {
    textAlign: "center",
    color: "#d35400",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loaderText: { color: PRIMARY_COLOR, marginTop: 14, fontSize: 16, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: PRIMARY_COLOR,
    marginVertical: 10,
  },
  modalInfo: { fontSize: 14, color: "#333", marginTop: 6, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
