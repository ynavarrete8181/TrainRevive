import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import axiosClient from "../../screens/services/apiClient"; // ✅ Cliente Axios centralizado

const PRIMARY_COLOR = "rgba(20,73,133,1)";

const PerfilScreen = ({ setIsLoggedIn }) => {
  const [dataUser, setDataUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem("ACCESS_TOKEN");
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        const response = await axiosClient.get("/gym/user-info", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.success) {
          setDataUser(response.data);
        } else {
          throw new Error("No se pudieron cargar los datos del usuario.");
        }
      } catch (error) {
        console.error("❌ Error cargando datos del usuario:", error.response?.status);

        if (error.response?.status === 401) {
          Alert.alert(
            "Sesión expirada",
            "Tu sesión ha caducado. Por favor, inicia sesión nuevamente."
          );
          setIsLoggedIn(false);
        } else if (error.response?.status === 404) {
          Alert.alert(
            "Usuario no encontrado",
            "No se encontraron tus datos en el sistema."
          );
        } else {
          Alert.alert("Error", "Hubo un problema al cargar tu perfil.");
        }
      } finally {
        setLoading(false);
      }
    };

    obtenerDatosUsuario();
  }, []);

  /** 🚪 Cerrar sesión */
  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, salir",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "ACCESS_TOKEN",
            "REFRESH_TOKEN",
            "USER_ID",
            "name",
            "foto_perfil",
          ]);
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  /** ⏳ Pantalla de carga */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ color: "#777", marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  /** 🧩 Datos principales */
  const user = dataUser?.user || dataUser || {};
  const persona = dataUser?.persona || {};
  const detalles = dataUser?.detalles || {};

  return (
    <View style={styles.container}>
      {/* 📸 Perfil */}
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri:
              persona?.imagen ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.nombre}>{user?.name || "Usuario"}</Text>
        <Text style={styles.email}>{user?.email || "Sin correo"}</Text>
        <Text style={styles.tipoUsuario}>
          {dataUser?.tipo_usuario || "Rol desconocido"}
        </Text>
      </View>

      {/* ℹ️ Info adicional */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información adicional</Text>
        {persona?.nombres && (
          <Text style={styles.infoItem}>👤 {persona.nombres}</Text>
        )}
        {persona?.ciudad && (
          <Text style={styles.infoItem}>🏙️ Ciudad: {persona.ciudad}</Text>
        )}
        {persona?.provincia && (
          <Text style={styles.infoItem}>📍 Provincia: {persona.provincia}</Text>
        )}
        {detalles?.carrera && (
          <Text style={styles.infoItem}>🎓 Carrera: {detalles.carrera}</Text>
        )}
        {detalles?.facultad && (
          <Text style={styles.infoItem}>🏛️ Facultad: {detalles.facultad}</Text>
        )}
        {detalles?.campus && (
          <Text style={styles.infoItem}>🏫 Campus: {detalles.campus}</Text>
        )}
      </View>

      {/* ⚙️ Opciones */}
      <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.option}>
          <Icon name="settings-outline" size={22} color={PRIMARY_COLOR} />
          <Text style={styles.optionText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="help-circle-outline" size={22} color={PRIMARY_COLOR} />
          <Text style={styles.optionText}>Ayuda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PerfilScreen;

/* 🎨 Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  nombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  tipoUsuario: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    marginTop: 4,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#f8faff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
  },
  infoContainer: {
    marginTop: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
