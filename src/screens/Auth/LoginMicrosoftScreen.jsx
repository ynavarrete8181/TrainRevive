import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../../screens/services/apiClient";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY_COLOR = "#144985";

export default function LoginMicrosoftScreen({ navigation, route, setIsLoggedIn }) {
  const { type } = route.params;
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);

  // 🎬 Animación giratoria
  const spinValue = new Animated.Value(0);
  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleLogin = async () => {
    if (!cedula.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tu número de cédula.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Enviando datos:", { cedula, tipo: type });

      const { data } = await axiosClient.post("/login-gym", {
        cedula,
        tipo: type,
      });

      if (!data || Object.keys(data).length === 0) {
        Alert.alert(
          "Dato no encontrado",
          "No se encuentra el dato consultado. Verifique que esté correcto y vuelva a intentarlo."
        );
        return;
      }

      if (!data.success) {
        Alert.alert(
          "Acceso denegado",
          data.message ||
            "No se encuentra el dato consultado. Verifique que esté correcto y vuelva a intentarlo."
        );
        return;
      }

      await AsyncStorage.multiSet([
        ["ACCESS_TOKEN", data.token],
        ["REFRESH_TOKEN", data.refresh_token],
        ["USER_ID", String(data.user.id)],
        ["USER_NAME", data.user.name],
        ["USER_EMAIL", data.user.email],
        ["USER_ROL", data.rol],
      ]);

      console.log("✅ Login correcto:", data.user);

      Alert.alert(
        "Bienvenido",
        `${data.user.name}\n(${data.rol.toUpperCase()})`,
        [
          {
            text: "Continuar",
            onPress: () => {
              if (typeof setIsLoggedIn === "function") {
                setIsLoggedIn(true);
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "LoginSelector" }],
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error login:", error.response?.data || error.message);
      const mensajeError =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;

      if (
        error.response?.status === 404 ||
        mensajeError?.includes("no encontrado") ||
        mensajeError?.includes("No existe") ||
        mensajeError?.includes("Logic App")
      ) {
        Alert.alert(
          "Dato no encontrado",
          "No se encuentra el dato consultado. Verifique que esté correcto y vuelva a intentarlo."
        );
      } else {
        const msg =
          mensajeError ||
          "No se pudo conectar al servidor. Inténtelo nuevamente.";
        Alert.alert("Error al iniciar sesión", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {loading ? (
        // 🎬 Pantalla de carga con pesa giratoria
        <View style={styles.loadingOverlay}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="dumbbell" size={90} color={PRIMARY_COLOR} />
          </Animated.View>
          <Text style={styles.loadingText}>
            Validando información, por favor espera...
          </Text>
        </View>
      ) : (
        <>
          <Image
            source={require("../../../assets/uleam-ico.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>
            {type === "estudiante"
              ? "Acceso Estudiantes"
              : "Acceso Personal ULEAM"}
          </Text>

          <Text style={styles.subtitle}>
            Ingresa tu número de cédula para validar tu identidad
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="card-outline"
              size={22}
              color="#888"
              style={styles.iconLeft}
            />
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: 0923256645"
              keyboardType="numeric"
              maxLength={15}
              value={cedula}
              onChangeText={setCedula}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {type === "estudiante"
                ? "Ingresar como Estudiante"
                : "Ingresar como Personal"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="arrow-back-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            © Universidad Laica Eloy Alfaro de Manabí
          </Text>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    marginBottom: 35,
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    marginBottom: 20,
    paddingHorizontal: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconLeft: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  backText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  loadingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
    textAlign: "center",
    width: "80%",
  },
});
