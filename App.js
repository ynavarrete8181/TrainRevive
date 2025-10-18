// ✅ Ignorar o controlar logs de advertencias
import { LogBox } from "react-native";
LogBox.ignoreLogs([]); // Limpia filtros previos
LogBox.ignoreAllLogs(false); // Muestra todos los logs (puedes cambiar a true para ocultarlos)

import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

// 🧩 Pantallas principales
import HomeScreen from "./src/screens/Home/HomeScreen";
import ReservarScreen from "./src/screens/Reservas/ReservarScreen";
import MisReservasScreen from "./src/screens/Reservas/MisReservasScreen";
import PerfilScreen from "./src/screens/Perfil/PerfilScreen";
import TopBar from "./src/components/TopBar";

// 🧩 Pantallas de autenticación
import LoginSelectorScreen from "./src/screens/Auth/LoginSelectorScreen";
import LoginMicrosoftScreen from "./src/screens/Auth/LoginMicrosoftScreen";
import LoginScreen from "./src/screens/Auth/LoginScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ setIsLoggedIn }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation }) => <TopBar navigation={navigation} />,
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === "Inicio") iconName = "home-outline";
          else if (route.name === "Agendar") iconName = "calendar-outline";
          else if (route.name === "MisTurnos") iconName = "list-outline";
          else if (route.name === "Perfil") iconName = "person-outline";
          return <Icon name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: "rgba(20,73,133,1)",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          paddingBottom: 6,
          borderTopWidth: 0.5,
          borderTopColor: "#ddd",
        },
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Agendar" component={ReservarScreen} />
      <Tab.Screen name="MisTurnos" component={MisReservasScreen} />
      <Tab.Screen
        name="Perfil"
        children={(props) => (
          <PerfilScreen {...props} setIsLoggedIn={setIsLoggedIn} />
        )}
      />
    </Tab.Navigator>
  );
}

// ✅ Wrapper para Login normal
const LoginScreenWrapper = (props) => {
  const { route, navigation } = props;
  const setIsLoggedIn = route?.params?.setIsLoggedInRef?.current;
  return <LoginScreen navigation={navigation} setIsLoggedIn={setIsLoggedIn} />;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const setIsLoggedInRef = useRef(setIsLoggedIn);

  useEffect(() => {
    setIsLoggedInRef.current = setIsLoggedIn;
  });

  // 🔐 Verificar token guardado al abrir la app
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token =
          (await AsyncStorage.getItem("ACCESS_TOKEN")) ||
          (await AsyncStorage.getItem("authToken"));
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error("Error verificando token:", error);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  // ⏳ Pantalla de carga mientras se verifica el token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="rgba(20,73,133,1)" />
      </View>
    );
  }

  // 🌐 Navegación principal
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            // ✅ App principal
            <Stack.Screen
              name="MainTabs"
              children={() => <MainTabs setIsLoggedIn={setIsLoggedIn} />}
            />
          ) : (
            // 🔐 Flujo de autenticación
            <>
              <Stack.Screen
                name="LoginSelector"
                component={LoginSelectorScreen}
              />
              <Stack.Screen
                name="LoginMicrosoft"
                component={LoginMicrosoftScreen}
              />
              <Stack.Screen
                name="Login"
                component={LoginScreenWrapper}
                initialParams={{ setIsLoggedInRef }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
