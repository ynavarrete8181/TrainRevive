import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  View,
  Alert,
} from "react-native";
import * as Linking from "expo-linking";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";

// 🧩 Componentes principales
import NavBar from "./src/components/NavBar";

// 🧩 Pantallas de autenticación
import LoginSelectorScreen from "./src/screens/Auth/LoginSelectorScreen";
import LoginMicrosoft from "./src/screens/Auth/LoginMicrosoft";
import LoginScreen from "./src/screens/Auth/LoginScreen";
import { ThemeProvider } from "./src/context/ThemeContext";
 
const Stack = createStackNavigator();

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

  // 🧭 Listener de Deep Links
  
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
      <SafeAreaProvider>
        <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
              <Stack.Screen
                name="MainTabs"
                children={() => <NavBar setIsLoggedIn={setIsLoggedIn} />}
              />
            ) : (
              <>
                <Stack.Screen
                  name="LoginSelector"
                  component={LoginSelectorScreen}
                />
                <Stack.Screen
                  name="LoginMicrosoft"
                  children={(props) => (
                    <LoginMicrosoft {...props} setIsLoggedIn={setIsLoggedIn} />
                  )}
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
        </ThemeProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
