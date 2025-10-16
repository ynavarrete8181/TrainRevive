import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Button, Card, IconButton } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import estadisticasData from "../../data/estadisticasGym.json";
import axiosClient from "../services/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY_COLOR = "rgba(20,73,133,1)";

const HomeScreen = ({ navigation }) => {
  const [turnos, setTurnos] = useState([]);
  const [categoriaServicios, setCategoriaServicios] = useState([]);
  const [Servicio, setServicio] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingCategoria, setLoadingCategoria] = useState(false);
  const [loadingServicio, setLoadingServicio] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingTurnos, setLoadingTurnos] = useState(false);

  // 📊 Estados para estadísticas
  const [mesSeleccionado, setMesSeleccionado] = useState("febrero");
  const [estadisticas, setEstadisticas] = useState(null);

  // useEffect(() => {
  //   // fetchCategoriaServicios();
  //   cargarEstadisticas(mesSeleccionado);
  // }, []);

  // // Cargar estadísticas según mes
  // const cargarEstadisticas = (mes) => {
  //   const data = estadisticasData[mes];
  //   setEstadisticas(data);
  // };

  useEffect(() => {
    // fetchCategoriaServicios();
    cargarEstadisticas(mesSeleccionado);
  }, []);

  // Cargar estadísticas según mes
  const cargarEstadisticas = (mes) => {
    const data = estadisticasData[mes];
    setEstadisticas(data);
  };

  // const fetchCategoriaServicios = async () => {
  //   setLoadingCategoria(true);
  //   try {
  //     const { data } = await axiosClient.get("/get-categoria-servicio");
  //     setCategoriaServicios(data);
  //     if (data.length > 0) setSelectedCategoria(data[0].cat_id);
  //   } catch (error) {
  //     Alert.alert("Error", "Error al cargar categorías: " + error.message);
  //   } finally {
  //     setLoadingCategoria(false);
  //   }
  // };

  // const handleServiciosCategoriaId = async (idCategoria) => {
  //   setLoadingServicio(true);
  //   try {
  //     const { data } = await axiosClient.get(`/get-servicio-categoria-id/${idCategoria}`);
  //     setServicio(data);
  //     if (data.length > 0) setSelectedService(data[0].ts_id);
  //     setTurnos([]);
  //   } catch (err) {
  //     Alert.alert("Error", err.response?.data?.error || err.message);
  //   } finally {
  //     setLoadingServicio(false);
  //   }
  // };

  // const fetchTurnos = async (fecha, servicioId) => {
  //   if (!servicioId) return;
  //   setLoadingTurnos(true);
  //   try {
  //     const { data } = await axiosClient.get("/get-generar-turno", {
  //       params: {
  //         fecha: fecha.toISOString().split("T")[0],
  //         servicio_id: servicioId,
  //         estados_permitidos: [8],
  //       },
  //     });
  //     setTurnos(data);
  //   } catch (err) {
  //     Alert.alert("Error", err.response?.data?.error || err.message);
  //   } finally {
  //     setLoadingTurnos(false);
  //   }
  // };

  // const handleReservarTurno = async (t) => {
  //   try {
  //     setLoadingSave(true);
  //     const usuario_id = await AsyncStorage.getItem("USER_ID");
  //     if (!usuario_id) {
  //       Alert.alert("Error", "No se encontró el usuario. Inicia sesión nuevamente.");
  //       return;
  //     }

  //     const FormDataReservaTurno = {
  //       p_usuario_id: Number(usuario_id),
  //       p_servicio_id: t.servicio_id,
  //       p_horario_gym_id: t.tg_id_horario_gym,
  //       p_fecha: t.fecha,
  //       p_hora: t.hora_inicio,
  //     };

  //     const { data } = await axiosClient.post("/reservar-turno-gym", FormDataReservaTurno);
  //     if (data.success) {
  //       Alert.alert("Éxito", "Turno reservado correctamente.");
  //       fetchTurnos(date, selectedService);
  //     } else {
  //       Alert.alert("Atención", data.message || "No se pudo reservar el turno.");
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Ocurrió un error al intentar reservar el turno.");
  //   } finally {
  //     setLoadingSave(false);
  //   }
  // };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>📈 Mis estadísticas</Text>

          {/* Selector de mes */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={mesSeleccionado}
              onValueChange={(itemValue) => {
                setMesSeleccionado(itemValue);
                cargarEstadisticas(itemValue);
              }}
            >
              {Object.keys(estadisticasData).map((mes) => (
                <Picker.Item key={mes} label={mes.toUpperCase()} value={mes} />
              ))}
            </Picker>
          </View>

          {estadisticas ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{estadisticas.total_reservas}</Text>
                  <Text style={styles.statLabel}>Reservas Totales</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{estadisticas.asistencias}</Text>
                  <Text style={styles.statLabel}>Asistencias</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{estadisticas.reservas_activas}</Text>
                  <Text style={styles.statLabel}>Activas</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{estadisticas.canceladas}</Text>
                  <Text style={styles.statLabel}>Canceladas</Text>
                </View>
              </View>

              <LineChart
                data={{
                  labels: estadisticas.grafico_semanal.map((d) => d.dia),
                  datasets: [{ data: estadisticas.grafico_semanal.map((d) => d.asistencias) }],
                }}
                width={320}
                height={180}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#f5f7fa",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: () => PRIMARY_COLOR,
                  labelColor: () => "#555",
                }}
                style={{ marginVertical: 8, borderRadius: 12 }}
              />
            </>
          ) : (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          )}
        </Card>

        {/* Aquí sigue tu sección de turnos, selects, etc. */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
  },
});

export default HomeScreen;
