import React, { useEffect, useState } from "react";
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
import axiosClient from "../services/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY_COLOR = "#144985";

const diasSemana = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const meses = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const ReservarScreen = () => {
  const [turnos, setTurnos] = useState([]);
  const [categoriaServicios, setCategoriaServicios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date());
  const [reservandoId, setReservandoId] = useState(null); // 🔹 control individual de carga
  const [loading, setLoading] = useState({
    categoria: false,
    servicio: false,
    turnos: false,
  });
  const [menuCategoriaVisible, setMenuCategoriaVisible] = useState(false);
  const [menuServicioVisible, setMenuServicioVisible] = useState(false);

  // 🔹 Al iniciar: carga categorías y muestra turnos del día actual
  useEffect(() => {
    fetchCategorias();
  }, []);

  // 🔹 Formatear fecha legible
  const formatFechaLegible = (fecha) => {
    const d = new Date(fecha);
    const dia = diasSemana[d.getDay()];
    const num = d.getDate();
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${num} de ${
      mes.charAt(0).toUpperCase() + mes.slice(1)
    } de ${anio}`;
  };

  // 🔹 Cargar categorías y servicios iniciales
  const fetchCategorias = async () => {
    setLoading((prev) => ({ ...prev, categoria: true }));
    try {
      const { data } = await axiosClient.get("/get-categoria-servicio");
      setCategoriaServicios(data);

      if (data.length > 0) {
        const primera = data[0];
        setSelectedCategoria(primera);

        const serviciosRes = await axiosClient.get(
          `/get-servicio-categoria-id/${primera.cat_id}`
        );
        setServicios(serviciosRes.data);

        if (serviciosRes.data.length > 0) {
          const servicioInicial = serviciosRes.data[0];
          setSelectedService(servicioInicial);
          fetchTurnos(new Date(), servicioInicial.ts_id);
        }
      }
    } catch (error) {
      alert("Error al cargar categorías");
    } finally {
      setLoading((prev) => ({ ...prev, categoria: false }));
    }
  };

  const handleSelectCategoria = async (categoria) => {
    setSelectedCategoria(categoria);
    setMenuCategoriaVisible(false);
    setLoading((prev) => ({ ...prev, servicio: true }));

    try {
      const { data } = await axiosClient.get(
        `/get-servicio-categoria-id/${categoria.cat_id}`
      );
      setServicios(data);
      if (data.length > 0) {
        setSelectedService(data[0]);
        fetchTurnos(date, data[0].ts_id);
      } else {
        setSelectedService(null);
        setTurnos([]);
      }
    } catch (error) {
      alert("Error al cargar servicios");
    } finally {
      setLoading((prev) => ({ ...prev, servicio: false }));
    }
  };

  const handleChangeFecha = (delta) => {
    const nuevaFecha = new Date(date);
    nuevaFecha.setDate(date.getDate() + delta);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (nuevaFecha < hoy) return;

    setDate(nuevaFecha);
    if (selectedService) {
      fetchTurnos(nuevaFecha, selectedService.ts_id);
    }
  };

  const fetchTurnos = async (fecha, servicioId) => {
    if (!servicioId) return;
    setLoading((prev) => ({ ...prev, turnos: true }));
    try {
      const { data } = await axiosClient.get("/get-generar-turno", {
        params: {
          fecha: fecha.toISOString().split("T")[0],
          servicio_id: servicioId,
          estados_permitidos: [8],
        },
      });
      setTurnos(data);
    } catch (error) {
      alert("Error al cargar turnos");
    } finally {
      setLoading((prev) => ({ ...prev, turnos: false }));
    }
  };

  // 🔹 Confirmación antes de reservar
  const confirmarReserva = (turno) => {
    Alert.alert(
      "Confirmar reserva",
      `¿Deseas reservar este turno?\n\n` +
        `🏋️‍♀️ ${turno.servicio_nombre}\n📅 ${turno.fecha}\n🕒 ${turno.hora_inicio} - ${turno.hora_fin}\n👥 Cupos disponibles: ${turno.turnos_disponibles}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Reservar", onPress: () => handleReservar(turno) },
      ]
    );
  };

  // 🔹 Reservar turno con animación individual
  const handleReservar = async (turno) => {
    setReservandoId(turno.tg_id_horario_gym); // solo este botón muestra loading
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const formData = {
        p_usuario_id: Number(usuario_id),
        p_servicio_id: turno.servicio_id,
        p_horario_gym_id: turno.tg_id_horario_gym,
        p_fecha: turno.fecha,
        p_hora: turno.hora_inicio,
      };
      const { data } = await axiosClient.post("/reservar-turno-gym", formData);
      if (data.success) {
        alert("✅ Turno reservado correctamente");
        fetchTurnos(date, selectedService?.ts_id);
      } else {
        alert(data.message || "No se pudo reservar el turno");
      }
    } catch (error) {
      alert("Error al reservar turno");
    } finally {
      setReservandoId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>🎯 Turnos Disponibles</Text>

        {/* CATEGORÍA */}
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
                  {selectedCategoria
                    ? selectedCategoria.cat_nombre
                    : "Seleccionar categoría"}
                </Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            }
          >
            {loading.categoria ? (
              <ActivityIndicator color={PRIMARY_COLOR} style={{ margin: 10 }} />
            ) : (
              categoriaServicios.map((cat) => (
                <Menu.Item
                  key={cat.cat_id}
                  onPress={() => handleSelectCategoria(cat)}
                  title={cat.cat_nombre}
                />
              ))
            )}
          </Menu>
        </Card>

        {/* SERVICIO */}
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
                  {selectedService
                    ? selectedService.ts_nombre
                    : "Seleccionar servicio"}
                </Text>
                <Icon name="chevron-down" size={22} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            }
          >
            {loading.servicio ? (
              <ActivityIndicator color={PRIMARY_COLOR} style={{ margin: 10 }} />
            ) : (
              servicios.map((s) => (
                <Menu.Item
                  key={s.ts_id}
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

        {/* FECHA CON FLECHAS */}
        <Card style={styles.selectorCard}>
          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateNav}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => handleChangeFecha(-1)}
            >
              <Icon name="chevron-left" size={28} color={PRIMARY_COLOR} />
            </TouchableOpacity>

            <Text style={styles.dateText}>
              {date.toISOString().split("T")[0]}
            </Text>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => handleChangeFecha(1)}
            >
              <Icon name="chevron-right" size={28} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fechaLegible}>
            📅 {formatFechaLegible(date)}
          </Text>
        </Card>

        {/* TURNOS DISPONIBLES */}
        {loading.turnos ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        ) : turnos.length === 0 ? (
          <Text style={styles.noTurnos}>No hay turnos disponibles.</Text>
        ) : (
          turnos.map((t, i) => (
            <Card key={i} style={styles.turnoCard}>
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
                  📅 {t.fecha}  |  🕒 {t.hora_inicio} - {t.hora_fin}
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
    backgroundColor: "#fff",
  },
  selectorText: { fontSize: 15, color: "#333" },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  arrowButton: { padding: 5 },
  dateText: { color: "#333", fontSize: 15, fontWeight: "500" },
  fechaLegible: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#444",
    fontStyle: "italic",
  },
  noTurnos: {
    textAlign: "center",
    color: "#555",
    marginTop: 10,
    fontSize: 14,
  },
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
