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

const PRIMARY_COLOR = "#144985";
const screenWidth = Dimensions.get("window").width - 40;

const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const HomeScreen = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState("enero");
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  /** 📆 Lista de los últimos 5 años */
  const aniosDisponibles = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  const renderMes = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.mesItem,
        mesSeleccionado === item && styles.mesItemActivo,
        isDark && styles.mesItemDark,
      ]}
      onPress={() => setMesSeleccionado(item)}
    >
      <Text
        style={[
          styles.mesTexto,
          mesSeleccionado === item && styles.mesTextoActivo,
          isDark && styles.textSoftDark,
        ]}
      >
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderAnio = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.anioItem,
        anioSeleccionado === item && styles.anioItemActivo,
        isDark && styles.anioItemDark,
      ]}
      onPress={() => setAnioSeleccionado(item)}
    >
      <Text
        style={[
          styles.anioTexto,
          anioSeleccionado === item && styles.anioTextoActivo,
          isDark && styles.textSoftDark,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, isDark && { backgroundColor: "#0f1115" }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f1115" : "#ffffff"}
      />

      {/* 🔹 Header */}
      <View style={[styles.hero, isDark ? styles.heroDark : styles.heroLight]}>
        <View style={styles.heroRow}>
          <View style={[styles.heroBadge, isDark && styles.heroBadgeDark]}>
            <Icon
              name="chart-line"
              size={18}
              color={isDark ? "#9ad1ff" : PRIMARY_COLOR}
            />
          </View>
          <Text
            style={[styles.title, isDark ? styles.textWhite : styles.textDarkInk]}
          >
            Panel de Actividad
          </Text>
        </View>
        <Text
          style={[styles.subtitle, isDark ? styles.textSoftDark : styles.textSoft]}
        >
          Consulta tus estadísticas mensuales y anuales.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 🔹 Selector de Año */}
        <View style={styles.selectorContainer}>
          <Text
            style={[
              styles.sectionTitle,
              isDark ? styles.textWhite : styles.textDarkInk,
            ]}
          >
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

        {/* 🔹 Selector de Mes */}
        <View style={styles.selectorContainer}>
          <Text
            style={[
              styles.sectionTitle,
              isDark ? styles.textWhite : styles.textDarkInk,
            ]}
          >
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

        {/* 🔹 Estadísticas */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                isDark ? styles.textWhite : styles.textDarkInk,
              ]}
            >
              📈 Mis estadísticas
            </Text>
            <TouchableOpacity onPress={() => setIsDark(!isDark)}>
              <Icon
                name={isDark ? "weather-sunny" : "weather-night"}
                size={20}
                color={isDark ? "#fdd835" : PRIMARY_COLOR}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
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
                  <View key={i} style={styles.statBox}>
                    <Text
                      style={[
                        styles.statNumber,
                        isDark ? styles.textWhite : { color: PRIMARY_COLOR },
                      ]}
                    >
                      {item.value}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        isDark ? styles.textSoftDark : styles.textSoft,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gráfico semanal */}
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
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: () =>
                      isDark ? "rgba(150,200,255,1)" : PRIMARY_COLOR,
                    labelColor: () => (isDark ? "#a0aec0" : "#444"),
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: PRIMARY_COLOR,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: "",
                      stroke: isDark ? "#1f2937" : "#e0e6ef",
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            </>
          ) : (
            <Text
              style={[
                styles.noData,
                isDark ? styles.textSoftDark : styles.textSoft,
              ]}
            >
              No hay datos disponibles.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

/* 🎨 Estilos refinados */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: { padding: 16, paddingBottom: 80 },

  /* HEADER */
  hero: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  heroLight: { backgroundColor: "#ffffff", borderColor: "#eef1f4" },
  heroDark: { backgroundColor: "#0f1115", borderColor: "#171a21" },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(39, 174, 96, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(39, 174, 96, 0.25)",
    marginRight: 10,
  },
  heroBadgeDark: {
    backgroundColor: "rgba(165, 214, 167, 0.12)",
    borderColor: "rgba(165, 214, 167, 0.25)",
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 13 },

  /* SELECTORES */
  selectorContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  mesLista: { paddingVertical: 5 },
  mesItem: {
    backgroundColor: "#e6ebf2",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 5,
  },
  mesItemActivo: { backgroundColor: PRIMARY_COLOR },
  mesItemDark: { backgroundColor: "#1a2230" },
  mesTexto: { fontSize: 14, color: "#144985aa", fontWeight: "500" },
  mesTextoActivo: { color: "#fff", fontWeight: "700" },

  anioLista: { paddingVertical: 5 },
  anioItem: {
    backgroundColor: "#dce4ef",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginHorizontal: 5,
  },
  anioItemActivo: { backgroundColor: PRIMARY_COLOR },
  anioItemDark: { backgroundColor: "#1a2230" },
  anioTexto: { fontSize: 15, color: "#144985aa", fontWeight: "600" },
  anioTextoActivo: { color: "#fff", fontWeight: "700" },

  /* CARD */
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  cardLight: { backgroundColor: "#ffffff", borderColor: "#eef1f4" },
  cardDark: { backgroundColor: "#0f131a", borderColor: "#1a2230" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },

  /* STATS GRID */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#f9fafc",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  statNumber: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 13, textAlign: "center" },

  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 6,
    marginTop: 6,
  },
  chart: { borderRadius: 12, alignSelf: "center" },

  noData: { textAlign: "center", fontSize: 14, marginTop: 16 },

  /* TEXTOS */
  textWhite: { color: "#ffffff" },
  textDarkInk: { color: "#1f3a5f" },
  textSoft: { color: "#6b7a90" },
  textSoftDark: { color: "#a0aec0" },
});
