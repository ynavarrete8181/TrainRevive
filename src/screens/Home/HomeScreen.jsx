import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { Card } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import estadisticasData from "../../data/estadisticasGym.json";

const PRIMARY_COLOR = "#144985";
const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const screenWidth = Dimensions.get("window").width - 40;

const HomeScreen = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState("marzo");
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEstadisticas(mesSeleccionado);
  }, [mesSeleccionado]);

  const cargarEstadisticas = (mes) => {
    setLoading(true);
    setTimeout(() => {
      setEstadisticas(estadisticasData[mes]);
      setLoading(false);
    }, 400);
  };

  const renderMes = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.mesItem,
        mesSeleccionado === item && styles.mesItemActivo,
      ]}
      onPress={() => setMesSeleccionado(item)}
    >
      <Text
        style={[
          styles.mesTexto,
          mesSeleccionado === item && styles.mesTextoActivo,
        ]}
      >
        {item.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        
        {/* 🔹 Selector horizontal de meses */}
        <View style={styles.selectorContainer}>
          <Text style={styles.sectionTitle}>📅 Selecciona un mes</Text>
          <FlatList
            data={meses}
            keyExtractor={(item) => item}
            renderItem={renderMes}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mesLista}
          />
        </View>

        {/* 🔹 Card de estadísticas */}
        <Card style={styles.statsCard}>
          <View>
            <Text style={styles.statsTitle}>📈 Mis estadísticas</Text>

            {loading ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            ) : estadisticas ? (
              <View>
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
                    datasets: [
                      { data: estadisticas.grafico_semanal.map((d) => d.asistencias) },
                    ],
                  }}
                  width={screenWidth}
                  height={180}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: () => PRIMARY_COLOR,
                    labelColor: () => "#444",
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: PRIMARY_COLOR,
                    },
                  }}
                  style={{ marginTop: 10, borderRadius: 12 }}
                />
              </View>
            ) : (
              <Text style={{ textAlign: "center", color: "#888" }}>
                No hay datos disponibles
              </Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  mesLista: {
    paddingVertical: 5,
  },
  mesItem: {
    backgroundColor: "#e6ebf2",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 5,
  },
  mesItemActivo: {
    backgroundColor: PRIMARY_COLOR,
  },
  mesTexto: {
    fontSize: 14,
    color: "#144985aa",
    fontWeight: "500",
  },
  mesTextoActivo: {
    color: "#fff",
    fontWeight: "700",
  },
  statsCard: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
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
    fontSize: 13,
    color: "#777",
  },
});
