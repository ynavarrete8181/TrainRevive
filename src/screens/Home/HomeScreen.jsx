// src/screens/HomeScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axiosClient from "../services/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, useThemeColors } from "../../context/ThemeContext";

const PRIMARY_COLOR = "#144985";
const screenWidth = Dimensions.get("window").width - 40;

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

const abreviaturas = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const HomeScreen = () => {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  // 📅 Mes y año actual
  const mesActual = meses[new Date().getMonth()];
  const anioActual = new Date().getFullYear();

  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEstadisticas(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado]);

  const cargarEstadisticas = async (mes, anio) => {
    setLoading(true);
    try {
      const usuario_id = await AsyncStorage.getItem("USER_ID");
      const token = await AsyncStorage.getItem("ACCESS_TOKEN");
      const { data } = await axiosClient.get("/gym/estadisticas", {
        params: { usuario_id, anio },
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstadisticas(data[mes]);
    } catch (e) {
      console.error("❌ Error al obtener estadísticas:", e);
    } finally {
      setLoading(false);
    }
  };

  const aniosDisponibles = Array.from({ length: 3 }, (_, i) => anioActual - i);

  // === Botón Mes ===
  const renderMes = ({ item }) => {
    const activo = mesSeleccionado === item;
    return (
      <TouchableOpacity
        style={[
          styles.mesItem,
          activo && {
            backgroundColor: isDark ? "#1e90ff" : PRIMARY_COLOR,
            borderColor: isDark ? "#a4cdff" : PRIMARY_COLOR,
          },
          !activo && {
            backgroundColor: isDark ? "#2a2f3a" : "#e6ebf2",
            borderColor: isDark ? "#3c4049" : "#d0d5dc",
          },
        ]}
        onPress={() => setMesSeleccionado(item)}
      >
        <Text
          style={[
            styles.mesTexto,
            { color: activo ? "#fff" : colors.textSecondary },
          ]}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  // === Botón Año ===
  const renderAnio = ({ item }) => {
    const activo = anioSeleccionado === item;
    return (
      <TouchableOpacity
        style={[
          styles.anioItem,
          activo && {
            backgroundColor: isDark ? "#1e90ff" : PRIMARY_COLOR,
            borderColor: isDark ? "#a4cdff" : PRIMARY_COLOR,
          },
          !activo && {
            backgroundColor: isDark ? "#2a2f3a" : "#dce4ef",
            borderColor: isDark ? "#3c4049" : "#d0d5dc",
          },
        ]}
        onPress={() => setAnioSeleccionado(item)}
      >
        <Text
          style={[
            styles.anioTexto,
            { color: activo ? "#fff" : colors.textSecondary },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  // 🔤 Título dinámico “Mis estadísticas de Nov-2025”
  const mesAbrev = abreviaturas[meses.indexOf(mesSeleccionado)];
  const tituloEstadisticas = `📈 Mis estadísticas de ${mesAbrev}-${anioSeleccionado}`;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.heroRow}>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: isDark ? "#132235" : "#eaf2ff", borderColor: colors.border },
            ]}
          >
            <Icon name="chart-line" size={18} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Panel de Actividad
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Consulta tus estadísticas mensuales y anuales.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Selector Año */}
        <View style={styles.selectorContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📆 Selecciona un año
          </Text>
          <FlatList
            data={aniosDisponibles}
            keyExtractor={(item) => item.toString()}
            renderItem={renderAnio}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.anioLista}
          />
        </View>

        {/* Selector Mes */}
        <View style={styles.selectorContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📅 Selecciona un mes
          </Text>
          <FlatList
            data={meses}
            keyExtractor={(item) => item}
            renderItem={renderMes}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mesLista}
          />
        </View>

        {/* Estadísticas */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {tituloEstadisticas}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : estadisticas ? (
            <>
              {/* Totales */}
              <View style={styles.statsGrid}>
                {[
                  { label: "Reservas Totales", value: estadisticas.total_reservas },
                  { label: "Asistencias", value: estadisticas.asistencias },
                  { label: "Activas", value: estadisticas.reservas_activas },
                  { label: "Canceladas", value: estadisticas.canceladas },
                ].map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                      {item.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gráfico semanal */}
              {estadisticas.grafico_semanal && (
                <View style={styles.chartContainer}>
                  <LineChart
                    data={{
                      labels: estadisticas.grafico_semanal.map((d) => d.dia),
                      datasets: [
                        { data: estadisticas.grafico_semanal.map((d) => d.asistencias) },
                      ],
                    }}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      color: () => colors.chartLine,
                      labelColor: () => colors.textSecondary,
                      propsForBackgroundLines: {
                        strokeDasharray: "",
                        stroke: colors.border,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.noData, { color: colors.textSecondary }]}>
              No hay datos disponibles.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

/* 🎨 Estilos */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: { padding: 16, paddingBottom: 80 },
  hero: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 10,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 13 },
  selectorContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  mesLista: { paddingVertical: 5 },
  mesItem: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  mesTexto: { fontSize: 14, fontWeight: "600" },
  anioLista: { paddingVertical: 5 },
  anioItem: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  anioTexto: { fontSize: 15, fontWeight: "600" },
  card: { borderRadius: 14, padding: 16, borderWidth: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBox: {
    width: "48%",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  statNumber: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 13, textAlign: "center" },
  chartContainer: { borderRadius: 12, overflow: "hidden", paddingVertical: 6, marginTop: 6 },
  chart: { borderRadius: 12, alignSelf: "center" },
  noData: { textAlign: "center", fontSize: 14, marginTop: 16 },
});
