import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

const PerfilScreen = ({ navigation }) => {
  const [DataUser, setDataUser] = useState(null);

  useEffect(() => {
    const DataUsuario = async () => {
      const id = await AsyncStorage.getItem("USER_ID");
      const name = await AsyncStorage.getItem("name");
      const foto = await AsyncStorage.getItem("foto_perfil");
      const token = await AsyncStorage.getItem("ACCESS_TOKEN");

      if (id && name) {
        setDataUser({ nombre: name, email: "usuario@ejemplo.com", foto });
      }
    };
    DataUsuario();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: DataUser?.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.nombre}>{DataUser?.nombre || "Usuario"}</Text>
        <Text style={styles.email}>{DataUser?.email || "usuario@ejemplo.com"}</Text>
      </View>

      <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.option}>
          <Icon name="settings-outline" size={22} color="rgba(20,73,133,1)" />
          <Text style={styles.optionText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="help-circle-outline" size={22} color="rgba(20,73,133,1)" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(20,73,133,1)",
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
  infoContainer: {
    marginTop: 20,
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
    backgroundColor: "rgba(20,73,133,1)",
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

export default PerfilScreen;
