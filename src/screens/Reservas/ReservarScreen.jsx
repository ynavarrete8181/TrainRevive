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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategoriaServicios();
  }, []);

  const fetchCategoriaServicios = async () => {
    setLoadingCategoria(true);
    try {
      const { data } = await axiosClient.get("/get-categoria-servicio");
      setCategoriaServicios(data);
      console.log("data Reservar",data)
      if (data.length > 0) {
        setSelectedCategoria(data[0].cat_id);
      }
    } catch (error) {
      Alert.alert("¡Error!", "Error al cargar categorías: " + error.message);
    } finally {
      setLoadingCategoria(false);
    }
  };

  const handleServiciosCategoriaId = async (idCategoria) => {
    setLoadingServicio(true);
    try {
      const { data } = await axiosClient.get(`/get-servicio-categoria-id/${idCategoria}`);
      setServicio(data);
      if (data.length > 0) setSelectedService(data[0].ts_id);
      setTurnos([]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || err.message);
    } finally {
      setLoadingServicio(false);
    }
  };

  const fetchTurnos = async (fecha, servicioId) => {
    if (!servicioId) return;
    setLoadingTurnos(true);
    try {
      const { data } = await axiosClient.get("/get-generar-turno", {
        params: {
          fecha: fecha.toISOString().split("T")[0],
          servicio_id: servicioId,
          estados_permitidos: [8],
        },
      });
      setTurnos(data);
      console.log(data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || err.message);
    } finally {
      setLoadingTurnos(false);
    }
  };

  const handleReservarTurno = async (t) => {
    try {
      setLoadingSave(true);
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      if (!usuario_id) {
        Alert.alert("Error", "No se encontró el usuario. Inicia sesión nuevamente.");
        return;
      }
      const FormDataReservaTurno = {
        p_usuario_id: Number(usuario_id),
        p_servicio_id: t.servicio_id,
        p_horario_gym_id: t.tg_id_horario_gym,
        p_fecha: t.fecha,
        p_hora: t.hora_inicio,
      };

      const { data } = await axiosClient.post("/reservar-turno-gym", FormDataReservaTurno);

      if (data.success) {
        Alert.alert("Éxito", "Turno reservado correctamente.");
        fetchTurnos(date, selectedService);
      } else {
        Alert.alert("Atención", data.message || "No se pudo reservar el turno.");
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al intentar reservar el turno.");
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        <Text style={styles.title}>Turnos Disponibles</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>Selecciona categoría:</Text>
          <View style={[styles.pickerContainer, loadingCategoria && styles.loadingPicker]}>
            {loadingCategoria ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            ) : (
              <Picker
                selectedValue={selectedCategoria}
                onValueChange={(itemValue) => {
                  setSelectedCategoria(itemValue);
                  handleServiciosCategoriaId(itemValue);
                }}
              >
                {categoriaServicios.map((cat) => (
                  <Picker.Item key={cat.cat_id} label={cat.cat_nombre} value={cat.cat_id} />
                ))}
              </Picker>
            )}
          </View>

          <Text style={styles.label}>Selecciona servicio:</Text>
          <View style={[styles.pickerContainer, loadingServicio && styles.loadingPicker]}>
            {loadingServicio ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            ) : (
              <Picker
                selectedValue={selectedService}
                enabled={Servicio.length > 0}
                onValueChange={(itemValue) => setSelectedService(itemValue)}
              >
                {Servicio.map((tipo) => (
                  <Picker.Item key={tipo.ts_id} label={tipo.ts_nombre} value={tipo.ts_id} />
                ))}
              </Picker>
            )}
          </View>

          <Text style={styles.label}>Selecciona fecha:</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text>{date.toISOString().split("T")[0]}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                  fetchTurnos(selectedDate, selectedService);
                }
              }}
            />
          )}

          <Button
            mode="contained"
            onPress={() => fetchTurnos(date, selectedService)}
            disabled={!selectedService || loadingServicio}
            style={{ marginTop: 10, borderRadius: 8, backgroundColor: PRIMARY_COLOR }}
          >
            {loadingTurnos ? "Cargando..." : "Buscar turnos"}
          </Button>
        </Card>

        {loadingTurnos ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 20 }} />
        ) : turnos.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#555" }}>
            No hay turnos disponibles.
          </Text>
        ) : (
          turnos.map((t, i) => (
            <Card key={i} style={styles.turnoCard} elevation={4}>
              <Card.Content>
                <Text style={styles.turnoTitle}>{t.servicio_nombre}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Fecha:</Text>
                  <Text style={styles.value}>{t.fecha}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Horario:</Text>
                  <Text style={styles.value}>{t.hora_inicio} - {t.hora_fin}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                  style={[
                    styles.disponibleText,
                    { color: t.disponible ? "green" : "red" },
                  ]}
                >
                  {t.disponible ? "Disponible" : "No disponible"}
                </Text>
                  <Text style={styles.value}>{t.turnos_disponibles}</Text>    
                </View>
                
                

                <Pressable
                  disabled={!t.disponible || loadingSave}
                  onPress={() => handleReservarTurno(t)}
                  style={styles.buttonReservar}
                >
                  {loadingSave ? (
                    <ActivityIndicator size="small" color="#2e7d32" />
                  ) : (
                    <IconButton icon="calendar-check" size={20} color="#2e7d32" />
                  )}
                  <Text style={styles.buttonText}>
                    {loadingSave ? "Reservando..." : "Reservar Turno"}
                  </Text>
                </Pressable>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: PRIMARY_COLOR },
  card: { marginBottom: 20, padding: 15, borderRadius: 12, elevation: 3 },
  label: { fontWeight: "bold", marginBottom: 5, color: PRIMARY_COLOR },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 15, backgroundColor: "#fff" },
  loadingPicker: { justifyContent: "center", alignItems: "center", height: 50 },
  dateButton: { padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center", backgroundColor: "#fff" },
  turnoCard: { marginBottom: 15, borderRadius: 12, backgroundColor: "#fff", padding: 12 },
  turnoTitle: { fontWeight: "bold", color: PRIMARY_COLOR, marginBottom: 5, fontSize: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  value: { color: "#333" },
  disponibleText: { marginTop: 6, fontWeight: "bold", fontSize: 14 },
  buttonReservar: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2e7d32", borderRadius: 8, paddingVertical: 10, marginTop: 10 },
  buttonText: { color: "#2e7d32", fontWeight: "bold", marginLeft: 6, fontSize: 14 },
});

export default HomeScreen;
