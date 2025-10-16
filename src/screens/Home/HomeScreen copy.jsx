import React, { useEffect, useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import axiosClient from "../services/apiClient";

const HomeScreen = () => {
  const [turnos, setTurnos] = useState([]);

  const fetchTurnos = async () => {
    try {
      // Puedes enviar query params si quieres
      const { data } = await axiosClient.get("/get-generar-turno", {
        params: {
          fecha: "2025-09-25",
          servicio_id: 2,
        },
      });

      setTurnos(data);
      // Solo para debug
      Alert.alert("Turnos", JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Turnos Recibidos
      </Text>

      {turnos.length === 0 && <Text>No hay turnos disponibles.</Text>}

      {turnos.map((t, i) => (
        <View
          key={i}
          style={{
            marginBottom: 10,
            padding: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
          }}
        >
          <Text>ID Horario: {t.tg_id_horario_gym}</Text>
          <Text>Servicio: {t.servicio_nombre}</Text>
          <Text>Fecha: {t.fecha}</Text>
          <Text>
            Horario: {t.hora_inicio} - {t.hora_fin}
          </Text>
          <Text>Disponibles: {t.turnos_disponibles}</Text>
          <Text>Disponible: {t.disponible ? "Sí" : "No"}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default HomeScreen;
